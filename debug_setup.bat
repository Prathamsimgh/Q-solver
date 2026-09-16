@echo off
echo --- Git Status --- > debug_log.txt
git status >> debug_log.txt 2>&1
echo. >> debug_log.txt
echo --- Dir Content --- >> debug_log.txt
dir >> debug_log.txt 2>&1
echo. >> debug_log.txt
echo --- Node Version --- >> debug_log.txt
node -v >> debug_log.txt 2>&1
echo. >> debug_log.txt
echo --- Go Version --- >> debug_log.txt
go version >> debug_log.txt 2>&1
echo. >> debug_log.txt
echo --- Wails Version --- >> debug_log.txt
wails version >> debug_log.txt 2>&1
