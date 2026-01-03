

export const getWeekNumberFromStart = (currentDate: Date, startDateStr?: string): number => {
    if (!startDateStr) {
        
        const d = new Date(
            Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
        );
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    }

    
    const [y, m, d] = startDateStr.split('-').map(Number);
    const start = new Date(y, m - 1, d); 
    start.setHours(0, 0, 0, 0);

    const current = new Date(currentDate);
    current.setHours(0, 0, 0, 0);

    
    if (current.getTime() < start.getTime()) return 0;

    
    const startDay = start.getDay(); 
    const daysToSunday = startDay === 0 ? 0 : 7 - startDay;

    const endOfWeek1 = new Date(start);
    endOfWeek1.setDate(start.getDate() + daysToSunday);

    
    if (current.getTime() <= endOfWeek1.getTime()) return 1;

    
    const diffTime = current.getTime() - endOfWeek1.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    
    return 1 + Math.ceil(diffDays / 7);
};

export const getWeekDatesFromStart = (
    weekNumber: number,
    startDateStr?: string,
    year?: number
): string[] => {
    if (!startDateStr) {
        const y = year || new Date().getFullYear();
        
        const simple = new Date(y, 0, 1 + (weekNumber - 1) * 7);
        const startOfWeek = new Date(simple);
        const day = startOfWeek.getDay() || 7; 
        if (day !== 1) startOfWeek.setHours(-24 * (day - 1));
        
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            dates.push(d.toISOString().split('T')[0]);
        }
        return dates;
    }

    
    const [y, m, d] = startDateStr.split('-').map(Number);
    const start = new Date(y, m - 1, d);
    start.setHours(0, 0, 0, 0);

    
    const startDay = start.getDay();
    const daysToSunday = startDay === 0 ? 0 : 7 - startDay;
    const endOfWeek1 = new Date(start);
    endOfWeek1.setDate(start.getDate() + daysToSunday);

    let currentWeekStart: Date;
    let currentWeekEnd: Date;

    if (weekNumber === 1) {
        currentWeekStart = start;
        currentWeekEnd = endOfWeek1;
    } else {
        
        const daysToAdd = (weekNumber - 2) * 7 + 1;
        currentWeekStart = new Date(endOfWeek1);
        currentWeekStart.setDate(endOfWeek1.getDate() + daysToAdd);

        currentWeekEnd = new Date(currentWeekStart);
        currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
    }

    const dates = [];
    const temp = new Date(currentWeekStart);
    
    
    while (temp <= currentWeekEnd) {
        const Y = temp.getFullYear();
        const M = String(temp.getMonth() + 1).padStart(2, '0');
        const D = String(temp.getDate()).padStart(2, '0');
        dates.push(`${Y}-${M}-${D}`);
        temp.setDate(temp.getDate() + 1);
    }
    return dates;
};