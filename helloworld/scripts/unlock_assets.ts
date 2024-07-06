import {
  Data,
  SpendingValidator,
  TxHash,
  utf8ToHex,
  UTxO,
} from "https://deno.land/x/lucid@0.8.3/mod.ts";
import * as cbor from "https://deno.land/x/cbor@v1.4.1/index.js";
import { readValidator, setupLucid } from "./utils.ts";
import { TDatumSchema, TRedeemerSchema } from "./types.ts";

console.log(`Building a transaction to unlock the locked script UTxO`);
const lucid = await setupLucid();
const validator = await readValidator();
const contractAddress = await lucid.utils.validatorToAddress(validator);
const contractUTxOs = await lucid.utxosAt(contractAddress);
const publicKeyHash = lucid.utils.getAddressDetails(
  await lucid.wallet.address(),
).paymentCredential?.hash;
const utxos = contractUTxOs.filter((utxo) => {
  const datum: TDatumSchema = Data.from<TDatumSchema>(
    utxo.datum ?? "",
    TDatumSchema,
  );
  return datum.owner === publicKeyHash;
});

const redeemer = Data.to({
  msg: utf8ToHex("Hello, World!"),
}, TRedeemerSchema);

const txHash = await unlock(utxos, {
  validator,
  redeemer,
});

await lucid.awaitTx(txHash);

console.log(`1 tADA unlocked from the contract
    Tx ID:    ${txHash}
    Redeemer: ${redeemer}
`);

// Supporting functions
async function unlock(
  utxos: UTxO[],
  { validator, redeemer }: {
    validator: SpendingValidator;
    redeemer: TRedeemerSchema;
  },
): Promise<TxHash> {
  const ownerAddress = await lucid.wallet.address();
  const tx = await lucid.newTx().collectFrom(utxos, redeemer).addSigner(
    ownerAddress,
  )
    .attachSpendingValidator(validator).complete();
  const signedTx = await tx
    .sign()
    .complete();

  return signedTx.submit();
}
