import {
  Data,
  SpendingValidator,
  TxHash,
} from "https://deno.land/x/lucid@0.8.3/mod.ts";
import * as cbor from "https://deno.land/x/cbor@v1.4.1/index.js";
import { readValidator, setupLucid } from "./utils.ts";
import { TDatumSchema } from "./types.ts";

const lucid = await setupLucid();
const publicKeyHash = lucid.utils.getAddressDetails(
  await lucid.wallet.address(),
).paymentCredential?.hash;

const validator = await readValidator();

const datum = Data.to({
  owner: publicKeyHash ??
    "0000000000000000000000000000000000000000000000000000000000000000",
}, TDatumSchema);
const txHash = await lock(2000n, {
  into: validator,
  owner: datum,
});

await lucid.awaitTx(txHash);

console.log(`1 tADA locked into the contract at:
    Tx ID: ${txHash}
    Datum: ${datum}
`);

async function lock(
  lovelace: bigint,
  { into, owner }: { into: SpendingValidator; owner: string },
): Promise<TxHash> {
  const contractAddress = lucid.utils.validatorToAddress(into);

  const tx = await lucid
    .newTx()
    .payToContract(contractAddress, { inline: owner }, { lovelace })
    .complete();

  const signedTx = await tx.sign().complete();

  return signedTx.submit();
}
