// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

/*

CYNQUE.sol

Written by: mousedev.eth

*/

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CYNQUE is ERC721, Ownable {
    using Strings for uint256;

    string public baseURI;
    string public contractURI;
    uint256 public nextTokenId = 1;

    uint256 public passportSaleStartTime;
    uint256 public publicSaleStartTime;

    address public passportAddress;

    mapping(uint256 => bool) public passportHasMinted;

    mapping(uint256 => uint256) public passportToCynque;
    mapping(uint256 => uint256) public cynqueToPassport;

    //EIP2981
    uint256 private _royaltyBps;
    address private _royaltyRecipient;
    bytes4 private constant _INTERFACE_ID_ROYALTIES_EIP2981 = 0x2a55205a;

    //Custom errors
    error PassportSaleNotLive();
    error PublicSaleNotLive();
    error NotOwnerOfCynque();
    error TeamMintAlreadyDone();

    error MaxSupplyExceeded();
    error PassportAlreadyMinted();
    error NotOwnerOfPassport();
    error NotEnoughEtherSent();

    constructor()
        ERC721("Lost Children of Andromeda - CYNQUE Prototype", "CYNQUE")
    {}

    /*

   __  __                  ______                 __  _
  / / / /_______  _____   / ____/_  ______  _____/ /_(_)___  ____  _____
 / / / / ___/ _ \/ ___/  / /_  / / / / __ \/ ___/ __/ / __ \/ __ \/ ___/
/ /_/ (__  )  __/ /     / __/ / /_/ / / / / /__/ /_/ / /_/ / / / (__  )
\____/____/\___/_/     /_/    \__,_/_/ /_/\___/\__/_/\____/_/ /_/____/


*/


    function teamMint() external onlyOwner {
        if (nextTokenId > 1) revert TeamMintAlreadyDone();

        for (uint256 i = 0; i < 40; i++) {
            mintCynque();
        }
    }

    function mintCynqueWithoutPassport() external payable {
        //Require cynque sale has started
        if (block.timestamp < publicSaleStartTime) revert PassportSaleNotLive();

        if (msg.value < 0.2 ether) revert NotEnoughEtherSent();

        //Call internal method
        mintCynque();
    }

    function mintCynqueWithPassports(uint256[] memory passportIds)
        external
        payable
    {
        //Require cynque sale has started
        if (block.timestamp < passportSaleStartTime)
            revert PassportSaleNotLive();

        if (msg.value < (0.2 ether * passportIds.length))
            revert NotEnoughEtherSent();

        for (uint256 i = 0; i < passportIds.length; i++) {
            //Require this passport hasn't minted
            if (passportHasMinted[passportIds[i]] == true)
                revert PassportAlreadyMinted();

            //Make sure they own this passport
            if (IERC721(passportAddress).ownerOf(passportIds[i]) != msg.sender)
                revert NotOwnerOfPassport();

            //Mark minted before minting.
            passportHasMinted[passportIds[i]] = true;

            //Store that this passport is connected to the next cynque
            passportToCynque[passportIds[i]] = nextTokenId;

            //Store that the next cynque is connected to this passport
            cynqueToPassport[nextTokenId] = passportIds[i];

            //Call internal method
            mintCynque();
        }
    }

    function cynqueronize(uint256 passportId, uint256 cynqueId) external {
        //Make sure they own this passport
        if (IERC721(passportAddress).ownerOf(passportId) != msg.sender)
            revert NotOwnerOfPassport();

        //Make sure they own this passport
        if (ownerOf(cynqueId) != msg.sender) revert NotOwnerOfCynque();

        //Store that this passport is connected to this cynque.
        passportToCynque[passportId] = cynqueId;

        //Store that this cynque is connected to this passport.
        cynqueToPassport[cynqueId] = passportId;
    }

    function mintCynque() internal {
        //Require under max supply
        if (nextTokenId > 1111) revert MaxSupplyExceeded();

        _mint(msg.sender, nextTokenId);

        unchecked {
            ++nextTokenId;
        }
    }

    /*
 _    ___                 ______                 __  _
| |  / (_)__ _      __   / ____/_  ______  _____/ /_(_)___  ____  _____
| | / / / _ \ | /| / /  / /_  / / / / __ \/ ___/ __/ / __ \/ __ \/ ___/
| |/ / /  __/ |/ |/ /  / __/ / /_/ / / / / /__/ /_/ / /_/ / / / (__  )
|___/_/\___/|__/|__/  /_/    \__,_/_/ /_/\___/\__/_/\____/_/ /_/____/

*/

    function walletOfOwner(address _address)
        public
        view
        virtual
        returns (uint256[] memory)
    {
        //Thanks 0xinuarashi for da inspo

        uint256 _balance = balanceOf(_address);
        uint256[] memory _tokens = new uint256[](_balance);
        uint256 _addedTokens;
        for (uint256 i = 1; i <= totalSupply(); i++) {
            if (ownerOf(i) == _address) {
                _tokens[_addedTokens] = i;
                _addedTokens++;
            }

            if (_addedTokens == _balance) break;
        }
        return _tokens;
    }

    function totalSupply() public view returns (uint256) {
        return nextTokenId - 1;
    }

    function tokenURI(uint256 id) public view override returns (string memory) {
        require(_exists(id), "Token does not exist!");
        return string(abi.encodePacked(baseURI, id.toString()));
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override
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

    function setBaseURI(string calldata _baseURI) external onlyOwner {
        baseURI = _baseURI;
    }

    function setContractURI(string calldata _contractURI) external onlyOwner {
        contractURI = _contractURI;
    }

    function setPassportAddress(address _passportAddress) external onlyOwner {
        passportAddress = _passportAddress;
    }

    function setPassportSaleStartTime(uint256 _passportSaleStartTime)
        external
        onlyOwner
    {
        passportSaleStartTime = _passportSaleStartTime;
    }

    function setPublicSaleStartTime(uint256 _publicSaleStartTime)
        external
        onlyOwner
    {
        publicSaleStartTime = _publicSaleStartTime;
    }

    function withdraw() public onlyOwner {
        (bool succ, ) = payable(msg.sender).call{value: address(this).balance}(
            ""
        );
        require(succ, "transfer failed");
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
