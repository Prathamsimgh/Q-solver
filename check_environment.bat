@echo off
set "PATH=C:\msys64\mingw64\bin;C:\Program Files\Go\bin;C:\Users\ASUS\go\bin;%PATH%"
echo PATH SET TO: %PATH% > env_check.log
echo. >> env_check.log
echo --- GCC CHECK --- >> env_check.log
gcc --version >> env_check.log 2>&1
echo. >> env_check.log
echo --- GO CHECK --- >> env_check.log
go version >> env_check.log 2>&1
echo. >> env_check.log
echo --- WAILS DOCTOR --- >> env_check.log
wails doctor >> env_check.log 2>&1
echo DONE >> env_check.log
