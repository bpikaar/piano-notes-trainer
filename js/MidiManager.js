export class MidiManager {
    /** @param {(note: number) => void} onNoteCallback */
    constructor(onNoteCallback) {
        /** @type {any} */
        this.midiAccess = null;
        this.onNoteCallback = onNoteCallback;
    }

    async setup() {
        // Use JZZ as a polyfill for Safari support
        // @ts-ignore
        const requestMIDIAccess = window.JZZ ? window.JZZ().requestMIDIAccess : navigator.requestMIDIAccess;

        if (!requestMIDIAccess) {
            return { status: "not_supported" };
        }

        try {
            this.midiAccess = await requestMIDIAccess();
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
            /** @param {any} event */
            input.onmidimessage = (event) => this.handleMIDIMessage(event);
        }

        /** @param {any} e */
        this.midiAccess.onstatechange = (e) => {
            if (e.port && e.port.state === 'connected') {
                this.setupInputs();
            }
        };
    }

    /** @param {any} event */
    handleMIDIMessage(event) {
        const [command, note, velocity] = event.data;
        // Command 144 is Note On, velocity > 0
        if (command === 144 && velocity > 0) {
            this.onNoteCallback(note);
        }
    }
}
