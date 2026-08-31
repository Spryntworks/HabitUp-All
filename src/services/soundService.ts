import { Platform } from 'react-native';
import { Audio } from 'expo-av';

/**
 * Sound Service powered by expo-av for native Android & iOS,
 * and Web Audio API for Web browsers.
 */
class SoundService {
  private isAudioModeConfigured = false;
  private audioCtx: any = null;

  private async ensureAudioMode(): Promise<void> {
    if (this.isAudioModeConfigured) return;
    try {
      if (Platform.OS !== 'web') {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      }
      this.isAudioModeConfigured = true;
    } catch {
      // ignore
    }
  }

  /**
   * Plays the rewarding completion harmonic chime
   */
  async playCompletionChime(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        this.playWebChime();
        return;
      }

      // Native Mobile (Android & iOS)
      await this.ensureAudioMode();

      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/chime.wav'),
        { shouldPlay: true, volume: 1.0 }
      );

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
        }
      });
    } catch (err) {
      if (Platform.OS === 'web') {
        this.playWebChime();
      }
    }
  }

  private playWebChime(): void {
    if (typeof window === 'undefined') return;
    try {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        if (!this.audioCtx || this.audioCtx.state === 'closed') {
          this.audioCtx = new AudioContextClass();
        }
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume().catch(() => {});
        }
        const ctx = this.audioCtx;
        const now = ctx.currentTime;
        const notes = [
          { freq: 587.33, start: 0, dur: 0.35, gain: 0.28 },   // D5
          { freq: 880.0, start: 0.08, dur: 0.4, gain: 0.34 },  // A5
          { freq: 1174.66, start: 0.16, dur: 0.5, gain: 0.42 }, // D6
        ];

        notes.forEach(({ freq, start, dur, gain: targetGain }) => {
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + start);

          // 2nd Harmonic for bright sparkle
          const overtone = ctx.createOscillator();
          const overtoneGain = ctx.createGain();
          overtone.type = 'sine';
          overtone.frequency.setValueAtTime(freq * 2, now + start);
          overtoneGain.gain.setValueAtTime(targetGain * 0.25, now + start);
          overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur * 0.6);

          gainNode.gain.setValueAtTime(0.0001, now + start);
          gainNode.gain.linearRampToValueAtTime(targetGain, now + start + 0.015);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

          osc.connect(gainNode);
          gainNode.connect(ctx.destination);
          overtone.connect(overtoneGain);
          overtoneGain.connect(ctx.destination);

          osc.start(now + start);
          osc.stop(now + start + dur);
          overtone.start(now + start);
          overtone.stop(now + start + dur);
        });
      }
    } catch {
      // ignore
    }
  }

  playClickSound(): void {
    if (Platform.OS === 'web') {
      try {
        const AudioContextClass =
          window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          if (!this.audioCtx || this.audioCtx.state === 'closed') {
            this.audioCtx = new AudioContextClass();
          }
          const ctx = this.audioCtx;
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, now);
          osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.04);
        }
      } catch {
        // ignore
      }
    }
  }
}

export const soundService = new SoundService();
