export class UIHandler {
    constructor() {
        this.elements = {
            landingPage: document.getElementById('landing-page'),
            appContainer: document.getElementById('app-container'),
            score: document.getElementById('score'),
            avgTime: document.getElementById('avg-time'),
            feedback: document.getElementById('feedback'),
            midiStatus: document.querySelector('#midi-status'),
            audioStatus: document.querySelector('#audio-status'),
            accidentalsToggle: document.getElementById('landing-toggle-accidentals'),
            noteNamesToggle: document.getElementById('toggle-note-names'),
            fingeringToggle: document.getElementById('toggle-fingering'),
            microphoneToggle: document.getElementById('toggle-microphone'),
            successNoteLabel: document.getElementById('success-note-label')
        };
    }

    showTrainer() {
        if (this.elements.landingPage) this.elements.landingPage.style.display = 'none';
        if (this.elements.appContainer) this.elements.appContainer.style.display = 'flex';
    }

    showLanding() {
        if (this.elements.landingPage) this.elements.landingPage.style.display = 'flex';
        if (this.elements.appContainer) this.elements.appContainer.style.display = 'none';
    }

    /** @param {number} score */
    updateScore(score) {
        if (this.elements.score) this.elements.score.textContent = score.toString();
    }

    /** @param {number} avgTime */
    updateAvgTime(avgTime) {
        if (this.elements.avgTime) this.elements.avgTime.textContent = avgTime.toFixed(2);
    }

    /** 
     * @param {string} message 
     * @param {string} type 
     */
    showFeedback(message, type = '') {
        const feedback = this.elements.feedback;
        if (feedback) {
            feedback.textContent = message;
            feedback.className = `feedback-message ${type}`;
            if (type === 'error') {
                setTimeout(() => feedback.classList.remove('error'), 400);
            }
        }
    }

    /** @param {string} status */
    updateMidiStatus(status) {
        if (!this.elements.midiStatus) return;
        const text = this.elements.midiStatus.querySelector('.text');
        const indicator = this.elements.midiStatus.querySelector('.indicator');

        if (status === 'ready') {
            if (text) text.textContent = 'MIDI Ready';
            if (indicator) indicator.classList.add('connected');
        } else if (status === 'denied') {
            if (text) text.textContent = 'MIDI Denied';
            if (indicator) indicator.classList.remove('connected');
        } else {
            if (text) text.textContent = 'No MIDI Support';
            if (indicator) indicator.classList.remove('connected');
        }
    }

    /** 
     * @param {boolean} isEnabled 
     * @param {boolean} isActive 
     */
    updateAudioStatus(isEnabled, isActive) {
        if (!this.elements.audioStatus) return;
        const text = this.elements.audioStatus.querySelector('.text');
        const indicator = this.elements.audioStatus.querySelector('.indicator');

        if (isEnabled && isActive) {
            if (text) text.textContent = 'Audio: On';
            if (indicator) indicator.classList.add('connected');
        } else if (isEnabled && !isActive) {
            if (text) text.textContent = 'Audio: Start...';
            if (indicator) indicator.classList.remove('connected');
        } else {
            if (text) text.textContent = 'Audio: Off';
            if (indicator) indicator.classList.remove('connected');
        }
    }

    getAccidentalsEnabled() {
        if (this.elements.accidentalsToggle instanceof HTMLInputElement) {
            return this.elements.accidentalsToggle.checked;
        }
        return false;
    }

    /** @param {boolean} enabled */
    setMicrophoneToggle(enabled) {
        if (this.elements.microphoneToggle instanceof HTMLInputElement) {
            this.elements.microphoneToggle.checked = enabled;
        }
    }

    /** @param {string} noteName */
    showSuccessNote(noteName) {
        const label = this.elements.successNoteLabel;
        if (label) {
            label.textContent = noteName;
            label.classList.add('visible');
        }
    }

    hideSuccessNote() {
        const label = this.elements.successNoteLabel;
        if (label) {
            label.classList.remove('visible');
        }
    }
}
