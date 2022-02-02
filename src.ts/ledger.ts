"use strict";

import { ethers } from "ethers";

const logger = new ethers.utils.Logger("ethers-ledger/1.0.2");

import Eth from "@ledgerhq/hw-app-eth";
import { LoadConfig, ResolutionConfig, LedgerEthTransactionResolution } from "@ledgerhq/hw-app-eth/lib/services/ledger"
import ledgerService from "@ledgerhq/hw-app-eth/lib/services/ledger"

// We store these in a separated import so it is easier to swap them out
// at bundle time; browsers do not get HID, for example. This maps a string
// "type" to a Transport with create.
import { transports } from "./ledger-transport";

const defaultPath = "m/44'/60'/0'/0/0";

function waiter(duration: number): Promise<void> {
   return new Promise((resolve) => {
       setTimeout(resolve, duration);
   });
}

export class LedgerSigner extends ethers.Signer {
    readonly path: string

    readonly _eth: Promise<Eth>;

    constructor(provider?: ethers.providers.Provider, path?: string) {
        super();
        if (path == null) { path = defaultPath; }

        ethers.utils.defineReadOnly(this, "path", path);
        ethers.utils.defineReadOnly(this, "provider", provider || null);

        const transport = transports.hid;
        if (!transport) { logger.throwError("transports.hid is null/undefined"); }

        ethers.utils.defineReadOnly(this, "_eth", transport.create().then((transport) => {
            const eth = new Eth(transport);
            return eth.getAppConfiguration().then((config) => {
                return eth;
            }, (error) => {
                return Promise.reject(error);
            });
        }, (error) => {
            return Promise.reject(error);
        }));
    }

    _retry<T = any>(callback: (eth: Eth) => Promise<T>, timeout?: number): Promise<T> {
        return new Promise(async (resolve, reject) => {
            if (timeout && timeout > 0) {
                setTimeout(() => { reject(new Error("timeout")); }, timeout);
            }

            const eth = await this._eth;

            // Wait up to 5 seconds
            for (let i = 0; i < 50; i++) {
                try {
                    const result = await callback(eth);
                    return resolve(result);
                } catch (error) {
                    if (error.id !== "TransportLocked") {
                        return reject(error);
                    }
                }
                await waiter(100);
            }

            return reject(new Error("timeout"));
        });
    }

    async getAddress(): Promise<string> {
        const account = await this._retry((eth) => eth.getAddress(this.path));
        return ethers.utils.getAddress(account.address);
    }

    async signMessage(message: ethers.utils.Bytes | string): Promise<string> {
        if (typeof(message) === 'string') {
            message = ethers.utils.toUtf8Bytes(message);
        }

        const messageHex = ethers.utils.hexlify(message).substring(2);

        const sig = await this._retry((eth) => eth.signPersonalMessage(this.path, messageHex));
        sig.r = '0x' + sig.r;
        sig.s = '0x' + sig.s;
        return ethers.utils.joinSignature(sig);
    }

    async signTransaction(transaction: ethers.providers.TransactionRequest): Promise<string> {
        const tx = await ethers.utils.resolveProperties(transaction);
        
        let baseTx: ethers.utils.UnsignedTransaction = {
            type: (tx.type || undefined),
            chainId: (tx.chainId || undefined),
            data: (tx.data || undefined),
            gasLimit: (tx.gasLimit || undefined),
            nonce: (tx.nonce ? ethers.BigNumber.from(tx.nonce).toNumber(): undefined),
            to: (tx.to || undefined),
            value: (tx.value || undefined),
        };
        if (baseTx.type == 2)
        {
            baseTx.gasPrice = (tx.gasPrice || undefined);
            baseTx.maxFeePerGas = (tx.maxFeePerGas || undefined);
            baseTx.maxPriorityFeePerGas = (tx.maxPriorityFeePerGas || undefined);
        }
        else
        {
            baseTx.gasPrice = (tx.gasPrice || undefined);
        }

        const unsignedTx = ethers.utils.serializeTransaction(baseTx).substring(2);

        const loadConfig: LoadConfig = {};
        const resolutionConfig: ResolutionConfig = { externalPlugins: true, erc20: true };
        const resolution: LedgerEthTransactionResolution = await ledgerService.resolveTransaction(unsignedTx, loadConfig, resolutionConfig);

        const sig = await this._retry((eth) => eth.signTransaction(this.path, unsignedTx, resolution));

        return ethers.utils.serializeTransaction(baseTx, {
            v: ethers.BigNumber.from("0x" + sig.v).toNumber(),
            r: ("0x" + sig.r),
            s: ("0x" + sig.s),
        });
    }

    connect(provider: ethers.providers.Provider): ethers.Signer {
        return new LedgerSigner(provider, this.path);
    }
}
