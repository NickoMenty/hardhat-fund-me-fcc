// SPDX-License-Identifier: MIT
// Pragma
pragma solidity ^0.8.8;
// Imports
import "./PriceConverter.sol";
// Error Codes
error FundMe__NotOwner();
error FundMe__NotEnoughETH();
error CallFailed();

/** @title A contract for crowd funding
 *  @author NykodymB
 *  @notice This contract is to demo a sample a funding contract
 *  @dev This implements Price Feeds as our library
 */
contract FundMe {
    // Type Declarations
    using PriceConverter for uint256;

    // State Variables!
    // constant - we apply to variables that we are positive that they won't change
    // doing so we cut gas costs to run functions
    // !!!! We only apply constant to variables outside of the functions
    uint256 public constant MINIMUN_USD = 1 * 1e18;

    address[] private s_funders;
    mapping(address => uint256) private s_addressToAmountFunded;

    // immutable - we apply to variables that we are positive they won't change, BUT
    // we use immutable for variables that are used in other functions
    // immutable also cuts gas fees
    address private immutable i_owner;

    AggregatorV3Interface private s_priceFeed;

    // modifier is
    modifier onlyOwner() {
        // _;  // if we use it before than the require function will play only after the main function

        // we substituted "require" for "if" to save gas
        // require(msg.sender == i_owner, "Sender is not owner!");
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }

        _; // if we use it after than the require function will play before the main function
    }

    constructor(address s_priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(s_priceFeedAddress);
    }

    // if smbd sends ETH to the contract without using "fund" function, then it won't be added to the array nor mapping
    // but if we have "recieve" function it will catch it
    // BUT only if they don't transfer any data!
    receive() external payable {
        fund();
    }

    // same rules apply to the "fallback", BUT it also can recive data.
    fallback() external payable {
        fund();
    }

    /**  @notice This function funds this contract
     *    @dev This implements Price Feeds as our library
     */
    function fund() public payable {
        if (msg.value.getConversionRate(s_priceFeed) <= MINIMUN_USD) {
            revert FundMe__NotEnoughETH();
        }
        // value of eth has 18 decimals
        s_funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] = msg.value;
    }

    function withdraw() public onlyOwner {
        // DIFFERENCE between "=" and "=="
        // (msg.sender == owner) - Is the sender is the owner? / a.k.a equivalence
        // (msg.sender = owner) - msg.sender is now the owner. / a.k.a setting
        // require(msg.sender == owner, "Sender is not owner!");

        // for loop
        // [a, b, c, d]
        // 0. 1. 2. 3.
        // for(starting index, ending index, step amount);
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex = funderIndex + 1
        ) {
            // code
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        //reset the array
        s_funders = new address[](0);

        // transfer method, this method has cap 2300 gas
        // transfer method will return if fails in any way
        // msg.sender = address
        // -----------------
        // payable(msg.sender) = payable address
        // payable(msg.sender).transfer(address(this).balance);

        // send method, this method also has cap 2300 gas
        // send method won't return without "require function"
        // ---------------------
        // bool sendSuccess = payable(msg.sender).send(address(this).balance);
        // require(sendSuccess, "Send failed");

        // call method
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        // require(callSuccess, "Call failed");
        // we can also do this below:
        if (callSuccess != true) {
            revert CallFailed();
        }
    }

    function cheapWithdraw() public payable onlyOwner {
        address[] memory funders = s_funders;
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }

        s_funders = new address[](0);
        (bool callSuccess, ) = i_owner.call{value: address(this).balance}("");
        if (callSuccess != true) {
            revert CallFailed();
        }
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunders(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(
        address funder
    ) public view returns (uint256) {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
