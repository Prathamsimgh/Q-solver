@echo off
echo --- Winget Status --- > winget_log.txt
winget --version >> winget_log.txt 2>&1
