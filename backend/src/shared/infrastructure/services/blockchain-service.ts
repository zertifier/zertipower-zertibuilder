import { Injectable } from "@nestjs/common";
require('dotenv').config();
import mysql from "mysql2/promise";
import { MysqlService } from "src/shared/infrastructure/services/mysql-service/mysql.service";
import { PrismaService } from "src/shared/infrastructure/services/prisma-service/prisma-service";
const { ethers } = require("ethers");

@Injectable()
export class BlockchainService {

    private conn: mysql.Pool;

    smartContract: any;

    constructor(private mysql: MysqlService, private prisma: PrismaService) {
        this.conn = this.mysql.pool;
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

    async obtainSmartContract(contractAddress: any, privateKey: any, abi: any, chainId: any, rpcUrl: any) {

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

    async getEnergyHistoricInterval(cups: string, type: string, timestampStart: string, timestampEnd: string) {
        return new Promise(async (resolve, reject) => {
            try {
                let energyHistoricInterval = await this.smartContract.getEnergyHistoricInterval(cups, type, timestampStart, timestampEnd)
                console.log("energyHistoricInterval", energyHistoricInterval)
                resolve(energyHistoricInterval)
            } catch (e) {
                reject(e)
            }
        })
    }

    async setEnergyValue(cups: string, type: string, timestamp: string, value: number) {
        return new Promise(async (resolve, reject) => {
            try {
                value = ethers.parseUnits(value.toString())
                cups = this.toKeccak256(cups)
                type = this.toKeccak256(type)
                let tx = await this.smartContract.setEnergyValue(cups, timestamp, type, value)
                console.log("setEnergyValue", tx)
                resolve(tx)
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
                let energyValue = await this.smartContract.getEnergyValue(cups, type, timestamp)
                console.log("getEnergyValue", energyValue)
                resolve(energyValue)
            } catch (e) {
                reject(e)
            }
        })
    }

    async getNumericMetadata(cups: string, type: string) {
        return new Promise(async (resolve, reject) => {
            try {
                cups = this.toKeccak256(cups)
                type = this.toKeccak256(type)
                let value = await this.smartContract.getNumberMetadata(cups, type)
                console.log("getEnergyValue", value)
                resolve(value)
            } catch (e) {
                reject(e)
            }
        })
    }

    toKeccak256(text: string) {
        let keccak256 = ethers.hashMessage(text)
        return keccak256
    }

}