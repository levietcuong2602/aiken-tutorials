import {
  Constr,
  Data,
  fromText,
  Lucid,
  OutRef,
  Redeemer,
  SpendingValidator,
  toHex,
  TxHash,
} from "https://deno.land/x/lucid@0.10.7/mod.ts";
import { LOCAL_ENV } from "./constants/index.ts";
import { setupLucid } from "./util.ts";
import { readValidator } from "./util.ts";

async function run() {
  const lucid = await setupLucid(LOCAL_ENV);

  // address
  const walletAddress = await lucid.wallet.address();
  console.log({
    walletAddress,
  });

  // Create and instantiate validator
  const address = await lucid.wallet.address();
  const publicKeyHash = lucid.utils.getAddressDetails(
    address,
  ).paymentCredential?.hash;

  console.log({
    publicKeyHash,
  });

  // Create and instantiate validator --> script compile code by aiken of validator
  const spendingValidator = await readValidator("hello_world.hello_world");
  // const txLockFund = await lockFunds(
  //   1000000n,
  //   { into: spendingValidator },
  //   lucid,
  // );
  // console.log({
  //   txLockFund,
  // });

  // Unlock tx = b422b383b707e626d1137449b09446f6e9300780e628968907d7c5912afa1fbe
  const utxo: OutRef = {
    txHash: "b422b383b707e626d1137449b09446f6e9300780e628968907d7c5912afa1fbe",
    outputIndex: 0,
  };
  const redeemer = Data.to(new Constr(0, [fromText("Hello, World!")]));
  await unlockFunds(utxo, {
    from: spendingValidator,
    using: redeemer,
  }, lucid);
}

async function lockFunds(
  lovelace: bigint,
  { into }: { into: SpendingValidator },
  lucid: Lucid,
): Promise<TxHash> {
  const contractAddress = lucid.utils.validatorToAddress(into);
  console.log({
    contractAddress,
  });

  const tx = await lucid
    .newTx()
    .payToContract(contractAddress, { inline: Data.void() }, { lovelace })
    .complete();

  const signedTx = await tx.sign().complete();
  const txHash = signedTx.submit();
  return txHash as unknown as TxHash;
}

async function unlockFunds(
  ref: OutRef,
  { from, using }: { from: SpendingValidator; using: Redeemer },
  lucid: Lucid,
) {
  const [utxo] = await lucid.utxosByOutRef([ref]);
  console.log("utxo lock: ", utxo);
  const tx = await lucid
    .newTx()
    .collectFrom([utxo], using)
    .addSigner(await lucid.wallet.address())
    .attachSpendingValidator(from)
    .complete();

  const signedTx = await tx.sign().complete();
  const txHash = await signedTx.submit();

  console.log(`1 tADA unlocked from the contract
    Tx ID:    ${txHash}
    Redeemer: ${using}
`);
}

run();
