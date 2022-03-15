const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers, waffle } = require("hardhat");
const {
  createPrivateKeySync,
  ecdsaSign,
} = require("ethereum-cryptography/secp256k1");

let _LCOAP;
let LCOAP;
var owner;
var minter2;
var minter3;

var signerPrivate =
  "55aba49632a340a4779a5673c7d205bbad301649bc260ff3f1b0e0b7fb06599f";
var signerPublic = "0x59AF6eB470D980C7dfF9e977b87D8FdA92174860";

let signerWallet = new ethers.Wallet(signerPrivate);

before(async function () {
  _LCOAP = await ethers.getContractFactory("LCOAPassport");
  LCOAP = await _LCOAP.deploy();

  [owner, minter2, minter3] = await ethers.getSigners();

  await LCOAP.setSigner(signerPublic);

  //Set times
});

describe("Greeter", function () {
  it("Mints passport type 0", async function () {

    let messageHash = ethers.utils.keccak256(ethers.utils.solidityPack(["uint8", "address"], [1, owner.address]));

    let messageHashBytes = ethers.utils.arrayify(messageHash);

    const flatSig = await signerWallet.signMessage(messageHashBytes);

    let sig = ethers.utils.splitSignature(flatSig);

    await LCOAP.mintPassport(0, sig.v, sig.r, sig.s);
  });
});
