@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$files=Get-ChildItem -LiteralPath '.\assets\banners' -File -Filter '*.png' | Sort-Object Name | ForEach-Object { $_.Name }; @{banners=@($files)} | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath '.\assets\banners\manifest.json' -Encoding UTF8"
echo.
echo Da cap nhat assets\banners\manifest.json
pause
