import {
  Address,
  Deployer,
  ExecuteInfo,
  AbiItem,
} from "../../web3webdeploy/types";
import { parseAbiItem } from "../../web3webdeploy/node_modules/viem";

export interface CreateTagVotingRepoSettings
  extends Omit<ExecuteInfo, "abi" | "to" | "function" | "args"> {
  pluginRepoFactory: Address;
  pluginRepoRegistry: Address;
  subdomain: string;
  tagVotingSetup: Address;
  maintainer: Address;
}

export async function createTagVotingRepo(
  deployer: Deployer,
  settings: CreateTagVotingRepoSettings
): Promise<Address> {
  const pluginRepoFactoryAbi: AbiItem[] = [
    parseAbiItem(
      "function createPluginRepoWithFirstVersion(string calldata _subdomain,address _pluginSetup,address _maintainer,bytes memory _releaseMetadata,bytes memory _buildMetadata) external"
    ),
  ];
  const { receipt } = await deployer.execute({
    abi: pluginRepoFactoryAbi,
    to: settings.pluginRepoFactory,
    function: "createPluginRepoWithFirstVersion",
    args: [
      settings.subdomain,
      settings.tagVotingSetup,
      settings.maintainer,
      "0x01",
      "0x01",
    ],
  });

  const repoCreatedEventAbi: AbiItem[] = [
    parseAbiItem(
      "event PluginRepoRegistered(string subdomain, address pluginRepo)"
    ),
  ];
  const events = await deployer.getEvents({
    abi: repoCreatedEventAbi,
    address: settings.pluginRepoRegistry,
    eventName: "PluginRepoRegistered",
    logs: receipt.logs,
  });

  if (events.length === 0) {
    throw new Error("PluginRepoRegistered event not emitted");
  }

  const repo = (events[0].args as any as { pluginRepo: Address }).pluginRepo;
  return repo;
}
