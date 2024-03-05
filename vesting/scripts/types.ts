import { Data, Lucid } from "https://deno.land/x/lucid@0.10.7/mod.ts";

const VestingSchema = Data.Object({
  lock_until: Data.Integer(), // this is POSIX time, you can check and set it here: https://www.unixtimestamp.com
  owner: Data.Bytes(), // we can pass owner's verification key hash as byte array but also as a string
  beneficiary: Data.Bytes(), // we can beneficiary's hash as byte array but also as a string
});

export type VestingDatum = Data.Static<typeof VestingSchema>;
export const VestingDatum = VestingSchema as unknown as VestingDatum;

export function createVestingDatum(
  lucid: Lucid,
  lock_until: bigint,
  owner: string,
  beneficiary: string,
): string | undefined {
  let beneficiaryHash = lucid.utils.getAddressDetails(beneficiary)
    .paymentCredential?.hash;
  if (beneficiaryHash === undefined) {
    beneficiaryHash = "";
  }

  let ownerHash = lucid.utils.getAddressDetails(owner)
    .paymentCredential?.hash;
  if (ownerHash === undefined) {
    ownerHash = "";
  }

  const datum: VestingDatum = {
    lock_until,
    owner: ownerHash,
    beneficiary: beneficiaryHash,
  };
  return Data.to(datum, VestingDatum);
}
