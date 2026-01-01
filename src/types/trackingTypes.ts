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
  student_id: number;
  violation_type_id: number;
  quantity: number;
}