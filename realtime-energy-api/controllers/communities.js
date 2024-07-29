const { response } = require("express");
const { dbConnection } = require('../database/config');
const { getDateLimits } = require("../utils/dateFunctions");


const getCommunities = async (req, res = response) => {
    try {
        const [ROWS] = await dbConnection.execute(`SELECT * FROM communities`);
        return res.json({
            ok: true,
            msg: "",
            data:ROWS
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            ok: false,
            msg: error
        })
    }
}

const getCommunitiesById = async (req, res = response) => {
    try {
        const communityId = req.query.id;
        const [ROWS] = await dbConnection.execute(`SELECT * FROM communities WHERE id = ?`,[communityId]);
        return res.json({
            ok: true,
            msg: "",
            data:ROWS
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            ok: false,
            msg: error
        })
    }
}

const getCommunitiesEnergyByIdDate = async (req, res = response) => {
    try {        

        const communityId = req.query.id;
        const date = req.query.date;
        const dateFormat = req.query.dateFormat; // hourly, daily, weekly, monthly, yearly

        const {startDate, endDate} = getDateLimits(date, dateFormat)
        totalIn,totalOut;

        //TODO: check if energy hourly has community_id
        const [ROWS] = await dbConnection.execute(`SELECT * FROM energy_hourly WHERE community_id = ? AND datetime BETWEEN ? AND ?`, [communityId,startDate,endDate]); 

        ROWS.map(energyHour=>{
            //TODO: delete kwh_out of community cups?
            totalIn+=energyHour.kwh_in;
            totalOut+=energyHour.kwh_out;
        })

        return res.json({
            ok: true,
            msg: "",
            data:ROWS,
            totalIn,
            totalOut
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({
            ok: false,
            msg: error
        })
    }
}



module.exports = {
    getCommunities,
    getCommunitiesById,
    getCommunitiesEnergyByIdDate
}