const { ethers, waffle } = require("hardhat");


async function main() {
  _LCOAP = await ethers.getContractFactory("_2052Passport");
  LCOAP = await _LCOAP.deploy();

  console.log(`Deployed LCOAP at address: ${LCOAP.address}`);

  await LCOAP.setSigner("0x23D885d916F2A3b50aF81e5F0A88C00F7f0c602f");
  
  await LCOAP.updateRoyalties("0x0A020299fBCE261d059a17a5CCb9eF7981098b1E", 1000);
  
  await LCOAP.setBaseURI("https://api.lostchildren.xyz/api/passports/");

  await LCOAP.setContractURI("https://api.lostchildren.xyz/2052-passports-contract.json");

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
