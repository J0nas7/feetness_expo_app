export default {
  title: 'Monthly plans', history: 'History', current: 'Current and upcoming', empty: 'Your plan starts here', emptyDescription: 'Create a monthly distance or duration goal and stay focused on your training.', create: 'Create your first plan',
  toolbar: { selected: '{{count}} selected', selectAll: 'Select all', deselectAll: 'Deselect all', done: 'Done', edit: 'Edit' },
  card: { currentMonth: 'THIS MONTH', goal: 'Goal: {{goal}} {{unit}}', copy: 'Copy', edit: 'Edit', delete: 'Delete', hours: 'hours' },
  navigation: { new: 'New monthly plan', copy: 'Copy plan', edit: 'Edit plan', editMultiple: 'Edit plans' },
  noCurrent: 'There are no current or upcoming plans yet.',
  delete: { title: 'Delete plan?', selectedTitle: 'Delete {{count}} selected plan?', selectedTitlePlural: 'Delete {{count}} selected plans?', warning: 'This action cannot be undone.' },
  accessibility: { select: 'Select {{period}}', create: 'Create plan', deleteSelected: 'Delete {{count}} selected plan', deleteSelectedPlural: 'Delete {{count}} selected plans', editSelected: 'Edit {{count}} selected plan', editSelectedPlural: 'Edit {{count}} selected plans' },
  form: {
    invalidGoalTitle: 'Invalid goal', invalidGoalMessage: 'Enter a number greater than 0.',
    invalidResultTitle: 'Invalid result', invalidResultMessage: 'The change would give at least one plan a goal of 0 or less.',
    duplicateTitle: 'Plan already exists', duplicateMessage: 'A plan for {{period}} already exists.',
    selected: '{{count}} plan selected', selectedPlural: '{{count}} plans selected',
    copiedIntro: 'The goal and unit were copied. Choose a month for the new plan.', defaultIntro: 'Choose a month, unit, and goal.',
    update: 'Update {{count}} plan', updatePlural: 'Update {{count}} plans', saveChanges: 'Save changes', createFor: 'Create plan for {{period}}', deletePlan: 'Delete plan',
    fields: {
      monthYear: 'Month and year', previousYear: 'Previous year', nextYear: 'Next year', unitTitle: 'Plan unit', distance: 'Distance', duration: 'Duration',
      changeMethod: 'How to change the goal', assign: 'Same goal', relative: 'Relative change',
      add: 'Add', subtract: 'Subtract', increasePercent: 'Increase by %', decreasePercent: 'Decrease by %',
      change: 'Change', goal: 'Plan goal', hours: 'hours', assignHint: 'All selected plans receive the same goal and selected unit.', relativeHint: 'The change is calculated from each plan’s current goal.',
    },
  },
} as const;
