// Increase body size limit to 25MB for plan + BOM file uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "25mb",
    },
  },
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: { message: "Method not allowed" } });

  const apiKey = process.env.ANTHROPIC_API_KEY || req.headers["x-api-key"];

  if (!apiKey) {
    return res.status(401).json({
      error: {
        message:
          "No API key found. Add ANTHROPIC_API_KEY to Vercel environment variables, or enter one via the 🔑 button.",
      },
    });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });

    // Read as text first — Anthropic sometimes returns plain-text errors
    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      // Non-JSON response (e.g. "Request Entity Too Large", gateway errors)
      return res.status(response.status).json({
        error: {
          message: `API error ${response.status}: ${text.slice(0, 300)}`,
        },
      });
    }

    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: { message: err.message } });
  }
}
