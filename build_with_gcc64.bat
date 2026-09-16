@echo off
REM Add mingw64 to PATH (before the old 32-bit MinGW)
set "PATH=C:\msys64\mingw64\bin;C:\Program Files\Go\bin;C:\Users\ASUS\go\bin;%PATH%"
echo --- Build with 64-bit GCC --- > build_log2.txt
echo Using GCC: >> build_log2.txt
gcc --version >> build_log2.txt 2>&1
echo. >> build_log2.txt
echo --- Wails Build --- >> build_log2.txt
"C:\Users\ASUS\go\bin\wails.exe" build >> build_log2.txt 2>&1
echo Exit code: %ERRORLEVEL% >> build_log2.txt
