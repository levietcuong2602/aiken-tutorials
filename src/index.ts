import { KUPMIOS_ENV } from "./constants/index.ts";
import { initialLucid } from "./util.ts";

async function main() {
  const lucid = await initialLucid(KUPMIOS_ENV);
  lucid.selectWalletFromPrivateKey(await Deno.readTextFile("./me.sk"));

  // Create and instantiate validator
  const address = await lucid.wallet.address();
  const publicKeyHash = lucid.utils.getAddressDetails(
    address,
  ).paymentCredential?.hash;

  console.log({
    publicKeyHash,
  });
}

main();
