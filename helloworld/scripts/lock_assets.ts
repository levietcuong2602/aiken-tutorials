import {
  Data,
  SpendingValidator,
  TxHash,
} from "https://deno.land/x/lucid@0.8.3/mod.ts";
import * as cbor from "https://deno.land/x/cbor@v1.4.1/index.js";
import {
  getWalletBalanceLovelace,
  readValidator,
  setupLucid,
} from "./utils.ts";
import { TDatumSchema } from "./types.ts";

const lucid = await setupLucid();
const publicKeyHash = lucid.utils.getAddressDetails(
  await lucid.wallet.address(),
).paymentCredential?.hash;

const validator = await readValidator();
console.log({
  publicKeyHash,
});

const datum = Data.to({
  owner: publicKeyHash ??
    "0000000000000000000000000000000000000000000000000000000000000000",
}, TDatumSchema);
const originalBalance = await getWalletBalanceLovelace(lucid);
console.log(`Your wallet's balance before lock is ${originalBalance}`);

const txHash = await lock(1000000n, {
  into: validator,
  owner: datum,
});

await lucid.awaitTx(txHash);

console.log(`1 tADA locked into the contract at:
    Tx ID: ${txHash}
    Datum: ${datum}
`);
const originalBalanceAfter = await getWalletBalanceLovelace(lucid);
console.log(`Your wallet's balance after lock is ${originalBalanceAfter}`);

async function lock(
  lovelace: bigint,
  { into, owner }: { into: SpendingValidator; owner: string },
): Promise<TxHash> {
  const contractAddress = lucid.utils.validatorToAddress(into);
  console.log({
    contractAddress,
  });
  const tx = await lucid
    .newTx()
    .payToContract(contractAddress, { inline: owner }, { lovelace })
    .complete();

  const signedTx = await tx.sign().complete();
  // console.log(JSON.stringify({
  //   txSignedToHash: signedTx.toHash(),
  //   txSignedToStr: signedTx.toString(),
  // }));
  // const utxosAtAddr = await lucid.utxosAt(await lucid.wallet.address());
  // const utxos = await lucid.wallet.getUtxosCore();
  // console.log({
  //   utxosAtAddr,
  //   utxos,
  // });

  Deno.exit(0);
  // return signedTx.submit();
}
