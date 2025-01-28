async function main() 
{

    const[ deployer] =await ethers.getSigners();
    console.log( 'Deploying Contract with account:- ', deployer.address);

    const token = await ethers.getContractFactory("FriscoToken");
    const Token = await token.deploy();
    console.log( 'Token Deployed to:- ', Token.address);
}

main()
.then(()=> process.exit(0))
.catch((error)=>{
    console.error("Error during Deployment",error);
    process.exit(1);
});