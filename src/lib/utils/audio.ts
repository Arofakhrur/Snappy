/**
 * Audio Synthesizer for Photobooth Tactile Feedback
 *
 * Uses Web Audio API to synthesize a crisp, mechanical ratcheting
 * tactile sound ("grek-grek-grek") when sliding through cards.
 * Zero external audio files required, 100% offline, zero latency.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
	if (typeof window === 'undefined') return null;
	try {
		const AudioContextClass =
			window.AudioContext ||
			(window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
		if (!AudioContextClass) return null;
		if (!audioCtx) {
			audioCtx = new AudioContextClass();
		}
		if (audioCtx.state === 'suspended') {
			audioCtx.resume();
		}
		return audioCtx;
	} catch (e: unknown) {
		return null;
	}
}

/**
 * Play the tactile "grek-grek-grek" mechanical card ratcheting sound.
 */
export function playGrekSound(enabled = true): void {
	if (!enabled) return;

	try {
		const ctx = getAudioContext();
		if (!ctx) return;

		const t = ctx.currentTime;
		// 3 rapid mechanical micro-clicks (grek-grek-grek)
		const clicks = [0, 0.011, 0.011];

		clicks.forEach((delay, i) => {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			const filter = ctx.createBiquadFilter();

			// Bandpass mechanical click resonance
			filter.type = 'bandpass';
			filter.frequency.setValueAtTime(2600 - i * 400, t + delay);
			filter.Q.setValueAtTime(4.0, t + delay);

			// Rapid tactile pitch sweep
			osc.type = 'triangle';
			osc.frequency.setValueAtTime(480 - i * 80, t + delay);
			osc.frequency.exponentialRampToValueAtTime(75, t + delay + 0.016);

			gain.gain.setValueAtTime(0.18, t + delay);
			gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.017);

			osc.connect(filter);
			filter.connect(gain);
			gain.connect(ctx.destination);

			osc.start(t + delay);
			osc.stop(t + delay + 0.019);
		});

		// Mobile tactile haptic vibration (Android/Chrome supported devices)
		if ('vibrate' in navigator) {
			navigator.vibrate([10, 15, 10]);
		}
	} catch (err: unknown) {
		// Autoplay or audio context permission failure handled gracefully
	}
}
