Ethers-Ledger
================

This is a fork of @ethersproject/hardware-wallets.

This only supports NodeJS, as for browsers metamask supports Ledger anyway.

**NOTE: This is not maintained, I now use frame to deploy/interact with contracts from nodeJS scripts with a Ledger**

Installation
=============

`npm install @anders-t/ethers-ledger`

API
===

```
import { LedgerSigner } from "@anders-t/ethers-ledger";
const signer = new LedgerSigner(provider, path);
// By default:
//   - path is the default Ethereum path (i.e.  `m/44'/60'/0'/0/0`)
```

License
=======

All ethers code is MIT License.

Each hardware wallet manufacturer may impose additional license
requirements so please check the related abstraction libraries
they provide.

All Firefly abstraction is also MIT Licensed.
