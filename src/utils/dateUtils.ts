
export interface WeekSchedule {
    week: number;
    startDate: string; 
    title?: string;
    isBreak?: boolean;
}

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


const isSameOrAfter = (date1: Date, date2: Date) => {
    return date1.getTime() >= date2.getTime();
};

export const getWeekNumberFromStart = (
    currentDate: Date,
    startDateStr?: string,
    scheduleConfig?: WeekSchedule[] | null
): number => {
    const current = new Date(currentDate);
    current.setHours(0, 0, 0, 0);

    
    if (scheduleConfig && scheduleConfig.length > 0) {
        
        const sortedConfig = [...scheduleConfig].sort((a, b) => 
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );
        
        
        for (let i = 0; i < sortedConfig.length; i++) {
            const thisWeek = sortedConfig[i];
            const nextWeek = sortedConfig[i + 1];

            const thisWeekStart = parseLocalDate(thisWeek.startDate);
            const nextWeekStart = nextWeek ? parseLocalDate(nextWeek.startDate) : null;

            
            if (isSameOrAfter(current, thisWeekStart)) {
                
                if (!nextWeekStart || current.getTime() < nextWeekStart.getTime()) {
                    return thisWeek.isBreak ? 0 : thisWeek.week;
                }
            }
        }
        return 0; 
    }

    
    if (!startDateStr) return 0;
    const start = parseLocalDate(startDateStr);
    const startWeekMonday = getMondayOfWeek(start);

    if (current.getTime() < startWeekMonday.getTime()) return 0;

    const diffTime = current.getTime() - startWeekMonday.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return Math.floor(diffDays / 7) + 1;
};

export const getWeekDatesFromStart = (
    weekNumber: number,
    startDateStr?: string,
    scheduleConfig?: WeekSchedule[] | null
): string[] => {
    let targetMonday: Date;

    
    if (scheduleConfig && scheduleConfig.length > 0) {
        
        const weekInfo = scheduleConfig.find(w => w.week === weekNumber && !w.isBreak);
        
        if (weekInfo) {
            
            targetMonday = getMondayOfWeek(parseLocalDate(weekInfo.startDate));
        } else {
            
             if (startDateStr) {
                 const start = getMondayOfWeek(parseLocalDate(startDateStr));
                 targetMonday = new Date(start);
                 targetMonday.setDate(start.getDate() + (weekNumber - 1) * 7);
             } else {
                 return [];
             }
        }
    } else {
        
        let startWeekMonday: Date;
        if (startDateStr) {
            startWeekMonday = getMondayOfWeek(parseLocalDate(startDateStr));
        } else {
            startWeekMonday = getMondayOfWeek(new Date());
        }
        targetMonday = new Date(startWeekMonday);
        targetMonday.setDate(startWeekMonday.getDate() + (weekNumber - 1) * 7);
    }

    
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