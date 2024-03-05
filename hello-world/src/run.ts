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
import { KUPMIOS_ENV, LOCAL_ENV } from "../../common/constants/index.ts";
import { setupLucid } from "../../common/util.ts";
import { readValidator } from "../../common/util.ts";
import blueprint from "../plutus.json" with { type: "json" };

async function run() {
  const lucid = await setupLucid(KUPMIOS_ENV);

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
  const spendingValidator = await readValidator(
    blueprint,
    "hello_world.hello_world",
  );

  // Lock Funds
  // const datum = Data.to(new Constr(0, [String(publicKeyHash)]));
  // const txLockFund = await lockFunds(
  //   1000000n,
  //   { into: spendingValidator, owner: datum },
  //   lucid,
  // );
  // console.log({
  //   txLockFund,
  // });

  // Unlock tx = 1f8d5358001d490bb22ada6e6d59a49ded25cdec0e8d02b39b6ad221601b3f6d
  const utxo: OutRef = {
    txHash: "1f8d5358001d490bb22ada6e6d59a49ded25cdec0e8d02b39b6ad221601b3f6d",
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
  { into, owner }: { into: SpendingValidator; owner: string },
  lucid: Lucid,
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
  const txHash = await signedTx.submit();
  console.log(`1 tADA locked into the contract at:
    Tx ID: ${txHash}
    Datum: ${owner}
`);
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
