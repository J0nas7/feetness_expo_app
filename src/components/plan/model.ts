export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
export const PERIOD_PATTERN = /^(0[1-9]|1[0-2])-(\d{4})$/;

export type Metric = 'distance' | 'duration';
export type BulkGoalMode = 'assign' | 'relative';
export type BulkOperation = 'add' | 'subtract' | 'increasePercent' | 'decreasePercent';

export type Plan = {
    id: string;
    period: string;
    metric: Metric;
    goal: number;
};

export const now = new Date();
export const currentPeriodIndex = now.getFullYear() * 12 + now.getMonth();

export const periodIndex = (period: string) => {
    const match = PERIOD_PATTERN.exec(period);
    return match ? Number(match[2]) * 12 + Number(match[1]) - 1 : Number.MAX_SAFE_INTEGER;
};

export const formatPeriod = (period: string) => {
    const match = PERIOD_PATTERN.exec(period);
    return match ? `${MONTHS[Number(match[1]) - 1]} ${match[2]}` : period;
};

export const sortPlans = (plans: Plan[]) =>
    [...plans].sort((a, b) => periodIndex(a.period) - periodIndex(b.period));

export const nextAvailablePeriod = (sourcePeriod: string, plans: Plan[]) => {
    let candidate = periodIndex(sourcePeriod);
    if (candidate === Number.MAX_SAFE_INTEGER) candidate = currentPeriodIndex;
    do { candidate += 1; } while (plans.some((plan) => periodIndex(plan.period) === candidate));
    return { month: candidate % 12 + 1, year: Math.floor(candidate / 12) };
};

export const calculateBulkGoal = (
    originalGoal: number,
    amount: number,
    goalMode: BulkGoalMode,
    operation: BulkOperation
) => {
    if (goalMode === 'assign') return amount;
    if (operation === 'add') return originalGoal + amount;
    if (operation === 'subtract') return originalGoal - amount;
    if (operation === 'increasePercent') return originalGoal * (1 + amount / 100);
    return originalGoal * (1 - amount / 100);
};
