@echo off
set "PATH=%PATH%;C:\Program Files\Go\bin;%USERPROFILE%\go\bin"
echo --- Wails Doctor --- > wails_doctor.txt
wails doctor >> wails_doctor.txt 2>&1
echo Exit code: %ERRORLEVEL% >> wails_doctor.txt
