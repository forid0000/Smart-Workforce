const router = require('express').Router();
const c = require('../controllers/skill.controller');

router.get('/', c.listSkills);
router.post('/', c.createSkill);

module.exports = router;