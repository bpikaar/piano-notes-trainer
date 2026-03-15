# Piano Note Trainer 🎹

A modern, web-based piano note learning application. Practice reading musical notes on a staff with real-time feedback using MIDI or your microphone.

## 🚀 Features

- **MIDI Support**: Precise note detection using your MIDI keyboard.
- **Audio Fallback**: Use your microphone to practice with an acoustic piano (includes real-time pitch detection).
- **Multiple Practice Modes**:
  - Right Hand (C4-G4, C4-C5)
  - Left Hand (C3-G3, C3-C4)
  - Both Hands (Grand staff practice)
- **Accidentals (Black Keys)**: Toggle support for sharps and flats.
- **Visual Hints**: Optional display for Note Names and Fingerings.
- **Performance Tracking**: Tracks your score and average response time.
- **PWA Support**: Installable on mobile devices for a native-like experience.
- **Accessibility**: ARIA-labeled and semantically structured for screen reader support.

## 🛠️ Installation

This is a static web application. No server-side installation (Node.js/npm) is required for the application to run.

1. **Download/Clone** the repository to your local machine.
2. **Open `index.html`** in any modern web browser (Chrome, Edge, or Safari recommended for MIDI support).

## 🎹 How to Use

1. **Select a Mode**: Choose your preferred hand and note range from the landing page.
2. **Accidentals**: Toggle "Include Black Keys" if you want to practice sharps/flats.
3. **Connectivity**:
   - If using **MIDI**: Plug in your keyboard before opening the app. The "MIDI Ready" status will turn green.
   - If using **Audio**: Toggle "Enable Microphone" in the settings, grant permissions, and click the screen once to start the audio engine.
4. **Play**: A random note will appear. Play the corresponding key on your piano.
5. **Progress**: Monitor your score and average time. Click **Restart** (Exit) to change modes.

## ⚙️ How it Works

The application is built using a modular, Object-Oriented approach:

- **VexFlow**: Used for high-quality musical notation rendering.
- **Web MIDI API**: For low-latency communication with MIDI instruments.
- **Web Audio API**: For capturing microphone input and analyzing frequencies.
- **Pitch Detection**: Implements an autocorrelation algorithm to translate acoustic frequencies into musical notes.
- **ES6 Modules**: The code is split into logical managers (GameState, NotationManager, MidiManager, etc.) for better maintainability.

## 📦 File Structure

- `index.html`: Main structure.
- `styles.css`: Premium styling and layout.
- `main.js`: Application entry point.
- `js/`: Modular class implementations.
  - `App.js`: Main orchestrator.
  - `GameState.js`: Score and note logic.
  - `NotationManager.js`: Staff rendering.
  - `MidiManager.js`: MIDI handling.
  - `AudioManager.js`: Pitch detection.
  - `UIHandler.js`: DOM management.
  - `constants.js`: Shared data.
