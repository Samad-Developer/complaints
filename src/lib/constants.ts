export const TEHSILS = ["Topi", "Swabi", "Lahor", "Razzar"] as const;

export const DEPARTMENTS = [
  "ADC (F&HR)",
  "ADC (G)",
  "AC Swabi",
  "AC Lahor",
  "AAC-I Lahor",
  "AAC-II Lahor",
  "AAC-I Swabi",
  "AAC-II Swabi",
  "AAC Razzar",
  "AAC Topi",
  "ACR Swabi",
  "Other",
] as const;

export const STATUSES = ["pending", "in_process", "complete"] as const;

export const STATUS_LABELS: Record<ComplaintStatus, string> = {
  pending: "Pending",
  in_process: "In Process",
  complete: "Complete",
};

export const ATTACHMENTS_BUCKET = "complaint-attachments";
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_FILES = 5;
export const ALLOWED_FILE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/pdf",
];

export const PAGE_SIZE = 15;

export type Tehsil = (typeof TEHSILS)[number];
export type Department = (typeof DEPARTMENTS)[number];
export type ComplaintStatus = (typeof STATUSES)[number];

export function formatReference(id: number) {
  return `DCC-${String(id).padStart(5, "0")}`;
}
