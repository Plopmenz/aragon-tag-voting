import { Address, DeployInfo, Deployer } from "../../web3webdeploy/types";

export interface DeployProxyCounterSettings
  extends Omit<DeployInfo, "contract" | "args"> {
  counter: Address;
}

export async function deployProxyCounter(
  deployer: Deployer,
  settings: DeployProxyCounterSettings
) {
  return await deployer.deploy({
    id: "ProxyCounter",
    contract: "ProxyCounter",
    args: [settings.counter],
    ...settings,
  });
}
