import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const soundsDir = path.join(__dirname, '..', 'assets', 'sounds');
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

function createWavBuffer(sampleRate, durationSec, generateSample) {
  const numSamples = Math.floor(sampleRate * durationSec);
  const bytesPerSample = 2; // 16-bit
  const numChannels = 1; // mono
  const dataSize = numSamples * numChannels * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF identifier
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt sub-chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28); // ByteRate
  buffer.writeUInt16LE(numChannels * bytesPerSample, 32); // BlockAlign
  buffer.writeUInt16LE(bytesPerSample * 8, 34); // BitsPerSample

  // data sub-chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.max(-1, Math.min(1, generateSample(t, durationSec)));
    const intSample = Math.floor(sample * 32767);
    buffer.writeInt16LE(intSample, offset);
    offset += 2;
  }

  return buffer;
}

const sampleRate = 44100;
const duration = 0.55;

// Crystal 3-Tone Harmonic Bell Chime
const wavBuffer = createWavBuffer(sampleRate, duration, (t) => {
  let val = 0;

  // Note 1: D5 (587.33 Hz) starting at 0.0s
  if (t >= 0.0 && t <= 0.40) {
    const dt = t - 0.0;
    const env = Math.min(dt / 0.015, 1) * Math.exp(-dt * 9.0);
    const wave = Math.sin(2 * Math.PI * 587.33 * dt) + 0.25 * Math.sin(2 * Math.PI * 1174.66 * dt);
    val += wave * env * 0.35;
  }

  // Note 2: A5 (880.00 Hz) starting at 0.07s
  if (t >= 0.07 && t <= 0.48) {
    const dt = t - 0.07;
    const env = Math.min(dt / 0.015, 1) * Math.exp(-dt * 8.5);
    const wave = Math.sin(2 * Math.PI * 880.00 * dt) + 0.25 * Math.sin(2 * Math.PI * 1760.00 * dt);
    val += wave * env * 0.42;
  }

  // Note 3: D6 (1174.66 Hz) starting at 0.15s
  if (t >= 0.15 && t <= 0.55) {
    const dt = t - 0.15;
    const env = Math.min(dt / 0.015, 1) * Math.exp(-dt * 7.5);
    const wave = Math.sin(2 * Math.PI * 1174.66 * dt) + 0.3 * Math.sin(2 * Math.PI * 2349.32 * dt);
    val += wave * env * 0.50;
  }

  return val;
});

const outputPath = path.join(soundsDir, 'chime.wav');
fs.writeFileSync(outputPath, wavBuffer);
console.log(`Audio chime generated successfully at: ${outputPath} (${wavBuffer.length} bytes)`);
