// TODO set and get textMetadata
// TODO set numericMetadata

import {Injectable} from "@nestjs/common";
import {Contract, JsonRpcProvider} from "ethers";

require('dotenv').config();
import mysql from "mysql2/promise";
import {MysqlService} from "src/shared/infrastructure/services/mysql-service/mysql.service";
import {PrismaService} from "src/shared/infrastructure/services/prisma-service/prisma-service";

const {ethers} = require("ethers");
require('dotenv').config();
const https = require('https');

interface contractData {
  id: number,
  contract_reference: string,
  contract_address: string,
  wallet_address_owner: string,
  code: string,
  abi: string
  blockchain_id: string,
  version: number,
  blockchain_name: string,
  rpc_url: string,
  blockchain_tx_url: string,
  wallet_url: string
}

@Injectable()
export class BlockchainService {

  private conn: mysql.Pool;
  smartContracts: contractData[];
  energyMappingContract: any;
  ekwContract: Contract | any;
  provider: any;

  constructor(private mysql: MysqlService, private prisma: PrismaService) {
    this.conn = this.mysql.pool;
    this.initialize();
  }

  async initialize() {
    try {
      this.smartContracts = await this.getBlockchainAndScData();
      let energyMappingContract = this.smartContracts.find((smartContract: any) => smartContract.contract_reference == 'energyMapping')!
      let ekwContract = this.smartContracts.find((smartContract: any) => smartContract.contract_reference == 'EKW')!

      this.energyMappingContract = await this.obtainSmartContract(energyMappingContract.contract_address,
        process.env.PK, energyMappingContract.abi, energyMappingContract.blockchain_id, energyMappingContract.rpc_url)
        .catch(e => {
          console.log(e)
        })
      this.ekwContract = await this.obtainSmartContract(ekwContract.contract_address,
        process.env.PK, ekwContract.abi, ekwContract.blockchain_id, ekwContract.rpc_url)
        .catch(e => {
          console.log(e)
        })
    } catch (error) {
      console.log("Error inicialitzant servei blockchain", error)
    }
  }

  /** Obtain blockchain and smart contract data according to config smart contract version.
   *  expect 3 smart contracts that are the current version
   * @return {Promise<*>}
   */
  async getBlockchainAndScData() {
    try {
      const [ROWS]: any = await this.conn.query(
        `SELECT *
         FROM smart_contracts
                LEFT JOIN blockchains
                          ON smart_contracts.blockchain_id = blockchains.blockchain_id;
        `);
      return ROWS;
    } catch (e) {
      console.log("error getting blockchain and sc data")
      throw new Error(e);
    }
  }

  async obtainSmartContract(contractAddress: any, privateKey: any, abi: any, chainId: any, rpcUrl: any): Promise<Contract>{
    //console.log(batchContractAddress, contractAddresses, walletReceivers, amounts, privateKey, chainId, rpcUrl)

    return new Promise(async (resolve, reject) => {
      try {
        let networkChainUrl;
        try {
          networkChainUrl = await this.getRpc(chainId)
        }catch (err){
          networkChainUrl = rpcUrl
        }
        // console.log(networkChainUrl)
        this.provider = new JsonRpcProvider(networkChainUrl)
        // this.provider = new JsonRpcProvider("https://ethereum-sepolia.blockpi.network/v1/rpc/public");
        //warning error TypeError: Cannot read properties of null (reading 'toHexString') is because it faults private key at wallets or any data (check db relations)
        const wallet = new ethers.Wallet(privateKey)
        const walletSigner = await wallet.connect(this.provider);
        const contract = new ethers.Contract(
          contractAddress,
          abi,
          walletSigner
        )

        resolve(contract)
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
        let energyValue = await this.energyMappingContract.getEnergyValue(cups, type, timestamp)
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
        let energyHistoricInterval = await this.energyMappingContract.getEnergyHistoricInterval(cupsHash, typeHash, timestampStart, timestampEnd)
        // Itera sobre cada par de timestamp y valor
        const formattedEnergyHistoricInterval = energyHistoricInterval.map(([timestamp, value]: any) => {
          const formattedTimestamp = timestamp.toString();
          const formattedValue = ethers.formatEther(value);
          return {timestamp: formattedTimestamp, value: formattedValue};
        });
        console.log("energyHistoricInterval", formattedEnergyHistoricInterval);
        resolve(formattedEnergyHistoricInterval)
      } catch (e) {
        console.log(e)
        if (e.reason) {
          reject(e.reason)
        } else if (e.info && e.info.error && e.info.error.message) {
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
        const transaction = await this.energyMappingContract.batchSetEnergyValue(cupsHash, timestamps, types, values)
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

        let tx = await this.energyMappingContract.setEnergyValue(cupsHash, timestamp, typeHash, value, {
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
        let value = await this.energyMappingContract.getNumberMetadata(cups, type)
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
    } catch (e) {
      throw new Error(e)
    }
  }

    async transferERC20(fromWalletPk: string, toWallet: string, amount: number, type: 'DAO' | 'XDAI' | 'EKW') {

        console.log(type)
        const contractData: contractData = this.getContractData(type)!;
        //console.log("contractData",contractData)
        const rpc = await this.getRpc(contractData.blockchain_id);
        console.log(rpc);
        const provider = new ethers.JsonRpcProvider(rpc);
        const fromWallet = new ethers.Wallet(fromWalletPk, provider); //invalid private key error 

        try {
            switch (type) {
                case "DAO":
                    //code not implemented
                    break;
                case "XDAI":
                    //code not implemented
                    break;
                case "EKW":
                    let tx: any;
                    let value = ethers.parseUnits(amount.toString(), "ether");
                    const contract = new ethers.Contract(contractData.contract_address, contractData.abi, fromWallet)
                    console.log("transferring to",toWallet,"VALUE", value)
                    tx = await contract['transfer'](toWallet, value);
                    tx = await tx.wait(5);
                    console.log("transference realized", tx)
                    return tx;
                default:
                    throw new Error(`Transfer error: unrecognized type ${type}`)
            }
        } catch (error) {
            console.log(error)
            throw new Error(`Transfer error ${error}`)
        }
    }

  async mintEkw(toWallet: string, qty: number){
      try {
        const tx = await this.ekwContract.mint(toWallet, ethers.parseEther(qty))
        await tx.wait()
        return true
      }catch (error){
        console.log(error)
        throw new Error(`Mint error ${error}`)
      }

  }

  getContractData(contractReference: string): contractData | undefined {
    try {
      return this.smartContracts.find((contract: contractData) => contract.contract_reference == contractReference)
    } catch {
      return undefined
    }
  }

  async getEKWBalance(walletAddress: string, chainId: number) {
    try {
      const provider = this.getRpc(chainId)
      const EKW_CONTRACT: contractData = this.getContractData('EKW')!;
      const contract = new ethers.Contract(EKW_CONTRACT.contract_address, EKW_CONTRACT.abi, provider)
      const balance = ethers.formatEther(await contract['balanceOf'](walletAddress)).toString();
      return parseFloat(balance)
    } catch (error) {
      console.log(error, "ERROR")
      return 0
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

        res.on('data', (chunk: any) => {
          data += chunk
        })

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

  createPrivateKey(text: string) {
    const privateKey = ethers.keccak256(ethers.toUtf8Bytes(text));
    return privateKey;
  }

  createWalletWithPk(pk: string) {
    const wallet = new ethers.Wallet(pk);
    return wallet;
  }

}
