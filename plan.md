# Plan: STM32N6 Industrial Academy - 4 Módulos + Integrador

## Objetivo
Generar 4 módulos de curso HTML en paralelo para "STM32N6 Industrial Academy", más un archivo JSON integrador.

## Stage 1 — Generación Paralela de 4 Módulos HTML
Crear 4 subagentes especializados, cada uno genera un archivo HTML completo:

| Agente | Archivo | Skill |
|--------|---------|-------|
| Agente_1_Fundamentos | mod1-fundamentos.html | vibecoding-general-swarm |
| Agente_2_Sensores | mod2-sensores.html | vibecoding-general-swarm |
| Agente_3_Comunicaciones | mod3-comunicaciones.html | vibecoding-general-swarm |
| Agente_4_EdgeAI | mod4-edgeai.html | vibecoding-general-swarm |

Cada agente recibe:
- Especificaciones detalladas de contenido del usuario
- Estilo visual PWA industrial oscura (fondo #0f1117, cards #1a1d29, acento naranja #f59e0b, verde #10b981, texto #e5e7eb)
- Instrucción: HTML monolítico (CSS embebido + JS embebido), listo para copiar y pegar

### Requisitos por módulo:
- **Módulo 1 (Fundamentos)**: Arquitectura STM32N6, STM32CubeIDE, proyecto HAL blink LED, Clock Tree, GPIO. Código HAL comentado línea por línea, 3 quizzes JS interactivos, resumen.
- **Módulo 2 (Sensores)**: I2C (TMP117, OLED SSD1306), SPI (BMP280), ADC (4-20mA industrial), DMA. Código HAL, diagramas ASCII, ejercicios. Botón "Exportar a Wokwi" con popup de diagram.json + main.cpp.
- **Módulo 3 (Comunicaciones)**: UART RS-485, Modbus RTU maestro/esclavo (libmodbus), CAN bus filtros, Ethernet + MQTT (test.mosquitto.org). Tramas en texto, simulador terminal HTML para Modbus, 2 quizzes.
- **Módulo 4 (Edge AI)**: NPU Ethos-U55, STM32Cube.AI flujo, proyecto "Smart Factory Guardian" (vibración anómala con acelerómetro + NPU), dataset CSV 20 muestras, código inferencia, gráfico CPU vs NPU, export Wokwi. Estilo: alertas industriales, gauges confianza IA.

## Stage 2 — Integrador JSON
Una vez terminados los 4 módulos:
- Agente_5_Integrador genera index-modulos.json con: título, descripción, archivo HTML, número de lecciones, duración estimada de cada módulo.
- Este JSON será consumido por app.js para menú de navegación dinámico.

## Stage 3 — Validación
Verificar que los 5 archivos existen y el JSON es válido.
