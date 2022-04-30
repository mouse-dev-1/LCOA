//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

/*

_2052Passport.sol

Written by: mousedev.eth

*/

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract _2052Passport is ERC721Enumerable, Ownable {
    address public SIGNER;

    string public BASE_URI;

    string public CONTRACT_URI;

    mapping(address => bool) public walletHasMinted;

    //EIP2981
    uint256 private _royaltyBps;
    address payable private _royaltyRecipient;
    bytes4 private constant _INTERFACE_ID_ROYALTIES_EIP2981 = 0x2a55205a;

    constructor() ERC721("2052 Passport", "205Z") {}

    /*

   __  __                  ______                 __  _                 
  / / / /_______  _____   / ____/_  ______  _____/ /_(_)___  ____  _____
 / / / / ___/ _ \/ ___/  / /_  / / / / __ \/ ___/ __/ / __ \/ __ \/ ___/
/ /_/ (__  )  __/ /     / __/ / /_/ / / / / /__/ /_/ / /_/ / / / (__  ) 
\____/____/\___/_/     /_/    \__,_/_/ /_/\___/\__/_/\____/_/ /_/____/  
                                                                        

*/

    function mintPassport(
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public {
        uint256 _totalSupply = totalSupply();
        require(_totalSupply + 1 <= 2000);
        require(
            !walletHasMinted[msg.sender],
            "Wallet has already minted a passport!"
        );

        require(
            verifyHash(keccak256(abi.encodePacked(msg.sender)), v, r, s) ==
                SIGNER,
            "Sig not valid!"
        );

        //Mark minted before minting.
        walletHasMinted[msg.sender] = true;

        _mint(msg.sender, _totalSupply);
    }


/*

    _____   __________________  _   _____    __       ________  ___   ______________________  _   _______
   /  _/ | / /_  __/ ____/ __ \/ | / /   |  / /      / ____/ / / / | / / ____/_  __/  _/ __ \/ | / / ___/
   / //  |/ / / / / __/ / /_/ /  |/ / /| | / /      / /_  / / / /  |/ / /     / /  / // / / /  |/ /\__ \ 
 _/ // /|  / / / / /___/ _, _/ /|  / ___ |/ /___   / __/ / /_/ / /|  / /___  / / _/ // /_/ / /|  /___/ / 
/___/_/ |_/ /_/ /_____/_/ |_/_/ |_/_/  |_/_____/  /_/    \____/_/ |_/\____/ /_/ /___/\____/_/ |_//____/  
                                                                                                         

*/

    function verifyHash(
        bytes32 hash,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal pure returns (address signer) {
        bytes32 messageDigest = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)
        );

        return ecrecover(messageDigest, v, r, s);
    }

    /*
 _    ___                 ______                 __  _                 
| |  / (_)__ _      __   / ____/_  ______  _____/ /_(_)___  ____  _____
| | / / / _ \ | /| / /  / /_  / / / / __ \/ ___/ __/ / __ \/ __ \/ ___/
| |/ / /  __/ |/ |/ /  / __/ / /_/ / / / / /__/ /_/ / /_/ / / / (__  ) 
|___/_/\___/|__/|__/  /_/    \__,_/_/ /_/\___/\__/_/\____/_/ /_/____/  
                                                                       
*/

    function tokenURI(uint256 id) public view override returns (string memory) {
        require(_exists(id), "Token does not exist!");
        return string(abi.encodePacked(BASE_URI, Strings.toString(id)));
    }

    function walletOfOwner(address _owner)
        external
        view
        returns (uint256[] memory)
    {
        uint256 tokenCount = balanceOf(_owner);

        uint256[] memory tokensId = new uint256[](tokenCount);
        for (uint256 i = 0; i < tokenCount; i++) {
            tokensId[i] = tokenOfOwnerByIndex(_owner, i);
        }

        return tokensId;
    }

    function contractURI() public view returns (string memory) {
        return CONTRACT_URI;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721Enumerable)
        returns (bool)
    {
        return
            super.supportsInterface(interfaceId) ||
            interfaceId == _INTERFACE_ID_ROYALTIES_EIP2981;
    }

    function royaltyInfo(uint256, uint256 value)
        external
        view
        returns (address, uint256)
    {
        return (_royaltyRecipient, (value * _royaltyBps) / 10000);
    }

    /*
   ____                              ______                 __  _                 
  / __ \_      ______  ___  _____   / ____/_  ______  _____/ /_(_)___  ____  _____
 / / / / | /| / / __ \/ _ \/ ___/  / /_  / / / / __ \/ ___/ __/ / __ \/ __ \/ ___/
/ /_/ /| |/ |/ / / / /  __/ /     / __/ / /_/ / / / / /__/ /_/ / /_/ / / / (__  ) 
\____/ |__/|__/_/ /_/\___/_/     /_/    \__,_/_/ /_/\___/\__/_/\____/_/ /_/____/  
                                                                                  
*/

    function setBaseURI(string memory _baseURI) public onlyOwner {
        BASE_URI = _baseURI;
    }

    function setSigner(address _signer) public onlyOwner {
        SIGNER = _signer;
    }

    function setContractURI(string memory _contractURI) public onlyOwner {
        CONTRACT_URI = _contractURI;
    }

    /**
     * ROYALTY FUNCTIONS
     */
    function updateRoyalties(address payable recipient, uint256 bps)
        external
        onlyOwner
    {
        _royaltyRecipient = recipient;
        _royaltyBps = bps;
    }
}
