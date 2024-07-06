use aiken/hash.{Blake2b_224, Hash}
use aiken/list
use aiken/string
use aiken/transaction.{
  OutputReference, ScriptContext, Spend, Transaction, TransactionId,
}
use aiken/transaction/credential.{VerificationKey}

type Datum {
  owner: Hash<Blake2b_224, VerificationKey>,
}

type Redeemer {
  msg: ByteArray,
}

validator {
  fn hello_world(datum: Datum, redeemer: Redeemer, ctx: ScriptContext) -> Bool {
    trace string.from_bytearray(redeemer.msg)
    let must_say_hello = redeemer.msg == "Hello, World!"
    let must_be_signed =
      list.has(ctx.transaction.extra_signatories, datum.owner)

    must_say_hello? && must_be_signed?
  }
}

test hello_world_example() {
  let datum =
    Datum {
      owner: #"0000000000000000000000000000000000000000000000000000000000000000",
    }

  let redeemer = Redeemer { msg: "Hello, World!" }

  let ctx =
    ScriptContext {
      purpose: Spend(
        OutputReference { transaction_id: TransactionId(""), output_index: 0 },
      ),
      transaction: transaction.placeholder()
        |> fn(transaction) {
             Transaction { ..transaction, extra_signatories: [datum.owner] }
           },
    }

  hello_world(datum, redeemer, ctx)
}
