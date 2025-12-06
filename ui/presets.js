// ui/presets.js - Definiții pentru stilurile vizuale (preset-uri)

export const PRESETS = {
    // CRT_GREEN (Combinat)
    CRT_GREEN: {
        color: '#00FF66',
        lineWidth: 1.5,
        
        // Din a7e96c4 (Control Unit) - Damping
        damping: 0.003, 
        scanlineIntensity: 0.8,
        
        // Din HEAD - Render Effects
        glow: 14, 
        scanlines: 0.12,
        noise: 0.04
    },
    
    // NEON_BLUE (Doar din HEAD)
    NEON_BLUE: {
        color: '#00d4ff',
        lineWidth: 1.7,
        glow: 18,
        scanlines: 0.08,
        noise: 0.03,
        // Adăugăm proprietăți din a7e96c4 cu valori implicite rezonabile
        damping: 0.002,
        scanlineIntensity: 0.4
    },
    
    // VAPORWAVE (Combinat)
    VAPORWAVE: {
        color: '#ff66cc', // Păstrat din HEAD
        lineWidth: 1.8, // Păstrat din HEAD
        
        // Din a7e96c4
        damping: 0.001,
        scanlineIntensity: 0.2,
        
        // Din HEAD
        glow: 20,
        scanlines: 0.10,
        noise: 0.05
    },
    
    // ANALOG_RED (Doar din HEAD)
    ANALOG_RED: {
        color: "#ff3333",
        lineWidth: 2.0,
        damping: 0.004,
        scanlineIntensity: 0.9,
        glow: 15,
        scanlines: 0.15,
        noise: 0.06
    }
};