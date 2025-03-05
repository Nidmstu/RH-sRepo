
/**
 * Основной модуль приложения
 */
import courseManager from './courseManager.js';
import adminInterface from './adminInterface.js';

// Контейнеры для разных секций
const homeContainer = document.getElementById('home');
const guideContainer = document.getElementById('guide');
const daySelectionContainer = document.getElementById('day-selection');
const taskSelectionContainer = document.getElementById('task-selection');
const dayHeader = document.getElementById('day-header');
const taskButtonsDiv = document.getElementById('task-buttons');
const professionSelect = document.getElementById('profession-select');
const guideTitle = document.getElementById('guide-title');
const loadingSpinner = document.getElementById('loading-spinner');
const markdownContent = document.getElementById('markdown-content');
const testButton = document.getElementById('test-button');

// Инициализация приложения
async function initApp() {
  console.log('Инициализация приложения...');
  
  // Скрываем глобальный индикатор загрузки - он должен оставаться видимым пока все не загрузится
  const globalLoadingOverlay = document.getElementById('global-loading-overlay');
  
  // Показываем индикатор загрузки перед началом инициализации
  const loadingIndicator = document.getElementById('loading-spinner');
  const appContent = document.getElementById('app-content');
  const retryContainer = document.getElementById('loading-retry-container');
  
  // Показываем индикатор загрузки и скрываем контент
  if (loadingIndicator) loadingIndicator.classList.remove('hidden');
  if (retryContainer) retryContainer.classList.add('hidden');
  if (appContent) appContent.classList.add('hidden');
  
  // Настраиваем обработчики событий
  setupEventListeners();
  
  // Функция для обновления глобального статуса загрузки
  function updateGlobalLoadingStatus(message) {
    const statusElement = document.getElementById('global-loading-status');
    if (statusElement) {
      statusElement.textContent = message;
    }
    console.log('Глобальный статус загрузки:', message);
  }
  
  try {
    // Устанавливаем таймаут для случая, если загрузка затянется
    const loadingTimeout = setTimeout(() => {
      console.log('Превышен таймаут загрузки данных (30 секунд)');
      updateLoadingStatus('Загрузка данных занимает больше времени, чем обычно...', false);
    }, 30000); // 30 секунд таймаут
    
    // Обновление статуса загрузки
    updateLoadingStatus('Загрузка данных курсов...');
    
    // ВАЖНО: Сначала полностью завершаем синхронизацию с облаком
    // перед инициализацией менеджера курсов
    try {
      updateLoadingStatus('Синхронизация с облаком...');
      updateGlobalLoadingStatus('Синхронизация с облаком...');
      
      // Принудительно сначала очищаем данные курсов, чтобы гарантировать свежую загрузку
      courseManager.courses = null;
      
      // Принудительная синхронизация с облаком - 3 попытки с интервалом
      let syncSuccess = false;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (!syncSuccess && attempts < maxAttempts) {
        attempts++;
        try {
          updateGlobalLoadingStatus(`Попытка синхронизации с облаком (${attempts}/${maxAttempts})...`);
          const syncResult = await forceSyncWithCloud();
          
          if (syncResult && syncResult.success) {
            updateLoadingStatus('Синхронизация завершена успешно, данные обновлены');
            updateGlobalLoadingStatus('Синхронизация с облаком успешна!');
            console.log('Синхронизация с облаком выполнена успешно:', syncResult);
            syncSuccess = true;
          } else {
            throw new Error('Синхронизация не принесла результатов');
          }
        } catch (attemptError) {
          console.warn(`Попытка ${attempts}: Ошибка при синхронизации:`, attemptError);
          
          if (attempts < maxAttempts) {
            updateLoadingStatus(`Повторная попытка синхронизации через 2 секунды...`);
            updateGlobalLoadingStatus(`Повторная попытка через 2 секунды...`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Пауза перед следующей попыткой
          }
        }
      }
      
      if (!syncSuccess) {
        updateLoadingStatus('Все попытки синхронизации не удались, переход к альтернативным источникам');
        updateGlobalLoadingStatus('Синхронизация не удалась, использование резервных данных...');
        console.warn('Все попытки синхронизации не удались, использование локальных данных');
      }
    } catch (syncError) {
      console.warn('Ошибка при синхронизации с облаком:', syncError);
      updateLoadingStatus('Синхронизация не удалась, загрузка локальных данных...');
      updateGlobalLoadingStatus('Использование резервных данных...');
    }
    
    // Теперь инициализируем менеджер курсов
    updateLoadingStatus('Инициализация менеджера курсов...');
    updateGlobalLoadingStatus('Инициализация менеджера курсов...');
    console.log('Инициализация менеджера курсов после синхронизации...');
    const success = await courseManager.initialize();
    
    // Очищаем таймаут загрузки
    clearTimeout(loadingTimeout);
    
    if (!success) {
      console.error('Ошибка инициализации менеджера курсов');
      updateLoadingStatus('Ошибка загрузки данных курсов', true);
      updateGlobalLoadingStatus('Критическая ошибка! Не удалось инициализировать менеджер курсов');
      if (retryContainer) retryContainer.classList.remove('hidden');
      return;
    }
    
    console.log('Инициализация менеджера курсов завершена успешно');
    
    // Проверяем, что данные курсов действительно загружены
    if (!courseManager.courses || Object.keys(courseManager.courses).length === 0) {
      console.error('Объект courses не был загружен правильно');
      updateLoadingStatus('Данные курсов не загружены', true);
      updateGlobalLoadingStatus('Ошибка! Данные курсов не загружены');
      if (retryContainer) retryContainer.classList.remove('hidden');
      return;
    }
    
    console.log('Данные курсов успешно загружены:', Object.keys(courseManager.courses));
    updateLoadingStatus('Данные курсов успешно загружены');
    updateGlobalLoadingStatus('Данные курсов загружены, подготовка интерфейса...');

// Функция для вывода диагностической информации
function logDiagnostics(message, data) {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
  console.log(`[${timestamp}] ${message}`);
  
  if (data && window.devMode && window.devMode.enabled) {
    if (typeof data === 'object') {
      try {
        const preview = JSON.stringify(data).substring(0, 100);
        console.log(`🔧 [DevMode] Data preview: ${preview}${preview.length >= 100 ? '...' : ''}`);
      } catch (e) {
        console.log(`🔧 [DevMode] Could not stringify data: ${e.message}`);
      }
    } else {
      console.log(`🔧 [DevMode] Data: ${data}`);
    }
  }
}

    }

    // Теперь, когда у нас есть данные, подписываемся на их обновления
    courseManager.onCoursesUpdated((courses) => {
      console.log('Получено обновление курсов, обновляем интерфейс');
      
      // Обновляем список профессий
      updateProfessionSelector();
      
      // Обновляем списки дней и уроков, если выбрана профессия
      if (courseManager.currentProfession) {
        updateDaysList();
        if (courseManager.currentDay) {
          updateLessonsList();
        }
      }
    });
    
    // Устанавливаем периодическую синхронизацию с облаком
    setupCloudSyncInterval();
    
    // Вызываем обновление интерфейса на основе полученных данных
    updateProfessionSelector();
    
    // Отображаем начальный интерфейс только после полной инициализации
    renderHomePage();
    
    // Обновление статуса загрузки
    updateLoadingStatus('Загрузка завершена, подготовка интерфейса...');
    
    // Короткая задержка, чтобы пользователь увидел сообщение о завершении
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Короткая задержка перед скрытием индикатора загрузки
    console.log('Приложение инициализировано успешно, показываем интерфейс через 1 секунду');
    await new Promise(resolve => setTimeout(resolve, 1000));  // Задержка 1 секунда
    
    // Скрываем индикатор загрузки и показываем основной контент
    if (loadingIndicator) loadingIndicator.classList.add('hidden');
    if (appContent) appContent.classList.remove('hidden');
    
    // Скрываем глобальный индикатор загрузки
    if (globalLoadingOverlay) {
      // Плавное исчезновение
      globalLoadingOverlay.style.transition = 'opacity 0.5s';
      globalLoadingOverlay.style.opacity = '0';
      setTimeout(() => {
        globalLoadingOverlay.style.display = 'none';
      }, 500);
    }
    
    console.log('Приложение инициализировано успешно и готово к работе');
  } catch (error) {
    console.error('Ошибка при инициализации приложения:', error);
    updateLoadingStatus('Ошибка: ' + (error.message || 'Не удалось загрузить данные'), true);
    alert('Произошла ошибка при загрузке данных. Попробуйте перезагрузить страницу.');
    
    // Даже при ошибке пытаемся показать интерфейс через 3 секунды
    setTimeout(() => {
      if (loadingIndicator) loadingIndicator.classList.add('hidden');
      if (appContent) appContent.classList.remove('hidden');
    }, 3000);
  }
}

// Функция для обновления статуса загрузки
function updateLoadingStatus(message, isError = false) {
  const statusElement = document.querySelector('.loading-status');
  if (statusElement) {
    statusElement.textContent = message;
    if (isError) {
      statusElement.style.color = '#ff5555';
      statusElement.style.fontWeight = 'bold';
    } else {
      statusElement.style.color = '';
      statusElement.style.fontWeight = '';
    }
  }
  console.log('Статус загрузки:', message);
}

// Принудительная синхронизация с облаком (возвращает Promise)
async function forceSyncWithCloud() {
  return new Promise(async (resolve, reject) => {
    console.log('Принудительная синхронизация с облаком...');
    updateLoadingStatus('Поиск URL для импорта данных...');
    
    // Проверяем наличие настроек вебхуков
    const webhookSettingsStr = localStorage.getItem('webhookSettings');
    let importWebhookUrl = null;
    
    if (webhookSettingsStr) {
      try {
        const webhookSettings = JSON.parse(webhookSettingsStr);
        if (webhookSettings.importUrl) {
          importWebhookUrl = webhookSettings.importUrl;
          console.log(`Найден URL импорта в настройках вебхуков: ${importWebhookUrl}`);
          updateLoadingStatus(`Найден URL импорта данных в настройках вебхуков`);
        }
      } catch (e) {
        console.error('Ошибка при парсинге настроек вебхуков:', e);
        updateLoadingStatus('Ошибка при чтении настроек вебхуков');
      }
    }
    
    // Если URL не найден в webhookSettings, проверяем другие источники
    if (!importWebhookUrl) {
      // Приоритет источников: adminImportWebhook -> importWebhookUrl -> testImportUrl
      if (localStorage.getItem('adminImportWebhook')) {
        importWebhookUrl = localStorage.getItem('adminImportWebhook');
        console.log(`Найден URL импорта в adminImportWebhook: ${importWebhookUrl}`);
        updateLoadingStatus(`Найден URL импорта в настройках админки`);
      } else if (localStorage.getItem('importWebhookUrl')) {
        importWebhookUrl = localStorage.getItem('importWebhookUrl');
        console.log(`Найден URL импорта в importWebhookUrl: ${importWebhookUrl}`);
        updateLoadingStatus(`Найден URL импорта в настройках`);
      } else if (localStorage.getItem('testImportUrl')) {
        importWebhookUrl = localStorage.getItem('testImportUrl');
        console.log(`Найден URL импорта в testImportUrl: ${importWebhookUrl}`);
        updateLoadingStatus(`Найден тестовый URL импорта`);
      }
    }
    
    // Если найден URL импорта, используем его
    if (importWebhookUrl) {
      if (window.devMode && window.devMode.enabled) {
        console.log('🔧 [DevMode] Выполняется принудительная синхронизация с облаком');
        console.log(`🔧 [DevMode] URL для импорта: ${importWebhookUrl}`);
      }
      
      try {
        // Очищаем текущие данные курсов, чтобы гарантировать загрузку новых
        courseManager.courses = null;
        
        // Обновляем статус
        updateLoadingStatus(`Отправка запроса на ${importWebhookUrl.split('/').slice(-1)[0]}`);
        
        // Пытаемся получить новые данные с сервера
        console.log(`Выполняется импорт данных с URL: ${importWebhookUrl}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // Увеличенный таймаут до 20 секунд
        
        try {
          const response = await fetch(importWebhookUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json, text/plain, */*',
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            },
            cache: 'no-store',
            mode: 'cors',
            credentials: 'omit',
            signal: controller.signal
          });
          
          // Очищаем таймаут после получения ответа
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`HTTP ошибка! Статус: ${response.status}`);
          }
          
          const responseText = await response.text();
          console.log(`Получен ответ от сервера, размер: ${responseText.length} байт`);
          updateLoadingStatus(`Получен ответ от сервера (${responseText.length} байт)`);
          
          let coursesData = null;
          
          // Пытаемся распарсить JSON
          try {
            const importData = JSON.parse(responseText);
            console.log('Успешно распарсен JSON из ответа, анализ данных...');
            
            // Проверяем разные форматы ответа
            if (importData.courses) {
              coursesData = importData.courses;
              console.log('Найдены курсы в поле courses');
            } else if (importData.data && typeof importData.data === 'object') {
              coursesData = importData.data;
              console.log('Найдены курсы в поле data (объект)');
            } else if (importData.content && typeof importData.content === 'object') {
              coursesData = importData.content;
              console.log('Найдены курсы в поле content (объект)');
            } else {
              // Проверка формата корневого объекта как структуры курсов
              const hasValidStructure = Object.values(importData).some(value => {
                return value && typeof value === 'object' && 
                  (value.days || value.specialLessons || value.title || value.redirectUrl);
              });
              
              if (hasValidStructure) {
                coursesData = importData;
                console.log('Корневой объект используется как структура курсов');
              }
            }
          } catch (e) {
            console.error('Ошибка при парсинге JSON:', e);
            updateLoadingStatus(`Ошибка при обработке данных: ${e.message}`);
            resolve({success: false, error: 'Ошибка парсинга JSON'});
            return;
          }
          
          if (coursesData) {
            // Применяем новые данные
            courseManager.courses = coursesData;
            
            // Сохраняем резервную копию
            localStorage.setItem('coursesBackup', JSON.stringify(coursesData));
            localStorage.setItem('coursesBackupTimestamp', new Date().toISOString());
            
            console.log('Синхронизация успешно завершена, получены актуальные данные курсов');
            if (window.devMode && window.devMode.enabled) {
              console.log('🔧 [DevMode] Принудительная синхронизация успешно завершена');
              console.log('🔧 [DevMode] Сохранена резервная копия курсов');
            }
            
            updateLoadingStatus(`Данные успешно обновлены`);
            resolve({success: true, updated: true, data: coursesData});
          } else {
            console.error('Не удалось найти данные о курсах в ответе');
            updateLoadingStatus(`Не удалось найти данные о курсах в ответе`);
            resolve({success: false, error: 'Данные о курсах не найдены'});
          }
        } catch (fetchError) {
          // Очищаем таймаут при ошибке
          clearTimeout(timeoutId);
          
          console.error('Ошибка при получении данных:', fetchError);
          updateLoadingStatus(`Ошибка при получении данных: ${fetchError.message}`);
          
          if (fetchError.name === 'AbortError') {
            resolve({success: false, error: 'Таймаут запроса'});
          } else {
            resolve({success: false, error: fetchError.message});
          }
        }
      } catch (e) {
        console.error('Ошибка при принудительной синхронизации:', e);
        updateLoadingStatus(`Ошибка синхронизации: ${e.message}`);
        reject(e);
      }
    } else {
      console.log('URL вебхука для импорта не найден, синхронизация пропущена');
      updateLoadingStatus('URL вебхука для импорта не найден');
      resolve({success: false, error: 'URL импорта не найден'});
    }
  });
}

// Настройка периодической синхронизации с облаком
function setupCloudSyncInterval() {
  const syncInterval = 60 * 1000; // 1 минута - более частая синхронизация для оперативного обновления
  
  // Запускаем периодическую синхронизацию
  console.log(`Настройка периодической синхронизации каждые ${syncInterval/1000} секунд`);
  setInterval(syncWithCloud, syncInterval);
}

// Функция для синхронизации с облаком
function syncWithCloud() {
  return new Promise(async (resolve) => {
    try {
      // Получаем URL вебхука
      const webhookSettingsStr = localStorage.getItem('webhookSettings');
      let importWebhookUrl = null;
      
      if (webhookSettingsStr) {
        try {
          const webhookSettings = JSON.parse(webhookSettingsStr);
          if (webhookSettings.importUrl) {
            importWebhookUrl = webhookSettings.importUrl;
          }
        } catch (e) {
          console.error('Ошибка при парсинге настроек вебхуков:', e);
        }
      }
      
      // Если URL не найден в webhookSettings, проверяем другие источники
      if (!importWebhookUrl) {
        importWebhookUrl = localStorage.getItem('importWebhookUrl') || 
                          localStorage.getItem('adminImportWebhook') || 
                          localStorage.getItem('testImportUrl');
      }
      
      // Если найден URL импорта, используем его
      if (importWebhookUrl) {
        if (window.devMode && window.devMode.enabled) {
          console.log('🔧 [DevMode] Выполняется периодическая синхронизация с облаком');
          console.log(`🔧 [DevMode] URL для импорта: ${importWebhookUrl}`);
        }
        
        try {
          await tryImportFromUrl(importWebhookUrl);
        } catch (e) {
          console.error('Ошибка при синхронизации:', e);
        }
      } else {
        console.log('URL вебхука для импорта не найден, синхронизация пропущена');
      }
    } catch (error) {
      console.error('Ошибка при синхронизации:', error);
    } finally {
      resolve();
    }
  });
}

// Функция для импорта данных с указанного URL
async function tryImportFromUrl(url) {
  console.log(`Синхронизация с облаком: ${url}`);
  
  try {
    // Обновление статуса загрузки
    updateLoadingStatus(`Отправка запроса на сервер...`);
    
    // Добавляем таймаут для запроса с максимальным временем ожидания
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      updateLoadingStatus('Превышено время ожидания ответа от сервера', true);
    }, 15000); // 15 секунд
    
    // Получаем данные с вебхука
    console.log(`Отправка запроса на URL импорта: ${url}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      cache: 'no-store', // Всегда получаем свежие данные
      signal: controller.signal
    });
    
    // Очищаем таймаут после получения ответа
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`Ошибка при синхронизации: HTTP ${response.status}`);
      return { success: false, error: `HTTP ${response.status}` };
    }
    
    // Получаем текст ответа
    updateLoadingStatus('Получен ответ от сервера, обработка данных...');
    const responseText = await response.text();
    console.log(`Получен ответ от сервера, размер: ${responseText.length} байт`);
    
    // Пытаемся обработать данные
    try {
      let importData;
      
      // Пробуем распарсить JSON
      try {
        updateLoadingStatus('Обработка данных в формате JSON...');
        importData = JSON.parse(responseText);
        console.log('Успешно распарсен JSON из ответа');
      } catch (jsonError) {
        updateLoadingStatus('Поиск JSON данных в ответе...');
        console.log('Не удалось распарсить ответ как JSON, ищем JSON в тексте');
        
        // Пробуем найти JSON в тексте
        const jsonRegex = /{[\s\S]*}/;
        const match = responseText.match(jsonRegex);
        
        if (match && match[0]) {
          importData = JSON.parse(match[0]);
          console.log('Найден и распарсен JSON в тексте ответа');
        } else {
          throw new Error('Не удалось извлечь JSON из ответа');
        }
      }
      
      // Ищем данные о курсах в разных форматах
      let coursesData = null;
      
      // Вариант 1: Прямой объект courses
      if (importData.courses) {
        coursesData = importData.courses;
        console.log('Найдены курсы в поле courses');
      }
      // Вариант 2: Данные в поле data
      else if (importData.data) {
        if (typeof importData.data === 'object') {
          coursesData = importData.data;
          console.log('Найдены курсы в поле data (объект)');
        } else if (typeof importData.data === 'string') {
          // Пытаемся распарсить JSON строку
          try {
            const parsedData = JSON.parse(importData.data);
            coursesData = parsedData.courses || parsedData;
            console.log('Найдены курсы в поле data (JSON строка)');
          } catch (e) {
            console.log(`Не удалось распарсить JSON в поле data: ${e.message}`);
          }
        }
      }
      // Вариант 3: Данные в поле content как объект
      else if (importData.content && typeof importData.content === 'object') {
        coursesData = importData.content;
        console.log('Найдены курсы в поле content (объект)');
      }
      // Вариант 4: Прямое использование root объекта как courses
      else if (typeof importData === 'object') {
        // Проверяем структуру
        const hasValidStructure = Object.values(importData).some(value => {
          return value && typeof value === 'object' && 
                (value.days || value.specialLessons || value.title || value.redirectUrl || value.noDayLessons);
        });
        
        if (hasValidStructure) {
          coursesData = importData;
          console.log('Корневой объект используется как структура курсов');
        }
      }
      
      if (coursesData) {
        // Проверка и валидация структуры
        const isValid = validateCoursesStructure(coursesData);
        if (!isValid) {
          console.error('Неверная структура данных курсов');
          return { success: false, error: 'Неверная структура данных' };
        }
        
        // Проверяем на наличие вебхуков в уроках
        let hasWebhooks = false;
        Object.values(coursesData).forEach(course => {
          if (course.days && Array.isArray(course.days)) {
            course.days.forEach(day => {
              if (day.lessons && Array.isArray(day.lessons)) {
                day.lessons.forEach(lesson => {
                  if (lesson.contentSource && lesson.contentSource.type === 'webhook' && lesson.contentSource.url) {
                    hasWebhooks = true;
                    console.log(`Найден вебхук для урока ${lesson.id}: ${lesson.contentSource.url}`);
                  }
                });
              }
            });
          }
        });
        
        console.log(hasWebhooks ? 'Найдены вебхуки в структуре курсов' : 'Вебхуки в структуре курсов не найдены');
        
        // Сравниваем с текущими данными или принудительно обновляем
        const forceUpdate = !courseManager.courses;
        const currentCoursesJson = JSON.stringify(courseManager.courses || {});
        const newCoursesJson = JSON.stringify(coursesData);
        
        if (forceUpdate || currentCoursesJson !== newCoursesJson) {
          console.log(forceUpdate 
            ? 'Принудительное обновление данных курсов' 
            : 'Обнаружены изменения данных, применяем обновления из облака');
          
          // Сохраняем резервную копию текущих данных
          if (courseManager.courses) {
            localStorage.setItem('coursesBackup', currentCoursesJson);
            localStorage.setItem('coursesBackupTimestamp', new Date().toISOString());
          }
          
          // Кешируем все URL вебхуков из уроков для быстрого доступа
          cacheWebhookUrls(coursesData);
          
          // Применяем новую конфигурацию курсов
          updateLoadingStatus('Применение новой конфигурации курсов...');
          applyCoursesConfig(coursesData);
          
          console.log('Синхронизация с облаком успешно завершена, интерфейс обновлен');
          updateLoadingStatus('Синхронизация завершена успешно');
          return { success: true, updated: true };
        } else {
          console.log('Данные актуальны, синхронизация не требуется');
          updateLoadingStatus('Данные актуальны, синхронизация не требуется');
          return { success: true, updated: false };
        }
      } else {
        console.log('Не удалось найти данные о курсах в ответе');
        return { success: false, error: 'Данные о курсах не найдены' };
      }
    } catch (parseError) {
      console.error('Ошибка при обработке данных:', parseError);
      return { success: false, error: parseError.message };
    }
  } catch (error) {
    console.error('Ошибка при синхронизации с облаком:', error);
    
    // Проверка на таймаут
    if (error.name === 'AbortError') {
      console.error('Превышено время ожидания ответа от сервера (таймаут)');
      return { success: false, error: 'Таймаут запроса' };
    }
    
    return { success: false, error: error.message };
  }
}

// Функция для валидации структуры данных курсов
function validateCoursesStructure(coursesData) {
  if (!coursesData || typeof coursesData !== 'object') {
    return false;
  }
  
  // Проверяем наличие хотя бы одного курса с правильной структурой
  const courseKeys = Object.keys(coursesData);
  return courseKeys.length > 0 && 
    courseKeys.some(key => {
      const course = coursesData[key];
      return course && typeof course === 'object' && 
             (course.days || course.specialLessons || course.redirectUrl || course.noDayLessons);
    });
}

// Функция для кеширования всех URL вебхуков из уроков
function cacheWebhookUrls(coursesData) {
  const webhookUrls = {};
  
  // Проходим по всем курсам
  Object.keys(coursesData).forEach(professionId => {
    const course = coursesData[professionId];
    
    // Проверяем дни и уроки в них
    if (course.days && Array.isArray(course.days)) {
      course.days.forEach(day => {
        if (day.lessons && Array.isArray(day.lessons)) {
          day.lessons.forEach(lesson => {
            if (lesson.contentSource && lesson.contentSource.type === 'webhook' && lesson.contentSource.url) {
              const key = `${professionId}_${day.id}_${lesson.id}`;
              webhookUrls[key] = lesson.contentSource.url;
            }
          });
        }
      });
    }
    
    // Проверяем специальные уроки
    if (course.specialLessons && Array.isArray(course.specialLessons)) {
      course.specialLessons.forEach(lesson => {
        if (lesson.contentSource && lesson.contentSource.type === 'webhook' && lesson.contentSource.url) {
          const key = `${professionId}_special_${lesson.id}`;
          webhookUrls[key] = lesson.contentSource.url;
        }
      });
    }
    
    // Проверяем уроки без дней
    if (course.noDayLessons && Array.isArray(course.noDayLessons)) {
      course.noDayLessons.forEach(lesson => {
        if (lesson.contentSource && lesson.contentSource.type === 'webhook' && lesson.contentSource.url) {
          const key = `${professionId}_noday_${lesson.id}`;
          webhookUrls[key] = lesson.contentSource.url;
        }
      });
    }
  });
  
  // Сохраняем кеш URL вебхуков в localStorage
  localStorage.setItem('webhookUrlsCache', JSON.stringify(webhookUrls));
  
  if (window.devMode && window.devMode.enabled) {
    console.log(`🔧 [DevMode] Кешировано ${Object.keys(webhookUrls).length} URL вебхуков для уроков`);
  }
}

// Функция для применения обновленной конфигурации курсов
function applyCoursesConfig(coursesData) {
  console.log('Применение новой конфигурации курсов к приложению');
  
  if (window.devMode && window.devMode.enabled) {
    console.log('🔧 [DevMode] Применение новой конфигурации курсов к приложению');
  }
  
  // Сохраняем текущие выбранные значения
  const currentProfession = courseManager.currentProfession;
  const currentDayId = courseManager.currentDay ? courseManager.currentDay.id : null;
  const currentLessonId = courseManager.currentLesson ? courseManager.currentLesson.id : null;
  
  // Логируем обнаруженные вебхуки в данных перед применением
  if (window.devMode && window.devMode.enabled) {
    let webhookCount = 0;
    Object.values(coursesData).forEach(course => {
      if (course.days && Array.isArray(course.days)) {
        course.days.forEach(day => {
          if (day.lessons && Array.isArray(day.lessons)) {
            day.lessons.forEach(lesson => {
              if (lesson.contentSource && lesson.contentSource.type === 'webhook') {
                webhookCount++;
                console.log(`🔧 [DevMode] Вебхук в уроке ${lesson.id}: ${lesson.contentSource.url}`);
              }
            });
          }
        });
      }
    });
    console.log(`🔧 [DevMode] Всего найдено ${webhookCount} вебхуков в уроках`);
  }
  
  // Применяем новые данные
  courseManager.courses = coursesData;
  
  // Сначала уведомляем об обновлении курсов
  console.log('Уведомление подписчиков об обновлении курсов');
  courseManager.notifyCoursesUpdated();
  
  // Обновляем список профессий в селекторе
  console.log('Обновление селектора профессий');
  updateProfessionSelector();
  
  // Если currentProfession не найдена в новой конфигурации, берем первую доступную
  if (!coursesData[currentProfession]) {
    const professions = Object.keys(coursesData);
    if (professions.length > 0) {
      const newProfession = professions[0];
      console.log(`Текущая профессия ${currentProfession} не найдена, переключаемся на ${newProfession}`);
      courseManager.switchProfession(newProfession);
    } else {
      console.error('Нет доступных профессий в новой конфигурации');
      return;
    }
  } else {
    // Переключаемся на ту же профессию для обновления данных
    console.log(`Переключаемся на профессию: ${currentProfession}`);
    courseManager.switchProfession(currentProfession);
  }
  
  // Обновляем список дней
  console.log('Обновление списка дней');
  updateDaysList();
  
  // Если был выбран день, пытаемся выбрать его снова
  if (currentDayId) {
    const dayFound = courseManager.selectDay(currentDayId);
    if (dayFound) {
      console.log(`Выбран день с ID: ${currentDayId}`);
      updateLessonsList(); // Обновляем список уроков
      
      // Если был выбран урок, пытаемся выбрать его снова и обновить контент
      if (currentLessonId) {
        const lessonFound = courseManager.selectLesson(currentLessonId);
        if (lessonFound) {
          console.log(`Выбран урок с ID: ${currentLessonId}`);
          
          // Перезагружаем контент текущего урока, если гайд открыт
          if (document.getElementById('guide').classList.contains('hidden') === false) {
            console.log('Перезагрузка контента текущего урока');
            loadLessonContent();
          }
        } else {
          console.log(`Урок с ID ${currentLessonId} не найден в обновленной конфигурации`);
        }
      }
    } else {
      console.log(`День с ID ${currentDayId} не найден в обновленной конфигурации`);
    }
  }
  
  console.log('Данные курсов успешно обновлены из импортированного JSON');
  
  // Если мы на главной странице, обновляем ее
  if (document.getElementById('home').classList.contains('hidden') === false) {
    console.log('Обновление домашней страницы');
    renderHomePage();
  }
}

// Функция для обновления селектора профессий
function updateProfessionSelector() {
  const professionSelect = document.getElementById('profession-select');
  if (!professionSelect) return;
  
  // Сохраняем текущее выбранное значение
  const currentValue = professionSelect.value;
  
  // Получаем список профессий
  const professions = courseManager.getProfessions();
  
  // Очищаем селектор
  professionSelect.innerHTML = '';
  
  // Добавляем опции для каждой профессии
  professions.forEach(professionId => {
    const course = courseManager.courses[professionId];
    const option = document.createElement('option');
    option.value = professionId;
    option.textContent = course.title || professionId;
    professionSelect.appendChild(option);
  });
  
  // Восстанавливаем выбранное значение, если оно все еще доступно
  if (professions.includes(currentValue)) {
    professionSelect.value = currentValue;
  }
}

// Функция для обновления списка дней
function updateDaysList() {
  const daySelectionContainer = document.getElementById('day-selection');
  if (!daySelectionContainer) return;
  
  // Получаем список дней
  const days = courseManager.getDays();
  
  // Очищаем контейнер
  const container = daySelectionContainer.querySelector('.content-cards') || daySelectionContainer;
  container.innerHTML = '';
  
  // Добавляем карточки для каждого дня
  days.forEach(day => {
    const card = document.createElement('div');
    card.className = 'course-card';
    card.innerHTML = `
      <h3>${day.title || `День ${day.id}`}</h3>
      <p>${day.description || 'Нажмите, чтобы просмотреть уроки'}</p>
    `;
    card.onclick = () => selectDay(day.id);
    container.appendChild(card);
  });
}

// Функция для обновления списка уроков
function updateLessonsList() {
  if (!courseManager.currentDay) return;
  
  const taskButtonsDiv = document.getElementById('task-buttons');
  if (!taskButtonsDiv) return;
  
  // Очищаем список уроков
  taskButtonsDiv.innerHTML = '';
  
  // Получаем уроки для текущего дня
  const lessons = courseManager.getLessonsForCurrentDay();
  
  // Добавляем кнопки для каждого урока
  lessons.forEach(lesson => {
    const btn = document.createElement('button');
    btn.innerText = lesson.title;
    btn.onclick = function() { selectLesson(lesson.id); };
    taskButtonsDiv.appendChild(btn);
  });
}

// Настройка обработчиков событий
function setupEventListeners() {
  // Обработчик изменения профессии
  professionSelect.addEventListener('change', handleProfessionChange);
  
  // Обработчик для кнопки возврата к выбору дня
  document.querySelector('button[onclick="goBackToDaySelection()"]').addEventListener('click', goBackToDaySelection);
  
  // Обработчик для кнопки возврата к выбору задания
  document.querySelector('button[onclick="goBackToTaskSelection()"]').addEventListener('click', goBackToTaskSelection);
  
  // Обработчик для словаря
  document.querySelector('button[onclick="openVocabulary()"]').addEventListener('click', openVocabulary);
}

// Отображение домашней страницы
function renderHomePage() {
  // Проверяем, загружены ли данные курсов
  if (!courseManager.courses || Object.keys(courseManager.courses).length === 0) {
    console.error('Ошибка: данные курсов не загружены, невозможно отобразить домашнюю страницу');
    updateLoadingStatus('Ошибка: данные курсов не загружены', true);
    return;
  }
  
  console.log('Отображение домашней страницы с загруженными курсами:', Object.keys(courseManager.courses));
  showSection('home');
  daySelectionContainer.classList.remove('hidden');
  taskSelectionContainer.classList.add('hidden');
}

// Экспортируем функцию инициализации для использования из index.html
export default {
  initApp
};

// Обработчик смены профессии
function handleProfessionChange() {
  const selectedProfession = professionSelect.value;
  
  // Проверяем, имеет ли профессия перенаправление
  if (courseManager.hasRedirect(selectedProfession)) {
    const redirectUrl = courseManager.getRedirectUrl(selectedProfession);
    if (redirectUrl) {
      window.location.href = redirectUrl;
      return;
    }
  }
  
  // Если нет перенаправления, переключаемся на эту профессию
  courseManager.switchProfession(selectedProfession);
  renderHomePage();
}

// Выбор дня обучения
window.selectDay = function(dayId) {
  // Используем менеджер курсов для выбора дня
  const day = courseManager.selectDay(dayId);
  if (!day) {
    console.error(`День с ID ${dayId} не найден`);
    return;
  }
  
  // Обновляем интерфейс
  dayHeader.innerText = day.title;
  daySelectionContainer.classList.add('hidden');
  taskSelectionContainer.classList.remove('hidden');
  
  // Получаем уроки для этого дня и генерируем кнопки
  const lessons = courseManager.getLessonsForCurrentDay();
  taskButtonsDiv.innerHTML = '';
  lessons.forEach(lesson => {
    const btn = document.createElement('button');
    btn.innerText = lesson.title;
    btn.onclick = function() { selectLesson(lesson.id); };
    taskButtonsDiv.appendChild(btn);
  });
};

// Выбор урока
window.selectLesson = function(lessonId) {
  // Используем менеджер курсов для выбора урока
  const lesson = courseManager.selectLesson(lessonId);
  if (!lesson) {
    console.error(`Урок с ID ${lessonId} не найден`);
    return;
  }
  
  // Сохраняем текущий урок и логируем информацию
  console.log(`Выбран урок: ${lesson.title} (ID: ${lesson.id})`);
  
  // Логгируем информацию об источнике контента
  if (lesson.contentSource) {
    console.log(`Источник контента: ${lesson.contentSource.type}`);
    if (lesson.contentSource.type === 'webhook') {
      console.log(`URL вебхука: ${lesson.contentSource.url}`);
      
      // Проверяем, не изменился ли URL вебхука по сравнению с кешированным
      const cacheKey = `${courseManager.currentProfession}_${courseManager.currentDay ? courseManager.currentDay.id : 'special'}_${lesson.id}`;
      const cachedUrl = getCachedWebhookUrl(cacheKey);
      
      if (cachedUrl && cachedUrl !== lesson.contentSource.url) {
        console.log(`Обнаружено изменение URL вебхука для урока ${lesson.id}`);
        console.log(`Предыдущий URL: ${cachedUrl}`);
        console.log(`Новый URL: ${lesson.contentSource.url}`);
      }
    }
  }
  
  // Обновляем интерфейс
  guideTitle.innerText = `Guide: ${lesson.title}`;
  
  // Сбрасываем все аудио
  hideAllAudio();
  
  // Показываем или скрываем кнопку теста
  if (lesson.testSource) {
    testButton.classList.remove('hidden');
    testButton.onclick = function() {
      openTest(lesson);
    };
  } else {
    testButton.classList.add('hidden');
  }
  
  // Проверяем и отображаем аудио для урока
  const audioInfo = courseManager.getAudioInfo();
  if (audioInfo) {
    // Логика отображения соответствующего аудио
    if (lessonId === 'vocabulary') {
      const vocabAudio = document.getElementById('audio-vocabulary');
      if (vocabAudio) {
        vocabAudio.classList.remove('hidden');
        // Обновляем источник аудио, если он изменился
        if (audioInfo.trackUrl) {
          const iframe = vocabAudio.querySelector('iframe');
          if (iframe && iframe.src !== audioInfo.trackUrl) {
            iframe.src = audioInfo.trackUrl;
          }
        }
      }
    } else if (lessonId === 'what-prompting-is') {
      const firstLessonAudio = document.getElementById('audio-first-lesson');
      if (firstLessonAudio) {
        firstLessonAudio.classList.remove('hidden');
        // Обновляем источник аудио, если он изменился
        if (audioInfo.trackUrl) {
          const iframe = firstLessonAudio.querySelector('iframe');
          if (iframe && iframe.src !== audioInfo.trackUrl) {
            iframe.src = audioInfo.trackUrl;
          }
        }
      }
    }
  }
  
  // Показываем страницу гайда и загружаем контент
  showSection('guide');
  loadLessonContent();
};

// Получение кешированного URL вебхука по ключу
function getCachedWebhookUrl(key) {
  try {
    const cacheStr = localStorage.getItem('webhookUrlsCache');
    if (cacheStr) {
      const cache = JSON.parse(cacheStr);
      return cache[key];
    }
  } catch (e) {
    console.error('Ошибка при получении кешированного URL вебхука:', e);
  }
  return null;
}

// Открытие теста
function openTest(lesson) {
  // Открываем тест в новой вкладке или выполняем другую логику
  if (lesson.testSource && lesson.testSource.url) {
    window.open(lesson.testSource.url, '_blank');
  }
}

// Загрузка контента урока
async function loadLessonContent() {
  const contentSpinner = document.getElementById('content-loading-spinner');
  if (contentSpinner) contentSpinner.classList.remove('hidden');
  markdownContent.classList.add('hidden');
  
  // Показываем глобальный индикатор загрузки
  const globalLoadingOverlay = document.getElementById('global-loading-overlay');
  if (globalLoadingOverlay) {
    globalLoadingOverlay.style.display = 'flex';
    globalLoadingOverlay.style.opacity = '1';
    
    const globalStatusElement = document.getElementById('global-loading-status');
    if (globalStatusElement) {
      globalStatusElement.textContent = 'Загрузка контента урока...';
    }
  }
  
  try {
    // Получаем контент через менеджер курсов
    console.log('Запрос контента для текущего урока');
    const content = await courseManager.fetchLessonContent();
    
    if (!content) {
      throw new Error('Получен пустой контент');
    }
    
    console.log(`Получен контент (${content.length} символов), форматирование...`);
    
    // Форматируем контент
    const formattedHTML = createCollapsibleBlocks(content);
    
    console.log('Контент отформатирован, отображение...');
    
    // Отображаем контент
    markdownContent.innerHTML = formattedHTML;
    
    // Проверяем, есть ли задание для этого урока
    const task = courseManager.getTask();
    if (task) {
      console.log('Найдено задание для урока, добавление в контент');
      // Логика отображения задания
      const taskHTML = marked.parse(task);
      const taskSection = document.createElement('div');
      taskSection.className = 'task-section';
      taskSection.innerHTML = `
        <h2>Practical Task</h2>
        <div class="task-content">${taskHTML}</div>
      `;
      markdownContent.appendChild(taskSection);
    }
    
    // Скрываем спиннер и показываем контент
    if (contentSpinner) contentSpinner.classList.add('hidden');
    markdownContent.classList.remove('hidden');
    
    // Скрываем глобальный индикатор загрузки с плавным исчезновением
    if (globalLoadingOverlay) {
      globalLoadingOverlay.style.transition = 'opacity 0.5s';
      globalLoadingOverlay.style.opacity = '0';
      setTimeout(() => {
        globalLoadingOverlay.style.display = 'none';
      }, 500);
    }
    
    console.log('Контент урока успешно загружен и отображен');
  } catch (error) {
    console.error('Ошибка при загрузке контента урока:', error);
    
    // Форматируем сообщение об ошибке
    markdownContent.innerHTML = `
      <div style="background-color: #fff0f0; padding: 15px; border-left: 4px solid #ff0000; margin-bottom: 20px;">
        <h3>Ошибка загрузки контента</h3>
        <p>Пожалуйста, обратитесь к руководителю команды.</p>
        <p><strong>Причина:</strong> ${error.message || error.toString()}</p>
        <button onclick="location.reload()" style="margin-top: 15px; background-color: #4CAF50; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer;">
          Перезагрузить страницу
        </button>
      </div>
    `;
    
    // Скрываем спиннер и показываем контент
    if (contentSpinner) contentSpinner.classList.add('hidden');
    markdownContent.classList.remove('hidden');
    
    // Скрываем глобальный индикатор загрузки
    if (globalLoadingOverlay) {
      globalLoadingOverlay.style.transition = 'opacity 0.5s';
      globalLoadingOverlay.style.opacity = '0';
      setTimeout(() => {
        globalLoadingOverlay.style.display = 'none';
      }, 500);
    }
  }
}

// Открытие словаря
window.openVocabulary = function() {
  // Используем специальный урок "vocabulary"
  selectLesson('vocabulary');
};

// Возврат к выбору дня
window.goBackToDaySelection = function() {
  taskSelectionContainer.classList.add('hidden');
  daySelectionContainer.classList.remove('hidden');
};

// Возврат к выбору задания
window.goBackToTaskSelection = function() {
  hideAllAudio();
  markdownContent.innerHTML = '';
  courseManager.currentLesson = null;
  homeContainer.classList.remove('hidden');
  if (courseManager.currentDay) {
    selectDay(courseManager.currentDay.id);
  }
  guideContainer.classList.add('hidden');
};

// Скрыть все аудио
function hideAllAudio() {
  const audioIds = [
    'audio-first-lesson',
    'audio-vocabulary'
  ];
  audioIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
}

// Показать определенную секцию
function showSection(id) {
  homeContainer.classList.add('hidden');
  guideContainer.classList.add('hidden');
  
  const target = document.getElementById(id);
  if (target) target.classList.remove('hidden');
}

// Функция для создания раскрывающихся блоков из markdown
function createCollapsibleBlocks(markdown) {
  // Имплементация функции createCollapsibleBlocks из вашего кода
  // ...
  
  // Упрощенная версия для примера
  return marked.parse(markdown);
}

// Редирект на страницу администрирования
window.openAdminPanel = function() {
  window.location.href = 'admin.html';
};

// Инициализация приложения при загрузке
document.addEventListener('DOMContentLoaded', initApp);
