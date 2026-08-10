import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { TOOLS, callTool } from "./tools";
import { buildSystemPrompt } from "@/lib/ares/system-prompt";

const MAX_TOOL_ITERATIONS = 8;

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Ares ist noch nicht konfiguriert (fehlender API-Key)." },
      { status: 503 }
    );
  }

  let body: { message?: unknown; history?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const { message, history } = body;

  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "Nachricht fehlt." }, { status: 400 });
  }

  // The caller (a voice session or the chat UI) resends the running
  // conversation on every turn so follow-up questions keep context — the
  // API itself is stateless, matching Claude's own multi-turn pattern.
  const messages: Anthropic.MessageParam[] = Array.isArray(history)
    ? [...(history as Anthropic.MessageParam[]), { role: "user", content: message.trim() }]
    : [{ role: "user", content: message.trim() }];

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const systemPrompt = buildSystemPrompt();

  try {
    let reply = "";

    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      const response = await anthropic.messages.create({
        model: "claude-opus-4-8",
        max_tokens: 2048,
        system: systemPrompt,
        tools: TOOLS,
        messages,
      });

      messages.push({ role: "assistant", content: response.content });

      const textBlock = response.content.find((block) => block.type === "text");
      if (textBlock && textBlock.type === "text") reply = textBlock.text;

      if (response.stop_reason !== "tool_use") break;

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type !== "tool_use") continue;
        try {
          const result = await callTool(block.name, block.input);
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify(result ?? null),
          });
        } catch (error) {
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: error instanceof Error ? error.message : "Unbekannter Fehler",
            is_error: true,
          });
        }
      }
      messages.push({ role: "user", content: toolResults });
    }

    return NextResponse.json({ reply, history: messages });
  } catch (error) {
    console.error("Ares API error:", error);
    return NextResponse.json({ error: "Ares konnte nicht antworten." }, { status: 502 });
  }
}
