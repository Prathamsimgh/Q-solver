@echo off
echo --- Winget List (Go) --- > winget_list.txt
winget list GoLang.Go >> winget_list.txt 2>&1
echo --- Check Go Path --- >> winget_list.txt
where go >> winget_list.txt 2>&1
dir "C:\Program Files\Go\bin" >> winget_list.txt 2>&1
