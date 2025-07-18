const { task } = require("hardhat/config");
require("dotenv").config();

const TOKEN_ADDRESS = "0x06fF2cfbAAFDfcFbd4604B98C8a343dfa693476e"; // Token 合约地址 (imua)

task("manual-mint-imua", "根据A链事件数据在B链 (imua) 上手动铸造代币") 
  .addParam("recipient", "B链 (imua) 上接收代币的地址 (来自A链事件)") 
  .addParam("amount", "要铸造的代币数量 (人类可读格式, 来自A链事件)") 
  .addParam("crosschainhash", "来自A链事件的唯一数据哈希 (例如: 0x...64个字符)") 
  .setAction(async ({ recipient, amount, crosschainhash }, hre) => {

    const signers = await hre.ethers.getSigners();

    const manualOperator = signers[1];
    console.log("正在使用手动操作员账户 (需是 MintTokens 的 MINTER_ROLE):", manualOperator.address); 

    if (!TOKEN_ADDRESS || TOKEN_ADDRESS === "0x...") {
        console.error("错误: 请在 tasks/manualMintIma.js 中更新 TOKEN_ADDRESS (imua 链上的 MintTokens 地址)"); 
        process.exit(1);
    }
    if (!hre.ethers.isHexString(crosschainhash, 32)) {
        console.error("错误: crosschainhash 必须是32字节的十六进制字符串 (例如: 0x...64个字符)。");
        process.exit(1);
    }
     if (!hre.ethers.isAddress(recipient)) { // 校验接收者地址
        console.error(`错误: 接收者地址 ${recipient} 格式无效。`);
        process.exit(1);
    }

    // 使用 getContractAt 连接到 MintTokens 合约
    const token = await hre.ethers.getContractAt("contracts/double-bridge/v0.1/MintAssets.sol:MintTokens", TOKEN_ADDRESS);
    const amountWei = hre.ethers.parseUnits(amount, 18); 

    console.log(`正在尝试在B链 (imua) 上向 ${recipient} 铸造 ${amount} 代币，跨链哈希为 ${crosschainhash} (来自A链)...`); 
    try {
        // 使用手动操作员账户连接合约并调用 mint 函数
        const tx = await token.connect(manualOperator).mint(recipient, amountWei, crosschainhash);
        await tx.wait();
        console.log("代币在B链 (imua) 上铸造成功! 交易哈希:", tx.hash); 
        console.log(`已为跨链哈希 ${crosschainhash} 向 ${recipient} 铸造 ${amount} 代币。`);
    } catch (error) {
        console.error("铸造代币失败:", error.message);
        console.error("请确保运行此任务的账户在 MintTokens 合约上是 MINTER_ROLE。"); 
        console.error("同时，请验证 TOKEN_ADDRESS、recipient/amount 和 crosschainhash 参数是否正确。");
        // 检查是否是重复交易哈希错误
        if (error.message.includes("Transaction hash already processed")) {
             console.error("错误原因可能是: 此 crosschainhash 已经被处理过，代币已铸造。");
        } else if (error.message.includes("AccessControl: account ")) { 
             console.error("错误原因可能是: 运行此任务的账户没有 MINTER_ROLE。"); 
        }
        process.exit(1);
    }
  });
