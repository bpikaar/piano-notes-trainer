export const ALL_NOTES = [
    // Treble Clef (C4 to C5)
    { key: 'c/4', midi: 60, name: 'C', finger: '1', clef: 'treble' },
    { key: 'c#/4', midi: 61, name: 'C#', finger: '2', clef: 'treble', accidental: '#' },
    { key: 'd/4', midi: 62, name: 'D', finger: '2', clef: 'treble' },
    { key: 'd#/4', midi: 63, name: 'D#', finger: '3', clef: 'treble', accidental: '#' },
    { key: 'e/4', midi: 64, name: 'E', finger: '3', clef: 'treble' },
    { key: 'f/4', midi: 65, name: 'F', finger: '4', clef: 'treble' },
    { key: 'f#/4', midi: 66, name: 'F#', finger: '2', clef: 'treble', accidental: '#' },
    { key: 'g/4', midi: 67, name: 'G', finger: '5', clef: 'treble' },
    { key: 'g#/4', midi: 68, name: 'G#', finger: '3', clef: 'treble', accidental: '#' },
    { key: 'a/4', midi: 69, name: 'A', finger: '3', clef: 'treble' },
    { key: 'a#/4', midi: 70, name: 'A#', finger: '4', clef: 'treble', accidental: '#' },
    { key: 'b/4', midi: 71, name: 'B', finger: '4', clef: 'treble' },
    { key: 'c/5', midi: 72, name: 'C', finger: '5', clef: 'treble' },

    // Bass Clef (C3 to C4)
    { key: 'c/3', midi: 48, name: 'C', finger: '1', clef: 'bass' },
    { key: 'c#/3', midi: 49, name: 'C#', finger: '2', clef: 'bass', accidental: '#' },
    { key: 'd/3', midi: 50, name: 'D', finger: '2', clef: 'bass' },
    { key: 'd#/3', midi: 51, name: 'D#', finger: '3', clef: 'bass', accidental: '#' },
    { key: 'e/3', midi: 52, name: 'E', finger: '3', clef: 'bass' },
    { key: 'f/3', midi: 53, name: 'F', finger: '4', clef: 'bass' },
    { key: 'f#/3', midi: 54, name: 'F#', finger: '4', clef: 'bass', accidental: '#' },
    { key: 'g/3', midi: 55, name: 'G', finger: '5', clef: 'bass' },
    { key: 'g#/3', midi: 56, name: 'G#', finger: '2', clef: 'bass', accidental: '#' },
    { key: 'a/3', midi: 57, name: 'A', finger: '2', clef: 'bass' },
    { key: 'a#/3', midi: 58, name: 'A#', finger: '1', clef: 'bass', accidental: '#' },
    { key: 'b/3', midi: 59, name: 'B', finger: '1', clef: 'bass' },
    { key: 'c/4', midi: 60, name: 'C', finger: '1', clef: 'bass' }
];

export const CHORDS = [
    // Chords for training (root in treble clef)
    { name: 'C', clef: 'treble', keys: ['c/4', 'e/4', 'g/4'], midi: [60, 64, 67] },
    { name: 'D', clef: 'treble', keys: ['d/4', 'f/4', 'a/4'], midi: [62, 65, 69] },
    { name: 'D#', clef: 'treble', keys: ['d/4', 'f#/4', 'a/4'], midi: [62, 66, 69] },
    { name: 'F', clef: 'treble', keys: ['c/4', 'f/4', 'a/4'], midi: [60, 65, 69] },
    { name: 'G', clef: 'treble', keys: ['b/3', 'd/4', 'g/4'], midi: [59, 62, 67] },
    { name: 'Am', clef: 'treble', keys: ['c/4', 'e/4', 'a/4'], midi: [60, 64, 69] }
];

export const PRACTICE_MODES = {
    'rh-cg': { clef: 'treble', min: 60, max: 67 },
    'rh-cc': { clef: 'treble', min: 60, max: 72 },
    'lh-cg': { clef: 'bass', min: 48, max: 55 },
    'lh-cc': { clef: 'bass', min: 48, max: 60 },
    'both-cg': { dual: true, treble: { min: 60, max: 67 }, bass: { min: 48, max: 55 } },
    'both-cc': { dual: true, treble: { min: 60, max: 72 }, bass: { min: 48, max: 60 } },
    'chords': { chord: true },
    'song-single': { song: true, dual: false },
    'song-both': { song: true, dual: true }
};

export const SONGS = {
    'song-single': [
        { midi: 60, clef: 'treble' }, // C4
        { midi: 60, clef: 'treble' }, // C4
        { midi: 67, clef: 'treble' }, // G4
        { midi: 67, clef: 'treble' }, // G4
        { midi: 69, clef: 'treble' }, // A4
        { midi: 69, clef: 'treble' }, // A4
        { midi: 67, clef: 'treble' }, // G4
        { midi: 65, clef: 'treble' }, // F4
        { midi: 65, clef: 'treble' }, // F4
        { midi: 64, clef: 'treble' }, // E4
        { midi: 64, clef: 'treble' }, // E4
        { midi: 62, clef: 'treble' }, // D4
        { midi: 62, clef: 'treble' }, // D4
        { midi: 60, clef: 'treble' }  // C4
    ],
    'song-both': [
        { bassMidi: 48, trebleMidi: 60 }, // C3 + C4
        { bassMidi: 50, trebleMidi: 62 }, // D3 + D4
        { bassMidi: 52, trebleMidi: 64 }, // E3 + E4
        { bassMidi: 53, trebleMidi: 65 }, // F3 + F4
        { bassMidi: 55, trebleMidi: 67 }, // G3 + G4
        { bassMidi: 53, trebleMidi: 65 }, // F3 + F4
        { bassMidi: 52, trebleMidi: 64 }, // E3 + E4
        { bassMidi: 50, trebleMidi: 62 }, // D3 + D4
        { bassMidi: 48, trebleMidi: 60 }  // C3 + C4
    ]
};
