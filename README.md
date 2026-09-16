# Q-Solver

Q-Solver is an intelligent AI assistant that captures content from your screen and uses powerful AI models (Google Gemini, OpenAI, Claude, DeepSeek) to provide instant answers.

## Features

-   **Screen Capture**: Capture any part of your screen (window or fullscreen).
-   **AI Analysis**: Integrates with major AI providers for accurate solutions.
-   **Live Assistant**: Real-time interaction mode.
-   **Context Awareness**: Can use your resume or other context to tailor answers.
-   **Cross-Platform**: Built with Go and Wails, runs on Windows (primary support).

## Prerequisites

Before building or running the project, ensure you have the following installed:

1.  **Go** (v1.21 or later): [Download Go](https://go.dev/dl/)
2.  **Node.js** (v18 or later): [Download Node.js](https://nodejs.org/)
3.  **Wails**: The framework used for the frontend-backend bridge.
    ```powershell
    go install github.com/wailsapp/wails/v2/cmd/wails@latest
    ```
4.  **MinGW (GCC)**: Required for CGO compilation on Windows.
    -   Recommended: [tDM-GCC](https://jmeubank.github.io/tdm-gcc/) or via `choco install mingw`.

## Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Prathamsimgh/Q-solver.git
    cd Q-solver
    ```

2.  **Install Frontend Dependencies**:
    ```bash
    cd frontend
    npm install
    cd ..
    ```

3.  **Configuration**:
    -   Copy `config/config.example.json` to `config/config.json`.
    -   Usage typically requires setting up an API Key in the settings UI after launch, but you can pre-configure it here if needed.

## Building the App

To build the application for production:

1.  Run the build script:
    ```cmd
    build_app.bat
    ```
    This will generate the executable in `build/bin/`.

## Running

-   **Development Mode** (with hot reload):
    ```powershell
    wails dev
    ```
-   **Production Mode**:
    -   Run `launch_app.bat`
    -   Or convert the generated `build/bin/Q-Solver.exe`.

## User Guide

For detailed usage instructions, please refer to [USER_GUIDE.md](USER_GUIDE.md).

## License

[MIT](LICENSE)
