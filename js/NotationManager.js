export class NotationManager {
    /** @param {string} elementId */
    constructor(elementId) {
        this.elementId = elementId;
        // @ts-ignore
        this.vf = window.Vex.Flow;
    }

    /**
     * @param {any} currentNote
     * @param {{ showNoteNames: boolean; showFingering: boolean; isDualMode?: boolean; }} settings
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
                const trebleStaveNote = this.createStaveNote(currentNote.trebleNote, settings, 0, 0, new Set());
                const bassStaveNote = this.createStaveNote(currentNote.bassNote, settings, 0, 0, new Set());

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

        const keys = currentNote.keys || [currentNote.key];
        const staveNote = new this.vf.StaveNote({
            clef: currentNote.clef,
            keys,
            duration: "q"
        });

        // Add accidentals for each key (supports chords)
        if (Array.isArray(keys)) {
            keys.forEach((key, idx) => {
                // VexFlow key format is <note><optional accidental>/<octave>
                // e.g. "b/4" (B natural) or "bb/4" (B flat).
                const accidental = key.length > 1 ? key[1] : null;
                if (accidental === '#' || accidental === 'b') {
                    staveNote.addModifier(new this.vf.Accidental(accidental), idx);
                }
            });
        }

        // Add annotations if toggles are on
        if (settings.showNoteNames) {
            staveNote.addModifier(new this.vf.Annotation(currentNote.name)
                .setVerticalJustification(this.vf.Annotation.VerticalJustify.BOTTOM));
        }

        if (settings.showFingering) {
            staveNote.addModifier(new this.vf.Annotation(currentNote.finger)
                .setVerticalJustification(this.vf.Annotation.VerticalJustify.TOP));
        }

        const voice = new this.vf.Voice({ num_beats: 1, beat_value: 4 });
        voice.addTickables([staveNote]);

        new this.vf.Formatter().joinVoices([voice]).format([voice], 100);
        voice.draw(context, activeStave);
    }

    /**
     * @param {any[]} notes
     * @param {{ showNoteNames: boolean; showFingering: boolean; isDualMode?: boolean; }} settings
     * @param {number} currentIndex
     * @param {Set<number>} correctIndexes
     */
    renderSong(notes, settings = { showNoteNames: false, showFingering: false, isDualMode: false }, currentIndex = 0, correctIndexes = new Set()) {
        const div = document.getElementById(this.elementId);
        if (!div || !notes || notes.length === 0) return;

        div.innerHTML = "";

        const renderer = new this.vf.Renderer(div, this.vf.Renderer.Backends.SVG);
        const isDual = !!settings.isDualMode;

        if (isDual) {
            renderer.resize(420, 250);
        } else {
            renderer.resize(420, 180);
        }

        const context = renderer.getContext();
        const noteSpacingWidth = 330;

        if (isDual) {
            const trebleStave = new this.vf.Stave(40, 20, noteSpacingWidth);
            trebleStave.addClef('treble').setContext(context).draw();

            const bassStave = new this.vf.Stave(40, 120, noteSpacingWidth);
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

            const hasDualPairs = notes.some((note) => note.dual && note.trebleNote && note.bassNote);

            if (hasDualPairs) {
                notes.forEach((note, idx) => {
                    if (note.dual && note.trebleNote && note.bassNote) {
                        trebleNotes.push(this.createStaveNote(note.trebleNote, settings, idx, currentIndex, correctIndexes));
                        bassNotes.push(this.createStaveNote(note.bassNote, settings, idx, currentIndex, correctIndexes));
                    }
                });
            } else {
                notes.forEach((note, idx) => {
                    const staveNote = this.createStaveNote(note, settings, idx, currentIndex, correctIndexes);
                    if (note.clef === 'bass') {
                        bassNotes.push(staveNote);
                    } else {
                        trebleNotes.push(staveNote);
                    }
                });
            }

            if (trebleNotes.length > 0) {
                const trebleVoice = new this.vf.Voice({ num_beats: trebleNotes.length, beat_value: 4 });
                trebleVoice.setStrict(false);
                trebleVoice.addTickables(trebleNotes);
                new this.vf.Formatter().joinVoices([trebleVoice]).format([trebleVoice], noteSpacingWidth - 20);
                trebleVoice.draw(context, trebleStave);
            }

            if (bassNotes.length > 0) {
                const bassVoice = new this.vf.Voice({ num_beats: bassNotes.length, beat_value: 4 });
                bassVoice.setStrict(false);
                bassVoice.addTickables(bassNotes);
                new this.vf.Formatter().joinVoices([bassVoice]).format([bassVoice], noteSpacingWidth - 20);
                bassVoice.draw(context, bassStave);
            }
        } else {
            const activeClef = notes[0].clef || 'treble';
            const stave = new this.vf.Stave(10, 30, 390);
            stave.addClef(activeClef);
            stave.setContext(context).draw();

            const staveNotes = notes.map((note, idx) =>
                this.createStaveNote(note, settings, idx, currentIndex, correctIndexes)
            );

            const voice = new this.vf.Voice({ num_beats: staveNotes.length, beat_value: 4 });
            voice.setStrict(false);
            voice.addTickables(staveNotes);
            new this.vf.Formatter().joinVoices([voice]).format([voice], 330);
            voice.draw(context, stave);
        }
    }

    /**
     * @param {any} note
     * @param {{ showNoteNames: boolean; showFingering: boolean; isDualMode?: boolean; }} settings
     * @param {number} idx
     * @param {number} currentIndex
     * @param {Set<number>} correctIndexes
     */
    createStaveNote(note, settings, idx, currentIndex, correctIndexes) {
        const staveNote = new this.vf.StaveNote({
            clef: note.clef,
            keys: [note.key],
            duration: 'q'
        });

        if (note.accidental) {
            staveNote.addModifier(new this.vf.Accidental(note.accidental));
        }

        if (settings.showNoteNames) {
            staveNote.addModifier(new this.vf.Annotation(note.name)
                .setVerticalJustification(this.vf.Annotation.VerticalJustify.BOTTOM));
        }

        if (settings.showFingering) {
            staveNote.addModifier(new this.vf.Annotation(note.finger)
                .setVerticalJustification(this.vf.Annotation.VerticalJustify.TOP));
        }

        if (correctIndexes.has(idx)) {
            staveNote.setStyle({ fillStyle: '#16a34a', strokeStyle: '#16a34a' });
        } else if (idx === currentIndex) {
            staveNote.setStyle({ fillStyle: '#1d4ed8', strokeStyle: '#1d4ed8' });
        }

        return staveNote;
    }
}
