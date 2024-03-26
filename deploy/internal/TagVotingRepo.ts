import { Address, Deployer, ExecuteInfo } from "../../web3webdeploy/types";

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
  const { receipt } = await deployer.execute({
    id: "TagVotingRepo",
    abi: [...pluginRepoFactoryAbi],
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

  const events = await deployer.getEvents({
    abi: [...pluginRepoRegistryAbi],
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

const pluginRepoFactoryAbi = [
  {
    inputs: [
      {
        internalType: "contract PluginRepoRegistry",
        name: "_pluginRepoRegistry",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_subdomain",
        type: "string",
      },
      {
        internalType: "address",
        name: "_initialOwner",
        type: "address",
      },
    ],
    name: "createPluginRepo",
    outputs: [
      {
        internalType: "contract PluginRepo",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_subdomain",
        type: "string",
      },
      {
        internalType: "address",
        name: "_pluginSetup",
        type: "address",
      },
      {
        internalType: "address",
        name: "_maintainer",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "_releaseMetadata",
        type: "bytes",
      },
      {
        internalType: "bytes",
        name: "_buildMetadata",
        type: "bytes",
      },
    ],
    name: "createPluginRepoWithFirstVersion",
    outputs: [
      {
        internalType: "contract PluginRepo",
        name: "pluginRepo",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "pluginRepoBase",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "pluginRepoRegistry",
    outputs: [
      {
        internalType: "contract PluginRepoRegistry",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "protocolVersion",
    outputs: [
      {
        internalType: "uint8[3]",
        name: "",
        type: "uint8[3]",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "_interfaceId",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const pluginRepoRegistryAbi = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "registrant",
        type: "address",
      },
    ],
    name: "ContractAlreadyRegistered",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "registrant",
        type: "address",
      },
    ],
    name: "ContractERC165SupportInvalid",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "registrant",
        type: "address",
      },
    ],
    name: "ContractInterfaceInvalid",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "dao",
        type: "address",
      },
      {
        internalType: "address",
        name: "where",
        type: "address",
      },
      {
        internalType: "address",
        name: "who",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "permissionId",
        type: "bytes32",
      },
    ],
    name: "DaoUnauthorized",
    type: "error",
  },
  {
    inputs: [],
    name: "EmptyPluginRepoSubdomain",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "subdomain",
        type: "string",
      },
    ],
    name: "InvalidPluginSubdomain",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "previousAdmin",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "newAdmin",
        type: "address",
      },
    ],
    name: "AdminChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "beacon",
        type: "address",
      },
    ],
    name: "BeaconUpgraded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint8",
        name: "version",
        type: "uint8",
      },
    ],
    name: "Initialized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "subdomain",
        type: "string",
      },
      {
        indexed: false,
        internalType: "address",
        name: "pluginRepo",
        type: "address",
      },
    ],
    name: "PluginRepoRegistered",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "implementation",
        type: "address",
      },
    ],
    name: "Upgraded",
    type: "event",
  },
  {
    inputs: [],
    name: "REGISTER_PLUGIN_REPO_PERMISSION_ID",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "UPGRADE_REGISTRY_PERMISSION_ID",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "dao",
    outputs: [
      {
        internalType: "contract IDAO",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "entries",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IDAO",
        name: "_dao",
        type: "address",
      },
      {
        internalType: "contract ENSSubdomainRegistrar",
        name: "_subdomainRegistrar",
        type: "address",
      },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "protocolVersion",
    outputs: [
      {
        internalType: "uint8[3]",
        name: "",
        type: "uint8[3]",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "proxiableUUID",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "subdomain",
        type: "string",
      },
      {
        internalType: "address",
        name: "pluginRepo",
        type: "address",
      },
    ],
    name: "registerPluginRepo",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "subdomainRegistrar",
    outputs: [
      {
        internalType: "contract ENSSubdomainRegistrar",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "targetInterfaceId",
    outputs: [
      {
        internalType: "bytes4",
        name: "",
        type: "bytes4",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newImplementation",
        type: "address",
      },
    ],
    name: "upgradeTo",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newImplementation",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "upgradeToAndCall",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
] as const;
