const prisma = require('../lib/prisma');
const ApiError = require('../lib/apiError');
const { recommendEmployeesForTask } = require('../services/recommendation.service');

async function listTasks(req, res) {
  const { status, projectId, employeeId } = req.query;
  const where = {};
  if (status) where.status = status;
  if (projectId) where.projectId = Number(projectId);

  // If employeeId provided, restrict to tasks that have an assignment for this employee
  if (employeeId) {
    where.assignments = { some: { employeeId: Number(employeeId) } };
  }

  const tasks = await prisma.task.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      project: true,
      requiredSkills: { include: { skill: true } },
      assignments: {
        orderBy: { assignedAt: 'desc' },
        include: { employee: true },
      },
      workLogs: true,
    },
  });

  const data = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    project: { id: t.project.id, name: t.project.name },
    priority: t.priority,
    estimatedHours: t.estimatedHours,
    deadline: t.deadline,
    status: t.status,
    requiredSkills: t.requiredSkills.map((rs) => ({ id: rs.skill.id, name: rs.skill.name })),
    assignments: t.assignments.map((a) => ({
      id: a.id,
      employeeId: a.employeeId,
      employeeName: a.employee.name,
      assignedAt: a.assignedAt,
      score: a.score,
    })),
    loggedHours: t.workLogs.reduce((s, w) => s + w.actualHours, 0),
  }));

  res.json({ success: true, data });
}

async function getTask(req, res) {
  const id = Number(req.params.id);
  const t = await prisma.task.findUnique({
    where: { id },
    include: {
      project: true,
      requiredSkills: { include: { skill: true } },
      assignments: { include: { employee: true }, orderBy: { assignedAt: 'desc' } },
      workLogs: { include: { employee: true }, orderBy: { loggedAt: 'desc' } },
    },
  });
  if (!t) throw new ApiError(404, 'Task not found');

  res.json({
    success: true,
    data: {
      id: t.id,
      title: t.title,
      description: t.description,
      project: { id: t.project.id, name: t.project.name },
      priority: t.priority,
      estimatedHours: t.estimatedHours,
      deadline: t.deadline,
      status: t.status,
      requiredSkills: t.requiredSkills.map((rs) => ({ id: rs.skill.id, name: rs.skill.name })),
      assignments: t.assignments.map((a) => ({
        id: a.id,
        employeeId: a.employeeId,
        employeeName: a.employee.name,
        assignedAt: a.assignedAt,
        score: a.score,
      })),
      workLogs: t.workLogs.map((w) => ({
        id: w.id,
        actualHours: w.actualHours,
        note: w.note,
        loggedAt: w.loggedAt,
        employee: { id: w.employee.id, name: w.employee.name },
      })),
      loggedHours: t.workLogs.reduce((s, w) => s + w.actualHours, 0),
    },
  });
}

async function createTask(req, res) {
  const {
    title: taskTitle,
    description,
    projectId,
    priority,
    estimatedHours,
    deadline,
    status,
    skillIds,
    autoAssign,
  } = req.body;

  if (!taskTitle || !projectId || !deadline) {
    throw new ApiError(400, 'title, projectId, deadline are required');
  }

  // 1. Create the task
  const task = await prisma.task.create({
    data: {
      title: taskTitle,
      description: description || null,
      projectId: Number(projectId),
      priority: priority || 'MEDIUM',
      estimatedHours: Number(estimatedHours || 1),
      deadline: new Date(deadline),
      status: status || 'PENDING',
      requiredSkills: skillIds && skillIds.length
        ? { create: skillIds.map((sid) => ({ skillId: Number(sid) })) }
        : undefined,
    },
  });

  // 2. If autoAssign requested, run recommendation engine and assign the top employee
  let assignmentInfo = null;
  if (autoAssign) {
    try {
      const rec = await recommendEmployeesForTask(task.id);
      const best = rec.recommendations[0];
      if (best && best.recommendation !== 'NOT RECOMMENDED') {
        assignmentInfo = await prisma.$transaction(async (tx) => {
          const a = await tx.taskAssignment.create({
            data: {
              taskId: task.id,
              employeeId: best.employeeId,
              score: best.finalScore,
              note: `Auto-assigned by system (skill ${best.skillMatch}%, workload ${best.workload}%, availability ${best.availabilityScore}%, deadline ${best.deadlineFit}%)`,
            },
          });
          const t2 = await tx.task.update({
            where: { id: task.id },
            data: { status: 'ASSIGNED' },
          });
          return { assignment: a, task: t2, recommendedEmployee: best };
        });
      }
    } catch (e) {
      console.warn('Auto-assign failed:', e.message);
    }
  }

  res.status(201).json({
    success: true,
    data: {
      task,
      autoAssigned: assignmentInfo
        ? {
            employeeId: assignmentInfo.recommendedEmployee.employeeId,
            employeeName: assignmentInfo.recommendedEmployee.employeeName,
            finalScore: assignmentInfo.recommendedEmployee.finalScore,
            recommendation: assignmentInfo.recommendedEmployee.recommendation,
            breakdown: {
              skillMatch: assignmentInfo.recommendedEmployee.skillMatch,
              workload: assignmentInfo.recommendedEmployee.workload,
              availability: assignmentInfo.recommendedEmployee.availabilityScore,
              deadlineFit: assignmentInfo.recommendedEmployee.deadlineFit,
            },
          }
        : null,
    },
  });
}

async function updateTask(req, res) {
  const id = Number(req.params.id);
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, 'Task not found');

  const allowed = ['title', 'description', 'projectId', 'priority', 'estimatedHours', 'deadline', 'status'];
  const data = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) data[k] = req.body[k];
  }
  if (data.deadline) data.deadline = new Date(data.deadline);
  if (data.projectId) data.projectId = Number(data.projectId);
  if (data.estimatedHours) data.estimatedHours = Number(data.estimatedHours);

  // Replace required skills if provided
  if (req.body.skillIds) {
    await prisma.taskSkill.deleteMany({ where: { taskId: id } });
    if (req.body.skillIds.length > 0) {
      await prisma.taskSkill.createMany({
        data: req.body.skillIds.map((sid) => ({ taskId: id, skillId: Number(sid) })),
      });
    }
  }

  const updated = await prisma.task.update({ where: { id }, data });
  res.json({ success: true, data: updated });
}

async function deleteTask(req, res) {
  const id = Number(req.params.id);
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, 'Task not found');
  await prisma.task.delete({ where: { id } });
  res.json({ success: true, message: 'Task deleted' });
}

module.exports = { listTasks, getTask, createTask, updateTask, deleteTask };