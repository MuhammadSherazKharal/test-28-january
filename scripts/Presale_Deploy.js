async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());
    const Persale = await ethers.getContractFactory("Presale");

    const Token_ADDRESS = "0xCF9b227548BF53FbeAd0043af79301C3030Cc9D6";
    const USDT_ADDRESS = "0x01D63ac37E8eDbc70c2060De09499C22422C3755";
    const Wallet_ADDRESS = "0xB35CdEa74096fEDbcA576203853EA7ccc61ffD4A";
   const price="0x4AF6770e6e49ce5f4A77cEBBc6Fbaed24068Ae0E"; 
    



    const per = await Persale.deploy(Token_ADDRESS,USDT_ADDRESS,Wallet_ADDRESS,price);
    console.log("Token contract address:-", per.address);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });