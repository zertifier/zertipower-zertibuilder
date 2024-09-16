const { Router } = require('express');
const { getCommunities,getCommunitiesById,getCommunitiesEnergyByIdDate, getRealtime } = require("../controllers/communities");

const router = Router();

router.get('/', getCommunities);

router.get('/by-id', getCommunitiesById);

router.get('/by-id/by-date', getCommunitiesEnergyByIdDate);

router.get('/:id/energy/realtime', getRealtime);

module.exports = router;