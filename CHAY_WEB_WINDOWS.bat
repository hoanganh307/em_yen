@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Hay cai Node.js 22.13 tro len, sau do mo lai file nay.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Dang cai thu vien. Vui long doi...
  call npm ci
  if errorlevel 1 (
    echo Cai thu vien chua thanh cong. Xem thong bao loi o tren.
    pause
    exit /b 1
  )
)
echo Mo dia chi localhost ma Terminal in ra. Nhan Ctrl+C de dung.
call npm run dev
pause
