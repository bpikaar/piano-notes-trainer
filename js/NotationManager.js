export class NotationManager {
    /** @param {string} elementId */
    constructor(elementId) {
        this.elementId = elementId;
        // @ts-ignore
        this.vf = window.Vex.Flow;
    }

    /**
     * @param {any} currentNote
     * @param {{ showNoteNames: boolean; showFingering: boolean; }} settings
     */
    renderNote(currentNote, settings = { showNoteNames: false, showFingering: false }) {
        const div = document.getElementById(this.elementId);
        if (!div || !currentNote) return;
        
        div.innerHTML = ""; // Clear previous

        const renderer = new this.vf.Renderer(div, this.vf.Renderer.Backends.SVG);
        renderer.resize(200, 150);
        const context = renderer.getContext();

        const stave = new this.vf.Stave(10, 40, 180);
        stave.addClef(currentNote.clef);
        stave.setContext(context).draw();

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
        voice.draw(context, stave);
    }
}
