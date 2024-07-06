import { Data } from "https://deno.land/x/lucid@0.8.3/mod.ts";

const Datum = Data.Object({
  owner: Data.String,
});
type TDatumSchema = Data.Static<typeof Datum>;
export const TDatumSchema = Datum as unknown as TDatumSchema;

const Redeemer = Data.Object({
  msg: Data.String,
});
type TRedeemerSchema = Data.Static<typeof Redeemer>;
export const TRedeemerSchema = Redeemer as unknown as TRedeemerSchema;
