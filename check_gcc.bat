@echo off
echo --- GCC Check --- > gcc_check.txt
where gcc >> gcc_check.txt 2>&1
gcc --version >> gcc_check.txt 2>&1
echo. >> gcc_check.txt
echo --- Common mingw locations --- >> gcc_check.txt
dir "C:\mingw64\bin\gcc.exe" >> gcc_check.txt 2>&1
dir "C:\msys64\mingw64\bin\gcc.exe" >> gcc_check.txt 2>&1
dir "C:\ProgramData\mingw64\mingw64\bin\gcc.exe" >> gcc_check.txt 2>&1
