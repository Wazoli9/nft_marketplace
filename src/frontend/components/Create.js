import { useEffect, useState } from 'react'
import { ethers, Signer } from "ethers"
import { Row, Form, Button } from 'react-bootstrap'
import { create as ipfsHttpClient } from 'ipfs-http-client'
import { LazyMinter } from './LazyMinter'

const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')

const Create = ({ marketplace, nft, tokenCount, setTokenCount, salesOrders, setSalesOrders, signer }) => {
  useEffect(()=>{
    console.log(salesOrders)
  }, [salesOrders])
  const [image, setImage] = useState('')
  const [price, setPrice] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const uploadToIPFS = async (event) => {
    event.preventDefault()
    const file = event.target.files[0]
    if (typeof file !== 'undefined') {
      try {
        const result = await client.add(file)
        console.log(result)
        setImage(`https://ipfs.infura.io/ipfs/${result.path}`)
      } catch (error){
        console.table("ipfs image upload error: ", error)
      }
    }
  }
  const createNFT = async () => {
    if (!image || !price || !name || !description) return
    try{
      const result = await client.add(JSON.stringify({image, price, name, description}))
      // mintThenList(result)
      storeSalesOrder(result)
    } catch(error) {
      console.log("ipfs uri upload error: ", error)
    }
  }
  const storeSalesOrder = async (result) => {
    const addr = await signer.getAddress()
    console.log(addr)
    const uri = `https://ipfs.infura.io/ipfs/${result.path}`
    const tokenID = tokenCount
    const creator = await signer.getAddress()
    const nftData = {tokenID,price, uri, creator}
    console.log(nftData)
    const signature = await signer._signTypedData(
      {
        name: 'Lazy Marketplace',
        version: '1.0',
        chainId: await signer.getChainId(),
        verifyingContract: marketplace.address,
      },
      {
        SignedNFTData: [
          {name: 'tokenID', type: 'uint256'},
          {name: 'price', type: 'uint256'},
          {name: 'uri', type: 'string'},
          {name: 'creator', type : 'address'},
        ]
      },
      nftData
    );
    const sold = false
    setSalesOrders((prev) => [...prev, {nftData, signature, sold}])
    setTokenCount((prev) => prev + 1)
  }

  const mintNFT = async()=>{
    console.log('buy')
    console.log(salesOrders)
    const lastIndex = salesOrders.length - 1;
    const nftData = salesOrders[lastIndex].nftData
    const signature = salesOrders[lastIndex].signature
    console.log(nftData)
    console.log(signature)
    const tokenID = await marketplace.connect(signer).lazyMintNFT(nftData, signature, nft.address, {value : nftData.price})
    console.log(tokenID)
  }
  // const mintThenList = async (result) => {
  //   const uri = `https://ipfs.infura.io/ipfs/${result.path}`
  //   // mint nft 
  //   await(await nft.mint(uri)).wait()
  //   // get tokenId of new nft 
  //   const id = await nft.tokenCount()
  //   // approve marketplace to spend nft
  //   await(await nft.setApprovalForAll(marketplace.address, true)).wait()
  //   // add nft to marketplace
  //   const listingPrice = ethers.utils.parseEther(price.toString())
  //   await(await marketplace.makeItem(nft.address, id, listingPrice)).wait()
  // }
  return (
    <div className="container-fluid mt-5">
      <button onClick={mintNFT}>
      buy NFT
      </button>
      <div className="row">
        <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
          <div className="content mx-auto">
            <Row className="g-4">
              <Form.Control
                type="file"
                required
                name="file"
                onChange={uploadToIPFS}
              />
              <Form.Control onChange={(e) => setName(e.target.value)} size="lg" required type="text" placeholder="Name" />
              <Form.Control onChange={(e) => setDescription(e.target.value)} size="lg" required as="textarea" placeholder="Description" />
              <Form.Control onChange={(e) => setPrice(ethers.utils.parseEther(e.target.value))} size="lg" required type="number" placeholder="Price in ETH" />
              <div className="d-grid px-0">
                <Button onClick={createNFT} variant="primary" size="lg">
                  Create & List NFT!
                </Button>
              </div>
            </Row>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Create