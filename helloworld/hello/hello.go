package hello

import (
	"encoding/hex"
	"encoding/json"
	"fmt"
	"github.com/Salvionied/apollo/serialization/Address"
	"io/ioutil"
	"os"

	"github.com/Salvionied/apollo"
	"github.com/Salvionied/apollo/apollotypes"
	"github.com/Salvionied/apollo/serialization/PlutusData"
	"github.com/Salvionied/apollo/txBuilding/Backend/OgmiosChainContext"
	"github.com/SundaeSwap-finance/kugo"
	"github.com/SundaeSwap-finance/ogmigo/v6"
	"github.com/fxamacker/cbor/v2"
)

func Lock1Ada() {
	ogmigoClient := ogmigo.New(ogmigo.WithEndpoint("ws://localhost:1338"))
	kugoClient := kugo.New(kugo.WithEndpoint("http://localhost:1442"))
	ogmigoCtx := apollo.NewOgmiosChainContext(*ogmigoClient, *kugoClient)

	apolloBE := apollo.New(&ogmigoCtx)
	SEED := "direct language gravity into finger nurse rug rug spoon toddler music ability brisk wasp sound ball join guard pattern smooth lemon obscure raise royal"
	// addr_test1vqj82u9chf7uwf0flum7jatms9ytf4dpyk2cakkzl4zp0wqgsqnql
	// addr1qyj82u9chf7uwf0flum7jatms9ytf4dpyk2cakkzl4zp0wynh0y80ug6wpwxead4dvy6dde6u0qn46tenvfv70aewt9qlnfpsa

	apolloBE, _ = apolloBE.SetWalletFromMnemonic(SEED, Address.TESTNET)
	apolloBE = apolloBE.SetWalletAsChangeAddress()

	// vKey := "addr_test1vz8nzrmel9mmmu97lm06uvm55cj7vny6dxjqc0y0efs8mtqsd8r5m"
	// sKey := "ed25519_sk1rvgjxs8sddhl46uqtv862s53vu4jf6lnk63rcn7f0qwzyq85wnlqgrsx42"
	// apolloBE = apolloBE.SetWalletFromKeypair(vKey, sKey, constants.TESTNET)
	// apolloBE = apolloBE.SetWalletAsChangeAddress()

	//addr := Address.Address{
	//	PaymentPart: apolloBE.GetWallet().GetAddress().PaymentPart,
	//	StakingPart: []byte{},
	//	Network:     Address.TESTNET,
	//	AddressType: Address.KEY_NONE,
	//	HeaderByte:  (Address.KEY_NONE << 4) | 0,
	//	Hrp:         "addr_test",
	//}
	//apolloBE = apolloBE.SetWalletFromBech32(addr.String())
	//apolloBE = apolloBE.SetWalletAsChangeAddress()

	publicKeyHash := apolloBE.GetWallet().PkeyHash()
	fmt.Println(hex.EncodeToString(publicKeyHash[:]))

	txHash, err := lockAssets(ogmigoCtx, apolloBE)
	if err != nil {
		fmt.Println(err)
		panic("ERR Lock Assets")
	}

	fmt.Println(txHash)
}

func lockAssets(ogmigoContext OgmiosChainContext.OgmiosChainContext, apolloBE *apollo.Apollo) (string, error) {
	f, err := os.Open("../plutus.json")
	defer f.Close()
	if err != nil {
		fmt.Println(err)
		panic("HERE OPENING FILE")
	}

	aikenPlutusJSON := apollotypes.AikenPlutusJSON{}
	plutus_bytes, err := ioutil.ReadAll(f)
	err = json.Unmarshal(plutus_bytes, &aikenPlutusJSON)
	if err != nil {
		panic("HERE UNMARSHALING")
	}
	script, err := aikenPlutusJSON.GetScript("helloworld.hello_world")
	if err != nil {
		panic("ERR Get Script")
	}

	contractAddress := script.ToAddress(nil)
	fmt.Println(contractAddress)
	pkeyHash := apolloBE.GetWallet().PkeyHash()
	publicKeyHash := hex.EncodeToString(pkeyHash[:])

	fmt.Println(publicKeyHash)
	datum := PlutusData.PlutusData{
		TagNr:          121,
		PlutusDataType: PlutusData.PlutusArray,
		Value: PlutusData.PlutusIndefArray{
			PlutusData.PlutusData{
				TagNr:          0,
				PlutusDataType: PlutusData.PlutusBytes,
				Value:          pkeyHash,
			},
		},
	}

	utxos := ogmigoContext.Utxos(*apolloBE.GetWallet().GetAddress())
	apolloBE, err = apolloBE.AddInput(utxos...).PayToContract(contractAddress, &datum, 1100_000, true).Complete()
	if err != nil {
		return "", err
	}

	apolloBE = apolloBE.Sign()
	tx := apolloBE.GetTx()
	cborred, err := cbor.Marshal(tx)
	if err != nil {
		fmt.Println(err)
	}
	fmt.Println(hex.EncodeToString(cborred))
	tx_id, err := ogmigoContext.SubmitTx(*tx)
	if err != nil {
		fmt.Println(err)
	}
	return hex.EncodeToString(tx_id.Payload), nil
}
