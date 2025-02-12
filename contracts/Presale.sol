// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "./Token.sol"; 

contract Presale is Ownable {
    using SafeMath for uint256;


    Token public token;
    IERC20 public usdt; 
    address public collectorWallet;
    uint256 public tokenPriceInETH; 
    uint256 public tokenPriceInUSDT; 
    
    uint256 public presaleStartTime;
    uint256 public presaleEndTime;
    uint256 public tokensSold;
    uint256 public tokensAvailableForSale;

    mapping(address => uint256) public buyerBalances;
    mapping(address => uint256) public vestedTokens;

    AggregatorV3Interface internal priceFeed;

  
    event TokensBought(address indexed buyer, uint256 amount, uint256 price);
    event PresaleStarted(uint256 startTime, uint256 endTime);
    event PresaleEnded();

    constructor(address _token,address _usdt,address _collectorWallet,address _priceFeed) {
        token = Token(_token);
        usdt = IERC20(_usdt);
        collectorWallet = _collectorWallet;
        priceFeed = AggregatorV3Interface(_priceFeed);
    }

    modifier onlyWhenPresaleActive() {
        require(block.timestamp >= presaleStartTime && block.timestamp <= presaleEndTime, "Presale is not active");
        _;
    }

    function startPresale(uint256 _durationInDays, uint256 _tokenPriceInETH, uint256 _tokenPriceInUSDT) external onlyOwner {
        require(presaleStartTime == 0, "Presale already started");
        presaleStartTime = block.timestamp;
        presaleEndTime = block.timestamp + _durationInDays * 1 days;
        tokenPriceInETH = _tokenPriceInETH;
        tokenPriceInUSDT = _tokenPriceInUSDT;
        tokensAvailableForSale = token.totalSupply().mul(40).div(100); 
        tokensSold = 0;
        emit PresaleStarted(presaleStartTime, presaleEndTime);
    }

   
    function endPresale() external onlyOwner {
        require(block.timestamp >= presaleEndTime, "Presale is still ongoing");
        presaleStartTime = 0;
        presaleEndTime = 0;
        emit PresaleEnded();
    }

    function buyWithETH() external payable onlyWhenPresaleActive {
        uint256 tokenAmount = msg.value.div(tokenPriceInETH);
        require(tokensSold.add(tokenAmount) <= tokensAvailableForSale, "Not enough tokens available");

        buyerBalances[msg.sender] = buyerBalances[msg.sender].add(tokenAmount);
        tokensSold = tokensSold.add(tokenAmount);

        emit TokensBought(msg.sender, tokenAmount, tokenPriceInETH);

    }


    function buyWithUSDT(uint256 _usdtAmount) external onlyWhenPresaleActive {
        uint256 tokenAmount = _usdtAmount.div(tokenPriceInUSDT);
        require(tokensSold.add(tokenAmount) <= tokensAvailableForSale, "Not enough tokens available");

        usdt.transferFrom(msg.sender, collectorWallet, _usdtAmount);

        buyerBalances[msg.sender] = buyerBalances[msg.sender].add(tokenAmount);
        tokensSold = tokensSold.add(tokenAmount);

        emit TokensBought(msg.sender, tokenAmount, tokenPriceInUSDT);

    }

    function claimTokens() external {
        require(block.timestamp > presaleEndTime, "Presale has not ended");
        
        uint256 vestedAmount = calculateVestedTokens(msg.sender);
        require(vestedAmount > 0, "No tokens available for claim");

        vestedTokens[msg.sender] = vestedTokens[msg.sender].add(vestedAmount);
        buyerBalances[msg.sender] = buyerBalances[msg.sender].sub(vestedAmount);

        token.transfer(msg.sender, vestedAmount);
    }
    function calculateVestedTokens(address _user) public view returns (uint256) {
        uint256 timeElapsed = block.timestamp.sub(presaleEndTime);
        uint256 vestedPercentage = timeElapsed.div(30 days).mul(25);
        return buyerBalances[_user].mul(vestedPercentage).div(100);
    }

    function withdrawETH() external onlyOwner {
        payable(collectorWallet).transfer(address(this).balance);
    }

    function withdrawUSDT() external onlyOwner {
        uint256 balance = usdt.balanceOf(address(this));
        usdt.transfer(collectorWallet, balance);
    }
}
