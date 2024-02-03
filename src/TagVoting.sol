// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {SafeCastUpgradeable} from
    "../lib/openzeppelin-contracts-upgradeable/contracts/utils/math/SafeCastUpgradeable.sol";

import {IMembership} from "../lib/osx-commons/contracts/src/plugin/extensions/membership/IMembership.sol";
import {RATIO_BASE, _applyRatioCeiled} from "../lib/osx-commons/contracts/src/utils/math/Ratio.sol";
import {
    MajorityVotingBase,
    IMajorityVoting,
    IDAO
} from "../lib/osx/packages/contracts/src/plugins/governance/majority-voting/MajorityVotingBase.sol";

import {ITagManagerExtended} from "../lib/tag-manager/src/ITagManagerExtended.sol";

// Based on https://github.com/aragon/osx/blob/develop/packages/contracts/src/plugins/governance/majority-voting/addresslist/AddresslistVoting.sol
contract TagVoting is MajorityVotingBase, IMembership {
    using SafeCastUpgradeable for uint256;

    ITagManagerExtended public tagManager;
    bytes32 public tag;

    /// @notice Initializes the component.
    /// @dev This method is required to support [ERC-1822](https://eips.ethereum.org/EIPS/eip-1822).
    /// @param _dao The IDAO interface of the associated DAO.
    /// @param _votingSettings The voting settings.
    /// @param _tagManager The tag manager contract to query for tag having.
    /// @param _tag The tag that an account needs to have to be allowed to vote.
    function initialize(
        IDAO _dao,
        VotingSettings calldata _votingSettings,
        ITagManagerExtended _tagManager,
        bytes32 _tag
    ) external initializer {
        __MajorityVotingBase_init(_dao, _votingSettings);
        tagManager = _tagManager;
        tag = _tag;
    }

    /// @inheritdoc MajorityVotingBase
    function totalVotingPower(uint256 _blockNumber) public view override returns (uint256) {
        (_blockNumber);
        // Real time updated instead of based on proposal creation (block).
        // In case the total tag havers decrease during a proposal, this means that the early execution threshold is higher than expected (/ required).
        return tagManager.totalTagHavers(tag);
    }

    /// @inheritdoc MajorityVotingBase
    function createProposal(
        bytes calldata _metadata,
        IDAO.Action[] calldata _actions,
        uint256 _allowFailureMap,
        uint64 _startDate,
        uint64 _endDate,
        VoteOption _voteOption,
        bool _tryEarlyExecution
    ) external override returns (uint256 proposalId) {
        if (minProposerVotingPower() != 0 && !hasTag(_msgSender())) {
            revert ProposalCreationForbidden(_msgSender());
        }

        uint64 snapshotBlock;
        unchecked {
            snapshotBlock = block.number.toUint64() - 1; // The snapshot block must be mined already to protect the transaction against backrunning transactions causing census changes.
        }

        (_startDate, _endDate) = _validateProposalDates(_startDate, _endDate);

        proposalId = _createProposal({
            _creator: _msgSender(),
            _metadata: _metadata,
            _startDate: _startDate,
            _endDate: _endDate,
            _actions: _actions,
            _allowFailureMap: _allowFailureMap
        });

        // Store proposal related information
        Proposal storage proposal_ = proposals[proposalId];

        proposal_.parameters.startDate = _startDate;
        proposal_.parameters.endDate = _endDate;
        proposal_.parameters.snapshotBlock = snapshotBlock;
        proposal_.parameters.votingMode = votingMode();
        proposal_.parameters.supportThreshold = supportThreshold();
        proposal_.parameters.minVotingPower = _applyRatioCeiled(totalVotingPower(snapshotBlock), minParticipation());

        // Reduce costs
        if (_allowFailureMap != 0) {
            proposal_.allowFailureMap = _allowFailureMap;
        }

        for (uint256 i; i < _actions.length;) {
            proposal_.actions.push(_actions[i]);
            unchecked {
                ++i;
            }
        }

        if (_voteOption != VoteOption.None) {
            vote(proposalId, _voteOption, _tryEarlyExecution);
        }
    }

    /// @inheritdoc IMembership
    function isMember(address _account) external view override returns (bool) {
        return hasTag(_account);
    }

    /// @inheritdoc MajorityVotingBase
    function _vote(uint256 _proposalId, VoteOption _voteOption, address _voter, bool _tryEarlyExecution)
        internal
        override
    {
        Proposal storage proposal_ = proposals[_proposalId];

        VoteOption state = proposal_.voters[_voter];

        // Remove the previous vote.
        if (state == VoteOption.Yes) {
            proposal_.tally.yes = proposal_.tally.yes - 1;
        } else if (state == VoteOption.No) {
            proposal_.tally.no = proposal_.tally.no - 1;
        } else if (state == VoteOption.Abstain) {
            proposal_.tally.abstain = proposal_.tally.abstain - 1;
        }

        // Store the updated/new vote for the voter.
        if (_voteOption == VoteOption.Yes) {
            proposal_.tally.yes = proposal_.tally.yes + 1;
        } else if (_voteOption == VoteOption.No) {
            proposal_.tally.no = proposal_.tally.no + 1;
        } else if (_voteOption == VoteOption.Abstain) {
            proposal_.tally.abstain = proposal_.tally.abstain + 1;
        }

        proposal_.voters[_voter] = _voteOption;

        emit VoteCast({proposalId: _proposalId, voter: _voter, voteOption: _voteOption, votingPower: 1});

        if (_tryEarlyExecution && _canExecute(_proposalId)) {
            _execute(_proposalId);
        }
    }

    /// @inheritdoc MajorityVotingBase
    function _canVote(uint256 _proposalId, address _account, VoteOption _voteOption)
        internal
        view
        override
        returns (bool)
    {
        Proposal storage proposal_ = proposals[_proposalId];

        // The proposal vote hasn't started or has already ended.
        if (!_isProposalOpen(proposal_)) {
            return false;
        }

        // The voter votes `None` which is not allowed.
        if (_voteOption == VoteOption.None) {
            return false;
        }

        // The voter has no voting power.
        if (!hasTag(_account)) {
            return false;
        }

        // The voter has already voted but vote replacement is not allowed.
        if (
            proposal_.voters[_account] != VoteOption.None
                && proposal_.parameters.votingMode != VotingMode.VoteReplacement
        ) {
            return false;
        }

        return true;
    }

    function hasTag(address _account) internal view returns (bool) {
        return tagManager.hasTag(_account, tag);
    }

    /// @dev This empty reserved space is put in place to allow future versions to add new
    /// variables without shifting down storage in the inheritance chain.
    /// https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
    uint256[50] private __gap;
}
