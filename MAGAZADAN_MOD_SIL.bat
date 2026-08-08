@echo off
chcp 65001 > nul
title Skynix Magaza - Mod Sil
cd /d "%~dp0"
node magaza-sil.js
pause
