//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@rari-capital/solmate/src/tokens/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LCOAPassport is ERC721, Ownable {
    address public SIGNER;

    string public BASE_URI;

    uint256 currentPriorityId = 1;
    uint256 currentAverageId = 201;

    mapping(address => bool) public walletHasMinted;

    constructor() ERC721("LCOAPassport", "LCOAP") {}

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
        bytes32 hash = keccak256(abi.encodePacked(passportType, msg.sender));

        require(verifyHash(hash,v,r,s) == SIGNER, "Sig not valid!");

        require(
            !walletHasMinted[msg.sender],
            "Wallet has already minted a passport!"
        );

        //Mark minted before minting.
        walletHasMinted[msg.sender] = true;

        if (passportType == 0) {
            require(currentPriorityId < 200);
            _mint(msg.sender, currentPriorityId);
            ++currentPriorityId;
            return;
        }

        if (passportType == 1) {
            require(currentAverageId < 2000);
            _mint(msg.sender, currentAverageId);
            ++currentAverageId;
            return;
        }
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
