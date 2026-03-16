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
        /** @type {(note: number, activeNotes?: Set<number>) => void} */
        const midiInputHandler = (note, activeNotes) => this.handleNoteInput(note, activeNotes);
        this.midi = new MidiManager(midiInputHandler);
        /** @param {number} note */
        this.audio = new AudioManager((note) => this.handleNoteInput(note));
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

        this.ui.elements.microphoneToggle?.addEventListener('change', async (e) => {
            if (e.target instanceof HTMLInputElement) {
                const enabled = e.target.checked;
                this.audio.setEnabled(enabled);

                if (enabled && !this.audio.isAudioActive) {
                    const started = await this.audio.start();
                    if (!started) {
                        this.ui.setMicrophoneToggle(false);
                        this.audio.setEnabled(false);
                    }
                }
                this.ui.updateAudioStatus(this.audio.isEnabled, this.audio.isAudioActive);
            }
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
        this.songStepPending = false;
        this.ui.updateScore(0);
        this.ui.updateAvgTime(0);
        this.ui.showTrainer();
        this.generateNextNote();
    }

    showLandingPage() {
        this.ui.showLanding();
    }

    generateNextNote() {
        const nextNote = this.gameState.generateNextNote();
        this.ui.hideSuccessNote();
        if (nextNote) {
            if (this.gameState.isSongMode) {
                this.renderSongWindow();
                this.ui.showFeedback(`Play note ${this.gameState.songIndex + 1}/${this.gameState.songNotes.length}`);
            } else {
                this.notation.renderNote(nextNote, {
                    showNoteNames: this.gameState.showNoteNames,
                    showFingering: this.gameState.showFingering,
                    isDualMode: this.gameState.isDualMode
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
            isDualMode: this.gameState.isDualMode
        });
    }

    renderSongWindow() {
        const window = this.gameState.getSongWindow(this.gameState.getSongPageSize());
        this.notation.renderSong(
            window.notes,
            {
                showNoteNames: this.gameState.showNoteNames,
                showFingering: this.gameState.showFingering,
                isDualMode: this.gameState.isDualMode
            },
            window.currentWindowIndex,
            window.correctWindowIndexes
        );
    }

    /**
     * @param {number} playedMidi
     * @param {Set<number>} [activeMidiNotes]
     */
    handleNoteInput(playedMidi, activeMidiNotes) {
        if (this.gameState.isSongMode && this.songStepPending) {
            return;
        }

        const inputForCheck = (this.gameState.isDualMode && activeMidiNotes)
            ? Array.from(activeMidiNotes)
            : playedMidi;
        const result = this.gameState.checkNote(inputForCheck);

        if (result.correct) {
            this.ui.updateScore(result.score || 0);
            this.ui.updateAvgTime(result.avgTime || 0);
            this.ui.showFeedback("Correct!", "success");

            // Show the letter of the note on the right
            const currentNote = this.gameState.currentNote;
            if (currentNote) {
                this.ui.showSuccessNote(currentNote.name);
            }

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
                    this.renderSongWindow();
                    this.ui.showFeedback(`Play note ${this.gameState.songIndex + 1}/${this.gameState.songNotes.length}`);
                    this.songStepPending = false;
                }, 550);
            } else {
                setTimeout(() => {
                    this.generateNextNote();
                }, 800); // Slightly longer pause to show the note name
            }
        } else {
            this.ui.showFeedback("Try again", "error");
        }
    }
}
