/**
 * ============================================================================
 * STM32N6 Industrial Academy - service-worker.js
 * ============================================================================
 * Service Worker con estrategia CACHE-FIRST.
 * Cachea todos los archivos estáticos para funcionamiento offline completo.
 * Compatible con Chrome, Edge, Firefox, Safari (iOS 11.3+).
 * ============================================================================
 */

'use strict';

// ---------------------------------------------------------------------------
// 1. CONFIGURACIÓN DE VERSIONES Y CACHE
// ---------------------------------------------------------------------------

// Nombre base del cache. Al cambiar la versión se invalidan caches antiguos.
const CACHE_NAME = 'n6-academy-static-v1';

// Nombre del cache dinámico para recursos que no están en la lista precacheada.
const DYNAMIC_CACHE = 'n6-academy-dynamic-v1';

// Lista de archivos estáticos a cachear durante la instalación (precache).
// Estos son los archivos esenciales para que la app funcione offline.
const PRECACHE_ASSETS = [
  '/',                    // Raíz: sirve index.html en la mayoría de servidores
  '/index.html',          // Página principal de la PWA
  '/app.js',              // Lógica de la aplicación (router, progreso, UI)
  '/db.js',               // Capa de persistencia con IndexedDB
  '/manifest.json',       // Manifest para instalación de la PWA
  // Cursos individuales (si existen como archivos separados)
  '/course-fundamentos.html',
  '/course-sensores.html',
  '/course-comunicaciones.html',
  '/course-edgeai.html',
  // Assets adicionales (si existen en el proyecto)
  '/styles.css',          // Si separas CSS en archivo externo
  '/assets/logo-n6.svg',  // Logo de la academia
  '/assets/icon-192.png', // Icono para fallback
  '/assets/icon-512.png'  // Icono grande para splash screens
];

// ---------------------------------------------------------------------------
// 2. EVENTO: INSTALL (Instalación)
// ---------------------------------------------------------------------------
// Se dispara cuando el navegador instala el Service Worker.
// Aquí precacheamos todos los archivos estáticos esenciales.
// ---------------------------------------------------------------------------

self.addEventListener('install', function (event) {
  // console.log('[SW] Instalando Service Worker...');

  // event.waitUntil() extiende la vida del evento hasta que la Promise se resuelva.
  // Esto evita que el SW se considere instalado antes de terminar el cacheo.
  event.waitUntil(
    caches.open(CACHE_NAME)           // Abrimos (o creamos) el cache con nombre definido.
      .then(function (cache) {
        // cache.addAll() recibe un array de URLs y las descarga en paralelo.
        // Si ALGUNA falla, toda la operación falla (Promise rechazada).
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(function () {
        // console.log('[SW] Precache completado:', PRECACHE_ASSETS.length, 'archivos');
        // skipWaiting() fuerza al SW a activarse inmediatamente,
        // sin esperar a que el usuario cierre todas las pestañas.
        return self.skipWaiting();
      })
      .catch(function (error) {
        // Si falla el precache (ej. archivo no existe en servidor), logueamos.
        console.error('[SW] Error en precache:', error);
        // Aunque falle algún archivo, continuamos para no bloquear la instalación.
        return self.skipWaiting();
      })
  );
});

// ---------------------------------------------------------------------------
// 3. EVENTO: ACTIVATE (Activación)
// ---------------------------------------------------------------------------
// Se dispara cuando el SW toma el control de las páginas.
// Aquí limpiamos caches antiguas para no consumir espacio innecesario.
// ---------------------------------------------------------------------------

self.addEventListener('activate', function (event) {
  // console.log('[SW] Activando Service Worker...');

  event.waitUntil(
    caches.keys()                   // Obtenemos todos los nombres de caches existentes.
      .then(function (cacheNames) {
        // Filtramos las caches que pertenecen a esta app pero son versiones viejas.
        return Promise.all(
          cacheNames.map(function (cacheName) {
            // Si el nombre empieza con 'n6-academy-' pero NO es el cache actual,
            // significa que es una versión anterior y debe eliminarse.
            if (cacheName.startsWith('n6-academy-') && cacheName !== CACHE_NAME) {
              // console.log('[SW] Eliminando cache antigua:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(function () {
        // clients.claim() fuerza al SW a tomar control inmediato de todas las
        // pestañas/ventanas del mismo origen, sin esperar a recargar.
        return self.clients.claim();
      })
  );
});

// ---------------------------------------------------------------------------
// 4. EVENTO: FETCH (Interceptación de peticiones)
// ---------------------------------------------------------------------------
// Estrategia: CACHE-FIRST (Cache First, luego Network)
// 1. Primero buscamos la respuesta en el cache local.
// 2. Si existe en cache, la retornamos inmediatamente (rápido, funciona offline).
// 3. Si NO existe en cache, hacemos fetch a la red.
// 4. Si el fetch de red tiene éxito, guardamos una copia en cache para la próxima vez.
// 5. Si todo falla (offline + no en cache), retornamos una respuesta de fallback.
// ---------------------------------------------------------------------------

self.addEventListener('fetch', function (event) {
  // Ignoramos peticiones que no sean GET (POST, PUT, DELETE van directo a red).
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignoramos peticiones a otros orígenes (CORS) para evitar problemas de seguridad.
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Interceptamos la petición con respondWith() para servir desde cache primero.
  event.respondWith(
    caches.match(event.request)     // Buscamos la petición en el cache.
      .then(function (cachedResponse) {
        // -----------------------------------------------------------------
        // CASO A: El recurso está en cache -> lo retornamos inmediatamente.
        // -----------------------------------------------------------------
        if (cachedResponse) {
          // Aunque retornamos el cache, hacemos un fetch en background
          // para actualizar la copia en cache (stale-while-revalidate ligero).
          fetchAndCache(event.request);
          return cachedResponse;
        }

        // -----------------------------------------------------------------
        // CASO B: No está en cache -> vamos a la red.
        // -----------------------------------------------------------------
        return fetch(event.request)
          .then(function (networkResponse) {
            // Si la respuesta de red no es válida, la pasamos tal cual.
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clonamos la respuesta porque el body de una Response solo puede leerse una vez.
            const responseToCache = networkResponse.clone();

            // Guardamos la respuesta en el cache dinámico para uso futuro offline.
            caches.open(DYNAMIC_CACHE)
              .then(function (cache) {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          })
          .catch(function () {
            // -----------------------------------------------------------------
            // CASO C: Falló todo (offline y no en cache).
            // -----------------------------------------------------------------
            // Si es una petición de navegación (página HTML), mostramos fallback.
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }

            // Para otros recursos, retornamos un error genérico.
            return new Response(
              JSON.stringify({ error: 'Recurso no disponible offline' }),
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json' }
              }
            );
          });
      })
  );
});

// ---------------------------------------------------------------------------
// 5. FUNCIÓN AUXILIAR: fetchAndCache (Background Update)
// ---------------------------------------------------------------------------
// Realiza un fetch en segundo plano y actualiza el cache sin bloquear la respuesta.
// Esto permite que el usuario vea la versión cacheada rápidamente mientras
// se actualiza silenciosamente para la próxima vez.
// ---------------------------------------------------------------------------

function fetchAndCache(request) {
  fetch(request)
    .then(function (response) {
      // Solo cacheamos respuestas válidas de nuestro origen.
      if (!response || response.status !== 200 || response.type !== 'basic') {
        return;
      }
      const responseClone = response.clone();
      caches.open(CACHE_NAME)
        .then(function (cache) {
          cache.put(request, responseClone);
        });
    })
    .catch(function () {
      // Silencioso: si falla el background update, no afecta al usuario.
    });
}

// ---------------------------------------------------------------------------
// 6. MENSAJES DESDE LA APP PRINCIPAL (opcional, para sync futuro)
// ---------------------------------------------------------------------------
// La app principal puede enviar mensajes al SW usando postMessage.
// Por ejemplo: forzar limpieza de cache, solicitar estado, etc.
// ---------------------------------------------------------------------------

self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});
