const { expect } = require("chai");
const { time, constants } = require("@openzeppelin/test-helpers");
const { ethers } = require("hardhat");

describe("Presale Contract", function () {
    let token, usdt, presale;
    let owner, buyer1, buyer2, collectorWallet;
    const tokenPriceInETH = ethers.utils.parseUnits("0.01", "ether"); 
    const tokenPriceInUSDT = 1; 

    const tokenAddress = "0x658E9CFa4D53102C643b01cf853Db166fc91e3f5"; 
    const usdtAddress = "0x79DfbE056BA387bFF9b09a1A7f3E6822430C787d";
    const priceFeedAddress = "0x212BfA6d8710886ca1086D170dB9348a37fC22E7"; 
    const presaleAddress = "0x5387C1A6cE838075108ECA3566f1E3c15E40685b"; 
    const collectorWalletAddress = "0xeC3169B719392810Cb09Ca583231a82Aa20dA6E4"; 

    beforeEach(async function () {
        [owner, buyer1, buyer2, collectorWallet] = await ethers.getSigners();

      
        token = await ethers.getContractAt("Token", tokenAddress);
        usdt = await ethers.getContractAt("IERC20", usdtAddress); 
        priceFeed = await ethers.getContractAt("AggregatorV3Interface", priceFeedAddress);
        presale = await ethers.getContractAt("Presale", presaleAddress);

        const totalSupply = await token.totalSupply();
        await token.transfer(presale.address, totalSupply.mul(40).div(100)); 
    });

    describe("Presale Start/End", function () {
        it("should allow owner to start the presale", async function () {
            await presale.startPresale(30, tokenPriceInETH, tokenPriceInUSDT);

            const presaleStartTime = await presale.presaleStartTime();
            const presaleEndTime = await presale.presaleEndTime();

            expect(presaleStartTime).to.be.gt(0);
            expect(presaleEndTime).to.be.gt(presaleStartTime);
        });

        it("should allow owner to end the presale", async function () {
            await presale.startPresale(30, tokenPriceInETH, tokenPriceInUSDT);
            await time.increase(31 * 24 * 60 * 60); 

            await presale.endPresale();
            const presaleStartTime = await presale.presaleStartTime();
            const presaleEndTime = await presale.presaleEndTime();

            expect(presaleStartTime).to.equal(0);
            expect(presaleEndTime).to.equal(0);
        });
    });

    describe("Buying Tokens", function () {
        beforeEach(async function () {
            await presale.startPresale(30, tokenPriceInETH, tokenPriceInUSDT);
        });

        it("should allow user to buy tokens with ETH", async function () {
            const initialBalance = await token.balanceOf(buyer1.address);

            await presale.connect(buyer1).buyWithETH({ value: ethers.utils.parseUnits("1", "ether") });

            const finalBalance = await token.balanceOf(buyer1.address);

            expect(finalBalance.sub(initialBalance)).to.equal(ethers.utils.parseUnits("100", "ether")); 
        });

        it("should reject purchase with insufficient ETH", async function () {
            await expect(
                presale.connect(buyer1).buyWithETH({ value: ethers.utils.parseUnits("0.1", "ether") })
            ).to.be.revertedWith("Not enough tokens available");
        });

        it("should allow user to buy tokens with USDT", async function () {
            const initialBalance = await token.balanceOf(buyer2.address);
            await usdt.connect(buyer2).approve(presale.address, 1000);

            await presale.connect(buyer2).buyWithUSDT(1000);

            const finalBalance = await token.balanceOf(buyer2.address);

            expect(finalBalance.sub(initialBalance)).to.equal(1000);
        });

        it("should reject purchase with insufficient USDT", async function () {
            await expect(
                presale.connect(buyer2).buyWithUSDT(5000) 
            ).to.be.revertedWith("Not enough tokens available");
        });
    });

    describe("Claiming Tokens", function () {
        it("should allow user to claim vested tokens after presale ends", async function () {
            await presale.startPresale(30, tokenPriceInETH, tokenPriceInUSDT);
            await presale.connect(buyer1).buyWithETH({ value: ethers.utils.parseUnits("1", "ether") });
            await time.increase(31 * 24 * 60 * 60);
            await presale.connect(buyer1).claimTokens();

            const buyerBalance = await token.balanceOf(buyer1.address);
            expect(buyerBalance).to.be.gt(0);
        });

        it("should reject claim if presale is still ongoing", async function () {
            await presale.startPresale(30, tokenPriceInETH, tokenPriceInUSDT);
            await presale.connect(buyer1).buyWithETH({ value: ethers.utils.parseUnits("1", "ether") });

            await expect(
                presale.connect(buyer1).claimTokens()
            ).to.be.revertedWith("Presale has not ended");
        });
    });

    describe("Withdraw Funds", function () {
        it("should allow owner to withdraw ETH", async function () {
            const initialBalance = await ethers.provider.getBalance(collectorWallet.address);
            await presale.connect(buyer1).buyWithETH({ value: ethers.utils.parseUnits("1", "ether") });

            await presale.connect(owner).withdrawETH();

            const finalBalance = await ethers.provider.getBalance(collectorWallet.address);
            expect(finalBalance.sub(initialBalance)).to.equal(ethers.utils.parseUnits("1", "ether"));
        });

        it("should allow owner to withdraw USDT", async function () {
            const initialBalance = await usdt.balanceOf(collectorWallet.address);
            await usdt.connect(buyer2).approve(presale.address, 1000);
            await presale.connect(buyer2).buyWithUSDT(1000);

            await presale.connect(owner).withdrawUSDT();

            const finalBalance = await usdt.balanceOf(collectorWallet.address);
            expect(finalBalance.sub(initialBalance)).to.equal(1000);
        });
    });
});
