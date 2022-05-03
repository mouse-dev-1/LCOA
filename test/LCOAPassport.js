const { ethers, waffle } = require("hardhat");
const { expect } = require("chai");
const Promise = require("bluebird");

let _LCOAP;
let LCOAP;

//This won't be used in prod so don't try :)
var signerPrivate =
  "55aba49632a340a4779a5673c7d205bbad301649bc260ff3f1b0e0b7fb06599f";
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

  signers = await ethers.getSigners();

  sigs = await Promise.map(signers, (signer) =>
    signForPassportMint(signer.address)
  );

  await LCOAP.setSigner(signerPublic);

  //Set times
});

describe("Greeter", function () {
  it("Permission checking", async function () {
    await expect(LCOAP.connect(signers[1]).setBaseURI("")).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
    await expect(
      LCOAP.connect(signers[1]).updateRoyalties(signers[1].address, 1000)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Tests minting", async function () {
    //Mint With wrong sig
    await expect(
      LCOAP.connect(signers[1]).mintPassport(sigs[2].v, sigs[2].r, sigs[2].s)
    ).to.be.revertedWith("SignatureNotValid()");

    //Mint With wrong sig
    await expect(
      LCOAP.connect(signers[2]).mintPassport(sigs[1].v, sigs[1].r, sigs[1].s)
    ).to.be.revertedWith("SignatureNotValid()");

    //Mint correctly
    await LCOAP.connect(signers[0]).mintPassport(
      sigs[0].v,
      sigs[0].r,
      sigs[0].s
    );

    //Mint correctly
    await LCOAP.connect(signers[1]).mintPassport(
      sigs[1].v,
      sigs[1].r,
      sigs[1].s
    );

    //Mint correctly
    await LCOAP.connect(signers[2]).mintPassport(
      sigs[2].v,
      sigs[2].r,
      sigs[2].s
    );

    expect(await LCOAP.balanceOf(signers[1].address)).to.equal(1);

    expect(await LCOAP.balanceOf(signers[2].address)).to.equal(1);

    //Mint again
    await expect(
      LCOAP.connect(signers[1]).mintPassport(sigs[1].v, sigs[1].r, sigs[1].s)
    ).to.be.revertedWith("WalletAlreadyMinted()");

    //Mint again
    await expect(
      LCOAP.connect(signers[2]).mintPassport(sigs[2].v, sigs[2].r, sigs[2].s)
    ).to.be.revertedWith("WalletAlreadyMinted()");

    console.log(await LCOAP.ownerOf(3))
    console.log(signers[2].address)

    //Transfer and attempt to mint again
    await LCOAP.connect(signers[2]).transferFrom(
      signers[2].address,
      signers[1].address,
      3
    );

    await expect(
      LCOAP.connect(signers[2]).mintPassport(sigs[2].v, sigs[2].r, sigs[2].s)
    ).to.be.revertedWith("WalletAlreadyMinted()");
  });

  var counter = 0;

  it("Tests max minting", async function () {
    await Promise.each(sigs, async (sig, index) => {
      counter++;
      console.log({ counter, index });

      if (index == 0 || index == 1 || index == 2) {
        //Expect them to have already minted.
        return expect(
          LCOAP.connect(signers[index]).mintPassport(sig.v, sig.r, sig.s)
        ).to.be.revertedWith("WalletAlreadyMinted()");
      }

      if (counter == 2001 || counter == 2002) {
        return expect(
          LCOAP.connect(signers[index]).mintPassport(sig.v, sig.r, sig.s)
        ).to.be.revertedWith("MaxSupplyExceeded()");
      }

      //Mint correctly
      return LCOAP.connect(signers[index]).mintPassport(sig.v, sig.r, sig.s);
    });
  });

  it("Tests baseURI", async function () {
    expect(await LCOAP.tokenURI(1)).to.equal("1");
    await LCOAP.setBaseURI("http://test.com/");
    expect(await LCOAP.tokenURI(1)).to.equal("http://test.com/1");
  });

  it("Royalty test", async function () {
    // Test royalties
    await LCOAP.updateRoyalties(signers[1].address, 1000);
    const royaltyAmount = await LCOAP.royaltyInfo(1, 1000);
    expect(royaltyAmount[0]).to.equal(signers[1].address);
    expect(royaltyAmount[1]).to.deep.equal(ethers.BigNumber.from(100));
  });
});
