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

  // Автоматически импортируем настройки вебхуков, если они отсутствуют
  await autoImportWebhooks();

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
      updateGlobalLoadingStatus('Критическая ошибка! Не удалось инициализировать менеджера курсов');
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

// Функция для автоматического импорта настроек вебхуков
async function autoImportWebhooks() {
  console.log('Проверка наличия настроек вебхуков...');
  const webhookSettingsStr = localStorage.getItem('webhookSettings');

  // Если настройки вебхуков не найдены, устанавливаем значения по умолчанию
  if (!webhookSettingsStr) {
    console.log('Настройки вебхуков не найдены, устанавливаем значения по умолчанию');

    const defaultWebhookSettings = {
      exportUrl: 'https://auto.crm-s.com/webhook/SaveWebhooks',
      importUrl: 'https://auto.crm-s.com/webhook/OnboardingJSON',
      getUrl: 'https://auto.crm-s.com/webhook/GetOnboardingHooks'
    };

    // Сохраняем настройки в localStorage
    localStorage.setItem('webhookSettings', JSON.stringify(defaultWebhookSettings));
    localStorage.setItem('adminExportWebhook', defaultWebhookSettings.exportUrl);
    localStorage.setItem('adminImportWebhook', defaultWebhookSettings.importUrl);
    localStorage.setItem('adminGetWebhook', defaultWebhookSettings.getUrl);

    console.log('Установлены настройки вебхуков по умолчанию:');
    console.log('- Import URL:', defaultWebhookSettings.importUrl);
    console.log('- Export URL:', defaultWebhookSettings.exportUrl);
    console.log('- Get URL:', defaultWebhookSettings.getUrl);

    // Обновляем интерфейс, если мы находимся на странице администратора
    if (window.adminInterface && typeof window.adminInterface.loadWebhookSettings === 'function') {
      window.adminInterface.loadWebhookSettings();
    }

    // Импортируем вебхуки с сервера по умолчанию
    await importWebhooksFromServer(defaultWebhookSettings.getUrl);

    return defaultWebhookSettings;
  }

  try {
    // Если настройки есть, проверяем их полноту
    const settings = JSON.parse(webhookSettingsStr);
    let updated = false;

    if (!settings.importUrl) {
      settings.importUrl = 'https://auto.crm-s.com/webhook/OnboardingJSON';
      localStorage.setItem('adminImportWebhook', settings.importUrl);
      updated = true;
    }

    if (!settings.exportUrl) {
      settings.exportUrl = 'https://auto.crm-s.com/webhook/SaveWebhooks';
      localStorage.setItem('adminExportWebhook', settings.exportUrl);
      updated = true;
    }

    if (!settings.getUrl) {
      settings.getUrl = 'https://auto.crm-s.com/webhook-test/GetOnboardingHooks';
      localStorage.setItem('adminGetWebhook', settings.getUrl);
      updated = true;
    }

    if (updated) {
      localStorage.setItem('webhookSettings', JSON.stringify(settings));
      console.log('Обновлены недостающие настройки вебхуков');
    } else {
      console.log('Найдены все необходимые настройки вебхуков');
    }

    // Автоматически импортируем вебхуки с сервера
    await importWebhooksFromServer(settings.getUrl);

    return settings;
  } catch (e) {
    console.error('Ошибка при проверке настроек вебхуков:', e);
    return null;
  }
}

// Функция для импорта вебхуков с сервера
async function importWebhooksFromServer(url) {
  if (!url) {
    console.log('URL для получения вебхуков не указан, пропускаем импорт');
    return;
  }

  console.log(`Автоматический импорт вебхуков с URL: ${url}`);
  updateLoadingStatus('Получение настроек вебхуков...');

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Cache-Control': 'no-cache'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`HTTP ошибка! Статус: ${response.status}`);
    }

    const responseText = await response.text();
    console.log(`Получен ответ с вебхуками (${responseText.length} символов)`);

    try {
      // Пытаемся распарсить как JSON
      const jsonData = JSON.parse(responseText);

      // Обрабатываем полученные данные вебхуков
      processWebhooksData(jsonData);

      updateLoadingStatus('Настройки вебхуков успешно импортированы');
      return true;
    } catch (jsonError) {
      console.error('Ошибка при парсинге JSON с вебхуками:', jsonError);

      // Пытаемся найти JSON в тексте
      const jsonRegex = /{[\s\S]*}/;
      const match = responseText.match(jsonRegex);

      if (match && match[0]) {
        try {
          const extractedData = JSON.parse(match[0]);
          processWebhooksData(extractedData);
          updateLoadingStatus('Настройки вебхуков успешно импортированы из текста');
          return true;
        } catch (e) {
          console.error('Ошибка при извлечении JSON из текста:', e);
        }
      }

      // Пытаемся найти URL в тексте
      const urlRegex = /(https?:\/\/[^\s"]+)/g;
      const urls = responseText.match(urlRegex);

      if (urls && urls.length > 0) {
        console.log(`Найдено ${urls.length} URL в ответе`);

        // Сохраняем первый найденный URL как URL импорта
        if (urls.length > 0) {
          localStorage.setItem('adminImportWebhook', urls[0]);
          console.log(`Установлен URL импорта из текста: ${urls[0]}`);

          // Обновляем также в настройках
          const settings = JSON.parse(localStorage.getItem('webhookSettings') || '{}');
          settings.importUrl = urls[0];
          localStorage.setItem('webhookSettings', JSON.stringify(settings));

          updateLoadingStatus('URL импорта установлен из текстового ответа');
          return true;
        }
      }
    }
  } catch (error) {
    console.error('Ошибка при импорте вебхуков:', error);
    updateLoadingStatus(`Ошибка при импорте вебхуков: ${error.message}`);
    return false;
  }
}

// Функция для обработки полученных данных вебхуков
function processWebhooksData(data) {
  try {
    console.log('Обработка данных вебхуков:', Object.keys(data));
    let updated = false;
    let settings = JSON.parse(localStorage.getItem('webhookSettings') || '{}');

    // 1. Если есть webhooks массив
    if (data.webhooks && Array.isArray(data.webhooks)) {
      console.log(`Найдено ${data.webhooks.length} вебхуков в массиве webhooks`);

      // Ищем вебхуки по типу или ID
      for (const webhook of data.webhooks) {
        if (webhook.url) {
          if (webhook.type === 'export' || webhook.id === 'export_courses_hook') {
            settings.exportUrl = webhook.url;
            localStorage.setItem('adminExportWebhook', webhook.url);
            console.log(`Установлен URL экспорта: ${webhook.url}`);
            updated = true;
          } else if (webhook.type === 'import' || webhook.id === 'import_courses_hook') {
            settings.importUrl = webhook.url;
            localStorage.setItem('adminImportWebhook', webhook.url);
            localStorage.setItem('importWebhookUrl', webhook.url);
            console.log(`Установлен URL импорта: ${webhook.url}`);
            updated = true;
          } else if (webhook.type === 'notification' || webhook.id === 'notify_updates_hook') {
            settings.getUrl = webhook.url;
            localStorage.setItem('adminGetWebhook', webhook.url);
            console.log(`Установлен URL получения вебхуков: ${webhook.url}`);
            updated = true;
          }
        }
      }
    }

    // 2. Если данные содержат прямые поля с URL
    if (data.exportUrl) {
      settings.exportUrl = data.exportUrl;
      localStorage.setItem('adminExportWebhook', data.exportUrl);
      console.log(`Установлен URL экспорта: ${data.exportUrl}`);
      updated = true;
    }

    if (data.importUrl) {
      settings.importUrl = data.importUrl;
      localStorage.setItem('adminImportWebhook', data.importUrl);
      localStorage.setItem('importWebhookUrl', data.importUrl);
      console.log(`Установлен URL импорта: ${data.importUrl}`);
      updated = true;
    }

    if (data.getWebhooksUrl) {
      settings.getUrl = data.getWebhooksUrl;
      localStorage.setItem('adminGetWebhook', data.getWebhooksUrl);
      console.log(`Установлен URL получения вебхуков: ${data.getWebhooksUrl}`);
      updated = true;
    }

    // 3. Если в данных есть URL в других форматах
    const foundUrls = findUrlsInObject(data);
    if (foundUrls.length > 0) {
      console.log(`Найдено ${foundUrls.length} URL-адресов в данных`);

      // Автоматически устанавливаем URL, если можем определить их тип
      foundUrls.forEach(urlInfo => {
        if (urlInfo.type === 'export') {
          settings.exportUrl = urlInfo.url;
          localStorage.setItem('adminExportWebhook', urlInfo.url);
          console.log(`Автоматически установлен URL экспорта: ${urlInfo.url}`);
          updated = true;
        } else if (urlInfo.type === 'import') {
          settings.importUrl = urlInfo.url;
          localStorage.setItem('adminImportWebhook', urlInfo.url);
          localStorage.setItem('importWebhookUrl', urlInfo.url);
          console.log(`Автоматически установлен URL импорта: ${urlInfo.url}`);
          updated = true;
        } else if (urlInfo.type === 'get') {
          settings.getUrl = urlInfo.url;
          localStorage.setItem('adminGetWebhook', urlInfo.url);
          console.log(`Автоматически установлен URL получения вебхуков: ${urlInfo.url}`);
          updated = true;
        }
      });
    }

    if (updated) {
      // Сохраняем обновленные настройки
      localStorage.setItem('webhookSettings', JSON.stringify(settings));
      console.log('Настройки вебхуков обновлены из полученных данных');

      // Обновляем интерфейс, если мы находимся на странице администратора
      if (window.adminInterface && typeof window.adminInterface.loadWebhookSettings === 'function') {
        window.adminInterface.loadWebhookSettings();
      }
    }
  } catch (error) {
    console.error('Ошибка при обработке данных вебхуков:', error);
  }
}

// Рекурсивный поиск URL в объекте
function findUrlsInObject(obj, path = '', results = []) {
  if (!obj || typeof obj !== 'object') return results;

  // Обрабатываем все свойства объекта
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      const currentPath = path ? `${path}.${key}` : key;

      // Если значение - строка, проверяем, является ли оно URL
      if (typeof value === 'string' && isValidUrl(value)) {
        // Определяем тип URL на основе ключа и содержимого
        let type = 'unknown';

        if (key.toLowerCase().includes('export') || value.toLowerCase().includes('export') ||
            key.toLowerCase().includes('save') || value.toLowerCase().includes('save')) {
          type = 'export';
        } else if (key.toLowerCase().includes('import') || value.toLowerCase().includes('import') ||
                  key.toLowerCase().includes('get') || value.toLowerCase().includes('get')) {
          type = 'import';
        } else if (key.toLowerCase().includes('webhook') || value.toLowerCase().includes('webhook') ||
                  key.toLowerCase().includes('notification') || value.toLowerCase().includes('notification')) {
          type = 'get';
        }

        results.push({
          url: value,
          path: currentPath,
          type: type
        });
      } 
      // Если значение - объект или массив, рекурсивно ищем URL в нем
      else if (typeof value === 'object' && value !== null) {
        findUrlsInObject(value, currentPath, results);
      }
    }
  }

  return results;
}

// Проверка валидности URL
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

// Принудительная синхронизация с облаком (возвращает Promise)
async function forceSyncWithCloud() {
  return new Promise(async (resolve, reject) => {
    console.log('Принудительная синхронизация с облаком...');
    updateLoadingStatus('Поиск URL для импорта данных...');

    // Сначала проверяем и импортируем настройки вебхуков
    await autoImportWebhooks();

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
        // Обновляем статус
        updateLoadingStatus(`Отправка запроса на ${importWebhookUrl.split('/').slice(-1)[0]}`);

        // Пытаемся получить новые данные с сервера
        console.log(`Выполняется импорт данных с URL: ${importWebhookUrl}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // Уменьшаем таймаут до 15 секунд

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

          // Обработка текстовых ответов без JSON
          if (responseText && (responseText.trim() === 'Accepted' || responseText.trim() === 'OK' || responseText.trim().startsWith('Success'))) {
            console.log('Получен положительный текстовый ответ от сервера:', responseText.trim());
            resolve({success: true, updated: false, message: `Сервер ответил: ${responseText.trim()}`});
            return;
          }

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

            // Проверяем наличие резервной копии
            const backupDataStr = localStorage.getItem('coursesBackup');
            if (backupDataStr) {
              console.log('Используем резервную копию из-за ошибки парсинга JSON');
              resolve({success: true, updated: false, fromBackup: true});
              return;
            }

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

            // Проверяем наличие резервной копии
            const backupDataStr = localStorage.getItem('coursesBackup');
            if (backupDataStr) {
              console.log('Используем резервную копию, так как не найдены данные о курсах в ответе');
              resolve({success: true, updated: false, fromBackup: true});
              return;
            }

            resolve({success: false, error: 'Данные о курсах не найдены'});
          }
        } catch (fetchError) {
          // Очищаем таймаут при ошибке
          clearTimeout(timeoutId);

          console.error('Ошибка при получении данных:', fetchError);
          updateLoadingStatus(`Ошибка при получении данных: ${fetchError.message}`);

          // Проверяем наличие резервной копии
          const backupDataStr = localStorage.getItem('coursesBackup');
          if (backupDataStr) {
            try {
              // Используем резервную копию в случае ошибки сети
              console.log('Используем резервную копию из-за ошибки сети');
              console.log('Резервная копия от:', localStorage.getItem('coursesBackupTimestamp'));

              // Устанавливаем courseManager.courses из резервной копии
              const backupData = JSON.parse(backupDataStr);
              courseManager.courses = backupData;

              resolve({success: true, updated: false, fromBackup: true});
              return;
            } catch (backupError) {
              console.error('Ошибка при загрузке резервной копии:', backupError);
            }
          }

          if (fetchError.name === 'AbortError') {
            resolve({success: false, error: 'Таймаут запроса'});
          } else {
            resolve({success: false, error: fetchError.message});
          }
        }
      } catch (e) {
        console.error('Ошибка при принудительной синхронизации:', e);
        updateLoadingStatus(`Ошибка синхронизации: ${e.message}`);

        // Пытаемся использовать резервную копию в случае любой ошибки
        const backupDataStr = localStorage.getItem('coursesBackup');
        if (backupDataStr) {
          try {
            const backupData = JSON.parse(backupDataStr);
            courseManager.courses = backupData;
            resolve({success: true, updated: false, fromBackup: true});
            return;
          } catch (backupError) {
            console.error('Ошибка при загрузке резервной копии:', backupError);
            reject(e);
          }
        } else {
          reject(e);
        }
      }
    } else {
      console.log('URL вебхука для импорта не найден, проверяем резервную копию');

      // Если URL не найден, проверяем резервную копию
      const backupDataStr = localStorage.getItem('coursesBackup');
      if (backupDataStr) {
        try {
          console.log('URL импорта не найден, используем резервную копию');
          const backupData = JSON.parse(backupDataStr);
          courseManager.courses = backupData;
          resolve({success: true, updated: false, fromBackup: true});
          return;
        } catch (backupError) {
          console.error('Ошибка при загрузке резервной копии:', backupError);
        }
      }

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
      // Сначала проверяем и импортируем настройки вебхуков
      await autoImportWebhooks();

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

      // ЕслиURL не найден в webhookSettings, проверяем другие источники
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
          const result = await tryImportFromUrl(importWebhookUrl);

          // Если данные были успешно обновлены, обновляем интерфейс
          if (result && result.success && result.updated) {
            console.log('Данные синхронизированы, обновляем интерфейс');
            updateProfessionSelector();

            // Обновляем текущую страницу
            if (document.getElementById('home').classList.contains('hidden') === false) {
              // Если мы на главной, обновляем список дней
              if (courseManager.currentProfession) {
                updateDaysList();
              }
            } else if (document.getElementById('guide').classList.contains('hidden') === false) {
              // Если мы на странице гайда и текущий урок все еще существует,
              // оставляем как есть. Иначе возвращаемся на главную
              if (!courseManager.currentLesson) {
                goBackToTaskSelection();
              }
            }
          }
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
      credentials: 'omit', // Added credentials: 'omit'
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

      console.log('Raw response:', JSON.stringify(responseText));

      // Если ответ пустой или очень короткий
      if (!responseText || responseText.length < 10) {
        // Проверяем, что это текстовый ответ "Accepted", "OK" и т.д.
        if (responseText && (responseText.trim() === 'Accepted' || responseText.trim() === 'OK' || responseText.trim().startsWith('Success'))) {
          console.log('Получен положительный текстовый ответ от сервера:', responseText.trim());
          return { success: true, updated: false, message: `Сервер ответил: ${responseText.trim()}` };
        }
      }

      // Пытаемся распарсить JSON
      try {
        updateLoadingStatus('Обработка данных в формате JSON...');
        // Всегда пытаемся парсить ответ как JSON, независимо от Content-Type
        try {
          // Пробуем парсить весь текст ответа как JSON
          importData = JSON.parse(responseText.trim());
          console.log('Успешно распарсен JSON из полного ответа');
        } catch (initialParseError) {
          // Если не получилось, проверяем структуру текста
          const trimmedText = responseText.trim();
          if (trimmedText.startsWith('{') || trimmedText.startsWith('[')) {
            // Если ответ начинается с { или [, возможно проблема в декодировании
            try {
              importData = JSON.parse(trimmedText);
              console.log('Успешно распарсен JSON из ответа после обрезки');
            } catch (e) {
              throw initialParseError; // Если снова не получилось, возвращаемся к исходной ошибке
            }
          } else {
            // Если текст не начинается с { или [, пытаемся найти JSON в нём
            throw new Error('Ответ не содержит JSON напрямую, поиск JSON внутри ответа');
          }
        }
      } catch (jsonError) {
        updateLoadingStatus('Поиск JSON данных в ответе...');
        console.log('Не удалось распарсить ответ как JSON, ищем JSON в тексте:', jsonError.message);

        // Пробуем найти JSON в тексте
        const jsonRegex = /{[\s\S]*}/;
        const match = responseText.match(jsonRegex);

        if (match && match[0]) {
          try {
            importData = JSON.parse(match[0]);
            console.log('Найден и распарсен JSON в тексте ответа');
          } catch (nestedError) {
            console.error('Ошибка при парсинге найденного JSON:', nestedError.message);
            // Если это текстовый ответ без JSON, рассматриваем как успешный
            if (responseText.length < 100) {
              console.log('Получен короткий текстовый ответ, считаем синхронизацию успешной');
              return { success: true, updated: false, message: `Сервер ответил: ${responseText.substring(0, 50)}` };
            }
            throw new Error('Не удалось распарсить найденный JSON');
          }
        } else {
          // Если в ответе нет JSON, но есть какой-то текст, считаем это успешным ответом
          if (responseText.trim().length > 0 && responseText.trim().length < 100) {
            console.log('Получен текстовый ответ без JSON, считаем синхронизацию успешной');
            return { success: true, updated: false, message: `Сервер ответил: ${responseText.substring(0, 50)}` };
          }
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

  // Проверяем, что есть секция для дней
  let dayCardsContainer = daySelectionContainer.querySelector('.content-cards');
  if (!dayCardsContainer) {
    // Если контейнера для карточек нет, создаем его
    dayCardsContainer = document.createElement('div');
    dayCardsContainer.className = 'content-cards';
    daySelectionContainer.appendChild(dayCardsContainer);
  }

  // Очищаем контейнер с карточками дней
  dayCardsContainer.innerHTML = '';

  // Добавляем заголовок для раздела дней
  const daysTitle = document.createElement('h2');
  daysTitle.textContent = 'Выберите день обучения:';
  dayCardsContainer.appendChild(daysTitle);

  console.log(`Загружено ${days.length} дней для профессии ${courseManager.currentProfession}`);

  // Добавляем карточки для каждого дня
  days.forEach(day => {
    const card = document.createElement('div');
    card.className = 'course-card';
    card.innerHTML = `
      <h3>${day.title || `День ${day.id}`}</h3>
      <p>${day.description || 'Нажмите, чтобы просмотреть уроки'}</p>
    `;
    card.onclick = () => selectDay(day.id);
    dayCardsContainer.appendChild(card);
  });

  // Если нет дней, показываем сообщение
  if (days.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.textContent = 'Для этой профессии еще не добавлены дни обучения.';
    dayCardsContainer.appendChild(emptyMessage);
  }
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

  console.log(`Загружено ${lessons.length} уроков для дня ${courseManager.currentDay.id}`);

  // Если нет уроков, отображаем сообщение
  if (lessons.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.textContent = 'Для этого дня еще не добавлены уроки.';
    emptyMessage.className = 'empty-message';
    taskButtonsDiv.appendChild(emptyMessage);
    return;
  }

  // Добавляем кнопки для каждого урока
  lessons.forEach(lesson => {
    const btn = document.createElement('button');
    btn.innerText = lesson.title || `Урок ${lesson.id}`;
    btn.onclick = function() { selectLesson(lesson.id); };

    // Добавляем дополнительную информацию (если есть)
    if (lesson.description) {
      const description = document.createElement('small');
      description.textContent = lesson.description;
      description.style.display = 'block';
      description.style.marginTop = '5px';
      description.style.color = '#666';
      btn.appendChild(description);
    }

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

  // Обновляем список профессий
  updateProfessionSelector();

  // Если у нас выбрана профессия, подготовим список дней
  if (courseManager.currentProfession) {
    // Генерируем карточки для дней
    updateDaysList();
    // Добавляем кнопку словаря динамически
    updateVocabularyButton();
  }

  // Показываем домашнюю страницу
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
      console.log(`Перенаправление на внешний ресурс: ${redirectUrl}`);
      window.location.href = redirectUrl;
      return;
    }
  }

  // Если нет перенаправления, переключаемся на эту профессию
  console.log(`Переключение на профессию: ${selectedProfession}`);
  courseManager.switchProfession(selectedProfession);

  // Обновляем список дней для выбранной профессии
  updateDaysList();

  // Сбрасываем выбранный урок и возвращаемся на домашнюю страницу
  courseManager.currentLesson = null;
  showSection('home');
  daySelectionContainer.classList.remove('hidden');
  taskSelectionContainer.classList.add('hidden');

  // Обновляем кнопку словаря при смене профессии
  updateVocabularyButton();
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
  dayHeader.innerText = day.title || `День ${day.id}`;
  daySelectionContainer.classList.add('hidden');
  taskSelectionContainer.classList.remove('hidden');

  // Обновляем список уроков для выбранного дня
  updateLessonsList();
};

// Выбор урока
window.selectLesson = function(lessonId) {
  // Используем менеджер курсов для выбора урока
  const lesson = courseManager.selectLesson(lessonId);
  if (!lesson) {
    console.error(`Урок с ID ${lessonId} не найден`);
    alert(`Урок с ID ${lessonId} не найден. Пожалуйста, выберите другой урок.`);
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
  } else {
    console.warn(`Урок ${lessonId} не имеет источника контента`);
  }

  // Обновляем интерфейс
  guideTitle.innerText = `Guide: ${lesson.title || `Урок ${lesson.id}`}`;

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
    console.log('Найдена информация об аудио для урока:', lesson.id);
    console.log('Аудио информация:', JSON.stringify(audioInfo));
    showAudioForLesson(lesson);
  } else {
    console.log('Для урока', lesson.id, 'аудио не найдено');
  }

  // Показываем страницу гайда и загружаем контент
  showSection('guide');

  // Показываем индикатор загрузки перед загрузкой контента
  const contentSpinner = document.getElementById('content-loading-spinner');
  if (contentSpinner) contentSpinner.classList.remove('hidden');

  // Загружаем контент урока
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
    // Проверяем, есть ли выбранный урок
    if (!courseManager.currentLesson) {
      throw new Error('Не выбран урок для загрузки');
    }

    // Получаем контент через менеджер курсов
    console.log('Запрос контента для урока:', courseManager.currentLesson.id);
    const content = await courseManager.fetchLessonContent();

    if (!content) {
      throw new Error('Получен пустой контент');
    }

    console.log(`Получен контент (${content.length} символов), форматирование...`);

    // Добавляем заголовок, если его нет в контенте
    let processedContent = content;
    if (!content.trim().startsWith('#')) {
      processedContent = `# ${courseManager.currentLesson.title || 'Урок'}\n\n${content}`;
    }

    // Форматируем контент
    const formattedHTML = createCollapsibleBlocks(processedContent);

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

    // Формируем название урока для отображения в сообщении об ошибке
    const lessonTitle = courseManager.currentLesson 
      ? (courseManager.currentLesson.title || `Урок ${courseManager.currentLesson.id}`)
      : 'Неизвестный урок';

    // Форматируем сообщение об ошибке
    markdownContent.innerHTML = `
      <div style="background-color: #fff0f0; padding: 15px; border-left: 4px solid #ff0000; margin-bottom: 20px;">
        <h3>Ошибка загрузки контента урока "${lessonTitle}"</h3>
        <p>Пожалуйста, обратитесь к руководителю команды.</p>
        <p><strong>Причина:</strong> ${error.message || error.toString()}</p>
        <div style="margin-top: 15px;">
          <button onclick="goBackToTaskSelection()" style="margin-right: 10px; background-color: #3498db; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer;">
            Вернуться к списку уроков
          </button>
          <button onclick="loadLessonContent()" style="margin-right: 10px; background-color: #f39c12; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer;">
            Повторить загрузку
          </button>
          <button onclick="location.reload()" style="background-color: #4CAF50; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer;">
            Перезагрузить страницу
          </button>
        </div>
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
    "audio-first-lesson",
    "audio-vocabulary",
    "audio-embed"
  ];
  audioIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add("hidden");
      // Очищаем embed-контейнер для предотвращения проблем
      if (id === "audio-embed") {
        el.innerHTML = '';
      }
    } else {
      console.log(`Аудио элемент с ID ${id} не найден на странице`);
    }
  });

  // Добавляем проверку для дополнительных аудио контейнеров
  const audioContainers = document.querySelectorAll('.audio-container');
  if (audioContainers.length > 0) {
    audioContainers.forEach(container => {
      container.classList.add('hidden');
    });
    console.log(`Скрыто ${audioContainers.length} дополнительных аудио контейнеров`);
  }
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
  markdown = markdown.trim();

  const lines = markdown.split("\n");
  let htmlOutput = "";
  let currentLevel1Title = "";
  let currentLevel1Content = [];
  let inLevel1 = false;

  // Если первая строка не является заголовком первого уровня, добавляем его
  if (lines.length > 0 && !lines[0].match(/^#\s+/)) {
    lines.unshift("# " + (window.currentTopic ? window.currentTopic.title : "Content"));
  }

  // Проходим по каждой строке и обрабатываем заголовки
  for (let line of lines) {
    // Ищем заголовки первого уровня (# Заголовок)
    let match = line.match(/^#(?!#)\s*(.+)/);
    if (match) {
      // Если уже был заголовок первого уровня, рендерим его перед началом нового
      if (inLevel1) {
        htmlOutput += renderLevel1Block(currentLevel1Title, currentLevel1Content.join("\n"));
      }
      currentLevel1Title = match[1].trim();
      currentLevel1Content = [];
      inLevel1 = true;
    } else {
      // Если не заголовок, добавляем строку к текущему содержимому
      if (inLevel1) {
        currentLevel1Content.push(line);
      }
    }
  }

  // Обрабатываем последний блок
  if (inLevel1) {
    htmlOutput += renderLevel1Block(currentLevel1Title, currentLevel1Content.join("\n"));
  } else if (!htmlOutput) {
    // Если не были найдены заголовки, просто преобразуем весь markdown
    htmlOutput = marked.parse(markdown);
  }

  return htmlOutput;
}

// Рендеринг блока первого уровня и поиск подзаголовков второго уровня
function renderLevel1Block(title, content) {
  const lines = content.split("\n");
  let html = "";
  let subBlocksHtml = "";
  let currentSubTitle = "";
  let currentSubContent = [];
  let hasSubHeader = false;
  let preambleLines = [];

  // Обрабатываем содержимое блока первого уровня, ищем заголовки второго уровня
  for (let line of lines) {
    let subMatch = line.match(/^##(?!#)\s*(.+)/);
    if (subMatch) {
      hasSubHeader = true;
      if (currentSubTitle) {
        subBlocksHtml += renderLevel2Block(currentSubTitle, currentSubContent.join("\n"));
        currentSubContent = [];
      }
      currentSubTitle = subMatch[1].trim();
    } else {
      if (hasSubHeader) {
        currentSubContent.push(line);
      } else {
        preambleLines.push(line);
      }
    }
  }

  // Обрабатываем последний подблок, если он есть
  if (currentSubTitle) {
    subBlocksHtml += renderLevel2Block(currentSubTitle, currentSubContent.join("\n"));
  }

  // Парсим преамбулу (текст между заголовком первого уровня и первым заголовком второго уровня)
  if (preambleLines.length) {
    html += marked.parse(preambleLines.join("\n"));
  }

  html += subBlocksHtml;

  return `<details>
  <summary>${title}</summary>
  <div>${html}</div>
</details>`;
}

// Рендеринг блока второго уровня и поиск подзаголовков третьего уровня
function renderLevel2Block(title, content) {
  const lines = content.split("\n");
  let html = "";
  let subBlocksHtml = "";
  let currentSubTitle = "";
  let currentSubContent = [];
  let hasSubHeader = false;
  let preambleLines = [];

  // Обрабатываем содержимое блока второго уровня, ищем заголовки третьего уровня
  for (let line of lines) {
    let subMatch = line.match(/^###(?!#)\s*(.+)/);
    if (subMatch) {
      hasSubHeader = true;
      if (currentSubTitle) {
        subBlocksHtml += renderLevel3Block(currentSubTitle, currentSubContent.join("\n"));
        currentSubContent = [];
      }
      currentSubTitle = subMatch[1].trim();
    } else {
      if (hasSubHeader) {
        currentSubContent.push(line);
      } else {
        preambleLines.push(line);
      }
    }
  }

  // Обрабатываем последний подблок третьего уровня, если он есть
  if (currentSubTitle) {
    subBlocksHtml += renderLevel3Block(currentSubTitle, currentSubContent.join("\n"));
  }

  // Парсим преамбулу (текст между заголовком второго уровня и первым заголовком третьего уровня)
  if (preambleLines.length) {
    html += marked.parse(preambleLines.join("\n"));
  }

  html += subBlocksHtml;

  return `<details style="margin-left:20px;">
  <summary>${title}</summary>
  <div>${html}</div>
</details>`;
}

// Рендеринг блока третьего уровня
function renderLevel3Block(title, content) {
  // Для третьего уровня просто парсим содержимое без поиска дополнительных подзаголовков
  let parsedContent = marked.parse(content);
  return `<details style="margin-left:40px;">
  <summary>${title}</summary>
  <div>${parsedContent}</div>
</details>`;
}

// Редирект на страницу администрирования
window.openAdminPanel = function() {
  window.location.href = 'admin.html';
};

// Инициализация приложения при загрузке
document.addEventListener('DOMContentLoaded', initApp);

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

// Функция для динамического обновления кнопок дней
function updateDynamicDaysButtons() {
  const daySelectionContainer = document.getElementById('day-selection');
  if (!daySelectionContainer) return;

  const daysButtonsContainer = daySelectionContainer.querySelector('.dynamic-days-buttons');
  if (!daysButtonsContainer) {
    const container = document.createElement('div');
    container.className = 'dynamic-days-buttons';
    daySelectionContainer.appendChild(container);
  } else {
    daysButtonsContainer.innerHTML = '';
  }

  const days = courseManager.getDays();
  days.forEach(day => {
    const button = document.createElement('button');
    button.textContent = day.title || `День ${day.id}`;
    button.addEventListener('click', () => selectDay(day.id));
    daysButtonsContainer.appendChild(button);
  });
}
// Функция для обновления кнопки словаря
function updateVocabularyButton() {
  const vocabularyContainer = document.getElementById('vocabulary-container');
  if (!vocabularyContainer) return;

  // Очищаем контейнер
  vocabularyContainer.innerHTML = '';

  // Проверяем, есть ли у нас выбранная профессия и загружены ли курсы
  if (!courseManager.currentProfession || !courseManager.courses) return;

  const currentCourse = courseManager.courses[courseManager.currentProfession];

  // Проверяем наличие специальных уроков
  if (currentCourse && currentCourse.specialLessons && Array.isArray(currentCourse.specialLessons)) {
    // Ищем урок словаря в специальных уроках
    const vocabularyLesson = currentCourse.specialLessons.find(lesson => lesson.id === 'vocabulary');

    if (vocabularyLesson) {
      // Создаем кнопку словаря
      const vocabularyButton = document.createElement('button');
      vocabularyButton.textContent = vocabularyLesson.title || 'Prompt Engineering Vocabulary';
      vocabularyButton.onclick = openVocabulary;
      vocabularyContainer.appendChild(vocabularyButton);

      console.log(`Динамически создана кнопка словаря: ${vocabularyLesson.title}`);
    } else {
      // Если урок словаря не найден, но мы хотим всё равно показать кнопку
      const vocabularyButton = document.createElement('button');
      vocabularyButton.textContent = 'Prompt Engineering Vocabulary';
      vocabularyButton.onclick = openVocabulary;
      vocabularyContainer.appendChild(vocabularyButton);

      console.log('Создана стандартная кнопка словаря (урок не найден в specialLessons)');
    }
  } else {
    // Если специальных уроков нет, показываем стандартную кнопку
    const vocabularyButton = document.createElement('button');
    vocabularyButton.textContent = 'Prompt Engineering Vocabulary';
    vocabularyButton.onclick = openVocabulary;
    vocabularyContainer.appendChild(vocabularyButton);

    console.log('Создана стандартная кнопка словаря (specialLessons не найден)');
  }
}

// Определяем, какое аудио отображать
function showAudioForLesson(lesson) {
  // Сначала скрываем все аудио
  hideAllAudio();

  if (!lesson) return;

  // Проверяем, есть ли у урока аудио
  if (lesson.audioSource) {
    console.log('Обработка аудио для урока:', lesson.id, 'Тип аудио:', lesson.audioSource.type);
    console.log('Данные аудио:', JSON.stringify(lesson.audioSource));
    
    const audioType = lesson.audioSource.type;
    const audioEmbed = document.getElementById('audio-embed');
    const audioVocabulary = document.getElementById('audio-vocabulary');
    const audioFirstLesson = document.getElementById('audio-first-lesson');

    // Для SoundCloud
    if (audioType === 'soundcloud') {
      if (audioVocabulary) {
        // Обновляем iframe с правильным URL
        const iframe = audioVocabulary.querySelector('iframe');
        if (iframe && lesson.audioSource.trackUrl) {
          iframe.src = lesson.audioSource.trackUrl;
          console.log('Обновлен SoundCloud iframe с URL:', lesson.audioSource.trackUrl);
        } else {
          console.log('Не найден iframe или trackUrl для SoundCloud аудио');
        }

        // Обновляем ссылки
        const links = audioVocabulary.querySelectorAll('a');
        if (links.length >= 1 && lesson.audioSource.url) {
          links[0].href = lesson.audioSource.url;
        }

        audioVocabulary.classList.remove('hidden');
        console.log('Отображено SoundCloud аудио в audioVocabulary');
      } else {
        // Если audioVocabulary не найден, пробуем использовать общий embed
        if (audioEmbed && (lesson.audioSource.trackUrl || lesson.audioSource.embedCode || lesson.audioSource.embed)) {
          let embedCode = '';
          
          if (lesson.audioSource.embedCode) {
            embedCode = lesson.audioSource.embedCode;
          } else if (lesson.audioSource.embed) {
            embedCode = lesson.audioSource.embed;
          } else if (lesson.audioSource.trackUrl) {
            embedCode = `<iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay" 
              src="${lesson.audioSource.trackUrl}"></iframe>`;
          }
          
          audioEmbed.innerHTML = embedCode;
          audioEmbed.classList.remove('hidden');
          console.log('Отображено SoundCloud аудио в общем embed');
        }
      }
    }
    // Для произвольного embed-кода
    else if (audioType === 'embed' || lesson.audioSource.embedCode) {
      if (audioEmbed) {
        // Определяем код для вставки
        let embedContent = lesson.audioSource.embedCode || lesson.audioSource.embed || '';
        
        // Вставляем произвольный HTML-код
        audioEmbed.innerHTML = embedContent;
        audioEmbed.classList.remove('hidden');
        console.log('Отображено аудио с embed-кодом:', embedContent.substring(0, 100) + (embedContent.length > 100 ? '...' : ''));
      } else {
        console.log('Не найден элемент audio-embed для отображения embed-кода');
      }
    }
    // Для Audiomack
    else if (audioType === 'audiomack') {
      if (audioEmbed) {
        // Вставляем embed-код Audiomack
        let embedContent = lesson.audioSource.embed || '';
        audioEmbed.innerHTML = embedContent;
        audioEmbed.classList.remove('hidden');
        console.log('Отображено аудио Audiomack:', embedContent.substring(0, 100) + (embedContent.length > 100 ? '...' : ''));
      }
    }
    // Для первого урока (специальный случай)
    else if (audioType === 'first-lesson' && audioFirstLesson) {
      audioFirstLesson.classList.remove('hidden');
      console.log('Отображено аудио для первого урока');
    }
    // Поддержка любого типа с полем embed или trackUrl
    else if (lesson.audioSource.embed || lesson.audioSource.trackUrl) {
      if (audioEmbed) {
        // Определяем содержимое для вставки
        let embedContent = '';
        
        if (lesson.audioSource.embed) {
          embedContent = lesson.audioSource.embed;
        } else if (lesson.audioSource.trackUrl) {
          embedContent = `<iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay" 
            src="${lesson.audioSource.trackUrl}"></iframe>`;
        }
        
        // Вставляем embed-код
        audioEmbed.innerHTML = embedContent;
        audioEmbed.classList.remove('hidden');
        console.log('Отображено аудио с embed/trackUrl для типа:', audioType);
      } else {
        console.log('Не найден элемент audio-embed для отображения embed/trackUrl');
      }
    } else {
      console.log('Неизвестный тип аудио или отсутствует необходимая информация для отображения:', audioType);
    }
  } else {
    console.log('У урока нет аудио источника');
  }
}

async function createJsonBackup(coursesData) {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const filename = `courses-backup-${timestamp}.json`;
  const dataStr = JSON.stringify(coursesData, null, 2);

  try {
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Ошибка при создании резервной копии JSON:', error);
    return false;
  }
}