/**
 * ============================================================================
 * STM32N6 Industrial Academy - app.js
 * ============================================================================
 * PWA con Router SPA, sistema de progreso, detección offline y loader.
 * Vanilla JavaScript. Sin frameworks externos.
 * ============================================================================
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. CONFIGURACIÓN GLOBAL
     ========================================================================== */
  const CONFIG = {
    // Nombre de la clave en localStorage para persistencia de progreso
    STORAGE_KEY: 'n6_academy_progress',
    // Duración del loader en milisegundos
    LOADER_DURATION: 1500,
    // Módulos disponibles con sus lecciones
    MODULES: {
      fundamentos: {
        title: 'Fundamentos',
        lessons: [
          { id: 'f1', title: 'Introducción al STM32N6', duration: 25 },
          { id: 'f2', title: 'Entorno de Desarrollo', duration: 35 },
          { id: 'f3', title: 'GPIO Avanzados y Timers', duration: 45 },
          { id: 'f4', title: 'Interrupciones y NVIC', duration: 40 },
          { id: 'f5', title: 'DMA y Transferencias', duration: 30 },
          { id: 'f6', title: 'Clock Tree y PLL', duration: 35 },
          { id: 'f7', title: 'Low Power Modes', duration: 25 },
          { id: 'f8', title: 'Memory Map y Flash', duration: 30 },
          { id: 'f9', title: 'Debug y Trace', duration: 20 },
          { id: 'f10', title: 'Proyecto: Blink Industrial', duration: 45 },
          { id: 'f11', title: 'Proyecto: PWM Motor', duration: 50 },
          { id: 'f12', title: 'Evaluación Módulo 1', duration: 30 }
        ]
      },
      sensores: {
        title: 'Sensores',
        lessons: [
          { id: 's1', title: 'ADC de 16 bits', duration: 35 },
          { id: 's2', title: 'Oversampling y FIR', duration: 30 },
          { id: 's3', title: 'Sensores 4-20mA', duration: 40 },
          { id: 's4', title: 'RTD y Termopares', duration: 35 },
          { id: 's5', title: 'Acelerómetros MEMS', duration: 30 },
          { id: 's6', title: 'Filtros Kalman', duration: 45 },
          { id: 's7', title: 'Proyecto: Estación Clima', duration: 50 },
          { id: 's8', title: 'Evaluación Módulo 2', duration: 25 }
        ]
      },
      comunicaciones: {
        title: 'Comunicaciones',
        lessons: [
          { id: 'c1', title: 'UART y RS-485', duration: 30 },
          { id: 'c2', title: 'Modbus RTU', duration: 45 },
          { id: 'c3', title: 'Modbus TCP', duration: 40 },
          { id: 'c4', title: 'CAN y CANopen', duration: 50 },
          { id: 'c5', title: 'Ethernet y LWIP', duration: 45 },
          { id: 'c6', title: 'MQTT sobre TLS', duration: 40 },
          { id: 'c7', title: 'OPC-UA Compact', duration: 50 },
          { id: 'c8', title: 'EtherCAT Básico', duration: 45 },
          { id: 'c9', title: 'Proyecto: Gateway IIoT', duration: 60 },
          { id: 'c10', title: 'Evaluación Módulo 3', duration: 30 }
        ]
      },
      edgeai: {
        title: 'Edge AI',
        lessons: [
          { id: 'e1', title: 'Neural-ART Overview', duration: 35 },
          { id: 'e2', title: 'STM32Cube.AI Workflow', duration: 45 },
          { id: 'e3', title: 'Cuantización INT8', duration: 40 },
          { id: 'e4', title: 'NPU vs CPU Inference', duration: 35 },
          { id: 'e5', title: 'Proyecto: Anomaly Detection', duration: 60 },
          { id: 'e6', title: 'Proyecto: Vision Industrial', duration: 75 }
        ]
      }
    }
  };

  /* ==========================================================================
     2. ESTADO DE LA APLICACIÓN
     ========================================================================== */
  const State = {
    // Módulo actual activo en el router
    currentModule: 'fundamentos',
    // Sidebar colapsado (desktop)
    sidebarCollapsed: false,
    // Estado de conexión
    isOnline: navigator.onLine,
    // Datos de progreso del usuario (cargados desde localStorage)
    progress: null
  };

  /* ==========================================================================
     3. SISTEMA DE PROGRESO (localStorage)
     ========================================================================== */

  /**
   * Inicializa o carga el objeto de progreso desde localStorage.
   * Si no existe, crea la estructura base con 0% en todos los módulos.
   */
  function initProgress() {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (raw) {
      try {
        State.progress = JSON.parse(raw);
        // Validar integridad: asegurar que existan todos los módulos
        Object.keys(CONFIG.MODULES).forEach(modId => {
          if (!State.progress.modules[modId]) {
            State.progress.modules[modId] = createModuleProgress(modId);
          }
        });
      } catch (e) {
        console.warn('[N6 Academy] Datos corruptos en localStorage. Reiniciando progreso.');
        State.progress = createDefaultProgress();
      }
    } else {
      State.progress = createDefaultProgress();
    }
    saveProgress();
  }

  /**
   * Crea la estructura de progreso por defecto.
   */
  function createDefaultProgress() {
    const modules = {};
    Object.keys(CONFIG.MODULES).forEach(modId => {
      modules[modId] = createModuleProgress(modId);
    });
    return {
      version: 1,
      lastUpdated: new Date().toISOString(),
      totalProgress: 0,
      modules: modules
    };
  }

  /**
   * Crea el objeto de progreso para un módulo específico.
   * @param {string} modId - ID del módulo
   */
  function createModuleProgress(modId) {
    const moduleData = CONFIG.MODULES[modId];
    const lessons = {};
    moduleData.lessons.forEach(lesson => {
      lessons[lesson.id] = {
        completed: false,
        timestamp: null,
        duration: lesson.duration
      };
    });
    return {
      moduleProgress: 0,     // Porcentaje 0-100 del módulo
      lessonsCompleted: 0,   // Contador de lecciones completadas
      totalLessons: moduleData.lessons.length,
      lessons: lessons
    };
  }

  /**
   * Persiste el progreso actual en localStorage.
   */
  function saveProgress() {
    State.progress.lastUpdated = new Date().toISOString();
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(State.progress));
  }

  /**
   * Marca una lección específica como completada.
   * Actualiza el progreso del módulo y el progreso global.
   * @param {string} modId - ID del módulo
   * @param {string} lessonId - ID de la lección
   * @returns {boolean} - true si fue la primera vez que se completó
   */
  function markLessonComplete(modId, lessonId) {
    if (!State.progress.modules[modId]) return false;

    const moduleProgress = State.progress.modules[modId];
    const lesson = moduleProgress.lessons[lessonId];

    if (!lesson || lesson.completed) {
      return false; // Ya estaba completada o no existe
    }

    // Marcar como completada
    lesson.completed = true;
    lesson.timestamp = new Date().toISOString();
    moduleProgress.lessonsCompleted += 1;

    // Recalcular porcentaje del módulo
    moduleProgress.moduleProgress = Math.round(
      (moduleProgress.lessonsCompleted / moduleProgress.totalLessons) * 100
    );

    // Recalcular progreso global (promedio ponderado por cantidad de lecciones)
    recalcTotalProgress();

    // Guardar y actualizar UI
    saveProgress();
    updateProgressUI();
    updateModuleBadges();

    return true;
  }

  /**
   * Recalcula el progreso total de todos los módulos.
   */
  function recalcTotalProgress() {
    let totalLessons = 0;
    let completedLessons = 0;

    Object.values(State.progress.modules).forEach(mod => {
      totalLessons += mod.totalLessons;
      completedLessons += mod.lessonsCompleted;
    });

    State.progress.totalProgress = totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;
  }

  /**
   * Obtiene el resumen de progreso para mostrar en la UI.
   * @returns {Object} - { total, modules: { modId: { progress, completed, total } } }
   */
  function getProgressSummary() {
    const summary = {
      total: State.progress.totalProgress,
      modules: {}
    };
    Object.entries(State.progress.modules).forEach(([modId, mod]) => {
      summary.modules[modId] = {
        progress: mod.moduleProgress,
        completed: mod.lessonsCompleted,
        total: mod.totalLessons
      };
    });
    return summary;
  }

  /**
   * Reinicia el progreso de un módulo específico (útil para reintentar).
   * @param {string} modId - ID del módulo
   */
  function resetModuleProgress(modId) {
    if (!State.progress.modules[modId]) return;
    State.progress.modules[modId] = createModuleProgress(modId);
    recalcTotalProgress();
    saveProgress();
    updateProgressUI();
    updateModuleBadges();
  }

  /* ==========================================================================
     4. ROUTER SPA (Single Page Application)
     ========================================================================== */

  /**
   * Navega a un módulo sin recargar la página.
   * Actualiza la URL con hash y renderiza el contenido dinámico.
   * @param {string} modId - ID del módulo destino
   */
  function navigateTo(modId) {
    if (!CONFIG.MODULES[modId]) {
      console.error(`[N6 Academy] Módulo "${modId}" no existe.`);
      return;
    }

    // Actualizar hash en URL (permite deep linking y botón atrás)
    window.location.hash = modId;

    // Actualizar estado
    State.currentModule = modId;

    // Actualizar UI de navegación lateral
    updateSidebarActive(modId);

    // Renderizar contenido del módulo
    renderModule(modId);

    // Actualizar header y breadcrumb
    updateHeader(modId);

    // Cerrar sidebar en móvil
    if (window.innerWidth <= 768) {
      closeSidebar();
    }

    // Scroll al top del contenido
    const contentArea = document.getElementById('contentArea');
    if (contentArea) contentArea.scrollTop = 0;
  }

  /**
   * Renderiza el contenido dinámico de un módulo en el área principal.
   * Genera las tarjetas de lecciones con su estado de progreso actual.
   * @param {string} modId - ID del módulo
   */
  function renderModule(modId) {
    const moduleData = CONFIG.MODULES[modId];
    const modProgress = State.progress.modules[modId];
    const container = document.getElementById('contentArea');
    if (!container) return;

    // Calcular estadísticas
    const completedCount = modProgress.lessonsCompleted;
    const totalCount = modProgress.totalLessons;
    const modulePercent = modProgress.moduleProgress;
    const totalDuration = moduleData.lessons.reduce((sum, l) => sum + l.duration, 0);

    // Generar HTML de las tarjetas de lección
    const lessonsHTML = moduleData.lessons.map((lesson, index) => {
      const lessonState = modProgress.lessons[lesson.id];
      const isCompleted = lessonState.completed;
      const lessonPercent = isCompleted ? 100 : 0;

      // Dificultad simulada según posición
      let diffClass = 'difficulty-beginner';
      let diffLabel = 'Básico';
      if (index > 3 && index < 7) { diffClass = 'difficulty-intermediate'; diffLabel = 'Intermedio'; }
      if (index >= 7) { diffClass = 'difficulty-advanced'; diffLabel = 'Avanzado'; }

      // Icono según estado
      const icon = isCompleted ? '✅' : (index === completedCount ? '▶️' : '🔒');
      const bannerGradient = isCompleted
        ? 'linear-gradient(135deg, rgba(0,200,83,0.2), rgba(0,200,83,0.05))'
        : 'linear-gradient(135deg, var(--bg-tertiary), var(--bg-secondary))';

      return `
        <div class="course-card ${isCompleted ? 'lesson-completed' : ''}" 
             onclick="N6App.openLesson('${modId}', '${lesson.id}')"
             style="cursor:pointer;">
          <div class="course-banner" style="background: ${bannerGradient};">
            <span class="course-banner-icon">${icon}</span>
            <span class="course-difficulty ${diffClass}">${diffLabel}</span>
          </div>
          <div class="course-body">
            <div class="course-title">${index + 1}. ${lesson.title}</div>
            <div class="course-desc">${getLessonDescription(modId, lesson.id)}</div>
            <div class="course-meta">
              <span class="course-duration">⏱ ${lesson.duration} min</span>
              <div class="course-progress-mini">
                <div class="course-progress-mini-bar">
                  <div class="course-progress-mini-fill" style="width:${lessonPercent}%"></div>
                </div>
                <span class="course-progress-mini-text">${lessonPercent}%</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Construir HTML completo del módulo
    container.innerHTML = `
      <div class="module-container active" id="module-${modId}">
        <div class="module-header">
          <h1>${moduleData.title}</h1>
          <p>${getModuleDescription(modId)}</p>
        </div>

        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-icon">📚</div>
            <div class="stat-info">
              <div class="stat-value">${totalCount}</div>
              <div class="stat-label">Lecciones</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">⏱️</div>
            <div class="stat-info">
              <div class="stat-value">${(totalDuration / 60).toFixed(1)}h</div>
              <div class="stat-label">Duración</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🎯</div>
            <div class="stat-info">
              <div class="stat-value">${modulePercent}%</div>
              <div class="stat-label">Completado</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div class="stat-info">
              <div class="stat-value">${completedCount}/${totalCount}</div>
              <div class="stat-label">Lecciones Hechas</div>
            </div>
          </div>
        </div>

        <div class="course-grid">
          ${lessonsHTML}
        </div>
      </div>
    `;
  }

  /**
   * Abre una lección específica (simulado - muestra toast y marca completa opcional).
   * @param {string} modId - ID del módulo
   * @param {string} lessonId - ID de la lección
   */
  function openLesson(modId, lessonId) {
    const moduleData = CONFIG.MODULES[modId];
    const lesson = moduleData.lessons.find(l => l.id === lessonId);
    if (!lesson) return;

    const isCompleted = State.progress.modules[modId].lessons[lessonId].completed;

    if (isCompleted) {
      showToast(`📖 "${lesson.title}" — Ya completada`);
    } else {
      // Simulación: al abrir una lección, ofrece marcarla como completada
      showToast(`▶️ Reproduciendo: "${lesson.title}" (${lesson.duration} min)`);

      // Auto-completar después de 3 segundos (simulación de finalización)
      setTimeout(() => {
        const firstTime = markLessonComplete(modId, lessonId);
        if (firstTime) {
          showToast(`✅ ¡"${lesson.title}" completada! +${lesson.duration} min`);
          // Re-renderizar para actualizar barras
          renderModule(modId);
        }
      }, 3000);
    }
  }

  /**
   * Obtiene descripción de un módulo.
   */
  function getModuleDescription(modId) {
    const descriptions = {
      fundamentos: 'Arquitectura Cortex-M55, periféricos esenciales, herramientas de desarrollo y primeros pasos con el ecosistema ST. Base sólida para proyectos industriales.',
      sensores: 'Integración de sensores analógicos y digitales: ADC de alta resolución, sensores de corriente, temperatura, presión y acelerómetros para aplicaciones IIoT.',
      comunicaciones: 'Protocolos de campo y Ethernet industrial: Modbus RTU/TCP, CANopen, EtherCAT, OPC-UA y MQTT para arquitecturas IIoT modernas.',
      edgeai: 'Despliegue de modelos de machine learning en el STM32N6: conversión con STM32Cube.AI, optimización de cuantización, inferencia en tiempo real y visión industrial.'
    };
    return descriptions[modId] || '';
  }

  /**
   * Obtiene descripción de una lección específica.
   */
  function getLessonDescription(modId, lessonId) {
    const descMap = {
      fundamentos: {
        f1: 'Arquitectura de la serie, diferencias con STM32H7, capacidades de Neural-ART y NPU integrada.',
        f2: 'STM32CubeIDE, STM32CubeMX, configuración de toolchains y depuración con ST-Link.',
        f3: 'Configuración de pines, modos alternativos, PWM de alta resolución, capture/compare.',
        f4: 'Prioridades, preemption, latency, manejo de excepciones en tiempo real industrial.',
        f5: 'Configuración de canales, burst mode, double buffer, transferencias memoria-a-memoria.',
        f6: 'PLL, HSE, LSE, HSI, configuración de buses AHB/APB y límites de velocidad.',
        f7: 'Sleep, Stop, Standby modes. Consumo energético y wake-up sources.',
        f8: 'Mapa de memoria, sectores de Flash, opciones de boot, write protection.',
        f9: 'SWD, JTAG, ITM, DWT, ETM. Trace de tiempo real con STM32CubeMonitor.',
        f10: 'Proyecto práctico: LED industrial con watchdog y monitoreo de temperatura.',
        f11: 'Control de velocidad de motor DC con PWM y feedback de encoder.',
        f12: 'Evaluación teórica-práctica del módulo 1.'
      },
      sensores: {
        s1: 'Configuración del ADC de 16 bits, sampling time, resolution y alignment.',
        s2: 'Técnicas de oversampling, filtros FIR digitales y eliminación de ruido.',
        s3: 'Interfaz con sensores industriales estándar 4-20mA usando resistencia de shunt.',
        s4: 'Medición de temperatura con RTD PT100 y termopares tipo K.',
        s5: 'LIS3DH, MPU6050: configuración I2C/SPI, rangos y data ready interrupts.',
        s6: 'Implementación de filtro Kalman en C para fusión de sensores.',
        s7: 'Proyecto: estación meteorológica industrial con logging SD.',
        s8: 'Evaluación teórica-práctica del módulo 2.'
      },
      comunicaciones: {
        c1: 'Configuración UART, RS-485 half-duplex, control de dirección DE/RE.',
        c2: 'Implementación de stack Modbus RTU maestro/esclavo con CRC16.',
        c3: 'Modbus TCP sobre Ethernet, mapeo de registros holding coils.',
        c4: 'Protocolo CAN 2.0B, objeto diccionario CANopen, PDO/SDO mapeo.',
        c5: 'Stack LWIP, configuración de IP estática/DHCP, sockets TCP.',
        c6: 'Cliente MQTT con TLS 1.3, certificados X.509, QoS 0/1/2.',
        c7: 'Servidor OPC-UA compacto con nodos variables y suscripciones.',
        c8: 'Fundamentos de EtherCAT: sync manager, distributed clocks.',
        c9: 'Proyecto: Gateway IIoT que traduce Modbus RTU a MQTT cloud.',
        c10: 'Evaluación teórica-práctica del módulo 3.'
      },
      edgeai: {
        e1: 'Arquitectura Neural-ART, NPU, DSP y CPU Cortex-M55 en cooperación.',
        e2: 'Flujo completo: entrenamiento → conversión → validación → despliegue.',
        e3: 'Cuantización post-entrenamiento INT8/INT4, calibración con dataset representativo.',
        e4: 'Benchmarking: latencia y consumo comparando NPU vs CPU en inferencia.',
        e5: 'Proyecto: detección de anomalías en vibraciones de motor con Autoencoder.',
        e6: 'Proyecto: clasificación de defectos en línea de producción con CNN.'
      }
    };
    return (descMap[modId] && descMap[modId][lessonId]) || 'Contenido en desarrollo.';
  }

  /**
   * Actualiza la clase activa en el menú lateral.
   */
  function updateSidebarActive(modId) {
    document.querySelectorAll('.nav-item[data-module]').forEach(item => {
      item.classList.remove('active');
      if (item.dataset.module === modId) {
        item.classList.add('active');
      }
    });
  }

  /**
   * Actualiza el header con el título y breadcrumb del módulo activo.
   */
  function updateHeader(modId) {
    const titleEl = document.getElementById('headerTitle');
    const breadcrumbEl = document.getElementById('breadcrumbModule');
    if (titleEl) titleEl.textContent = CONFIG.MODULES[modId].title;
    if (breadcrumbEl) breadcrumbEl.textContent = CONFIG.MODULES[modId].title;
  }

  /**
   * Maneja el cambio de hash en la URL (navegación con botón atrás/adelante).
   */
  function handleHashChange() {
    const hash = window.location.hash.replace('#', '') || 'fundamentos';
    if (CONFIG.MODULES[hash] && hash !== State.currentModule) {
      navigateTo(hash);
    }
  }

  /* ==========================================================================
     5. LOADER INICIAL
     ========================================================================== */

  /**
   * Ejecuta la secuencia de carga inicial.
   * Muestra el loader con barra de progreso simulada y lo oculta tras 1.5s.
   */
  function runLoader() {
    const loader = document.getElementById('loader');
    const app = document.getElementById('app');
    const bar = document.getElementById('loaderBar');

    if (!loader || !app) {
      // Fallback si no existe el loader en el DOM
      initApp();
      return;
    }

    let progress = 0;
    const startTime = Date.now();

    // Animación de la barra de progreso
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      progress = Math.min((elapsed / CONFIG.LOADER_DURATION) * 100, 100);
      if (bar) bar.style.width = progress + '%';

      if (elapsed >= CONFIG.LOADER_DURATION) {
        clearInterval(interval);
        // Ocultar loader y mostrar app
        loader.classList.add('hidden');
        app.classList.add('ready');
        // Inicializar aplicación
        initApp();
      }
    }, 50);
  }

  /* ==========================================================================
     6. DETECCIÓN ONLINE / OFFLINE
     ========================================================================== */

  /**
   * Configura los listeners para detectar cambios de conectividad.
   * Actualiza el indicador visual en el footer.
   */
  function setupNetworkDetection() {
    const dot = document.getElementById('statusDot');
    const text = document.getElementById('statusText');

    function updateStatus() {
      const online = navigator.onLine;
      State.isOnline = online;
      if (dot && text) {
        if (online) {
          dot.classList.remove('offline');
          text.textContent = 'Conectado';
        } else {
          dot.classList.add('offline');
          text.textContent = 'Modo Offline';
        }
      }
      // Notificar al usuario del cambio
      if (online) {
        showToast('🌐 Conexión restaurada');
      } else {
        showToast('📴 Modo offline activado. El progreso se guarda localmente.');
      }
    }

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    // Estado inicial
    updateStatus();
  }

  /* ==========================================================================
     7. UI HELPERS
     ========================================================================== */

  /**
   * Actualiza la barra de progreso general en el header.
   */
  function updateProgressUI() {
    const fill = document.getElementById('progressBarFill');
    const percent = document.getElementById('progressPercent');
    if (fill) fill.style.width = State.progress.totalProgress + '%';
    if (percent) percent.textContent = State.progress.totalProgress + '%';
  }

  /**
   * Actualiza los badges numéricos en el sidebar (lecciones completadas por módulo).
   */
  function updateModuleBadges() {
    Object.entries(State.progress.modules).forEach(([modId, mod]) => {
      const navItem = document.querySelector(`.nav-item[data-module="${modId}"]`);
      if (navItem) {
        const badge = navItem.querySelector('.nav-badge');
        if (badge) {
          badge.textContent = `${mod.lessonsCompleted}/${mod.totalLessons}`;
          // Cambiar color si el módulo está completo
          if (mod.lessonsCompleted === mod.totalLessons) {
            badge.style.background = 'var(--accent-green)';
            badge.style.color = '#000';
          }
        }
      }
    });
  }

  /**
   * Muestra un toast notification temporal.
   * @param {string} message - Texto a mostrar
   */
  function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';

    // Limpiar timeout anterior si existe
    if (toast._timeout) clearTimeout(toast._timeout);

    toast._timeout = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(100px)';
    }, 3000);
  }

  /**
   * Alterna el estado colapsado del sidebar (solo desktop).
   */
  function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const btn = document.getElementById('toggleBtn');

    if (window.innerWidth <= 768) {
      // Modo móvil: slide in/out
      sidebar.classList.toggle('open');
      overlay.classList.toggle('show');
    } else {
      // Modo desktop: colapsar/expandir
      sidebar.classList.toggle('collapsed');
      State.sidebarCollapsed = sidebar.classList.contains('collapsed');
      if (btn) btn.textContent = State.sidebarCollapsed ? '▶' : '◀';
    }
  }

  /**
   * Cierra el sidebar (útil para móvil al tocar overlay).
   */
  function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
  }

  /* ==========================================================================
     8. SERVICE WORKER (PWA)
     ========================================================================== */

  /**
   * Registra el Service Worker para funcionalidad offline.
   */
  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    const swCode = `
      const CACHE_NAME = 'n6-academy-v1';
      const ASSETS = [
        './',
        './index.html',
        './app.js'
      ];

      self.addEventListener('install', event => {
        event.waitUntil(
          caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
        );
        self.skipWaiting();
      });

      self.addEventListener('activate', event => {
        event.waitUntil(
          caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        );
        self.clients.claim();
      });

      self.addEventListener('fetch', event => {
        event.respondWith(
          caches.match(event.request).then(response => {
            return response || fetch(event.request).catch(() => {
              // Fallback para navegación offline
              if (event.request.mode === 'navigate') {
                return caches.match('./');
              }
            });
          })
        );
      });
    `;

    const blob = new Blob([swCode], { type: 'application/javascript' });
    const swUrl = URL.createObjectURL(blob);

    navigator.serviceWorker.register(swUrl)
      .then(reg => console.log('[N6 Academy] SW registrado:', reg.scope))
      .catch(err => console.warn('[N6 Academy] SW error:', err));
  }

  /* ==========================================================================
     9. INICIALIZACIÓN PRINCIPAL
     ========================================================================== */

  function initApp() {
    // 1. Cargar progreso desde localStorage
    initProgress();

    // 2. Configurar router y hash
    window.addEventListener('hashchange', handleHashChange);

    // 3. Detectar módulo inicial desde URL o default
    const initialHash = window.location.hash.replace('#', '');
    if (CONFIG.MODULES[initialHash]) {
      navigateTo(initialHash);
    } else {
      navigateTo('fundamentos');
    }

    // 4. Actualizar UI de progreso
    updateProgressUI();
    updateModuleBadges();

    // 5. Configurar detección de red
    setupNetworkDetection();

    // 6. Registrar Service Worker
    registerServiceWorker();

    // 7. Configurar listeners adicionales
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) closeSidebar();
    });

    console.log('[N6 Academy] App inicializada. Progreso global:', State.progress.totalProgress + '%');
  }

  /* ==========================================================================
     10. API PÚBLICA (expuesta globalmente para onclick en HTML)
     ========================================================================== */

  window.N6App = {
    navigateTo,
    openLesson,
    markLessonComplete,
    resetModuleProgress,
    toggleSidebar,
    closeSidebar,
    showToast,
    getProgressSummary,
    // Utilidades de debug
    _state: State,
    _config: CONFIG
  };

  // Iniciar loader cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runLoader);
  } else {
    runLoader();
  }

})();
