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

  signers = (await ethers.getSigners()).slice(0, 10);

  sigs = await Promise.map(signers, (signer) =>
    signForPassportMint(signer.address)
  );

  await LCOAP.setSigner(signerPublic);

  await CYNQUE.setPassportAddress(LCOAP.address);
  await CYNQUE.setPublicSaleTimes(100000000000, 1000000000000);
  await CYNQUE.setPassportSaleStartTime(0);
});

describe("Tests", function () {
  it("Permission checking cynques", async function () {
    await expect(CYNQUE.connect(signers[1]).setBaseURI("")).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
    await expect(
      CYNQUE.connect(signers[1]).updateRoyalties(signers[1].address, 1000)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Tests max passport minting", async function () {
    await Promise.each(sigs, async (sig, index) => {
      //Mint correctly
      return LCOAP.connect(signers[index]).mintPassport(sig.v, sig.r, sig.s);
    });
  });

  it("Team mints cynques", async function () {
    await CYNQUE.teamMint();

    expect(await CYNQUE.totalSupply()).to.equal(64);
    expect(await CYNQUE.balanceOf(signers[0].address)).to.equal(64);
  });

  it("Team mints cynques but fails", async function () {
    await expect(CYNQUE.teamMint()).to.be.revertedWith("TeamMintAlreadyDone");
  });

  it("Mints cynques with wrong passportIds", async function () {
    await Promise.each(sigs, async (sig, index) => {
      const wallet = await LCOAP.walletOfOwner(signers[index].address);

      await expect(
        CYNQUE.connect(signers[index]).mintCynqueWithPassports(
          parseInt(wallet[0]) + 2 < 10
            ? [parseInt(wallet[0]) + 2]
            : [parseInt(wallet[0]) - 2],
          sendEth("0.2222")
        )
      ).to.be.revertedWith("NotOwnerOfPassport");
    });
  });

  it("Mints cynques with passports", async function () {
    await Promise.each(sigs, async (sig, index) => {
      const wallet = await LCOAP.walletOfOwner(signers[index].address);
      await CYNQUE.connect(signers[index]).mintCynqueWithPassports(
        [wallet[0]],
        sendEth("0.2222")
      );
    });
  });

  it("Mints cynques again with passports but fails", async function () {
    await Promise.each(sigs, async (sig, index) => {
      const wallet = await LCOAP.walletOfOwner(signers[index].address);
      await expect(
        CYNQUE.connect(signers[index]).mintCynqueWithPassports(
          [wallet[0]],
          sendEth("0.2222")
        )
      ).to.be.revertedWith("PassportAlreadyMinted");
    });
  });

  it("Mints cynques without passports and fails", async function () {
    await Promise.each(sigs, async (sig, index) => {
      await expect(
        CYNQUE.connect(signers[index]).mintCynqueWithoutPassport(
          sendEth("0.2222")
        )
      ).to.be.revertedWith("PassportSaleNotLive");
    });
  });

  it("Increase public sale time and mints cynques without passports", async function () {
    await network.provider.send("evm_increaseTime", [100000000000]);
    await network.provider.send("evm_mine");

    await Promise.each(sigs, async (sig, index) => {
      await CYNQUE.connect(signers[index]).mintCynqueWithoutPassport(
        sendEth("0.3333")
      );
      await CYNQUE.connect(signers[index]).mintCynqueWithoutPassport(
        sendEth("0.3333")
      );

      await expect(
         CYNQUE.connect(signers[index]).mintCynqueWithoutPassport(
          sendEth("0.3333")
        )
      ).to.be.revertedWith("MaxMintedOnPublicSale");

      return;
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
      const walletOfOwner = await CYNQUE.walletOfOwner(signer.address);

      if (index == 0) {
        //Owner, minted 64 and then 2 public, 1 passport
        expect(walletOfOwner.length).to.equal(67);
      } else {
        //Not owner, minted 2 public, 1 passport
        expect(walletOfOwner.length).to.equal(3);
      }
    });
  });

  it("Mints rest of cynques by owner", async function () {
    await CYNQUE.communitySweep(1111 - (await CYNQUE.totalSupply()));
    expect(await CYNQUE.totalSupply()).to.equal(1111);
  });

  it("Tests cynqueronize", async function () {
    const walletOne = signers[1];
    const walletTwo = signers[2];

    //Get the first passport of wallet one
    const passportOfWalletOne = (
      await LCOAP.walletOfOwner(walletOne.address)
    )[0];
    //Get the first passport of wallet two
    const passportOfWalletTwo = (
      await LCOAP.walletOfOwner(walletTwo.address)
    )[0];

    //Get the first cynque of wallet one
    const cynqueOfWalletOne = (
      await CYNQUE.walletOfOwner(walletOne.address)
    )[0];
    //Get the first cynque of wallet two
    const cynqueOfWalletTwo = (
      await CYNQUE.walletOfOwner(walletTwo.address)
    )[0];

    //Get the cynque that the passport is synced with
    var passportToCynqueOfWalletOne = await CYNQUE.passportToCynque(
      passportOfWalletOne
    );

    //Get the cynque that the passport is synced with
    var passportToCynqueOfWalletTwo = await CYNQUE.passportToCynque(
      passportOfWalletTwo
    );

    //Ensure the passports are connected to these cynques.
    expect(passportToCynqueOfWalletOne).to.equal(cynqueOfWalletOne);
    expect(passportToCynqueOfWalletTwo).to.equal(cynqueOfWalletTwo);

    //Send cynques between themselves
    await CYNQUE.connect(walletOne).transferFrom(
      walletOne.address,
      walletTwo.address,
      cynqueOfWalletOne
    );
    await CYNQUE.connect(walletTwo).transferFrom(
      walletTwo.address,
      walletOne.address,
      cynqueOfWalletTwo
    );

    //Sync passport to new cynque
    await CYNQUE.connect(walletOne).cynqueronize(
      passportOfWalletOne,
      cynqueOfWalletTwo
    );

    //Sync passport to new cynque
    await CYNQUE.connect(walletTwo).cynqueronize(
      passportOfWalletTwo,
      cynqueOfWalletOne
    );

    //Get the cynque this passport is cynqued with
    var passportToCynqueOfWalletOne = await CYNQUE.passportToCynque(
      passportOfWalletOne
    );
    //Get the cynque this passport is cynqued with
    var passportToCynqueOfWalletTwo = await CYNQUE.passportToCynque(
      passportOfWalletTwo
    );

    //Ensure it was the transferred cynque.
    expect(passportToCynqueOfWalletOne).to.equal(cynqueOfWalletTwo);
    expect(passportToCynqueOfWalletTwo).to.equal(cynqueOfWalletOne);
  });

  it("Royalty test", async function () {
    // Test royalties
    await CYNQUE.updateRoyalties(signers[1].address, 1000);
    const royaltyAmount = await CYNQUE.royaltyInfo(1, 1000);
    expect(royaltyAmount[0]).to.equal(signers[1].address);
    expect(royaltyAmount[1]).to.deep.equal(ethers.BigNumber.from(100));
  });

  it("Withdrawals Ether", async function () {
    await CYNQUE.withdraw();
  });
});
