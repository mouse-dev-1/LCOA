const { ethers, waffle } = require("hardhat");
const { expect } = require("chai");
const Promise = require("bluebird");

let _LCOAP;
let LCOAP;

let _CYNQUE;
let CYNQUE;

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

const sendEth = (amt) => {
  return { value: ethers.utils.parseEther(amt) };
};

before(async function () {
  _LCOAP = await ethers.getContractFactory("Genesis2052Passport");
  LCOAP = await _LCOAP.deploy();

  _CYNQUE = await ethers.getContractFactory("CYNQUE");
  CYNQUE = await _CYNQUE.deploy();

  signers = await ethers.getSigners();

  sigs = await Promise.map(signers, (signer) =>
    signForPassportMint(signer.address)
  );

  await LCOAP.setSigner(signerPublic);

  await CYNQUE.setPassportAddress(LCOAP.address);
  await CYNQUE.setPublicSaleStartTime(100000000000);
});

describe("Greeter", function () {
  it("Permission checking", async function () {
    await expect(CYNQUE.connect(signers[1]).setBaseURI("")).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
    await expect(
      CYNQUE.connect(signers[1]).updateRoyalties(signers[1].address, 1000)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Tests max minting", async function () {
    await Promise.each(sigs, async (sig, index) => {
      //Mint correctly
      return LCOAP.connect(signers[index]).mintPassport(sig.v, sig.r, sig.s);
    });
  });

  it("Team mints", async function () {
    await CYNQUE.teamMint();

    expect(await CYNQUE.totalSupply()).to.equal(40);
    expect(await CYNQUE.balanceOf(signers[0].address)).to.equal(40);
  });

  it("Team mints but fails", async function () {
    await expect(CYNQUE.teamMint()).to.be.revertedWith(
      "TeamMintAlreadyDone"
    );
  });

  it("Mints cynques with wrong passportIds", async function () {
    await Promise.each(sigs, async (sig, index) => {
      const wallet = await LCOAP.walletOfOwner(signers[index].address);

      await expect(
        CYNQUE.connect(signers[index]).mintCynqueWithPassports(
          parseInt(wallet[0]) + 2 < 10
            ? [parseInt(wallet[0]) + 2]
            : [parseInt(wallet[0]) - 2],
          sendEth("0.22")
        )
      ).to.be.revertedWith("NotOwnerOfPassport");
    });
  });

  it("Mints cynques with passports", async function () {
    await Promise.each(sigs, async (sig, index) => {
      const wallet = await LCOAP.walletOfOwner(signers[index].address);
      await CYNQUE.connect(signers[index]).mintCynqueWithPassports(
        [wallet[0]],
        sendEth("0.22")
      );
    });
  });

  it("Mints cynques again with passports but fails", async function () {
    await Promise.each(sigs, async (sig, index) => {
      const wallet = await LCOAP.walletOfOwner(signers[index].address);
      await expect(
        CYNQUE.connect(signers[index]).mintCynqueWithPassports(
          [wallet[0]],
          sendEth("0.22")
        )
      ).to.be.revertedWith("PassportAlreadyMinted");
    });
  });

  it("Mints cynques without passports and fails", async function () {
    await Promise.each(sigs, async (sig, index) => {
      await expect(
        CYNQUE.connect(signers[index]).mintCynqueWithoutPassport(
          sendEth("0.22")
        )
      ).to.be.revertedWith("PassportSaleNotLive");
    });
  });

  it("Increase public sale time and mints cynques without passports", async function () {
    await network.provider.send("evm_increaseTime", [100000000000]);
    await network.provider.send("evm_mine");

    await Promise.each(sigs, async (sig, index) => {
      CYNQUE.connect(signers[index]).mintCynqueWithoutPassport(sendEth("0.22"));
    });
  });

  it("Tests baseURI", async function () {
    expect(await CYNQUE.tokenURI(1)).to.equal("1");
    await CYNQUE.setBaseURI("https://api.lostchildren.xyz/api/cynque/");
    expect(await CYNQUE.tokenURI(1)).to.equal(
      "https://api.lostchildren.xyz/api/cynque/1"
    );
  });

  it("Tests walletOfOwner", async function () {
    await Promise.each(signers, async (signer, index) => {
      const wallet = await CYNQUE.walletOfOwner(signer.address);

      if (index == 0) {
        //Owner, minted 40 and then 2
        expect(wallet.length).to.equal(42);
      } else {
        //Not owner, minted 2
        expect(wallet.length).to.equal(2);
      }
    });
  });

  it("Royalty test", async function () {
    // Test royalties
    await CYNQUE.updateRoyalties(signers[1].address, 1000);
    const royaltyAmount = await CYNQUE.royaltyInfo(1, 1000);
    expect(royaltyAmount[0]).to.equal(signers[1].address);
    expect(royaltyAmount[1]).to.deep.equal(ethers.BigNumber.from(100));
  });
});
