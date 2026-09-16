@echo off
tasklist /FI "IMAGENAME eq Q-Solver.exe" > app_status.txt 2>&1
type app_status.txt
