@echo off
chcp 65001 > nul
title Skynix Magaza - Mod Ekle
cd /d "%~dp0"
node magaza-ekle.js
pause
