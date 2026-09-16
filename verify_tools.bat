@echo off
set "PATH=%PATH%;C:\Program Files\Go\bin;%USERPROFILE%\go\bin"
echo --- Go Version Check --- > verify_log.txt
go version >> verify_log.txt 2>&1
echo --- GOPATH Check --- >> verify_log.txt
go env GOPATH >> verify_log.txt 2>&1
echo --- Wails Check --- >> verify_log.txt
call wails version >> verify_log.txt 2>&1
if %ERRORLEVEL% NEQ 0 (
    "%USERPROFILE%\go\bin\wails.exe" version >> verify_log.txt 2>&1
)
