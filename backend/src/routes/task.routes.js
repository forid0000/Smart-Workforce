const router = require('express').Router();
const c = require('../controllers/task.controller');
const a = require('../controllers/assignment.controller');

router.get('/', c.listTasks);
router.post('/', c.createTask);
router.get('/:id', c.getTask);
router.put('/:id', c.updateTask);
router.delete('/:id', c.deleteTask);
router.get('/:id/recommendations', a.getRecommendations);
router.post('/:id/assign', a.assignTask);

module.exports = router;