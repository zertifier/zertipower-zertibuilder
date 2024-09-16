const {Router} = require('express');
const {generatePermaToken,refreshPermaToken} = require("../controllers/tokens");
const { validateTempJWT } = require("../utils/middlewares/jwt");

const router = Router();

router.post('/',validateTempJWT,generatePermaToken)

router.post('/refresh',validateTempJWT,refreshPermaToken)

module.exports = router;