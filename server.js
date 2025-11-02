import express from "express";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

// ✅ 1. MCP Discovery Endpoint
app.get("/", (req, res) => {
  res.json({
    tools: [
      {
        name: "parse_trip_request",
        description:
          "Parses a natural language travel request into structured trip details (destination, dates, budget, interests, email).",
        input_schema: {
          type: "object",
          properties: {
            input_as_text: {
              type: "string",
              description: "User's natural language travel request text.",
            },
          },
          required: ["input_as_text"],
        },
      },
    ],
  });
});

// ✅ 2. Tool Implementation
app.post("/parse_trip_request", async (req, res) => {
  const { input_as_text } = req.body;

  if (!input_as_text) {
    return res.status(400).json({ error: "Missing input_as_text field" });
  }

  // 🧠 Basic parsing logic (can be expanded with NLP later)
  const destination =
    input_as_text.match(/to\s+([A-Za-z\s]+)/)?.[1]?.trim() || "Unknown";
  const dateMatch = input_as_text.match(/from\s+([\w\s]+)\s+to\s+([\w\s]+)/);
  const budget =
    input_as_text.match(/budget\s+(\w+)/)?.[1] || "Not specified";
  const interests =
    input_as_text.match(/interests?\s+include\s+([A-Za-z,\s]+)/)?.[1]
      ?.split(",")
      .map((i) => i.trim()) || [];
  const email =
    input_as_text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/i)?.[0] ||
    "Not provided";

  const parsedResult = {
    destination,
    dates: dateMatch ? { from: dateMatch[1].trim(), to: dateMatch[2].trim() } : {},
    budget,
    interests,
    email,
    raw_input: input_as_text,
  };

  res.json(parsedResult);
});

// ✅ 3. Health Check (Optional for debugging)
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "MCP server running" });
});

// ✅ 4. Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ MCP server running at http://localhost:${PORT}`);
});
