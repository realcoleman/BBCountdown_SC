// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

contract Blacklist  {
    address public admin;
    mapping(address => bool) public blacklist;
    
     modifier onlyAdmin() {
        require(msg.sender == admin, "Caller is not an admin");
        _;
    }

    function ban(address _address) public onlyAdmin {
        require(!blacklist[_address], "address already blacklisted");
        blacklist[_address] = true;
    }
    
    function unban(address _address) public onlyAdmin {
        require(blacklist[_address], "address already whitelisted");
        blacklist[_address] = false;
    }
}