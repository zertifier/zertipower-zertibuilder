// TODO set and get textMetadata
// TODO set numericMetadata

import { Injectable } from "@nestjs/common";
import { JsonRpcProvider } from "ethers";
require('dotenv').config();
import mysql from "mysql2/promise";
import { MysqlService } from "src/shared/infrastructure/services/mysql-service/mysql.service";
import { PrismaService } from "src/shared/infrastructure/services/prisma-service/prisma-service";
const { ethers } = require("ethers");
require('dotenv').config();
const https = require('https');

@Injectable()
export class BlockchainService {

    private conn: mysql.Pool;

    smartContract: any;
    provider: any;

    constructor(private mysql: MysqlService, private prisma: PrismaService) {
        this.conn = this.mysql.pool;
        this.initialize();
    }

    async initialize() {
        try{
            let smartContracts = await this.getBlockchainAndScData();
            let smartContract = smartContracts.find((smartContract: any) => smartContract.contract_reference == 'energyMapping')
            await this.obtainSmartContract(smartContract.contract_address, process.env.PK, smartContract.abi, smartContract.blockchain_id, smartContract.rpc_url).catch(e => {
                console.log(e)
            })
        }catch(error){
            console.log("Error inicialitzant servei blockchain",error)
        }
    }

    /** Obtain blockchain and smart contract data according to config smart contract version.
     *  expect 3 smart contracts that are the current version
     * @return {Promise<*>}
     */
    async getBlockchainAndScData() {
        try {
            const [ROWS]: any = await this.conn.query(
                `SELECT * FROM smart_contracts LEFT JOIN blockchains 
        ON smart_contracts.blockchain_id=blockchains.blockchain_id; 
        `);
            return ROWS;
        } catch (e) {
            console.log("error getting blockchain and sc data")
            throw new Error(e);
        }
    }

    async obtainSmartContract(contractAddress: any, privateKey: any, abi: any, chainId: any, rpcUrl: any) {
        //console.log(batchContractAddress, contractAddresses, walletReceivers, amounts, privateKey, chainId, rpcUrl)

        return new Promise(async (resolve, reject) => {
            try {
                let networkChainUrl = await this.getRpc(chainId)
                console.log(networkChainUrl)
                //this.provider = new JsonRpcProvider(networkChainUrl)
                this.provider = new JsonRpcProvider("https://ethereum-sepolia.blockpi.network/v1/rpc/public");
                //warning error TypeError: Cannot read properties of null (reading 'toHexString') is because it faults private key at wallets or any data (check db relations)
                const wallet = new ethers.Wallet(privateKey)
                const walletSigner = await wallet.connect(this.provider);
                const contract = new ethers.Contract(
                    contractAddress,
                    abi,
                    walletSigner
                )
                this.smartContract = contract;
                resolve(this.smartContract)
            } catch (e) {
                reject(e)
            }
        })
    }

    async getEnergyValue(cups: string, type: string, timestamp: string) {
        return new Promise(async (resolve, reject) => {
            try {
                cups = this.toKeccak256(cups)
                type = this.toKeccak256(type)
                console.log(cups, type, timestamp)
                let energyValue = await this.smartContract.getEnergyValue(cups, type, timestamp)
                console.log(energyValue)
                energyValue = ethers.formatEther(energyValue)
                resolve(energyValue)
            } catch (e) {
                if (e.reason) {
                    reject(e.reason)
                } else {
                    reject(e)
                }
            }
        })
    }

    async getEnergyHistoricInterval(cups: string, type: string, timestampStart: string, timestampEnd: string) {
        return new Promise(async (resolve, reject) => {
            try {
                const cupsHash = this.toKeccak256(cups)
                const typeHash = this.toKeccak256(type)
                let energyHistoricInterval = await this.smartContract.getEnergyHistoricInterval(cupsHash, typeHash, timestampStart, timestampEnd)
                // Itera sobre cada par de timestamp y valor
                const formattedEnergyHistoricInterval = energyHistoricInterval.map(([timestamp, value]: any) => {
                    const formattedTimestamp = timestamp.toString();
                    const formattedValue = ethers.formatEther(value);
                    return { timestamp: formattedTimestamp, value: formattedValue };
                });
                console.log("energyHistoricInterval", formattedEnergyHistoricInterval);
                resolve(formattedEnergyHistoricInterval)
            } catch (e) {
                console.log(e)
                if (e.reason) {
                    reject(e.reason)
                } else if(e.info && e.info.error && e.info.error.message) {
                    const errorMessage = e.info.error.message;
                    reject(errorMessage)
                } else {
                    reject(e)
                }
            }
        })
    }

    async setEnergyHistoricInterval(cups: string, types: string[], timestamps: string[], values: number[]) {
        return new Promise(async (resolve, reject) => {
            try {
                const cupsHash = this.toKeccak256(cups)
                for (let i = 0; i < types.length; i++) {
                    types[i] = this.toKeccak256(types[i])
                    values[i] = ethers.parseUnits(values[i].toFixed(2), 2)
                }
                const transaction = await this.smartContract.batchSetEnergyValue(cupsHash, timestamps, types, values)
                await transaction.wait(2);
                resolve(transaction)
            } catch (e) {
                if (e.reason) {
                    reject(e.reason)
                } else if (e.info) {
                    reject(e.info)
                } else {
                    reject(e)
                }
            }
        })
    }

    async setEnergyValue(cups: string, type: string, timestamp: string, value: number) {
        return new Promise(async (resolve, reject) => {
            try {

                value = ethers.parseUnits(value.toFixed(2), 2)
                const cupsHash = this.toKeccak256(cups)
                const typeHash = this.toKeccak256(type)

                let gasPrice = (await this.provider.getFeeData()).gasPrice;

                let tx = await this.smartContract.setEnergyValue(cupsHash, timestamp, typeHash, value, {
                    gasPrice: gasPrice
                })

                await tx.wait(2);

                console.log("setEnergyValue:", tx.hash)

                resolve(tx)

            } catch (e) {
                if (e.reason) {
                    reject(e.reason)
                } else {
                    reject(e)
                }
            }
        })
    }

    async getNumericMetadata(cups: string, type: string) {
        return new Promise(async (resolve, reject) => {
            try {
                cups = this.toKeccak256(cups)
                type = this.toKeccak256(type)
                let value = await this.smartContract.getNumberMetadata(cups, type)
                value = ethers.formatEther(value)
                resolve(value)
            } catch (e) {
                if (e.reason) {
                    reject(e.reason)
                } else {
                    reject(e)
                }
            }
        })
    }

    toKeccak256(text: string) {
        let keccak256 = ethers.keccak256(ethers.toUtf8Bytes(text))
        return keccak256;
    }

    async getRpc(chainId: any) {
        try {
            let rpcsResponse: any = await this.httpGet(`https://zertirpc.zertifier.com/${chainId}/rpc`)
            let rpcs = rpcsResponse.data[chainId];
            let rpc = rpcs.find((rpc: any) => rpc.active && rpc.working)
            return rpc.rpc;
        }
        catch (e) {
            throw new Error(e)
        }
    }

    async httpGet(url: string) {

        //HTTPS request config
        const options = {
            rejectUnauthorized: false // unable SSL verification
        };

        return new Promise((resolve, reject) => {

            let req = https.get(url, options, (res: any) => {

                let data = ''

                res.on('data', (chunk: any) => { data += chunk })

                res.on('end', () => {
                    try {
                        let parsedData = JSON.parse(data);
                        if (parsedData.status == 400) {
                            reject(new Error(parsedData.message));
                            console.log("Error:", url, parsedData)
                        } else {
                            resolve(JSON.parse(data));
                        }
                    } catch (error) {
                        console.log("Error:", url, data)
                        reject(error)
                    }
                })

            })

            req.on('error', (error: any) => {
                console.log("Error making HTTP request:", error)
                reject(new Error(error));
            });

        })

    }
}