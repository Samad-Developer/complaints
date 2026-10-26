import { z } from "zod";
import { DEPARTMENTS, STATUSES, TEHSILS } from "./constants";

// Every field is optional: a blank value is saved as null. A value that *is*
// entered must still be valid (e.g. a well-formed mobile number).
const blankToNull = (v: unknown) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};

const optional = <T extends z.ZodType>(schema: T) => z.preprocess(blankToNull, schema.nullable());

const optionalText = (max: number, label: string) =>
  optional(z.string().max(max, `${label} is too long.`));

/**
 * Pakistani mobile number: 03XXXXXXXXX (11 digits) or the international
 * form 92 3XXXXXXXXX / +92 3XXXXXXXXX. Spaces and dashes are ignored.
 * Always normalised to the 11-digit local form, e.g. 03001234567.
 */
const pakistaniMobile = z
  .string()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .refine((v) => /^(?:03\d{9}|\+?923\d{9})$/.test(v), {
    message: "Enter a valid Pakistani mobile number, e.g. 03001234567 or 923001234567.",
  })
  .transform((v) => v.replace(/^\+?92/, "0"));

export const complaintSchema = z.object({
  name: optionalText(120, "Name"),
  tehsil: optional(z.enum(TEHSILS, { error: "Select a valid tehsil." })),
  contact_number: optional(pakistaniMobile),
  complaint_date: optional(z.iso.date({ error: "Select a valid date." })),
  complaint: optionalText(5000, "Complaint"),
  location: optionalText(300, "Location"),
  remarks: optionalText(2000, "Remarks"),
  department: optional(z.enum(DEPARTMENTS, { error: "Select a valid department." })),
  status: z.preprocess((v) => blankToNull(v) ?? "pending", z.enum(STATUSES, { error: "Select a status." })),
});

export type ComplaintInput = z.infer<typeof complaintSchema>;

export function parseComplaint(formData: FormData) {
  const keys = Object.keys(complaintSchema.shape) as (keyof ComplaintInput)[];
  const result = complaintSchema.safeParse(Object.fromEntries(keys.map((k) => [k, formData.get(k)])));

  if (result.success) return { data: result.data, errors: null };

  const fieldErrors = z.flattenError(result.error).fieldErrors as Record<string, string[] | undefined>;
  const errors: Record<string, string> = {};
  for (const [key, messages] of Object.entries(fieldErrors)) {
    if (messages?.[0]) errors[key] = messages[0];
  }
  return { data: null, errors };
}
