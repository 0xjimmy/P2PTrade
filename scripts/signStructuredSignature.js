const { ethers } = require("hardhat");

async function main() {

  const signer = (await ethers.getSigners())[0]

  const domain = {
    name: 'P2PTrade',
    version: '1',
    chainId: 1,
    verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC'
  }

  const types = {
    Items: [
      { name: 'assetType', type: 'uint8' },
      { name: 'contractAddress', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'id', type: 'uint256' }
    ],
    SwapSignature: [
      { name: 'send', type: 'Items[]' },
      { name: 'receive', type: 'Items[]' },
      { name: 'counterParty', type: 'address' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' }
    ]
  }

  const value = {
    send: [
      {
        assetType: 1,
        contractAddress: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
        amount: 1,
        id: 12
      }
    ],
    receive: [
      {
        assetType: 1,
        contractAddress: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
        amount: 1,
        id: 4
      },
      {
        assetType: 2,
        contractAddress: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
        amount: 3,
        id: 6
      }
    ],
    counterParty: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
    nonce: 3,
    deadline: 1893409200 
  }

  const signature = await signer._signTypedData(domain, types, value)
  let { v, r, s } = ethers.utils.splitSignature(signature)

  console.log({ v, r, s })
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
