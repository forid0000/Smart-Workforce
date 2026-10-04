const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const ApiError = require('../lib/apiError');

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employee?.id || null,
    },
    process.env.JWT_SECRET || 'dev_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required');

  const user = await prisma.user.findUnique({
    where: { email },
    include: { employee: true },
  });
  if (!user) throw new ApiError(401, 'Invalid credentials');

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw new ApiError(401, 'Invalid credentials');

  const token = signToken(user);
  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        employee: user.employee
          ? { id: user.employee.id, name: user.employee.name }
          : null,
      },
    },
  });
}

async function me(req, res) {
  // expects auth middleware to attach req.user
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { employee: true },
  });
  res.json({ success: true, data: user });
}

module.exports = { login, me };