const jwt = require('jsonwebtoken');
const { dbConnection } = require('../../database/config');

require('dotenv').config();

const generatePermaJWT = (customerId,uid) => {

    return new Promise((resolve, reject) => {
        const payload = {
            customerId,
            uid
        };

        jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '100y'
        }, async(error, token) => {
            if (error) {
                reject('cannot generate token');
            } else {

                const expirationDate = new Date();
                expirationDate.setFullYear(expirationDate.getFullYear() + 100);
                // Formatear la fecha de expiración en el formato adecuado para MySQL
                const formattedExpirationDate = expirationDate.toISOString().slice(0, 19).replace('T', ' ');
                
                try {
                    const [rows] = await dbConnection.execute(
                        `INSERT INTO user_tokens (expiration_time, user_id,token, permanent) VALUES (?, ?, ?, ?)`,
                        [formattedExpirationDate, uid, token, 1] 
                    );
                }catch(error){
                    console.log("Error inserting token", error);
                    reject('cannot generate token');
                }

                resolve(token);
            }
        });
    })
}

const validatePermaJWT = async (req,res,next) => {

    //read token:
    let token = req.header('authorization');

    //select token and user depending on the user id and date not expired
    const query = `SELECT *
                   FROM user_tokens
                            LEFT JOIN users ON user_id = users.id
                   WHERE user_id = ?
                     AND expiration_time > NOW()
                   AND permanent = 1;`

    if (!token) {
        return res.status(401).json({
            ok: false,
            msg: 'the token is missing'
        })
    }

    try {

        //Delete word 'Bearer ' from token:
        token = token.substring(7);

        // get decoded uid from token:
        const {uid,customerId} = jwt.verify(token, process.env.JWT_SECRET);
        
        if(!uid || !customerId){
            return res.status(401).json({
                ok: false,
                msg: 'the token is not valid'
            })
        }
        
        req.uid = uid;
        req.customerId = customerId;

        const [RESULT] = await dbConnection.execute(query, [uid])

        if (RESULT[0]) {
            next();
        } else {
            
            return res.status(401).json({
                ok: false,
                msg: 'the token is not valid'
            })
        }

    } catch (error) {
        console.log("Error validating perma token.",error)
        return res.status(401).json({
            ok: false,
            msg: error
        })
    }
}

const validateTempJWT = async (req,res,next) => {

    //read token:
    let token = req.header('authorization');

    //select token and user depending on the user id and date not expired

    const query = `SELECT *
                   FROM user_tokens
                            LEFT JOIN users ON user_id = users.id
                   WHERE user_id = ?
                     AND expiration_time > NOW()
                   ORDER BY expiration_time DESC LIMIT 1;`

    if (!token) {
        return res.status(401).json({
            ok: false,
            msg: 'the token is missing'
        })
    }

    try {
        //Delete word 'Bearer ' from token:
        token = token.substring(7);

        const {id} = jwt.verify(token, process.env.JWT_SECRET);
        req.uid = id;

        const [RESULT] = await dbConnection.execute(query, [id])

        if (RESULT[0]) {
            next();
        } else {
            console.log(query,id,RESULT)
            return res.status(401).json({
                ok: false,
                msg: 'the token is not valid'
            })
        }

    } catch (error) {
        console.log(error)
        return res.status(401).json({
            ok: false,
            msg: error
        })
    }
}

module.exports = {
    generatePermaJWT,
    validateTempJWT,
    validatePermaJWT
}