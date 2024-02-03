import { Address, DeployInfo, Deployer } from "../web3webdeploy/types";

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

  return {
    tagVotingSetup: tagVotingSetup,
  };
}
