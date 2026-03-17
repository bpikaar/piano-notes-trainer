import { ALL_NOTES, CHORDS, PRACTICE_MODES, SONGS } from './constants.js';

export class GameState {
    constructor() {
        this.currentNote = null;
        this.score = 0;
        this.showNoteNames = false;
        this.showFingering = false;
        this.currentMode = null;
        this.includeAccidentals = false;
        this.isDualMode = false;
        this.isSongMode = false;
        /** @type {any[]} */
        this.filteredNotes = [];
        /** @type {any[]} */
        this.songNotes = [];
        this.songIndex = 0;
        this.correctSongIndexes = new Set();
        this.songPageSize = 8;

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
        this.isSongMode = !!(modeDef && modeDef.song);
        this.songNotes = [];
        this.songIndex = 0;
        this.correctSongIndexes.clear();

        if (this.isSongMode) {
            this.buildSong();
            this.filteredNotes = [...this.songNotes];
            return;
        }

        // Chord training mode uses a predefined set of chords instead of single notes
        if (modeDef && modeDef.chord) {
            this.filteredNotes = [...CHORDS];
            return;
        }

        this.filterNotes();
    }

    buildSong() {
        if (!this.currentMode) {
            this.songNotes = [];
            this.currentNote = null;
            return;
        }

        const songs = /** @type {any} */ (SONGS);
        /** @type {any[]} */
        const songDef = songs[this.currentMode] || [];
        this.songNotes = songDef
            .map((songNote) => {
                if (songNote.trebleMidi && songNote.bassMidi) {
                    const trebleNote = ALL_NOTES.find((n) => n.midi === songNote.trebleMidi && n.clef === 'treble');
                    const bassNote = ALL_NOTES.find((n) => n.midi === songNote.bassMidi && n.clef === 'bass');
                    if (!trebleNote || !bassNote) return null;

                    return {
                        dual: true,
                        trebleNote,
                        bassNote,
                        midi: [trebleNote.midi, bassNote.midi],
                        name: `${trebleNote.name} + ${bassNote.name}`
                    };
                }

                const note = ALL_NOTES.find((n) => n.midi === songNote.midi && n.clef === songNote.clef);
                return note || null;
            })
            .filter((n) => !!n);

        this.currentNote = this.songNotes[0] || null;
    }

    filterNotes() {
        if (!this.currentMode) return;
        // @ts-ignore
        const modeDef = PRACTICE_MODES[this.currentMode];
        if (!modeDef) return;
        if (modeDef.chord) {
            // Chord practice doesn't use the single-note filter
            return;
        }

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
        if (this.isSongMode) {
            this.currentNote = this.songNotes[this.songIndex] || null;
            this.noteStartTime = Date.now();
            return this.currentNote;
        }

        if (this.isDualMode) {
            const trebleNotes = this.filteredNotes.filter((n) => n.clef === 'treble');
            const bassNotes = this.filteredNotes.filter((n) => n.clef === 'bass');
            if (trebleNotes.length === 0 || bassNotes.length === 0) return null;

            const trebleNote = trebleNotes[Math.floor(Math.random() * trebleNotes.length)];
            const bassNote = bassNotes[Math.floor(Math.random() * bassNotes.length)];

            this.currentNote = {
                dual: true,
                trebleNote,
                bassNote,
                midi: [trebleNote.midi, bassNote.midi],
                name: `${trebleNote.name} + ${bassNote.name}`
            };
            this.noteStartTime = Date.now();
            // console.debug('generateNextNote (dual):', this.currentNote);
            return this.currentNote;
        }

        if (this.filteredNotes.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * this.filteredNotes.length);
        this.currentNote = this.filteredNotes[randomIndex];
        this.noteStartTime = Date.now();
        // console.debug('generateNextNote:', this.currentNote);
        return this.currentNote;
    }

    /**
        * @param {number | number[]} playedMidi
     */
    checkNote(playedMidi) {
        if (!this.currentNote) return { correct: false };

        const playedNotes = Array.isArray(playedMidi) ? playedMidi : [playedMidi];

        // Determine what the app expects (single note, chord, or dual note)
        const expected = [];
        if (this.currentNote) {
            if (Array.isArray(this.currentNote.midi)) {
                expected.push(...this.currentNote.midi);
            } else if (this.currentNote.dual) {
                expected.push(this.currentNote.trebleNote?.midi, this.currentNote.bassNote?.midi);
            } else {
                expected.push(this.currentNote.midi);
            }
        }

        // console.debug('checkNote: currentNote=', this.currentNote, 'expected=', expected, 'playedNotes=', playedNotes);

        if (this.isSongMode) {
            if (this.currentNote.dual) {
                const expectedTrebleMidi = this.currentNote.trebleNote?.midi;
                const expectedBassMidi = this.currentNote.bassNote?.midi;
                if (!playedNotes.includes(expectedTrebleMidi) || !playedNotes.includes(expectedBassMidi)) {
                    return { correct: false };
                }
            } else if (playedMidi !== this.currentNote.midi) {
                return { correct: false };
            }

            const responseTime = (Date.now() - this.noteStartTime) / 1000;
            this.totalResponseTime += responseTime;
            this.correctNotesCount++;
            this.score++;
            this.correctSongIndexes.add(this.songIndex);

            const avgTime = this.totalResponseTime / this.correctNotesCount;

            return {
                correct: true,
                score: this.score,
                avgTime: avgTime,
                responseTime: responseTime,
                songProgress: {
                    index: this.songIndex,
                    total: this.songNotes.length,
                    isComplete: this.songIndex >= this.songNotes.length - 1
                }
            };
        }

        if (this.isDualMode && !this.isSongMode && this.currentNote.dual) {
            const expectedTrebleMidi = this.currentNote.trebleNote?.midi;
            const expectedBassMidi = this.currentNote.bassNote?.midi;

            if (!playedNotes.includes(expectedTrebleMidi) || !playedNotes.includes(expectedBassMidi)) {
                return { correct: false };
            }

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

        // Chord mode: expect a set of notes instead of a single note
        if (Array.isArray(this.currentNote?.midi)) {
            const expectedMidi = Array.from(new Set(this.currentNote.midi));
            const playedSet = new Set(playedNotes);

            if (playedSet.size !== expectedMidi.length) {
                return { correct: false };
            }

            for (const midi of expectedMidi) {
                if (!playedSet.has(midi)) {
                    return { correct: false };
                }
            }

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

    advanceSong() {
        if (!this.isSongMode) return null;
        if (this.songIndex < this.songNotes.length - 1) {
            this.songIndex++;
            this.currentNote = this.songNotes[this.songIndex];
            this.noteStartTime = Date.now();
            return this.currentNote;
        }

        this.currentNote = null;
        return null;
    }

    getSongWindow(windowSize = 8) {
        if (!this.isSongMode || this.songNotes.length === 0) {
            return {
                notes: [],
                startIndex: 0,
                currentWindowIndex: 0,
                correctWindowIndexes: new Set()
            };
        }

        const pageSize = windowSize || this.songPageSize;
        const start = Math.floor(this.songIndex / pageSize) * pageSize;
        const end = Math.min(this.songNotes.length, start + pageSize);

        const notes = this.songNotes.slice(start, end);
        const correctWindowIndexes = new Set();

        this.correctSongIndexes.forEach((idx) => {
            if (idx >= start && idx < end) {
                correctWindowIndexes.add(idx - start);
            }
        });

        return {
            notes,
            startIndex: start,
            currentWindowIndex: this.songIndex - start,
            correctWindowIndexes
        };
    }

    getSongPageSize() {
        return this.songPageSize;
    }

    reset() {
        this.score = 0;
        this.totalResponseTime = 0;
        this.correctNotesCount = 0;
        this.songIndex = 0;
        this.correctSongIndexes.clear();

        if (this.isSongMode) {
            this.currentNote = this.songNotes[0] || null;
        }
    }
}
