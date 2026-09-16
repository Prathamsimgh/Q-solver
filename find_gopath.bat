@echo off
echo --- GOPATH --- > gopath.txt
"C:\Program Files\Go\bin\go.exe" env GOPATH >> gopath.txt 2>&1
echo --- GOBIN --- >> gopath.txt
"C:\Program Files\Go\bin\go.exe" env GOBIN >> gopath.txt 2>&1
echo --- Wails location --- >> gopath.txt
dir "%USERPROFILE%\go\bin\wails.exe" >> gopath.txt 2>&1
where wails >> gopath.txt 2>&1
