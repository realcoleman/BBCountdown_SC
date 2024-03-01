require('@nomicfoundation/hardhat-toolbox');

/** @type import('hardhat/config').HardhatUserConfig */

require('dotenv').config();
module.exports = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },

  networks: {
    mumbai: {
      url: 'https://rpc.ankr.com/polygon_mumbai',
      accounts: [process.env.PRIVATE_KEY],
      chainId: 80001,
      gas: 'auto',
      gasPrice: 'auto',
    },
    bsctestnet: {
      url: 'https://data-seed-prebsc-2-s1.binance.org:8545/',
      accounts: [process.env.PRIVATE_KEY],
      chainId: 97,
      gas: 'auto',
      gasPrice: 'auto',
    },
    polygon: {
      url: 'https://polygon-rpc.com/',
      accounts: [`0x` + process.env.PRIVATE_KEY],
      gas: 'auto',
    },
    goerli: {
      url: `https://eth-goerli.g.alchemy.com/v2/6VIk-hwmxSKdcxCMiZPKqE4P0mprIa3w`,
      accounts: {
        mnemonic: '', //paste your mnemonic key
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
        passphrase: '',
      },
    },
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: false,
    except: [
      'SafeMath',
      'strings',
      'Pool',
      'Ownable',
      'Address',
      'ERC20',
      'Strings',
    ],
  },
};
