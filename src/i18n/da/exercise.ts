export default {
  workoutComplete: 'Træning gennemført',
  speech: {
    kilometer: 'kilometer', kilometers: 'kilometer', minute: 'minut', minutes: 'minutter', goal: '{{amount}} {{unit}}',
    countdown: { five: 'Fem', four: 'Fire', three: 'Tre', two: 'To', one: 'En' },
  },
  location: {
    permissionTitle: 'Lokalitetstilladelse nødvendig', androidPermission: 'Feetness skal have lokalitet indstillet til ”Tillad altid” for at registrere træningen, mens skærmen er låst.', iosPermission: 'Feetness skal have adgang til lokalitet indstillet til Altid for at registrere træningen.',
    openSettings: 'Åbn indstillinger', unavailableTitle: 'Lokalitetsregistrering er ikke tilgængelig', unavailableMessage: 'Feetness kunne ikke starte lokalitetsregistreringen. Kontrollér dine lokalitetstilladelser, og at Lokalitet er slået til.',
    notificationTitle: 'Træning i gang', notificationBody: 'Registrerer din rute',
  },
  goalOf: 'af {{amount}} {{unit}}', slideToPause: 'SKUB FOR AT PAUSE', openMap: 'Åbn kort', closeMap: 'Luk kort',
  enableVoice: 'Slå stemmevejledning til', disableVoice: 'Slå stemmevejledning fra', time: 'Tid', steps: 'Skridt', finish: 'Mål',
} as const;
