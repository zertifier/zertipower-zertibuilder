const {ethers} = require("ethers");

async function mintBatchERC20(batchContractAddress:any, contractAddresses:any, walletReceivers:any, amounts:any, privateKey:any, abi:any, chainId:any, rpcUrl:any) {

    //console.log(batchContractAddress, contractAddresses, walletReceivers, amounts, privateKey, chainId, rpcUrl)

    return new Promise(async (resolve, reject) => {

        try {
            const provider = new ethers.JsonRpcProvider(rpcUrl)
            if (await getChain(provider) != chainId) {
                console.log("error provider chain =", await getChain(provider), "and chain id ", chainId)
                reject('Provider is not in the selected blockchain');
            }
            //warning error TypeError: Cannot read properties of null (reading 'toHexString') is because it faults private key at wallets or any data (check db relations)
            const wallet = new ethers.Wallet(privateKey)
            const walletSigner = await wallet.connect(provider);
            const contract = new ethers.Contract(
                batchContractAddress,
                abi,
                walletSigner
            )

            amounts = amounts.map((amount:any) => {
                amount = ethers.parseUnits(amount.toString())
                return amount;
            })

            //console.log("fins aqui bé",amounts)

            let tx = await contract.batchMint(contractAddresses,walletReceivers, amounts)
            await tx.wait(3)
            resolve(tx.hash)

        } catch (e) {
            reject(e)
        }

    })
}

async function mintERC20(contractAddress:string, privateKey:string, addressToSend:string, rpcUrl:string, amount:any, chainId:number, abi:string) {
    return new Promise(async (resolve, reject) => {
        console.log(contractAddress, privateKey, addressToSend, rpcUrl, amount, chainId);
        try {
            const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
            if (await getChain(provider) != chainId) {
                console.log("error provider chain =", await getChain(provider), "and chain id ", chainId)
                reject('Provider is not in the selected blockchain');
            }
            //warning error TypeError: Cannot read properties of null (reading 'toHexString') is because it faults private key at wallets or any data (check db relations)
            const wallet = new ethers.Wallet(privateKey)
            const walletSigner = await wallet.connect(provider);
            const contract = new ethers.Contract(
                contractAddress,
                abi,
                walletSigner
            )
            amount = ethers.parseUnits(amount.toString())
            //console.log("amount: ",amount)
            let tx = await contract.mint(addressToSend, amount)
            await tx.wait(3)
            resolve(tx.hash)
        } catch (e) {
            console.log('ERROR MINTING ', e)
            reject(e)
        }
    })
}

async function mintERC1155(provider:string, privateKey:string, contractAbi:string, contractAddress:string, index:any, name:any, amount:any, chainId:number, chainTxUrl:string) {
    try {
        if (await getChain(provider) === chainId) {
            const wallet = getWallet(provider,privateKey)
            const nonce = await getNonce(wallet)
            const gasFee = await getGasPrice(provider)
            const contractInstance = await createContractInstance(provider, contractAbi, contractAddress);
            let rawTxn = await contractInstance.populateTransaction.mintERC1155(index, name, amount, {
                gasPrice: gasFee,
                nonce: nonce
            })
            console.log("...Submitting transaction with gas price of:", ethers.utils.formatUnits(gasFee, "gwei"), " - & nonce:", nonce)
            let signedTxn = (await wallet).sendTransaction(rawTxn)
            let reciept = (await signedTxn).wait()
            if (reciept) {
                console.log("Transaction is successful!!!" + '\n' + "Transaction Hash:", (await signedTxn).hash + '\n' + "Block Number: " + (await reciept).blockNumber + '\n' + "Navigate to " + chainTxUrl + (await signedTxn).hash, "to see your transaction")
            } else {
                console.log("Error submitting transaction")
            }
        } else {
            console.log("Wrong network - Connect to configured chain ID first!")
        }
    } catch (e) {
        console.log("Error Caught in Catch Statement: ", e)
    }
}

async function getTokensAmount(contractInstance:any, walletAddress:string) {
    return await contractInstance.getBalance(walletAddress)
}

async function createContractInstance(provider:any, contractAbi:string, contractAddress:string) {
    return new ethers.Contract(contractAddress, contractAbi, provider)
}

async function createContractInstanceWithSigner(provider:any, contractAddress:string, abi:string) {
    let signer = ethers.Wallet.createRandom()
    signer = signer.connect(provider)
    return new ethers.Contract(contractAddress, abi, signer);
}

async function createProvider(rpcUrl:string) {
    return new ethers.providers.JsonRpcProvider(rpcUrl)
}

async function getGasPrice(provider:any) {
    let feeData = await provider.getFeeData()
    return feeData.gasPrice
}

async function getWallet(provider:string, privateKey:string) {
    const wallet = await new ethers.Wallet(privateKey, provider)
    return wallet
}

async function getChain(provider:any) {
    let chainId = await provider.getNetwork()
    return chainId.chainId
}

async function getContractInfo(contractInstance:any, index:any, id:number) {
    let contract = await contractInstance.getERC1155byIndexAndId(index, id)
    return contract;
}

async function getNonce(signer:any) {
    return (await signer).getTransactionCount()
}

async function setSectionContracts(contracts:any) {
    this.sectionContractAddress = contracts;
    let importIndex = 1;
    let exportIndex = 1;
    for (const key in contracts) {
        if (parseInt(key) % 2 == 0) {
            this.contracts['sections']['export'][`p${exportIndex}`] = await this.createContractCustom(
                contracts[key]['contract_address'], undefined, contracts[key])
            ++exportIndex
        } else {
            this.contracts['sections']['import'][`p${importIndex}`] = await this.createContractCustom(
                contracts[key]['contract_address'], undefined, contracts[key])
            ++importIndex
        }
    }
    console.log(this.contracts, "CONTRACTS")
}

async function createContractCustom(contract:any) {
    if (!this.connection || this.connectMethod == 'undefined') {
        const provider = await this.createRpcProvider(contract);
        let signer = ethers.Wallet.createRandom()
        signer = signer.connect(provider)
        this.connection = {provider, signer};
    }
    const providerNetwork = await this.connection.provider.getNetwork()
    const providerChain = providerNetwork.chainId

    if (!this.zertiEthersService.supportedNetworks[providerChain]) {
        throw new Error(`Network with id ${providerChain} not supported`)//.ZNetworkNotDefined(`Network with id ${providerChain} not supported`);
    }
    let abi = contract['abi']
    return new ethers.Contract(contract, abi, this.connection.signer);
}

function createWalletByReference(reference:string | number){
    const WALLET_CODE = reference + process.env.JWT_SECRET!;
    const KECCAK_HASH = ethers.keccak256(ethers.toUtf8Bytes(WALLET_CODE));
    const WALLET = new ethers.Wallet(KECCAK_HASH)
    return WALLET.address
}

module.exports = {
    mintERC1155,
    mintERC20,
    createContractInstance,
    createProvider,
    createContractInstanceWithSigner,
    mintBatchERC20,
    createWalletByReference
}