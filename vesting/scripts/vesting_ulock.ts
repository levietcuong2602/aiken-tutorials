import { getCurrentTime, minute, setupLucid } from "../../common/util.ts";
import { KUPMIOS_ENV, LOCAL_ENV } from "../../common/constants/index.ts";
import { generateKeyPair } from "../../common/util.ts";
import {
  Address,
  Data,
  Lucid,
  Redeemer,
  SpendingValidator,
  TxHash,
  UTxO,
} from "https://deno.land/x/lucid@0.10.7/mod.ts";
import { createVestingDatum, VestingDatum } from "./types.ts";
import { readValidator } from "../../common/util.ts";
import blueprint from "../plutus.json" with { type: "json" };

/**
 * publicKey: "addr_test1vp84uetx4p9e5vlatepnzl4ze7ujugw83c8uxpyhftf4m0ggqt646",
 * privateKey: "ed25519_sk1cjdlzqfpcenrvqtqgk9ea57pd7wnepnsmd2gmncjmuu3ga0xpy4sx6xnun"
 */
async function run() {
  console.log(`\n=== SETUP IN PROGRESS ===`);
  const lucid = await setupLucid(KUPMIOS_ENV);

  // const [publicKey, privateKey] = await generateKeyPair();
  const vestingValidator = await readValidator(blueprint, "vesting.vesting");

  // console.log(`Creating a vesting UTxO that locks 5 ADA for 5 hours...\n`);
  //   const owner = await lucid.wallet.address();
  //   const beneficiary =
  //     "addr_test1vp84uetx4p9e5vlatepnzl4ze7ujugw83c8uxpyhftf4m0ggqt646";
  //   const vestedValue = 10000n;
  //   const startTime = getCurrentTime();
  //   const lockedUntil = getCurrentTime() + 5 * minute();
  //   const vestingDatum = createVestingDatum(
  //     lucid,
  //     BigInt(lockedUntil),
  //     owner,
  //     beneficiary,
  //   );
  //   const txLock = await lock(lucid, vestedValue, {
  //     validator: vestingValidator,
  //     datum: String(vestingDatum),
  //   });

  //   console.log(`1 tADA locked into the contract
  //     Tx ID: ${txLock}
  //     Datum: ${vestingDatum}
  // `);
  //   // 32c7eb354a82c00fac73160f3a2a047bb518fd07fd75f7dd729ead6410a970cf

  const vestingContractAddress = lucid.utils.validatorToAddress(
    vestingValidator,
  );

  const beneficiaryAddress = String(
    "addr_test1vp84uetx4p9e5vlatepnzl4ze7ujugw83c8uxpyhftf4m0ggqt646",
  ) as Address;
  const beneficiaryPublicKeyHash = lucid.utils.getAddressDetails(
    beneficiaryAddress,
  ).paymentCredential?.hash;

  const currentTime = new Date().getTime();
  // we get all the UTXOs sitting at the script address
  const scriptUtxos = await lucid.utxosAt(vestingContractAddress);
  // we filter out all the UTXOs by beneficiary and lock_until
  const utxos = scriptUtxos.filter((utxo) => {
    let datum = Data.from<VestingDatum>(
      String(utxo.datum),
      VestingDatum,
    );

    return datum.beneficiary === beneficiaryPublicKeyHash &&
      datum.lock_until <= currentTime;
  });

  if (utxos.length === 0) {
    console.log(
      "No redeemable utxo found. You need to wait a little longer...",
    );
    Deno.exit(1);
  }

  // we don't have any redeemer in our contract but it needs to be empty
  const redeemer = Data.void();
  const txUnlock = await unlock(lucid, utxos, beneficiaryAddress, currentTime, {
    from: vestingValidator,
    redeemer,
  });
  await lucid.awaitTx(txUnlock);
  console.log(`1 tADA recovered from the contract
    Tx ID: ${txUnlock}
    Redeemer: ${redeemer}
`);
}

async function lock(
  lucid: Lucid,
  lovelace: bigint,
  { validator, datum }: { validator: SpendingValidator; datum: string },
): Promise<TxHash> {
  const vestingContractAddress = lucid.utils.validatorToAddress(
    validator,
  );

  const tx = await lucid
    .newTx()
    .payToContract(vestingContractAddress, { inline: datum }, { lovelace })
    .complete();
  const signedTx = await tx.sign().complete();
  const txHash = await signedTx.submit();
  return txHash;
}

async function unlock(
  lucid: Lucid,
  utxos: UTxO[],
  beneficiaryAddress: Address,
  currentTime: number,
  { from, redeemer }: { from: SpendingValidator; redeemer: Redeemer },
): Promise<TxHash> {
  const laterTime = new Date(currentTime + 1000 * minute()).getTime(); // Add 2 minutes: TTL
  console.log({
    utxos,
    redeemer,
  });

  const tx = await lucid
    .newTx()
    .collectFrom(utxos, redeemer)
    .addSigner(beneficiaryAddress)
    .validFrom(new Date(currentTime - 1000 * minute()).getTime())
    .validTo(laterTime)
    .attachSpendingValidator(from)
    .complete();

  const signedTx = await tx.sign().complete();
  const txHash = await signedTx.submit();
  console.log({
    txHash,
  });

  return txHash;
}
run();
