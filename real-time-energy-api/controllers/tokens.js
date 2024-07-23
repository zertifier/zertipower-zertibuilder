const { response } = require("express");
const { dbConnection } = require('../database/config');
const { generatePermaJWT } = require("../utils/middlewares/jwt");

const refreshPermaToken = async (req, res = response) => {
    try {
        let userId = req.uid;
        let customerId;
        let [ROWS] = await dbConnection.execute
            (`SELECT customer_id FROM users WHERE id = ?`, [userId])
        if (!ROWS[0]) {
            return res.status(404).json({
                ok: false,
                msg: 'customer not found'
            })
        }
        customerId = ROWS[0].customer_id;
        [ROWS] = await dbConnection.execute
            (`DELETE FROM user_tokens WHERE user_id = ? and permanent = 1`, [userId])
        token = await generatePermaJWT(customerId, userId);
        return res.json({
            ok: true,
            token: `Bearer ${token}`
        });
    } catch (error) {
        console.log("Error refreshing token", error)
        res.status(500).json({
            ok: false,
            msg: error
        })
    }
}

const generatePermaToken = async (req, res = response) => {
    try {
        let userId = req.uid;
        let customerId;
        let [ROWS] = await dbConnection.execute
            (`SELECT customer_id FROM users WHERE id = ?`, [userId])
        if (!ROWS[0]) {
            return res.status(404).json({
                ok: false,
                msg: 'customer not found'
            })
        }
        customerId = ROWS[0].customer_id;
        [ROWS] = await dbConnection.execute
            (`SELECT token FROM user_tokens WHERE user_id = ? and permanent = 1`, [userId])
        if (!ROWS[0]) {
            token = await generatePermaJWT(customerId, userId);
            return res.json({
                ok: true,
                token: `Bearer ${token}`
            });
        }
        return res.json({
            ok: true,
            token: `Bearer ${ROWS[0].token}`
        });
    } catch (error) {
        console.log("Error generating token", error)
        res.status(500).json({
            ok: false,
            msg: error
        })
    }
}

const getTokens = async (req, res = response) => {
    try {
        const [ROWS] = await dbConnection.execute
            ('SELECT * FROM user_tokens')

        res.json({
            ok: true,
            tokens: ROWS
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            msg: error
        })
    }
}

const getToken = async (req, res = response) => {
    const ID = req.params.id;

    try {
        const [ROWS] = await dbConnection.execute
            (`SELECT * FROM user_tokens WHERE id = ?`, [ID])

        if (!ROWS[0]) {
            return res.status(404).json({
                ok: false,
                msg: 'inexistent id'
            })
        } else {
            res.json({
                ok: true,
                user: ROWS[0]
            });
        }

    } catch (error) {
        res.status(500).json({
            ok: false,
            msg: error
        })
    }
}

module.exports = {
    getToken,
    getTokens,
    generatePermaToken,
    refreshPermaToken
}