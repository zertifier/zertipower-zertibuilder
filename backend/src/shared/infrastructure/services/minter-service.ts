import { Injectable } from "@nestjs/common";
require('dotenv').config();
import mysql from "mysql2/promise";
import { MysqlService } from "src/shared/infrastructure/services/mysql-service/mysql.service";
import { PrismaService } from "src/shared/infrastructure/services/prisma-service/prisma-service";
const {ethers} = require("ethers");

/**
 * Service used to interact with the datadis api
 */
@Injectable()
export class MinterService {

    private conn: mysql.Pool;

    constructor(private mysql: MysqlService, private prisma: PrismaService) {
        this.conn = this.mysql.pool;
        console.log("Minting process run")
        //this.mintRegistersInterval()
    }

    /** Each x time tries to mint database registers that dont have transaction yet
     * @param timeBeetweenMint default a hour (milliseconds)
     */
    mintRegistersInterval(timeBeetweenMint = 3600000) {

        this.mint()

        setInterval(async () => {
            this.mint()
        }, timeBeetweenMint);
    }

    /** Mint prepara los datos de los registros sin transacción para el minting
     * llama a la función que se encarga de hacer este minting
     *
     * @return {Promise<void>}
     */
    async mint() {

        console.log("mint")

        let communityEnergyProductionSc: any;
        let communityEnergyConsumptionSc: any;
        let batchMinterSc: any;
        let amounts: any[] = [];
        let energyRegistersIds: any[] = [];
        let walletReceivers: any = [];
        let contractAddresses: any = [];
        let energyRegisters = await this.getUntokenizedEnergy();
        let users: any = [];
        let blockchainData: any = [];

        try {
            users = await this.getCustomersCups();
            blockchainData = await this.getBlockchainAndScData();
        } catch (e) {
            console.log("Major breaking error: error getting minting data from database: ", e)
            return;
        }

        if (!blockchainData.length) {
            console.log("Major breaking error: error getting smart contract info: review database ( blockchains, smart_contracts)")
            return;
        }

        if (!users.length) {
            console.log("Major breaking error: error getting smart users info: review database (users)")
            return;
        }

        try {
            blockchainData.map((blockchainRegister: any) => {
                switch (blockchainRegister.contract_reference) {
                    case 'export':
                        communityEnergyProductionSc = blockchainRegister;
                        break;
                    case 'consumption':
                        communityEnergyConsumptionSc = blockchainRegister;
                        break;
                    case 'batchMinter':
                        batchMinterSc = blockchainRegister;
                        break;
                    default:
                        throw new Error("Major breaking error: unexpected smart contract address register")
                        break;
                }
            })
        } catch (e) {
            console.log(e)
            return;
        }

        users = users.map((user: any) => {
            // if (!user.reference) {
            //     console.log("Minor error: invalid  user reference: ", user)
            //     user = undefined
            //     return user
            // }
            if (!user.wallet_address) {
                user.wallet_address = createWalletByReference(user.id)
            }

            return user;
        }).filter((e: any) => e)

        energyRegisters.map((energyRegister: any) => {
            let user = users.find((user: any) => user.id === energyRegister.cups_id)
            if (!user) {
                console.log("Minor error: cups not found. EnergyRegister.cups_id: ", energyRegister.cups_id);
                return undefined;
            }
            if (energyRegister.export) {
                contractAddresses.push(communityEnergyProductionSc.contract_address);
                walletReceivers.push(user.wallet_address);
                amounts.push(energyRegister.export);
            }
            if (energyRegister.import) {
                contractAddresses.push(communityEnergyConsumptionSc.contract_address);
                walletReceivers.push(user.wallet_address);
                amounts.push(energyRegister.import);
            }
        }).filter((e: any) => e)

        console.log("untokenized energy per user: ", amounts.length, "contract addresses ", contractAddresses.length, "wallet receivers ", walletReceivers.length, "PK", process.env.PK, "SC ADDRESS", batchMinterSc.smart_contract_address )

        //the elements sent to transaction shouldnt exceed a limit number
        //cut the array to divide the wheight carried by transaction

        amounts = splitArray(amounts, 50);
        contractAddresses = splitArray(contractAddresses, 50);
        walletReceivers = splitArray(walletReceivers, 50);
        energyRegisters = splitArray(energyRegisters, 50);
        let energyRegistersId: any[] = [];
        let txToUpdate: any[] = [];
        
        for (let i = 0; i < amounts.length; i++) {

            let tx: any = undefined;
            try {
                tx = await mintBatchERC20(batchMinterSc.contract_address, contractAddresses[i], walletReceivers[i], amounts[i], process.env.PK, batchMinterSc.abi, batchMinterSc.blockchain_id, batchMinterSc.rpc_url)
                console.log("minted tx:", tx)
            } catch (e) {
                console.log("Major error: error minting: ", e)
            }

            if (tx) {
                energyRegistersId = [];
                txToUpdate = [];
                //prepare the values to create update query
                energyRegisters[i].map((energyRegister: any) => {
                    if (energyRegister.export) {
                        txToUpdate.push(['tx_export', tx]);
                        energyRegistersId.push(energyRegister.id);
                    }
                    if (energyRegister.import) {
                        txToUpdate.push(['tx_import', tx]);
                        energyRegistersId.push(energyRegister.id);
                    }
                    txToUpdate.push(['smart_contracts_version', blockchainData[0].version]);
                    energyRegistersId.push(energyRegister.id);
                })

                try {
                    // console.log('energy_data id', energyRegistersId)
                    //put the tx into registers
                    const { query, values } = createMultipleUpdateQuery('datadis_energy_registers', txToUpdate, energyRegistersId);
                    console.log(query,values)
                    const [ROWS] = await this.conn.execute(query, values);
                } catch (e) {
                    console.log("Major error: error putting the tx into registers: ", e)
                }
            }
        }
    }

    async getCustomersCups() {
        let data: any = await this.prisma.$queryRaw`
    SELECT cups.id AS id, cups.cups AS cups, 
           customers.wallet_address AS wallet, customers.name AS name, customers.dni AS dni 
           FROM customers LEFT JOIN cups 
           ON cups.customer_id = customers.id
    `;
        return data;
    }

    /** Obtain blockchain and smart contract data according to config smart contract version.
     *  expect 3 smart contracts that are the current version
     * @return {Promise<*>}
     */
    async getBlockchainAndScData() {

        try {
            const [ROWS] = await this.conn.query(
                `SELECT * FROM smart_contracts LEFT JOIN blockchains 
        ON smart_contracts.blockchain_id=blockchains.blockchain_id; 
        `);
            return ROWS;
        } catch (e) {
            console.log("error getting blockchain and sc data")
            throw new Error(e);
        }

    }

    async getUntokenizedEnergy() {

        let data: any = await this.prisma.$queryRaw`
        SELECT * 
        FROM datadis_energy_registers
        WHERE
            (import IS NOT NULL
            AND tx_import IS NULL)
            OR
            (export IS NOT NULL
            AND tx_export IS NULL)
        ORDER BY info_dt;
        `;
        return data;
    }

}

function createWalletByReference(reference: string | number) {
    const WALLET_CODE = reference + process.env.JWT_SECRET!;
    const KECCAK_HASH = ethers.keccak256(ethers.toUtf8Bytes(WALLET_CODE));
    const WALLET = new ethers.Wallet(KECCAK_HASH)
    return WALLET.address
}

const createMultipleUpdateQuery = (table:any, params:any, ids:any) => {
    let query = 'UPDATE ' + table + ' SET ';
    let queryValues = [];
    let values = [];
    for (let i = 0; i < params.length; i++) {
        const column = camelToSnake(params[i][0]);
        queryValues.push(`${column} = ? `);
        //values.push(column);
        values.push(params[i][1]);
    }
    let idPlaceholders = [];
    for (let i = 0; i < ids.length; i++) {
        idPlaceholders.push('?');
    }
    query = query.concat(queryValues.join(','));
    query = query.concat(' WHERE id IN (' + idPlaceholders.join(',') + ')');
    values = values.concat(ids);
    return {query, values};
}

function splitArray (array:any[], size:number) {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
}

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

async function getChain(provider:any) {
    let chainId = await provider.getNetwork()
    return chainId.chainId
}

const camelToSnake = (camelCaseString: string): string => {
    return camelCaseString.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}
