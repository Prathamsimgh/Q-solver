@echo off
set "PATH=C:\msys64\mingw64\bin;C:\Program Files\Go\bin;C:\Users\ASUS\go\bin;%PATH%"
echo --- Installing Frontend Dependencies --- > build_output.log
cd frontend
echo Running npm install... >> ..\build_output.log
call npm install >> ..\build_output.log 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Frontend install failed with code %ERRORLEVEL% >> ..\build_output.log
    exit /b %ERRORLEVEL%
)
cd ..
echo --- Building Wails App --- >> build_output.log
wails build -v 2 >> build_output.log 2>&1
echo Build finished with exit code %ERRORLEVEL% >> build_output.log
