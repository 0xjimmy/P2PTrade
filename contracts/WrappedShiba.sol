//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract WrappedShiba is ERC20 {
  address public minter;

  //add minter changed event
  event MinterChanged(address indexed from, address to);

  constructor() public payable ERC20("Wrapped Doge Coin", "WDOGE") {
    minter = msg.sender;
  }

  function passMinterRole(address dBank) public returns(bool) {
    require(msg.sender == minter, 'Error: only owner can change minter role.');
		minter = dBank;

    emit MinterChanged(msg.sender,dBank);
    return true;
	}

  function mint(address account, uint256 amount) public {
    require(msg.sender == minter, 'Error: msg.sender does not have a minter role.');
		_mint(account, amount);
	}
}