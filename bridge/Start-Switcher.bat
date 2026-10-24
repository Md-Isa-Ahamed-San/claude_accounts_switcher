@echo off
title Claude Multi-Deck (Next.js)
cd /d "%~dp0\.."
echo Starting Claude Multi-Deck Next.js Desktop Switcher...
start http://localhost:3000
pnpm dev
pause
