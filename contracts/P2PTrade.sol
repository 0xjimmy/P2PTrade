//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.4;

import './ReentrancyGuard.sol';

contract P2PTrade is ReentrancyGuard {
    event Swap(address walletA, address walletB, Items[] fromA, Items[] fromB);
    mapping(address => uint256) public nonces;
   
    struct EIP712Domain {
        string name;
        string version;
        uint256 chainId;
        address verifyingContract;
    }
    bytes32 constant private EIP712DOMAIN_TYPEHASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );

    bytes32 immutable public DOMAIN_SEPARATOR;

    constructor() {
        DOMAIN_SEPARATOR = keccak256(abi.encode(
            EIP712DOMAIN_TYPEHASH,
            keccak256(bytes("P2PTrade")),
            keccak256(bytes("1")),
            1,
            address(this)
        ));
    }

    uint8 constant private ERC20 = 0;
    uint8 constant private ERC721 = 1;
    uint8 constant private ERC1155 = 2;

    struct Items {
        uint8 assetType;
        address contractAddress;
        uint256 amount;
        uint256 id;
    }

    bytes4 private constant ERC20_SELECTOR = bytes4(keccak256(bytes('transferFrom(address,address,uint256)')));
    function safeERC20TransferFrom(address token, address from, address to, uint value) private {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(ERC20_SELECTOR, from, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'ERC20: TRANSFER_FAILED');
    }
    bytes4 private constant ERC721_SELECTOR = bytes4(keccak256(bytes('safeTransferFrom(address,address,uint256)')));
    function safeERC721TransferFrom(address token, address from, address to, uint256 id) private {
        (bool success,) = token.call(abi.encodeWithSelector(ERC721_SELECTOR, from, to, id));
        require(success, 'ERC721: TRANSFER_FAILED');
    }
    bytes4 private constant ERC1155_SELECTOR = bytes4(keccak256(bytes('safeTransferFrom(address,address,uint256,bytes)')));
    function safeERC1155TransferFrom(address token, address from, address to, uint256 amount, uint256 id) private {
        (bool success,) = token.call(abi.encodeWithSelector(ERC1155_SELECTOR, from, to, amount, id, ""));
        require(success, 'ERC1155: TRANSFER_FAILED');
    }

    function hashItems(Items[] calldata items) internal pure returns (bytes32) {
        bytes32 sum;
        for (uint i = 0; i < items.length; i++) {
            sum = keccak256(abi.encodePacked(sum, items[i].assetType, items[i].contractAddress, items[i].amount, items[i].id));
        }
        return sum;
    }

    // Assumes both parties have approved all assets being traded to be spent by the P2PTrade contract
    // {A} Refers to the swap() caller, {B} refers to owner of the signiture
    function swap(Items[] calldata fromA, Items[] calldata fromB, uint256 deadline, address walletB, uint256 aNonce, uint256 bNonce, uint8 v, bytes32 r, bytes32 s) public nonReentrant {
        require(block.timestamp >= deadline, "Past Deadline");
        require(nonces[msg.sender] == aNonce && nonces[walletB] == bNonce, "Invalid Nonce");
        {
            bytes32 swapHash = keccak256(abi.encodePacked(hashItems(fromA), hashItems(fromB), deadline, msg.sender, walletB, aNonce, bNonce));
            require(ecrecover(swapHash, v, r, s) == walletB, "Invalid Signiture");
        }
        for (uint i = 0; i < fromA.length; i++) {
            Items calldata item = fromA[i];
            if (item.assetType == ERC20) safeERC20TransferFrom(item.contractAddress, msg.sender, walletB, item.amount);
            else if (item.assetType == ERC721) safeERC721TransferFrom(item.contractAddress, msg.sender, walletB, item.id);
            else if (item.assetType == ERC1155) safeERC1155TransferFrom(item.contractAddress, msg.sender, walletB, item.amount, item.id);
        }
        for (uint i = 0; i < fromB.length; i++) {
            Items calldata item = fromB[i];
            if (item.assetType == ERC20) safeERC20TransferFrom(item.contractAddress, walletB, msg.sender, item.amount);
            else if (item.assetType == ERC721) safeERC721TransferFrom(item.contractAddress, walletB, msg.sender, item.id);
            else if (item.assetType == ERC1155) safeERC1155TransferFrom(item.contractAddress, walletB, msg.sender, item.amount, item.id);
        }
        nonces[msg.sender] = nonces[msg.sender] + 1;
        nonces[walletB] = nonces[walletB] + 1;
        emit Swap(msg.sender, walletB, fromA, fromB);
    }

}
