@echo off
set "PATH=%PATH%;C:\Program Files\Go\bin;%USERPROFILE%\go\bin"
echo --- Wails Build --- > build_log.txt
where wails >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    wails build >> build_log.txt 2>&1
) else (
    "%USERPROFILE%\go\bin\wails.exe" build >> build_log.txt 2>&1
)
echo Exit code: %ERRORLEVEL% >> build_log.txt
