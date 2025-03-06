
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

// Функция для тестирования запросов к вебхукам
window.testWebhookRequest = async function(url) {
  console.log(`Тестирование вебхук-запроса к URL: ${url}`);
  
  try {
    // Создаем элемент для вывода результатов, если нужно отобразить на странице
    let resultElement = document.getElementById('webhook-test-result');
    if (!resultElement) {
      resultElement = document.createElement('div');
      resultElement.id = 'webhook-test-result';
      resultElement.style.position = 'fixed';
      resultElement.style.bottom = '10px';
      resultElement.style.right = '10px';
      resultElement.style.backgroundColor = 'rgba(0,0,0,0.8)';
      resultElement.style.color = 'white';
      resultElement.style.padding = '10px';
      resultElement.style.borderRadius = '5px';
      resultElement.style.maxWidth = '80%';
      resultElement.style.maxHeight = '50%';
      resultElement.style.overflow = 'auto';
      resultElement.style.zIndex = '10000';
      document.body.appendChild(resultElement);
    }
    
    resultElement.innerHTML = `<h3>Тестирование вебхука</h3><p>URL: ${url}</p><p>Статус: Отправка запроса...</p>`;
    
    // Используем XMLHttpRequest для лучшей совместимости
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Accept', 'application/json, text/plain, */*');
    xhr.timeout = 15000; // 15 секунд таймаут
    
    const requestStart = Date.now();
    
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 1) {
        console.log('Запрос открыт');
        resultElement.innerHTML += `<p>Запрос открыт</p>`;
      } else if (xhr.readyState === 2) {
        console.log('Заголовки получены');
        resultElement.innerHTML += `<p>Заголовки получены</p>`;
      } else if (xhr.readyState === 3) {
        console.log('Загрузка данных...');
        resultElement.innerHTML += `<p>Загрузка данных...</p>`;
      } else if (xhr.readyState === 4) {
        const requestTime = Date.now() - requestStart;
        console.log(`Запрос завершен за ${requestTime}ms`);
        
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log(`Успешный ответ: ${xhr.status}`);
          const responseSize = xhr.responseText.length;
          console.log(`Размер ответа: ${responseSize} байт`);
          
          resultElement.innerHTML += `
            <p style="color: #4CAF50;">✓ Успешный ответ: ${xhr.status}</p>
            <p>Время запроса: ${requestTime}ms</p>
            <p>Размер ответа: ${responseSize} байт</p>
            <details>
              <summary>Посмотреть начало ответа</summary>
              <pre style="max-height: 200px; overflow: auto; background: #333; padding: 10px;">${xhr.responseText.substring(0, 500)}${responseSize > 500 ? '...' : ''}</pre>
            </details>
          `;
          
          // Пытаемся распарсить JSON
          try {
            const jsonData = JSON.parse(xhr.responseText);
            console.log('JSON успешно распарсен, структура:', Object.keys(jsonData));
            
            resultElement.innerHTML += `
              <p style="color: #4CAF50;">✓ JSON успешно распарсен</p>
              <p>Найденные поля: ${Object.keys(jsonData).join(', ')}</p>
            `;
          } catch (e) {
            console.log('Не удалось распарсить ответ как JSON:', e.message);
            resultElement.innerHTML += `
              <p style="color: #FFC107;">⚠ Не удалось распарсить как JSON: ${e.message}</p>
            `;
            
            // Пытаемся найти JSON в тексте
            try {
              const jsonRegex = /{[\s\S]*}/;
              const match = xhr.responseText.match(jsonRegex);
              
              if (match && match[0]) {
                try {
                  const jsonData = JSON.parse(match[0]);
                  console.log('JSON найден в ответе, структура:', Object.keys(jsonData));
                  
                  resultElement.innerHTML += `
                    <p style="color: #4CAF50;">✓ JSON найден в тексте ответа</p>
                    <p>Найденные поля: ${Object.keys(jsonData).join(', ')}</p>
                  `;
                } catch (e2) {
                  console.log('Не удалось распарсить найденный JSON:', e2.message);
                }
              }
            } catch (e2) {
              console.log('Ошибка при поиске JSON в тексте:', e2.message);
            }
          }
        } else {
          console.error(`Ошибка HTTP: ${xhr.status}`);
          resultElement.innerHTML += `
            <p style="color: #F44336;">✗ Ошибка HTTP: ${xhr.status}</p>
            <p>Время запроса: ${requestTime}ms</p>
          `;
        }
      }
    };
    
    xhr.onerror = function(e) {
      console.error('Ошибка сети при отправке запроса:', e);
      resultElement.innerHTML += `
        <p style="color: #F44336;">✗ Ошибка сети при отправке запроса</p>
      `;
    };
    
    xhr.ontimeout = function() {
      console.error('Таймаут при отправке запроса');
      resultElement.innerHTML += `
        <p style="color: #F44336;">✗ Таймаут запроса (>15 секунд)</p>
      `;
    };
    
    // Добавляем кнопку закрытия
    resultElement.innerHTML += `
      <button onclick="this.parentNode.style.display='none'" style="margin-top: 10px; padding: 5px 10px; background: #666; border: none; color: white; border-radius: 3px; cursor: pointer;">Закрыть</button>
    `;
    
    // Отправляем запрос
    xhr.send();
    
    return new Promise((resolve, reject) => {
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.responseText);
        } else {
          reject(new Error(`HTTP ошибка! Статус: ${xhr.status}`));
        }
      };
      
      xhr.onerror = function() {
        reject(new Error('Ошибка сети при запросе'));
      };
      
      xhr.ontimeout = function() {
        reject(new Error('Таймаут запроса'));
      };
    });
  } catch (error) {
    console.error('Ошибка при тестировании вебхука:', error);
    return null;
  }
};

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
