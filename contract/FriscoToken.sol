// SPDX-Liscense-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/constracts/token/ER20/ERC20.sol";
import "@openzeppelin/constracts/access/Ownable.sol";
import "@openzeppelin/constracts/utils/math/safeMath.sol";

contract FriscoToken is ERC20, Ownable {
    using SafeMath for uint256;
    uint256 buyTax = 3;
    uint256 sellTax = 8;
    uint256 transferTax = 1;
    uint256 maxWalletLimit = 2 * 10 ** 12 * 10 ** 18;
    bool public tradingEnabled = false;
    address public taxWallet;

    mapping(address => bool) public isWhitelisted;
    mapping(address => bool) public isBlacklisted;
    mapping(address => bool) public isExcludedFromTax;

    constructor() ERC20("Frisco", "FLM") {
        _mint(msg.sender, 100 * 10 ** 12 * 10 ** 18);
        taxWallet = msg.sender;
        isExcludedFromTax[msg.sender] = true;
    }

    modifier onlyWhenTradingEnabled() {
        require(tradingEnabled, "Trading is not Enabled yet....");
        _;
    }

    // Enable or Disable Trading
    function enableTrading(bool _enable) external onlyOwner {
        tradingEnabled = _enable;
    }

    function updateTaxes(uint256 _buytax,uint256 _sellTax,uint256 _transferTax) external onlyOwner {
        require(_buytax <= 25 && _sellTax <= 25 && _transferTax <= 25, "Tax cannot be more than 25%");
        buyTax = _buytax;
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

    function includeinTax(address _address) external onlyOwner {
        isExcludedFromTax[_address] = false;
    }

    function isTaxable(address _address) public view returns (bool) {
        return !isExcludedFromTax[_address] && !isWhitelisted[_address];
    }

    //apply taxes

    function _transfer(address from,address to,uint256 amount
    ) internal override onlyWhenTradingEnabled {
        require(!isBlacklisted[from] && !isBlacklisted[to],"Address is blacklisted");

        uint256 taxAmount = 0;
        uint256 maxWalletAmount = totalSupply().mul(2).div(100);

        if (to != address(this) && !isWhitelisted[to]) {
            require(balanceOf(to).add(amount) <= maxWalletAmount,"Exceed max Wallet Limit");
        }

        if (isTaxable(from)) {
            // Buy trans....
            if (from == uniswapV2Pair) {
                taxAmount = amount.mul(buyTax).div(100);
            }
            // Sell Trans....
            else if (to == uniswapV2Pair) {
                taxAmount = amount.mul(sellTax).div(100);
            }
            // Transer Tax Trans...
            else {
                taxAmount = amount.mul(transferTax).div(100);
            }
//The taxes should later convert into eth before being sent to the tax wallet
            uint256 taxToConvert = taxAmount;
            if (taxToConvert > 0) {
                super._transfer(from, taxWallet, taxToConvert);
                amount = amount.sub(taxToConvert);
            }
        }
        super._transfer(from, to, amount);
    }

    //recieve ETH after swapping taxes
    recieve() external payable{};
}
