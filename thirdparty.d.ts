declare module "@ledgerhq/hw-app-eth" {
    export type PublicAccount = {
        publicKey: string;
        address: string;
        chainCode: string;
    };

    export type Config = {
        arbitraryDataEnabled: number,
        version: string
    };

    export type Signature = {
        r: string,
        s: string,
        v: number
    };

    export class Transport { }

    export type LedgerEthTransactionResolution = {
        // device serialized data that contains ERC20 data (hex format)
        erc20Tokens: Array<string>;
        // device serialized data that contains NFT data (hex format)
        nfts: Array<string>;
        // device serialized data that contains external plugin data (hex format)
        externalPlugin: Array<{ payload: string; signature: string }>;
        // device serialized data that contains plugin data (hex format)
        plugin: Array<string>;
    };

    export class Eth {
        constructor(transport: Transport);
        getAppConfiguration(): Promise<Config>;
        getAddress(path: string): Promise<PublicAccount>;
        signPersonalMessage(path: string, message: string): Promise<Signature>;
        signTransaction(path: string, unsignedTx: string, resolution?: LedgerEthTransactionResolution | null): Promise<Signature>;
    }

    export default Eth;
}

declare module "@ledgerhq/hw-app-eth/lib/services/ledger" {
    export type LoadConfig = {
        nftExplorerBaseURL?: string | null;
        // example of payload https://cdn.live.ledger.com/plugins/ethereum/1.json
        // fetch against an api (base url is an api that hosts /plugins/ethereum/${chainId}.json )
        // set to null will disable it
        pluginBaseURL?: string | null;
        // provide manually some extra plugins to add for the resolution (e.g. for dev purpose)
        // object will be merged with the returned value of the Ledger cdn payload
        extraPlugins?: any | null;
    };
      
    /**
       * Allows to configure precisely what the service need to resolve.
       * for instance you can set nft:true if you need clear signing on NFTs. If you set it and it is not a NFT transaction, it should still work but will do a useless service resolution.
       */
    export type ResolutionConfig = {
        // NFT resolution service
        nft?: boolean;
        // external plugins resolution service (e.G. LIDO)
        externalPlugins?: boolean;
        // ERC20 resolution service (to clear sign erc20 transfers & other actions)
        erc20?: boolean;
    };

    export type LedgerEthTransactionResolution = {
        // device serialized data that contains ERC20 data (hex format)
        erc20Tokens: Array<string>;
        // device serialized data that contains NFT data (hex format)
        nfts: Array<string>;
        // device serialized data that contains external plugin data (hex format)
        externalPlugin: Array<{ payload: string; signature: string }>;
        // device serialized data that contains plugin data (hex format)
        plugin: Array<string>;
    };

    export type LedgerEthTransactionService = {
        resolveTransaction: (
          rawTxHex: string,
          loadConfig: LoadConfig,
          resolutionConfig: ResolutionConfig
        ) => Promise<LedgerEthTransactionResolution>;
    };

    const ledgerService: LedgerEthTransactionService;
    export default ledgerService;
}

declare module "@ledgerhq/hw-transport-node-hid" {
    export class Transport { }

    export function create(): Promise<Transport>;
}

declare module "@ledgerhq/hw-transport-u2f" {
    export class Transport { }

    export function create(): Promise<Transport>;
}