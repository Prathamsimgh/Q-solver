@echo off
echo Installing Go...
winget install GoLang.Go -e --source winget --accept-package-agreements --accept-source-agreements
if %ERRORLEVEL% EQU 0 (
    echo Go installed successfully.
) else (
    echo Go installation failed with error code %ERRORLEVEL%.
)
