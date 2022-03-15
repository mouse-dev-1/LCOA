//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@rari-capital/solmate/src/tokens/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract _2052Passport is ERC721, Ownable {
    address public SIGNER;

    string public BASE_URI;

    uint256 totalSupply = 0;

    mapping(address => bool) public walletHasMinted;

    constructor() ERC721("2052 Passport", "205Z") {}

    function verifyHash(
        bytes32 hash,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public pure returns (address signer) {
        bytes32 messageDigest = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)
        );

        return ecrecover(messageDigest, v, r, s);
    }

    function mintPassport(
        uint8 passportType,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public {
        require(totalSupply < 2000);
        require(
            !walletHasMinted[msg.sender],
            "Wallet has already minted a passport!"
        );

        require(verifyHash(keccak256(abi.encodePacked(passportType, msg.sender)), v, r, s) == SIGNER,"Sig not valid!");

        //Mark minted before minting.
        walletHasMinted[msg.sender] = true;

        _mint(msg.sender, totalSupply);
        ++totalSupply;
    }

    function tokenURI(uint256 id) public view override returns (string memory) {
        return string(abi.encodePacked(BASE_URI, id));
    }

    function setBaseURI(string memory _baseURI) public onlyOwner {
        BASE_URI = _baseURI;
    }

    function setSigner(address _signer) public onlyOwner {
        SIGNER = _signer;
    }
}
