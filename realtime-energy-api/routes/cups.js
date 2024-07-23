const {Router} = require('express');
const {getRealTimeByCustomer, getRealTimeByCups} = require("../controllers/cups");
const {validatePermaJWT} = require("../utils/middlewares/jwt");

const router = Router();

router.get('/energy/realtime', validatePermaJWT, getRealTimeByCustomer);

router.get('/:id/energy/realtime', validatePermaJWT, getRealTimeByCups);

module.exports = router;