import { KUPMIOS_ENV } from "./constants/index.ts";
import { initialLucid } from "./util.ts";

// Select wallet from private key
const lucid = await initialLucid(KUPMIOS_ENV);

// Select wallet from private key
lucid.selectWalletFromPrivateKey(await Deno.readTextFile("./me.sk"));

// Query wallet
const address = await lucid.wallet.address(); // Bech32 address
console.log({ address });

// query UTxOs
const utxosOfWallet = await lucid.wallet.getUtxos();
console.log({ utxosOfWallet });

// Query delegation
const delegationOfWallet = await lucid.wallet.getDelegation();
console.log({ delegationOfWallet });
