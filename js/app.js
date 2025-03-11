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

// Инициализация приложения (версия 1)
async function initApp() {
  console.log('Инициализация приложения...');

  // Скрываем глобальный индикатор загрузки - он должен оставаться видимым пока все не загрузится
  const globalLoadingOverlay = document.getElementById('global-loading-overlay');

  // Показываем индикатор загрузки перед началом инициализации
  const loadingIndicator = document.getElementById('loading-spinner');
  const appContent = document.getElementById('app-content');
  const retryContainer = document.getElementById('loading-retry-container');

  if (loadingIndicator) loadingIndicator.classList.remove('hidden');
  if (retryContainer) retryContainer.classList.add('hidden');
  if (appContent) appContent.classList.add('hidden');

  // Автоматически импортируем настройки вебхуков, если они отсутствуют
  await autoImportWebhooks();

  // Настраиваем обработчики событий
  setupEventListeners();

  function updateGlobalLoadingStatus(message) {
    const statusElement = document.getElementById('global-loading-status');
    if (statusElement) {
      statusElement.textContent = message;
    }
    console.log('Глобальный статус загрузки:', message);
  }

  try {
    const loadingTimeout = setTimeout(() => {
      console.log('Превышен таймаут загрузки данных (30 секунд)');
      updateLoadingStatus('Загрузка данных занимает больше времени, чем обычно...', false);
    }, 30000);

    updateLoadingStatus('Загрузка данных курсов...');

    try {
      updateLoadingStatus('Синхронизация с облаком...');
      updateGlobalLoadingStatus('Синхронизация с облаком...');

      courseManager.courses = null;

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
            await new Promise(resolve => setTimeout(resolve, 2000));
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

    updateLoadingStatus('Инициализация менеджера курсов...');
    updateGlobalLoadingStatus('Инициализация менеджера курсов...');
    console.log('Инициализация менеджера курсов после синхронизации...');
    const success = await courseManager.initialize();

    clearTimeout(loadingTimeout);

    if (!success) {
      console.error('Ошибка инициализации менеджера курсов');
      updateLoadingStatus('Ошибка загрузки данных курсов', true);
      updateGlobalLoadingStatus('Критическая ошибка! Не удалось инициализировать менеджера курсов');
      if (retryContainer) retryContainer.classList.remove('hidden');
      return;
    }

    console.log('Инициализация менеджера курсов завершена успешно');

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

    courseManager.onCoursesUpdated((courses) => {
      console.log('Получено обновление курсов, обновляем интерфейс');
      updateProfessionSelector();
      if (courseManager.currentProfession) {
        updateDaysList();
        if (courseManager.currentDay) {
          updateLessonsList();
        }
      }
    });

    setupCloudSyncInterval();
    updateProfessionSelector();
    renderHomePage();
    updateLoadingStatus('Загрузка завершена, подготовка интерфейса...');
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('Приложение инициализировано успешно, показываем интерфейс через 1 секунду');
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (loadingIndicator) loadingIndicator.classList.add('hidden');
    if (appContent) appContent.classList.remove('hidden');
    if (globalLoadingOverlay) {
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

  if (!webhookSettingsStr) {
    console.log('Настройки вебхуков не найдены, устанавливаем значения по умолчанию');
    const defaultWebhookSettings = {
      exportUrl: 'https://auto.crm-s.com/webhook/SaveWebhooks',
      importUrl: 'https://auto.crm-s.com/webhook/OnboardingJSON',
      getUrl: 'https://auto.crm-s.com/webhook/GetOnboardingHooks'
    };
    localStorage.setItem('webhookSettings', JSON.stringify(defaultWebhookSettings));
    localStorage.setItem('adminExportWebhook', defaultWebhookSettings.exportUrl);
    localStorage.setItem('adminImportWebhook', defaultWebhookSettings.importUrl);
    localStorage.setItem('adminGetWebhook', defaultWebhookSettings.getUrl);
    console.log('Установлены настройки вебхуков по умолчанию:');
    console.log('- Import URL:', defaultWebhookSettings.importUrl);
    console.log('- Export URL:', defaultWebhookSettings.exportUrl);
    console.log('- Get URL:', defaultWebhookSettings.getUrl);
    if (window.adminInterface && typeof window.adminInterface.loadWebhookSettings === 'function') {
      window.adminInterface.loadWebhookSettings();
    }
    await importWebhooksFromServer(defaultWebhookSettings.getUrl);
    return defaultWebhookSettings;
  }

  try {
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
      const jsonData = JSON.parse(responseText);
      processWebhooksData(jsonData);
      updateLoadingStatus('Настройки вебхуков успешно импортированы');
      return true;
    } catch (jsonError) {
      console.error('Ошибка при парсинге JSON с вебхуками:', jsonError);
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
      const urlRegex = /(https?:\/\/[^\s"]+)/g;
      const urls = responseText.match(urlRegex);
      if (urls && urls.length > 0) {
        console.log(`Найдено ${urls.length} URL в ответе`);
        if (urls.length > 0) {
          localStorage.setItem('adminImportWebhook', urls[0]);
          console.log(`Установлен URL импорта из текста: ${urls[0]}`);
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
    if (data.webhooks && Array.isArray(data.webhooks)) {
      console.log(`Найдено ${data.webhooks.length} вебхуков в массиве webhooks`);
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
    const foundUrls = findUrlsInObject(data);
    if (foundUrls.length > 0) {
      console.log(`Найдено ${foundUrls.length} URL-адресов в данных`);
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
      localStorage.setItem('webhookSettings', JSON.stringify(settings));
      console.log('Настройки вебхуков обновлены из полученных данных');
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
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      const currentPath = path ? `${path}.${key}` : key;
      if (typeof value === 'string' && isValidUrl(value)) {
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
      } else if (typeof value === 'object' && value !== null) {
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
    await autoImportWebhooks();
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
    if (!importWebhookUrl) {
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
    if (importWebhookUrl) {
      if (window.devMode && window.devMode.enabled) {
        console.log('🔧 [DevMode] Выполняется принудительная синхронизация с облаком');
        console.log(`🔧 [DevMode] URL для импорта: ${importWebhookUrl}`);
      }
      try {
        updateLoadingStatus(`Отправка запроса на ${importWebhookUrl.split('/').slice(-1)[0]}`);
        console.log(`Выполняется импорт данных с URL: ${importWebhookUrl}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
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
          clearTimeout(timeoutId);
          if (!response.ok) {
            throw new Error(`HTTP ошибка! Статус: ${response.status}`);
          }
          const responseText = await response.text();
          console.log(`Получен ответ от сервера, размер: ${responseText.length} байт`);
          updateLoadingStatus(`Получен ответ от сервера (${responseText.length} байт)`);
          let coursesData = null;
          if (responseText && (responseText.trim() === 'Accepted' || responseText.trim() === 'OK' || responseText.trim().startsWith('Success'))) {
            console.log('Получен положительный текстовый ответ от сервера:', responseText.trim());
            resolve({success: true, updated: false, message: `Сервер ответил: ${responseText.trim()}`});
            return;
          }
          try {
            const importData = JSON.parse(responseText);
            console.log('Успешно распарсен JSON из ответа, анализ данных...');
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
            courseManager.courses = coursesData;
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
            const backupDataStr = localStorage.getItem('coursesBackup');
            if (backupDataStr) {
              console.log('Используем резервную копию, так как не найдены данные о курсах в ответе');
              resolve({success: true, updated: false, fromBackup: true});
              return;
            }
            resolve({success: false, error: 'Данные о курсах не найдены'});
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          console.error('Ошибка при получении данных:', fetchError);
          updateLoadingStatus(`Ошибка при получении данных: ${fetchError.message}`);
          const backupDataStr = localStorage.getItem('coursesBackup');
          if (backupDataStr) {
            try {
              console.log('Используем резервную копию из-за ошибки сети');
              console.log('Резервная копия от:', localStorage.getItem('coursesBackupTimestamp'));
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
  const syncInterval = 60 * 1000;
  console.log(`Настройка периодической синхронизации каждые ${syncInterval/1000} секунд`);
  setInterval(syncWithCloud, syncInterval);
}

// Функция для синхронизации с облаком
function syncWithCloud() {
  return new Promise(async (resolve) => {
    try {
      await autoImportWebhooks();
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
      if (!importWebhookUrl) {
        importWebhookUrl = localStorage.getItem('importWebhookUrl') || 
                          localStorage.getItem('adminImportWebhook') || 
                          localStorage.getItem('testImportUrl');
      }
      if (importWebhookUrl) {
        if (window.devMode && window.devMode.enabled) {
          console.log('🔧 [DevMode] Выполняется периодическая синхронизация с облаком');
          console.log(`🔧 [DevMode] URL для импорта: ${importWebhookUrl}`);
        }
        try {
          const result = await tryImportFromUrl(importWebhookUrl);
          if (result && result.success && result.updated) {
            console.log('Данные синхронизированы, обновляем интерфейс');
            updateProfessionSelector();
            if (document.getElementById('home').classList.contains('hidden') === false) {
              if (courseManager.currentProfession) {
                updateDaysList();
              }
            } else if (document.getElementById('guide').classList.contains('hidden') === false) {
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
    updateLoadingStatus(`Отправка запроса на сервер...`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      updateLoadingStatus('Превышено время ожидания ответа от сервера', true);
    }, 15000);
    console.log(`Отправка запроса на URL импорта: ${url}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      cache: 'no-store',
      credentials: 'omit',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      console.error(`Ошибка при синхронизации: HTTP ${response.status}`);
      return { success: false, error: `HTTP ${response.status}` };
    }
    updateLoadingStatus('Получен ответ от сервера, обработка данных...');
    const responseText = await response.text();
    console.log(`Получен ответ от сервера, размер: ${responseText.length} байт`);
    try {
      let importData;
      console.log('Raw response:', JSON.stringify(responseText));
      if (!responseText || responseText.length < 10) {
        if (responseText && (responseText.trim() === 'Accepted' || responseText.trim() === 'OK' || responseText.trim().startsWith('Success'))) {
          console.log('Получен положительный текстовый ответ от сервера:', responseText.trim());
          return { success: true, updated: false, message: `Сервер ответил: ${responseText.trim()}` };
        }
      }
      try {
        updateLoadingStatus('Обработка данных в формате JSON...');
        try {
          importData = JSON.parse(responseText.trim());
          console.log('Успешно распарсен JSON из полного ответа');
        } catch (initialParseError) {
          const trimmedText = responseText.trim();
          if (trimmedText.startsWith('{') || trimmedText.startsWith('[')) {
            try {
              importData = JSON.parse(trimmedText);
              console.log('Успешно распарсен JSON из ответа после обрезки');
            } catch (e) {
              throw initialParseError;
            }
          } else {
            throw new Error('Ответ не содержит JSON напрямую, поиск JSON внутри ответа');
          }
        }
      } catch (jsonError) {
        updateLoadingStatus('Поиск JSON данных в ответе...');
        console.log('Не удалось распарсить ответ как JSON, ищем JSON в тексте:', jsonError.message);
        const jsonRegex = /{[\s\S]*}/;
        const match = responseText.match(jsonRegex);
        if (match && match[0]) {
          try {
            importData = JSON.parse(match[0]);
            console.log('Найден и распарсен JSON в тексте ответа');
          } catch (nestedError) {
            console.error('Ошибка при парсинге найденного JSON:', nestedError.message);
            if (responseText.length < 100) {
              console.log('Получен короткий текстовый ответ, считаем синхронизацию успешной');
              return { success: true, updated: false, message: `Сервер ответил: ${responseText.substring(0, 50)}` };
            }
            throw new Error('Не удалось распарсить найденный JSON');
          }
        } else {
          if (responseText.trim().length > 0 && responseText.trim().length < 100) {
            console.log('Получен текстовый ответ без JSON, считаем синхронизацию успешной');
            return { success: true, updated: false, message: `Сервер ответил: ${responseText.substring(0, 50)}` };
          }
          throw new Error('Не удалось извлечь JSON из ответа');
        }
      }
      let coursesData = null;
      if (importData.courses) {
        coursesData = importData.courses;
        console.log('Найдены курсы в поле courses');
      } else if (importData.data) {
        if (typeof importData.data === 'object') {
          coursesData = importData.data;
          console.log('Найдены курсы в поле data (объект)');
        } else if (typeof importData.data === 'string') {
          try {
            const parsedData = JSON.parse(importData.data);
            coursesData = parsedData.courses || parsedData;
            console.log('Найдены курсы в поле data (JSON строка)');
          } catch (e) {
            console.log(`Не удалось распарсить JSON в поле data: ${e.message}`);
          }
        }
      } else if (importData.content && typeof importData.content === 'object') {
        coursesData = importData.content;
        console.log('Найдены курсы в поле content (объект)');
      } else if (typeof importData === 'object') {
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
        const isValid = validateCoursesStructure(coursesData);
        if (!isValid) {
          console.error('Неверная структура данных курсов');
          return { success: false, error: 'Неверная структура данных' };
        }
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
        const forceUpdate = !courseManager.courses;
        const currentCoursesJson = JSON.stringify(courseManager.courses || {});
        const newCoursesJson = JSON.stringify(coursesData);
        if (forceUpdate || currentCoursesJson !== newCoursesJson) {
          console.log(forceUpdate 
            ? 'Принудительное обновление данных курсов' 
            : 'Обнаружены изменения данных, применяем обновления из облака');
          if (courseManager.courses) {
            localStorage.setItem('coursesBackup', currentCoursesJson);
            localStorage.setItem('coursesBackupTimestamp', new Date().toISOString());
          }
          cacheWebhookUrls(coursesData);
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
  Object.keys(coursesData).forEach(professionId => {
    const course = coursesData[professionId];
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
    if (course.specialLessons && Array.isArray(course.specialLessons)) {
      course.specialLessons.forEach(lesson => {
        if (lesson.contentSource && lesson.contentSource.type === 'webhook' && lesson.contentSource.url) {
          const key = `${professionId}_special_${lesson.id}`;
          webhookUrls[key] = lesson.contentSource.url;
        }
      });
    }
    if (course.noDayLessons && Array.isArray(course.noDayLessons)) {
      course.noDayLessons.forEach(lesson => {
        if (lesson.contentSource && lesson.contentSource.type === 'webhook' && lesson.contentSource.url) {
          const key = `${professionId}_noday_${lesson.id}`;
          webhookUrls[key] = lesson.contentSource.url;
        }
      });
    }
  });
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
  const currentProfession = courseManager.currentProfession;
  const currentDayId = courseManager.currentDay ? courseManager.currentDay.id : null;
  const currentLessonId = courseManager.currentLesson ? courseManager.currentLesson.id : null;
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
  courseManager.courses = coursesData;
  console.log('Уведомление подписчиков об обновлении курсов');
  courseManager.notifyCoursesUpdated();
  console.log('Обновление селектора профессий');
  updateProfessionSelector();
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
    console.log(`Переключаемся на профессию: ${currentProfession}`);
    courseManager.switchProfession(currentProfession);
  }
  console.log('Обновление списка дней');
  updateDaysList();
  if (currentDayId) {
    const dayFound = courseManager.selectDay(currentDayId);
    if (dayFound) {
      console.log(`Выбран день с ID: ${currentDayId}`);
      updateLessonsList();
      if (currentLessonId) {
        const lessonFound = courseManager.selectLesson(currentLessonId);
        if (lessonFound) {
          console.log(`Выбран урок с ID: ${currentLessonId}`);
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
  if (document.getElementById('home').classList.contains('hidden') === false) {
    console.log('Обновление домашней страницы');
    renderHomePage();
  }
}

// Функция для обновления селектора профессий
function updateProfessionSelector() {
  const professionSelect = document.getElementById('profession-select');
  if (!professionSelect) return;
  const currentValue = professionSelect.value;
  const professions = courseManager.getProfessions();
  professionSelect.innerHTML = '';
  professions.forEach(professionId => {
    const course = courseManager.courses[professionId];
    const option = document.createElement('option');
    option.value = professionId;
    option.textContent = course.title || professionId;
    professionSelect.appendChild(option);
  });
  if (professions.includes(currentValue)) {
    professionSelect.value = currentValue;
  }
}

// Функция для обновления списка дней
function updateDaysList() {
  const daySelectionContainer = document.getElementById('day-selection');
  if (!daySelectionContainer) return;
  let dayCardsContainer = daySelectionContainer.querySelector('.content-cards');
  if (!dayCardsContainer) {
    dayCardsContainer = document.createElement('div');
    dayCardsContainer.className = 'content-cards';
    daySelectionContainer.appendChild(dayCardsContainer);
  }
  dayCardsContainer.innerHTML = '';
  const daysTitle = document.createElement('h2');
  daysTitle.textContent = 'Выберите день обучения:';
  dayCardsContainer.appendChild(daysTitle);
  const days = courseManager.getDays();
  console.log(`Загружено ${days.length} дней для профессии ${courseManager.currentProfession}`);
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
  if (days.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.textContent = 'Для этой профессии еще не добавлены дни обучения.';
    dayCardsContainer.appendChild(emptyMessage);
  }
}

// Функция для обновления списка уроков
function updateLessonsList() {
  if (!courseManager.currentDay) {
    console.log('Не выбран текущий день, невозможно обновить список уроков');
    return;
  }
  
  const taskButtonsDiv = document.getElementById('task-buttons');
  if (!taskButtonsDiv) {
    console.error('Не найден контейнер для кнопок уроков (task-buttons)');
    return;
  }
  
  taskButtonsDiv.innerHTML = '';
  
  try {
    const lessons = courseManager.getLessonsForCurrentDay();
    
    if (!lessons || !Array.isArray(lessons)) {
      console.error('Получен некорректный список уроков:', lessons);
      const errorMessage = document.createElement('p');
      errorMessage.textContent = 'Ошибка загрузки уроков. Попробуйте перезагрузить страницу.';
      errorMessage.className = 'error-message';
      errorMessage.style.color = '#ff5555';
      taskButtonsDiv.appendChild(errorMessage);
      return;
    }
    
    console.log(`Загружено ${lessons.length} уроков для дня ${courseManager.currentDay.id}`);
    
    if (lessons.length === 0) {
      const emptyMessage = document.createElement('p');
      emptyMessage.textContent = 'Для этого дня еще не добавлены уроки.';
      emptyMessage.className = 'empty-message';
      taskButtonsDiv.appendChild(emptyMessage);
      return;
    }
    
    lessons.forEach(lesson => {
      const btn = document.createElement('button');
      btn.innerText = lesson.title || `Урок ${lesson.id}`;
      btn.onclick = function() { selectLesson(lesson.id); };
      
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
  } catch (error) {
    console.error('Ошибка при обновлении списка уроков:', error);
    const errorMessage = document.createElement('p');
    errorMessage.textContent = 'Произошла ошибка при загрузке уроков.';
    errorMessage.className = 'error-message';
    errorMessage.style.color = '#ff5555';
    taskButtonsDiv.appendChild(errorMessage);
  }
}

// Настройка обработчиков событий
function setupEventListeners() {
  if (professionSelect) {
    professionSelect.addEventListener('change', handleProfessionChange);
  }
  
  const backToDayButton = document.querySelector('button[onclick="goBackToDaySelection()"]');
  if (backToDayButton) {
    backToDayButton.addEventListener('click', goBackToDaySelection);
  }
  
  const backToTaskButton = document.querySelector('button[onclick="goBackToTaskSelection()"]');
  if (backToTaskButton) {
    backToTaskButton.addEventListener('click', goBackToTaskSelection);
  }
  
  const vocabularyButton = document.querySelector('button[onclick="openVocabulary()"]');
  if (vocabularyButton) {
    vocabularyButton.addEventListener('click', openVocabulary);
  } else {
    console.log('Не найдена кнопка словаря в DOM');
  }
}

// Обновление кнопки словаря
function updateVocabularyButton() {
  const vocabularyContainer = document.getElementById('vocabulary-container');
  if (!vocabularyContainer) return;
  
  vocabularyContainer.innerHTML = '';
  
  // Проверяем наличие специальных уроков
  const specialLessons = courseManager.getSpecialLessons() || [];
  specialLessons.forEach(lesson => {
    const button = document.createElement('button');
    button.textContent = lesson.title || lesson.id;
    button.onclick = function() { openVocabulary(); };
    vocabularyContainer.appendChild(button);
  });
  
  if (specialLessons.length === 0) {
    const placeholderText = document.createElement('p');
    placeholderText.textContent = 'Справочные материалы отсутствуют';
    vocabularyContainer.appendChild(placeholderText);
  }
}

// Отображение домашней страницы
function renderHomePage() {
  if (!courseManager.courses || Object.keys(courseManager.courses).length === 0) {
    console.error('Ошибка: данные курсов не загружены, невозможно отобразить домашнюю страницу');
    updateLoadingStatus('Ошибка: данные курсов не загружены', true);
    return;
  }
  console.log('Отображение домашней страницы с загруженными курсами:', Object.keys(courseManager.courses));
  updateProfessionSelector();
  if (courseManager.currentProfession) {
    updateDaysList();
    updateVocabularyButton();
  }
  showSection('home');
  daySelectionContainer.classList.remove('hidden');
  taskSelectionContainer.classList.add('hidden');
}

// Отображение домашней страницы окончательно завершено

// Обработчик смены профессии
function handleProfessionChange() {
  const selectedProfession = professionSelect.value;
  if (courseManager.hasRedirect(selectedProfession)) {
    const redirectUrl = courseManager.getRedirectUrl(selectedProfession);
    if (redirectUrl) {
      console.log(`Перенаправление на внешний ресурс: ${redirectUrl}`);
      window.location.href = redirectUrl;
      return;
    }
  }
  console.log(`Переключение на профессию: ${selectedProfession}`);
  courseManager.switchProfession(selectedProfession);
  updateDaysList();
  courseManager.currentLesson = null;
  showSection('home');
  daySelectionContainer.classList.remove('hidden');
  taskSelectionContainer.classList.add('hidden');
  updateVocabularyButton();
}

// Выбор дня обучения
window.selectDay = function(dayId) {
  const day = courseManager.selectDay(dayId);
  if (!day) {
    console.error(`День с ID ${dayId} не найден`);
    return;
  }
  dayHeader.innerText = day.title || `День ${day.id}`;
  daySelectionContainer.classList.add('hidden');
  taskSelectionContainer.classList.remove('hidden');
  updateLessonsList();
};

// Выбор урока
window.selectLesson = function(lessonId) {
  const lesson = courseManager.selectLesson(lessonId);
  if (!lesson) {
    console.error(`Урок с ID ${lessonId} не найден`);
    alert(`Урок с ID ${lessonId} не найден. Пожалуйста, выберите другой урок.`);
    return;
  }
  console.log(`Выбран урок: ${lesson.title} (ID: ${lesson.id})`);
  if (lesson.contentSource) {
    console.log(`Источник контента: ${lesson.contentSource.type}`);
    if (lesson.contentSource.type === 'webhook') {
      console.log(`URL вебхука: ${lesson.contentSource.url}`);
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
  guideTitle.innerText = `Guide: ${lesson.title || `Урок ${lesson.id}`}`;
  hideAllAudio();
  if (lesson.testSource) {
    testButton.classList.remove('hidden');
    testButton.onclick = function() {
      openTest(lesson);
    };
  } else {
    testButton.classList.add('hidden');
  }
  const audioInfo = courseManager.getAudioInfo();
  if (audioInfo) {
    console.log('Найдена информация об аудио для урока:', lesson.id);
    console.log('Аудио информация:', JSON.stringify(audioInfo));
    showAudioForLesson(lesson);
  } else {
    console.log('Для урока', lesson.id, 'аудио не найдено');
  }

  // Вспомогательная функция для отображения аудио для урока
  function showAudioForLesson(lesson) {
    // Сначала скрываем все аудио
    hideAllAudio();
    if (!lesson) return;
    
    // Если в JSON аудио хранится в поле "audio", а не "audioSource", присваиваем его
    if (!lesson.audioSource && lesson.audio) {
      lesson.audioSource = lesson.audio;
      console.log('Присвоено audioSource из lesson.audio');
    }
    
    const audioEmbed = document.getElementById('audio-embed');
    if (!audioEmbed) {
      console.warn('Элемент с id "audio-embed" не найден. Проверьте HTML-разметку.');
      return;
    }

    if (!lesson.audioSource) {
      console.log('У урока нет источника аудио:', lesson.id);
      audioEmbed.classList.add('hidden');
      return;
    }

    console.log('Обработка аудио для урока:', lesson.id);
    console.log('Данные аудио:', JSON.stringify(lesson.audioSource));

    // Очищаем контейнер перед добавлением нового аудио
    audioEmbed.innerHTML = '';
    
    try {
      if (lesson.audioSource.type === 'soundcloud') {
        const iframe = document.createElement('iframe');
        const src = lesson.audioSource.trackUrl || lesson.audioSource.url;
        console.log('Использую SoundCloud источник:', src);
        iframe.src = src;
        iframe.width = '100%';
        iframe.height = '166';
        iframe.frameBorder = '0';
        iframe.allow = 'autoplay';
        
        audioEmbed.appendChild(iframe);
        audioEmbed.classList.remove('hidden');
        console.log('Добавлен SoundCloud iframe для урока:', lesson.id);
      } else if (lesson.audioSource.type === 'url' && lesson.audioSource.url) {
        const audio = document.createElement('audio');
        console.log('Использую URL источник:', lesson.audioSource.url);
        audio.src = lesson.audioSource.url;
        audio.controls = true;
        audio.style.width = '100%';
        audio.style.maxWidth = '600px';
        
        audioEmbed.appendChild(audio);
        audioEmbed.classList.remove('hidden');
        console.log('Добавлен audio элемент для урока:', lesson.id);
      } else {
        console.log('Неподдерживаемый тип аудио:', lesson.audioSource.type);
        audioEmbed.classList.add('hidden');
      }
    } catch (error) {
      console.error('Ошибка при отображении аудио:', error);
      console.error('Детали ошибки:', error.message);
      audioEmbed.classList.add('hidden');
    }
  }
  showSection('guide');
  const contentSpinner = document.getElementById('content-loading-spinner');
  if (contentSpinner) contentSpinner.classList.remove('hidden');
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
  if (lesson.testSource && lesson.testSource.url) {
    window.open(lesson.testSource.url, '_blank');
  }
}

// Загрузка контента урока
async function loadLessonContent() {
  const contentSpinner = document.getElementById('content-loading-spinner');
  if (contentSpinner) contentSpinner.classList.remove('hidden');
  markdownContent.classList.add('hidden');
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
    if (!courseManager.currentLesson) {
      throw new Error('Не выбран урок для загрузки');
    }
    console.log('Запрос контента для урока:', courseManager.currentLesson.id);
    const content = await courseManager.fetchLessonContent();
    if (!content) {
      throw new Error('Получен пустой контент');
    }
    console.log(`Получен контент (${content.length} символов), форматирование...`);
    let processedContent = content;
    if (!content.trim().startsWith('#')) {
      processedContent = `# ${courseManager.currentLesson.title || 'Урок'}\n\n${content}`;
    }
    const formattedHTML = createCollapsibleBlocks(processedContent);
    console.log('Контент отформатирован, отображение...');
    markdownContent.innerHTML = formattedHTML;
    const task = courseManager.getTask();
    if (task) {
      console.log('Найдено задание для урока, добавление в контент');
      const taskHTML = marked.parse(task);
      const taskSection = document.createElement('div');
      taskSection.className = 'task-section';
      taskSection.innerHTML = `
        <h2>Practical Task</h2>
        <div class="task-content">${taskHTML}</div>
      `;
      markdownContent.appendChild(taskSection);
    }
    if (contentSpinner) contentSpinner.classList.add('hidden');
    markdownContent.classList.remove('hidden');
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
    const lessonTitle = courseManager.currentLesson 
      ? (courseManager.currentLesson.title || `Урок ${courseManager.currentLesson.id}`)
      : 'Неизвестный урок';
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
    if (contentSpinner) contentSpinner.classList.add('hidden');
    markdownContent.classList.remove('hidden');
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
  const audioEmbed = document.getElementById("audio-embed");
  if (audioEmbed) {
    audioEmbed.classList.add("hidden");
    audioEmbed.innerHTML = '';
  }
  const legacyContainers = [
    "audio-first-lesson",
    "audio-vocabulary"
  ];
  legacyContainers.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add("hidden");
    }
  });
  const audioContainers = document.querySelectorAll('.audio-container');
  if (audioContainers.length > 0) {
    audioContainers.forEach(container => {
      container.classList.add('hidden');
    });
    console.log(`Скрыто ${audioContainers.length} аудио контейнеров`);
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
  if (lines.length > 0 && !lines[0].match(/^#\s+/)) {
    lines.unshift("# " + (window.currentTopic ? window.currentTopic.title : "Content"));
  }
  for (let line of lines) {
    let match = line.match(/^#(?!#)\s*(.+)/);
    if (match) {
      if (inLevel1) {
        htmlOutput += renderLevel1Block(currentLevel1Title, currentLevel1Content.join("\n"));
      }
      currentLevel1Title = match[1].trim();
      currentLevel1Content = [];
      inLevel1 = true;
    } else {
      if (inLevel1) {
        currentLevel1Content.push(line);
      }
    }
  }
  if (inLevel1) {
    htmlOutput += renderLevel1Block(currentLevel1Title, currentLevel1Content.join("\n"));
  } else if (!htmlOutput) {
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
  if (currentSubTitle) {
    subBlocksHtml += renderLevel2Block(currentSubTitle, currentSubContent.join("\n"));
  }
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
  if (currentSubTitle) {
    subBlocksHtml += renderLevel3Block(currentSubTitle, currentSubContent.join("\n"));
  }
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

// --- ВТОРАЯ ЧАСТЬ ---
// Здесь вторая версия инициализации переименована в initAppUI

async function initAppUI() {
  try {
    console.log('Initializing application...');
    const loadingSpinner = document.getElementById('loading-spinner');
    if (loadingSpinner) {
      loadingSpinner.classList.remove('hidden');
      const loadingStatus = document.querySelector('.loading-status');
      if (loadingStatus) {
        loadingStatus.textContent = 'Loading course data...';
      }
    }
    await window.courseManager.initialize();
    populateCourseDropdown();
    if (loadingSpinner) {
      loadingSpinner.classList.add('hidden');
    }
    const appContent = document.getElementById('app-content');
    if (appContent) {
      appContent.classList.remove('hidden');
    }
    const globalOverlay = document.getElementById('global-loading-overlay');
    if (globalOverlay) {
      globalOverlay.style.opacity = '0';
      setTimeout(() => {
        globalOverlay.style.display = 'none';
      }, 500);
    }
    console.log('Application initialized successfully!');
    return true;
  } catch (error) {
    console.error('Failed to initialize application:', error);
    const loadingStatus = document.querySelector('.loading-status');
    if (loadingStatus) {
      loadingStatus.textContent = 'Error loading application data';
      loadingStatus.style.color = '#ff5555';
    }
    const retryContainer = document.getElementById('loading-retry-container');
    if (retryContainer) {
      retryContainer.classList.remove('hidden');
    }
    return false;
  }
}

// Populate the course dropdown
function populateCourseDropdown() {
  const courseSelect = document.getElementById('profession-select');
  if (!courseSelect) return;
  courseSelect.innerHTML = '<option value="">Select a course</option>';
  const courses = window.courseManager.courses;
  if (!courses) return;
  const courseIds = window.courseManager.getProfessions(false);
  courseIds.forEach(courseId => {
    const course = courses[courseId];
    if (course) {
      const option = document.createElement('option');
      option.value = courseId;
      option.textContent = course.title || courseId;
      courseSelect.appendChild(option);
    }
  });
  const currentProfession = window.courseManager.currentProfession;
  if (currentProfession && courses[currentProfession]) {
    courseSelect.value = currentProfession;
    populateDays(currentProfession);
  }
}

// Populate days for a selected course
function populateDays(courseId) {
  const daysContainer = document.getElementById('days-container');
  if (!daysContainer) return;
  daysContainer.innerHTML = '';
  if (!courseId) return;
  window.courseManager.switchProfession(courseId);
  const days = window.courseManager.getDays();
  if (!days || days.length === 0) {
    daysContainer.innerHTML = '<p>No training days available for this course</p>';
    return;
  }
  days.forEach(day => {
    const dayButton = document.createElement('button');
    dayButton.textContent = day.title || `Day ${day.id}`;
    dayButton.onclick = function() { selectDay(day.id); };
    daysContainer.appendChild(dayButton);
  });
  populateVocabulary(courseId);
}

// Populate vocabulary options
function populateVocabulary(courseId) {
  const vocabularyContainer = document.getElementById('vocabulary-container');
  if (!vocabularyContainer) return;
  vocabularyContainer.innerHTML = '';
  const specialLessons = window.courseManager.getSpecialLessons() || [];
  specialLessons.forEach(lesson => {
    const button = document.createElement('button');
    button.textContent = lesson.title || lesson.id;
    button.onclick = function() { openSpecialLesson(lesson.id); };
    vocabularyContainer.appendChild(button);
  });
  if (specialLessons.length === 0) {
    vocabularyContainer.innerHTML = '<p>No reference materials available</p>';
  }
}

// Open a special lesson (like vocabulary)
function openSpecialLesson(lessonId) {
  const lesson = window.courseManager.selectLesson(lessonId);
  if (!lesson) {
    console.error(`Special lesson ${lessonId} not found`);
    return;
  }
  window.currentTopic = {
    title: lesson.title || lesson.id,
    contentWebhook: lesson.contentSource?.url || '',
    testWebhook: lesson.testSource?.url || ''
  };
  const home = document.getElementById('home');
  if (home) home.classList.add('hidden');
  const guide = document.getElementById('guide');
  if (guide) guide.classList.remove('hidden');
  const guideTitle = document.getElementById('guide-title');
  if (guideTitle) guideTitle.innerText = `Guide: ${lesson.title || lesson.id}`;
  const testButton = document.getElementById('test-button');
  if (testButton) {
    if (lesson.testSource && lesson.testSource.url) {
      testButton.classList.remove('hidden');
    } else {
      testButton.classList.add('hidden');
    }
  }
  loadLessonContent();
}

// Exportируем функции приложения
const app = {
  initApp,        // первая версия инициализации
  initAppUI,      // вторая версия инициализации (переименована)
  populateCourseDropdown,
  populateDays,
  handleProfessionChange,
  selectDay,
  selectLesson,
  goBackToDaySelection,
  goBackToTaskSelection,
  openVocabulary
};

export default app;