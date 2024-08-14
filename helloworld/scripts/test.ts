import {
  Kupmios,
  Lucid,
  SLOT_CONFIG_NETWORK,
  toHex,
} from "npm:@cuonglv0297/lucid-custom";

const ADDRESS =
  "addr_test1vrugwz8d09kcnd3n9saautceqaau8c32s4hgrq53zgqheas7x5epd";
const DEPLOYER_SK =
  "ed25519_sk18kgcqd2amkte8duzptxdwfx30exmtm270afdnxj7yh0upeq73kgqd2rvmz";

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

  const base64_string =
    "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";

  const cbor_string = toHex(
    Uint8Array.from(atob(base64_string), (c) => c.charCodeAt(0)),
  );
  try {
    // signer 1
    // const signer1 = lucid.selectWalletFromPrivateKey(DEPLOYER_SK);
    lucid = lucid.selectWalletFromSeed(
      "direct language gravity into finger nurse rug rug spoon toddler music ability brisk wasp sound ball join guard pattern smooth lemon obscure raise royal",
      { addressType: "Enterprise" },
    );
    const tx = lucid.fromTx(cbor_string);
    const txWitness1 = await tx.partialSign();

    // signer by private key signer 2
    const txWitness2 = await tx.partialSignWithPrivateKey(DEPLOYER_SK);
    const signedTx = await tx.assemble([txWitness1, txWitness2]).complete();

    // signer 2 sign tx
    // let newLucid = await Lucid.new(
    //   new Kupmios(
    //     "http://dev.cf-ibc-testnet-mithril-sidechain.metadata.dev.cf-deployments.org:1442",
    //     "ws://dev.cf-ibc-testnet-mithril-sidechain.metadata.dev.cf-deployments.org:1337",
    //   ),
    //   "Preview",
    // );
    // newLucid = newLucid.selectWalletFromSeed(
    //   "direct language gravity into finger nurse rug rug spoon toddler music ability brisk wasp sound ball join guard pattern smooth lemon obscure raise royal",
    //   { addressType: "Base" },
    // );
    // const signedTx2 = await initialTx2.sign().complete();

    const txHash = await signedTx.submit();
    console.log({
      txHash,
    });
  } catch (error) {
    console.log(error);
    console.log(error.message);
  }

  // const pkh = lucid.utils.keyHashToCredential()
  // const pkh = lucid.utils.getAddressDetails(
  //   "addr_test1vqj82u9chf7uwf0flum7jatms9ytf4dpyk2cakkzl4zp0wqgsqnql",
  // ).paymentCredential?.hash;

  // console.log({
  //   pkh,
  // });
})();
