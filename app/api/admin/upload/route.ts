import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { isAdmin } from "@/lib/auth";

const MAX_BYTES = 4 * 1024 * 1024; // photos are resized in the browser first, so this is generous

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Please log in again." }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No photo received." }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "That file isn't a photo." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Photo is over 4 MB. Try a smaller one." }, { status: 400 });

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const blob = await put(`products/photo.${ext}`, file, {
    access: "public",
    addRandomSuffix: true,
    contentType: file.type,
    cacheControlMaxAge: 60 * 60 * 24 * 365, // names are unique, so the file never changes
  });

  return NextResponse.json({ url: blob.url });
}
