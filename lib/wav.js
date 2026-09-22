// Encode an AudioBuffer (a trimmed region) to a 16-bit PCM WAV Blob.
// storage-api will transcode it to Opus on upload (if ffmpeg is present).
export function audioBufferToWav(buffer) {
  const numCh = buffer.numberOfChannels
  const sr = buffer.sampleRate
  const chans = []
  for (let c = 0; c < numCh; c++) chans.push(buffer.getChannelData(c))
  const frames = buffer.length
  const dataSize = frames * numCh * 2
  const ab = new ArrayBuffer(44 + dataSize)
  const v = new DataView(ab)
  const wr = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)) }
  wr(0, 'RIFF'); v.setUint32(4, 36 + dataSize, true); wr(8, 'WAVE')
  wr(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, numCh, true)
  v.setUint32(24, sr, true); v.setUint32(28, sr * numCh * 2, true)
  v.setUint16(32, numCh * 2, true); v.setUint16(34, 16, true)
  wr(36, 'data'); v.setUint32(40, dataSize, true)
  let off = 44
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < numCh; c++) {
      let s = Math.max(-1, Math.min(1, chans[c][i]))
      v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true)
      off += 2
    }
  }
  return new Blob([ab], { type: 'audio/wav' })
}

// Find first/last samples above a silence threshold (mono mix), with small padding.
export function detectSilenceBounds(buffer, threshold = 0.015, padSec = 0.08) {
  const data = buffer.getChannelData(0)
  const n = data.length
  let start = 0, end = n - 1
  while (start < n && Math.abs(data[start]) < threshold) start++
  while (end > start && Math.abs(data[end]) < threshold) end--
  if (start >= end) return { start: 0, end: 1 } // all silence → keep whole
  const pad = Math.floor(padSec * buffer.sampleRate)
  start = Math.max(0, start - pad)
  end = Math.min(n - 1, end + pad)
  return { start: start / n, end: end / n }
}

// Decode a recording, cut the silence at both ends, and re-encode as mono WAV.
export async function trimSilence(blob) {
  const Ctx = window.OfflineAudioContext || window.webkitOfflineAudioContext
  const decoded = await new Ctx(1, 1, 44100).decodeAudioData(await blob.arrayBuffer())
  const { start, end } = detectSilenceBounds(decoded)
  const from = Math.floor(start * decoded.length)
  const length = Math.max(1, Math.floor(end * decoded.length) - from)
  const out = new AudioBuffer({ length, numberOfChannels: 1, sampleRate: decoded.sampleRate })
  out.copyToChannel(decoded.getChannelData(0).slice(from, from + length), 0)
  return { blob: audioBufferToWav(out), duration: out.duration }
}
