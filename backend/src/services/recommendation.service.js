// Smart recommendation service
// Score weights (CP-1):
//   Skill Match       → 40%
//   Workload Balance  → 25%
//   Availability      → 20%
//   Deadline Fit      → 15%
//
// Each component is normalized to 0..100, then a weighted sum produces final score.

const prisma = require('../lib/prisma');

const WEIGHTS = {
  skill: 0.40,
  workload: 0.25,
  availability: 0.20,
  deadline: 0.15,
};

const SKILL_LEVEL_POINTS = {
  BEGINNER: 25,
  INTERMEDIATE: 50,
  ADVANCED: 75,
  EXPERT: 100,
};

function levelScore(level) {
  return SKILL_LEVEL_POINTS[level] || 50;
}

async function getEmployeeAssignedHours(employeeId) {
  // Count estimated hours of active tasks assigned to this employee
  const active = await prisma.taskAssignment.findMany({
    where: {
      employeeId,
      task: {
        status: { in: ['ASSIGNED', 'IN_PROGRESS', 'REVIEW', 'PENDING'] },
      },
    },
    include: { task: true },
  });
  return active.reduce((sum, a) => sum + (a.task?.estimatedHours || 0), 0);
}

/**
 * Build a recommendation report for a task.
 * Returns ranked employees with per-component scores and final weighted score.
 */
async function recommendEmployeesForTask(taskId) {
  const task = await prisma.task.findUnique({
    where: { id: Number(taskId) },
    include: { requiredSkills: { include: { skill: true } } },
  });
  if (!task) {
    const err = new Error('Task not found');
    err.statusCode = 404;
    throw err;
  }

  const requiredSkills = task.requiredSkills.map((ts) => ts.skill);
  const requiredSkillIds = requiredSkills.map((s) => s.id);

  // Fetch all employees with their skills and assignments
  const employees = await prisma.employee.findMany({
    include: {
      skills: { include: { skill: true } },
      department: true,
    },
  });

  const today = new Date();
  const daysToDeadline = Math.max(
    1,
    Math.ceil((new Date(task.deadline).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  );

  const reports = [];

  for (const emp of employees) {
    const empSkillMap = new Map();
    for (const es of emp.skills) {
      empSkillMap.set(es.skillId, es);
    }

    // ---------- Skill Match (0..100) ----------
    let skillScore = 0;
    if (requiredSkillIds.length === 0) {
      // No skills required → neutral 60
      skillScore = 60;
    } else {
      const matched = requiredSkillIds.filter((id) => empSkillMap.has(id));
      const coverage = matched.length / requiredSkillIds.length; // 0..1
      // Sum of skill levels for matched skills
      let levelSum = 0;
      for (const id of matched) {
        levelSum += levelScore(empSkillMap.get(id).level);
      }
      const avgLevel = matched.length ? levelSum / matched.length : 0;
      // Combine coverage (70 points max) + average level (30 points max)
      skillScore = Math.round(coverage * 70 + (avgLevel / 100) * 30);
      // If no skills matched, score = 0
      if (matched.length === 0) skillScore = 0;
    }

    // ---------- Workload Balance (0..100) ----------
    // Less workload → higher score
    const assignedHours = await getEmployeeAssignedHours(emp.id);
    const workloadPct = emp.capacity > 0 ? (assignedHours / emp.capacity) * 100 : 100;
    // Map 0..120% workload to 100..0 score
    let workloadScore;
    if (workloadPct <= 50) workloadScore = 100;
    else if (workloadPct >= 120) workloadScore = 0;
    else workloadScore = Math.round(100 - ((workloadPct - 50) / 70) * 100);

    // ---------- Availability (0..100) ----------
    let availabilityScore;
    if (emp.availability === 'AVAILABLE') availabilityScore = 100;
    else if (emp.availability === 'BUSY') availabilityScore = 50;
    else availabilityScore = 0;

    // ---------- Deadline Fit (0..100) ----------
    // Can the employee fit this task (estimated hours) before the deadline,
    // considering they have `daysToDeadline` days and `capacity` per day.
    const totalCapacity = emp.capacity * daysToDeadline;
    const remainingCapacity = Math.max(0, totalCapacity - assignedHours);
    const required = task.estimatedHours || 1;
    let deadlineScore;
    if (remainingCapacity >= required * 1.5) deadlineScore = 100;
    else if (remainingCapacity >= required) deadlineScore = 80;
    else if (remainingCapacity >= required * 0.5) deadlineScore = 50;
    else deadlineScore = 20;

    // ---------- Final weighted score ----------
    const finalScore =
      skillScore * WEIGHTS.skill +
      workloadScore * WEIGHTS.workload +
      availabilityScore * WEIGHTS.availability +
      deadlineScore * WEIGHTS.deadline;

    let recommendation = 'NOT RECOMMENDED';
    if (finalScore >= 80) recommendation = 'HIGHLY RECOMMENDED';
    else if (finalScore >= 60) recommendation = 'RECOMMENDED';
    else if (finalScore >= 40) recommendation = 'POSSIBLE';

    reports.push({
      employeeId: emp.id,
      employeeName: emp.name,
      position: emp.position,
      department: emp.department?.name,
      availability: emp.availability,
      capacity: emp.capacity,
      assignedHours,
      currentWorkloadPercent: Math.round(workloadPct),
      skillMatch: skillScore,
      workload: workloadScore,
      availabilityScore,
      deadlineFit: deadlineScore,
      finalScore: Number(finalScore.toFixed(2)),
      recommendation,
    });
  }

  // Sort highest first
  reports.sort((a, b) => b.finalScore - a.finalScore);
  return { task, requiredSkills, recommendations: reports };
}

module.exports = { recommendEmployeesForTask, WEIGHTS };