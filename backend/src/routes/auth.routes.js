const router = require('express').Router();
const c = require('../controllers/auth.controller');
const { authRequired } = require('../middleware/auth');

router.post('/login', c.login);
router.get('/me', authRequired, c.me);

module.exports = router;