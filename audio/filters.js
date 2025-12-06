export const Filters = {
    // --- 1. VOLUM (RMS) ---
    calculateRMS: (buffer) => {
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
            sum += buffer[i] * buffer[i];
        }
        return Math.sqrt(sum / buffer.length);
    },

    // --- 2. SMOOTHING ASIMETRIC (PRO) ---
    // rise: cât de repede urcă valoarea (ex: 0.9 pentru atac rapid)
    // fall: cât de repede scade (ex: 0.1 pentru coadă lungă)
    // Dacă fall lipsește, se folosește rise pentru ambele (comportament clasic)
    smooth: (currentValue, targetValue, rise, fall) => {
        if (!isFinite(currentValue)) currentValue = 0;
        if (!isFinite(targetValue)) targetValue = 0;

        // Determinăm factorul bazat pe direcția schimbării
        const factor = (targetValue > currentValue) ? rise : (fall || rise);

        return currentValue + (targetValue - currentValue) * factor;
    },

    // --- 3. CONVERSIE NOTĂ ---
    getNote: (frequency) => {
        if (!frequency || frequency <= 0 || !isFinite(frequency)) {
            return { note: "-", octave: "", full: "-" };
        }
        const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        const pitchNum = 12 * (Math.log(frequency / 440) / Math.log(2));
        const midiNum = Math.round(pitchNum) + 69;
        
        const noteIndex = midiNum % 12;
        const octave = Math.floor(midiNum / 12) - 1;
        
        return {
            note: noteStrings[noteIndex] || "-",
            octave: octave,
            full: noteStrings[noteIndex] ? `${noteStrings[noteIndex]}${octave}` : "-"
        };
    },

    // --- 4. EXTRAGERE ENERGIE PE BENZI ---
    getEnergyInRange: (data, minHz, maxHz, sampleRate) => {
        const nyquist = sampleRate / 2;
        const binSize = nyquist / data.length;
        
        const start = Math.floor(minHz / binSize);
        const end = Math.floor(maxHz / binSize);
        
        let sum = 0;
        let count = 0;
        
        for (let i = start; i <= end && i < data.length; i++) {
            sum += data[i];
            count++;
        }
        
        // Normalizare 0-1
        return count > 0 ? (sum / count) / 255 : 0;
    },

    // --- 5. DETECȚIE PITCH (Robust) ---
    autoCorrelate: (buffer, sampleRate) => {
        const SIZE = buffer.length;
        const rms = Filters.calculateRMS(buffer);

        if (rms < 0.02) return -1;

        let r1 = 0, r2 = SIZE - 1;
        const thres = 0.2;
        for (let i = 0; i < SIZE / 2; i++) 
            if (Math.abs(buffer[i]) < thres) { r1 = i; } else break;
        for (let i = 1; i < SIZE / 2; i++) 
            if (Math.abs(buffer[SIZE - i]) < thres) { r2 = SIZE - i; } else break;

        const buffer2 = buffer.slice(r1, r2);
        const c = new Array(buffer2.length).fill(0);

        for (let i = 0; i < buffer2.length; i++) {
            for (let j = 0; j < buffer2.length - i; j++) {
                c[i] = c[i] + buffer2[j] * buffer2[j + i];
            }
        }

        let bestOffset = -1;
        let bestCorrelation = 0;
        
        // Ignorăm primele sample-uri pentru a evita eroarea 44100Hz
        for (let i = 12; i < buffer2.length; i++) {
            if (c[i] > bestCorrelation) {
                bestCorrelation = c[i];
                bestOffset = i;
            }
        }

        if (bestCorrelation < 0.01) return -1;

        let T0 = bestOffset;

        if (T0 > 0 && T0 < c.length - 1) {
            const x1 = c[T0 - 1];
            const x2 = c[T0];
            const x3 = c[T0 + 1];
            const a = (x1 + x3 - 2 * x2) / 2;
            const b = (x3 - x1) / 2;
            if (a !== 0) T0 = T0 - b / (2 * a);
        }

        const frequency = sampleRate / T0;
        if (!isFinite(frequency) || frequency <= 0) return -1;

        return frequency;
    }
};