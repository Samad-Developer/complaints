import { createClient } from "@/lib/supabase/server";
import { ATTACHMENTS_BUCKET } from "@/lib/constants";
import type { Attachment } from "@/lib/types";

/**
 * Stable link to a complaint attachment (used by the Excel export).
 * Lives outside /api so signed-out users are sent to the login page first;
 * redirects to a short-lived signed URL so the bucket stays private.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; index: string }> },
) {
  const { id, index } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("complaints")
    .select("attachments")
    .eq("id", Number(id))
    .maybeSingle();
  const attachment = (data?.attachments as Attachment[] | undefined)?.[Number(index)];
  if (error || !attachment) {
    return new Response("Attachment not found", { status: 404 });
  }

  const { data: signed } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .createSignedUrl(attachment.path, 60);
  if (!signed?.signedUrl) {
    return new Response("Attachment not available", { status: 404 });
  }

  return Response.redirect(signed.signedUrl, 302);
}
