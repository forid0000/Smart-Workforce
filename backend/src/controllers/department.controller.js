const prisma = require('../lib/prisma');
const ApiError = require('../lib/apiError');

async function listDepartments(req, res) {
  const departments = await prisma.department.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { employees: true } } },
  });
  res.json({ success: true, data: departments });
}

async function createDepartment(req, res) {
  const { name } = req.body;
  if (!name) throw new ApiError(400, 'Name is required');
  const existing = await prisma.department.findUnique({ where: { name } });
  if (existing) throw new ApiError(409, 'Department already exists');
  const dept = await prisma.department.create({ data: { name } });
  res.status(201).json({ success: true, data: dept });
}

module.exports = { listDepartments, createDepartment };