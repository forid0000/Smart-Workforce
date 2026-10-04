const router = require('express').Router();
const { createWorkLog, getWorkLogs } = require('../controllers/workLog.controller');
const { authRequired } = require('../middleware/auth');

router.get('/tasks/:taskId/work-logs', authRequired, getWorkLogs);
router.post('/tasks/:taskId/work-logs', authRequired, createWorkLog);

module.exports = router;