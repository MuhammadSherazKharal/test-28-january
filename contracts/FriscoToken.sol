// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

contract FriscoToken is ERC20, Ownable {
    using SafeMath for uint256;

    uint256 public buyTax = 3;
    uint256 public sellTax = 8;
    uint256 public transferTax = 1;
    uint256 public maxWalletLimit = 2 * 10 ** 12 * 10 ** 18;
    bool public tradingEnabled = false;
    address public taxWallet;
    address[] public path;

    IUniswapV2Router02 public uniswapV2Router;
    address public uniswapV2Pair;

    mapping(address => bool) public isWhitelisted;
    mapping(address => bool) public isBlacklisted;
    mapping(address => bool) public isExcludedFromTax;

    constructor() ERC20("Frisco", "FLM") {
        // Set up the Uniswap Router and pair
        uniswapV2Router = IUniswapV2Router02(0xE592427A0AEce92De3Edee1F18E0157C05861564);
        uniswapV2Pair = IUniswapV2Factory(uniswapV2Router.factory())
                            .createPair(address(this), uniswapV2Router.WETH());

        _mint(msg.sender, 100 * 10 ** 12 * 10 ** 18);
        taxWallet = msg.sender;
        isExcludedFromTax[msg.sender] = true;
    }

    modifier onlyWhenTradingEnabled() {
        require(tradingEnabled, "Trading is not enabled yet.");
        _;
    }

    function enableTrading(bool _enable) external onlyOwner {
        tradingEnabled = _enable;
    }

    function updateTaxes(uint256 _buyTax, uint256 _sellTax, uint256 _transferTax) external onlyOwner {
        require(_buyTax <= 25 && _sellTax <= 25 && _transferTax <= 25, "Tax cannot be more than 25%");
        buyTax = _buyTax;
        sellTax = _sellTax;
        transferTax = _transferTax;
    }

    function updateTaxWallet(address _newTaxWallet) external onlyOwner {
        taxWallet = _newTaxWallet;
    }

    function whitelistAddress(address _address) external onlyOwner {
        isWhitelisted[_address] = true;
    }

    function blacklistAddress(address _address) external onlyOwner {
        isBlacklisted[_address] = true;
    }

    function removeBlacklist(address _address) external onlyOwner {
        isBlacklisted[_address] = false;
    }

    function excludeFromTax(address _address) external onlyOwner {
        isExcludedFromTax[_address] = true;
    }

    function includeInTax(address _address) external onlyOwner {
        isExcludedFromTax[_address] = false;
    }

    function isTaxable(address _address) public view returns (bool) {
        return !isExcludedFromTax[_address] && !isWhitelisted[_address];
    }

    // Apply taxes and perform transfer
    function _transfer(address from, address to, uint256 amount) internal override onlyWhenTradingEnabled {
        require(!isBlacklisted[from] && !isBlacklisted[to], "Address is blacklisted");

        uint256 taxAmount = 0;
        uint256 maxWalletAmount = totalSupply().mul(2).div(100);  // 2% max wallet

        if (to != address(this) && !isWhitelisted[to]) {
            require(balanceOf(to).add(amount) <= maxWalletAmount, "Exceeds max wallet limit");
        }

        if (isTaxable(from)) {
            // Buy transaction
            if (from == uniswapV2Pair) {
                taxAmount = amount.mul(buyTax).div(100);
            }
            // Sell transaction
            else if (to == uniswapV2Pair) {
                taxAmount = amount.mul(sellTax).div(100);
            }
            // Transfer transaction
            else {
                taxAmount = amount.mul(transferTax).div(100);
            }

            uint256 taxToConvert = taxAmount;
            if (taxToConvert > 0) {
                super._transfer(from, address(this), taxToConvert);
                swapTokensForEth(taxToConvert);
                amount = amount.sub(taxToConvert);
            }
        }
        super._transfer(from, to, amount);
    }

    function swapTokensForEth(uint256 tokenAmount) private {
    _approve(address(this), address(uniswapV2Router), tokenAmount);
  

    path[0] = address(this);  
    path[1] = uniswapV2Router.WETH(); 

    // Execute the swap
    uniswapV2Router.swapExactTokensForETH(
        tokenAmount,      
        0,                
        path,           
        taxWallet,        
        block.timestamp  
    );
}

    receive() external payable {}
}
