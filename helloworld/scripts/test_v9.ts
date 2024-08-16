import {
  Kupmios,
  Lucid,
  SLOT_CONFIG_NETWORK,
  toHex,
} from "npm:@cuonglv0297/lucid-custom";

const ADDRESS =
  "addr_test1vzmcyp2xx47r736xcd2jw89ym0qx884f7wqer96cvhz7cnqmuq95r";
const PERSONAL_SK =
  "ed25519_sk170ftgwjrhzclv2ftmyeky79qqnlqdx36pgnrxs6euq6gp6092zrsdfcm7l";

const setupLucid = async (): Promise<Lucid> => {
  const lucid = await Lucid.new(
    new Kupmios(
      "http://dev.cf-ibc-testnet-mithril-sidechain.metadata.dev.cf-deployments.org:1442",
      "ws://dev.cf-ibc-testnet-mithril-sidechain.metadata.dev.cf-deployments.org:1337",
    ),
    "Preview",
  );
  const chainZeroTime = await querySystemStart(
    "ws://dev.cf-ibc-testnet-mithril-sidechain.metadata.dev.cf-deployments.org:1337",
  );
  SLOT_CONFIG_NETWORK.Preview.zeroTime = chainZeroTime;
  return lucid;
};

const ogmiosWsp = async (
  ogmiosUrl: string,
  methodname: string,
  args: unknown,
) => {
  const client = new WebSocket(ogmiosUrl);
  await new Promise((res) => {
    client.addEventListener("open", () => res(1), {
      once: true,
    });
  });
  client.send(
    JSON.stringify({
      jsonrpc: "2.0",
      method: methodname,
      params: args,
    }),
  );
  return client;
};

export const querySystemStart = async (ogmiosUrl: string) => {
  const client = await ogmiosWsp(ogmiosUrl, "queryNetwork/startTime", {});
  const systemStart = await new Promise<string>((res, rej) => {
    client.addEventListener(
      "message",
      (msg: MessageEvent<string>) => {
        try {
          const { result } = JSON.parse(msg.data);
          res(result);
          client.close();
        } catch (e) {
          rej(e);
        }
      },
      {
        once: true,
      },
    );
  });
  const parsedSystemTime = Date.parse(systemStart);

  return parsedSystemTime;
};

function getAddressFromPublicKeyHash(hash: string, lucid: Lucid) {
  const addr = lucid.utils.credentialToAddress(
    {
      type: "Key",
      hash,
    },
  );

  console.log({
    addr,
  });
}

(async () => {
  let lucid = await setupLucid();
  // const pkh = lucid.utils.keyHashToCredential();
  // const pkh = lucid.utils.getAddressDetails(
  //   ADDRESS,
  // ).paymentCredential?.hash;
  // console.log({
  //   pkh,
  // });

  // return;

  // vkey personal: ed25519_pk1xv3vn9f5fd4pchrey56fts24thvs3z2s8yc99ylc624h3glmxt5qx7uqxx

  const base64_string =
    "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";

  const cbor_string = toHex(
    Uint8Array.from(atob(base64_string), (c) => c.charCodeAt(0)),
  );
  try {
    // const pkh = lucid.utils.keyHashToCredential()
    // const pkh = lucid.utils.getAddressDetails(
    //   "addr_test1vqj82u9chf7uwf0flum7jatms9ytf4dpyk2cakkzl4zp0wqgsqnql",
    // ).paymentCredential?.hash;

    // console.log({
    //   pkh,
    // });
    const tx = lucid.fromTx(cbor_string);

    // Case 1: Personal Sign Tx
    // const DEPLOYER_SEED =
    //   "direct language gravity into finger nurse rug rug spoon toddler music ability brisk wasp sound ball join guard pattern smooth lemon obscure raise royal";
    // lucid = lucid.selectWalletFromSeed(
    //   DEPLOYER_SEED,
    //   { addressType: "Enterprise" },
    // );
    lucid = lucid.selectWalletFromPrivateKey(PERSONAL_SK);
    const signedTx = await tx.sign().complete();

    // Case2: Both Personal + Relayer
    // signer 1
    // const DEPLOYER_SEED =
    //   "direct language gravity into finger nurse rug rug spoon toddler music ability brisk wasp sound ball join guard pattern smooth lemon obscure raise royal";
    // lucid = lucid.selectWalletFromSeed(
    //   DEPLOYER_SEED,
    //   { addressType: "Enterprise" },
    // );
    // const txWitness1 = await tx.partialSign();

    // // signer 2
    // const txWitness2 = await tx.partialSignWithPrivateKey(PERSONAL_SK);
    // const signedTx = await tx.assemble([txWitness1, txWitness2]).complete();

    await Deno.writeTextFileSync(
      "signed_tx.txt",
      signedTx.txSigned.to_json(),
    );

    const txHash = await signedTx.submit();
    console.log({
      txHash,
    });
  } catch (error) {
    console.log(error);
    console.log(error.message);
  }
})();
