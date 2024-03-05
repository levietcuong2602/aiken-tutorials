import { KUPMIOS_ENV, LOCAL_ENV } from "../../common/constants/index.ts";
import { setupLucid } from "../../common/util.ts";

// Select wallet from private key
const lucid = await setupLucid(KUPMIOS_ENV);

// Select wallet from private key
lucid.selectWalletFromPrivateKey(
  await Deno.readTextFile("./credentials/me.sk"),
);

// Query wallet
const address = await lucid.wallet.address(); // Bech32 address
console.log({ address });

// query UTxOs
const utxosOfWallet = await lucid.wallet.getUtxos();
console.log({ utxosOfWallet });

// Query delegation
const delegationOfWallet = await lucid.wallet.getDelegation();
console.log({ delegationOfWallet });
