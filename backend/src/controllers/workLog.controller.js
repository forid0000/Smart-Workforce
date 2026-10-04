const prisma = require('../lib/prisma');
const ApiError = require('../lib/apiError');

// Employee submits a work log for a task and optionally updates status.
async function createWorkLog(req, res) {
  const taskId = Number(req.params.taskId);
  const { actualHours, note, newStatus } = req.body;
  if (!actualHours || actualHours <= 0) {
    throw new ApiError(400, 'actualHours is required and must be > 0');
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { assignments: { orderBy: { assignedAt: 'desc' }, take: 1 } },
  });
  if (!task) throw new ApiError(404, 'Task not found');

  // Resolve the employee: prefer req.user.employeeId (auth), else body.employeeId (admin override)
  let employeeId = req.user?.employeeId || Number(req.body.employeeId);
  if (!employeeId) throw new ApiError(400, 'Employee context required');

  // Verify this employee is actually assigned to this task (or is admin)
  const isAssigned = task.assignments.some((a) => a.employeeId === employeeId);
  const isAdmin = req.user?.role === 'ADMIN';
  if (!isAssigned && !isAdmin) {
    throw new ApiError(403, 'You are not assigned to this task');
  }

  const log = await prisma.workLog.create({
    data: {
      taskId,
      employeeId,
      actualHours: Number(actualHours),
      note: note || null,
    },
  });

  let updatedTask = task;
  if (newStatus && ['IN_PROGRESS', 'REVIEW', 'COMPLETED', 'CANCELLED'].includes(newStatus)) {
    updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status: newStatus },
    });
  }

  res.status(201).json({ success: true, data: { log, task: updatedTask } });
}

// Get work logs for a task
async function getWorkLogs(req, res) {
  const taskId = Number(req.params.taskId);
  const logs = await prisma.workLog.findMany({
    where: { taskId },
    orderBy: { loggedAt: 'desc' },
    include: { employee: true },
  });
  res.json({
    success: true,
    data: logs.map((l) => ({
      id: l.id,
      actualHours: l.actualHours,
      note: l.note,
      loggedAt: l.loggedAt,
      employee: { id: l.employee.id, name: l.employee.name },
    })),
  });
}

module.exports = { createWorkLog, getWorkLogs };