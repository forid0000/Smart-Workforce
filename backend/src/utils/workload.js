// Workload utility
// Workload % = (assigned estimated hours) / (daily capacity) * 100
// CP-1 simple version: counts assigned (non-completed, non-cancelled) tasks for an employee.

function workloadPercent(assignedHours, capacity) {
  if (!capacity || capacity <= 0) return 0;
  return Math.round((assignedHours / capacity) * 100);
}

function workloadLevel(percent) {
  if (percent < 60) return 'Available';
  if (percent < 80) return 'Normal';
  if (percent < 100) return 'High';
  return 'Overloaded';
}

module.exports = { workloadPercent, workloadLevel };