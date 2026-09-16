@echo off
echo Launching Q-Solver...
cd "build\bin"
start "" "Q-Solver.exe"
echo App launched. Waiting 5 seconds to verify process status...
timeout /t 5 >nul
tasklist /FI "IMAGENAME eq Q-Solver.exe"
