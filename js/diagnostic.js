
/**
 * Диагностический инструмент для проверки соединения и работы вебхуков
 */

// Функция запуска диагностики
async function runDiagnostics() {
  console.log('==== НАЧАЛО ДИАГНОСТИКИ ====');
  const results = {
    network: false,
    webhooks: false,
    localStorage: false,
    cors: false,
    dataProcess: false
  };
  
  // Проверка сетевого соединения
  try {
    console.log('Проверка сетевого соединения...');
    const testUrl = 'https://httpbin.org/get';
    const response = await fetch(testUrl, { 
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });
    
    if (response.ok) {
      results.network = true;
      console.log('✅ Сетевое соединение работает');
    } else {
      console.log('❌ Проблемы с сетевым соединением:', response.status);
    }
  } catch (error) {
    console.error('❌ Ошибка сетевого соединения:', error.message);
  }
  
  // Проверка вебхуков
  try {
    console.log('Проверка вебхуков...');
    const webhookUrl = 'https://auto.crm-s.com/webhook/GetOnboardingHooks';
    
    // Используем XMLHttpRequest для обхода проблем с CORS
    const xhr = new XMLHttpRequest();
    xhr.open('GET', webhookUrl, true);
    
    const webhookPromise = new Promise((resolve, reject) => {
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.responseText);
        } else {
          reject(new Error(`HTTP ошибка: ${xhr.status}`));
        }
      };
      
      xhr.onerror = function() {
        reject(new Error('Ошибка сети'));
      };
      
      xhr.ontimeout = function() {
        reject(new Error('Таймаут'));
      };
      
      xhr.timeout = 10000; // 10 секунд
    });
    
    try {
      const webhookResponse = await webhookPromise;
      console.log('✅ Проверка вебхуков успешна, получен ответ длиной', webhookResponse.length, 'байт');
      
      // Пытаемся парсить JSON
      try {
        const data = JSON.parse(webhookResponse);
        console.log('✅ Ответ вебхука успешно распарсен как JSON');
        console.log('Структура ответа:', Object.keys(data));
        results.webhooks = true;
      } catch (e) {
        console.log('⚠️ Ответ вебхука не удалось распарсить как JSON');
        console.log('Первые 100 символов ответа:', webhookResponse.substring(0, 100) + '...');
      }
    } catch (error) {
      console.error('❌ Ошибка проверки вебхуков:', error.message);
    }
  } catch (error) {
    console.error('❌ Ошибка при проверке вебхуков:', error.message);
  }
  
  // Проверка localStorage
  try {
    console.log('Проверка localStorage...');
    const testKey = '_diagnostic_test_key_';
    const testValue = 'test_' + Date.now();
    
    // Пробуем записать в localStorage
    localStorage.setItem(testKey, testValue);
    
    // Пробуем прочитать из localStorage
    const readValue = localStorage.getItem(testKey);
    
    // Удаляем тестовый ключ
    localStorage.removeItem(testKey);
    
    if (readValue === testValue) {
      results.localStorage = true;
      console.log('✅ localStorage работает корректно');
    } else {
      console.log('❌ Проблемы с localStorage: записано и прочитано разные значения');
    }
  } catch (error) {
    console.error('❌ Ошибка при проверке localStorage:', error.message);
  }
  
  // Проверка проблем CORS
  console.log('Проверка проблем CORS...');
  try {
    const corsTestUrl = 'https://auto.crm-s.com/webhook/GetOnboardingHooks';
    fetch(corsTestUrl, { 
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      mode: 'cors',
      cache: 'no-store'
    })
    .then(response => {
      results.cors = true;
      console.log('✅ CORS запрос выполнен успешно');
    })
    .catch(error => {
      console.error('❌ Ошибка CORS:', error.message);
    });
  } catch (error) {
    console.error('❌ Ошибка при проверке CORS:', error.message);
  }
  
  // Проверка обработки данных
  try {
    console.log('Проверка обработки данных...');
    
    // Получаем существующие данные из localStorage
    const coursesBackup = localStorage.getItem('coursesBackup');
    
    if (coursesBackup) {
      try {
        const data = JSON.parse(coursesBackup);
        if (data && typeof data === 'object') {
          results.dataProcess = true;
          console.log('✅ Обработка данных работает, найден бэкап курсов');
          console.log('Идентификаторы курсов:', Object.keys(data));
        } else {
          console.log('❌ Данные курсов в неправильном формате');
        }
      } catch (e) {
        console.error('❌ Ошибка при парсинге данных курсов:', e.message);
      }
    } else {
      console.log('⚠️ Бэкап курсов не найден в localStorage');
    }
  } catch (error) {
    console.error('❌ Ошибка при проверке обработки данных:', error.message);
  }
  
  console.log('==== РЕЗУЛЬТАТЫ ДИАГНОСТИКИ ====');
  console.log('Сетевое соединение:', results.network ? 'РАБОТАЕТ' : 'ПРОБЛЕМЫ');
  console.log('Вебхуки:', results.webhooks ? 'РАБОТАЮТ' : 'ПРОБЛЕМЫ');
  console.log('localStorage:', results.localStorage ? 'РАБОТАЕТ' : 'ПРОБЛЕМЫ');
  console.log('CORS:', results.cors ? 'РАЗРЕШЕН' : 'ЗАБЛОКИРОВАН');
  console.log('Обработка данных:', results.dataProcess ? 'РАБОТАЕТ' : 'ПРОБЛЕМЫ');
  
  return results;
}

// Экспортируем функцию для использования в консоли
window.diagnostics = {
  run: runDiagnostics,
  checkWebhook: async function(url) {
    try {
      console.log('Проверка вебхука:', url);
      const response = await fetch(url, { 
        method: 'GET',
        cache: 'no-store'
      });
      
      if (response.ok) {
        const text = await response.text();
        console.log('✅ Получен ответ, длина:', text.length, 'байт');
        console.log('Первые 100 символов:', text.substring(0, 100) + '...');
        return true;
      } else {
        console.log('❌ Ошибка HTTP:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Ошибка:', error.message);
      return false;
    }
  }
};

// Автоматический запуск диагностики при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
  console.log('Диагностический инструмент загружен. Для запуска диагностики используйте diagnostics.run() в консоли.');
});
