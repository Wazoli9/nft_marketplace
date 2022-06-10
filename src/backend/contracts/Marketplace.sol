// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";

import "@openzeppelin/contracts/utils/Address.sol";

import "hardhat/console.sol";

import "./NFT.sol";

contract Marketplace is ReentrancyGuard, EIP712 {

    // Variables
    address payable public immutable feeAccount; // the account that receives fees
    uint public immutable feePercent; // the fee percentage on sales 
    uint public itemCount; 

    struct SignedNFTData {
        uint256 tokenID;
        uint256 price;
        string uri;
        address creator;
        // string category;
    }

    struct Item {
        uint itemId;
        address nft;
        uint tokenId;
        uint price;
        address payable buyer;
        bool sold;
        string category;
    }

    // itemId -> Item
    mapping(uint => Item) public items;

    // event Offered(
    //     uint itemId,
    //     address indexed nft,
    //     uint tokenId,
    //     uint price,
    //     address indexed creator,
    //     string indexed category
    // );

    event Bought(
        uint itemId,
        string indexed category,
        uint tokenId,
        uint price,
        address indexed creator,
        address indexed buyer
    );

    constructor(uint _feePercent) EIP712("Lazy Marketplace", "1.0") {
        feeAccount = payable(msg.sender);
        feePercent = _feePercent;
    }

    // // Make item to offer on the marketplace
    // function makeItem(IERC721 _nft, uint _tokenId, uint _price) external nonReentrant {
    //     require(_price > 0, "Price must be greater than zero");
    //     // increment itemCount
    //     itemCount ++;
    //     // transfer nft
    //     _nft.transferFrom(msg.sender, address(this), _tokenId);
    //     // add new item to items mapping
    //     items[itemCount] = Item (
    //         itemCount,
    //         _nft,
    //         _tokenId,
    //         _price,
    //         payable(msg.sender),
    //         false
    //     );
    //     // emit Offered event
    //     emit Offered(
    //         itemCount,
    //         address(_nft),
    //         _tokenId,
    //         _price,
    //         msg.sender
    //     );
    // }

    function lazyMintNFT(
      SignedNFTData calldata nft, bytes calldata signature, address nftContract
    ) public payable returns (uint256) {
        console.log(nft.creator);
        require(msg.value == nft.price, 'SimonDevNFT: Message value != price');
        address signer = _validateSignature(_hash(nft), signature);
        require(signer == nft.creator, 'invalid signature');
        NFT(nftContract).safeMint(msg.sender, nft.uri);
        Address.sendValue(payable(nft.creator), msg.value);
        itemCount ++;
        items[itemCount] = Item (
            itemCount,
            nftContract,
            nft.tokenID,
            nft.price,
            payable(msg.sender),
            true,
            '' //category
        );
        emit Bought(
        itemCount,
        '', //category
        nft.tokenID,
        nft.price,
        nft.creator,
        msg.sender
        );
        return nft.tokenID;
    }

    function _hash(
      SignedNFTData calldata nft
    ) internal view returns (bytes32) {
        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    keccak256("SignedNFTData(uint256 tokenID,uint256 price,string uri,address creator)"),
                    nft.tokenID, nft.price, keccak256(bytes(nft.uri)), nft.creator
        )));
        return digest;
    }

    function _validateSignature(bytes32 digest, bytes memory signature) internal view returns (address) {
        address signer = ECDSA.recover(digest, signature);
        return signer;
    }

    // function purchaseItem(uint _itemId) external payable nonReentrant {
    //     uint _totalPrice = getTotalPrice(_itemId);
    //     Item storage item = items[_itemId];
    //     require(_itemId > 0 && _itemId <= itemCount, "item doesn't exist");
    //     require(msg.value >= _totalPrice, "not enough ether to cover item price and market fee");
    //     require(!item.sold, "item already sold");
    //     // pay seller and feeAccount
    //     item.seller.transfer(item.price);
    //     feeAccount.transfer(_totalPrice - item.price);
    //     // update item to sold
    //     item.sold = true;
    //     // transfer nft to buyer
    //     item.nft.transferFrom(address(this), msg.sender, item.tokenId);
    //     // emit Bought event
    //     emit Bought(
    //         _itemId,
    //         address(item.nft),
    //         item.tokenId,
    //         item.price,
    //         item.seller,
    //         msg.sender
    //     );
    // }
    function getTotalPrice(uint _itemId) view public returns(uint){
        return((items[_itemId].price*(100 + feePercent))/100);
    }
}
