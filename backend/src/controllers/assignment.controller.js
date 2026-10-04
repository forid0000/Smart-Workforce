const prisma = require('../lib/prisma');
const ApiError = require('../lib/apiError');
const { recommendEmployeesForTask } = require('../services/recommendation.service');

async function getRecommendations(req, res) {
  const id = Number(req.params.id);
  const result = await recommendEmployeesForTask(id);
  res.json({
    success: true,
    data: {
      task: {
        id: result.task.id,
        title: result.task.title,
        estimatedHours: result.task.estimatedHours,
        deadline: result.task.deadline,
        status: result.task.status,
      },
      requiredSkills: result.requiredSkills.map((s) => ({ id: s.id, name: s.name })),
      recommendations: result.recommendations,
    },
  });
}

async function assignTask(req, res) {
  const taskId = Number(req.params.id);
  const { employeeId, score, note } = req.body;
  if (!employeeId) throw new ApiError(400, 'employeeId is required');

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new ApiError(404, 'Task not found');

  const employee = await prisma.employee.findUnique({ where: { id: Number(employeeId) } });
  if (!employee) throw new ApiError(404, 'Employee not found');

  const result = await prisma.$transaction(async (tx) => {
    const a = await tx.taskAssignment.create({
      data: {
        taskId,
        employeeId: Number(employeeId),
        score: typeof score === 'number' ? score : null,
        note: note || null,
      },
    });
    const updatedTask = await tx.task.update({
      where: { id: taskId },
      data: { status: 'ASSIGNED' },
    });
    return { assignment: a, task: updatedTask };
  });

  res.status(201).json({ success: true, data: result });
}

module.exports = { getRecommendations, assignTask };