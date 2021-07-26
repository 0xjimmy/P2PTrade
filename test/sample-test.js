const {
  expect
} = require("chai");

describe("Peer-To-Peer Swap", function () {
  
  it("Wallet A Swaps 15 Doge(ERC20) for 21 Shiba(ERC20) from Wallet B ", async function () {
    const [walletA, walletB] = await ethers.getSigners()

    //Doge ERC20 Contract
    const Doge = await ethers.getContractFactory("WrappedDoge");
    const doge = await Doge.deploy();
    await doge.deployed();

    //Wallet A has been minted 15 Doge from Wallet A (walletA)
    const mintDogeTx = await doge.mint(walletA.address, "15000000000000000000")
    await mintDogeTx.wait();

    //Shiba ERC20 Contract
    const Shiba = await ethers.getContractFactory("WrappedShiba");
    const shiba = await Shiba.deploy();
    await shiba.deployed();

    //Wallet B has been minted 21 Shiba from Wallet A (walletA)
    const mintShibaTx = await shiba.mint(walletB.address, "21000000000000000000")
    await mintShibaTx.wait();

    //Check Balances before Trade
    expect(await shiba.balanceOf(walletB.address)).to.equal("21000000000000000000");
    expect(await doge.balanceOf(walletB.address)).to.equal("0");

    expect(await doge.balanceOf(walletA.address)).to.equal("15000000000000000000");
    expect(await shiba.balanceOf(walletA.address)).to.equal("0");
    

    //Peer-to-peer trade
    const P2P = await ethers.getContractFactory("P2PTrade");
    const p2p = await P2P.deploy();
    await p2p.deployed();

    //Approve Doge Allowance of Wallet A
    const approveDogeTx = await doge.approve(p2p.address, "15000000000000000000")
    await approveDogeTx.wait();

    //Approve Shiba Allowance of Wallet B
    const walletBShibaContract = await shiba.connect(walletB)
    const approveShibaTx = await walletBShibaContract.approve(p2p.address, "21000000000000000000")
    await approveShibaTx.wait();

    const fromA = [{
      assetType: 0,
      contractAddress: doge.address,
      amount: ethers.utils.parseEther("15"),
      id: 0
    }]

    const fromB = [{
      assetType: 0,
      contractAddress: shiba.address,
      amount: ethers.utils.parseEther("21"),
      id: 0
    }]

    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    const aNonce = 0;
    const bNonce = 0;

    const sig = await walletBSignature(walletB,fromB,fromA, walletA.address, bNonce, deadline)
    const v = sig.v;
    const r = sig.r;
    const s = sig.s;

    const verifyTX = await p2p.verify(fromA, fromB, walletB.address, bNonce, deadline, v, r, s)
    expect(verifyTX).to.equal(true);
    
    const tradeTX = await p2p.swap(fromA, fromB, deadline, walletB.address, aNonce, bNonce, v, r, s)
    await tradeTX.wait();

    expect(await shiba.balanceOf(walletB.address)).to.equal("0");
    expect(await doge.balanceOf(walletB.address)).to.equal("15000000000000000000");

    expect(await doge.balanceOf(walletA.address)).to.equal("0");
    expect(await shiba.balanceOf(walletA.address)).to.equal("21000000000000000000");

  });
});

async function walletBSignature(_signer, _send,_acquire, _counterParty, _nonce, _deadline) {

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
      { name: 'acquire', type: 'Items[]' },
      { name: 'counterParty', type: 'address' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' }
    ]
  }

  const value = {
    send: _send,
    acquire: _acquire,
    counterParty: _counterParty,
    nonce: _nonce,
    deadline: _deadline 
  }

  const signature = await _signer._signTypedData(domain,types,value)
  let { v, r, s } = ethers.utils.splitSignature(signature)

  return {v, r, s}


}