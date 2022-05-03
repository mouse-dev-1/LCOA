const { ethers, waffle } = require("hardhat");

var signerPublic = "0x59AF6eB470D980C7dfF9e977b87D8FdA92174860";

async function main() {
  _LCOAP = await ethers.getContractFactory("_2052Passport");
  LCOAP = await _LCOAP.deploy();

  console.log(`Deployed LCOAP at address: ${LCOAP.address}`);

  await LCOAP.setSigner(signerPublic);
  
  await LCOAP.updateRoyalties("0x0A020299fBCE261d059a17a5CCb9eF7981098b1E", 1000);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
