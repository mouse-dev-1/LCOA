const { ethers, waffle } = require("hardhat");
const { expect } = require("chai");

let _LCOAP;
let LCOAP;
var owner;
var minter1;
var minter2;

var sig1;
var sig2;

//This won't be used in prod so don't try :)
var signerPrivate = "55aba49632a340a4779a5673c7d205bbad301649bc260ff3f1b0e0b7fb06599f";
var signerPublic = "0x59AF6eB470D980C7dfF9e977b87D8FdA92174860";

let signerWallet = new ethers.Wallet(signerPrivate);

const signForPassportMint = async (passportMinter) => {
  let messageHash = ethers.utils.keccak256(passportMinter);

  let messageHashBytes = ethers.utils.arrayify(messageHash);

  const flatSig = await signerWallet.signMessage(messageHashBytes);

  return ethers.utils.splitSignature(flatSig);
};

before(async function () {
  _LCOAP = await ethers.getContractFactory("_2052Passport");
  LCOAP = await _LCOAP.deploy();

  [owner, minter1, minter2] = await ethers.getSigners();

  sig1 = await signForPassportMint(minter1.address);
  sig2 = await signForPassportMint(minter2.address);

  await LCOAP.setSigner(signerPublic);

  //Set times
});

describe("Greeter", function () {

  it("Permission checking", async function () {
    await expect(LCOAP.connect(minter1).setBaseURI("")).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
    await expect(
      LCOAP.connect(minter1).updateRoyalties(minter1.address, 1000)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });


  it("Tests minting", async function () {
    //Mint With wrong sig
    await expect(
      LCOAP.connect(minter1).mintPassport(sig2.v, sig2.r, sig2.s)
    ).to.be.revertedWith("SignatureNotValid()");

    //Mint With wrong sig
    await expect(
      LCOAP.connect(minter2).mintPassport(sig1.v, sig1.r, sig1.s)
    ).to.be.revertedWith("SignatureNotValid()");

    //Mint correctly
    await LCOAP.connect(minter1).mintPassport(sig1.v, sig1.r, sig1.s);

    //Mint correctly
    await LCOAP.connect(minter2).mintPassport(sig2.v, sig2.r, sig2.s);

    expect(await LCOAP.balanceOf(minter1.address)).to.equal(1);

    expect(await LCOAP.balanceOf(minter2.address)).to.equal(1);

    //Mint again
    await expect(
      LCOAP.connect(minter1).mintPassport(sig1.v, sig1.r, sig1.s)
    ).to.be.revertedWith("WalletAlreadyMinted()");

    //Mint again
    await expect(
      LCOAP.connect(minter2).mintPassport(sig2.v, sig2.r, sig2.s)
    ).to.be.revertedWith("WalletAlreadyMinted()");

    //Transfer and attempt to mint again
    await LCOAP.connect(minter2).transferFrom(
      minter2.address,
      minter1.address,
      1
    );
    await expect(
      LCOAP.connect(minter2).mintPassport(sig2.v, sig2.r, sig2.s)
    ).to.be.revertedWith("WalletAlreadyMinted()");

  });

  it("Tests baseURI", async function (){
    expect(await LCOAP.tokenURI(1)).to.equal("1");
    await LCOAP.setBaseURI("http://test.com/");
    expect(await LCOAP.tokenURI(1)).to.equal("http://test.com/1");
  });

  it("Royalty test", async function () {
    // Test royalties
    await LCOAP.updateRoyalties(minter1.address, 1000);
    const royaltyAmount = await LCOAP.royaltyInfo(1, 1000);
    expect(royaltyAmount[0]).to.equal(minter1.address);
    expect(royaltyAmount[1]).to.deep.equal(ethers.BigNumber.from(100));
  });
});
