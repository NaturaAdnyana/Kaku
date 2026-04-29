import { FlashcardTrainer } from "@/components/FlashcardTrainer";

export default function FlashcardPage() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-bg pb-24 font-sans">
      <main className="mx-auto w-full max-w-md p-4 sm:p-6 lg:max-w-lg">
        <FlashcardTrainer />
      </main>
    </div>
  );
}
