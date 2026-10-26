import type { ComplaintStatus } from "./constants";

export type Attachment = {
  path: string;
  name: string;
  type: string;
  size: number;
};

export type Complaint = {
  id: number;
  name: string | null;
  tehsil: string | null;
  contact_number: string | null;
  complaint_date: string | null;
  complaint: string | null;
  location: string | null;
  remarks: string | null;
  department: string | null;
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
