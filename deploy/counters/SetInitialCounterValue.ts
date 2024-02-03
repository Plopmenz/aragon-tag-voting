import { Address, Deployer, ExecuteInfo } from "../../web3webdeploy/types";

export interface SetInitialCounterValueSettings
  extends Omit<ExecuteInfo, "abi" | "to" | "function" | "args"> {
  counter: Address;
  counterValue: bigint;
}

export async function setIntialCounterValue(
  deployer: Deployer,
  settings: SetInitialCounterValueSettings
) {
  return await deployer.execute({
    id: "InitialCounterNumber",
    abi: "Counter",
    to: settings.counter,
    function: "setNumber",
    args: [settings.counterValue],
    ...settings,
  });
}
