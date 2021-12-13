"use strict";

const { ethers } = require("ethers");
const { LedgerSigner } = require("./lib");

(async function() {
    const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
    const signer = new LedgerSigner(provider);
    console.log(signer);
    console.log(await signer.getAddress());
    console.log(await provider.getGasPrice());
    console.log(await provider.getFeeData());
    try {
        let tx = await signer.sendTransaction({
            to: "0xAaF147Cee92E94016e66C88355cDaE02AdD31b36",
            value: ethers.utils.parseEther("0.001")
        });
        console.log(tx);
        tx = await tx.wait();
        console.log(tx);
    } catch (error) {
        console.log("ERR", error);
    }
})();
