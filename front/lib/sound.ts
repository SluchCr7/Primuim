/**
 * Plays a premium real-time notification chime using the Web Audio API.
 * This does not require external audio files and complies with browser autoplay policies.
 */
export const playNotificationChime = () => {
  if (typeof window === "undefined") return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    // Tone 1: Warm introduction tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    gain1.gain.setValueAtTime(0, ctx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);

    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.16);

    // Tone 2: Bright chime (slightly delayed, higher pitch)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880.00, ctx.currentTime + 0.08); // A5
    gain2.gain.setValueAtTime(0, ctx.currentTime + 0.08);
    gain2.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc2.start(ctx.currentTime + 0.08);
    osc2.stop(ctx.currentTime + 0.45);
  } catch (error) {
    console.warn("[Sound] Web Audio API failed to play chime:", error);
  }
};
