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

const getRealtime = async (req, res = response) => {
    try {
        const communityId = req.params.id;

        //Truly realtime data:
        const [ROWS] = await dbConnection.execute
            (`
        SELECT 
        SUM(energy_hourly.kwh_in) AS kwh_in,
        SUM(energy_hourly.kwh_out) AS kwh_out,
        SUM(energy_hourly.production) AS production,
        COUNT(cups.id) AS cupsNumber
      FROM energy_hourly
    LEFT JOIN 
        cups ON cups.id = energy_hourly.cups_id
    WHERE
        cups.community_id = ? AND
        DATE_FORMAT(energy_hourly.info_dt, '%Y-%m-%d %H') = DATE_FORMAT(NOW(), '%Y-%m-%d %H')
     GROUP BY energy_hourly.info_dt
     `)

        //get last energy data from community: 
    //     const [ROWS] = await dbConnection.execute
    //         (`
    //     SELECT 
    //     SUM(energy_hourly.kwh_in) AS consumption,
    //     SUM(energy_hourly.kwh_out) AS export,
    //     SUM(energy_hourly.production) AS production,
    //     energy_hourly.info_dt
    //     FROM
    //     energy_hourly
    //     JOIN cups ON cups.id = energy_hourly.cups_id 
    //     WHERE
    //         cups.community_id= ?
    //         GROUP BY info_dt
    //     ORDER BY energy_hourly.info_dt DESC
    //     LIMIT 1 
    //  `, [communityId])

        const lastEnergyRegister = ROWS[0];

        res.json({
            ok: true,
            battery: 0,
            consumption: lastEnergyRegister.kwh_in ? Number(parseFloat(lastEnergyRegister.kwh_in).toFixed(2)) : 'No disponible.',
            production: lastEnergyRegister.production ? Number(parseFloat(lastEnergyRegister.production).toFixed(2)) : 'No disponible.',
            export: lastEnergyRegister.kwh_out ? Number(parseFloat(lastEnergyRegister.kwh_out).toFixed(2)) : 'No disponible.'
            //test: Number(parseFloat(0.009).toFixed(2))
        });
    } catch (error) {
        console.log("Error getting real time by community: ", error)
        res.status(500).json({
            ok: false,
            msg: error
        })
    }
}



module.exports = {
    getCommunities,
    getCommunitiesById,
    getCommunitiesEnergyByIdDate,
    getRealtime
}