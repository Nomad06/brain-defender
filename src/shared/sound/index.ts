/**
 * Sound System for Focusan
 * Japanese-inspired audio effects using Web Audio API
 * Generates sounds procedurally to avoid external dependencies
 */

export enum SoundType {
  TEMPLE_BELL = 'temple_bell',         // Session start
  SOFT_GONG = 'soft_gong',            // Session end
  BAMBOO_STRIKE = 'bamboo_strike',     // Site blocked
  KOTO_PLUCK = 'koto_pluck',          // Achievement unlocked
  WIND_CHIME = 'wind_chime',          // Notification
  MEDITATION_BELL = 'meditation_bell', // Breath exercise
}

class SoundManager {
  private audioContext: AudioContext | null = null
  private enabled: boolean = true
  private volume: number = 0.3

  /**
   * Initialize Audio Context (lazy initialization)
   */
  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext()
    }
    return this.audioContext
  }

  /**
   * Enable or disable sounds
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  /**
   * Set master volume (0.0 to 1.0)
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume))
  }

  /**
   * Play a sound by type
   */
  async play(type: SoundType): Promise<void> {
    if (!this.enabled) return

    try {
      const ctx = this.getAudioContext()

      // Resume context if suspended (browser autoplay policy)
      if (ctx.state === 'suspended') {
        await ctx.resume()
      }

      switch (type) {
        case SoundType.TEMPLE_BELL:
          this.playTempleBell(ctx)
          break
        case SoundType.SOFT_GONG:
          this.playSoftGong(ctx)
          break
        case SoundType.BAMBOO_STRIKE:
          this.playBambooStrike(ctx)
          break
        case SoundType.KOTO_PLUCK:
          this.playKotoPluck(ctx)
          break
        case SoundType.WIND_CHIME:
          this.playWindChime(ctx)
          break
        case SoundType.MEDITATION_BELL:
          this.playMeditationBell(ctx)
          break
      }
    } catch (error) {
      console.error('[SoundManager] Error playing sound:', error)
    }
  }

  /**
   * Temple Bell - Deep, resonant bell for session start
   */
  private playTempleBell(ctx: AudioContext): void {
    const now = ctx.currentTime
    const duration = 3.0

    // Create oscillators for harmonic richness
    const fundamentalFreq = 220 // A3
    const harmonics = [1, 2.4, 3.8, 5.2] // Bell-like harmonic ratios

    harmonics.forEach((ratio, index) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(fundamentalFreq * ratio, now)

      // Amplitude decreases for higher harmonics
      const amplitude = this.volume / (index + 1) * 0.4
      gain.gain.setValueAtTime(amplitude, now)

      // Exponential decay (bell characteristic)
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + duration)
    })

    // Add metallic shimmer with noise
    this.addMetallicShimmer(ctx, now, duration, 0.15)
  }

  /**
   * Soft Gong - Gentle gong for session end
   */
  private playSoftGong(ctx: AudioContext): void {
    const now = ctx.currentTime
    const duration = 2.5

    // Gong fundamental and harmonics
    const fundamentalFreq = 150 // Lower than bell
    const harmonics = [1, 1.5, 2.3, 3.1, 4.2]

    harmonics.forEach((ratio, index) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(fundamentalFreq * ratio, now)

      const amplitude = this.volume / (index + 1) * 0.3
      gain.gain.setValueAtTime(amplitude, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + duration)
    })

    this.addMetallicShimmer(ctx, now, duration, 0.1)
  }

  /**
   * Bamboo Strike - Quick, hollow strike for blocked sites
   */
  private playBambooStrike(ctx: AudioContext): void {
    const now = ctx.currentTime
    const duration = 0.15

    // Hollow bamboo sound (higher frequency, short decay)
    const frequencies = [800, 1200, 1600]

    frequencies.forEach((freq, index) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, now)

      const amplitude = this.volume * 0.3 / (index + 1)
      gain.gain.setValueAtTime(amplitude, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + duration)
    })

    // Add click/attack
    this.addPercussiveClick(ctx, now, 0.02)
  }

  /**
   * Koto Pluck - String pluck for achievements
   */
  private playKotoPluck(ctx: AudioContext): void {
    const now = ctx.currentTime
    const duration = 1.2

    // Koto-like plucked string (pentatonic scale note)
    const fundamentalFreq = 440 // A4
    const harmonics = [1, 2, 3, 4, 5, 6]

    harmonics.forEach((harmonic) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(fundamentalFreq * harmonic, now)

      // String pluck envelope: sharp attack, exponential decay
      const amplitude = this.volume * 0.25 / harmonic
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(amplitude, now + 0.005) // Sharp attack
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + duration)
    })
  }

  /**
   * Wind Chime - Gentle chime for notifications
   */
  private playWindChime(ctx: AudioContext): void {
    const now = ctx.currentTime

    // Multiple chimes with slight delay (like wind hitting them)
    const notes = [880, 1100, 1320, 1760] // Pentatonic-ish
    const delays = [0, 0.08, 0.15, 0.22]

    notes.forEach((freq, index) => {
      const startTime = now + delays[index]
      const duration = 1.5

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, startTime)

      const amplitude = this.volume * 0.2
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(amplitude, startTime + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(startTime)
      osc.stop(startTime + duration)
    })
  }

  /**
   * Meditation Bell - Three gentle bells for breathing
   */
  private playMeditationBell(ctx: AudioContext): void {
    const now = ctx.currentTime
    const noteGap = 0.3
    const duration = 1.0

    // Three gentle bell tones
    for (let i = 0; i < 3; i++) {
      const startTime = now + (i * noteGap)
      const freq = 660 // E5

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, startTime)

      const amplitude = this.volume * 0.15
      gain.gain.setValueAtTime(amplitude, startTime)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(startTime)
      osc.stop(startTime + duration)
    }
  }

  /**
   * Add metallic shimmer effect (for bells and gongs)
   */
  private addMetallicShimmer(ctx: AudioContext, startTime: number, duration: number, intensity: number): void {
    // High-frequency shimmer using filtered noise
    const bufferSize = ctx.sampleRate * duration
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    // Generate white noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * intensity
    }

    const noise = ctx.createBufferSource()
    noise.buffer = buffer

    // High-pass filter for shimmer
    const filter = ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.setValueAtTime(3000, startTime)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(this.volume * intensity, startTime)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    noise.start(startTime)
    noise.stop(startTime + duration)
  }

  /**
   * Add percussive click for bamboo strike
   */
  private addPercussiveClick(ctx: AudioContext, startTime: number, duration: number): void {
    const bufferSize = ctx.sampleRate * duration
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    // Generate short noise burst
    for (let i = 0; i < bufferSize; i++) {
      const envelope = 1 - (i / bufferSize)
      data[i] = (Math.random() * 2 - 1) * envelope
    }

    const noise = ctx.createBufferSource()
    noise.buffer = buffer

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(this.volume * 0.4, startTime)

    noise.connect(gain)
    gain.connect(ctx.destination)

    noise.start(startTime)
    noise.stop(startTime + duration)
  }

  /**
   * Clean up audio context
   */
  async destroy(): Promise<void> {
    if (this.audioContext) {
      await this.audioContext.close()
      this.audioContext = null
    }
  }
}

// Singleton instance
export const soundManager = new SoundManager()

// Helper function to play sounds
export async function playSound(type: SoundType): Promise<void> {
  await soundManager.play(type)
}

// Export for settings
export { SoundManager }

/**
 * Ambient Sound Types
 */
export enum AmbientSound {
  RAIN_ON_TEMPLE = 'rain_on_temple',
  BAMBOO_FOREST = 'bamboo_forest',
  WATER_STREAM = 'water_stream',
  NIGHT_CRICKETS = 'night_crickets',
}

/**
 * Ambient Sound Manager
 * Generates continuous ambient sounds for background atmosphere
 */
class AmbientSoundManager {
  private audioContext: AudioContext | null = null
  private activeNodes: Map<AmbientSound, { oscillators: OscillatorNode[]; gains: GainNode[] }> = new Map()
  private volume: number = 0.15

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext()
    }
    return this.audioContext
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume))
    // Update all active ambient sounds
    this.activeNodes.forEach(nodes => {
      nodes.gains.forEach(gain => {
        gain.gain.setValueAtTime(this.volume, this.audioContext!.currentTime)
      })
    })
  }

  /**
   * Start playing an ambient sound
   */
  async start(type: AmbientSound): Promise<void> {
    // Stop if already playing
    if (this.activeNodes.has(type)) {
      this.stop(type)
    }

    const ctx = this.getAudioContext()
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }

    switch (type) {
      case AmbientSound.RAIN_ON_TEMPLE:
        this.startRainSound(ctx)
        break
      case AmbientSound.BAMBOO_FOREST:
        this.startBambooSound(ctx)
        break
      case AmbientSound.WATER_STREAM:
        this.startWaterSound(ctx)
        break
      case AmbientSound.NIGHT_CRICKETS:
        this.startCricketsSound(ctx)
        break
    }
  }

  /**
   * Stop playing an ambient sound
   */
  stop(type: AmbientSound): void {
    const nodes = this.activeNodes.get(type)
    if (!nodes) return

    // Stop all oscillators
    nodes.oscillators.forEach(osc => {
      try {
        osc.stop()
        osc.disconnect()
      } catch (e) {
        // Already stopped
      }
    })

    // Disconnect gains
    nodes.gains.forEach(gain => gain.disconnect())

    this.activeNodes.delete(type)
  }

  /**
   * Stop all ambient sounds
   */
  stopAll(): void {
    Array.from(this.activeNodes.keys()).forEach(type => this.stop(type))
  }

  /**
   * Rain on temple roof - white noise with filtering
   */
  private startRainSound(ctx: AudioContext): void {
    const gains: GainNode[] = []

    // Create continuous noise buffer (10 seconds, looping)
    const bufferSize = ctx.sampleRate * 10
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate)

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1
      }
    }

    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    noise.loop = true

    // Low-pass filter for soft rain sound
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(800, ctx.currentTime)
    filter.Q.setValueAtTime(0.5, ctx.currentTime)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(this.volume * 0.3, ctx.currentTime)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    noise.start()

    gains.push(gain)
    // Store buffer source as oscillator (for cleanup)
    this.activeNodes.set(AmbientSound.RAIN_ON_TEMPLE, { oscillators: [noise as any], gains })
  }

  /**
   * Bamboo forest - wind-like oscillation
   */
  private startBambooSound(ctx: AudioContext): void {
    const oscillators: OscillatorNode[] = []
    const gains: GainNode[] = []

    // Create two LFO-modulated oscillators for wind effect
    for (let i = 0; i < 2; i++) {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(80 + i * 20, ctx.currentTime)

      // LFO for wind variation
      const lfo = ctx.createOscillator()
      lfo.frequency.setValueAtTime(0.1 + i * 0.05, ctx.currentTime)

      const lfoGain = ctx.createGain()
      lfoGain.gain.setValueAtTime(15, ctx.currentTime)

      lfo.connect(lfoGain)
      lfoGain.connect(osc.frequency)

      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(200, ctx.currentTime)

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(this.volume * 0.15, ctx.currentTime)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      lfo.start()

      oscillators.push(osc, lfo)
      gains.push(gain)
    }

    this.activeNodes.set(AmbientSound.BAMBOO_FOREST, { oscillators, gains })
  }

  /**
   * Water stream - flowing water sound
   */
  private startWaterSound(ctx: AudioContext): void {
    const oscillators: OscillatorNode[] = []
    const gains: GainNode[] = []

    // Continuous noise for water
    const bufferSize = ctx.sampleRate * 8
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate)

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5
      }
    }

    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    noise.loop = true

    // Band-pass filter for water-like sound
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(1200, ctx.currentTime)
    filter.Q.setValueAtTime(1, ctx.currentTime)

    // Slow LFO for variation
    const lfo = ctx.createOscillator()
    lfo.frequency.setValueAtTime(0.2, ctx.currentTime)

    const lfoGain = ctx.createGain()
    lfoGain.gain.setValueAtTime(200, ctx.currentTime)

    lfo.connect(lfoGain)
    lfoGain.connect(filter.frequency)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(this.volume * 0.25, ctx.currentTime)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    noise.start()
    lfo.start()

    oscillators.push(lfo)
    gains.push(gain)
    this.activeNodes.set(AmbientSound.WATER_STREAM, { oscillators: [noise as any, ...oscillators], gains })
  }

  /**
   * Night crickets - periodic chirping
   */
  private startCricketsSound(ctx: AudioContext): void {
    const oscillators: OscillatorNode[] = []
    const gains: GainNode[] = []

    // Create periodic cricket chirps
    const chirp = () => {
      if (!this.activeNodes.has(AmbientSound.NIGHT_CRICKETS)) return

      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(2000 + Math.random() * 500, ctx.currentTime)

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(this.volume * 0.1, ctx.currentTime + 0.01)
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(ctx.currentTime + 0.1)

      // Schedule next chirp
      const delay = 100 + Math.random() * 400
      setTimeout(chirp, delay)
    }

    // Start chirping
    chirp()

    this.activeNodes.set(AmbientSound.NIGHT_CRICKETS, { oscillators, gains })
  }

  async destroy(): Promise<void> {
    this.stopAll()
    if (this.audioContext) {
      await this.audioContext.close()
      this.audioContext = null
    }
  }
}

// Singleton instance
export const ambientSoundManager = new AmbientSoundManager()

// Helper functions
export async function startAmbient(type: AmbientSound): Promise<void> {
  await ambientSoundManager.start(type)
}

export function stopAmbient(type: AmbientSound): void {
  ambientSoundManager.stop(type)
}

export function stopAllAmbient(): void {
  ambientSoundManager.stopAll()
}
