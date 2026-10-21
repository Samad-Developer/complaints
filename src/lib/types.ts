import type { ComplaintStatus } from "./constants";

export type Attachment = {
  path: string;
  name: string;
  type: string;
  size: number;
};

export type Complaint = {
  id: number;
  name: string;
  tehsil: string;
  contact_number: string;
  complaint_date: string;
  complaint: string;
  location: string;
  remarks: string | null;
  department: string;
  status: ComplaintStatus;
  attachments: Attachment[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ComplaintStats = {
  total: number;
  by_status: Partial<Record<ComplaintStatus, number>>;
  by_tehsil: Record<string, number>;
  by_department: Record<string, number>;
  daily: { day: string; count: number }[];
};

export type ActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
} | null;
