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
  goalOf: 'of {{amount}} {{unit}}', slideToPause: 'SLIDE TO PAUSE', openMap: 'Open map', closeMap: 'Close map',
  enableVoice: 'Enable voice guidance', disableVoice: 'Disable voice guidance', time: 'Time', steps: 'Steps', finish: 'Finish',
} as const;
