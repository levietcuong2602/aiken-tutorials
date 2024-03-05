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

  console.log(`Creating a vesting UTxO that locks 5 ADA for 5 hours...\n`);
  const owner = await lucid.wallet.address();
  const beneficiary =
    "addr_test1vp84uetx4p9e5vlatepnzl4ze7ujugw83c8uxpyhftf4m0ggqt646";
  const vestedValue = 10000n;
  const startTime = getCurrentTime();
  const lockedUntil = getCurrentTime() + 5 * minute();
  const vestingDatum = createVestingDatum(
    lucid,
    BigInt(lockedUntil),
    owner,
    beneficiary,
  );
  const txLock = await lock(lucid, vestedValue, {
    validator: vestingValidator,
    datum: String(vestingDatum),
  });

  console.log(`1 tADA locked into the contract
      Tx ID: ${txLock}
      Datum: ${vestingDatum}
  `);
  // 32c7eb354a82c00fac73160f3a2a047bb518fd07fd75f7dd729ead6410a970cf
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

run();
