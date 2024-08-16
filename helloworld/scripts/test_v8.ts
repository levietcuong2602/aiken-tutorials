import {
  Kupmios,
  Lucid,
  SLOT_CONFIG_NETWORK,
  toHex,
} from "https://deno.land/x/lucid@0.8.3/mod.ts";

// const ADDRESS =
//   "addr_test1vrugwz8d09kcnd3n9saautceqaau8c32s4hgrq53zgqheas7x5epd";
// const PERSONAL_SK =
//   "ed25519_sk18kgcqd2amkte8duzptxdwfx30exmtm270afdnxj7yh0upeq73kgqd2rvmz";
const ADDRESS =
  "addr_test1vzmcyp2xx47r736xcd2jw89ym0qx884f7wqer96cvhz7cnqmuq95r";
const PERSONAL_SK =
  "ed25519_sk170ftgwjrhzclv2ftmyeky79qqnlqdx36pgnrxs6euq6gp6092zrsdfcm7l";

const setupLucid = async (): Promise<Lucid> => {
  const lucid = await Lucid.new(
    new Kupmios(
      "http://192.168.10.140:1442",
      "ws://192.168.10.140:1337",
    ),
    "Preview",
  );
  const chainZeroTime = await querySystemStart(
    "ws://192.168.10.140:1337",
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
  client.send(JSON.stringify({
    type: "jsonwsp/request",
    version: "1.0",
    servicename: "ogmios",
    methodname,
    args,
  }));
  return client;
};

export const querySystemStart = async (ogmiosUrl: string) => {
  const client = await ogmiosWsp(ogmiosUrl, "Query", {
    query: "systemStart",
  });
  const systemStart = await new Promise<string>((res, rej) => {
    client.addEventListener("message", (msg: MessageEvent<string>) => {
      try {
        const {
          result,
        } = JSON.parse(msg.data);
        res(result);
        client.close();
      } catch (e) {
        rej(e);
      }
    }, {
      once: true,
    });
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

async function generateAcc() {
  const lucid = await setupLucid();
  // const privateKey = lucid.utils.generatePrivateKey();
  // await Deno.writeTextFile("key.sk", privateKey);
  // const address = await lucid
  //   .selectWalletFromPrivateKey(privateKey)
  //   .wallet.address();
  // await Deno.writeTextFile("key.addr", address);

  const pkh = lucid.utils.getAddressDetails(
    ADDRESS,
  ).paymentCredential?.hash;
  console.log({
    pkh,
  });
}

(async () => {
  let lucid = await setupLucid();

  // const pkh = lucid.utils.keyHashToCredential();
  // const pkh = lucid.utils.getAddressDetails(
  //   "addr_test1vrugwz8d09kcnd3n9saautceqaau8c32s4hgrq53zgqheas7x5epd",
  // ).paymentCredential?.hash;
  // console.log({
  //   pkh,
  // });

  // return;

  const base64_string =
    "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";

  const cbor_string = toHex(
    Uint8Array.from(atob(base64_string), (c) => c.charCodeAt(0)),
  );
  try {
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
});

await generateAcc();
