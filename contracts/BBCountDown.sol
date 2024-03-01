// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

// Uncomment this line to use console.log
import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";

import "./BlackList.sol";

contract BBCountDown is ReentrancyGuard, Blacklist {
    uint256 public lastBidTime;
    address public lastBidder;
    address public lastWinner;

    address public treasuryAddress;

    event OnBid(address indexed author, uint256 amount);
    event OnWin(address indexed author, uint256 amount);
    event OnDeposit(address indexed admin, uint256 amount);
    event OnChangeAdmin(address indexed oldAdmin, address indexed newAdmin);

    uint32 public endDelay = 69; // default 69 seconds
    uint256 public coolDownTime = 300; // default 5 mins
    uint256 public nextStartTime = 0;
    uint256 public bidAmount = 10000000000000000;

    constructor(address _treasuryAddress)  {
        admin = msg.sender;
        treasuryAddress = _treasuryAddress;
    }

    function deposit() external payable onlyAdmin {
        emit OnDeposit(msg.sender, msg.value);
    }

    function changeAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "New admin address cannot be zero address");
        emit OnChangeAdmin(admin, _newAdmin);
        admin = _newAdmin;
    }

    function participate() external payable {
        
        require(block.timestamp >= nextStartTime, "CoolDown period not met");
        require(!blacklist[msg.sender], "Player is backlisted");
        require(msg.value == bidAmount, "amount must be equal to bidAmount");
        
        emit OnBid(msg.sender, msg.value);

        lastBidTime = block.timestamp;
        lastBidder = msg.sender;
        
    }
   
    function claimReward() external nonReentrant {
        require(hasWinner(), "no winner yet");

        uint256 totalBalance = address(this).balance;
        uint256 winAmount = (totalBalance / 100) * 90; //90%
        uint256 treasuryAmount = (totalBalance / 100) * 10; //10%
        
        payable(lastBidder).transfer(winAmount);
        payable(treasuryAddress).transfer(treasuryAmount);

        lastBidTime = 0;
        nextStartTime = block.timestamp + coolDownTime;
        emit OnWin(lastBidder, winAmount);
        lastWinner = lastBidder;
    }

     function hasWinner() public view returns (bool) {
        return lastBidTime != 0 && block.timestamp - lastBidTime >= endDelay;
    }

    function setEndDelay(uint32 delay) external onlyAdmin {
        require(delay >= 60, "must be at least a minute");
        endDelay = delay;
    }

    function setCoolDownTime(uint256 time) external onlyAdmin {
        require(time >= 0, "Should be valid");
        coolDownTime = time;
    }

    function setBidAmount(uint256 _bidAmount) external onlyAdmin {
        require(_bidAmount > 0, "must be positive");
        bidAmount = _bidAmount;
    }

    function setTreasuryAddress(address _treasuryAddress) external onlyAdmin {
        treasuryAddress = _treasuryAddress;
    }


}
