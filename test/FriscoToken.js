const { expect, use } = require('chai');
const { time } = require('@openzeppelin/test-helpers');
const { ethers } = require('hardhat');
const { describe } = require('node:test');
const { console } = require('inspector');
const { before } = require('lodash');
const { connect } = require('http2');



describe("FriscoToken", function () {
    const initialSupply = ethers.utils.parseUnits("100000000000000", 18);
    const buyTax = 3;
    const sellTax = 8;
    const transferTax = 1;

    let user;
    let owner;
    let token;
    let taxWallet;
    let otherwallet;
    beforeEach(async function () {
        
        [owner,user,taxWallet,otherwallet]= await ethers.getSigner();


        const Token = await ethers.getContractFactory('FriscoToken');
        token = await Token.deploy();
        await token.deployed();

        await token._mint(owner.address,initialSupply);

        await token.updateTaxWallet(taxWallet.address);




    });

    describe("Deployment of the contract ",function(){
        it("should set correct name and symbol",async function () 
        {
            expect(await token.name()).to.equal("Frisco");
            expect(await token.symbol()).to.equal("FLM");
    
        });
        
        it("should mint correct initial Supply",async function () 
        {
            expect(await token.balanceOf(owner.address)).to.equal(initialSupply);
    
        });
        it("should have correct taxwallet ",async function () 
        {
            expect(await token.taxWallet()).to.equal(taxWallet.address);
    
        });
    
        it("should set correct initial percentages",async function () 
        {
            expect(await token.buyTax()).to.equal(buyTax);
            expect(await token.sellTax()).to.equal(sellTax);
            expect(await token.transferTax()).to.equal(transferTax);
    
        });
        
    });
    
    describe(" Taxation",async function(){
        beforeEach(async function () {
            await token.enableTrading(true)
            
        });

        it("should apply buy tax on token purchase",async function () 
        {
            const amountToBuy= ethers.utils.parseUnits('1000',18);
            await token.connect(owner).approve(user.address, amountToBuy);

            const initialBalance = await token.balanceOf(user.address);
            await token.connect(user).transferFrom(owner.address, user.address, amountToBuy);
            
             const taxAmount = amountToBuy.mul(buyTax).div(100);
             const expectedBalance = initialBalance.add(amountToBuy).sub(taxAmount);


            expect(await token.balanceOf(user.address)).to.equal(expectedBalance);
            expect(await token.balanceOf(taxWallet.address)).to.equal(taxAmount);
    
        });
        
        it("should apply sell tax on token sale",async function () 
        {
            const amountTosell= ethers.utils.parseUnits('1000',18);
            await token.connect(owner).approve(user.address, amountTosell);
            await token.connect(user).transferFrom(owner.address, user.address, amountTosell);

            const initialBalance = await token.balanceOf(owner.address);
            await token.connect(user).transferFrom(owner.address, user.address, amountTosell);
            const taxAmount = amountTosell.mul(sellTax).div(100);
            const expectedBalance = initialBalance.add(amountTosell).sub(taxAmount);

            expect(await token.balanceOf(owner.address)).to.equal(expectedBalance);
            expect(await token.balanceOf(taxWallet.address)).to.equal(taxAmount);

        });



        it("should apply transfer tax ",async function () 
        {
           const amountToTransfer= ethers.utils.parseUnits("1000",18);

           await connect(owner).approve(user.address, amountToTransfer);
           await token.connect(user).transferFrom(owner.address, user.address,amountToTransfer);
           
           const initialBalanceSender = await token.balanceOf(owner.address); 
           const initialBalanceReciever = await token.balanceOf(user.address);
           
           await token.connect(user).transfer(otherwallet.address,amountToTransfer);
            
           const taxAmount= amountToTransfer.mul(transferTax).div(100);
           const expectedSenderBalance = initialBalanceSender.sub(amountToTransfer);
           const expectedBalanceReciever = initialBalanceReciever.sub(amountToTransfer).add(amountToTransfer).sub(taxAmount);



           expect(await token.balanceOf(owner.address).to.equal(expectedSenderBalance));
           expect(await token.balanceOf(user.address).to.equal(expectedBalanceReciever));
           expect(await token.balanceOf(taxWallet.address).to.equal(taxAmount));
        });
    
        
    });
        


    describe("Max Wallet Limit", function(){


    
        it("should Enforce the max limit wallet",async function () 
        {
           const amountToTransfer= ethers.utils.parseUnits('500000000000000',18);
           await token.connect(owner).approve(user.address,amountToTransfer);
           await token.connect(user).transferFrom(owner.address,user.address, amountToTransfer);
    
           await expect(token.connect(user).transfer(owner.address,amountToTransfer)).to.be.revertedWith("Exceed max Wallet Limit");
    
        });
    });

    
describe("Enable or Disable Trading ", function(){


    
    it("should allow owner to Enable Trading ",async function () 
    {
       await token.enableTrading(true);
       expect(await token.tradingEnabled().to.be.true);

    });


     
    it("should not allow transfer when trading is disabled",async function () 
    {
       await token.enableTrading(false);
       token.connect(user).transfer(owner.address, ethers.utils.parseUnits("1000",18)).to.be.revertedWith("Trading is not Enabled yet....");

    });




});



















})