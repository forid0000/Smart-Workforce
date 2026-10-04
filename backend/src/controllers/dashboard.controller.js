const prisma = require('../lib/prisma');
const { workloadPercent, workloadLevel } = require('../utils/workload');

async function getDashboard(req, res) {
  const [
    totalEmployees,
    activeTasks,
    completedTasks,
    overdueTasks,
    employees,
    taskAssignments,
  ] = await Promise.all([
    prisma.employee.count(),
    prisma.task.count({ where: { status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'REVIEW'] } } }),
    prisma.task.count({ where: { status: 'COMPLETED' } }),
    prisma.task.count({ where: { status: 'OVERDUE' } }),
    prisma.employee.findMany({ include: { skills: true } }),
    prisma.taskAssignment.findMany({
      where: { task: { status: { in: ['ASSIGNED', 'IN_PROGRESS', 'REVIEW', 'PENDING'] } } },
      include: { task: true },
    }),
  ]);

  // Build workload for each employee
  const assignedHoursMap = new Map();
  for (const a of taskAssignments) {
    const empId = a.employeeId;
    assignedHoursMap.set(empId, (assignedHoursMap.get(empId) || 0) + (a.task?.estimatedHours || 0));
  }

  const workloadList = employees.map((e) => {
    const hours = assignedHoursMap.get(e.id) || 0;
    const wp = workloadPercent(hours, e.capacity);
    return {
      employeeId: e.id,
      name: e.name,
      capacity: e.capacity,
      assignedHours: hours,
      workloadPercent: wp,
      workloadLevel: workloadLevel(wp),
    };
  });

  const totalWorkload = workloadList.reduce((s, w) => s + w.workloadPercent, 0);
  const avgWorkload = workloadList.length ? Math.round(totalWorkload / workloadList.length) : 0;
  const overloaded = workloadList.filter((w) => w.workloadLevel === 'Overloaded').length;

  res.json({
    success: true,
    data: {
      totalEmployees,
      activeTasks,
      completedTasks,
      overdueTasks,
      averageWorkloadPercent: avgWorkload,
      overloadedEmployees: overloaded,
      employeeWorkload: workloadList,
    },
  });
}

module.exports = { getDashboard };