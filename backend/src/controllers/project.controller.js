const prisma = require('../lib/prisma');
const ApiError = require('../lib/apiError');

async function listProjects(req, res) {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { tasks: true } } },
  });
  res.json({ success: true, data: projects });
}

async function createProject(req, res) {
  const { name, description, status } = req.body;
  if (!name) throw new ApiError(400, 'Name is required');
  const project = await prisma.project.create({
    data: {
      name,
      description: description || null,
      status: status || 'PLANNING',
    },
  });
  res.status(201).json({ success: true, data: project });
}

module.exports = { listProjects, createProject };