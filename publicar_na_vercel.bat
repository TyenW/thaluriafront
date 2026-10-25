@echo off
title Thaluria RPG - Publicar na Vercel
chcp 65001 > nul

echo ================================================================================
echo   THALURIA RPG - PUBLICAR INTERFACE NA VERCEL
echo ================================================================================

echo [1/2] Validando compilacao do Front-End (npm run build)...
call npm run build
if errorlevel 1 (
    echo.
    echo Erro ao compilar o projeto! Verifique as mensagens acima.
    pause
    exit /b 1
)

echo.
echo [2/2] Iniciando assistente de publicacao da Vercel...
echo ================================================================================
echo Se for o primeiro acesso, o terminal abrira o navegador para autenticar.
echo Para publicar diretamente em Producao, execute: vercel --prod
echo ================================================================================
call vercel
echo.
pause
