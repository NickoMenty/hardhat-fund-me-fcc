const { assert, expect } = require("chai")
const { network, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe
          let deployer
          const sendValue = ethers.parseEther("0.1")
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              fundMe = await ethers.getContract("FundMe", deployer)
          })
          it("Can deployer withdraw?", async function () {
              await fundMe.fund({ value: sendValue })
              await fundMe.withdraw()
              const FundMeBalance = await ethers.provider.getBalance(
                  await fundMe.getAddress()
              )
              assert.equal(FundMeBalance, 0)
          })
      })
