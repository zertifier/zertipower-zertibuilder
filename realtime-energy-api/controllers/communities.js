const { response } = require("express");
const { dbConnection } = require('../database/config');
const { getDateLimits } = require("../utils/dateFunctions");


const getCommunities = async (req, res = response) => {
    try {
        const [ROWS] = await dbConnection.execute(`SELECT * FROM communities`);
        return res.json({
            ok: true,
            msg: "",
            data: ROWS
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
        const [ROWS] = await dbConnection.execute(`SELECT * FROM communities WHERE id = ?`, [communityId]);
        return res.json({
            ok: true,
            msg: "",
            data: ROWS
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

        // Verify if the params are existent
        if (!communityId || !date || !dateFormat) {
            return res.status(400).json({
                ok: false,
                msg: 'Missing required query parameters'
            });
        }

        const { startDate, endDate } = getDateLimits(date, dateFormat)

        totalIn = 0
        totalOut = 0

        //TODO: check if energy hourly has community_id
        const [ROWS] = await dbConnection.execute(`SELECT energy_hourly.* FROM energy_hourly LEFT JOIN cups ON cups.id = energy_hourly.cups_id WHERE cups.community_id = ? AND energy_hourly.info_dt BETWEEN ? AND ?`, [communityId, startDate, endDate]);

        ROWS.forEach(energyHour => {
            totalIn += parseFloat(energyHour.kwh_in) | 0;
            totalOut += parseFloat(energyHour.kwh_out) | 0;
        })

        return res.json({
            ok: true,
            msg: "Community energy fetched succesfully",
            data: {
                totalIn,
                totalOut,
                // energyData: ROWS
            }
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