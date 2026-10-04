const prisma = require('../lib/prisma');
const ApiError = require('../lib/apiError');

async function listSkills(req, res) {
  const skills = await prisma.skill.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { employees: true, tasks: true } } },
  });
  const data = skills.map((s) => ({
    id: s.id,
    name: s.name,
    employeeCount: s._count.employees,
    taskCount: s._count.tasks,
  }));
  res.json({ success: true, data });
}

async function createSkill(req, res) {
  const { name } = req.body;
  if (!name) throw new ApiError(400, 'Name is required');
  const existing = await prisma.skill.findUnique({ where: { name } });
  if (existing) throw new ApiError(409, 'Skill already exists');
  const skill = await prisma.skill.create({ data: { name } });
  res.status(201).json({ success: true, data: { ...skill, employeeCount: 0, taskCount: 0 } });
}

module.exports = { listSkills, createSkill };