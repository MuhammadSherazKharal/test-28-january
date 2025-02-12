
async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
    const DECIMALS = 18;
    const INITIAL_PRICE = ethers.utils.parseUnits("2000", DECIMALS);   
    const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
    const mockPriceFeed = await MockV3Aggregator.deploy(DECIMALS, INITIAL_PRICE);
    
    await mockPriceFeed.deployed();
    console.log("Mock Price Feed deployed to:", mockPriceFeed.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });