export default {
  title: 'Månedsplaner', history: 'Historik', current: 'Aktuelle og kommende', empty: 'Din plan starter her', emptyDescription: 'Opret et månedligt mål for distance eller varighed, og hold fokus på din træning.', create: 'Opret din første plan',
  toolbar: { selected: '{{count}} valgt', selectAll: 'Vælg alle', deselectAll: 'Fravælg alle', done: 'OK', edit: 'Rediger' },
  card: { currentMonth: 'DENNE MÅNED', goal: 'Mål: {{goal}} {{unit}}', copy: 'Kopiér', edit: 'Rediger', delete: 'Slet', hours: 'timer' },
  navigation: { new: 'Ny månedsplan', copy: 'Kopiér plan', edit: 'Rediger plan', editMultiple: 'Rediger planer' },
  noCurrent: 'Der er ingen aktuelle eller kommende planer endnu.',
  delete: { title: 'Slet plan?', selectedTitle: 'Slet {{count}} valgt plan?', selectedTitlePlural: 'Slet {{count}} valgte planer?', warning: 'Handlingen kan ikke fortrydes.' },
  accessibility: { select: 'Vælg {{period}}', create: 'Opret plan', deleteSelected: 'Slet {{count}} valgt plan', deleteSelectedPlural: 'Slet {{count}} valgte planer', editSelected: 'Rediger {{count}} valgt plan', editSelectedPlural: 'Rediger {{count}} valgte planer' },
  form: {
    invalidGoalTitle: 'Ugyldigt mål', invalidGoalMessage: 'Indtast et tal, der er større end 0.',
    invalidResultTitle: 'Ugyldigt resultat', invalidResultMessage: 'Ændringen ville give mindst én plan et mål på 0 eller mindre.',
    duplicateTitle: 'Planen findes allerede', duplicateMessage: 'Der er allerede en plan for {{period}}.',
    selected: '{{count}} plan valgt', selectedPlural: '{{count}} planer valgt',
    copiedIntro: 'Mål og måleenhed er kopieret. Vælg måned for den nye plan.', defaultIntro: 'Vælg måned, måleenhed og mål.',
    update: 'Opdater {{count}} plan', updatePlural: 'Opdater {{count}} planer', saveChanges: 'Gem ændringer', createFor: 'Opret plan for {{period}}', deletePlan: 'Slet plan',
    fields: {
      monthYear: 'Måned og år', previousYear: 'Forrige år', nextYear: 'Næste år', unitTitle: 'Planens måleenhed', distance: 'Distance', duration: 'Varighed',
      changeMethod: 'Sådan ændres målet', assign: 'Samme mål', relative: 'Relativ ændring',
      add: 'Læg til', subtract: 'Træk fra', increasePercent: 'Forøg med %', decreasePercent: 'Reducer med %',
      change: 'Ændring', goal: 'Planens mål', hours: 'timer', assignHint: 'Alle valgte planer får det samme mål og den valgte måleenhed.', relativeHint: 'Ændringen beregnes ud fra hver plans nuværende mål.',
    },
  },
} as const;
