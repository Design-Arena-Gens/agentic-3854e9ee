"use client";

import { useState, useRef, FormEvent } from "react";

type SubmitResponse = {
  caption: string;
  thumbnailDataUrl: string;
  email: string;
  emailResult: {
    sent: boolean;
    provider: "smtp" | "resend" | "ethereal" | "none";
    info?: string;
    previewUrl?: string;
  };
};

export default function Page() {
  const [caption, setCaption] = useState<string>("");
  const [thumbnailDataUrl, setThumbnailDataUrl] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [userText, setUserText] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    setCaption("");
    setThumbnailDataUrl("");

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setSubmitting(false);
      setMessage("Please select an image.");
      return;
    }

    try {
      const form = new FormData();
      form.set("email", email);
      form.set("text", userText);
      form.set("image", file);

      const res = await fetch("/api/submit", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Request failed: ${res.status}`);
      }

      const data: SubmitResponse = await res.json();
      setCaption(data.caption);
      setThumbnailDataUrl(data.thumbnailDataUrl);
      setMessage(
        data.emailResult.sent
          ? `Email sent via ${data.emailResult.provider}.`
          : `Processed, but email not sent.`
      );
      if (data.emailResult.previewUrl) {
        setMessage((m) => `${m} Preview: ${data.emailResult.previewUrl}`);
      }
    } catch (err: any) {
      setMessage(err?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0b1220",
      color: "#e5e7eb",
      padding: 24,
    }}>
      <div style={{
        width: "100%",
        maxWidth: 720,
        background: "#111827",
        border: "1px solid #1f2937",
        borderRadius: 12,
        padding: 24,
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
      }}>
        <h1 style={{ fontSize: 24, marginBottom: 16 }}>AI Captioner & Emailer</h1>
        <p style={{ opacity: 0.8, marginBottom: 20 }}>
          Upload an image and add optional context. We will create a smart caption, generate a thumbnail, and email both to your inbox.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Email to send result</span>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #374151",
                background: "#0f172a",
                color: "#e5e7eb",
              }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Context text (optional)</span>
            <textarea
              placeholder="What's this photo about? Any vibe to capture?"
              value={userText}
              onChange={(e) => setUserText(e.target.value)}
              rows={4}
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #374151",
                background: "#0f172a",
                color: "#e5e7eb",
                resize: "vertical",
              }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Photo</span>
            <input
              type="file"
              accept="image/*"
              required
              ref={fileInputRef}
              style={{
                padding: 8,
                borderRadius: 8,
                border: "1px solid #374151",
                background: "#0f172a",
                color: "#e5e7eb",
              }}
            />
          </label>

          <button
            disabled={submitting}
            style={{
              marginTop: 6,
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #10b981",
              background: submitting ? "#064e3b" : "#059669",
              color: "white",
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Processing..." : "Generate & Email"}
          </button>
        </form>

        {message && (
          <p style={{ marginTop: 14, fontSize: 14, opacity: 0.9 }}>{message}</p>
        )}

        {caption && (
          <div style={{ marginTop: 20 }}>
            <h2 style={{ fontSize: 18, marginBottom: 10 }}>Caption</h2>
            <p style={{ background: "#0f172a", padding: 12, borderRadius: 8 }}>{caption}</p>
          </div>
        )}

        {thumbnailDataUrl && (
          <div style={{ marginTop: 20 }}>
            <h2 style={{ fontSize: 18, marginBottom: 10 }}>Thumbnail</h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumbnailDataUrl} alt="thumbnail" style={{ maxWidth: "100%", borderRadius: 8, border: "1px solid #374151" }} />
          </div>
        )}
      </div>
    </main>
  );
}
