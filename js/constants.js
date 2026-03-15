export const ALL_NOTES = [
    // Treble Clef (C4 to C5)
    { key: 'c/4', midi: 60, name: 'C', finger: '1', clef: 'treble' },
    { key: 'c#/4', midi: 61, name: 'C#', finger: '2', clef: 'treble', accidental: '#' },
    { key: 'd/4', midi: 62, name: 'D', finger: '2', clef: 'treble' },
    { key: 'd#/4', midi: 63, name: 'D#', finger: '3', clef: 'treble', accidental: '#' },
    { key: 'e/4', midi: 64, name: 'E', finger: '3', clef: 'treble' },
    { key: 'f/4', midi: 65, name: 'F', finger: '1', clef: 'treble' },
    { key: 'f#/4', midi: 66, name: 'F#', finger: '2', clef: 'treble', accidental: '#' },
    { key: 'g/4', midi: 67, name: 'G', finger: '2', clef: 'treble' },
    { key: 'g#/4', midi: 68, name: 'G#', finger: '3', clef: 'treble', accidental: '#' },
    { key: 'a/4', midi: 69, name: 'A', finger: '3', clef: 'treble' },
    { key: 'a#/4', midi: 70, name: 'A#', finger: '4', clef: 'treble', accidental: '#' },
    { key: 'b/4', midi: 71, name: 'B', finger: '4', clef: 'treble' },
    { key: 'c/5', midi: 72, name: 'C', finger: '5', clef: 'treble' },
    
    // Bass Clef (C3 to C4)
    { key: 'c/3', midi: 48, name: 'C', finger: '5', clef: 'bass' },
    { key: 'c#/3', midi: 49, name: 'C#', finger: '4', clef: 'bass', accidental: '#' },
    { key: 'd/3', midi: 50, name: 'D', finger: '4', clef: 'bass' },
    { key: 'd#/3', midi: 51, name: 'D#', finger: '3', clef: 'bass', accidental: '#' },
    { key: 'e/3', midi: 52, name: 'E', finger: '3', clef: 'bass' },
    { key: 'f/3', midi: 53, name: 'F', finger: '2', clef: 'bass' },
    { key: 'f#/3', midi: 54, name: 'F#', finger: '2', clef: 'bass', accidental: '#' },
    { key: 'g/3', midi: 55, name: 'G', finger: '1', clef: 'bass' },
    { key: 'g#/3', midi: 56, name: 'G#', finger: '2', clef: 'bass', accidental: '#' },
    { key: 'a/3', midi: 57, name: 'A', finger: '2', clef: 'bass' },
    { key: 'a#/3', midi: 58, name: 'A#', finger: '1', clef: 'bass', accidental: '#' },
    { key: 'b/3', midi: 59, name: 'B', finger: '1', clef: 'bass' },
    { key: 'c/4', midi: 60, name: 'C', finger: '1', clef: 'bass' }
];

export const PRACTICE_MODES = {
    'rh-cg': { clef: 'treble', min: 60, max: 67 },
    'rh-cc': { clef: 'treble', min: 60, max: 72 },
    'lh-cg': { clef: 'bass', min: 48, max: 55 },
    'lh-cc': { clef: 'bass', min: 48, max: 60 },
    'both-cg': { dual: true, treble: { min: 60, max: 67 }, bass: { min: 48, max: 55 } },
    'both-cc': { dual: true, treble: { min: 60, max: 72 }, bass: { min: 48, max: 60 } }
};
