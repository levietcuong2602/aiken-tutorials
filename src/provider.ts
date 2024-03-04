import { initialLucid } from "./util.ts";
import { KUPMIOS_ENV } from "./constants/index.ts";

const lucid = await initialLucid(KUPMIOS_ENV);

// query UTxOs
const utxos = await lucid.provider.getUtxos(
  "addr_test1vqwz2gkgd7uqnsuhfsf8dmf5pv9axdmxdk52dyhpff00p6cc5azk7",
);
console.log({
  utxos,
});

// query UTxOs V2
const utxosOp2 = await lucid.utxosAt(
  "addr_test1vqwz2gkgd7uqnsuhfsf8dmf5pv9axdmxdk52dyhpff00p6cc5azk7",
);
console.log({
  utxosOp2,
});
