export class MidiManager {
    /** @param {(note: number, activeNotes?: Set<number>, meta?: { source: string; type: string; velocity: number; timestamp: number; note: number; }) => void} onNoteCallback */
    constructor(onNoteCallback) {
        /** @type {any} */
        this.midiAccess = null;
        this.onNoteCallback = onNoteCallback;
        this.activeNotes = new Set();
    }

    async setup() {
        // Use JZZ as a polyfill for Safari support
        let midiAccess;
        try {
            // @ts-ignore
            if (window.JZZ && typeof window.JZZ.requestMIDIAccess === 'function') {
                // @ts-ignore
                midiAccess = await window.JZZ.requestMIDIAccess();
            } else if (navigator.requestMIDIAccess) {
                midiAccess = await navigator.requestMIDIAccess();
            } else {
                return { status: "not_supported" };
            }

            this.midiAccess = midiAccess;
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
        const timestamp = performance.now();
        // Command 144 is Note On, velocity > 0
        if (command === 144 && velocity > 0) {
            this.activeNotes.add(note);
            this.onNoteCallback(note, new Set(this.activeNotes), {
                source: 'midi',
                type: 'noteon',
                velocity,
                timestamp,
                note
            });
            return;
        }

        // Note Off can be sent as command 128, or Note On with velocity 0
        if (command === 128 || (command === 144 && velocity === 0)) {
            this.activeNotes.delete(note);
        }
    }
}
