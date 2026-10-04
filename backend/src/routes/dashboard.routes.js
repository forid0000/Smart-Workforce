const router = require('express').Router();
const c = require('../controllers/dashboard.controller');

router.get('/', c.getDashboard);

module.exports = router;