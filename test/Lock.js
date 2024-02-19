const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('BBCountDown Contract', function () {
  let BBCountDown;
  let bbCountDown;
  let addr1;
  let addr2;
  let treasury;
  const bidAmount = ethers.parseEther('0.01'); // 0.01 ETH
  const endDelay = 69; // 69 Seconds
  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    BBCountDown = await ethers.getContractFactory('BBCountDown');
    [owner, addr1, addr2, treasury] = await ethers.getSigners();

    // Deploy a new contract before each test
    bbCountDown = await BBCountDown.deploy(treasury.address);
  });

  describe('Bidding', function () {
    it('should emit OnBid event', async function () {
      await expect(bbCountDown.connect(addr1).participate({ value: bidAmount }))
        .to.emit(bbCountDown, 'OnBid')
        .withArgs(addr1.address, bidAmount);
    });

    it('should not allow bidding with incorrect amount', async function () {
      await expect(
        bbCountDown.connect(addr1).participate({ value: '5000000000000000' })
      ).to.be.revertedWith('amount must be equal to bidAmount');
    });

    it('should not allow bidding during cooldown', async function () {
      // Simulate a winning bid
      await bbCountDown.connect(addr1).participate({ value: bidAmount });
      await ethers.provider.send('evm_increaseTime', [100]); // increase time to simulate bid end
      await ethers.provider.send('evm_mine', []); // mine the next block
      await bbCountDown.claimReward();

      // Attempt to bid during cooldown
      await expect(
        bbCountDown.connect(addr2).participate({ value: bidAmount })
      ).to.be.revertedWith('CoolDown period not met');
    });
  });

  describe('Claiming Rewards', function () {
    it('should transfer rewards and emit OnWin event', async function () {
      await bbCountDown.connect(addr1).participate({ value: bidAmount });
      await ethers.provider.send('evm_increaseTime', [100]); // increase time to simulate bid end
      await ethers.provider.send('evm_mine', []); // mine the next block

      await expect(bbCountDown.connect(addr1).claimReward())
        .to.emit(bbCountDown, 'OnWin')
        .withArgs(addr1.address, '9000000000000000'); // 90% of bidAmount
    });

    it('should not allow claiming reward if there is no winner', async function () {
      await expect(bbCountDown.connect(addr1).claimReward()).to.be.revertedWith(
        'no winner yet'
      );
    });
  });

  describe('Administrative Functions', function () {
    it('should allow the admin to set end delay', async function () {
      const newEndDelay = 120; // new end delay of 120 seconds
      await bbCountDown.setEndDelay(newEndDelay);
      expect(await bbCountDown.endDelay()).to.equal(newEndDelay);
    });

    it('should not allow non-admins to set end delay', async function () {
      const newEndDelay = 120;
      await expect(
        bbCountDown.connect(addr1).setEndDelay(newEndDelay)
      ).to.be.revertedWith('Caller is not an admin');
    });

    it('should allow the admin to set cooldown time', async function () {
      const newCoolDownTime = 600; // new cooldown time of 600 seconds
      await bbCountDown.setCoolDownTime(newCoolDownTime);
      expect(await bbCountDown.coolDownTime()).to.equal(newCoolDownTime);
    });

    it('should allow the admin to set bid amount', async function () {
      const newBidAmount = '20000000000000000'; // new bid amount of 0.02 ETH
      await bbCountDown.setBidAmount(newBidAmount);
      expect(await bbCountDown.bidAmount()).to.equal(newBidAmount);
    });

    it('should allow the admin to set the treasury address', async function () {
      const newTreasuryAddress = addr2.address;
      await bbCountDown.setTreasuryAddress(newTreasuryAddress);
      expect(await bbCountDown.treasuryAddress()).to.equal(newTreasuryAddress);
    });
  });

  describe('Blacklisting', function () {
    it('should prevent blacklisted addresses from participating', async function () {
      await bbCountDown.ban(addr1.address);
      await expect(
        bbCountDown.connect(addr1).participate({ value: bidAmount })
      ).to.be.revertedWith('Player is backlisted');
    });

    it('should allow removal from the blacklist', async function () {
      await bbCountDown.ban(addr1.address);
      await bbCountDown.unban(addr1.address);
      await expect(bbCountDown.connect(addr1).participate({ value: bidAmount }))
        .to.emit(bbCountDown, 'OnBid')
        .withArgs(addr1.address, bidAmount);
    });
  });

  it('should reject setting a bid amount to zero', async function () {
    await expect(bbCountDown.setBidAmount(0)).to.be.revertedWith(
      'must be positive'
    );
  });

  describe('Winning and Reward Distribution', function () {
    beforeEach(async function () {
      // Set up a successful bid by addr1
      await bbCountDown.connect(addr1).participate({ value: bidAmount });
      // Increase time to simulate bid end
      await ethers.provider.send('evm_increaseTime', [endDelay]);
      await ethers.provider.send('evm_mine', []);
    });

    it('should set the new nextStartTime after a win', async function () {
      await bbCountDown.connect(addr1).claimReward();
      const nextStartTime = await bbCountDown.nextStartTime();
      const currentTime = (await ethers.provider.getBlock('latest')).timestamp;
      expect(nextStartTime).to.be.above(currentTime);
    });
  });

  describe('End Delay and Cooldown Time', function () {
    it('should not declare a winner before end delay has passed', async function () {
      await bbCountDown.connect(addr1).participate({ value: bidAmount });
      await ethers.provider.send('evm_increaseTime', [endDelay - 10]);
      await ethers.provider.send('evm_mine', []);

      expect(await bbCountDown.hasWinner()).to.equal(false);
    });

    it('should declare a winner after end delay has passed', async function () {
      await bbCountDown.connect(addr1).participate({ value: bidAmount });
      await ethers.provider.send('evm_increaseTime', [endDelay]);
      await ethers.provider.send('evm_mine', []);

      expect(await bbCountDown.hasWinner()).to.equal(true);
    });

    it('should not allow participation during cool down period', async function () {
      await bbCountDown.connect(addr1).participate({ value: bidAmount });
      await ethers.provider.send('evm_increaseTime', [endDelay]);
      await ethers.provider.send('evm_mine', []);

      // addr1 wins and claims reward, starting a cooldown period
      await bbCountDown.connect(addr1).claimReward();

      // Others attempt to participate during cooldown
      await expect(
        bbCountDown.connect(addr2).participate({ value: bidAmount })
      ).to.be.revertedWith('CoolDown period not met');
    });
  });
});
