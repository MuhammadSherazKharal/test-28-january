async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());
    const Persale = await ethers.getContractFactory("Presale");

    const Token_ADDRESS = "0x658E9CFa4D53102C643b01cf853Db166fc91e3f5";
    const USDT_ADDRESS = "0x79DfbE056BA387bFF9b09a1A7f3E6822430C787d";
    const Wallet_ADDRESS = "0xeC3169B719392810Cb09Ca583231a82Aa20dA6E4";
   const price="0x212BfA6d8710886ca1086D170dB9348a37fC22E7"; 
    



    const per = await Persale.deploy(Token_ADDRESS,USDT_ADDRESS,Wallet_ADDRESS,price);
    console.log("Token contract address:-", per.address);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });