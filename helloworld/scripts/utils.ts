import {
  applyParamsToScript,
  Blockfrost,
  C,
  Constr,
  Data,
  fromHex,
  Kupmios,
  Lucid,
  SpendingValidator,
  toHex,
  TxHash,
  utf8ToHex,
} from "https://deno.land/x/lucid@0.8.3/mod.ts";
import * as cbor from "https://deno.land/x/cbor@v1.4.1/index.js";

export const setupLucid = async (): Promise<Lucid> => {
  const lucid = await Lucid.new(
    new Kupmios("http://localhost:1442", "ws://localhost:1337"),
    "Preview",
  );
  const DEPLOYER_SK =
    "ed25519_sk1rvgjxs8sddhl46uqtv862s53vu4jf6lnk63rcn7f0qwzyq85wnlqgrsx42";
  lucid.selectWalletFromPrivateKey(DEPLOYER_SK);

  const privateKey = lucid.utils.generatePrivateKey();
  await Deno.writeTextFile("key.sk", privateKey);
  const address = await lucid
    .selectWalletFromPrivateKey(privateKey)
    .wallet.address();
  await Deno.writeTextFile("key.addr", address);

  return lucid;
};

export const readValidator = async (): Promise<SpendingValidator> => {
  const validator =
    JSON.parse(await Deno.readTextFile("./plutus.json")).validators[0];
  return {
    type: "PlutusV2",
    script: toHex(cbor.encode(fromHex(validator.compiledCode))),
  };
};
