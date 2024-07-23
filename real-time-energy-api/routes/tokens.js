const {Router} = require('express');
const {generatePermaToken} = require("../controllers/tokens");
const { validateTempJWT } = require("../utils/middlewares/jwt");

const router = Router();

router.post('/',validateTempJWT,generatePermaToken)

module.exports = router;