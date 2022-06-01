const { ethers, waffle } = require("hardhat");


async function main() {
  _CYNQUE = await ethers.getContractFactory("CYNQUE");
  CYNQUE = await _CYNQUE.deploy();

  console.log(`Deployed CYNQUE at address: ${CYNQUE.address}`);

  
  //await CYNQUE.updateRoyalties("0x0A020299fBCE261d059a17a5CCb9eF7981098b1E", 1000);
  
  await CYNQUE.setBaseURI("https://api.lostchildren.xyz/api/cynques/");
  await CYNQUE.setContractURI("https://api.lostchildren.xyz/cynque-contract.json");

  await CYNQUE.setPassportAddress("0x3322CA9B8251455976Af4706C08eb9D3371fe2DF");
  await CYNQUE.setPublicSaleTimes(100000000000, 1000000000000);
  await CYNQUE.setPassportSaleStartTime(100000000000);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
