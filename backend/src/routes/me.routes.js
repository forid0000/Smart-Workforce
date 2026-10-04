const router = require('express').Router();
const { getEmployeeDashboard } = require('../controllers/me.controller');
const { authRequired } = require('../middleware/auth');

router.get('/dashboard', authRequired, getEmployeeDashboard);

module.exports = router;