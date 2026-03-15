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
        
        // Resize based on mode
        if (isDual) {
            renderer.resize(250, 250);
        } else {
            renderer.resize(200, 150);
        }
        
        const context = renderer.getContext();

        let trebleStave, bassStave;
        let activeStave;

        if (isDual) {
            // Render Grand Staff (both hands)
            trebleStave = new this.vf.Stave(40, 40, 180);
            trebleStave.addClef('treble').setContext(context).draw();

            bassStave = new this.vf.Stave(40, 140, 180);
            bassStave.addClef('bass').setContext(context).draw();

            // Connect them with a bracket and brace
            const brace = new this.vf.StaveConnector(trebleStave, bassStave);
            brace.setType(this.vf.StaveConnector.type.BRACE);
            brace.setContext(context).draw();

            const leftLine = new this.vf.StaveConnector(trebleStave, bassStave);
            leftLine.setType(this.vf.StaveConnector.type.SINGLE_LEFT);
            leftLine.setContext(context).draw();

            activeStave = currentNote.clef === 'treble' ? trebleStave : bassStave;
        } else {
            // Render Single Staff (normal mode)
            activeStave = new this.vf.Stave(10, 40, 180);
            activeStave.addClef(currentNote.clef);
            activeStave.setContext(context).draw();
        }

        const staveNote = new this.vf.StaveNote({
            clef: currentNote.clef,
            keys: [currentNote.key],
            duration: "q"
        });

        if (currentNote.accidental) {
            staveNote.addModifier(new this.vf.Accidental(currentNote.accidental));
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
}
