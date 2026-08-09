export default {
  workoutComplete: 'Workout complete',
  speech: {
    kilometer: 'kilometer', kilometers: 'kilometers', minute: 'minute', minutes: 'minutes', goal: '{{amount}} {{unit}}',
    countdown: { five: 'Five', four: 'Four', three: 'Three', two: 'Two', one: 'One' },
  },
  location: {
    permissionTitle: 'Location permission required', androidPermission: 'Feetness needs Location set to “Allow all the time” to track this workout with the screen locked.', iosPermission: 'Feetness needs Always Location access to track this workout.',
    openSettings: 'Open settings', unavailableTitle: 'Location tracking unavailable', unavailableMessage: 'Feetness could not start location tracking. Check your location permissions and that Location is enabled.',
    notificationTitle: 'Workout in progress', notificationBody: 'Tracking your route',
  },
  editWorkout: {
    navigationTitle: 'Edit workout', title: 'Adjust workout', intro: 'Correct the workout details below. Pace and goal progress are recalculated automatically.',
    bulkNavigationTitle: 'Edit workouts', bulkTitle: 'Adjust {{count}} workouts', bulkIntro: 'Choose which shared fields to change. Recorded workout results stay untouched.',
    keepUnchanged: 'Keep unchanged', applying: 'Change', bulkSave: 'Save workouts',
    bulkNothingTitle: 'Choose a change', bulkNothingMessage: 'Enable activity or workout goal before saving.', bulkInvalidMessage: 'The goal must be greater than 0.',
    activity: 'Activity', when: 'Date and time', date: 'Date', time: 'Time', dateHint: 'Use YYYY-MM-DD and HH:MM.',
    results: 'Results', calories: 'Calories', goal: 'Workout goal', goalAmount: 'Goal amount',
    save: 'Save workout', saving: 'Saving…', invalidTitle: 'Check the workout details', invalidMessage: 'Enter a valid date and time, a duration greater than 0, and non-negative distance and calories. The goal must be greater than 0.',
    saveErrorTitle: 'Could not save workout', saveErrorMessage: 'Your changes were not saved. Please try again.',
  },
  createWorkout: { navigationTitle: 'Create workout', title: 'Add workout', intro: 'Enter a workout manually. Pace and goal progress are calculated automatically.', save: 'Create workout', accessibility: 'Create workout' },
  timeSummary: {
    totalTimeBlocks: 'Total time • {{count}} blocks', fastestBlock: 'Fastest block: {{pace}} min/km', groupedPace: 'Pace (grouped)',
    elevationProfile: 'Elevation profile', elevationDescription: 'Elevation changes throughout your workout.', minimumAltitude: 'Min {{altitude}} m', maximumAltitude: 'Max {{altitude}} m',
  },
  summaryStats: { showPrimary: 'Show primary workout stats', showMore: 'Show more workout stats' },
  goalOf: 'of {{amount}} {{unit}}', slideToPause: 'SLIDE TO PAUSE', openMap: 'Open map', closeMap: 'Close map',
  enableVoice: 'Enable voice guidance', disableVoice: 'Disable voice guidance', time: 'Time', pausedTime: 'Paused time', pausedDistance: 'Paused distance', maximum: 'Maximum', altitude: 'Altitude', steps: 'Steps', finish: 'Finish',
} as const;
