
export class ZenAudioEngine {
  private ctx: AudioContext | null = null;
  private oscillators: OscillatorNode[] = [];
  private gainNode: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private delayNode: DelayNode | null = null;
  private feedbackNode: GainNode | null = null;
  private isPlaying = false;

  private init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Main Gain
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(0, this.ctx.currentTime);

    // Filter for warmth
    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.setValueAtTime(800, this.ctx.currentTime);
    this.filterNode.Q.setValueAtTime(1, this.ctx.currentTime);

    // Simple Reverb/Space effect using delay
    this.delayNode = this.ctx.createDelay(1.0);
    this.delayNode.delayTime.setValueAtTime(0.6, this.ctx.currentTime);
    this.feedbackNode = this.ctx.createGain();
    this.feedbackNode.gain.setValueAtTime(0.4, this.ctx.currentTime);

    // Routing: Osc -> Filter -> Gain -> Destination
    //        & Gain -> Delay -> Feedback -> Delay -> Gain
    this.filterNode.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);
    
    this.gainNode.connect(this.delayNode);
    this.delayNode.connect(this.feedbackNode);
    this.feedbackNode.connect(this.delayNode);
    this.delayNode.connect(this.gainNode);
  }

  public start() {
    this.init();
    if (!this.ctx || !this.gainNode || !this.filterNode || this.isPlaying) return;

    const baseFreq = 136.1; // Ohm frequency
    const harmonics = [1, 1.5, 2, 0.5, 3]; // Richer harmonic series

    harmonics.forEach((h, i) => {
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      
      osc.type = i % 2 === 0 ? 'sine' : 'triangle'; // Mixed waveforms for texture
      osc.frequency.setValueAtTime(baseFreq * h, this.ctx!.currentTime);
      
      // LFO for frequency movement
      const lfo = this.ctx!.createOscillator();
      const lfoGain = this.ctx!.createGain();
      lfo.frequency.setValueAtTime(0.05 + i * 0.02, this.ctx!.currentTime);
      lfoGain.gain.setValueAtTime(1.5, this.ctx!.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();

      // LFO for amplitude movement (swells)
      const ampLfo = this.ctx!.createOscillator();
      const ampLfoGain = this.ctx!.createGain();
      ampLfo.frequency.setValueAtTime(0.03 + i * 0.01, this.ctx!.currentTime);
      ampLfoGain.gain.setValueAtTime(0.02, this.ctx!.currentTime);
      ampLfo.connect(ampLfoGain);
      ampLfoGain.connect(g.gain);
      ampLfo.start();

      g.gain.setValueAtTime(0.04 / harmonics.length, this.ctx!.currentTime);
      osc.connect(g);
      g.connect(this.filterNode!);
      osc.start();
      this.oscillators.push(osc);
    });

    // Slow filter modulation
    const filterLfo = this.ctx.createOscillator();
    const filterLfoGain = this.ctx.createGain();
    filterLfo.frequency.setValueAtTime(0.02, this.ctx.currentTime);
    filterLfoGain.gain.setValueAtTime(300, this.ctx.currentTime);
    filterLfo.connect(filterLfoGain);
    filterLfoGain.connect(this.filterNode.frequency);
    filterLfo.start();

    this.gainNode.gain.linearRampToValueAtTime(0.25, this.ctx.currentTime + 3);
    this.isPlaying = true;
  }

  public playSuccessTone() {
    if (!this.ctx || !this.gainNode || !this.isPlaying) return;
    
    // Create a "Zen Chime"
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    
    osc.type = 'sine';
    // Pentatonic scale-like high frequencies
    const frequencies = [880, 1046.50, 1318.51, 1567.98];
    const freq = frequencies[Math.floor(Math.random() * frequencies.length)];
    
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    g.gain.setValueAtTime(0, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.0);
    
    osc.connect(g);
    g.connect(this.gainNode);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 2.1);
  }

  public setMute(mute: boolean) {
    if (!this.gainNode || !this.ctx) return;
    const target = mute ? 0 : 0.25;
    this.gainNode.gain.exponentialRampToValueAtTime(target + 0.0001, this.ctx.currentTime + 0.8);
  }

  public stop() {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.5);
      setTimeout(() => {
        this.oscillators.forEach(o => o.stop());
        this.oscillators = [];
        this.isPlaying = false;
      }, 1500);
    }
  }
}

export const zenAudio = new ZenAudioEngine();
