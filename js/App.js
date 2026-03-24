import { ALL_NOTES, TRAINER_INPUT_SETTINGS } from './constants.js';
import { GameState } from './GameState.js';
import { NotationManager } from './NotationManager.js';
import { MidiManager } from './MidiManager.js';
import { AudioManager } from './AudioManager.js';
import { UIHandler } from './UIHandler.js';

export class App {
    constructor() {
        this.gameState = new GameState();
        this.notation = new NotationManager('staff');
        this.ui = new UIHandler();
        this.songStepPending = false;
        this.noteAdvancePending = false;
        this.noteVisualState = 'idle';
        this.incorrectDisplay = null;
        this.showCorrectNoteName = true;
        this.pendingInputTimer = null;
        this.lastEvaluatedSignature = '';
        this.lastEvaluatedAt = 0;
        /** @type {(note: number, activeNotes?: Set<number>, meta?: { source?: string; type?: string; velocity?: number; timestamp?: number; note?: number; }) => void} */
        const midiInputHandler = (note, activeNotes, meta) => this.handleNoteInput(note, activeNotes, meta);
        this.midi = new MidiManager(midiInputHandler);
        /** @param {number} note */
        this.audio = new AudioManager((note) => this.handleNoteInput(note, undefined, {
            source: 'audio',
            type: 'noteon',
            velocity: 127,
            timestamp: performance.now(),
            note
        }));
    }

    async init() {
        // Setup MIDI
        const midiResult = await this.midi.setup();
        this.ui.updateMidiStatus(midiResult.status);

        // Setup Event Listeners
        this.setupEventListeners();

        // Initial UI State
        this.ui.updateAudioStatus(this.audio.isEnabled, this.audio.isAudioActive);
    }

    setupEventListeners() {
        // Expose to window for index.html onclick compatibility
        // @ts-ignore
        window.startPractice = (mode) => this.startPractice(mode);
        // @ts-ignore
        window.showLandingPage = () => this.showLandingPage();

        this.ui.elements.noteNamesToggle?.addEventListener('change', (e) => {
            if (e.target instanceof HTMLInputElement) {
                this.gameState.showNoteNames = e.target.checked;
                this.renderCurrentNote();
            }
        });

        this.ui.elements.fingeringToggle?.addEventListener('change', (e) => {
            if (e.target instanceof HTMLInputElement) {
                this.gameState.showFingering = e.target.checked;
                this.renderCurrentNote();
            }
        });

        this.ui.elements.correctNoteNameToggle?.addEventListener('change', (e) => {
            if (e.target instanceof HTMLInputElement) {
                this.showCorrectNoteName = e.target.checked;
                this.renderCurrentNote();
            }
        });

        this.ui.elements.audioStatus?.addEventListener('click', async () => {
            const enabled = !this.audio.isEnabled;
            this.audio.setEnabled(enabled);

            if (enabled && !this.audio.isAudioActive) {
                const started = await this.audio.start();
                if (!started) {
                    this.audio.setEnabled(false);
                }
            }

            this.ui.updateAudioStatus(this.audio.isEnabled, this.audio.isAudioActive);
        });

        // Click to start audio engine (browser requirement)
        document.body.addEventListener('mousedown', () => {
            if (this.audio.audioContext?.state === 'suspended') {
                this.audio.audioContext.resume();
            }
        }, { once: true });
    }

    /** @param {string} mode */
    startPractice(mode) {
        const includeAccidentals = this.ui.getAccidentalsEnabled();
        this.gameState.setMode(mode, includeAccidentals);

        if (this.gameState.filteredNotes.length === 0) {
            alert("No notes found for this selection!");
            return;
        }

        this.gameState.reset();
        this.clearPendingInputTimer();
        this.songStepPending = false;
        this.noteAdvancePending = false;
        this.noteVisualState = 'playing';
        this.incorrectDisplay = null;
        this.ui.updateScore(0);
        this.ui.updateAvgTime(0);
        this.ui.showTrainer();
        this.generateNextNote();
    }

    showLandingPage() {
        this.clearPendingInputTimer();
        this.noteAdvancePending = false;
        this.ui.showLanding();
    }

    generateNextNote() {
        this.clearPendingInputTimer();
        this.noteAdvancePending = false;
        const nextNote = this.gameState.generateNextNote();
        this.incorrectDisplay = null;
        if (nextNote) {
            if (this.gameState.isSongMode) {
                this.renderSongWindow();
                this.ui.showFeedback(`Play note ${this.gameState.songIndex + 1}/${this.gameState.songNotes.length}`);
            } else {
                this.notation.renderNote(nextNote, {
                    showNoteNames: this.gameState.showNoteNames,
                    showFingering: this.gameState.showFingering,
                    isDualMode: this.gameState.isDualMode,
                    visualState: this.noteVisualState,
                    incorrectDisplay: this.incorrectDisplay,
                    showCorrectNoteName: this.showCorrectNoteName && this.noteVisualState === 'correct'
                });
                this.ui.showFeedback("Play the note below");
            }
        }
    }

    renderCurrentNote() {
        if (this.gameState.isSongMode) {
            this.renderSongWindow();
            return;
        }

        this.notation.renderNote(this.gameState.currentNote, {
            showNoteNames: this.gameState.showNoteNames,
            showFingering: this.gameState.showFingering,
            isDualMode: this.gameState.isDualMode,
            visualState: this.noteVisualState,
            incorrectDisplay: this.incorrectDisplay,
            showCorrectNoteName: this.showCorrectNoteName && this.noteVisualState === 'correct'
        });
    }

    renderSongWindow() {
        const activeIndexes = new Set();
        const incorrectDisplays = new Map();
        const successLabelIndexes = new Set();

        if (this.gameState.currentNote && this.noteVisualState === 'playing') {
            activeIndexes.add(this.gameState.songIndex);
        }

        if (this.gameState.currentNote && this.noteVisualState === 'error' && this.incorrectDisplay) {
            incorrectDisplays.set(this.gameState.songIndex, this.incorrectDisplay);
        }

        if (this.gameState.currentNote && this.noteVisualState === 'correct' && this.showCorrectNoteName) {
            successLabelIndexes.add(this.gameState.songIndex);
        }

        // Render the full song in a stacked staff layout so the user can see the entire melody.
        this.notation.renderSong(
            this.gameState.songNotes,
            {
                showNoteNames: this.gameState.showNoteNames,
                showFingering: this.gameState.showFingering,
                isDualMode: this.gameState.isDualMode,
                activeIndexes,
                incorrectDisplays,
                successLabelIndexes
            },
            this.gameState.songIndex,
            this.gameState.correctSongIndexes
        );
    }

    /**
     * @param {number} playedMidi
     * @param {Set<number>} [activeMidiNotes]
     * @param {{ source?: string; type?: string; velocity?: number; timestamp?: number; note?: number; }} [inputMeta]
     */
    handleNoteInput(playedMidi, activeMidiNotes, inputMeta = {}) {
        if (this.gameState.isSongMode && this.songStepPending) {
            return;
        }

        if (this.noteAdvancePending) {
            return;
        }

        const expectsMultipleNotes = this.gameState.isDualMode || Array.isArray(this.gameState.currentNote?.midi);

        if (expectsMultipleNotes && activeMidiNotes instanceof Set && inputMeta.source === 'midi') {
            this.queueMultiNoteEvaluation(activeMidiNotes, inputMeta);
            return;
        }

        const inputForCheck = (expectsMultipleNotes && activeMidiNotes)
            ? Array.from(activeMidiNotes)
            : playedMidi;

        this.evaluateNoteInput(inputForCheck, inputMeta);
    }

    /**
     * @param {Set<number>} activeMidiNotes
     * @param {{ source?: string; type?: string; velocity?: number; timestamp?: number; note?: number; }} inputMeta
     */
    queueMultiNoteEvaluation(activeMidiNotes, inputMeta) {
        this.clearPendingInputTimer();

        const settledNotes = Array.from(new Set(activeMidiNotes)).sort((left, right) => left - right);
        this.pendingInputTimer = setTimeout(() => {
            this.pendingInputTimer = null;
            this.evaluateNoteInput(settledNotes, inputMeta);
        }, TRAINER_INPUT_SETTINGS.multiNoteSettleMs);
    }

    clearPendingInputTimer() {
        if (this.pendingInputTimer) {
            clearTimeout(this.pendingInputTimer);
            this.pendingInputTimer = null;
        }
    }

    /**
     * @param {number | number[]} inputForCheck
     * @param {{ source?: string; type?: string; velocity?: number; timestamp?: number; note?: number; }} [inputMeta]
     */
    evaluateNoteInput(inputForCheck, inputMeta = {}) {
        const signature = this.buildInputSignature(inputForCheck);
        const now = typeof inputMeta.timestamp === 'number' ? inputMeta.timestamp : performance.now();

        if (signature
            && signature === this.lastEvaluatedSignature
            && now - this.lastEvaluatedAt < TRAINER_INPUT_SETTINGS.retriggerBlockMs) {
            return;
        }

        if (Array.isArray(inputForCheck) && this.isPartialExpectedMatch(inputForCheck)) {
            return;
        }

        this.lastEvaluatedSignature = signature;
        this.lastEvaluatedAt = now;

        const result = this.gameState.checkNote(inputForCheck);

        if (result.correct) {
            this.clearPendingInputTimer();
            this.incorrectDisplay = null;
            this.noteVisualState = 'correct';
            this.renderCurrentNote();
            this.ui.updateScore(result.score || 0);
            this.ui.updateAvgTime(result.avgTime || 0);
            this.ui.showFeedback("Correct!", "success");

            if (this.gameState.isSongMode) {
                this.songStepPending = true;
                this.renderSongWindow();
                const songProgress = result.songProgress;

                if (songProgress?.isComplete) {
                    this.ui.showFeedback("Song complete! Great job!", "success");
                    this.songStepPending = false;
                    return;
                }

                setTimeout(() => {
                    this.gameState.advanceSong();
                    this.noteVisualState = 'playing';
                    this.renderSongWindow();
                    this.ui.showFeedback(`Play note ${this.gameState.songIndex + 1}/${this.gameState.songNotes.length}`);
                    this.songStepPending = false;
                }, TRAINER_INPUT_SETTINGS.songAdvanceDelayMs);
            } else {
                this.noteAdvancePending = true;
                setTimeout(() => {
                    this.noteVisualState = 'playing';
                    this.generateNextNote();
                }, TRAINER_INPUT_SETTINGS.noteSuccessDisplayMs);
            }
        } else {
            this.noteVisualState = 'error';
            this.incorrectDisplay = this.buildIncorrectDisplay(inputForCheck);
            this.renderCurrentNote();
            this.ui.showFeedback("Try again", "error");
        }
    }

    /**
     * @param {number | number[]} inputForCheck
     */
    buildInputSignature(inputForCheck) {
        if (Array.isArray(inputForCheck)) {
            return inputForCheck
                .slice()
                .sort((left, right) => left - right)
                .join('-');
        }

        return String(inputForCheck);
    }

    /**
     * @param {number[]} playedNotes
     */
    isPartialExpectedMatch(playedNotes) {
        const expectedNotes = this.getExpectedMidiNotes();

        if (expectedNotes.length <= 1 || playedNotes.length === 0 || playedNotes.length >= expectedNotes.length) {
            return false;
        }

        const expectedSet = new Set(expectedNotes);
        return playedNotes.every((midi) => expectedSet.has(midi));
    }

    getExpectedMidiNotes() {
        if (!this.gameState.currentNote) {
            return [];
        }

        if (Array.isArray(this.gameState.currentNote.midi)) {
            return Array.from(new Set(this.gameState.currentNote.midi));
        }

        if (this.gameState.currentNote.dual) {
            return [
                this.gameState.currentNote.trebleNote?.midi,
                this.gameState.currentNote.bassNote?.midi
            ].filter((midi) => typeof midi === 'number');
        }

        return typeof this.gameState.currentNote.midi === 'number'
            ? [this.gameState.currentNote.midi]
            : [];
    }

    /**
     * @param {number | number[]} playedInput
     */
    buildIncorrectDisplay(playedInput) {
        const currentNote = this.gameState.currentNote;
        if (!currentNote) {
            return null;
        }

        const playedNotes = Array.isArray(playedInput) ? playedInput : [playedInput];

        if (currentNote.dual && currentNote.trebleNote && currentNote.bassNote) {
            const wrongTrebleNote = this.findNoteByMidi(
                playedNotes.find((midi) => midi !== currentNote.trebleNote.midi && this.findNoteByMidi(midi, 'treble')),
                'treble'
            );
            const wrongBassNote = this.findNoteByMidi(
                playedNotes.find((midi) => midi !== currentNote.bassNote.midi && this.findNoteByMidi(midi, 'bass')),
                'bass'
            );

            if (!wrongTrebleNote && !wrongBassNote) {
                return null;
            }

            return { wrongTrebleNote, wrongBassNote };
        }

        const wrongMidi = playedNotes.find((midi) => midi !== currentNote.midi);
        const wrongNote = this.findNoteByMidi(wrongMidi, currentNote.clef);

        return wrongNote ? { wrongNote } : null;
    }

    /**
     * @param {number | undefined} midi
     * @param {string} [clef]
     */
    findNoteByMidi(midi, clef) {
        if (typeof midi !== 'number') {
            return null;
        }

        return ALL_NOTES.find((note) => note.midi === midi && (!clef || note.clef === clef)) || null;
    }
}
