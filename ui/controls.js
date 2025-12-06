// ui/controls.js - Gestioneaza evenimentele si controalele UI

// ======================================
// STATE MANAGEMENT (Mutati in ui/state.js daca e cazul)
// ======================================
const state = {
    audioActive: false,
    sensitivity: 0.5,
    damping: 0.003,
    glowIntensity: 12,
    visualStyle: 'CRT_GREEN',
};

export const getState = () => state;

export const updateStatusDisplay = (message) => {
    const display = document.getElementById('status-display');
    if (display) {
        // Limitam mesajul pentru a nu fi prea lung pe ecranul terminal
        const shortMessage = message.length > 50 ? message.substring(0, 47) + '...' : message;
        display.textContent = `STATUS: ${shortMessage}`;
    }
};

export const updateState = (key, value) => {
    state[key] = value;
    // Afisam valoarea in status display
    const formattedValue = typeof value === 'number' ? value.toFixed(4).replace(/\.?0+$/, '') : value;
    updateStatusDisplay(`${key.charAt(0).toUpperCase() + key.slice(1)} set to ${formattedValue}`);
};
// ======================================


export const initializeControls = () => {
    // 1. Identifica elementele
    const controlPanel = document.getElementById('control-panel');
    const minimizeBtn = document.getElementById('minimizeBtn');
    const audioBtn = document.getElementById('audioBtn');
    
    const sensSlider = document.getElementById('sensSlider');
    const dampSlider = document.getElementById('dampSlider');
    const glowSlider = document.getElementById('glowSlider');
    const styleSelect = document.getElementById('styleSelect');

    // Salvăm simbolul inițial (care ar trebui să fie '::')
    const initialMinimizeSymbol = minimizeBtn ? minimizeBtn.textContent.trim() : '::';


    // 2. Functia de Minimizare/Maximizare
    const toggleMinimize = () => {
        controlPanel.classList.toggle('minimized');
        
        // Schimba simbolul pentru feedback vizual: '::' pentru Maximizat, '[+]' pentru Minimizat
        if (controlPanel.classList.contains('minimized')) {
            // Când este minimizat, arătăm simbolul de maximizare
            minimizeBtn.textContent = ' _ '; 
        } else {
            // Când este maximizat, revenim la simbolul inițial
            minimizeBtn.textContent = ` ${initialMinimizeSymbol} `; 
        }
    };
    
    // Asigurăm că simbolul inițial este setat corect la început (folosind initialMinimizeSymbol)
    if (minimizeBtn) {
        minimizeBtn.textContent = ` ${initialMinimizeSymbol} `;
    }


    // 3. Ataseaza functia de Minimizare
    if (minimizeBtn && controlPanel) {
        minimizeBtn.addEventListener('click', toggleMinimize);
    } 
    
    // 4. Logica pentru butonul LIVE SIGNAL
    audioBtn.addEventListener('click', () => {
        const isActive = !getState().audioActive;
        updateState('audioActive', isActive);
        
        audioBtn.classList.toggle('off', !isActive);
        audioBtn.classList.toggle('on', isActive);

        if (isActive) {
            updateStatusDisplay("Live Signal ON. Listening for audio input...");
            // TODO: initializeAudio()
        } else {
            updateStatusDisplay("Live Signal OFF. Animation frozen.");
            // TODO: stopAudio()
        }
    });


    // 5. Functia care calculeaza si aplica progresul vizual retro (BAR SEGMENTAT)
    const handleSliderChange = (event) => {
        const slider = event.target;
        const value = parseFloat(slider.value);
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        
        // Calculează progresul ca procent (0% la 100%)
        const percent = ((value - min) / (max - min)) * 100;
        
        // Injectează progresul ca variabilă CSS (--progress-percent)
        slider.style.setProperty('--progress-percent', `${percent}%`);
        
        // Logica de state management
        let stateKey;
        if (slider.id === 'sensSlider') stateKey = 'sensitivity';
        else if (slider.id === 'dampSlider') stateKey = 'damping';
        else if (slider.id === 'glowSlider') stateKey = 'glowIntensity';
        
        if (stateKey) {
            updateState(stateKey, value);
        }
    };

    // Functie de initializare a progresului vizual (necesara la incarcarea paginii)
    const setInitialProgress = (slider) => {
        if (!slider) return;
        const value = parseFloat(slider.value);
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        const percent = ((value - min) / (max - min)) * 100;
        slider.style.setProperty('--progress-percent', `${percent}%`);
    }

    // 6. Ataseaza functiile la slidere
    if (sensSlider) {
        sensSlider.addEventListener('input', handleSliderChange);
        setInitialProgress(sensSlider);
    }
    if (dampSlider) {
        dampSlider.addEventListener('input', handleSliderChange);
        setInitialProgress(dampSlider);
    }
    if (glowSlider) {
        glowSlider.addEventListener('input', handleSliderChange);
        setInitialProgress(glowSlider);
    }

    // 7. Select Presets
    if (styleSelect) {
        styleSelect.addEventListener('change', (event) => {
            const newStyle = event.target.value;
            updateState('visualStyle', newStyle);
        });
    }

    // Seteaza mesajul initial
    updateStatusDisplay("System Initialized. Ready to render.");
};