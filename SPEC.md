# SPEC.md — STM32N6 Industrial Academy

## 1. Overview
4 módulos de curso en formato HTML monolítico (CSS+JS embebidos) para formación industrial en STM32N6. Estilo PWA industrial oscura. Cada módulo es un archivo HTML autónomo.

## 2. Estilo Visual Global (aplica a los 4 módulos)

### Paleta de colores
- Fondo principal: `#0f1117` (gris muy oscuro)
- Cards/secciones: `#1a1d29` (gris oscuro azulado)
- Acento primario (energía): `#f59e0b` (naranja ámbar)
- Acento secundario (éxito): `#10b981` (verde esmeralda)
- Acento alerta: `#ef4444` (rojo)
- Acento info: `#3b82f6` (azul)
- Texto principal: `#e5e7eb` (gris claro)
- Texto secundario: `#9ca3af` (gris medio)
- Borde sutil: `#2d3142`

### Tipografía
- `font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;`
- Títulos: 1.8rem–2.2rem, weight 700
- Subtítulos: 1.3rem–1.5rem, weight 600
- Body: 0.95rem–1rem, line-height 1.7
- Código: `'Fira Code', 'Consolas', monospace;` size 0.85rem

### Layout
- Contenedor principal: `max-width: 900px; margin: 0 auto; padding: 20px;`
- Cards: `border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #2d3142;`
- Sombra suave: `box-shadow: 0 4px 6px rgba(0,0,0,0.3);`
- Transiciones: `transition: all 0.3s ease;`

### Componentes compartidos
- **Header**: Título del módulo con línea de acento naranja debajo, badge de dificultad
- **Code blocks**: Fondo `#0d0f17`, borde izquierdo 4px `#f59e0b`, padding 16px, overflow-x auto, line-numbers opcionales
- **Quiz container**: Card con pregunta, 4 opciones tipo botón, feedback inmediato (verde/rojo), explicación tras responder
- **Botón primario**: `background: #f59e0b; color: #0f1117; border-radius: 8px; padding: 10px 20px; font-weight: 600;`
- **Progress bar**: Barra de progreso del módulo en la parte superior

## 3. Módulos

### Módulo 1 — Fundamentos (mod1-fundamentos.html)
**Branch**: `mod1-fundamentos`
**Lecciones**: 5
**Duración**: 45 minutos

Contenido:
1. **Introducción STM32N6**: Arquitectura Cortex-M55 + Ethos-U55 NPU. Diagrama de bloques en ASCII.
2. **Instalación STM32CubeIDE**: Paso a paso con capturas descriptivas en texto.
3. **Primer proyecto HAL**: Blink LED en PC13. Código HAL completo comentado línea por línea.
4. **Clock Tree básico**: Explicación de HSI, HSE, PLL, AHB, APB. Diagrama ASCII del árbol de relojes.
5. **GPIO entrada/salida**: Configuración de GPIO_InitTypeDef, modos push-pull/open-drain, pull-up/pull-down.

Interactivo:
- 3 quizzes con JavaScript (respuesta correcta/incorrecta, feedback inmediato con color y explicación)
- Resumen final tipo card con checklist de conceptos aprendidos

### Módulo 2 — Sensores (mod2-sensores.html)
**Branch**: `mod2-sensores`
**Lecciones**: 4
**Duración**: 60 minutos

Contenido:
1. **I2C - TMP117 + OLED SSD1306**: Código HAL para lectura de temperatura de alta precisión y display en OLED. Diagrama de conexiones ASCII.
2. **SPI - BMP280**: Lectura de presión/temperatura vía SPI. Código HAL funcional. Diagrama ASCII.
3. **ADC - Sensor 4-20mA industrial**: Conversión de señal 4-20mA a presión (0-100 PSI). Fórmula de conversión, calibración, código HAL con promedio de muestras.
4. **DMA para adquisición continua**: Configuración de DMA en modo circular, doble buffer, callback Half/Complete.

Por cada sección:
- Código HAL funcional completo
- Diagrama de conexiones en texto ASCII
- Ejercicio práctico al final

Interactivo:
- Botón "Exportar a Wokwi": muestra popup modal con diagram.json y main.cpp listos para copiar y pegar en Wokwi

### Módulo 3 — Comunicaciones (mod3-comunicaciones.html)
**Branch**: `mod3-comunicaciones`
**Lecciones**: 4
**Duración**: 55 minutos

Contenido:
1. **UART para RS-485**: Configuración UART con control de dirección (DE/RE pin), código HAL, tramas de ejemplo en formato texto hexadecimal.
2. **Modbus RTU maestro/esclavo**: Implementación usando librería libmodbus. Código funcional C, estructura de tramas (dirección, función, datos, CRC).
3. **CAN bus industrial**: Configuración básica de filtros de CAN, código HAL, explicación de máscaras y IDs.
4. **Ethernet + MQTT ligero**: Conexión a broker público test.mosquitto.org, código lwMQTT, publish/subscribe a topics industriales.

Interactivo:
- Capturas de tramas en formato texto legible (hex dump estilo wireshark)
- Simulador de terminal integrado: input de comandos Modbus, respuesta simulada con parsing
- 2 quizzes con JavaScript

### Módulo 4 — Edge AI (mod4-edgeai.html)
**Branch**: `mod4-edgeai`
**Lecciones**: 4
**Duración**: 70 minutos

Contenido:
1. **Introducción NPU Ethos-U55**: Qué es una NPU, diferencia CPU vs NPU, capacidades del Ethos-U55 en STM32N6.
2. **Flujo STM32Cube.AI**: Convertir modelo .tflite a código C optimizado. Paso a paso con capturas descriptivas.
3. **Proyecto "Smart Factory Guardian"**: Clasificación de vibración anómala usando acelerómetro + NPU. Dataset sintético de 20 muestras (CSV en texto), código de inferencia completo, interpretación de resultados.
4. **Comparación CPU vs NPU**: Gráfico de barras/tiempo de inferencia, speedup, eficiencia energética.

Interactivo:
- Dataset CSV de 20 muestras sintéticas (3 ejes acelerómetro + label) en bloque de texto copiable
- Código de inferencia con comentarios
- Gráfico comparativo CPU vs NPU (barras horizontales con tiempos)
- Gauge circular de confianza de la IA (CSS/JS)
- Alertas industriales visuales (badge de estado: NORMAL/ALERTA/CRÍTICO)
- Exportación a Wokwi (popup con diagram.json y main.cpp)
- Estilo: alertas industriales con colores semáforo, gauges de confianza

## 4. Archivo JSON Integrador (index-modulos.json)

Generado tras completar los 4 módulos. Estructura:

```json
{
  "academy": "STM32N6 Industrial Academy",
  "version": "1.0.0",
  "modules": [
    {
      "id": "mod1",
      "title": "Fundamentos STM32N6",
      "description": "Arquitectura, HAL, GPIO, Clock Tree y primer proyecto",
      "file": "mod1-fundamentos.html",
      "lessons": 5,
      "durationMinutes": 45,
      "difficulty": "Principiante",
      "tags": ["HAL", "GPIO", "Clock", "Cortex-M55"]
    },
    ...
  ]
}
```

## 5. Convenciones de Código
- Todo el CSS debe ir en `<style>` dentro del `<head>`
- Todo el JS debe ir en `<script>` al final del `<body>`
- No usar archivos externos (fuentes de CDN permitidas: Google Fonts, FontAwesome si es necesario)
- Código C/C++ en bloques `<pre><code>` con clase `.code-block`
- Comentarios en español
- Cada módulo debe ser 100% funcional al abrirlo en un navegador
