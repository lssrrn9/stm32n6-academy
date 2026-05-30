/**
 * ============================================================================
 * STM32N6 Industrial Academy - db.js
 * ============================================================================
 * Capa de persistencia con IndexedDB nativa (sin librerías externas).
 * 3 object stores: progress, simulations, projects.
 * CRUD completo + export/import JSON.
 * ============================================================================
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. CONFIGURACIÓN DE LA BASE DE DATOS
  // ==========================================================================

  // Nombre de la base de datos IndexedDB
  const DB_NAME = 'N6AcademyDB';
  // Versión actual del esquema (incrementar al modificar stores o índices)
  const DB_VERSION = 1;
  // Referencia global a la conexión de la base de datos
  let db = null;

  // ==========================================================================
  // 2. INICIALIZACIÓN DE INDEXEDDB
  // ==========================================================================

  /**
   * Abre la conexión con IndexedDB y crea/actualiza los object stores.
   * Retorna una Promise que resuelve con la instancia de la base de datos.
   */
  function initDB() {
    // Retornamos una Promise para poder usar async/await o .then() desde fuera
    return new Promise((resolve, reject) => {
      // window.indexedDB es la API nativa del navegador
      // open() crea la BD si no existe, o la abre si ya existe
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      // -----------------------------------------------------------------------
      // Evento: onupgradeneeded
      // Se dispara cuando la versión de la BD cambia o es la primera vez
      // Aquí definimos el esquema: object stores e índices
      // -----------------------------------------------------------------------
      request.onupgradeneeded = function (event) {
        // Obtenemos la referencia a la base de datos en modo upgrade
        const database = event.target.result;

        // -------------------------------------------------------------------
        // STORE 1: progress
        // Guarda el progreso del usuario por módulo y lección
        // -------------------------------------------------------------------
        if (!database.objectStoreNames.contains('progress')) {
          // createObjectStore() crea el almacén
          // keyPath: 'id' significa que cada registro usa la propiedad 'id' como clave primaria
          const progressStore = database.createObjectStore('progress', {
            keyPath: 'id',
            autoIncrement: true  // El navegador genera IDs automáticamente
          });
          // createIndex() crea índices para búsquedas rápidas
          // 'moduleIndex' permite buscar todos los registros de un mismo módulo
          progressStore.createIndex('moduleIndex', 'module', { unique: false });
          // 'lessonIndex' permite buscar por ID de lección
          progressStore.createIndex('lessonIndex', 'lessonId', { unique: false });
          // 'completedIndex' permite filtrar por estado completado/no completado
          progressStore.createIndex('completedIndex', 'completed', { unique: false });
        }

        // -------------------------------------------------------------------
        // STORE 2: simulations
        // Guarda datos de simulaciones de sensores (series temporales)
        // -------------------------------------------------------------------
        if (!database.objectStoreNames.contains('simulations')) {
          const simStore = database.createObjectStore('simulations', {
            keyPath: 'id',
            autoIncrement: true
          });
          // 'typeIndex' para buscar simulaciones por tipo de sensor
          simStore.createIndex('typeIndex', 'sensorType', { unique: false });
          // 'dateIndex' para ordenar o filtrar por fecha de creación
          simStore.createIndex('dateIndex', 'timestamp', { unique: false });
        }

        // -------------------------------------------------------------------
        // STORE 3: projects
        // Guarda proyectos del usuario con código para Wokwi
        // -------------------------------------------------------------------
        if (!database.objectStoreNames.contains('projects')) {
          const projStore = database.createObjectStore('projects', {
            keyPath: 'id',
            autoIncrement: true
          });
          // 'nameIndex' para búsquedas por nombre de proyecto
          projStore.createIndex('nameIndex', 'name', { unique: false });
          // 'dateIndex' para ordenar proyectos por fecha
          projStore.createIndex('dateIndex', 'date', { unique: false });
        }
      };

      // -----------------------------------------------------------------------
      // Evento: onsuccess
      // La conexión se abrió correctamente
      // -----------------------------------------------------------------------
      request.onsuccess = function (event) {
        // Guardamos la referencia global a la base de datos
        db = event.target.result;
        // Resolvemos la Promise con la instancia de la BD
        resolve(db);
      };

      // -----------------------------------------------------------------------
      // Evento: onerror
      // Ocurrió un error al abrir la base de datos
      // -----------------------------------------------------------------------
      request.onerror = function (event) {
        // Rechazamos la Promise con el error para que el llamador lo maneje
        reject(event.target.error);
      };
    });
  }

  // ==========================================================================
  // 3. FUNCIÓN ADD (CREAR)
  // ==========================================================================

  /**
   * Inserta un nuevo registro en un object store.
   * @param {string} storeName - Nombre del store: 'progress', 'simulations' o 'projects'
   * @param {Object} data - Objeto con los datos a guardar
   * @returns {Promise<number>} - Promise que resuelve con el ID generado
   */
  function addData(storeName, data) {
    // Retornamos una Promise para manejo asíncrono
    return new Promise((resolve, reject) => {
      // transaction() inicia una transacción de escritura (readwrite)
      // El segundo parámetro es el modo: 'readonly' o 'readwrite'
      const transaction = db.transaction([storeName], 'readwrite');
      // objectStore() obtiene la referencia al almacén dentro de la transacción
      const store = transaction.objectStore(storeName);
      // add() inserta el registro. Si la clave primaria ya existe, falla.
      const request = store.add(data);

      // onsuccess se dispara cuando la inserción fue exitosa
      request.onsuccess = function (event) {
        // event.target.result contiene la clave primaria generada (el ID)
        resolve(event.target.result);
      };

      // onerror se dispara si hubo un problema (ej. clave duplicada)
      request.onerror = function (event) {
        reject(event.target.error);
      };
    });
  }

  // ==========================================================================
  // 4. FUNCIÓN GET (LEER)
  // ==========================================================================

  /**
   * Obtiene un registro por su ID (clave primaria).
   * @param {string} storeName - Nombre del store
   * @param {number} id - ID del registro a recuperar
   * @returns {Promise<Object|null>} - Promise con el objeto encontrado o null
   */
  function getData(storeName, id) {
    return new Promise((resolve, reject) => {
      // Transacción de solo lectura (más eficiente, sin bloqueos de escritura)
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      // get() busca un registro por su clave primaria
      const request = store.get(id);

      request.onsuccess = function (event) {
        // Si no encuentra el registro, result será undefined
        // Normalizamos a null para consistencia
        resolve(event.target.result || null);
      };

      request.onerror = function (event) {
        reject(event.target.error);
      };
    });
  }

  /**
   * Obtiene TODOS los registros de un store.
   * @param {string} storeName - Nombre del store
   * @returns {Promise<Array>} - Promise con array de todos los registros
   */
  function getAllData(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      // openCursor() itera sobre todos los registros del store
      const request = store.openCursor();
      // Array donde acumulamos los resultados
      const results = [];

      request.onsuccess = function (event) {
        // cursor contiene el registro actual de la iteración
        const cursor = event.target.result;
        if (cursor) {
          // cursor.value es el objeto completo del registro
          results.push(cursor.value);
          // continue() avanza al siguiente registro
          cursor.continue();
        } else {
          // cursor es null: llegamos al final de la iteración
          resolve(results);
        }
      };

      request.onerror = function (event) {
        reject(event.target.error);
      };
    });
  }

  /**
   * Obtiene registros filtrados por un índice secundario.
   * @param {string} storeName - Nombre del store
   * @param {string} indexName - Nombre del índice (ej. 'moduleIndex')
   * @param {any} value - Valor a buscar en el índice
   * @returns {Promise<Array>} - Array de registros coincidentes
   */
  function getByIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      // index() obtiene la referencia al índice secundario
      const index = store.index(indexName);
      // getAll() en un índice retorna todos los registros que coinciden con el valor
      const request = index.getAll(value);

      request.onsuccess = function (event) {
        resolve(event.target.result);
      };

      request.onerror = function (event) {
        reject(event.target.error);
      };
    });
  }

  // ==========================================================================
  // 5. FUNCIÓN UPDATE (ACTUALIZAR)
  // ==========================================================================

  /**
   * Actualiza un registro existente. El objeto debe incluir su ID.
   * @param {string} storeName - Nombre del store
   * @param {Object} data - Objeto con los datos actualizados (debe incluir 'id')
   * @returns {Promise<number>} - Promise que resuelve con el ID actualizado
   */
  function updateData(storeName, data) {
    return new Promise((resolve, reject) => {
      // Validación: el objeto debe tener un ID para poder actualizar
      if (!data.id) {
        reject(new Error('El objeto a actualizar debe incluir la propiedad "id"'));
        return;
      }

      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      // put() inserta o actualiza. Si el ID existe, sobrescribe; si no, crea.
      const request = store.put(data);

      request.onsuccess = function (event) {
        resolve(event.target.result);
      };

      request.onerror = function (event) {
        reject(event.target.error);
      };
    });
  }

  // ==========================================================================
  // 6. FUNCIÓN DELETE (ELIMINAR)
  // ==========================================================================

  /**
   * Elimina un registro por su ID.
   * @param {string} storeName - Nombre del store
   * @param {number} id - ID del registro a eliminar
   * @returns {Promise<void>} - Promise que resuelve al completar
   */
  function deleteData(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      // delete() elimina el registro con la clave primaria indicada
      const request = store.delete(id);

      request.onsuccess = function () {
        // delete() no retorna valor en result, solo confirmamos éxito
        resolve();
      };

      request.onerror = function (event) {
        reject(event.target.error);
      };
    });
  }

  /**
   * Elimina TODOS los registros de un store (limpieza completa).
   * @param {string} storeName - Nombre del store
   * @returns {Promise<void>}
   */
  function clearStore(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      // clear() elimina todos los registros del almacén
      const request = store.clear();

      request.onsuccess = function () {
        resolve();
      };

      request.onerror = function (event) {
        reject(event.target.error);
      };
    });
  }

  // ==========================================================================
  // 7. EXPORTAR A JSON
  // ==========================================================================

  /**
   * Exporta TODOS los datos de la base de datos a un objeto JSON.
   * Útil para backups, migraciones o transferencia entre dispositivos.
   * @returns {Promise<Object>} - Objeto con estructura { progress: [...], simulations: [...], projects: [...] }
   */
  async function exportAllToJSON() {
    // Array con los nombres de todos los stores a exportar
    const storeNames = ['progress', 'simulations', 'projects'];
    // Objeto donde acumulamos los datos de cada store
    const exportData = {};

    // Iteramos sobre cada store y obtenemos todos sus registros
    for (const storeName of storeNames) {
      // getAllData() retorna un array con todos los registros del store
      exportData[storeName] = await getAllData(storeName);
    }

    // Agregamos metadatos del export para trazabilidad
    exportData._meta = {
      // Versión del esquema de la base de datos
      dbVersion: DB_VERSION,
      // Fecha y hora exacta de la exportación
      exportedAt: new Date().toISOString(),
      // Nombre de la aplicación que generó el export
      app: 'STM32N6 Industrial Academy'
    };

    // Retornamos el objeto completo listo para convertir a string JSON
    return exportData;
  }

  /**
   * Descarga el export como archivo .json en el navegador del usuario.
   * @param {string} filename - Nombre del archivo (default: n6-academy-backup.json)
   */
  async function downloadJSON(filename = 'n6-academy-backup.json') {
    // Obtenemos el objeto JSON con todos los datos
    const data = await exportAllToJSON();
    // Convertimos a string JSON con indentación de 2 espacios (legible)
    const jsonString = JSON.stringify(data, null, 2);
    // Creamos un Blob (objeto binario) con tipo MIME application/json
    const blob = new Blob([jsonString], { type: 'application/json' });
    // Creamos una URL temporal para el Blob
    const url = URL.createObjectURL(blob);

    // Creamos un elemento <a> invisible para disparar la descarga
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;  // Nombre del archivo que descargará el usuario
    document.body.appendChild(a);
    a.click();  // Simulamos el clic para iniciar la descarga

    // Limpieza: removemos el elemento y liberamos la URL del Blob
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ==========================================================================
  // 8. IMPORTAR DESDE JSON
  // ==========================================================================

  /**
   * Importa datos desde un objeto JSON a la base de datos IndexedDB.
   * Puede hacer merge (conservar datos existentes) o reemplazo total.
   * @param {Object} jsonData - Objeto con los datos a importar
   * @param {boolean} replace - Si es true, limpia los stores antes de importar
   * @returns {Promise<Object>} - Resumen de la importación { imported, errors }
   */
  async function importFromJSON(jsonData, replace = false) {
    // Array con los nombres de los stores que vamos a importar
    const storeNames = ['progress', 'simulations', 'projects'];
    // Contadores para el resumen de la operación
    let importedCount = 0;
    let errorCount = 0;
    const errors = [];

    // Si replace es true, limpiamos todos los stores antes de importar
    if (replace) {
      for (const storeName of storeNames) {
        // clearStore() elimina todos los registros del almacén
        await clearStore(storeName);
      }
    }

    // Iteramos sobre cada store definido en los datos de importación
    for (const storeName of storeNames) {
      // Verificamos que el JSON tenga datos para este store
      if (!jsonData[storeName] || !Array.isArray(jsonData[storeName])) {
        continue;  // Si no hay datos, saltamos al siguiente store
      }

      // Iteramos sobre cada registro del array de este store
      for (const item of jsonData[storeName]) {
        try {
          // Eliminamos el ID original para que IndexedDB genere uno nuevo
          // Esto evita conflictos de claves si ya existen registros
          const cleanItem = { ...item };
          delete cleanItem.id;

          // Insertamos el registro limpio en la base de datos
          await addData(storeName, cleanItem);
          importedCount += 1;  // Incrementamos contador de éxitos
        } catch (err) {
          errorCount += 1;  // Incrementamos contador de errores
          errors.push({
            store: storeName,
            item: item,
            error: err.message
          });
        }
      }
    }

    // Retornamos un resumen de la operación de importación
    return {
      imported: importedCount,  // Total de registros importados exitosamente
      errors: errorCount,       // Total de registros que fallaron
      details: errors           // Array con los errores específicos (si hubo)
    };
  }

  /**
   * Lee un archivo JSON desde un input file y lo importa a la base de datos.
   * @param {File} file - Objeto File del input type="file"
   * @param {boolean} replace - Si es true, reemplaza todos los datos existentes
   * @returns {Promise<Object>} - Resumen de la importación
   */
  async function importFromFile(file, replace = false) {
    // Retornamos una Promise que se resuelve cuando se lee el archivo
    return new Promise((resolve, reject) => {
      // FileReader es la API nativa para leer archivos en el navegador
      const reader = new FileReader();

      // onload se dispara cuando el archivo se leyó completamente
      reader.onload = async function (event) {
        try {
          // event.target.result contiene el texto del archivo
          // JSON.parse() convierte el string a un objeto JavaScript
          const jsonData = JSON.parse(event.target.result);
          // Llamamos a importFromJSON() con los datos parseados
          const result = await importFromJSON(jsonData, replace);
          resolve(result);
        } catch (err) {
          // Si el JSON está malformado o hay otro error, rechazamos
          reject(err);
        }
      };

      // onerror se dispara si hay un problema al leer el archivo
      reader.onerror = function () {
        reject(new Error('Error al leer el archivo'));
      };

      // readAsText() inicia la lectura del archivo como texto plano
      reader.readAsText(file);
    });
  }

  // ==========================================================================
  // 9. HELPERS ESPECÍFICOS POR DOMINIO
  // ==========================================================================

  /**
   * Guarda el progreso de una lección específica.
   * Wrapper especializado sobre addData/updateData para el store 'progress'.
   * @param {string} module - ID del módulo (ej. 'fundamentos')
   * @param {string} lessonId - ID de la lección (ej. 'f1')
   * @param {boolean} completed - Estado de completado
   */
  async function saveLessonProgress(module, lessonId, completed) {
    // Buscamos si ya existe un registro para esta lección
    const existing = await getByIndex('progress', 'lessonIndex', lessonId);

    if (existing.length > 0) {
      // Si existe, actualizamos el registro existente
      const record = existing[0];
      record.completed = completed;
      record.date = new Date().toISOString();
      await updateData('progress', record);
    } else {
      // Si no existe, creamos un nuevo registro
      await addData('progress', {
        module: module,
        lessonId: lessonId,
        completed: completed,
        date: new Date().toISOString()
      });
    }
  }

  /**
   * Guarda una simulación de sensor con datos históricos.
   * @param {string} sensorType - Tipo de sensor (ej. 'temperatura', 'presion')
   * @param {Array<number>} dataHistory - Array de valores numéricos históricos
   */
  async function saveSimulation(sensorType, dataHistory) {
    await addData('simulations', {
      sensorType: sensorType,
      dataHistory: dataHistory,  // Array de números (ej. [23.5, 24.1, 23.8])
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Guarda un proyecto con código para Wokwi.
   * @param {string} name - Nombre del proyecto
   * @param {string} wokwiCode - Código JSON o diagrama de Wokwi
   */
  async function saveProject(name, wokwiCode) {
    await addData('projects', {
      name: name,
      wokwiCode: wokwiCode,  // String con el código/diagrama
      date: new Date().toISOString()
    });
  }

  // ==========================================================================
  // 10. API PÚBLICA (expuesta globalmente)
  // ==========================================================================

  // Esperamos a que el DOM esté listo para inicializar la base de datos
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDB);
  } else {
    initDB();
  }

  // Exponemos todas las funciones en window.N6DB para uso desde otros scripts
  window.N6DB = {
    // Inicialización
    initDB,
    // CRUD básico
    addData,
    getData,
    getAllData,
    getByIndex,
    updateData,
    deleteData,
    clearStore,
    // Export / Import
    exportAllToJSON,
    downloadJSON,
    importFromJSON,
    importFromFile,
    // Helpers específicos del dominio
    saveLessonProgress,
    saveSimulation,
    saveProject,
    // Debug: acceso a la instancia de la BD
    _db: () => db
  };

})();
