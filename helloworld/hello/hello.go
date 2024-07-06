package hello

import (
	"encoding/hex"
	"encoding/json"
	"fmt"
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
	ogmigoClient := ogmigo.New(ogmigo.WithEndpoint("ws://localhost:1337"))
	kugoClient := kugo.New(kugo.WithEndpoint("http://localhost:1442"))
	ogmigoCtx, err := apollo.NewOgmiosChainContext(*ogmigoClient, *kugoClient)
	if err != nil {
		fmt.Println(err)
		panic("ERR Ogmigo")
	}

	apolloBE := apollo.New(&ogmigoCtx)
	SEED := "direct language gravity into finger nurse rug rug spoon toddler music ability brisk wasp sound ball join guard pattern smooth lemon obscure raise royal"

	// apolloBE = apolloBE.SetWalletFromBech32("ed25519_sk1rvgjxs8sddhl46uqtv862s53vu4jf6lnk63rcn7f0qwzyq85wnlqgrsx42")
	apolloBE, _ = apolloBE.SetWalletFromMnemonic(SEED)
	apolloBE = apolloBE.SetWalletAsChangeAddress()
	publicKeyHash := apolloBE.GetWallet().PkeyHash()
	fmt.Println(publicKeyHash)

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
	datum := PlutusData.PlutusData{
		TagNr:          121,
		PlutusDataType: PlutusData.PlutusArray,
		Value: PlutusData.PlutusIndefArray{
			PlutusData.PlutusData{
				TagNr:          0,
				PlutusDataType: PlutusData.PlutusBytes,
				Value:          apolloBE.GetWallet().PkeyHash(),
			},
		},
	}
	apolloBE, err = apolloBE.PayToContract(contractAddress, &datum, 2_000, true).Complete()
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
	tx_id, _ := ogmigoContext.SubmitTx(*tx)

	return hex.EncodeToString(tx_id.Payload), nil
}
