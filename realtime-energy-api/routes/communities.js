const { Router } = require('express');
const { getCommunities,getCommunitiesById,getCommunitiesEnergyByIdDate } = require("../controllers/communities");

const router = Router();

router.get('/', getCommunities);

router.get('/by-id', getCommunitiesById);

router.get('/by-id/by-date', getCommunitiesEnergyByIdDate);

module.exports = router;