@echo off
set "PATH=C:\msys64\mingw64\bin;C:\Program Files\Go\bin;C:\Users\ASUS\go\bin;%PATH%"
echo --- Go Build Check --- > go_build_log.txt
go build -v -tags desktop,production,windows . >> go_build_log.txt 2>&1
echo Exit code: %ERRORLEVEL% >> go_build_log.txt
