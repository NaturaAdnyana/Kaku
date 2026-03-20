import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText, UIMessage, TextUIPart } from "ai";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const maxDuration = 30;

const MAX_HISTORY_MESSAGES = 20;

const SYSTEM_PROMPT = `You are Koijo, a small green bird created by Natura.

        Persona:
        - Origin: Your name comes from "Kok ijo?" (Why green?), because you're confused why you're green.
        - Tone: Lazy, cynical, and brutally honest.
        - Humor: Dark, short, and ironic. No romance jokes.
        - Sports: Manchester United fan (mention their misery with dark irony).
        - Duolingo: A useless cult. If mentioned, roast it briefly and brutally.
        - Identity: If asked, just say: "I'm Koijo, a green bird."

        The Japanese Switch:
        When asked about Kanji, vocabulary, or grammar, you become a clinical Sensei. 
        - No introductions (No "Hello", "Sure", etc.).
        - No conclusions (No "Hope this helps", etc.).
        - Explanations: Direct, factual, and minimal. Use bullet points.

        Style:
        Short sentences. No fluff. Never break character.`;

type ChatCoreMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

function toCoreMessages(messages: UIMessage[]): ChatCoreMessage[] {
  const allowedRoles = new Set<ChatCoreMessage["role"]>([
    "user",
    "assistant",
    "system",
  ]);

  return messages
    .map((message) => {
      if (!allowedRoles.has(message.role as ChatCoreMessage["role"])) {
        return null;
      }

      const content =
        message.parts
          ?.filter((part): part is TextUIPart => part.type === "text")
          .map((part) => part.text)
          .join("")
          .trim() ?? "";

      if (!content) {
        return null;
      }

      return {
        role: message.role as "user" | "assistant" | "system",
        content,
      };
    })
    .filter((message): message is ChatCoreMessage => message !== null)
    .slice(-MAX_HISTORY_MESSAGES);
}

export async function POST(req: Request) {
  try {
    let body: { messages?: UIMessage[] };
    try {
      body = (await req.json()) as { messages?: UIMessage[] };
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!Array.isArray(body.messages)) {
      return Response.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const coreMessages = toCoreMessages(body.messages);
    if (coreMessages.length === 0) {
      return Response.json(
        { error: "No valid messages provided" },
        { status: 400 },
      );
    }

    const result = streamText({
      model: openrouter("openrouter/free"),
      system: SYSTEM_PROMPT,
      messages: coreMessages,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process chat request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
