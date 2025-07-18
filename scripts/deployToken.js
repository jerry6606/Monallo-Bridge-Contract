const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("正在使用账户部署 MintTokens (maoETH 代币) 合约:", deployer.address);
  console.log("此账户将成为合约的 owner (DEFAULT_ADMIN_ROLE)。");

  const MintTokens = await hre.ethers.getContractFactory("contracts/double-bridge/v0.1/MintAssets.sol:MintTokens");
  const mintTokens = await MintTokens.deploy("MonalloETH", "maoETH");

  await mintTokens.waitForDeployment();

  console.log("MintTokens (maoETH 代币) 合约已部署到地址:", mintTokens.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
