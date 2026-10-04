const prisma = require('../lib/prisma');
const ApiError = require('../lib/apiError');
const { workloadPercent, workloadLevel } = require('../utils/workload');

// Dashboard data for the currently logged-in employee (or admin if employeeId passed)
async function getEmployeeDashboard(req, res) {
  // For ADMIN viewing a specific employee: ?employeeId=2
  // For EMPLOYEE: use req.user.employeeId
  const employeeId =
    req.user?.role === 'ADMIN' && req.query.employeeId
      ? Number(req.query.employeeId)
      : req.user?.employeeId;

  if (!employeeId) throw new ApiError(400, 'No employee context');

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { department: true, skills: { include: { skill: true } } },
  });
  if (!employee) throw new ApiError(404, 'Employee not found');

  // All assignments for this employee (history)
  const assignments = await prisma.taskAssignment.findMany({
    where: { employeeId },
    include: {
      task: {
        include: {
          project: true,
          requiredSkills: { include: { skill: true } },
          workLogs: { where: { employeeId } },
        },
      },
    },
    orderBy: { assignedAt: 'desc' },
  });

  const tasks = assignments.map((a) => ({
    assignmentId: a.id,
    assignedAt: a.assignedAt,
    score: a.score,
    id: a.task.id,
    title: a.task.title,
    description: a.task.description,
    project: a.task.project,
    priority: a.task.priority,
    estimatedHours: a.task.estimatedHours,
    deadline: a.task.deadline,
    status: a.task.status,
    requiredSkills: a.task.requiredSkills.map((rs) => ({ id: rs.skill.id, name: rs.skill.name })),
    workLogs: a.task.workLogs.map((w) => ({
      id: w.id,
      actualHours: w.actualHours,
      note: w.note,
      loggedAt: w.loggedAt,
    })),
    loggedHours: a.task.workLogs.reduce((s, w) => s + w.actualHours, 0),
  }));

  const active = tasks.filter((t) => ['ASSIGNED', 'IN_PROGRESS', 'REVIEW', 'PENDING'].includes(t.status));
  const completed = tasks.filter((t) => t.status === 'COMPLETED');
  const overdue = tasks.filter((t) => t.status === 'OVERDUE' || (new Date(t.deadline) < new Date() && t.status !== 'COMPLETED' && t.status !== 'CANCELLED'));

  const assignedHours = active.reduce((s, t) => s + t.estimatedHours, 0);
  const wp = workloadPercent(assignedHours, employee.capacity);

  res.json({
    success: true,
    data: {
      employee: {
        id: employee.id,
        name: employee.name,
        position: employee.position,
        department: employee.department,
        availability: employee.availability,
        capacity: employee.capacity,
        skills: employee.skills.map((s) => ({ id: s.skill.id, name: s.skill.name, level: s.level })),
      },
      stats: {
        totalTasks: tasks.length,
        activeTasks: active.length,
        completedTasks: completed.length,
        overdueTasks: overdue.length,
        assignedHours,
        workloadPercent: wp,
        workloadLevel: workloadLevel(wp),
      },
      tasks,
    },
  });
}

module.exports = { getEmployeeDashboard };