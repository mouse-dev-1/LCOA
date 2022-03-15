const { ethers, waffle } = require("hardhat");

let _LCOAP;
let LCOAP;
var owner;
var minter2;
var minter3;

var sig1;
var sig2;

var signerPrivate =
  "55aba49632a340a4779a5673c7d205bbad301649bc260ff3f1b0e0b7fb06599f";
var signerPublic = "0x59AF6eB470D980C7dfF9e977b87D8FdA92174860";

let signerWallet = new ethers.Wallet(signerPrivate);

const signForPassportMint = async (passportType, passportMinter) => {
  let messageHash = ethers.utils.keccak256(
    ethers.utils.solidityPack(
      ["uint8", "address"],
      [passportType, passportMinter]
    )
  );

  let messageHashBytes = ethers.utils.arrayify(messageHash);

  const flatSig = await signerWallet.signMessage(messageHashBytes);

  return ethers.utils.splitSignature(flatSig);
};

before(async function () {
  _LCOAP = await ethers.getContractFactory("_2052Passport");
  LCOAP = await _LCOAP.deploy();

  [owner, minter2, minter3] = await ethers.getSigners();

  sig1 = await signForPassportMint(0, minter2.address);
  sig2 = await signForPassportMint(1, minter3.address);

  await LCOAP.setSigner(signerPublic);

  //Set times
});

describe("Greeter", function () {
  it("Mints passport type 0 for minter 2", async function () {
    await LCOAP.connect(minter2).mintPassport(0, sig1.v, sig1.r, sig1.s);
  });

  it("Mints passport type 1 for minter 3", async function () {
    await LCOAP.connect(minter3).mintPassport(1, sig2.v, sig2.r, sig2.s);
  });
});
