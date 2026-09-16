# Q-Solver User Guide

## Introduction
Q-Solver is an intelligent AI assistant designed to help you solve questions directly from your screen. It captures content from your active window or screen, analyzes it using powerful AI models (like Google Gemini, OpenAI, Claude, DeepSeek), and provides instant answers.

## Getting Started

### 1. Launching the App
*   Double-click `launch_app.bat` in the `Q solver` folder.
*   Or run `Q-Solver.exe` located in `build\bin\`.

### 2. Initial Setup
Before using the app, you need to configure an AI provider:
1.  Click the **Settings** (gear icon) button in the top bar.
2.  Go to the **Provider** tab.
3.  Select your preferred provider (e.g., Google Gemini, OpenAI).
4.  Enter your **API Key**.
5.  Click **Save**.

## Basic Usage

### Capturing & Solving
1.  **Open the content** you want to solve (e.g., a quiz, a coding problem, a document).
2.  Press the **Capture Shortcut** (Default: `F8`).
    *   The app will take a screenshot of the active window.
    *   AI will analyze the text/image and "think deeply" to provide an answer.
3.   The answer will appear in the Q-Solver window.

### Shortcuts
*   **F8**: Capture Screen & Ask AI (Default).
*   **F9**: (If configured) Retry / Quick Action.
*   *Note: usage depends on your configuration in Settings > General.*

## Key Features

### 📸 Screenshot Modes
You can choose how the app sees your screen in **Settings > Screenshot**:
*   **Window Mode**: Captures only the currently active window (focused app).
*   **Fullscreen Mode**: Captures the entire monitor screen.

### 🎤 Live Assistant Mode
*   Enable **Live API Mode** in **Settings > General**.
*   This mode allows for real-time interaction, useful for dynamic content or voice-based queries (if supported).

### 📄 Resume Context
*   Go to **Settings > Resume**.
*   Import your **PDF Resume**.
*   When enabled, the AI will use your background information to tailor its answers (e.g., "Answer as a Senior Developer...").

### 💾 History
*   The left sidebar shows your session history.
*   Click on any previous item to view past questions and answers.
*   Right-click a history item to **Export as Image** or **Delete**.

## Settings Overview
*   **General**: Configure "Keep Context" (remember previous chat), Live Mode, and window opacity.
*   **Model**: Switch between different AI models (e.g., Gemini Pro, GPT-4) and edit the **System Prompt**.
*   **Params**: Fine-tune AI responses (Temperature, Max Tokens).
*   **Screenshot**: Adjust image compression, quality, and grayscale (to save tokens).

## Troubleshooting
*   **"Please enter API Key first"**: You haven't set up your API key in Settings > Provider.
*   **"Connection Failed"**: Check your internet connection or verify if your API Key is correct/expired.
*   **App not capturing**: Ensure Q-Solver has permission to record the screen (Windows settings) and that the target window is not protected (e.g., some banking apps).
