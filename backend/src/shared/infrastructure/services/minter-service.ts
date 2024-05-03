require('dotenv').config();
import { getCustomersCups } from "src/features/customers/customers.controller";
import { getBlockchainAndScData } from "src/features/smart-contracts/smart-contracts.controller";
import { getUntokenizedEnergy } from "src/features/datadis-energy.controller";
//import {createMultipleUpdateQuery } from "src/shared/domain/utils/mysqlUtils"
//import { createWalletByReference } from "./contract_helpers"
import mysql from "mysql2/promise";
import {MysqlService} from "src/shared/infrastructure/services/mysql-service/mysql.service";
import { Injectable } from "@nestjs/common";

/**
 * Service used to interact with the datadis api
 */
@Injectable()
export class MinterService {

private conn: mysql.Pool;

constructor(private mysql: MysqlService) {
    this.conn = this.mysql.pool;
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

    let communityEnergyProductionSc:any;
    let communityEnergyConsumptionSc:any;
    let batchMinterSc:any;
    let amounts:any[] = [];
    let energyRegistersIds:any[] = [];
    let walletReceivers:any = [];
    let contractAddresses:any = [];
    let energyRegisters = await getUntokenizedEnergy();
    let users:any = [];
    let blockchainData:any = [];

    try {
        users = await getCustomersCups();
        blockchainData = await getBlockchainAndScData();
    }catch(e){
        console.log("Major breaking error: error getting minting data from database: ", e)
        return;
    }

    if(!blockchainData.length){
        console.log("Major breaking error: error getting smart contract info: review database ( blockchains, smart_contracts)")
        return;
    }

    if(!users.length){
        console.log("Major breaking error: error getting smart users info: review database (users)")
        return;
    }

    try {
        blockchainData.map((blockchainRegister:any) => {
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
    }catch(e){
        console.log(e)
        return;
    }

    users = users.map((user:any) => {
        if(!user.reference){
            console.log("Minor error: invalid  user reference: ",user)
            user = undefined
            return user
        }
        if(!user.wallet_address){
            let wallet_address = createWalletByReference(user.id)
            user.wallet_address = wallet_address;
        }
        
        return user;
    }).filter((e:any)=>e)

    energyRegisters.map((energyRegister:any) => {
        let user = users.find((user:any) => user.id === energyRegister.cups_id)
        if(!user){
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
    }).filter((e:any)=>e)

    //console.log("untokenized energy per user: ", amounts.length, "contract addresses ", contractAddresses.length, "wallet receivers ", walletReceivers.length, "PK", process.env.PK, "SC ADDRESS", batchMinterSc.smart_contract_address )

    //the elements sent to transaction shouldnt exceed a limit number
    //cut the array to divide the wheight carried by transaction

    amounts = splitArray(amounts,50);
    contractAddresses = splitArray(contractAddresses,50);
    walletReceivers = splitArray(walletReceivers,50);
    energyRegisters = splitArray(energyRegisters,50);
    let energyRegistersId:any[] = [];
    let txToUpdate:any[] = [];

    for (let i = 0; i < amounts.length; i++){

        let tx:any = undefined;
        try{
            tx = await mintBatchERC20(batchMinterSc.contract_address, contractAddresses[i], walletReceivers[i], amounts[i], process.env.PK, batchMinterSc.abi, batchMinterSc.blockchain_id, batchMinterSc.rpc_url)
            console.log("minted tx:",tx)
        } catch (e){
            console.log("Major error: error minting: ",e)
        }

        if(tx){
            energyRegistersId = [];
            txToUpdate = [];
            //prepare the values to create update query
            energyRegisters[i].map((energyRegister:any) => {
                if (energyRegister.export) {
                    txToUpdate.push(['tx_export',tx]);
                    energyRegistersId.push(energyRegister.id);
                }
                if (energyRegister.import) {
                    txToUpdate.push(['tx_import',tx]);
                    energyRegistersId.push(energyRegister.id);
                }
                txToUpdate.push(['smart_contracts_version',blockchainData[0].smart_contracts_version]);
                energyRegistersId.push(energyRegister.id);
            })

            try {
                // console.log('energy_data id', energyRegistersId)
                //put the tx into registers
                const {query, values} = createMultipleUpdateQuery('datadis_energy_registers', txToUpdate, energyRegistersId);
                //console.log(query,values)
                const [ROWS] = await this.conn.execute(query, values);
            } catch (e) {
                console.log("Major error: error putting the tx into registers: ", e)
            }
        }
    }
}

}