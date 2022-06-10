// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./NFT.sol";

contract NFTCollection1 is NFT {

    constructor(address marketplace_) NFT("NFTCollection1", "NFT1", marketplace_){
        
    }
}