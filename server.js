import express from "express";
import cors from "cors";
import fetch from "node-fetch"; // If using Node 18+, native fetch works — otherwise npm install node-fetch

const app = express();
app.use(express.json());
app.use(cors());

// Step 1: List MCP tools
app.get("/sse", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.write(
    `data: ${JSON.stringify({
      tools: [
        {
          name: "parse_trip_request",
          description:
            "Parses a natural language travel request into structured trip details (destination, dates, budget, interests, email).",
          input_schema: {
            $schema: "https://json-schema.org/draft/2020-12/schema",
            type: "object",
            properties: {
              input_as_text: { type: "string" },
            },
            required: ["input_as_text"],
            additionalProperties: false,
          },
        },
        {
          name: "send_to_zapier",
          description: "Sends parsed itinerary data to Zapier webhook for email delivery.",
          input_schema: {
            type: "object",
            properties: {
              to: { type: "string" },
              subject: { type: "string" },
              html_body: { type: "string" },
            },
            required: ["to", "subject", "html_body"],
            additionalProperties: false,
          },
        },
      ],
    })}\n\n`
  );
  res.end();
});

// Step 2: Handle parsing
app.post("/parse_trip_request", async (req, res) => {
  const { input_as_text } = req.body;

  if (!input_as_text) {
    return res.status(400).json({ error: "Missing input_as_text field" });
  }

  const destination =
    input_as_text.match(/to\s+([A-Za-z\s]+)/)?.[1]?.trim() || "Unknown";
  const dateMatch = input_as_text.match(/from\s+([\w\s]+)\s+to\s+([\w\s]+)/);
  const budget = input_as_text.match(/budget\s+(\w+)/)?.[1] || "Not specified";
  const interests =
    input_as_text
      .match(/interests?\s+include\s+([A-Za-z,\s]+)/)?.[1]
      ?.split(",")
      .map((i) => i.trim()) || [];
  const email =
    input_as_text.match(
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/i
    )?.[0] || "Not provided";

  const parsedResult = {
    destination,
    dates: dateMatch
      ? { from: dateMatch[1].trim(), to: dateMatch[2].trim() }
      : {},
    budget,
    interests,
    email,
    raw_input: input_as_text,
  };

  res.json(parsedResult);
});

// Step 3: Handle sending to Zapier
app.post("/send_to_zapier", async (req, res) => {
  const { to, subject, html_body } = req.body;

  if (!to || !subject || !html_body) {
    return res.status(400).json({ error: "Missing one or more required fields" });
  }

  const zapierWebhookUrl = "https://hooks.zapier.com/hooks/catch/XXXXXXX/YYYYYYY"; // 🔁 replace with your actual Zapier Webhook URL

  try {
    const response = await fetch(zapierWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, html_body }),
    });

    const zapierResponse = await response.text();
    res.json({ success: true, zapier_response: zapierResponse });
  } catch (err) {
    console.error("❌ Error sending to Zapier:", err);
    res.status(500).json({ error: "Failed to send data to Zapier" });
  }
});

// Optional health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "MCP server running" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ MCP server running at http://localhost:${PORT}`);
});
