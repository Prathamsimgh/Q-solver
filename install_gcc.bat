@echo off
echo Installing mingw-w64 GCC toolchain...
C:\msys64\usr\bin\pacman.exe -S --noconfirm mingw-w64-x86_64-gcc > install_gcc.txt 2>&1
echo Exit code: %ERRORLEVEL% >> install_gcc.txt
