// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require('hardhat');

async function main() {
  const treasureyAddress = '0xE34970b753eB1BB58320C48560B9e5D4CB5Fb3e3';
  const lock = await hre.ethers.deployContract('BBCountDown', [
    treasureyAddress,
  ]);

  await lock.waitForDeployment();

  setTimeout(async () => {
    try {
      await hre.run('verify:verify', {
        address: lock.target,
        constructorArguments: [treasureyAddress] || [],
      });
      console.log(`verified`);
    } catch (error) {
      console.error(`verification failed:`, error);
    }
  }, 10000);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
