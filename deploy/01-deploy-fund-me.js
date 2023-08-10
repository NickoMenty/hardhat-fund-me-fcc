// function deployFunc() {
//     console.log("hi")
// }

// module.exports.default = deployFunc

// hre = const { ethers, run, network } = require("hardhat")

/* ----- THIS IS THE SAME #1-----*/
// module.exports = async (hre) => {
//     const { getNamedAccounts, deployments } = hre
// }
// COMMENT: hre = require("hardhat")

/* ----- THIS IS THE SAME #2----- */
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { network } = require("hardhat")
const { verify } = require("../utils/verify")

/* ----- THIS IS THE SAME #2----- */
// const helperConfig = require("../helper-hardhat-config")
// const networkConfig = helperConfig.networkConfig

/* ----- THIS IS THE SAME #1----- */
module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    // here we grap an account that we listed in config | row: 41
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    // const ethUsdPriceFeedAdress = networkConfig[chainId]["ethUsdPriceFeed"]
    let ethUsdPriceFeedAddress

    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }

    // what happens when we want to change chains?
    // when going for local host or hadhat network we want to use a mock
    const args = [ethUsdPriceFeedAddress]

    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args,
        /* priceFeedAddress */
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, args)
    }

    log("_____________________________________________________")
}

module.exports.tags = ["all", "fundme"]
