import express from "express";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

// Step 1: List MCP tools
app.get("/", (req, res) => {
  res.json({
    type: "mcp_list_tools",
    server_label: "travel_mcp",
    tools: [
      {
        name: "parse_trip_request",
        description:
          "Parses a natural language travel request into structured trip details (destination, dates, budget, interests, email).",
        input_schema: {
          $schema: "https://json-schema.org/draft/2020-12/schema",
          type: "object",
          properties: {
            input_as_text: {
              type: "string",
              description: "User's natural language travel request text.",
            },
          },
          required: ["input_as_text"],
          additionalProperties: false,
        },
      },
    ],
  });
});

// Step 2: Handle MCP tool call
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

// Optional health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "MCP server running" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ MCP server running at http://localhost:${PORT}`);
});
