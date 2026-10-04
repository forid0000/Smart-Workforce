const prisma = require('../lib/prisma');
const ApiError = require('../lib/apiError');
const { workloadPercent, workloadLevel } = require('../utils/workload');

async function enrichEmployee(emp) {
  const active = await prisma.taskAssignment.findMany({
    where: {
      employeeId: emp.id,
      task: { status: { in: ['ASSIGNED', 'IN_PROGRESS', 'REVIEW', 'PENDING'] } },
    },
    include: { task: true },
  });
  const assignedHours = active.reduce((s, a) => s + (a.task?.estimatedHours || 0), 0);
  const wp = workloadPercent(assignedHours, emp.capacity);
  return {
    id: emp.id,
    name: emp.name,
    email: emp.email,
    position: emp.position,
    capacity: emp.capacity,
    availability: emp.availability,
    department: emp.department,
    skills: emp.skills?.map((s) => ({
      id: s.skill.id,
      name: s.skill.name,
      level: s.level,
    })) || [],
    assignedHours,
    workloadPercent: wp,
    workloadLevel: workloadLevel(wp),
  };
}

async function listEmployees(req, res) {
  const { q } = req.query;
  const employees = await prisma.employee.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { position: { contains: q, mode: 'insensitive' } },
          ],
        }
      : undefined,
    include: { department: true, skills: { include: { skill: true } } },
    orderBy: { id: 'asc' },
  });
  const data = await Promise.all(employees.map(enrichEmployee));
  res.json({ success: true, data });
}

async function getEmployee(req, res) {
  const id = Number(req.params.id);
  const emp = await prisma.employee.findUnique({
    where: { id },
    include: { department: true, skills: { include: { skill: true } } },
  });
  if (!emp) throw new ApiError(404, 'Employee not found');
  const data = await enrichEmployee(emp);
  res.json({ success: true, data });
}

async function createEmployee(req, res) {
  const { name, email, position, capacity, availability, departmentId, skillIds } = req.body;
  if (!name || !email || !position || !departmentId) {
    throw new ApiError(400, 'name, email, position, departmentId are required');
  }
  const created = await prisma.employee.create({
    data: {
      name,
      email,
      position,
      capacity: capacity || 8,
      availability: availability || 'AVAILABLE',
      departmentId: Number(departmentId),
      skills: skillIds && skillIds.length
        ? { create: skillIds.map((sid) => ({ skillId: Number(sid) })) }
        : undefined,
    },
    include: { department: true, skills: { include: { skill: true } } },
  });
  const data = await enrichEmployee(created);
  res.status(201).json({ success: true, data });
}

module.exports = { listEmployees, getEmployee, createEmployee, enrichEmployee };