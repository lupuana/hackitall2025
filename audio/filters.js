export const Filters = {
    calculateRMS: (buffer) => {
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
            sum += buffer[i] * buffer[i];
        }
        return Math.sqrt(sum / buffer.length);
    },
    smooth: (currentValue, targetValue, rise, fall) => {
        if (!isFinite(currentValue)) currentValue = 0;
        if (!isFinite(targetValue)) targetValue = 0;
        const factor = (targetValue > currentValue) ? rise : (fall || rise);
        return currentValue + (targetValue - currentValue) * factor;
    },
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
        return count > 0 ? (sum / count) / 255 : 0;
    },
    autoCorrelate: (buffer, sampleRate) => {
        const SIZE = buffer.length;
        const rms = Filters.calculateRMS(buffer);
        if (rms < 0.02) return -1;
        let r1 = 0, r2 = SIZE - 1, thres = 0.2;
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
        let d = 0; while (c[d] > c[d + 1]) d++;
        let maxval = -1, maxpos = -1;
        for (let i = d; i < buffer2.length; i++) {
            if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
        }
        let T0 = maxpos;
        const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
        const a = (x1 + x3 - 2 * x2) / 2;
        const b = (x3 - x1) / 2;
        if (a) T0 = T0 - b / (2 * a);
        return sampleRate / T0;
    },
    getNote: (frequency) => {
        const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        const pitchNum = 12 * (Math.log(frequency / 440) / Math.log(2));
        const midiNum = Math.round(pitchNum) + 69;
        return {
            note: noteStrings[midiNum % 12] || "-",
            octave: Math.floor(midiNum / 12) - 1
        };
    }
};