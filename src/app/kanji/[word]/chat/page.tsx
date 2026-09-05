import { redirect } from "next/navigation";

export default async function KanjiChatRedirect({
  params,
}: {
  params: Promise<{ word: string }>;
}) {
  const { word } = await params;
  redirect(`/chat?word=${encodeURIComponent(word)}`);
}
