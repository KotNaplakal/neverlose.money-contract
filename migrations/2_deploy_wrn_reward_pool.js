module.exports = async function (deployer, network, [creator]) {
  if (network === 'test') return;

  const ERC20Token = artifacts.require('ERC20Token');
  const WRNRewardPool = artifacts.require('WRNRewardPool');
  const { toBN } = require('../test/helpers/NumberHelpers');

  // REF: https://docs.openzeppelin.com/upgrades-plugins/1.x/truffle-upgrades
  const { deployProxy } = require('@openzeppelin/truffle-upgrades');

  if (['development', 'ganache', 'goerli'].indexOf(network) > -1) {
    // NOTE: Use of `unsafeAllowCustomTypes` as UpgradesPlugins currently do not support validating custom types (enums or structs)
    // REF: https://docs.openzeppelin.com/upgrades-plugins/1.x/faq#what-does-it-mean-for-an-implementation-to-be-compatible
    const wrnToken = await deployProxy(ERC20Token, ['TEST WARREN', 'WRN', 18, toBN(0)], { deployer, unsafeAllowCustomTypes: true });
    const hunt = await deployProxy(ERC20Token, ['TEST HUNT Token', 'HUNT', 18, toBN(1000000)], { deployer, unsafeAllowCustomTypes: true });
    const weth = await deployProxy(ERC20Token, ['TEST Wrapped ETH', 'WETH', 18, toBN(10000)], { deployer, unsafeAllowCustomTypes: true });
    const wbtc = await deployProxy(ERC20Token, ['TEST Wrapped BTC', 'WBTC', 8, toBN(1000, 8)], { deployer, unsafeAllowCustomTypes: true });

    const wrnRewardPool = await deployProxy(WRNRewardPool, [wrnToken.address], { deployer, unsafeAllowCustomTypes: true });

    await wrnToken.addMinter(wrnRewardPool.address, { from: creator });

    await wrnRewardPool.addLockUpRewardPool(hunt.address, 2, toBN(10000), false);
    await wrnRewardPool.addLockUpRewardPool(weth.address, 1, toBN(10000), false);
    await wrnRewardPool.addLockUpRewardPool(wbtc.address, 1, toBN(10000, 8), false);

    console.log(`- Lock-up Contract: ${wrnRewardPool.address}`);
    console.log('- Test tokens');
    console.log(`  - WRN: ${wrnToken.address}\n  - HUNT: ${hunt.address}\n  - WETH: ${weth.address}\n  - WBTC: ${wbtc.address}`);
    console.log(`Owner: ${await wrnRewardPool.owner()} / Dev: ${await wrnRewardPool.devAddress()}`);
    console.log(`Sum of reward pool multiplers: ${await wrnRewardPool.totalMultiplier()}`);
    console.log(`Owner HUNT balance: ${await hunt.balanceOf(creator)}`);
  } else if (network === 'mainnet') {
    const HUNT_ADDRESS = '0x9aab071b4129b083b01cb5a0cb513ce7eca26fa5';
    const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
    const WBTC_ADDRESS = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599';

    const wrnToken = await deployProxy(ERC20Token, ['TEST WARREN', 'WRN', 18, toBN(0)], { deployer, unsafeAllowCustomTypes: true });
    const wrnRewardPool = await deployProxy(WRNRewardPool, [wrnToken.address], { deployer, unsafeAllowCustomTypes: true });
    await wrnToken.addMinter(wrnRewardPool.address, { from: creator });

    // Almost No-Limit on lock-up
    await wrnRewardPool.addLockUpRewardPool(HUNT_ADDRESS, 2, toBN(100000000), false); // ~50% of total HUNT = $4.6M
    await wrnRewardPool.addLockUpRewardPool(WETH_ADDRESS, 1, toBN(1000000), false); // ~1% of total ETH = $460M
    await wrnRewardPool.addLockUpRewardPool(WBTC_ADDRESS, 1, toBN(100000, 8), false); // ~0.5% of total BTC = $1,622M

    console.log(`-> Lock-up Contract: ${wrnRewardPool.address}`);
    console.log(`-> WRN: ${wrnToken.address}`);
    console.log(`- Owner: ${await wrnRewardPool.owner()} / Dev: ${await wrnRewardPool.devAddress()}`);
    console.log(`- Sum of reward pool multiplers: ${await wrnRewardPool.totalMultiplier()}`);
  }
}
