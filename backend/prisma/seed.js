// Smart Workforce seed data
// Run with: npm run prisma:seed
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data (order matters because of FKs)
  await prisma.workLog.deleteMany();
  await prisma.taskAssignment.deleteMany();
  await prisma.taskSkill.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.employeeSkill.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();

  // ---------- Departments ----------
  const design = await prisma.department.create({ data: { name: 'Design' } });
  const development = await prisma.department.create({ data: { name: 'Development' } });
  const marketing = await prisma.department.create({ data: { name: 'Marketing' } });

  // ---------- Skills ----------
  const skillNames = [
    'Photoshop',
    'Illustrator',
    'Graphic Design',
    'UI/UX Design',
    'Programming',
    'Video Editing',
    'Research',
  ];
  const skills = {};
  for (const name of skillNames) {
    skills[name] = await prisma.skill.create({ data: { name } });
  }

  // ---------- Employees ----------
  const rahim = await prisma.employee.create({
    data: {
      name: 'Rahim Hasan',
      email: 'rahim@example.com',
      position: 'Senior Graphic Designer',
      capacity: 8,
      availability: 'AVAILABLE',
      departmentId: design.id,
      skills: {
        create: [
          { skillId: skills['Photoshop'].id, level: 'ADVANCED' },
          { skillId: skills['Illustrator'].id, level: 'INTERMEDIATE' },
          { skillId: skills['Graphic Design'].id, level: 'ADVANCED' },
          { skillId: skills['UI/UX Design'].id, level: 'INTERMEDIATE' },
        ],
      },
    },
  });

  const karim = await prisma.employee.create({
    data: {
      name: 'Karim Ahmed',
      email: 'karim@example.com',
      position: 'Full Stack Developer',
      capacity: 8,
      availability: 'AVAILABLE',
      departmentId: development.id,
      skills: {
        create: [
          { skillId: skills['Programming'].id, level: 'EXPERT' },
          { skillId: skills['Research'].id, level: 'INTERMEDIATE' },
        ],
      },
    },
  });

  const sadia = await prisma.employee.create({
    data: {
      name: 'Sadia Akter',
      email: 'sadia@example.com',
      position: 'UI/UX Designer',
      capacity: 6,
      availability: 'AVAILABLE',
      departmentId: design.id,
      skills: {
        create: [
          { skillId: skills['UI/UX Design'].id, level: 'ADVANCED' },
          { skillId: skills['Photoshop'].id, level: 'INTERMEDIATE' },
          { skillId: skills['Graphic Design'].id, level: 'INTERMEDIATE' },
        ],
      },
    },
  });

  const tanvir = await prisma.employee.create({
    data: {
      name: 'Tanvir Hossain',
      email: 'tanvir@example.com',
      position: 'Marketing Specialist',
      capacity: 8,
      availability: 'BUSY',
      departmentId: marketing.id,
      skills: {
        create: [
          { skillId: skills['Research'].id, level: 'ADVANCED' },
          { skillId: skills['Video Editing'].id, level: 'INTERMEDIATE' },
        ],
      },
    },
  });

  const nusrat = await prisma.employee.create({
    data: {
      name: 'Nusrat Jahan',
      email: 'nusrat@example.com',
      position: 'Frontend Developer',
      capacity: 8,
      availability: 'AVAILABLE',
      departmentId: development.id,
      skills: {
        create: [
          { skillId: skills['Programming'].id, level: 'ADVANCED' },
          { skillId: skills['UI/UX Design'].id, level: 'INTERMEDIATE' },
        ],
      },
    },
  });

  // ---------- Users (auth) ----------
  const adminPass = await bcrypt.hash('admin123', 10);
  const empPass = await bcrypt.hash('employee123', 10);

  await prisma.user.create({
    data: {
      email: 'admin@smartworkforce.com',
      password: adminPass,
      role: 'ADMIN',
    },
  });
  await prisma.user.create({
    data: {
      email: 'rahim@example.com',
      password: empPass,
      role: 'EMPLOYEE',
      employeeId: rahim.id,
    },
  });

  // ---------- Projects ----------
  const brandProject = await prisma.project.create({
    data: {
      name: 'Premium Food Brand Launch',
      description: 'Create packaging, social media creatives, and website UI for a new organic food brand.',
      status: 'ACTIVE',
    },
  });
  const videoProject = await prisma.project.create({
    data: {
      name: 'Product Promo Videos',
      description: 'Produce three 30-second promotional videos for upcoming campaigns.',
      status: 'PLANNING',
    },
  });

  // ---------- Tasks ----------
  const today = new Date();
  const addDays = (n) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return d;
  };

  await prisma.task.create({
    data: {
      title: 'Design Premium Food Packaging',
      description: 'Design packaging for the new organic food line.',
      projectId: brandProject.id,
      priority: 'HIGH',
      estimatedHours: 6,
      deadline: addDays(5),
      status: 'PENDING',
      requiredSkills: {
        create: [
          { skillId: skills['Photoshop'].id },
          { skillId: skills['Illustrator'].id },
          { skillId: skills['Graphic Design'].id },
        ],
      },
    },
  });

  await prisma.task.create({
    data: {
      title: 'Build Brand Landing Page',
      description: 'Implement responsive landing page for the brand website.',
      projectId: brandProject.id,
      priority: 'MEDIUM',
      estimatedHours: 8,
      deadline: addDays(7),
      status: 'PENDING',
      requiredSkills: {
        create: [
          { skillId: skills['Programming'].id },
          { skillId: skills['UI/UX Design'].id },
        ],
      },
    },
  });

  await prisma.task.create({
    data: {
      title: 'Research Competitor Campaigns',
      description: 'Research three competitors and summarize their marketing.',
      projectId: videoProject.id,
      priority: 'LOW',
      estimatedHours: 3,
      deadline: addDays(2),
      status: 'PENDING',
      requiredSkills: {
        create: [{ skillId: skills['Research'].id }],
      },
    },
  });

  await prisma.task.create({
    data: {
      title: 'Edit Promo Video Reel',
      description: 'Edit raw footage into a 30 second promo reel.',
      projectId: videoProject.id,
      priority: 'MEDIUM',
      estimatedHours: 5,
      deadline: addDays(4),
      status: 'PENDING',
      requiredSkills: {
        create: [{ skillId: skills['Video Editing'].id }],
      },
    },
  });

  await prisma.task.create({
    data: {
      title: 'Design Mobile App UI',
      description: 'Design 5 mobile screens for the upcoming customer app.',
      projectId: brandProject.id,
      priority: 'URGENT',
      estimatedHours: 10,
      deadline: addDays(6),
      status: 'PENDING',
      requiredSkills: {
        create: [
          { skillId: skills['UI/UX Design'].id },
          { skillId: skills['Photoshop'].id },
        ],
      },
    },
  });

  console.log('✅ Seed completed.');
  console.log('Admin login: admin@smartworkforce.com / admin123');
  console.log('Employee login: rahim@example.com / employee123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });