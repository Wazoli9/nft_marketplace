import { useState, useEffect } from 'react'
import { ethers } from "ethers"
import { Row, Col, Card, Button } from 'react-bootstrap'

const Home = ({ marketplace, nft, salesOrders, signer, setSalesOrders }) => {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  // const loadMarketplaceItems = async () => {
  //   // Load all unsold items
  //   const itemCount = await marketplace.itemCount()
  //   let items = []
  //   for (let i = 1; i <= itemCount; i++) {
  //     const item = await marketplace.items(i)
  //     if (!item.sold) {
  //       // get uri url from nft contract
  //       const uri = await nft.tokenURI(item.tokenId)
  //       // use uri to fetch the nft metadata stored on ipfs 
  //       const response = await fetch(uri)
  //       const metadata = await response.json()
  //       // get total price of item (item price + fee)
  //       const totalPrice = await marketplace.getTotalPrice(item.itemId)
  //       // Add item to items array
  //       items.push({
  //         totalPrice,
  //         itemId: item.itemId,
  //         seller: item.seller,
  //         name: metadata.name,
  //         description: metadata.description,
  //         image: metadata.image
  //       })
  //     }
  //   }
  //   setLoading(false)
  //   setItems(items)
  // }

  const mintNFT = async(data, salesIndex)=>{
    console.log('buy')
    const nftData = data.nftData
    const signature = data.signature
    console.log(nftData)
    console.log(signature)
    console.log(nft.address)
    const tokenID = await marketplace.connect(signer).lazyMintNFT(nftData, signature, nft.address, {value : nftData.price})
    let newSales = [...salesOrders]
    newSales[salesIndex].sold = true
    setSalesOrders(newSales)
  }

  const loadMarketplaceItems = async () => {
    console.log(salesOrders)
    // Load all unsold items
    const itemCount = salesOrders.length
    const signerAddr = await signer.getAddress()
    let items = []
    for (let i = 0; i < itemCount; i++) {
      const item = salesOrders[i].nftData
      console.log(item)
      let res = await fetch(item.uri)
      let uri = await res.json()
      if (!(item.creator == signerAddr) && (salesOrders[i].sold == false)) {
        items.push({
          totalPrice : item.price,
          itemId: item.tokenID,
          seller: item.creator,
          image: uri.image,
          data : salesOrders[i],
          index : i
        })
      }
    }
    setLoading(false)
    setItems(items)
  }

  const buyMarketItem = async (item) => {
    await (await marketplace.purchaseItem(item.itemId, { value: item.totalPrice })).wait()
    loadMarketplaceItems()
  }

  useEffect(() => {
    loadMarketplaceItems()
  }, [signer, salesOrders])

  if (loading) return (
    <main style={{ padding: "1rem 0" }}>
      <h2>Loading...</h2>
    </main>
  )
  return (
    <div className="flex justify-center">
      {items.length > 0 ?
        <div className="px-5 container">
          <Row xs={1} md={2} lg={4} className="g-4 py-5">
            {items.map((item, idx) => (
              <Col key={idx} className="overflow-hidden">
                <Card>
                  <Card.Img variant="top" src={item.image} alt = {item.uri} />
                  <Card.Body color="secondary">
                    <Card.Title>{item.tokenID}</Card.Title>
                    <Card.Text>
                      {item.tokenID}
                    </Card.Text>
                  </Card.Body>
                  <Card.Footer>
                    <div className='d-grid'>
                      <Button onClick={() => mintNFT(item.data, item.index)} variant="primary" size="lg">
                        Buy for {ethers.utils.formatEther(item.totalPrice)} ETH
                      </Button>
                    </div>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
        : (
          <main style={{ padding: "1rem 0" }}>
            <h2>No listed assets</h2>
          </main>
        )}
    </div>
  );
}
export default Home