import { ExerciseType } from '@/types/WorkoutDTO';

export type CalendarView = 'day' | 'week' | 'month' | 'year';

export const CALENDAR_VIEWS: CalendarView[] = ['day', 'week', 'month', 'year'];
export const ACTIVITIES: ExerciseType[] = ['walking', 'running', 'cycling'];
export const EXERCISE_ICON: Record<ExerciseType, string> = {
    running: '🏃‍♂️',
    cycling: '🚴‍♀️',
    walking: '🚶‍♂️',
};

export const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
export const addDays = (date: Date, amount: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
export const sameDay = (left: Date, right: Date) => startOfDay(left).getTime() === startOfDay(right).getTime();
export const startOfWeek = (date: Date) => addDays(startOfDay(date), -((date.getDay() + 6) % 7));
export const dateKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

export const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return hours
        ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
        : `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const isoWeek = (value: Date) => {
    const date = new Date(value.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
    const first = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - first.getTime()) / 86400000 - 3 + ((first.getDay() + 6) % 7)) / 7);
};

export const monthWeeks = (year: number, month: number) => {
    const first = startOfWeek(new Date(year, month, 1));
    const last = new Date(year, month + 1, 0);
    const result: Date[][] = [];
    for (let weekStart = first; weekStart <= last; weekStart = addDays(weekStart, 7)) {
        result.push(Array.from({ length: 7 }, (_, day) => addDays(weekStart, day)));
    }
    return result;
};
