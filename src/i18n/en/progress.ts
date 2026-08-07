export default {
  monthlyPlan: 'Monthly plan',
  editMonthlyPlan: 'Edit monthly plan for {{period}}',
  workoutGoal: '{{amount}} {{unit}} goal',
  hours: 'hours',
  period: {
    selector: { week: 'WEEK', month: 'MONTH' },
    week: 'Week {{week}} ({{date}})',
    weekShort: 'W{{week}}',
  },
  metrics: {
    workouts: 'Number of workouts',
    distance: 'Total distance (km)',
    duration: 'Total duration (min)',
    goals: 'Goals completed',
    pace: 'Average pace (min/km)',
  },
  summary: {
    completedGoal: '{{count}} goal',
    completedGoals: '{{count}} goals',
  },
} as const;
