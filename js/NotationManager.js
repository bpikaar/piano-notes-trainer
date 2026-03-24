export class NotationManager {
    /** @param {string} elementId */
    constructor(elementId) {
        this.elementId = elementId;
        // @ts-ignore
        this.vf = window.Vex.Flow;
        this.noteStateColors = {
            playing: '#1d4ed8',
            correct: '#16a34a',
            error: '#dc2626'
        };
    }

    /**
    * @param {any} currentNote
    * @param {{ showNoteNames: boolean; showFingering: boolean; isDualMode?: boolean; visualState?: string; incorrectDisplay?: any; showCorrectNoteName?: boolean; }} settings
     */
    renderNote(currentNote, settings = { showNoteNames: false, showFingering: false, isDualMode: false }) {
        const div = document.getElementById(this.elementId);
        if (!div || !currentNote) return;

        div.innerHTML = ""; // Clear previous

        const renderer = new this.vf.Renderer(div, this.vf.Renderer.Backends.SVG);
        const isDual = settings.isDualMode;
        const isDualPair = !!(isDual && currentNote.trebleNote && currentNote.bassNote);

        if (isDual) {
            renderer.resize(250, 250);
        } else {
            renderer.resize(200, 180);
        }

        const context = renderer.getContext();

        let trebleStave, bassStave;
        let activeStave;

        if (isDual) {
            // Render Grand Staff (both hands)
            trebleStave = new this.vf.Stave(40, 20, 180);
            trebleStave.addClef('treble').setContext(context).draw();

            bassStave = new this.vf.Stave(40, 120, 180);
            bassStave.addClef('bass').setContext(context).draw();

            // Connect them with a bracket and brace
            const brace = new this.vf.StaveConnector(trebleStave, bassStave);
            brace.setType(this.vf.StaveConnector.type.BRACE);
            brace.setContext(context).draw();

            const leftLine = new this.vf.StaveConnector(trebleStave, bassStave);
            leftLine.setType(this.vf.StaveConnector.type.SINGLE_LEFT);
            leftLine.setContext(context).draw();

            if (isDualPair) {
                const noteState = settings.incorrectDisplay ? 'idle' : (settings.visualState || 'idle');
                const trebleStaveNote = this.createStaveNote(
                    this.buildOverlayNote(currentNote.trebleNote, settings.incorrectDisplay?.wrongTrebleNote),
                    settings,
                    0,
                    0,
                    new Set(),
                    currentNote.duration,
                    noteState
                );
                const bassStaveNote = this.createStaveNote(
                    this.buildOverlayNote(currentNote.bassNote, settings.incorrectDisplay?.wrongBassNote),
                    settings,
                    0,
                    0,
                    new Set(),
                    currentNote.duration,
                    noteState
                );

                const trebleVoice = new this.vf.Voice({ num_beats: 1, beat_value: 4 });
                trebleVoice.addTickables([trebleStaveNote]);
                new this.vf.Formatter().joinVoices([trebleVoice]).format([trebleVoice], 100);
                trebleVoice.draw(context, trebleStave);

                const bassVoice = new this.vf.Voice({ num_beats: 1, beat_value: 4 });
                bassVoice.addTickables([bassStaveNote]);
                new this.vf.Formatter().joinVoices([bassVoice]).format([bassVoice], 100);
                bassVoice.draw(context, bassStave);
                return;
            }

            activeStave = currentNote.clef === 'treble' ? trebleStave : bassStave;
        } else {
            // Render Single Staff (normal mode)
            // Move the staff slightly higher so low ledger lines (like low C) are visible.
            activeStave = new this.vf.Stave(10, 30, 180);
            activeStave.addClef(currentNote.clef);
            activeStave.setContext(context).draw();
        }

        const displayNote = this.buildOverlayNote(currentNote, settings.incorrectDisplay?.wrongNote);
        const noteState = settings.incorrectDisplay ? 'idle' : (settings.visualState || 'idle');
        const staveNote = this.createStaveNote(displayNote, settings, 0, 0, new Set(), currentNote.duration, noteState);

        const voice = new this.vf.Voice({ num_beats: 1, beat_value: 4 });
        voice.addTickables([staveNote]);

        new this.vf.Formatter().joinVoices([voice]).format([voice], 100);
        voice.draw(context, activeStave);
    }

    /**
     * @param {any[]} notes
    * @param {{ showNoteNames: boolean; showFingering: boolean; isDualMode?: boolean; activeIndexes?: Set<number>; incorrectDisplays?: Map<number, any>; successLabelIndexes?: Set<number>; }} settings
     * @param {number} currentIndex
     * @param {Set<number>} correctIndexes
     */
    renderSong(notes, settings = { showNoteNames: false, showFingering: false, isDualMode: false }, currentIndex = 0, correctIndexes = new Set()) {
        const div = document.getElementById(this.elementId);
        if (!div || !notes || notes.length === 0) return;

        div.innerHTML = "";

        const renderer = new this.vf.Renderer(div, this.vf.Renderer.Backends.SVG);
        const isDual = !!settings.isDualMode;
        const activeIndexes = settings.activeIndexes || new Set();
        const incorrectDisplays = settings.incorrectDisplays || new Map();
        const successLabelIndexes = settings.successLabelIndexes || new Set();

        const rows = this.groupSongNotesIntoRows(notes, 2);
        const rowCount = Math.max(1, rows.length);
        const dualRowSpacing = 180;

        // Stack multiple staffs vertically so the full song can be seen at once.
        const noteSpacingWidth = 330;
        let svgHeight;

        if (isDual) {
            const lineHeight = dualRowSpacing;
            const baseHeight = 160; // top margin + bass stave bottom
            const bottomPadding = 90;
            svgHeight = baseHeight + (rowCount - 1) * lineHeight + bottomPadding;
        } else {
            const lineHeight = 90;
            const baseHeight = 70; // top margin + stave height
            const bottomPadding = 110;
            svgHeight = baseHeight + (rowCount - 1) * lineHeight + bottomPadding;
        }

        renderer.resize(420, svgHeight);
        const context = renderer.getContext();

        for (let line = 0; line < rowCount; line++) {
            const row = rows[line];
            const start = row.startIndex;
            const lineNotes = row.notes;
            const lineBeats = this.getTotalBeats(lineNotes);

            if (isDual) {
                const yOffset = line * dualRowSpacing;

                const trebleStave = new this.vf.Stave(40, 20 + yOffset, noteSpacingWidth);
                trebleStave.addClef('treble').setContext(context).draw();

                const bassStave = new this.vf.Stave(40, 120 + yOffset, noteSpacingWidth);
                bassStave.addClef('bass').setContext(context).draw();

                const brace = new this.vf.StaveConnector(trebleStave, bassStave);
                brace.setType(this.vf.StaveConnector.type.BRACE);
                brace.setContext(context).draw();

                const leftLine = new this.vf.StaveConnector(trebleStave, bassStave);
                leftLine.setType(this.vf.StaveConnector.type.SINGLE_LEFT);
                leftLine.setContext(context).draw();

                /** @type {any[]} */
                const trebleNotes = [];
                /** @type {any[]} */
                const bassNotes = [];

                lineNotes.forEach((note, idx) => {
                    const globalIdx = start + idx;
                    const incorrectDisplay = incorrectDisplays.get(globalIdx);
                    const showCorrectNoteName = successLabelIndexes.has(globalIdx);
                    if (note.dual && note.trebleNote && note.bassNote) {
                        const noteState = incorrectDisplay ? 'idle' : this.getVisualState(globalIdx, currentIndex, correctIndexes, activeIndexes, new Set());

                        trebleNotes.push(this.createStaveNote(
                            this.buildOverlayNote(note.trebleNote, incorrectDisplay?.wrongTrebleNote),
                            { ...settings, showCorrectNoteName },
                            globalIdx,
                            currentIndex,
                            correctIndexes,
                            note.duration,
                            noteState
                        ));
                        bassNotes.push(this.createStaveNote(
                            this.buildOverlayNote(note.bassNote, incorrectDisplay?.wrongBassNote),
                            { ...settings, showCorrectNoteName },
                            globalIdx,
                            currentIndex,
                            correctIndexes,
                            note.duration,
                            noteState
                        ));

                        if (note.barAfter) {
                            trebleNotes.push(new this.vf.BarNote());
                            bassNotes.push(new this.vf.BarNote());
                        }
                    } else {
                        const noteState = incorrectDisplay ? 'idle' : this.getVisualState(globalIdx, currentIndex, correctIndexes, activeIndexes, new Set());
                        const staveNote = this.createStaveNote(
                            this.buildOverlayNote(note, incorrectDisplay?.wrongNote),
                            { ...settings, showCorrectNoteName },
                            globalIdx,
                            currentIndex,
                            correctIndexes,
                            note.duration,
                            noteState
                        );
                        if (note.clef === 'bass') {
                            bassNotes.push(staveNote);
                        } else {
                            trebleNotes.push(staveNote);
                        }

                        if (note.barAfter) {
                            trebleNotes.push(new this.vf.BarNote());
                            bassNotes.push(new this.vf.BarNote());
                        }
                    }
                });

                if (trebleNotes.length > 0) {
                    const trebleVoice = new this.vf.Voice({ num_beats: lineBeats, beat_value: 4 });
                    trebleVoice.setStrict(false);
                    trebleVoice.addTickables(trebleNotes);
                    new this.vf.Formatter().joinVoices([trebleVoice]).format([trebleVoice], noteSpacingWidth - 20);
                    trebleVoice.draw(context, trebleStave);
                }

                if (bassNotes.length > 0) {
                    const bassVoice = new this.vf.Voice({ num_beats: lineBeats, beat_value: 4 });
                    bassVoice.setStrict(false);
                    bassVoice.addTickables(bassNotes);
                    new this.vf.Formatter().joinVoices([bassVoice]).format([bassVoice], noteSpacingWidth - 20);
                    bassVoice.draw(context, bassStave);
                }
            } else {
                const yOffset = line * 90;
                const activeClef = lineNotes[0]?.clef || 'treble';
                const stave = new this.vf.Stave(10, 30 + yOffset, 390);
                stave.addClef(activeClef);
                stave.setContext(context).draw();

                /** @type {any[]} */
                const staveNotes = [];
                lineNotes.forEach((note, idx) => {
                    const globalIdx = start + idx;
                    const incorrectDisplay = incorrectDisplays.get(globalIdx);
                    const showCorrectNoteName = successLabelIndexes.has(globalIdx);
                    const noteState = incorrectDisplay ? 'idle' : this.getVisualState(globalIdx, currentIndex, correctIndexes, activeIndexes, new Set());
                    staveNotes.push(this.createStaveNote(
                        this.buildOverlayNote(note, incorrectDisplay?.wrongNote),
                        { ...settings, showCorrectNoteName },
                        globalIdx,
                        currentIndex,
                        correctIndexes,
                        note.duration,
                        noteState
                    ));
                    if (note.barAfter) {
                        staveNotes.push(new this.vf.BarNote());
                    }
                });

                const voice = new this.vf.Voice({ num_beats: lineBeats, beat_value: 4 });
                voice.setStrict(false);
                voice.addTickables(staveNotes);
                new this.vf.Formatter().joinVoices([voice]).format([voice], 330);
                voice.draw(context, stave);
            }
        }
    }

    /**
     * @param {any[]} notes
     * @param {number} barsPerRow
     */
    groupSongNotesIntoRows(notes, barsPerRow = 2) {
        /** @type {{ notes: any[]; startIndex: number; }[]} */
        const rows = [];
        /** @type {any[]} */
        let currentRow = [];
        let rowStartIndex = 0;
        let barsInRow = 0;

        notes.forEach((note, index) => {
            if (currentRow.length === 0) {
                rowStartIndex = index;
            }

            currentRow.push(note);

            if (note.barAfter) {
                barsInRow++;
            }

            if (barsInRow === barsPerRow) {
                rows.push({ notes: currentRow, startIndex: rowStartIndex });
                currentRow = [];
                barsInRow = 0;
            }
        });

        if (currentRow.length > 0) {
            rows.push({ notes: currentRow, startIndex: rowStartIndex });
        }

        return rows;
    }

    /**
     * @param {any[]} notes
     */
    getTotalBeats(notes) {
        return notes.reduce((total, note) => total + this.getDurationBeats(note.duration), 0);
    }

    /**
     * @param {string} [duration]
     */
    getDurationBeats(duration = 'q') {
        switch (duration) {
            case 'w':
                return 4;
            case 'h':
                return 2;
            case '8':
                return 0.5;
            case 'q':
            default:
                return 1;
        }
    }

    /**
     * @param {any} note
    * @param {{ showNoteNames: boolean; showFingering: boolean; isDualMode?: boolean; showCorrectNoteName?: boolean; }} settings
     * @param {number} idx
     * @param {number} currentIndex
     * @param {Set<number>} correctIndexes
    * @param {string} [durationOverride]
     * @param {string} [noteState]
     */
    createStaveNote(note, settings, idx, currentIndex, correctIndexes, durationOverride, noteState) {
        const duration = durationOverride || note.duration || 'q';
        /** @type {string[]} */
        const keys = note.keys || [note.key];
        const staveNote = new this.vf.StaveNote({
            clef: note.clef,
            keys,
            duration
        });

        keys.forEach((key, keyIndex) => {
            const accidental = note.accidentals?.[keyIndex] || this.getAccidentalFromKey(key);
            if (accidental === '#' || accidental === 'b') {
                staveNote.addModifier(new this.vf.Accidental(accidental), keyIndex);
            }
        });

        if (settings.showNoteNames) {
            staveNote.addModifier(new this.vf.Annotation(note.name)
                .setVerticalJustification(this.vf.Annotation.VerticalJustify.BOTTOM));
        }

        if (settings.showFingering) {
            staveNote.addModifier(new this.vf.Annotation(note.finger)
                .setVerticalJustification(this.vf.Annotation.VerticalJustify.TOP));
        }

        if (settings.showCorrectNoteName && noteState === 'correct' && !settings.showNoteNames) {
            staveNote.addModifier(new this.vf.Annotation(note.name)
                .setVerticalJustification(this.vf.Annotation.VerticalJustify.BOTTOM));
        }

        if (Array.isArray(note.keyStyles)) {
            /** @type {any[]} */
            const keyStyles = note.keyStyles;
            keyStyles.forEach((style, keyIndex) => {
                if (style) {
                    staveNote.setKeyStyle(keyIndex, style);
                }
            });
        }

        this.applyStateStyle(staveNote, noteState || this.getVisualState(idx, currentIndex, correctIndexes, new Set(), new Set()));

        return staveNote;
    }

    /**
     * @param {any} targetNote
     * @param {any} wrongNote
     */
    buildOverlayNote(targetNote, wrongNote) {
        if (!wrongNote || wrongNote.clef !== targetNote.clef || wrongNote.key === targetNote.key) {
            return targetNote;
        }

        return {
            ...targetNote,
            keys: [targetNote.key, wrongNote.key],
            accidentals: [this.getAccidentalFromKey(targetNote.key), this.getAccidentalFromKey(wrongNote.key)],
            keyStyles: [
                { fillStyle: '#111827', strokeStyle: '#111827' },
                { fillStyle: this.noteStateColors.error, strokeStyle: this.noteStateColors.error }
            ]
        };
    }

    /**
     * @param {number} idx
     * @param {number} currentIndex
     * @param {Set<number>} correctIndexes
     * @param {Set<number>} activeIndexes
     * @param {Set<number>} errorIndexes
     */
    getVisualState(idx, currentIndex, correctIndexes, activeIndexes, errorIndexes) {
        if (correctIndexes.has(idx)) {
            return 'correct';
        }

        if (errorIndexes.has(idx)) {
            return 'error';
        }

        if (activeIndexes.has(idx)) {
            return 'playing';
        }

        return idx === currentIndex ? 'playing' : 'idle';
    }

    /**
     * @param {string} key
     */
    getAccidentalFromKey(key) {
        const parts = key.split('/');
        const notePart = parts[0] || '';
        const accidental = notePart.slice(1);
        return accidental || null;
    }

    /**
     * @param {any} staveNote
     * @param {string} noteState
     */
    applyStateStyle(staveNote, noteState) {
        let color = null;

        switch (noteState) {
            case 'playing':
                color = this.noteStateColors.playing;
                break;
            case 'correct':
                color = this.noteStateColors.correct;
                break;
            case 'error':
                color = this.noteStateColors.error;
                break;
            default:
                break;
        }

        if (!color) {
            return;
        }

        staveNote.setStyle({ fillStyle: color, strokeStyle: color });
    }
}
