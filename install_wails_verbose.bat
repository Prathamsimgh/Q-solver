@echo off
echo --- Installing Wails --- > wails_install.txt
"C:\Program Files\Go\bin\go.exe" install -v github.com/wailsapp/wails/v2/cmd/wails@latest >> wails_install.txt 2>&1
echo Exit code: %ERRORLEVEL% >> wails_install.txt
echo --- Check if installed --- >> wails_install.txt
dir "C:\Users\ASUS\go\bin" >> wails_install.txt 2>&1
