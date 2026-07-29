type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext }

let audioContext: AudioContext | null = null

function context() {
  if (audioContext) return audioContext
  const AudioContextClass = window.AudioContext ?? (window as AudioWindow).webkitAudioContext
  if (!AudioContextClass) return null
  audioContext = new AudioContextClass()
  return audioContext
}

function tone(frequency: number, delay = 0, duration = 0.14, volume = 0.035) {
  const audio = context()
  if (!audio) return
  if (audio.state === 'suspended') void audio.resume()

  const start = audio.currentTime + delay
  const oscillator = audio.createOscillator()
  const gain = audio.createGain()
  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(frequency, start)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.018)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  oscillator.connect(gain)
  gain.connect(audio.destination)
  oscillator.start(start)
  oscillator.stop(start + duration + 0.02)
}

function touch(pattern: number | number[]) {
  if ('vibrate' in navigator) navigator.vibrate(pattern)
}

export function useGameAudio() {
  const select = () => {
    tone(440, 0, 0.07, 0.018)
    touch(10)
  }

  const swap = () => {
    tone(392, 0, 0.08, 0.022)
    tone(523, 0.07, 0.1, 0.024)
    touch(12)
  }

  const invalid = () => {
    tone(330, 0, 0.08, 0.018)
    tone(277, 0.07, 0.11, 0.016)
    touch([12, 35, 12])
  }

  const match = (chain: number, matchSize: number) => {
    const base = 523 + Math.min(chain - 1, 4) * 55
    const notes = matchSize >= 5 ? [1, 1.25, 1.5] : matchSize === 4 ? [1, 1.25] : [1]
    notes.forEach((ratio, index) => tone(base * ratio, index * 0.075, 0.18, 0.034))
    if (chain >= 2) tone(base * 2, notes.length * 0.07, 0.22, 0.028)
    touch(matchSize >= 5 ? [16, 30, 20] : 14)
  }

  const complete = () => {
    ;[523, 659, 784, 1047].forEach((frequency, index) => tone(frequency, index * 0.12, 0.3, 0.032))
    touch([18, 45, 24])
  }

  return { select, swap, invalid, match, complete }
}
