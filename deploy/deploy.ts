import { Address, Deployer } from "../web3webdeploy/types";
import {
  getNetworkDeploymentForVersion,
  NetworkDeployment,
  SupportedNetworks,
  SupportedVersions,
} from "../lib/osx-commons/configs/src";
import {
  DeployTagVotingSetupSettings,
  deployTagVotingSetup,
} from "./plugin/TagVotingSetup";
import {
  CreateTagVotingRepoSettings,
  createTagVotingRepo,
} from "./plugin/TagVotingRepo";

export interface TagVotingDeploymentSettings {
  aragonDeployment?: NetworkDeployment;
  tagVotingSetupSettings: DeployTagVotingSetupSettings;
  tagVotingRepoSettings: Omit<
    CreateTagVotingRepoSettings,
    "pluginRepoFactory" | "pluginRepoRegistry" | "tagVotingSetup"
  >;
  forceRedeploy?: boolean;
}

export interface TagVotingDeployment {
  tagVotingSetup: Address;
  tagVotingRepo: Address;
}

export async function deploy(
  deployer: Deployer,
  settings?: TagVotingDeploymentSettings
): Promise<TagVotingDeployment> {
  if (settings?.forceRedeploy !== undefined && !settings.forceRedeploy) {
    return await deployer.loadDeployment({ deploymentName: "latest.json" });
  }

  const tagVotingSetup = await deployTagVotingSetup(
    deployer,
    settings?.tagVotingSetupSettings ?? {}
  );

  let aragonDeployment = settings?.aragonDeployment;
  if (!aragonDeployment) {
    let aragonNetwork: SupportedNetworks;
    const chainId = deployer.settings.defaultChainId;
    switch (chainId) {
      case 1:
        aragonNetwork = SupportedNetworks.MAINNET;
        break;
      case 137:
        aragonNetwork = SupportedNetworks.POLYGON;
        break;
      case 11155111:
        aragonNetwork = SupportedNetworks.SEPOLIA;
        break;
      default:
        throw new Error(`Unknown Aragon deployment for network ${chainId}`);
    }
    aragonDeployment =
      getNetworkDeploymentForVersion(aragonNetwork, SupportedVersions.V1_3_0) ??
      undefined;
    if (!aragonDeployment) {
      throw new Error("Aragon deployment not found");
    }
  }

  const tagVotingRepo = await createTagVotingRepo(deployer, {
    pluginRepoFactory: aragonDeployment.PluginRepoFactory.address as Address,
    pluginRepoRegistry: aragonDeployment.PluginRepoRegistryProxy
      .address as Address,
    tagVotingSetup: tagVotingSetup,
    ...(settings?.tagVotingRepoSettings ?? {
      subdomain: "tag-voting",
      maintainer: deployer.settings.defaultFrom,
    }),
  });

  const deployment = {
    tagVotingSetup: tagVotingSetup,
    tagVotingRepo: tagVotingRepo,
  };
  await deployer.saveDeployment({
    deploymentName: "latest.json",
    deployment: deployment,
  });
  return deployment;
}
