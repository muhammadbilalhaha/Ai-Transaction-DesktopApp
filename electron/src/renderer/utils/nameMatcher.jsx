import { ocrService } from '../services/ocrService';

let knownSenders = [];
let knownReceivers = [];

// Load from localStorage
const loadKnownNames = () => {
    try {
        const senders = localStorage.getItem('knownSenders');
        const receivers = localStorage.getItem('knownReceivers');
        if (senders) knownSenders = JSON.parse(senders);
        if (receivers) knownReceivers = JSON.parse(receivers);
    } catch (e) {
        knownSenders = [];
        knownReceivers = [];
    }
};

// Save to localStorage AND sync with backend
const saveKnownNames = async () => {
    localStorage.setItem('knownSenders', JSON.stringify(knownSenders));
    localStorage.setItem('knownReceivers', JSON.stringify(knownReceivers));
    
    // Sync to backend Python server
    try {
        await ocrService.updateKnownNames({
            senders: knownSenders,
            receivers: knownReceivers,
        });
        console.log('Names synced to backend');
    } catch (e) {
        console.error('Failed to sync names to backend:', e);
    }
};

// Load names from backend on startup
const loadNamesFromBackend = async () => {
    try {
        const result = await ocrService.getKnownNames();
        if (result.success && result.names) {
            knownSenders = result.names.senders || [];
            knownReceivers = result.names.receivers || [];
            localStorage.setItem('knownSenders', JSON.stringify(knownSenders));
            localStorage.setItem('knownReceivers', JSON.stringify(knownReceivers));
            console.log(`Loaded from backend: ${knownSenders.length} senders, ${knownReceivers.length} receivers`);
        }
    } catch (e) {
        console.error('Failed to load names from backend, using localStorage');
        loadKnownNames();
    }
};

// Initialize
loadKnownNames();

const stringSimilarity = (str1, str2) => {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 1.0;
    if (s1.length === 0 || s2.length === 0) return 0;
    if (s1.includes(s2) || s2.includes(s1)) return 0.9;

    const matrix = [];
    for (let i = 0; i <= s1.length; i++) {
        matrix[i] = [i];
        for (let j = 1; j <= s2.length; j++) {
            if (i === 0) {
                matrix[i][j] = j;
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + (s1[i - 1] === s2[j - 1] ? 0 : 1)
                );
            }
        }
    }

    const distance = matrix[s1.length][s2.length];
    const maxLen = Math.max(s1.length, s2.length);
    return 1 - distance / maxLen;
};

const findBestMatch = (inputName, knownList, threshold = 0.75) => {
    if (!inputName || inputName.length < 3) return null;
    if (knownList.length === 0) return null;

    let bestMatch = null;
    let bestScore = 0;

    for (const known of knownList) {
        const score = stringSimilarity(inputName, known);
        if (score > bestScore && score >= threshold) {
            bestScore = score;
            bestMatch = known;
        }
    }

    return bestMatch ? { name: bestMatch, confidence: Math.round(bestScore * 100) } : null;
};

const addKnownSender = async (name) => {
    if (!name || name.length < 3) return;
    if (!knownSenders.includes(name)) {
        knownSenders.push(name);
        await saveKnownNames();
    }
};

const addKnownReceiver = async (name) => {
    if (!name || name.length < 3) return;
    if (!knownReceivers.includes(name)) {
        knownReceivers.push(name);
        await saveKnownNames();
    }
};

const getKnownSenders = () => [...knownSenders];
const getKnownReceivers = () => [...knownReceivers];

const removeKnownSender = async (name) => {
    knownSenders = knownSenders.filter((n) => n !== name);
    await saveKnownNames();
};

const removeKnownReceiver = async (name) => {
    knownReceivers = knownReceivers.filter((n) => n !== name);
    await saveKnownNames();
};

const autoCorrectName = (name, type = 'sender') => {
    const list = type === 'sender' ? knownSenders : knownReceivers;
    const match = findBestMatch(name, list, 0.7);
    return match ? match.name : name;
};

const findSuggestions = (name, type = 'sender') => {
    const list = type === 'sender' ? knownSenders : knownReceivers;
    const suggestions = [];

    for (const known of list) {
        const score = stringSimilarity(name, known);
        if (score >= 0.5) {
            suggestions.push({ name: known, confidence: Math.round(score * 100) });
        }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
};

export {
    findBestMatch,
    addKnownSender,
    addKnownReceiver,
    getKnownSenders,
    getKnownReceivers,
    removeKnownSender,
    removeKnownReceiver,
    autoCorrectName,
    findSuggestions,
    loadNamesFromBackend,
};