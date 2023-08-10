const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe
          let mockV3Aggregator
          let deployer
          let user
          const sendValue = ethers.parseEther("1")
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              user = (await getNamedAccounts()).user
              // "deployments.fixture" will deploy contracts that have tag "all" on local network
              await deployments.fixture(["all"])
              // "ethers.getContract" will give as the most recent deploy of "FundMe" contract
              fundMe = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })
          describe("receive", async function () {
              it("Checks if the Receive function trigers fund", async function () {
                  const fundMeAdress = await fundMe.getAddress()
                  signer = await ethers.getSigner(user)
                  const transactionReceiveHash = await signer.sendTransaction({
                      to: fundMeAdress,
                      value: sendValue,
                  })
                  assert.equal(user, await fundMe.getFunders(0))
              })
          })

          describe("fallback", async function () {
              it("Checks if the Fallback function trigers fund", async function () {
                  const fundMeAdress = await fundMe.getAddress()
                  signer = await ethers.getSigner(user)
                  const transactionFallbackHash = await signer.sendTransaction({
                      to: fundMeAdress,
                      value: sendValue,
                      data: deployer,
                  })
                  assert.equal(user, await fundMe.getFunders(0))
              })
          })

          describe("fund", async function () {
              it("Fails if you don't send enough ETH", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "FundMe__NotEnoughETH"
                  )
              })
              it("Updated the amount funded data structure", async function () {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  )
                  assert.equal(response.toString(), sendValue.toString())
              })
              it("Adds funder to array of getFunders", async function () {
                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.getFunders(0)
                  assert.equal(funder, deployer)
              })
          })

          describe("withdraw", async function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue })
              })
              it("Should withdraw ETH from a single founder", async function () {
                  // Arange
                  // we use "ethers.provider.getBalance"
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(
                          await fundMe.getAddress()
                      )
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer)
                  // Act
                  const tranactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await tranactionResponse.wait(1)

                  // here we pulled objects from another object
                  const { gasUsed, gasPrice } = transactionReceipt
                  const gasCost = gasUsed * gasPrice

                  const endingFundMeBalance = await ethers.provider.getBalance(
                      await fundMe.getAddress()
                  )
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer)
                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost
                  )
              })

              it("Should cheaper withdraw ETH from a single founder", async function () {
                  // Arange
                  // we use "ethers.provider.getBalance"
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(
                          await fundMe.getAddress()
                      )
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer)
                  // Act
                  const tranactionResponse = await fundMe.cheapWithdraw()
                  const transactionReceipt = await tranactionResponse.wait(1)

                  // here we pulled objects from another object
                  const { gasUsed, gasPrice } = transactionReceipt
                  const gasCost = gasUsed * gasPrice

                  const endingFundMeBalance = await ethers.provider.getBalance(
                      await fundMe.getAddress()
                  )
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer)
                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost
                  )
              })

              it("Should withdraw ETH from a multiple founders", async function () {
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }

                  const startingFundMeBalance =
                      await ethers.provider.getBalance(
                          await fundMe.getAddress()
                      )
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer)

                  // Act
                  const tranactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await tranactionResponse.wait(1)
                  const { gasUsed, gasPrice } = transactionReceipt
                  const gasCost = gasUsed * gasPrice
                  // assert
                  const endingFundMeBalance = await ethers.provider.getBalance(
                      await fundMe.getAddress()
                  )
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer)
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost
                  )
                  //
                  await expect(fundMe.getFunders(0)).to.be.reverted

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })
              it("Should cheaper withdraw ETH from a multiple founders", async function () {
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }

                  const startingFundMeBalance =
                      await ethers.provider.getBalance(
                          await fundMe.getAddress()
                      )
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer)

                  // Act
                  const tranactionResponse = await fundMe.cheapWithdraw()
                  const transactionReceipt = await tranactionResponse.wait(1)
                  const { gasUsed, gasPrice } = transactionReceipt
                  const gasCost = gasUsed * gasPrice
                  // assert
                  const endingFundMeBalance = await ethers.provider.getBalance(
                      await fundMe.getAddress()
                  )
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer)
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost
                  )
                  //
                  await expect(fundMe.getFunders(0)).to.be.reverted

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })

              it("Checks for the user to fail withdraw", async function () {
                  attacker = await ethers.getSigner(user)
                  const fundMeAttackerConnect = await fundMe.connect(attacker)
                  await expect(
                      fundMeAttackerConnect.withdraw()
                  ).to.be.revertedWith("FundMe__NotOwner")
              })

              // it("Checks for the attacker to fail withdraw", async function () {
              //     const accounts = await ethers.getSigners()
              //     const attacker = accounts[1]
              //     const attackerConnectContract = await fundMe.connect(attacker)
              //     await expect(attackerConnectContract.withdraw()).to.be.revertedWith(
              //         "FundMe__NotOwner()"
              //     )
              // })
          })

          describe("constructor", async function () {
              it("Sets the aggregator address correctly", async function () {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, await mockV3Aggregator.getAddress())
              })
          })
      })
