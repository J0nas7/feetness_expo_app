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
  editWorkout: {
    navigationTitle: 'Rediger træning', title: 'Tilpas træning', intro: 'Ret træningens oplysninger nedenfor. Tempo og målfremskridt beregnes automatisk igen.',
    bulkNavigationTitle: 'Rediger træninger', bulkTitle: 'Tilpas {{count}} træninger', bulkIntro: 'Vælg de fælles felter, der skal ændres. Registrerede træningsresultater forbliver uændrede.',
    keepUnchanged: 'Behold uændret', applying: 'Ændr', bulkSave: 'Gem træninger',
    bulkNothingTitle: 'Vælg en ændring', bulkNothingMessage: 'Aktivér aktivitet eller træningsmål, før du gemmer.', bulkInvalidMessage: 'Målet skal være større end 0.',
    activity: 'Aktivitet', when: 'Dato og tidspunkt', date: 'Dato', time: 'Tidspunkt', dateHint: 'Brug ÅÅÅÅ-MM-DD og TT:MM.',
    results: 'Resultater', calories: 'Kalorier', goal: 'Træningsmål', goalAmount: 'Målets størrelse',
    save: 'Gem træning', saving: 'Gemmer…', invalidTitle: 'Kontrollér træningens oplysninger', invalidMessage: 'Indtast en gyldig dato og tid, en varighed over 0 samt en ikke-negativ distance og kaloriemængde. Målet skal være større end 0.',
    saveErrorTitle: 'Træningen kunne ikke gemmes', saveErrorMessage: 'Dine ændringer blev ikke gemt. Prøv igen.',
  },
  createWorkout: { navigationTitle: 'Opret træning', title: 'Tilføj træning', intro: 'Indtast en træning manuelt. Tempo og målfremskridt beregnes automatisk.', save: 'Opret træning', accessibility: 'Opret træning' },
  goalOf: 'af {{amount}} {{unit}}', slideToPause: 'SKUB FOR AT PAUSE', openMap: 'Åbn kort', closeMap: 'Luk kort',
  enableVoice: 'Slå stemmevejledning til', disableVoice: 'Slå stemmevejledning fra', time: 'Tid', steps: 'Skridt', finish: 'Mål',
} as const;
