import { Address, DeployInfo, Deployer } from "../../web3webdeploy/types";

export interface DeployTagVotingSetupSettings
  extends Omit<DeployInfo, "contract" | "args"> {}

export async function deployTagVotingSetup(
  deployer: Deployer,
  settings: DeployTagVotingSetupSettings
): Promise<Address> {
  return await deployer
    .deploy({
      id: "TagVotingSetup",
      contract: "TagVotingSetup",
      ...settings,
    })
    .then((deployment) => deployment.address);
}
