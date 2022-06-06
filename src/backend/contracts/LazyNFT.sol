// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "hardhat/console.sol";


contract LazyNFT is ERC721URIStorage, Ownable, EIP712 {

  struct SignedNFTData {
    uint256 tokenID;
    uint256 price;
    string uri;
    address creator;
  }

  constructor() ERC721("LazyNFT", "LAZY2") EIP712("LAZY2", "1.0") {}

  function lazyMintNFT(
      SignedNFTData calldata nft, bytes calldata signature
  ) public payable returns (uint256) {
    console.log(nft.creator);
    require(msg.value == nft.price, 'SimonDevNFT: Message value != price');
    address signer = _validateSignature(_hash(nft), signature);
    require(signer == nft.creator, 'invalid signature');

    _safeMint(_msgSender(), nft.tokenID);
    _setTokenURI(nft.tokenID, nft.uri);
    Address.sendValue(payable(nft.creator), msg.value);

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
}
