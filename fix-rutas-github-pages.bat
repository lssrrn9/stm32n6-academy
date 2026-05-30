@echo off
chcp 65001 >nul
echo ============================================
echo  FIX RUTAS - STM32N6 Academy
echo  Corrige rutas absolutas para GitHub Pages
echo ============================================
echo.

REM Verificar que estamos en la carpeta correcta
if not exist "index.html" (
    echo ERROR: No se encontro index.html en esta carpeta.
    echo Por favor, ejecuta este script DENTRO de la carpeta stm32n6-academy.
    pause
    exit /b 1
)

echo [1/4] Corrigiendo archivos HTML...

powershell -Command "Get-ChildItem -Filter '*.html' | ForEach-Object { 
    $content = Get-Content $_.FullName -Raw; 
    $original = $content; 
    $content = $content -replace 'href="/"', 'href="./"'; 
    $content = $content -replace 'href="/([^"])', 'href="./$1'; 
    $content = $content -replace 'src="/"', 'src="./"'; 
    $content = $content -replace 'src="/([^"])', 'src="./$1'; 
    $content = $content -replace 'url\(/\)', 'url(./)'; 
    $content = $content -replace 'url\(/([^\)])', 'url(./$1'; 
    if ($content -ne $original) { 
        Set-Content -Path $_.FullName -Value $content -NoNewline; 
        Write-Host ('  [OK] ' + $_.Name) -ForegroundColor Green; 
    } else { 
        Write-Host ('  [--] ' + $_.Name + ' (sin cambios)') -ForegroundColor DarkGray; 
    } 
}"

echo.
echo [2/4] Corrigiendo archivos JS...

powershell -Command "Get-ChildItem -Filter '*.js' | ForEach-Object { 
    $content = Get-Content $_.FullName -Raw; 
    $original = $content; 
    $content = $content -replace '"/"', '"./"'; 
    $content = $content -replace '"/([^"])', '"./$1'; 
    if ($content -ne $original) { 
        Set-Content -Path $_.FullName -Value $content -NoNewline; 
        Write-Host ('  [OK] ' + $_.Name) -ForegroundColor Green; 
    } else { 
        Write-Host ('  [--] ' + $_.Name + ' (sin cambios)') -ForegroundColor DarkGray; 
    } 
}"

echo.
echo [3/4] Corrigiendo manifest.json...

if exist "manifest.json" (
    powershell -Command "$f='manifest.json'; $c=Get-Content $f -Raw; $o=$c; $c=$c -replace '"/"','"./"'; $c=$c -replace '"/([^"])','"./$1'; if($c -ne $o){Set-Content $f $c -NoNewline; Write-Host '  [OK] manifest.json' -ForegroundColor Green}else{Write-Host '  [--] manifest.json (sin cambios)' -ForegroundColor DarkGray}"
)

echo.
echo [4/4] Verificando index.html...

powershell -Command "
    $f='index.html'; 
    $c=Get-Content $f -Raw; 
    if ($c -match 'href="/(mod|dashboard|simulador)') { 
        Write-Host '  [WARN] index.html aun tiene rutas absolutas!' -ForegroundColor Red; 
    } else { 
        Write-Host '  [OK] index.html rutas correctas' -ForegroundColor Green; 
    }"

echo.
echo ============================================
echo  CORRECCION COMPLETADA
echo ============================================
echo.
echo Ahora sube los archivos corregidos a GitHub:
echo   1. Ve a tu repo en GitHub
echo   2. Add file -^> Upload files
echo   3. Arrastra TODOS los archivos de esta carpeta
echo   4. Commit changes
echo   5. Espera 2 minutos y prueba la URL
echo.
pause
