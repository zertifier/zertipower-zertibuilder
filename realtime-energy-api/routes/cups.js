const {Router} = require('express');
const {getRealTimeByCustomer, getRealTimeByCups, getEnergyByIdDate, getCups} = require("../controllers/cups");
const {validatePermaJWT} = require("../utils/middlewares/jwt");

const router = Router();

router.get('/', validatePermaJWT, getCups);

//router.get('/by-id', validatePermaJWT, getCupsById);

router.get('/energy/by-id/by-date', validatePermaJWT, getEnergyByIdDate);

router.get('/energy/realtime', validatePermaJWT, getRealTimeByCustomer);

router.get('/:id/energy/realtime', validatePermaJWT, getRealTimeByCups);

module.exports = router;