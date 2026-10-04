const router = require('express').Router();
const c = require('../controllers/project.controller');

router.get('/', c.listProjects);
router.post('/', c.createProject);

module.exports = router;