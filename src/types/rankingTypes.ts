export interface ReportItem {
    id: number;
    student_name: string;
    group_number: number;
    points: number;
    quantity: number;
}

export interface Student {
    id: number;
    full_name: string;
    group_number: number;
}

export interface Ranking {
    group_number: number;
    total_points: number;
}

export interface StudentSummary {
    name: string;
    group: number;
    total: number;
}

export interface GroupMemberDetail {
    name: string;
    plus: number;
    minus: number;
    total: number;
}

export interface GroupDetail {
    group_number: number;
    members: Record<string, GroupMemberDetail>;
    total_group_points: number;
}
