import ExcelJS from "exceljs";
import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";
import { exportComplaints } from "@/lib/data";
import { ATTACHMENTS_BUCKET, STATUS_LABELS, formatReference } from "@/lib/constants";
import { todayInPakistan } from "@/lib/format";
import type { Attachment } from "@/lib/types";

const BRAND = "FF124630";

// Thumbnail box as displayed in the sheet (px). Images are stored at 2x for sharpness.
const THUMB_W = 120;
const THUMB_H = 90;
const IMAGE_ROW_HEIGHT = 88; // points (~117px), fits THUMB_H plus an "Open full image" link
const DOWNLOAD_CONCURRENCY = 8;
const LINK_FONT = { color: { argb: "FF0563C1" }, underline: true };

type Supabase = Awaited<ReturnType<typeof createClient>>;
type Thumb = { buffer: Buffer; width: number; height: number; index: number };

async function thumbnail(
  supabase: Supabase,
  { a, index }: { a: Attachment; index: number },
): Promise<Thumb | null> {
  try {
    const { data, error } = await supabase.storage.from(ATTACHMENTS_BUCKET).download(a.path);
    if (error || !data) return null;
    const { data: buffer, info } = await sharp(Buffer.from(await data.arrayBuffer()))
      .rotate() // respect EXIF orientation from phone photos
      .resize(THUMB_W * 2, THUMB_H * 2, { fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 70 })
      .toBuffer({ resolveWithObject: true });
    const scale = Math.min(1, THUMB_W / info.width, THUMB_H / info.height);
    return {
      buffer,
      width: Math.round(info.width * scale),
      height: Math.round(info.height * scale),
      index,
    };
  } catch {
    return null; // a broken or missing file should not fail the whole export
  }
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>) {
  const out = new Array<R>(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }

  const url = new URL(request.url);
  const sp = url.searchParams;
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

  // Fetch and shrink every image attachment up front, a few at a time.
  // Keep each image's position in the attachments array for its /attachments link.
  const images = rows.map((c) =>
    c.attachments.map((a, index) => ({ a, index })).filter(({ a }) => a.type.startsWith("image/")),
  );
  const thumbs = await mapLimit(images.flat(), DOWNLOAD_CONCURRENCY, (img) => thumbnail(supabase, img));
  const thumbsByRow: Thumb[][] = [];
  let t = 0;
  for (const list of images) {
    thumbsByRow.push(list.map(() => thumbs[t++]).filter((x): x is Thumb => x !== null));
  }
  const imageCols = Math.max(0, ...thumbsByRow.map((r) => r.length));

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
    ...Array.from({ length: imageCols }, (_, i) => ({
      header: imageCols === 1 ? "Image" : `Image ${i + 1}`,
      key: `image${i}`,
      width: 18, // ~130px, a little wider than THUMB_W
    })),
    { header: "Registered At", key: "created", width: 20, style: { numFmt: "dd-mmm-yyyy hh:mm" } },
    { header: "Last Updated", key: "updated", width: 20, style: { numFmt: "dd-mmm-yyyy hh:mm" } },
  ];
  const firstImageCol = ws.getColumn("attachments").number + 1; // 1-based

  // Excel has no timezones: shift timestamps to Pakistan time (UTC+5).
  const pkt = (iso: string) => new Date(new Date(iso).getTime() + 5 * 60 * 60 * 1000);
  const dateOnly = (d: string | null) => {
    if (!d) return null;
    const [y, m, day] = d.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, day));
  };
  // Rough count of wrapped lines a text needs in a column of the given width.
  const wrappedLines = (text: string | null, width: number) =>
    (text ?? "").split("\n").reduce((n, l) => n + Math.max(1, Math.ceil(l.length / width)), 0);

  rows.forEach((c, i) => {
    const row = ws.addRow({
      ref: { text: formatReference(c.id), hyperlink: `${url.origin}/complaints/${c.id}` },
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
    row.getCell("ref").font = LINK_FONT;

    const rowThumbs = thumbsByRow[i];
    if (!rowThumbs.length) return;

    // A fixed height stops Excel auto-fitting, so leave room for wrapped text too.
    const lines = Math.max(
      wrappedLines(c.complaint, 60),
      wrappedLines(c.remarks, 36),
      wrappedLines(c.location, 28),
    );
    row.height = Math.max(IMAGE_ROW_HEIGHT, lines * 15);

    rowThumbs.forEach((thumb, k) => {
      const link = `${url.origin}/attachments/${c.id}/${thumb.index}`;
      const id = wb.addImage({ buffer: thumb.buffer as unknown as ExcelJS.Buffer, extension: "jpeg" });
      ws.addImage(id, {
        // Anchors are 0-based; the small offset pads the image inside its cell.
        tl: { col: firstImageCol - 1 + k + 0.05, row: row.number - 1 + 0.05 },
        ext: { width: thumb.width, height: thumb.height },
        editAs: "oneCell",
        hyperlinks: { hyperlink: link, tooltip: "Open full image" },
      });
      // Text link under the thumbnail, for viewers that ignore image hyperlinks.
      const cell = row.getCell(firstImageCol + k);
      cell.value = { text: "Open full image", hyperlink: link };
      cell.font = LINK_FONT;
    });
  });

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
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      // Image cells keep their link at the bottom, clear of the thumbnail.
      const isImage = col >= firstImageCol && col < firstImageCol + imageCols;
      cell.alignment = { vertical: isImage ? "bottom" : "top", wrapText: true };
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
