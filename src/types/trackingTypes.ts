export interface Student {
    id: number;
    full_name: string;
    group_number: number;
}

export interface ViolationType {
    id: number;
    category: string;
    name: string;
    points: number;
}

export interface DailyLogPayload {
    id?: number;
    student_id: number;
    violation_type_id: number;
    quantity: number;
    log_date: string;
    note?: string;

    student_name?: string;
    violation_name?: string;
    category?: string;
    points?: number;
    created_at?: string;
}

export interface EditingCellData {
    studentId: number;
    violationId: number;
    violationName: string;
    studentName: string;
    isAbsence: boolean;
    isBonus: boolean;
    currentQuantity: number;
    currentNote: string;
}
