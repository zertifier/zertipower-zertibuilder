const { response } = require("express");
const { dbConnection } = require('../database/config');
const { getDateLimits } = require("../utils/dateFunctions");

const getRealTimeByCups = async (req, res = response) => {

    try {

        const cupsId = req.params.id;
        const customerId = req.customerId;
        console.log("get real time by customer id", customerId, "cups id", cupsId);

        //get realtime energy from customer cups: 
        // const [ROWS] = await dbConnection.execute
        //     (` SELECT 
        //     cups.id,
        //     cups.reference,
        //     cups.cups,
        //     SUM(energy_hourly.kwh_in) AS kwh_in,
        //     SUM(energy_hourly.kwh_out) AS kwh_out,
        //     SUM(energy_hourly.production) AS production,
        //     COUNT(cups.id) AS cupsNumber
        //     FROM energy_hourly
        // LEFT JOIN 
        //     cups ON cups.id = energy_hourly.cups_id
        // WHERE
        //     cups.id = ? AND
        //     cups.customer_id = ? AND
        //     DATE_FORMAT(energy_hourly.info_dt, '%Y-%m-%d %H') = DATE_FORMAT(NOW(), '%Y-%m-%d %H')
        // `, [cupsId, customerId])

        //get last energy data from customer: 
        const [ROWS] = await dbConnection.execute
            (` SELECT 
            cups.id,
            cups.cups,
            cups.reference,
            energy_hourly.kwh_in AS consumption,
            energy_hourly.kwh_out AS export,
            energy_hourly.production AS production,
            energy_hourly.info_dt
            FROM
            energy_hourly
            JOIN cups ON cups.id = energy_hourly.cups_id
            WHERE
                cups.id = ? AND
                cups.customer_id = ?                
            ORDER BY energy_hourly.info_dt DESC
            LIMIT 1
         `, [cupsId, customerId])

        const lastEnergyRegister = ROWS[0];

        if (!ROWS[0]) {
            console.log("No current data for customer", customerId, "cups", cupsId)
            return res.status(500).json({
                ok: false,
                msg: "Unregistered realtime data"
            })
        }

        if (!ROWS[0].cups) {
            console.log("The cups isn't related to the customer", customerId, "cups", cupsId)
            return res.status(500).json({
                ok: false,
                msg: "The cups isn't related to the customer"
            })
        }

        res.json({
            ok: true,
            cups: lastEnergyRegister.cups,
            consumption: lastEnergyRegister.kwh_in ? parseFloat(lastEnergyRegister.kwh_in).toFixed(2) : 0,
            production: lastEnergyRegister.production ? parseFloat(lastEnergyRegister.production).toFixed(2) : 0,
            export: lastEnergyRegister.kwh_out ? parseFloat(lastEnergyRegister.kwh_out).toFixed(2) : 0
        });

    } catch (error) {
        console.log("Error getting real time by cups: ", error)
        res.status(500).json({
            ok: false,
            msg: error
        })

    }

}

const getRealTimeByCustomer = async (req, res = response) => {

    try {

        const customerId = req.customerId;
        console.log("get real time by customer id", customerId);

        //get realtime energy from customer cups: 
        // const [ROWS] = await dbConnection.execute
        //     (`SELECT 
        //         customers.id,
        //         customers.name as name,
        //         SUM(energy_hourly.kwh_in) AS kwh_in,
        //         SUM(energy_hourly.kwh_out) AS kwh_out,
        //         SUM(energy_hourly.production) AS production,
        //         COUNT(cups.id) AS cups_number
        //     FROM
        //         customers
        //     JOIN 
        //         cups ON customers.id = cups.customer_id
        //     JOIN 
        //         energy_hourly ON cups.id = energy_hourly.cups_id
        //     WHERE
        //         customers.id = ? AND
        //         DATE_FORMAT(energy_hourly.info_dt, '%Y-%m-%d %H') = DATE_FORMAT(NOW(), '%Y-%m-%d %H')
        //     GROUP BY
        //         customers.id
        //     `, [customerId])

        //get last energy data from customer: 
        const [ROWS] = await dbConnection.execute
            (` SELECT 
            customers.id,
            customers.name,
            SUM(energy_hourly.kwh_in) AS consumption,
            SUM(energy_hourly.kwh_out) AS export,
            SUM(energy_hourly.production) AS production,
            energy_hourly.info_dt,
            COUNT(cups.id) AS cups_number
            FROM
            customers
            JOIN cups ON customers.id = cups.customer_id
            JOIN (
                SELECT 
                    cups_id,
                    MAX(info_dt) AS latest_info_dt
                FROM 
                    energy_hourly
                GROUP BY 
                    cups_id
            ) latest ON cups.id = latest.cups_id
            JOIN energy_hourly ON latest.cups_id = energy_hourly.cups_id AND latest.latest_info_dt = energy_hourly.info_dt
            WHERE
                customers.id = ?
            GROUP BY
                customers.id,
                customers.name;
         `, [customerId])

        const currentEnergyRegister = ROWS[0];

        if (!ROWS[0]) {
            console.log("No current data for customer", customerId)
            return res.status(500).json({
                ok: false,
                msg: "Unregistered realtime data"
            })
        }

        res.json({
            ok: true,
            customer: currentEnergyRegister.name || '',
            consumption: currentEnergyRegister.kwh_in ? parseFloat(currentEnergyRegister.kwh_in).toFixed(2) : 0,
            production: currentEnergyRegister.production ? parseFloat(currentEnergyRegister.production).toFixed(2) : 0,
            export: currentEnergyRegister.kwh_out ? parseFloat(currentEnergyRegister.kwh_out).toFixed(2) : 0
        });

    } catch (error) {
        console.log("Error getting real time by customer: ", error);
        res.status(500).json({
            ok: false,
            msg: error
        })

    }

}
const getCups = async (req, res = response) => {

    const customerId = req.customerId;

    try {
        const [ROWS] = await dbConnection.execute(`SELECT * FROM cups WHERE customer_id = ?`, [customerId]);
        return res.json({
            ok: true,
            msg: "cups fetched successfully",
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

const getEnergyByIdDate = async (req, res = response) => {

    try {

        const customerId = req.customerId;
        const cupsId = req.query.id;
        const date = req.query.date;
        const dateFormat = req.query.dateFormat; // hourly, daily, weekly, monthly, yearly

        // Verify if the params are existent
        if (!date || !dateFormat || !cupsId) {
            return res.status(400).json({
                ok: false,
                msg: 'Missing required query parameters'
            });
        }

        const { startDate, endDate } = getDateLimits(date, dateFormat)
        totalIn = 0;
        totalOut = 0;

        let [ROWS] = await dbConnection.execute(`SELECT id FROM cups WHERE customer_id = ? AND id = ?`, [customerId, cupsId]);

        if (!ROWS.length) {
            return res.status(404).json({
                ok: false,
                msg: `Cups with customer id ${customerId} not found.`
            })
        }

        [ROWS] = await dbConnection.execute(`SELECT * FROM energy_hourly WHERE cups_id = ? AND datetime BETWEEN ? AND ?`, [cupsId, startDate, endDate]);

        ROWS.map(energyHour => {
            totalIn += parseFloat(energyHour.kwh_in) | 0;
            totalOut += parseFloat(energyHour.kwh_out) | 0;
        })

        return res.json({
            ok: true,
            msg: "Cups energy fetched succesfully",
            data: {
                totalIn,
                totalOut,
                energyData: ROWS
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
    getRealTimeByCups,
    getRealTimeByCustomer,
    getEnergyByIdDate,
    getCups
}