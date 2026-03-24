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
        /** @type {number | null} */
        this.pendingDetectedNote = null;
        this.pendingDetectionFrames = 0;
        this.silenceFrames = 0;
        this.minRms = 0.02;
        this.minClarity = 0.9;
        this.requiredStableFrames = 4;
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
            const detection = this.autoCorrelate(this.buf, this.audioContext.sampleRate);

            if (detection) {
                const midiNote = this.noteFromPitch(detection.frequency);
                const isStableCandidate = detection.rms >= this.minRms
                    && detection.clarity >= this.minClarity
                    && detection.frequency >= 120
                    && detection.frequency <= 1050;

                if (isStableCandidate) {
                    this.silenceFrames = 0;

                    if (midiNote === this.pendingDetectedNote) {
                        this.pendingDetectionFrames++;
                    } else {
                        this.pendingDetectedNote = midiNote;
                        this.pendingDetectionFrames = 1;
                    }

                    if (this.pendingDetectionFrames >= this.requiredStableFrames && midiNote !== this.lastDetectedNote) {
                        this.lastDetectedNote = midiNote;
                        this.onNoteCallback(midiNote);
                    }
                } else {
                    this.pendingDetectedNote = null;
                    this.pendingDetectionFrames = 0;
                }
            } else {
                this.pendingDetectedNote = null;
                this.pendingDetectionFrames = 0;
                this.silenceFrames++;

                if (this.silenceFrames >= 3) {
                    this.lastDetectedNote = null;
                }
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
            const val = buf[i];
            rms += val * val;
        }
        rms = Math.sqrt(rms / SIZE);
        if (rms < this.minRms) return null;

        let r1 = 0;
        let r2 = SIZE - 1;
        const thres = 0.2;
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
        let maxval = -1;
        let maxpos = -1;
        for (let i = d; i < SIZE; i++) {
            if (c[i] > maxval) {
                maxval = c[i];
                maxpos = i;
            }
        }
        if (maxpos <= 0 || !Number.isFinite(maxval)) {
            return null;
        }

        let T0 = maxpos;

        const x1 = c[T0 - 1];
        const x2 = c[T0];
        const x3 = c[T0 + 1];
        const a = (x1 + x3 - 2 * x2) / 2;
        const b = (x3 - x1) / 2;
        if (a) T0 = T0 - b / (2 * a);

        if (!T0 || !Number.isFinite(T0)) {
            return null;
        }

        const frequency = sampleRate / T0;
        const clarity = c[0] ? maxval / c[0] : 0;

        if (!Number.isFinite(frequency) || frequency <= 0) {
            return null;
        }

        return { frequency, clarity, rms };
    }

    /** @param {number} frequency */
    noteFromPitch(frequency) {
        const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
        return Math.round(noteNum) + 69;
    }
}
