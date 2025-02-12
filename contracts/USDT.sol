//SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract USDT is ERC20, ERC20Burnable, Ownable {
    constructor() ERC20("USDT Token", "USDT") {
        _mint(msg.sender, 10000000 * 10 ** 18);
    }
}