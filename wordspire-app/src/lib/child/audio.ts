export function speak(text: string, audioUrl?: string | null): void {
  if (typeof window === "undefined") return;

  if (audioUrl) {
    const audio = new Audio(audioUrl);
    void audio.play().catch(() => undefined);
    return;
  }

  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.86;
  utterance.pitch = 1.04;
  window.speechSynthesis.speak(utterance);
}
