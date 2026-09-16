@echo off
set "PATH=%PATH%;C:\Program Files\Go\bin;%USERPROFILE%\go\bin"
echo Installing Wails...
"C:\Program Files\Go\bin\go.exe" install github.com/wailsapp/wails/v2/cmd/wails@latest
if %ERRORLEVEL% EQU 0 (
    echo Wails installed successfully.
    "C:\Program Files\Go\bin\go.exe" env GOPATH
) else (
    echo Wails installation failed.
)
