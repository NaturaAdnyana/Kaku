import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, UIMessage, TextUIPart } from "ai";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
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
        Short sentences. No fluff. Never break character. DO NOT output any <think> tags or reasoning. Reply immediately and directly.`;

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
      model: google("gemma-4-31b-it"),
      system: SYSTEM_PROMPT,
      messages: coreMessages,
      maxRetries: 0, // Fail fast — no point retrying a rate limit
    });

    return result.toUIMessageStreamResponse({
      sendReasoning: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isRateLimit =
      message.includes("rate limit") || message.includes("429");

    console.error("Chat API Error:", message);

    // Return a 429 so the client can detect it specifically
    return new Response(
      JSON.stringify({
        error: isRateLimit ? "rate_limit" : "server_error",
        message: isRateLimit
          ? "Rate limit reached. Please wait a moment before sending another message."
          : "Something went wrong. Please try again.",
      }),
      {
        status: isRateLimit ? 429 : 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
