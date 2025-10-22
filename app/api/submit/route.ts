import { NextResponse } from "next/server";
import { generateThumbnail } from "@/lib/image";
import { generateCaption } from "@/lib/ai";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const email = String(form.get("email") || "").trim();
    const text = String(form.get("text") || "").trim();
    const imageFile = form.get("image");

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }
    if (!imageFile || typeof imageFile === "string") {
      return NextResponse.json({ error: "Missing image" }, { status: 400 });
    }

    const arrayBuffer = await (imageFile as File).arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    const { thumbnailBuffer, contentType } = await generateThumbnail(imageBuffer);
    const thumbnailBase64 = thumbnailBuffer.toString("base64");
    const thumbnailDataUrl = `data:${contentType};base64,${thumbnailBase64}`;

    const imageDataUrlForAI = `data:${(imageFile as File).type || "image/jpeg"};base64,${Buffer.from(imageBuffer).toString("base64")}`;

    const caption = await generateCaption(text, imageDataUrlForAI);

    const subject = "Your AI Caption and Thumbnail";
    const html = `
      <div style="font-family:system-ui,Segoe UI,Arial,sans-serif;color:#111">
        <h2 style="margin:0 0 12px">Your AI Caption</h2>
        <p style="margin:0 0 16px;white-space:pre-line">${escapeHtml(caption)}</p>
        <h3 style="margin:20px 0 8px">Thumbnail</h3>
        <img src="${thumbnailDataUrl}" alt="thumbnail" style="max-width:100%;border-radius:8px;border:1px solid #eee" />
      </div>`;

    const emailResult = await sendEmail({
      to: email,
      subject,
      html,
      attachments: [
        {
          filename: "thumbnail.jpg",
          content: thumbnailBuffer,
          contentType,
        },
      ],
    });

    return NextResponse.json({
      caption,
      thumbnailDataUrl,
      email,
      emailResult,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
