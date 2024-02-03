// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IDAO} from "../lib/osx-commons/contracts/src/dao/IDAO.sol";
import {PermissionLib} from "../lib/osx-commons/contracts/src/permission/PermissionLib.sol";
import {
    PluginUpgradeableSetup,
    IPluginSetup
} from "../lib/osx-commons/contracts/src/plugin/setup/PluginUpgradeableSetup.sol";
import {ERC1967Proxy} from "../lib/openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {TagVoting, ITagManagerExtended, MajorityVotingBase} from "./TagVoting.sol";

// From https://github.com/aragon/osx/blob/develop/packages/contracts/src/core/dao/DAO.sol
// Getting this contract to compile just for this constant is not worth the effort.
bytes32 constant EXECUTE_PERMISSION_ID = keccak256("EXECUTE_PERMISSION");

// Based on https://github.com/aragon/osx/blob/develop/packages/contracts/src/plugins/governance/majority-voting/addresslist/AddresslistVotingSetup.sol
contract TagVotingSetup is PluginUpgradeableSetup {
    /// @notice The contract constructor, that deploys the `TagVoting` plugin logic contract.
    constructor() PluginUpgradeableSetup(address(new TagVoting())) {}

    /// @inheritdoc IPluginSetup
    function prepareInstallation(address _dao, bytes calldata _data)
        external
        returns (address plugin, PreparedSetupData memory preparedSetupData)
    {
        // Decode `_data` to extract the params needed for deploying and initializing `TagVoting` plugin.
        (MajorityVotingBase.VotingSettings memory votingSettings, ITagManagerExtended tagManager, bytes32 tag) =
            abi.decode(_data, (MajorityVotingBase.VotingSettings, ITagManagerExtended, bytes32));

        // Prepare and Deploy the plugin proxy.
        plugin = address(
            new ERC1967Proxy(
                IMPLEMENTATION,
                abi.encodeWithSelector(TagVoting.initialize.selector, _dao, votingSettings, tagManager, tag)
            )
        );

        // Prepare permissions
        PermissionLib.MultiTargetPermission[] memory permissions = new PermissionLib.MultiTargetPermission[](3);

        // Set permissions to be granted.
        // Grant the list of permissions of the plugin to the DAO.
        permissions[0] = PermissionLib.MultiTargetPermission(
            PermissionLib.Operation.Grant,
            plugin,
            _dao,
            PermissionLib.NO_CONDITION,
            TagVoting(IMPLEMENTATION).UPDATE_VOTING_SETTINGS_PERMISSION_ID()
        );

        permissions[1] = PermissionLib.MultiTargetPermission(
            PermissionLib.Operation.Grant,
            plugin,
            _dao,
            PermissionLib.NO_CONDITION,
            TagVoting(IMPLEMENTATION).UPGRADE_PLUGIN_PERMISSION_ID()
        );

        // Grant `EXECUTE_PERMISSION` of the DAO to the plugin.
        permissions[2] = PermissionLib.MultiTargetPermission(
            PermissionLib.Operation.Grant, _dao, plugin, PermissionLib.NO_CONDITION, EXECUTE_PERMISSION_ID
        );

        preparedSetupData.permissions = permissions;
    }

    /// @inheritdoc IPluginSetup
    function prepareUninstallation(address _dao, SetupPayload calldata _payload)
        external
        view
        returns (PermissionLib.MultiTargetPermission[] memory permissions)
    {
        // Prepare permissions
        permissions = new PermissionLib.MultiTargetPermission[](3);

        // Set permissions to be Revoked.
        permissions[0] = PermissionLib.MultiTargetPermission(
            PermissionLib.Operation.Revoke,
            _payload.plugin,
            _dao,
            PermissionLib.NO_CONDITION,
            TagVoting(IMPLEMENTATION).UPDATE_VOTING_SETTINGS_PERMISSION_ID()
        );

        permissions[1] = PermissionLib.MultiTargetPermission(
            PermissionLib.Operation.Revoke,
            _payload.plugin,
            _dao,
            PermissionLib.NO_CONDITION,
            TagVoting(IMPLEMENTATION).UPGRADE_PLUGIN_PERMISSION_ID()
        );

        permissions[2] = PermissionLib.MultiTargetPermission(
            PermissionLib.Operation.Revoke, _dao, _payload.plugin, PermissionLib.NO_CONDITION, EXECUTE_PERMISSION_ID
        );
    }

    /// @inheritdoc IPluginSetup
    function prepareUpdate(address _dao, uint16 _fromBuild, SetupPayload calldata _payload)
        external
        returns (bytes memory initData, PreparedSetupData memory preparedSetupData)
    {
        // V1
    }
}
