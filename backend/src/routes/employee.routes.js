const router = require('express').Router();
const c = require('../controllers/employee.controller');

router.get('/', c.listEmployees);
router.get('/:id', c.getEmployee);
router.post('/', c.createEmployee);

module.exports = router;