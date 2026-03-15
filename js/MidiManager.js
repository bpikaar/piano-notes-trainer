export class MidiManager {
    /** @param {(note: number) => void} onNoteCallback */
    constructor(onNoteCallback) {
        /** @type {any} */
        this.midiAccess = null;
        this.onNoteCallback = onNoteCallback;
    }

    async setup() {
        if (!navigator.requestMIDIAccess) {
            return { status: "not_supported" };
        }

        try {
            this.midiAccess = await navigator.requestMIDIAccess();
            this.setupInputs();
            return { status: "ready" };
        } catch (err) {
            console.error("MIDI access denied:", err);
            return { status: "denied" };
        }
    }

    setupInputs() {
        if (!this.midiAccess) return;

        for (const input of this.midiAccess.inputs.values()) {
            input.onmidimessage = (event) => this.handleMIDIMessage(event);
        }

        this.midiAccess.onstatechange = (e) => {
            if (e.port && e.port.state === 'connected') {
                this.setupInputs();
            }
        };
    }

    handleMIDIMessage(event) {
        const [command, note, velocity] = event.data;
        // Command 144 is Note On, velocity > 0
        if (command === 144 && velocity > 0) {
            this.onNoteCallback(note);
        }
    }
}
