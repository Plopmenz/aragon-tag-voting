import { AbiItem, Address, DeployInfo, Deployer } from "../web3webdeploy/types";
import {
  getNetworkDeploymentForVersion,
  SupportedNetworks,
  SupportedVersions,
} from "../lib/osx-commons/configs/src";
import { parseAbiItem } from "../web3webdeploy/node_modules/viem";

export interface TagVotingDeploymentSettings
  extends Omit<DeployInfo, "contract" | "args"> {}

export interface TagVotingDeployment {
  tagVotingSetup: Address;
}

export async function deploy(
  deployer: Deployer,
  settings?: TagVotingDeploymentSettings
): Promise<TagVotingDeployment> {
  const tagVotingSetup = await deployer.deploy({
    id: "TagVotingSetup",
    contract: "TagVotingSetup",
    ...settings,
  });

  const aragonDeployment = getNetworkDeploymentForVersion(
    SupportedNetworks.MUMBAI,
    SupportedVersions.V1_3_0
  );
  if (!aragonDeployment) {
    throw new Error("Aragon deployment not found");
  }
  const pluginRepoFactoryAbi: AbiItem[] = [
    parseAbiItem(
      "function createPluginRepoWithFirstVersion(string calldata _subdomain,address _pluginSetup,address _maintainer,bytes memory _releaseMetadata,bytes memory _buildMetadata) external"
    ),
  ].map((item) => {
    return {
      ...item,
      inputs: [
        ...item.inputs.map((input) => {
          return { ...input, internalType: input.type };
        }),
      ],
      outputs: [...item.outputs],
    };
  });
  await deployer.execute({
    abi: pluginRepoFactoryAbi,
    to: aragonDeployment.PluginRepoFactory.address as Address,
    function: "createPluginRepoWithFirstVersion",
    args: [
      "plugin-7583279532",
      tagVotingSetup,
      "0xaF7E68bCb2Fc7295492A00177f14F59B92814e70",
      "0x01",
      "0x01",
    ],
  });

  return {
    tagVotingSetup: tagVotingSetup,
  };
}
