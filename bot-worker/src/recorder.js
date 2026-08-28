'use strict';

/**
 * Records the meeting's audio by capturing the PulseAudio sink monitor with
 * ffmpeg. start.sh sets a null sink named "vsink" as the default output, so
 * everything the browser plays lands on vsink.monitor — which is exactly the
 * mixed call audio we want. Output is mono Opus in an Ogg container (small,
 * and accepted by the backend's Gemini/Whisper transcription).
 */

const { spawn } = require('child_process');
const fs = require('fs');

const MONITOR = process.env.PULSE_MONITOR || 'vsink.monitor';

class Recorder {
  constructor(outPath) {
    this.outPath = outPath;
    this.proc = null;
    this.mime = 'audio/ogg';
  }

  start() {
    // -f pulse -i <monitor> : capture the sink monitor
    // -ac 1 -c:a libopus -b:a 32k : compact mono voice-grade audio
    const args = [
      '-y',
      '-f', 'pulse', '-i', MONITOR,
      '-ac', '1',
      '-c:a', 'libopus', '-b:a', '32k',
      this.outPath,
    ];
    this.proc = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] });
    this.proc.stderr.on('data', (d) => {
      const s = String(d);
      if (/error|Invalid|No such/i.test(s)) console.warn('[recorder] ffmpeg:', s.trim().split('\n').pop());
    });
    this.proc.on('exit', (code) => { if (code && code !== 255) console.warn('[recorder] ffmpeg exited', code); });
    console.log('[recorder] recording →', this.outPath, 'from', MONITOR);
  }

  /** Stop cleanly (ffmpeg flushes the Ogg on SIGINT) and resolve the file bytes. */
  async stop() {
    if (!this.proc) return null;
    await new Promise((resolve) => {
      this.proc.on('exit', resolve);
      try { this.proc.kill('SIGINT'); } catch (_) { resolve(); }
      // Hard stop if ffmpeg doesn't exit promptly.
      setTimeout(() => { try { this.proc.kill('SIGKILL'); } catch (_) {} resolve(); }, 8000);
    });
    this.proc = null;
    try {
      const buf = fs.readFileSync(this.outPath);
      return buf && buf.length ? buf : null;
    } catch (_) {
      return null;
    }
  }
}

module.exports = { Recorder };
