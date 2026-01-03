const parseLocalDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();

    const cleanDateStr = dateStr.split('T')[0];
    const [y, m, d] = cleanDateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setHours(0, 0, 0, 0);
    return date;
};

const getMondayOfWeek = (d: Date): Date => {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    const day = date.getDay();

    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
};

export const getWeekNumberFromStart = (currentDate: Date, startDateStr?: string): number => {
    if (!startDateStr) return 0;

    const start = parseLocalDate(startDateStr);
    const current = new Date(currentDate);
    current.setHours(0, 0, 0, 0);

    const startWeekMonday = getMondayOfWeek(start);

    if (current.getTime() < startWeekMonday.getTime()) return 0;

    const diffTime = current.getTime() - startWeekMonday.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return Math.floor(diffDays / 7) + 1;
};

export const getWeekDatesFromStart = (weekNumber: number, startDateStr?: string): string[] => {
    let startWeekMonday: Date;

    if (startDateStr) {
        startWeekMonday = getMondayOfWeek(parseLocalDate(startDateStr));
    } else {
        startWeekMonday = getMondayOfWeek(new Date());
    }

    const targetMonday = new Date(startWeekMonday);
    targetMonday.setDate(startWeekMonday.getDate() + (weekNumber - 1) * 7);

    const dates: string[] = [];

    for (let i = 0; i < 7; i++) {
        const d = new Date(targetMonday);
        d.setDate(targetMonday.getDate() + i);

        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dates.push(`${y}-${m}-${day}`);
    }

    return dates;
};
