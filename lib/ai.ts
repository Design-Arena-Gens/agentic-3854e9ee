import OpenAI from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function generateCaption(userText: string, imageDataUrl?: string): Promise<string> {
  if (OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: "system",
          content:
            "You write short, catchy, human-like social captions. 1-2 sentences. Avoid hashtags unless clearly helpful.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: `Context: ${userText || "(none)"}\nCreate the best caption for this photo.` },
            ...(imageDataUrl
              ? ([{ type: "image_url", image_url: { url: imageDataUrl } }] as const)
              : ([] as const)),
          ],
        },
      ];

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7,
        max_tokens: 120,
      });

      const caption = completion.choices[0]?.message?.content?.trim();
      if (caption) return caption;
    } catch (err) {
      // fall back
    }
  }

  // Fallback caption generator
  const base = userText || "A memorable moment captured perfectly.";
  const trimmed = base.trim();
  const withEmoji = `${trimmed}${trimmed.endsWith(".") ? "" : "."} ✨`;
  return withEmoji.slice(0, 220);
}
