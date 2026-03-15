import { ALL_NOTES, PRACTICE_MODES } from './constants.js';

export class GameState {
    constructor() {
        this.currentNote = null;
        this.score = 0;
        this.showNoteNames = false;
        this.showFingering = false;
        this.currentMode = null;
        this.includeAccidentals = false;
        this.isDualMode = false;
        this.filteredNotes = [];
        
        // Timing
        this.noteStartTime = 0;
        this.totalResponseTime = 0;
        this.correctNotesCount = 0;
    }

    /**
     * @param {string} mode
     * @param {boolean} includeAccidentals
     */
    setMode(mode, includeAccidentals = false) {
        this.currentMode = mode;
        this.includeAccidentals = includeAccidentals;
        // @ts-ignore
        const modeDef = PRACTICE_MODES[this.currentMode];
        this.isDualMode = !!(modeDef && modeDef.dual);
        this.filterNotes();
    }

    filterNotes() {
        if (!this.currentMode) return;
        const modeDef = PRACTICE_MODES[this.currentMode];
        if (!modeDef) return;

        this.filteredNotes = ALL_NOTES.filter(n => {
            const isAccidental = !!n.accidental;
            if (!this.includeAccidentals && isAccidental) return false;

            // @ts-ignore - Handle dual mode vs single range
            if (modeDef.dual) {
                // @ts-ignore
                const inTreble = n.clef === 'treble' && n.midi >= modeDef.treble.min && n.midi <= modeDef.treble.max;
                // @ts-ignore
                const inBass = n.clef === 'bass' && n.midi >= modeDef.bass.min && n.midi <= modeDef.bass.max;
                return inTreble || inBass;
            } else {
                // @ts-ignore
                return n.clef === modeDef.clef && n.midi >= modeDef.min && n.midi <= modeDef.max;
            }
        });
    }

    generateNextNote() {
        if (this.filteredNotes.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * this.filteredNotes.length);
        this.currentNote = this.filteredNotes[randomIndex];
        this.noteStartTime = Date.now();
        return this.currentNote;
    }

    /**
     * @param {number} playedMidi
     */
    checkNote(playedMidi) {
        if (!this.currentNote) return { correct: false };

        if (playedMidi === this.currentNote.midi) {
            const responseTime = (Date.now() - this.noteStartTime) / 1000;
            this.totalResponseTime += responseTime;
            this.correctNotesCount++;
            this.score++;
            
            const avgTime = this.totalResponseTime / this.correctNotesCount;
            return {
                correct: true,
                score: this.score,
                avgTime: avgTime,
                responseTime: responseTime
            };
        }
        return { correct: false };
    }

    reset() {
        this.score = 0;
        this.totalResponseTime = 0;
        this.correctNotesCount = 0;
    }
}
