# CYBER_OVERLOAD - Audio-Reactive Visualization System

A retro-cyberpunk audio visualization engine with real-time harmonograph rendering, beat detection, and interactive visual modes.

## 🎨 Overview

This is an experimental audio-visual experience that transforms microphone input into mesmerizing geometric patterns. It combines harmonic mathematics, audio analysis, and retro CRT aesthetics to create a unique interactive environment.

### Key Features

- **4 Visual Modes**: DJ (Harmonic Swarm), ART (Cymatics), LAB (Lissajous), EQ (3-band spectrum)
- **Real-time Audio Analysis**: FFT-based frequency detection with beat recognition
- **Harmonograph Engine**: Mathematical curve generation driven by live audio
- **Interactive Mods**: Demo scenes, Konami codes, beat pads, audio recorder, challenges
- **Multi-theme Support**: Default, Neon, Amber, and Ice color palettes
- **CRT Effects**: Scanlines, wobble, noise, and distortion filters

## 🚀 Getting Started

### Installation

```bash
git clone https://github.com/lupuana/hackitall2025.git
cd hackitall2025
```

### Running

Serve the files via a local web server (required for microphone access):

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser and click **START** to initialize audio.

## 🎮 Controls

### Main Interface

| Control | Function |
|---------|----------|
| **START** | Initialize microphone and enable audio processing |
| **REC** | Start recording visualization (records for specified duration) |
| **HOLD** | Pause/resume recording |
| **DUMP** | Reset visualization and stop recording |
| **GAIN** | Adjust microphone sensitivity (0.5-4.0) |
| **DUR** | Set recording duration in seconds |

### Visual Modes

- **BARCODE** (DJ): Harmonic swarm with collision particles and pulse waves
- **HARMONIC** (ART): Elegant Cymatics-style spiral patterns
- **LAB**: Real-time Lissajous analyzer for audio frequency visualization
- **EQ**: 3-band equalizer with studio-style meters (Bass/Mid/Treble)

### Mods (MODS button)

| Mod | Action |
|-----|--------|
| **Demo Scene** | Auto-cycle through all modes (7 seconds) |
| **Easter Egg** | Enter Konami code: ↑↑↓↓←→←→BA for alt palette |
| **Arp Live** | Press A/S/D/F/G for melodic arpeggio notes |
| **Beat Pads** | Play bass/lead/percussion with keyboard (QWER/ASDFG/1-3) |
| **Recorder** | Record 15s microphone audio and download as .webm |
| **Challenge** | 45-second time challenge with objectives |
| **CRT Wobble** | Enable scanlines + bass-reactive screen distortion |

### Themes

Switch between visual palettes:
- **DEFAULT**: Classic cyberpunk neon
- **NEON**: Brighter blue/magenta accents
- **AMBER**: Warm orange retro terminal
- **ICE**: Cool cyan/blue minimalist

## 🏗️ Project Structure

```
hackitall2025/
├── index.html              # Main HTML interface
├── main.js                 # Core application logic & event handling
├── style.css               # Retro CRT styling & animations
├── audio/
│   ├── audioEngine.js      # WebAudio API wrapper & analysis
│   └── filters.js          # DSP utilities (RMS, FFT, pitch detection)
├── render/
│   ├── renderer.js         # Canvas rendering & mode selection
│   └── crtEffects.js       # Scanline & distortion effects
├── harmonograph/
│   ├── harmonograph.js     # Mathematical curve generation
│   ├── animator.js         # Harmonic agent physics
│   └── livePainter.js      # Real-time brush stroke control
└── ui/
    ├── state.js            # UI state management
    └── presets.js          # Visual preset configurations
```

## 🔊 Audio Processing

### Configuration

Audio analysis uses FFT-based processing with configurable bands:

```javascript
CONFIG = {
  fftSize: 2048,
  smoothingVol: 0.08,
  smoothingPitch: 0.15,
  bass: { min: 20Hz, max: 250Hz },
  mid: { min: 250Hz, max: 2000Hz },
  treble: { min: 2000Hz, max: 16kHz },
  beatThreshold: 1.05
}
```

### Audio Data Output

```javascript
{
  volume: 0-1,           // Overall amplitude (RMS)
  energy: 0-1,           // Sum of all frequencies
  variability: 0-1,      // Spectral change rate
  peak: 0-1,             // Highest frequency bin
  pitch: Hz,             // Detected fundamental frequency
  note: "C#",            // MIDI note name
  octave: 4,             // Octave number
  beat: boolean,         // Kick/bass detected
  bass: 0-1,             // 20-250Hz band energy
  mid: 0-1,              // 250-2kHz band energy
  treble: 0-1            // 2-16kHz band energy
}
```

## 🎨 Rendering Modes

### DJ Mode (Harmonic Swarm)

- **Agents**: 15 autonomous entities following harmonic orbits
- **Particles**: 26 collision-reactive swarm particles
- **Effects**: Bass-triggered impact pulses, glow, web connections
- **Interaction**: Audio drives orbit amplitude, frequency modulation

### ART Mode (Cymatics)

- **Pattern**: Spiral symmetry with time-driven rotation
- **Symmetry**: 3-8 arms based on detected pitch
- **Vibration**: Volume controls ripple amplitude; treble adds jitter
- **Duration**: Records patterns for 30-60 seconds with progress tracking

### LAB Mode (Lissajous)

- **Shape**: Real-time parametric curve (x=sin, y=sin)
- **Parameters**: Bass/Mid/Treble modulate X/Y frequencies
- **Visualization**: Glowing paths with collision dots
- **Purpose**: Audio frequency ratio analysis

### EQ Mode

- **Display**: 3 vertical bars for Bass/Mid/Treble
- **Dynamics**: Animated cap peak levels with decay
- **Grid**: Reference lines for level reading
- **Effects**: CRT scanlines and subtle glow

## 🔧 Technical Details

### Browser Requirements

- Modern WebAudio API support
- Canvas 2D context
- MediaDevices getUserMedia() (for microphone)
- ES6 modules

### Key Technologies

- **WebAudio API**: Real-time audio capture and FFT analysis
- **Canvas 2D**: High-performance geometric rendering
- **Mathematical**: Harmonograph equations, pitch detection via autocorrelation
- **CSS Grid**: Responsive HUD layout
- **Retro Aesthetics**: Pixel-perfect rendering with intentional aliasing

### Performance Optimization

- Adjustable particle count (15 agents, 26 particles)
- Performance mode toggle (reduces visual complexity)
- Frame-paced rendering with `requestAnimationFrame`
- Capped canvas resolution updates

## 🎵 Audio Features

### Pitch Detection

Uses autocorrelation algorithm to detect fundamental frequency from time-domain audio, then converts to MIDI note/octave.

### Beat Detection

Compares bass band energy against previous frame with configurable threshold:
- Triggers when: `current_bass > previous_bass × beatThreshold`
- Used for visual pulses and mod system feedback

### Frequency Binning

Energy extracted from 3 configurable frequency ranges with smooth decay/attack:
- Attack: Controls rise speed on audio peaks
- Decay: Controls fall speed between beats

## 🎨 Visual Customization

### Color Themes

Edit CSS variables in `:root` or use theme buttons:

```css
--metal-dark: #0a0a10
--indicator-red: #ff0040
--neon-cyan: #00ffff
--crt-green: #39ff14
```

### Preset Configurations

Modify `ui/presets.js` for custom visual styles:

```javascript
{
  color: '#00ff66',
  glow: 14,
  lineWidth: 1.5,
  scanlines: 0.12,
  noise: 0.04
}
```

## 🎮 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **S** | Save current frame as PNG (when recording complete) |
| **QWER** | Bass drum pads (if enabled) |
| **ASDFG** | Lead note pads (if enabled) |
| **1/2/3** | Percussion (kick/snare/hat if enabled) |
| **Arrow Keys** | Konami code input |

## 📊 Statistics & Monitoring

### Analysis Panel

Real-time metrics displayed when LAB analysis is enabled:

- **INTENSITATE**: Overall volume (0-100%)
- **BASS**: Low-frequency energy
- **MID**: Mid-range energy
- **TREBLE**: High-frequency energy
- **VAR**: Spectral variability (how quickly frequencies change)

## 🐛 Troubleshooting

### Microphone Not Working

- Ensure browser has microphone permissions
- Check if audio is playing (GAIN slider should show movement)
- Try refreshing the page

### Visuals Choppy

- Enable PERF mode to reduce particle count
- Lower canvas resolution by zooming out
- Close other resource-heavy tabs

### Audio Processing Issues

- Increase GAIN slider if input is too quiet
- Check that frequency bands don't overlap
- Verify microphone isn't muted

## 🎓 Learning Resources

### Audio Analysis Concepts

- FFT (Fast Fourier Transform): Converts time-domain audio to frequency spectrum
- Autocorrelation: Detects repeating patterns (used for pitch detection)
- RMS (Root Mean Square): Calculates overall loudness
- Harmonic Series: Mathematical basis for pitch relationships

### Harmonograph Mathematics

- Lissajous Curves: Parametric equations driven by sine waves
- Frequency Ratios: f1:f2 ratio determines curve complexity
- Phase Relationships: Offset between X/Y determines symmetry
- Damped Oscillation: `exp(-d*t)` creates spiral decay

Created for HackItAll 2025
