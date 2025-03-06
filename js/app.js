
// Инициализация приложения
document.addEventListener('DOMContentLoaded', async function() {
  console.log('Инициализация приложения...');
  
  // Показываем индикатор загрузки
  showLoadingStatus('Инициализация приложения...');
  
  // Проверяем наличие сохраненных URL вебхуков
  const webhookSettings = getWebhookSettings();
  
  // Проверяем соединение и получаем адреса вебхуков
  await getWebhookEndpoints();
  
  try {
    // Инициализация менеджера курсов (может занять время, если требуется загрузка с вебхука)
    await window.courseManager.initialize();
    console.log('Инициализация менеджера курсов успешно завершена');
    
    // Прячем глобальный индикатор загрузки с плавной анимацией
    hideGlobalLoadingOverlay();
    
  } catch (error) {
    console.error('Ошибка при инициализации:', error);
    showLoadingError('Не удалось загрузить данные. ' + error.message);
  }
});

// Функция для получения адресов вебхуков
async function getWebhookEndpoints() {
  // URL для получения вебхуков
  const getWebhooksUrl = "https://auto.crm-s.com/webhook/GetOnboardingHooks";
  
  // Показываем индикатор
  showLoadingStatus('Получение настроек вебхуков...');
  
  try {
    // Используем XMLHttpRequest вместо fetch для большей совместимости
    const xhr = new XMLHttpRequest();
    xhr.open('GET', getWebhooksUrl, true);
    xhr.setRequestHeader('Accept', 'application/json, text/plain, */*');
    xhr.timeout = 10000; // 10 секунд таймаут
    
    return new Promise((resolve, reject) => {
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          // Обрабатываем успешный ответ
          try {
            // Получаем текст ответа
            const responseText = xhr.responseText;
            console.log('Получен ответ от сервера, размер:', responseText.length, 'байт');
            
            // Пытаемся распарсить JSON
            let data;
            try {
              data = JSON.parse(responseText);
            } catch (e) {
              // Если не получается распарсить напрямую, ищем JSON в тексте
              try {
                const jsonRegex = /{[\s\S]*}/;
                const match = responseText.match(jsonRegex);
                if (match && match[0]) {
                  data = JSON.parse(match[0]);
                }
              } catch (e2) {
                console.error('Не удалось распарсить JSON из ответа:', e2);
              }
            }
            
            if (data) {
              // Сохраняем адреса вебхуков
              saveWebhookSettings(data);
              showLoadingStatus('Настройки вебхуков получены');
              resolve(data);
            } else {
              console.error('Не удалось получить данные вебхуков, ответ не в формате JSON');
              resolve(null);
            }
          } catch (error) {
            console.error('Ошибка при обработке ответа:', error);
            reject(error);
          }
        } else {
          // Обрабатываем ошибку HTTP
          console.error('Ошибка HTTP при получении вебхуков:', xhr.status);
          reject(new Error('Ошибка HTTP ' + xhr.status));
        }
      };
      
      xhr.onerror = function(e) {
        console.error('Ошибка сети при получении вебхуков:', e);
        reject(new Error('Ошибка сети'));
      };
      
      xhr.ontimeout = function() {
        console.error('Таймаут при получении вебхуков');
        reject(new Error('Истекло время ожидания'));
      };
      
      // Отправляем запрос
      xhr.send();
    });
  } catch (error) {
    console.error('Ошибка при импорте вебхуков:', error);
    showLoadingStatus('Ошибка при импорте вебхуков: ' + error.message, 'error');
    return null;
  }
}

// Функция для получения настроек вебхуков из localStorage
function getWebhookSettings() {
  try {
    const settingsStr = localStorage.getItem('webhookSettings');
    if (settingsStr) {
      return JSON.parse(settingsStr);
    }
  } catch (e) {
    console.error('Ошибка при чтении настроек вебхуков:', e);
  }
  return null;
}

// Функция для сохранения настроек вебхуков
function saveWebhookSettings(data) {
  try {
    // Определяем URL для импорта и экспорта
    let importUrl = null;
    let exportUrl = null;
    
    // Проверяем разные форматы данных
    if (data.ImportSettingsWebhookGet) {
      importUrl = data.ImportSettingsWebhookGet;
    }
    if (data.ExportSettingsWebhookPost) {
      exportUrl = data.ExportSettingsWebhookPost;
    }
    
    // Если нашли URL, сохраняем их
    if (importUrl || exportUrl) {
      const settings = {
        importUrl: importUrl,
        exportUrl: exportUrl,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem('webhookSettings', JSON.stringify(settings));
      localStorage.setItem('importWebhookUrl', importUrl); // Для совместимости
      
      console.log('Настройки вебхуков сохранены:', settings);
      return true;
    }
  } catch (e) {
    console.error('Ошибка при сохранении настроек вебхуков:', e);
  }
  return false;
}

// Функция для показа статуса загрузки
function showLoadingStatus(message, type = 'info') {
  console.log('Статус загрузки:', message);
  
  // Обновляем статус в глобальном индикаторе
  const statusElement = document.getElementById('global-loading-status');
  if (statusElement) {
    statusElement.textContent = message;
    
    // Устанавливаем цвет в зависимости от типа
    if (type === 'error') {
      statusElement.style.color = '#cc0000';
    } else {
      statusElement.style.color = '#3498db';
    }
  }
  
  // Показываем глобальный индикатор
  const loadingOverlay = document.getElementById('global-loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.style.display = 'flex';
    loadingOverlay.style.opacity = '1';
  }
}

// Функция для скрытия глобального индикатора загрузки с анимацией
function hideGlobalLoadingOverlay() {
  const loadingOverlay = document.getElementById('global-loading-overlay');
  if (loadingOverlay) {
    // Плавное скрытие с анимацией
    loadingOverlay.style.opacity = '0';
    setTimeout(() => {
      loadingOverlay.style.display = 'none';
    }, 500); // Время анимации в мс
  }
}

// Функция для показа ошибки загрузки
function showLoadingError(message) {
  console.error('Ошибка загрузки:', message);
  
  // Обновляем статус в глобальном индикаторе
  const statusElement = document.getElementById('global-loading-status');
  if (statusElement) {
    statusElement.textContent = message;
    statusElement.style.color = '#cc0000';
  }
  
  // Показываем кнопку повторной загрузки
  const retryContainer = document.getElementById('loading-retry-container');
  if (retryContainer) {
    retryContainer.classList.remove('hidden');
  }
}
