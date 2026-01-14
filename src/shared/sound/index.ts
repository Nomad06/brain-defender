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
  private enabled: boolean = false // Disabled by user request
  private volume: number = 0.0

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
   * Temple Bell - Pure, warm bell
   */
  private playTempleBell(ctx: AudioContext): void {
    const now = ctx.currentTime
    const duration = 2.0

    // Pure harmonious overtones (Fundamental, Octave, Twelfth)
    // A3 (220Hz) based
    const freqs = [220, 440, 660]

    freqs.forEach((freq, index) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine' // Pure sine
      osc.frequency.setValueAtTime(freq, now)

      // Amplitude decreases for higher harmonics
      const amplitude = this.volume * (0.3 / (index + 1))
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(amplitude, now + 0.05) // Soft attack
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + duration)
    })
  }

  /**
   * Soft Gong - Deep, grounding tone
   */
  private playSoftGong(ctx: AudioContext): void {
    const now = ctx.currentTime
    const duration = 3.0

    // A low, warm fundamental
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(110, now) // A2 (Low)

    const amplitude = this.volume * 0.4
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(amplitude, now + 0.5) // Very slow attack
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + duration)
  }

  /**
   * Bamboo Strike - Simple, dry woodblock sound
   */
  private playBambooStrike(ctx: AudioContext): void {
    const now = ctx.currentTime
    const duration = 0.1

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, now)

    // Pitch envelope for "knock" sound
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.05)

    gain.gain.setValueAtTime(this.volume * 0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + duration)
  }

  /**
   * Koto Pluck - Gentle string
   */
  private playKotoPluck(ctx: AudioContext): void {
    const now = ctx.currentTime
    const duration = 1.0

    const fundamentalFreq = 440 // A4
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle' // Slightly brighter than sine, but warm
    osc.frequency.setValueAtTime(fundamentalFreq, now)

    // Pluck envelope
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(this.volume * 0.2, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

    // Lowpass filter to warm it up
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(3000, now)
    filter.frequency.exponentialRampToValueAtTime(500, now + 0.2) // Dampening string

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + duration)
  }

  /**
   * Wind Chime - Pure pentatonic tones
   */
  private playWindChime(ctx: AudioContext): void {
    const now = ctx.currentTime

    // Major Pentatonic (F, G, A, C, D) - very neutral and happy
    const notes = [698.46, 783.99, 880.00, 1046.50]
    const randomNote = notes[Math.floor(Math.random() * notes.length)]

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(randomNote, now)

    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(this.volume * 0.15, now + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 2.0)
  }

  /**
   * Meditation Bell - Single pure tone
   */
  private playMeditationBell(ctx: AudioContext): void {
    const now = ctx.currentTime
    const duration = 2.0

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(523.25, now) // C5

    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(this.volume * 0.2, now + 0.1)
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + duration)
  }

  // Helper methods for noise/shimmer removed entirely for cleaner sound

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
