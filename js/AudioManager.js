export class AudioManager {
    /** @param {(note: number) => void} onNoteCallback */
    constructor(onNoteCallback) {
        /** @type {any} */
        this.audioContext = null;
        /** @type {any} */
        this.analyser = null;
        this.isAudioActive = false;
        this.isEnabled = false;
        this.buflen = 2048;
        this.buf = new Float32Array(this.buflen);
        this.onNoteCallback = onNoteCallback;
        /** @type {number | null} */
        this.lastDetectedNote = null;
    }

    async start() {
        try {
            // @ts-ignore
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContextClass();
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = this.audioContext.createMediaStreamSource(stream);
            
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            source.connect(this.analyser);
            
            this.isAudioActive = true;
            this.startPitchDetection();
            return true;
        } catch (err) {
            console.error("Microphone access denied:", err);
            return false;
        }
    }

    startPitchDetection() {
        const update = () => {
            if (!this.isEnabled || !this.isAudioActive || !this.analyser || !this.audioContext) {
                if (this.isAudioActive) requestAnimationFrame(update);
                return;
            }

            this.analyser.getFloatTimeDomainData(this.buf);
            const freq = this.autoCorrelate(this.buf, this.audioContext.sampleRate);

            if (freq !== -1) {
                const midiNote = this.noteFromPitch(freq);
                if (midiNote !== this.lastDetectedNote) {
                    this.lastDetectedNote = midiNote;
                    this.onNoteCallback(midiNote);
                }
            } else {
                this.lastDetectedNote = null;
            }

            requestAnimationFrame(update);
        };
        requestAnimationFrame(update);
    }

    /** @param {boolean} enabled */
    setEnabled(enabled) {
        this.isEnabled = enabled;
    }

    /** 
     * @param {Float32Array} buf 
     * @param {number} sampleRate 
     */
    autoCorrelate(buf, sampleRate) {
        let SIZE = buf.length;
        let rms = 0;
        for (let i = 0; i < SIZE; i++) {
            let val = buf[i];
            rms += val * val;
        }
        rms = Math.sqrt(rms / SIZE);
        if (rms < 0.01) return -1;

        let r1 = 0, r2 = SIZE - 1, thres = 0.2;
        for (let i = 0; i < SIZE / 2; i++) {
            if (Math.abs(buf[i]) < thres) { r1 = i; break; }
        }
        for (let i = 1; i < SIZE / 2; i++) {
            if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }
        }
        buf = buf.slice(r1, r2);
        SIZE = buf.length;

        let c = new Array(SIZE).fill(0);
        for (let i = 0; i < SIZE; i++) {
            for (let j = 0; j < SIZE - i; j++) {
                c[i] = c[i] + buf[j] * buf[j + i];
            }
        }

        let d = 0;
        while (c[d] > c[d + 1]) d++;
        let maxval = -1, maxpos = -1;
        for (let i = d; i < SIZE; i++) {
            if (c[i] > maxval) {
                maxval = c[i];
                maxpos = i;
            }
        }
        let T0 = maxpos;

        let x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
        let a = (x1 + x3 - 2 * x2) / 2;
        let b = (x3 - x1) / 2;
        if (a) T0 = T0 - b / (2 * a);

        return sampleRate / T0;
    }

    /** @param {number} frequency */
    noteFromPitch(frequency) {
        const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
        return Math.round(noteNum) + 69;
    }
}
