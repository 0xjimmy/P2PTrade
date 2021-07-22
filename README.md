# P2PTrade
Peer to peer swap middleman for ERC20, ERC721 and ERC1155 assets

## Usage

*Usage and implementation is at users own risk, no tests have been done or security has been audited*

### Prerequisites
- All assets much have their respective allowances made for the *P2PTrade* contact to transfer them
- *walletB* must have provided a signature of the trade

## Executing a swap

- `fromA`: Assets `msg.sender` will send to `walletB`
- `fromB`: Assets `walletB` will send to `msg.sender`
- `deadline`: UNIX timestamp that the trade must be executed before (seconds)
- `walletB`: Party trading with the `msg.sender`
- `aNonce`: Trade nonce of `msg.sender`, must be the next integer after the last used nonce for address
- `bNonce`: Trade nonce of `walletB`, must be the next integer after the last used nonce for address
- `v`, `r`, `s`: Signature of the hashed swap parameters signed by `walletB` 

```js
  P2PTrade.swap(Items[] calldata fromA, Items[] calldata fromB, uint256 deadline, address walletB, uint256 aNonce, uint256 bNonce, uint8 v, bytes32 r, bytes32 s)
```

## TODO
* Implement [EIP712](https://eips.ethereum.org/EIPS/eip-712) signature verification (EIP712 Domain Seperator is implemented but not utilized)
* Add Tests
* Create deploy script
* Create example interaction with [ethers](https://github.com/ethers-io/ethers.js)
