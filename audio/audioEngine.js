import { Filters } from './filters.js';

// --- CONFIGURATION HUB ---
const CONFIG = {
    fftSize: 2048,
    smoothingVol: 0.1,    
    smoothingPitch: 0.15, 
    
    // Setări Benzi EQ 
    // Attack mare (0.9) = Vizualuri rapide
    bass:   { min: 20,   max: 250,   attack: 0.9, decay: 0.1 },
    mid:    { min: 250,  max: 2000,  attack: 0.5, decay: 0.1 },
    treble: { min: 2000, max: 16000, attack: 0.3, decay: 0.1 },

    // SETĂRI BEAT
    beatThreshold: 1.15, // Era 1.3 - Am scăzut pragul ca să prindă beat-uri mai ușor
    minVolume: 0.15      // Era 0.35 - Am scăzut volumul minim necesar
};

export class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.timeData = null;
        this.freqData = null;
        this.running = false;
        
        this.sensitivity = 1.0; 

        this.audioData = {
            volume: 0,
            pitch: 0,
            note: "-",
            octave: "",
            beat: false,
            bass: 0,
            mid: 0,
            treble: 0
        };
    }

    setSensitivity(value) {
        this.sensitivity = parseFloat(value);
    }

    async init() {
        if (this.running) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = CONFIG.fftSize;
            this.analyser.smoothingTimeConstant = 0.8;

            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.microphone.connect(this.analyser);

            this.timeData = new Float32Array(this.analyser.fftSize);
            this.freqData = new Uint8Array(this.analyser.frequencyBinCount);

            this.running = true;
            this.loop();
            console.log("✅ AudioEngine: Beat Detection Fixed.");

        } catch (err) {
            console.error("❌ AudioEngine Error:", err);
            alert("Microphone Access Required!");
        }
    }

    loop() {
        if (!this.running) return;
        requestAnimationFrame(() => this.loop());

        const sampleRate = this.audioContext.sampleRate;
        this.analyser.getFloatTimeDomainData(this.timeData);
        this.analyser.getByteFrequencyData(this.freqData);

        // 1. INPUT GAIN
        const rawVol = Math.min(1, Filters.calculateRMS(this.timeData) * this.sensitivity);
        
        const rawBass = Math.min(1, Filters.getEnergyInRange(this.freqData, CONFIG.bass.min, CONFIG.bass.max, sampleRate) * this.sensitivity);
        const rawMid  = Math.min(1, Filters.getEnergyInRange(this.freqData, CONFIG.mid.min,  CONFIG.mid.max,  sampleRate) * this.sensitivity);
        const rawHigh = Math.min(1, Filters.getEnergyInRange(this.freqData, CONFIG.treble.min, CONFIG.treble.max, sampleRate) * this.sensitivity);

        // 2. BEAT DETECTION (MUTAT AICI - ÎNAINTE DE SMOOTHING)
        // Comparăm "Lovitura Acum" (rawBass) cu "Istoria Recenta" (this.audioData.bass)
        // Dacă facem asta DUPĂ smoothing, istoria devine egală cu lovitura și nu detectăm nimic.
        
        const isKick = (rawBass > CONFIG.minVolume) && (rawBass > this.audioData.bass * CONFIG.beatThreshold);
        this.audioData.beat = isKick;

        // 3. SMOOTHING (Actualizăm istoria)
        this.audioData.volume = Filters.smooth(this.audioData.volume, rawVol, CONFIG.smoothingVol);

        this.audioData.bass = Filters.smooth(this.audioData.bass, rawBass, CONFIG.bass.attack, CONFIG.bass.decay);
        this.audioData.mid  = Filters.smooth(this.audioData.mid,  rawMid,  CONFIG.mid.attack,  CONFIG.mid.decay);
        this.audioData.treble = Filters.smooth(this.audioData.treble, rawHigh, CONFIG.treble.attack, CONFIG.treble.decay);

        // 4. PITCH
        const rawPitch = Filters.autoCorrelate(this.timeData, sampleRate);
        if (rawPitch !== -1) {
            this.audioData.pitch = Filters.smooth(this.audioData.pitch, rawPitch, CONFIG.smoothingPitch);
            const n = Filters.getNote(this.audioData.pitch);
            this.audioData.note = n.note;
            this.audioData.octave = n.octave;
        }
    }

    getAudioData() {
        return this.audioData;
    }
}