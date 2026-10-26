import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import { exportComplaints } from "@/lib/data";
import { STATUS_LABELS, formatReference } from "@/lib/constants";
import { todayInPakistan } from "@/lib/format";

const BRAND = "FF124630";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }

  const sp = new URL(request.url).searchParams;
  const filters = {
    q: sp.get("q") ?? "",
    status: sp.get("status") ?? "",
    tehsil: sp.get("tehsil") ?? "",
    department: sp.get("department") ?? "",
    from: sp.get("from") ?? "",
    to: sp.get("to") ?? "",
  };

  let rows;
  try {
    rows = await exportComplaints(filters);
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = "DC Complaint Cell";
  wb.created = new Date();

  const ws = wb.addWorksheet("Complaints", {
    views: [{ state: "frozen", ySplit: 1 }],
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });

  ws.columns = [
    { header: "Ref No.", key: "ref", width: 12 },
    { header: "Name", key: "name", width: 24 },
    { header: "Tehsil", key: "tehsil", width: 10 },
    { header: "Contact Number", key: "contact", width: 17 },
    { header: "Complaint Date", key: "date", width: 15, style: { numFmt: "dd-mmm-yyyy" } },
    { header: "Complaint", key: "complaint", width: 60 },
    { header: "Complaint Location", key: "location", width: 28 },
    { header: "Remarks", key: "remarks", width: 36 },
    { header: "Concerned Department", key: "department", width: 22 },
    { header: "Status", key: "status", width: 12 },
    { header: "Attachments", key: "attachments", width: 30 },
    { header: "Registered At", key: "created", width: 20, style: { numFmt: "dd-mmm-yyyy hh:mm" } },
    { header: "Last Updated", key: "updated", width: 20, style: { numFmt: "dd-mmm-yyyy hh:mm" } },
  ];

  // Excel has no timezones: shift timestamps to Pakistan time (UTC+5).
  const pkt = (iso: string) => new Date(new Date(iso).getTime() + 5 * 60 * 60 * 1000);
  const dateOnly = (d: string | null) => {
    if (!d) return null;
    const [y, m, day] = d.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, day));
  };

  for (const c of rows) {
    ws.addRow({
      ref: formatReference(c.id),
      name: c.name,
      tehsil: c.tehsil,
      contact: c.contact_number,
      date: dateOnly(c.complaint_date),
      complaint: c.complaint,
      location: c.location,
      remarks: c.remarks ?? "",
      department: c.department,
      status: STATUS_LABELS[c.status] ?? c.status,
      attachments: c.attachments.map((a) => a.name).join(", "),
      created: pkt(c.created_at),
      updated: pkt(c.updated_at),
    });
  }

  // Header styling
  const header = ws.getRow(1);
  header.height = 22;
  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND } };
    cell.alignment = { vertical: "middle", horizontal: "left" };
  });

  // Body styling: wrap long text, align to top, light borders
  const border = { style: "thin" as const, color: { argb: "FFE3E6E2" } };
  ws.eachRow((row, n) => {
    if (n === 1) return;
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.alignment = { vertical: "top", wrapText: true };
      cell.border = { top: border, bottom: border, left: border, right: border };
    });
  });

  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columns.length } };

  const buffer = await wb.xlsx.writeBuffer();
  const filename = `complaints-${todayInPakistan()}.xlsx`;

  return new Response(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
