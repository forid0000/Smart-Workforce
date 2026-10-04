const router = require('express').Router();
const c = require('../controllers/department.controller');

router.get('/', c.listDepartments);
router.post('/', c.createDepartment);

module.exports = router;