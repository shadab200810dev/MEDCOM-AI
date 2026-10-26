@echo off
setlocal
cd /d "%~dp0"

set "PYTHON_EXE="
where py >nul 2>nul
if not errorlevel 1 (
  for /f "delims=" %%P in ('py -3 -c "import sys; print(sys.executable)" 2^>nul') do if not defined PYTHON_EXE set "PYTHON_EXE=%%P"
)
if not defined PYTHON_EXE (
  for /f "delims=" %%P in ('python -c "import sys; print(sys.executable)" 2^>nul') do (
    if not defined PYTHON_EXE if /i not "%%P"=="%LOCALAPPDATA%\Microsoft\WindowsApps\python.exe" set "PYTHON_EXE=%%P"
  )
)
if not defined PYTHON_EXE (
  echo Python 3 was not found.
  echo Install Python 3.10 or newer from https://www.python.org/downloads/ and try again.
  pause
  exit /b 1
)

if not exist ".tmp" mkdir ".tmp"
set "TEMP=%CD%\.tmp"
set "TMP=%CD%\.tmp"
if not exist ".venv\Scripts\python.exe" (
  echo Creating the MEDCOM environment...
  "%PYTHON_EXE%" -m venv .venv
  if errorlevel 1 (
    echo Could not create the Python environment.
    pause
    exit /b 1
  )
)

".venv\Scripts\python.exe" -c "import flask" >nul 2>nul
if errorlevel 1 (
  echo Installing Flask. An internet connection is needed the first time.
  ".venv\Scripts\python.exe" -m pip install --disable-pip-version-check -r requirements.txt
  if errorlevel 1 (
    echo Package installation failed. Check your connection and try again.
    pause
    exit /b 1
  )
)

set "MEDCOM_OPEN_BROWSER=1"
echo MEDCOM AI is running at http://127.0.0.1:5000
".venv\Scripts\python.exe" -m backend.app
if errorlevel 1 (
  echo MEDCOM stopped. If port 5000 is already in use, stop the other server and retry.
  pause
)
