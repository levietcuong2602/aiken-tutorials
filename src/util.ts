import {
  Blockfrost,
  fromHex,
  Kupmios,
  Lucid,
  Maestro,
  Provider,
  SpendingValidator,
  toHex,
} from "https://deno.land/x/lucid@0.10.7/mod.ts";
import * as cbor from "https://deno.land/x/cbor@v1.4.1/index.js";
import blueprint from "../plutus.json" with { type: "json" };

import { BLOCKFROST_ENV } from "./constants/index.ts";
import { MAESTRO_ENV } from "./constants/index.ts";

export async function initialLucid(mode: string): Promise<Lucid> {
  const signer = {
    sk: "ed25519_sk1apukqxxfyypexp5skl38tar2t0fvxcxcrh7drxshjv07w82gf5cs40wtz0",
    address: "addr_test1vqwz2gkgd7uqnsuhfsf8dmf5pv9axdmxdk52dyhpff00p6cc5azk7",
  };

  let provider: Provider;
  switch (mode) {
    case BLOCKFROST_ENV:
      {
        provider = new Blockfrost(
          "https://cardano-preview.blockfrost.io/api/v0",
          "preview2fjKEg2Zh687WPUwB8eljT2Mz2q045GC",
        );
      }
      break;
    case MAESTRO_ENV:
      {
        provider = new Maestro(
          {
            network: "Preprod", // For MAINNET: "Mainnet".
            apiKey: "<Your-API-Key>", // Get yours by visiting https://docs.gomaestro.org/docs/Getting-started/Sign-up-login.
            turboSubmit: false, // Read about paid turbo transaction submission feature at https://docs.gomaestro.org/docs/Dapp%20Platform/Turbo%20Transaction.
          },
        );
      }
      break;
    default:
      {
        const kupo = "http://192.168.10.136:1442";
        const ogmios = "ws://192.168.10.136:1337";
        console.log("Deploy in local", kupo, ogmios);
        provider = new Kupmios(kupo, ogmios);
      }
      break;
  }

  const lucid = await Lucid.new(provider, "Preview");
  return lucid;
}

export async function readValidator(title: string): Promise<SpendingValidator> {
  const validator = blueprint.validators.find((e) => e.title = title);
  if (!validator) {
    throw new Error(`Unable to field validator with title ${title}`);
  }
  return {
    type: "PlutusV2",
    script: toHex(cbor.encode(fromHex(validator.compiledCode))),
  };
}

export const test = "";
