// src/utils/dateUtils.ts

export const getWeekNumberFromStart = (currentDate: Date, startDateStr?: string): number => {
    if (!startDateStr) {
        // Logic fallback: Tính theo tuần ISO của năm hiện tại nếu chưa set ngày
        const d = new Date(
            Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
        );
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    }

    const start = new Date(startDateStr);
    const current = new Date(currentDate);

    // Reset giờ về 0h00 để so sánh ngày chuẩn
    start.setHours(0, 0, 0, 0);
    current.setHours(0, 0, 0, 0);

    // Nếu ngày hiện tại nhỏ hơn ngày bắt đầu -> Chưa học (Tuần 0)
    if (current.getTime() < start.getTime()) return 0;

    // Tìm ngày Chủ Nhật của tuần bắt đầu (Kết thúc Tuần 1)
    // getDay(): 0 là CN, 1 là T2...6 là T7
    const startDay = start.getDay();
    // Số ngày cần cộng thêm để đến Chủ Nhật (Nếu start là CN thì là 0, T2 thì là 6)
    const daysToSunday = startDay === 0 ? 0 : 7 - startDay;

    const endOfWeek1 = new Date(start);
    endOfWeek1.setDate(start.getDate() + daysToSunday);

    // Nếu ngày hiện tại nằm trong khoảng Start -> Chủ Nhật đầu tiên => Tuần 1
    if (current <= endOfWeek1) return 1;

    // Từ tuần 2 trở đi: Tính khoảng cách từ "Hết tuần 1"
    const diffTime = current.getTime() - endOfWeek1.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Công thức: Đã qua tuần 1, cộng thêm số tuần trôi qua từ mốc tuần 2
    return 1 + Math.ceil(diffDays / 7);
};

export const getWeekDatesFromStart = (
    weekNumber: number,
    startDateStr?: string,
    year?: number
): string[] => {
    if (!startDateStr) {
        // Fallback logic cũ
        const y = year || new Date().getFullYear();
        const simple = new Date(y, 0, 1 + (weekNumber - 1) * 7);
        const dow = simple.getDay();
        const startOfWeek = new Date(simple);
        if (dow <= 4) startOfWeek.setDate(simple.getDate() - simple.getDay() + 1);
        else startOfWeek.setDate(simple.getDate() + 8 - simple.getDay());

        const dates = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            dates.push(d.toISOString().split('T')[0]);
        }
        return dates;
    }

    const start = new Date(startDateStr);
    start.setHours(0, 0, 0, 0);

    // Tìm ngày kết thúc tuần 1 (Chủ Nhật đầu tiên)
    const startDay = start.getDay();
    const daysToSunday = startDay === 0 ? 0 : 7 - startDay;
    const endOfWeek1 = new Date(start);
    endOfWeek1.setDate(start.getDate() + daysToSunday);

    let currentWeekStart: Date;
    let currentWeekEnd: Date;

    if (weekNumber === 1) {
        // Tuần 1: Bắt đầu từ start_date -> CN
        currentWeekStart = start;
        currentWeekEnd = endOfWeek1;
    } else {
        // Tuần N (N > 1): Bắt đầu từ Thứ 2 sau tuần 1
        // (weekNumber - 2) * 7 là số ngày trôi qua kể từ Thứ 2 của tuần 2
        // endOfWeek1 là CN tuần 1 -> cộng 1 ngày là T2 tuần 2
        const daysToAdd = (weekNumber - 2) * 7 + 1;

        currentWeekStart = new Date(endOfWeek1);
        currentWeekStart.setDate(endOfWeek1.getDate() + daysToAdd);

        currentWeekEnd = new Date(currentWeekStart);
        currentWeekEnd.setDate(currentWeekStart.getDate() + 6); // T2 -> CN (7 ngày)
    }

    const dates = [];
    const temp = new Date(currentWeekStart);
    while (temp <= currentWeekEnd) {
        const y = temp.getFullYear();
        const m = String(temp.getMonth() + 1).padStart(2, '0');
        const d = String(temp.getDate()).padStart(2, '0');
        dates.push(`${y}-${m}-${d}`);
        temp.setDate(temp.getDate() + 1);
    }
    return dates;
};
