/**
 * Модуль режима разработчика
 * Позволяет отслеживать и отображать информацию о запросах и ответах в приложении
 */

class DevMode {
  constructor() {
    this.enabled = true; // По умолчанию включен
    this.logs = [];
    this.maxLogs = 100;
    this.requestCounter = 0;
    this.networkRequests = {};
    this.localStorageData = {};
  }

  /**
   * Инициализация режима разработчика
   */
  initialize() {
    console.log('🔧 Инициализация режима разработчика...');
    this.addStyles();
    this.addDevModePanel();
    this.addDevModeToggle();
    this.overrideFetch();
    this.overrideXMLHttpRequest();
    this.refreshLocalStorageViewer();
    console.log('🔧 Режим разработчика инициализирован');
  }

  /**
   * Добавление стилей для режима разработчика
   */
  addStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      /* Переключатель режима разработчика */
      .dev-mode-toggle {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: #333;
        color: #fff;
        border: none;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        z-index: 9999;
        font-size: 20px;
        transition: all 0.3s ease;
      }

      .dev-mode-toggle span {
        display: none;
      }

      .dev-mode-toggle:hover {
        width: auto;
        border-radius: 25px;
        padding: 0 20px;
      }

      .dev-mode-toggle:hover span {
        display: inline;
        margin-left: 10px;
        font-size: 14px;
      }

      .dev-mode-toggle.enabled {
        background-color: #2ecc71;
      }

      /* Панель разработчика */
      .dev-panel {
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 300px;
        background-color: #282c34;
        color: #abb2bf;
        z-index: 9998;
        display: none;
        flex-direction: column;
        font-family: 'Consolas', 'Monaco', monospace;
        font-size: 13px;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
        overflow: hidden;
      }

      .dev-panel-header {
        background-color: #21252b;
        padding: 8px 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #181a1f;
      }

      .dev-panel-tabs {
        display: flex;
      }

      .dev-panel-tab {
        padding: 5px 15px;
        cursor: pointer;
        background-color: transparent;
        border: none;
        color: #abb2bf;
        border-bottom: 2px solid transparent;
      }

      .dev-panel-tab.active {
        border-bottom-color: #61afef;
        color: #fff;
      }

      .dev-panel-content {
        flex: 1;
        overflow: auto;
        padding: 10px;
      }

      .dev-panel-actions {
        display: flex;
        gap: 10px;
      }

      .dev-panel-btn {
        background-color: #3d424d;
        border: none;
        color: #fff;
        padding: 5px 10px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 12px;
      }

      .dev-panel-btn:hover {
        background-color: #4b5363;
      }

      .dev-panel-content-pane {
        display: none;
        height: 100%;
        overflow: auto;
      }

      .dev-panel-content-pane.active {
        display: block;
      }

      /* Стили для логов сетевых запросов */
      .network-log-item {
        border-bottom: 1px solid #3d424d;
        padding: 8px 0;
        display: flex;
        justify-content: space-between;
      }

      .network-log-status {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: 8px;
      }

      .network-log-status.success {
        background-color: #98c379;
      }

      .network-log-status.error {
        background-color: #e06c75;
      }

      .network-log-status.pending {
        background-color: #e5c07b;
      }

      .network-log-method {
        display: inline-block;
        width: 60px;
        color: #c678dd;
        font-weight: bold;
      }

      .network-log-url {
        flex: 1;
        margin: 0 10px;
        word-break: break-all;
        color: #61afef;
      }

      .network-log-time {
        color: #e5c07b;
      }

      .network-log-details {
        margin-top: 5px;
        padding: 10px;
        background-color: #2c313a;
        border-radius: 3px;
        display: none;
      }

      .network-log-details.visible {
        display: block;
      }

      .network-log-details h4 {
        margin: 0 0 10px 0;
        color: #abb2bf;
        font-size: 14px;
      }

      .network-log-details pre {
        margin: 0;
        white-space: pre-wrap;
        word-wrap: break-word;
        max-height: 200px;
        overflow: auto;
        font-size: 12px;
        color: #e5c07b;
      }

      /* Стили для localStorage viewer */
      .localstorage-viewer {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .localstorage-controls {
        margin-bottom: 10px;
        display: flex;
        gap: 10px;
      }

      .localstorage-items {
        display: flex;
        gap: 10px;
        flex: 1;
        overflow: hidden;
      }

      .localstorage-keys {
        width: 250px;
        overflow-y: auto;
        border: 1px solid #3d424d;
        border-radius: 3px;
      }

      .localstorage-key {
        padding: 8px 10px;
        cursor: pointer;
        border-bottom: 1px solid #3d424d;
        word-break: break-all;
        transition: background-color 0.2s;
      }

      .localstorage-key:hover {
        background-color: #2c313a;
      }

      .localstorage-key.active {
        background-color: #3d424d;
        color: #fff;
      }

      .localstorage-value {
        flex: 1;
        overflow: auto;
        border: 1px solid #3d424d;
        border-radius: 3px;
        padding: 10px;
      }

      .localstorage-value-edit {
        width: 100%;
        height: 100%;
        background-color: #282c34;
        color: #abb2bf;
        border: none;
        font-family: monospace;
        resize: none;
        outline: none;
      }

      .localstorage-value pre {
        margin: 0;
        white-space: pre-wrap;
        word-wrap: break-word;
      }

      /* Стили для курса анализа */
      .course-analysis {
        font-family: monospace;
        line-height: 1.5;
        padding: 10px;
      }

      .course-analysis h3 {
        margin-top: 15px;
        margin-bottom: 5px;
        color: #61afef;
      }

      .course-analysis pre {
        margin: 10px 0;
        padding: 10px;
        background-color: #2c313a;
        border-radius: 3px;
        overflow-x: auto;
        color: rgba(171, 178, 191, 0.8);
      }

      /* Стили для информационных значков в административном интерфейсе */
      .admin-form-group {
        position: relative;
      }

      .admin-webhook-info {
        position: relative;
        display: inline-block;
      }

      /* Адаптивность для мобильных устройств */
      @media (max-width: 768px) {
        .dev-panel {
          width: 100%;
          height: 200px;
        }
      }
    `;
    document.head.appendChild(styleElement);
  }

  /**
   * Добавление переключателя режима разработчика
   */
  addDevModeToggle() {
    const toggle = document.createElement('button');
    toggle.id = 'dev-mode-toggle';
    toggle.className = 'dev-mode-toggle' + (this.enabled ? ' enabled' : '');
    toggle.innerHTML = `
      <i class="fas fa-code"></i>
      <span>Режим разработчика</span>
    `;

    toggle.addEventListener('click', () => {
      this.toggleDevMode();
    });

    document.body.appendChild(toggle);
  }

  /**
   * Переключение режима разработчика
   */
  toggleDevMode() {
    this.enabled = !this.enabled;

    const toggle = document.getElementById('dev-mode-toggle');
    const devPanel = document.getElementById('dev-mode-panel');

    if (this.enabled) {
      toggle.classList.add('enabled');
      devPanel.style.display = 'flex';
      this.addInfoBadgesToAdminForms();
    } else {
      toggle.classList.remove('enabled');
      devPanel.style.display = 'none';
      this.removeInfoBadgesFromAdminForms();
    }

    console.log(`🔧 Режим разработчика ${this.enabled ? 'включен' : 'выключен'}`);
  }

  /**
   * Добавление панели разработчика
   */
  addDevModePanel() {
    const panel = document.createElement('div');
    panel.id = 'dev-mode-panel';
    panel.className = 'dev-panel';

    panel.innerHTML = `
      <div class="dev-panel-header">
        <div class="dev-panel-tabs">
          <button class="dev-panel-tab active" data-tab="network">Сетевые запросы</button>
          <button class="dev-panel-tab" data-tab="localstorage">LocalStorage</button>
          <button class="dev-panel-tab" data-tab="analyze">Анализ курсов</button>
        </div>
        <div class="dev-panel-actions">
          <button class="dev-panel-btn" id="dev-panel-clear">Очистить</button>
          <button class="dev-panel-btn" id="dev-panel-close">Закрыть</button>
        </div>
      </div>
      <div class="dev-panel-content">
        <div class="dev-panel-content-pane active" id="dev-panel-network">
          <div id="network-logs"></div>
        </div>
        <div class="dev-panel-content-pane" id="dev-panel-localstorage">
          <div class="localstorage-viewer">
            <div class="localstorage-controls">
              <button class="dev-panel-btn" id="refresh-localstorage">Обновить</button>
              <button class="dev-panel-btn" id="add-localstorage-item">Добавить</button>
              <button class="dev-panel-btn" id="edit-localstorage-item">Редактировать</button>
              <button class="dev-panel-btn" id="delete-localstorage-item">Удалить</button>
              <button class="dev-panel-btn" id="clear-localstorage">Очистить всё</button>
            </div>
            <div class="localstorage-items">
              <div class="localstorage-keys" id="localstorage-keys"></div>
              <div class="localstorage-value" id="localstorage-value">
                <pre id="localstorage-value-display"></pre>
              </div>
            </div>
          </div>
        </div>
        <div class="dev-panel-content-pane" id="dev-panel-analyze">
          <div class="course-analysis" id="course-analysis"></div>
        </div>
      </div>
    `;

    document.body.appendChild(panel);

    // Обработчики вкладок
    const tabs = panel.querySelectorAll('.dev-panel-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const tabId = tab.getAttribute('data-tab');
        const panes = panel.querySelectorAll('.dev-panel-content-pane');
        panes.forEach(pane => pane.classList.remove('active'));
        document.getElementById(`dev-panel-${tabId}`).classList.add('active');

        // Если выбрана вкладка анализа, выполняем анализ курсов
        if (tabId === 'analyze') {
          this.analyzeCoursesData();
        } else if (tabId === 'localstorage') {
          this.refreshLocalStorageViewer();
        }
      });
    });

    // Обработчик для кнопки очистки
    document.getElementById('dev-panel-clear').addEventListener('click', () => {
      const activeTab = panel.querySelector('.dev-panel-tab.active').getAttribute('data-tab');

      if (activeTab === 'network') {
        document.getElementById('network-logs').innerHTML = '';
        this.networkRequests = {};
      } else if (activeTab === 'analyze') {
        document.getElementById('course-analysis').innerHTML = '';
      }
    });

    // Обработчик для кнопки закрытия
    document.getElementById('dev-panel-close').addEventListener('click', () => {
      panel.style.display = 'none';
      document.getElementById('dev-mode-toggle').classList.remove('enabled');
      this.enabled = false;
    });

    // Обработчики для LocalStorage
    document.getElementById('refresh-localstorage').addEventListener('click', () => {
      this.refreshLocalStorageViewer();
    });

    document.getElementById('add-localstorage-item').addEventListener('click', () => {
      this.addLocalStorageItem();
    });

    document.getElementById('edit-localstorage-item').addEventListener('click', () => {
      this.editLocalStorageItem();
    });

    document.getElementById('delete-localstorage-item').addEventListener('click', () => {
      this.deleteLocalStorageItem();
    });

    document.getElementById('clear-localstorage').addEventListener('click', () => {
      if (confirm('Вы уверены, что хотите очистить все данные LocalStorage?')) {
        localStorage.clear();
        this.refreshLocalStorageViewer();
      }
    });
  }

  /**
   * Перехват нативного метода fetch
   */
  overrideFetch() {
    const originalFetch = window.fetch;
    const self = this;

    window.fetch = function(resource, init) {
      const startTime = performance.now();
      const requestId = ++self.requestCounter;

      let method = 'GET';
      let requestBody = null;

      if (init) {
        method = init.method || 'GET';
        requestBody = init.body || null;
      }

      // Записываем информацию о запросе
      const requestInfo = {
        id: requestId,
        url: resource instanceof Request ? resource.url : resource,
        method: method,
        headers: init?.headers ? (init.headers instanceof Headers ? Object.fromEntries(init.headers.entries()) : init.headers) : {},
        body: requestBody,
        timestamp: new Date(),
        startTime: startTime
      };

      // Если режим разработчика включен, логируем запрос
      if (self.enabled) {
        self.logRequest(requestInfo);
      }

      // Вызываем оригинальный fetch
      return originalFetch.apply(this, arguments)
        .then(response => {
          const endTime = performance.now();
          const duration = endTime - startTime;

          // Клонируем ответ для возможности прочитать тело
          const clonedResponse = response.clone();

          clonedResponse.text().then(responseText => {
            const responseInfo = {
              status: response.status,
              statusText: response.statusText,
              headers: Object.fromEntries(response.headers.entries()),
              body: responseText,
              duration: duration.toFixed(2)
            };

            // Если режим разработчика включен, логируем ответ
            if (self.enabled) {
              self.logResponse(requestId, responseInfo);
            }
          }).catch(err => {
            console.error('Ошибка при чтении тела ответа:', err);
          });

          return response;
        })
        .catch(error => {
          const endTime = performance.now();
          const duration = endTime - startTime;

          // Если режим разработчика включен, логируем ошибку
          if (self.enabled) {
            self.logError(requestId, error, duration.toFixed(2));
          }

          throw error;
        });
    };
  }

  /**
   * Перехват XMLHttpRequest
   */
  overrideXMLHttpRequest() {
    const self = this;
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
      this._devModeInfo = {
        id: ++self.requestCounter,
        method: method,
        url: url,
        timestamp: new Date(),
        startTime: performance.now()
      };

      return originalOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function(body) {
      if (this._devModeInfo) {
        this._devModeInfo.body = body;

        // Если режим разработчика включен, логируем запрос
        if (self.enabled) {
          self.logRequest(this._devModeInfo);
        }

        this.addEventListener('load', function() {
          const endTime = performance.now();
          const duration = endTime - this._devModeInfo.startTime;

          const responseInfo = {
            status: this.status,
            statusText: this.statusText,
            headers: this.getAllResponseHeaders().split('\r\n').reduce((result, header) => {
              const parts = header.split(': ');
              if (parts[0] && parts[1]) {
                result[parts[0]] = parts[1];
              }
              return result;
            }, {}),
            body: this.responseText,
            duration: duration.toFixed(2)
          };

          // Если режим разработчика включен, логируем ответ
          if (self.enabled) {
            self.logResponse(this._devModeInfo.id, responseInfo);
          }
        });

        this.addEventListener('error', function(event) {
          const endTime = performance.now();
          const duration = endTime - this._devModeInfo.startTime;

          // Если режим разработчика включен, логируем ошибку
          if (self.enabled) {
            self.logError(this._devModeInfo.id, new Error('Network error'), duration.toFixed(2));
          }
        });

        this.addEventListener('timeout', function() {
          const endTime = performance.now();
          const duration = endTime - this._devModeInfo.startTime;

          // Если режим разработчика включен, логируем ошибку таймаута
          if (self.enabled) {
            self.logError(this._devModeInfo.id, new Error('Request timeout'), duration.toFixed(2));
          }
        });
      }

      return originalSend.apply(this, arguments);
    };
  }

  /**
   * Запись информации о запросе
   */
  logRequest(requestInfo) {
    this.networkRequests[requestInfo.id] = {
      request: requestInfo,
      status: 'pending'
    };

    this.updateNetworkLogs();
  }

  /**
   * Запись информации об ответе
   */
  logResponse(requestId, responseInfo) {
    if (!this.networkRequests[requestId]) return;

    this.networkRequests[requestId].response = responseInfo;
    this.networkRequests[requestId].status = 'success';

    this.updateNetworkLogs();
  }

  /**
   * Запись информации об ошибке
   */
  logError(requestId, error, duration) {
    if (!this.networkRequests[requestId]) return;

    this.networkRequests[requestId].error = {
      message: error.message,
      stack: error.stack,
      duration: duration
    };
    this.networkRequests[requestId].status = 'error';

    this.updateNetworkLogs();
  }

  /**
   * Обновление списка сетевых запросов в панели
   */
  updateNetworkLogs() {
    const logsContainer = document.getElementById('network-logs');
    if (!logsContainer) return;

    logsContainer.innerHTML = '';

    // Получаем запросы и сортируем их по времени (новые сверху)
    const requests = Object.values(this.networkRequests).sort((a, b) => {
      return b.request.timestamp - a.request.timestamp;
    });

    requests.forEach(item => {
      const logItem = document.createElement('div');
      logItem.className = 'network-log-item';
      logItem.setAttribute('data-id', item.request.id);

      // Определяем цвет статуса
      let statusClass = 'pending';
      if (item.status === 'success') statusClass = 'success';
      if (item.status === 'error') statusClass = 'error';

      // Форматируем URL для отображения
      let url = item.request.url;
      if (url.length > 60) {
        url = url.substring(0, 60) + '...';
      }

      // Форматируем время запроса
      const time = item.request.timestamp.toLocaleTimeString();

      // Создаем основную информацию о запросе
      logItem.innerHTML = `
        <div class="network-log-info">
          <span class="network-log-status ${statusClass}"></span>
          <span class="network-log-method">${item.request.method}</span>
          <span class="network-log-url">${url}</span>
          <span class="network-log-time">${time}</span>
        </div>
      `;

      // Добавляем детальную информацию, которая будет показана при клике
      const detailsDiv = document.createElement('div');
      detailsDiv.className = 'network-log-details';

      // Информация о запросе
      let requestDetails = `
        <h4>Запрос</h4>
        <p>URL: ${item.request.url}</p>
        <p>Метод: ${item.request.method}</p>
      `;

      // Добавляем заголовки, если они есть
      if (item.request.headers && Object.keys(item.request.headers).length > 0) {
        requestDetails += `<p>Заголовки:</p><pre>${JSON.stringify(item.request.headers, null, 2)}</pre>`;
      }

      // Добавляем тело запроса, если оно есть
      if (item.request.body) {
        let bodyContent = item.request.body;

        // Если тело запроса является FormData, преобразуем его в объект
        if (bodyContent instanceof FormData) {
          const formDataObj = {};
          for (let [key, value] of bodyContent.entries()) {
            formDataObj[key] = value;
          }
          bodyContent = JSON.stringify(formDataObj, null, 2);
        } else if (typeof bodyContent === 'string') {
          // Пытаемся распарсить JSON
          try {
            const jsonBody = JSON.parse(bodyContent);
            bodyContent = JSON.stringify(jsonBody, null, 2);
          } catch (e) {
            // Не JSON, оставляем как есть
          }
        }

        requestDetails += `<p>Тело запроса:</p><pre>${bodyContent}</pre>`;
      }

      detailsDiv.innerHTML = requestDetails;

      // Добавляем информацию об ответе, если он есть
      if (item.response) {
        let responseDetails = `
          <h4>Ответ</h4>
          <p>Статус: ${item.response.status} ${item.response.statusText}</p>
          <p>Время: ${item.response.duration} мс</p>
        `;

        // Добавляем заголовки ответа
        if (item.response.headers && Object.keys(item.response.headers).length > 0) {
          responseDetails += `<p>Заголовки:</p><pre>${JSON.stringify(item.response.headers, null, 2)}</pre>`;
        }

        // Добавляем тело ответа
        if (item.response.body) {
          let bodyContent = item.response.body;

          // Пытаемся распарсить JSON
          try {
            const jsonBody = JSON.parse(bodyContent);
            bodyContent = JSON.stringify(jsonBody, null, 2);
          } catch (e) {
            // Не JSON, проверяем, не HTML ли это
            if (bodyContent.trim().startsWith('<!DOCTYPE') || bodyContent.trim().startsWith('<html')) {
              bodyContent = 'HTML-контент (слишком длинный для отображения)';
              if (bodyContent.length < 1000) {
                bodyContent = bodyContent.replace(/</g, '&lt;').replace(/>/g, '&gt;');
              }
            }
          }

          responseDetails += `<p>Тело ответа:</p><pre>${bodyContent}</pre>`;
        }

        detailsDiv.innerHTML += responseDetails;
      }

      // Добавляем информацию об ошибке, если она есть
      if (item.error) {
        detailsDiv.innerHTML += `
          <h4>Ошибка</h4>
          <p>${item.error.message}</p>
          <p>Время: ${item.error.duration} мс</p>
          ${item.error.stack ? `<pre>${item.error.stack}</pre>` : ''}
        `;
      }

      logItem.appendChild(detailsDiv);

      // Добавляем обработчик клика для показа/скрытия деталей
      logItem.addEventListener('click', function() {
        const details = this.querySelector('.network-log-details');
        details.classList.toggle('visible');
      });

      logsContainer.appendChild(logItem);
    });
  }

  /**
   * Обновление просмотрщика localStorage
   */
  refreshLocalStorageViewer() {
    const keysContainer = document.getElementById('localstorage-keys');
    const valueDisplay = document.getElementById('localstorage-value-display');

    if (!keysContainer || !valueDisplay) return;

    keysContainer.innerHTML = '';
    valueDisplay.textContent = 'Выберите элемент из списка слева';

    // Собираем все ключи из localStorage
    this.localStorageData = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      this.localStorageData[key] = value;

      const keyElement = document.createElement('div');
      keyElement.className = 'localstorage-key';
      keyElement.textContent = key;
      keyElement.dataset.key = key;

      keyElement.addEventListener('click', () => {
        const allKeys = document.querySelectorAll('.localstorage-key');
        allKeys.forEach(k => k.classList.remove('active'));
        keyElement.classList.add('active');

        // Пытаемся форматировать JSON
        try {
          const parsedValue = JSON.parse(value);
          valueDisplay.textContent = JSON.stringify(parsedValue, null, 2);
        } catch (e) {
          valueDisplay.textContent = value;
        }
      });

      keysContainer.appendChild(keyElement);
    }
  }

  /**
   * Добавление нового элемента в localStorage
   */
  addLocalStorageItem() {
    const key = prompt('Введите ключ:');
    if (!key) return;

    // Проверяем, существует ли уже такой ключ
    if (localStorage.getItem(key) !== null) {
      alert(`Ключ '${key}' уже существует. Используйте редактирование для изменения.`);
      return;
    }

    const value = prompt('Введите значение:');
    if (value === null) return; // Пользователь отменил ввод

    // Сохраняем в localStorage
    localStorage.setItem(key, value);

    // Обновляем просмотрщик
    this.refreshLocalStorageViewer();

    // Выбираем новый элемент
    setTimeout(() => {
      const newKeyElement = document.querySelector(`.localstorage-key[data-key="${key}"]`);
      if (newKeyElement) {
        newKeyElement.click();
      }
    }, 100);
  }

  /**
   * Редактирование элемента в localStorage
   */
  editLocalStorageItem() {
    const activeKey = document.querySelector('.localstorage-key.active');
    if (!activeKey) {
      alert('Сначала выберите элемент для редактирования');
      return;
    }

    const key = activeKey.dataset.key;
    const currentValue = localStorage.getItem(key);

    // Создаем текстовое поле для редактирования
    const valueDisplay = document.getElementById('localstorage-value-display');
    const valueContainer = document.getElementById('localstorage-value');

    // Скрываем текущее отображение
    valueDisplay.style.display = 'none';

    // Создаем текстовую область для редактирования
    const textarea = document.createElement('textarea');
    textarea.className = 'localstorage-value-edit';
    textarea.value = valueDisplay.textContent;
    valueContainer.appendChild(textarea);

    // Фокусируемся на текстовой области
    textarea.focus();

    // Создаем кнопки управления
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.marginTop = '10px';
    buttonsContainer.innerHTML = `
      <button class="dev-panel-btn" id="save-localstorage-edit">Сохранить</button>
      <button class="dev-panel-btn" id="cancel-localstorage-edit">Отмена</button>
    `;
    valueContainer.appendChild(buttonsContainer);

    // Обработчик для сохранения
    document.getElementById('save-localstorage-edit').addEventListener('click', () => {
      const newValue = textarea.value;

      // Проверяем, что это валидный JSON, если похоже на объект или массив
      if (newValue.trim().startsWith('{') || newValue.trim().startsWith('[')) {
        try {
          JSON.parse(newValue);
        } catch (e) {
          if (!confirm('Введенное значение не является валидным JSON. Всё равно сохранить?')) {
            return;
          }
        }
      }

      // Сохраняем новое значение
      localStorage.setItem(key, newValue);

      // Обновляем просмотрщик
      this.refreshLocalStorageViewer();

      // Выбираем отредактированный элемент
      setTimeout(() => {
        const editedKeyElement = document.querySelector(`.localstorage-key[data-key="${key}"]`);
        if (editedKeyElement) {
          editedKeyElement.click();
        }
      }, 100);
    });

    // Обработчик для отмены
    document.getElementById('cancel-localstorage-edit').addEventListener('click', () => {
      // Восстанавливаем обычное отображение
      valueContainer.removeChild(textarea);
      valueContainer.removeChild(buttonsContainer);
      valueDisplay.style.display = '';
    });
  }

  /**
   * Удаление элемента из localStorage
   */
  deleteLocalStorageItem() {
    const activeKey = document.querySelector('.localstorage-key.active');
    if (!activeKey) {
      alert('Сначала выберите элемент для удаления');
      return;
    }

    const key = activeKey.dataset.key;

    if (!confirm(`Вы уверены, что хотите удалить элемент '${key}'?`)) {
      return;
    }

    // Удаляем из localStorage
    localStorage.removeItem(key);

    // Обновляем просмотрщик
    this.refreshLocalStorageViewer();
  }

  /**
   * Анализ данных курсов
   */
  analyzeCoursesData() {
    const analysisContainer = document.getElementById('course-analysis');
    if (!analysisContainer) return;

    // Проверяем, инициализирован ли менеджер курсов
    if (!window.courseManager || !window.courseManager.courses) {
      analysisContainer.innerHTML = '<p>Менеджер курсов не инициализирован или данные курсов отсутствуют.</p>';
      return;
    }

    const courses = window.courseManager.courses;
    const courseIds = Object.keys(courses);

    if (courseIds.length === 0) {
      analysisContainer.innerHTML = '<p>Данные курсов отсутствуют.</p>';
      return;
    }

    let analysisHtml = `<h3>Анализ данных курсов</h3>`;

    // Общая статистика
    let totalDays = 0;
    let totalLessons = 0;
    let totalWebhooks = 0;
    let totalSpecialLessons = 0;
    let totalNoDayLessons = 0;
    const webhookUrls = [];

    // Анализируем каждый курс
    courseIds.forEach(courseId => {
      const course = courses[courseId];
      let courseHtml = `<h3>Курс: ${course.title || courseId}</h3>`;

      // Счетчики для этого курса
      let daysCount = course.days ? course.days.length : 0;
      let lessonCount = 0;
      let courseWebhooks = 0;
      let specialLessonsCount = course.specialLessons ? course.specialLessons.length : 0;
      let noDayLessonsCount = course.noDayLessons ? course.noDayLessons.length : 0;

      // Анализ дней и уроков
      let daysList = '';
      if (course.days && course.days.length > 0) {
        course.days.forEach(day => {
          daysList += `<div style="margin-top: 8px;"><span style="color: #e5c07b;">День ${day.id}:</span> ${day.title || 'Без названия'}</div>`;

          // Анализ уроков для этого дня
          if (day.lessons && Array.isArray(day.lessons)) {
            daysList += `<ul style="margin-top: 2px; padding-left: 20px;">`;

            day.lessons.forEach((lesson, lessonIndex) => {
              lessonCount++;
              totalLessons++;

              // Базовая информация о уроке
              let lessonInfo = `<li><span style="color: #98c379;">Урок ${lesson.id}:</span> ${lesson.title || 'Без названия'}`;

              // Информация об источнике контента
              if (lesson.contentSource) {
                if (lesson.contentSource.type === 'webhook') {
                  lessonInfo += ` <span style="color: #61afef;">[вебхук]</span>`;
                  courseWebhooks++;
                  totalWebhooks++;
                  webhookUrls.push(lesson.contentSource.url);
                } else if (lesson.contentSource.type === 'local') {
                  lessonInfo += ` <span style="color: #c678dd;">[локальный]</span>`;
                } else if (lesson.contentSource.type === 'markdown') {
                  lessonInfo += ` <span style="color: #56b6c2;">[встроенный]</span>`;
                }
              }

              // Информация о тесте
              if (lesson.testSource && lesson.testSource.type !== 'none') {
                lessonInfo += ` <span style="color: #d19a66;">[тест]</span>`;

                if (lesson.testSource.type === 'webhook') {
                  courseWebhooks++;
                  totalWebhooks++;
                  webhookUrls.push(lesson.testSource.url);
                }
              }

              // Информация о задании
              if (lesson.taskSource && lesson.taskSource.type !== 'none') {
                lessonInfo += ` <span style="color: #e06c75;">[задание]</span>`;
              }

              // Информация об аудио
              if (lesson.audioSource && lesson.audioSource.type !== 'none') {
                lessonInfo += ` <span style="color: #56b6c2;">[аудио]</span>`;
              }

              lessonInfo += `</li>`;
              daysList += lessonInfo;
            });

            daysList += `</ul>`;
          } else {
            daysList += `<div style="padding-left: 20px; color: #e06c75;">Нет уроков</div>`;
          }
        });
      } else {
        daysList = `<div style="color: #e06c75;">Дни не найдены</div>`;
      }

      // Анализ специальных уроков
      let specialLessonsList = '';
      if (course.specialLessons && course.specialLessons.length > 0) {
        specialLessonsList += `<div style="margin-top: 8px;"><span style="color: #c678dd;">Специальные уроки:</span></div><ul style="margin-top: 2px; padding-left: 20px;">`;

        course.specialLessons.forEach(lesson => {
          totalSpecialLessons++;

          // Базовая информация о уроке
          let lessonInfo = `<li><span style="color: #98c379;">Урок ${lesson.id}:</span> ${lesson.title || 'Без названия'}`;

          // Информация об источнике контента
          if (lesson.contentSource) {
            if (lesson.contentSource.type === 'webhook') {
              lessonInfo += ` <span style="color: #61afef;">[вебхук]</span>`;
              courseWebhooks++;
              totalWebhooks++;
              webhookUrls.push(lesson.contentSource.url);
            } else if (lesson.contentSource.type === 'local') {
              lessonInfo += ` <span style="color: #c678dd;">[локальный]</span>`;
            } else if (lesson.contentSource.type === 'markdown') {
              lessonInfo += ` <span style="color: #56b6c2;">[встроенный]</span>`;
            }
          }

          lessonInfo += `</li>`;
          specialLessonsList += lessonInfo;
        });

        specialLessonsList += `</ul>`;
      } else {
        specialLessonsList = `<div style="color: #e06c75;">Специальные уроки не найдены</div>`;
      }

      // Анализ уроков без дня
      let noDayLessonsList = '';
      if (course.noDayLessons && course.noDayLessons.length > 0) {
        noDayLessonsList += `<div style="margin-top: 8px;"><span style="color: #56b6c2;">Уроки без дня:</span></div><ul style="margin-top: 2px; padding-left: 20px;">`;

        course.noDayLessons.forEach(lesson => {
          totalNoDayLessons++;

          // Базовая информация о уроке
          let lessonInfo = `<li><span style="color: #98c379;">Урок ${lesson.id}:</span> ${lesson.title || 'Без названия'}`;

          // Информация об источнике контента
          if (lesson.contentSource) {
            if (lesson.contentSource.type === 'webhook') {
              lessonInfo += ` <span style="color: #61afef;">[вебхук]</span>`;
              courseWebhooks++;
              totalWebhooks++;
              webhookUrls.push(lesson.contentSource.url);
            } else if (lesson.contentSource.type === 'local') {
              lessonInfo += ` <span style="color: #c678dd;">[локальный]</span>`;
            } else if (lesson.contentSource.type === 'markdown') {
              lessonInfo += ` <span style="color: #56b6c2;">[встроенный]</span>`;
            }
          }

          lessonInfo += `</li>`;
          noDayLessonsList += lessonInfo;
        });

        noDayLessonsList += `</ul>`;
      } else {
        noDayLessonsList = `<div style="color: #e06c75;">Уроки без дня не найдены</div>`;
      }

      // Обновляем счетчики
      totalDays += daysCount;

      // Формируем результат анализа курса
      courseHtml += `
        <div style="margin-top: 5px;">
          <div><span style="color: #61afef;">ID:</span> ${courseId}</div>
          <div><span style="color: #61afef;">Название:</span> ${course.title || 'Без названия'}</div>
          <div><span style="color: #61afef;">Дней:</span> ${daysCount}</div>
          <div><span style="color: #61afef;">Уроков:</span> ${lessonCount}</div>
          <div><span style="color: #61afef;">Специальных уроков:</span> ${specialLessonsCount}</div>
          <div><span style="color: #61afef;">Уроков без дня:</span> ${noDayLessonCount}</div>
          <div><span style="color: #61afef;">Вебхуков:</span> ${courseWebhooks}</div>
          <div><span style="color: #61afef;">Скрытый:</span> ${course.hidden ? 'Да' : 'Нет'}</div>
          ${course.redirectUrl ? `<div><span style="color: #61afef;">URL перенаправления:</span> ${course.redirectUrl}</div>` : ''}
        </div>
      `;

      // Добавляем списки дней и уроков
      courseHtml += `
        <div style="margin-top: 10px;">
          <div style="color: #61afef; font-weight: bold;">Дни и уроки:</div>
          ${daysList}
        </div>

        <div style="margin-top: 10px;">
          <div style="color: #61afef; font-weight: bold;">Специальные уроки:</div>
          ${specialLessonsList}
        </div>

        <div style="margin-top: 10px;">
          <div style="color: #61afef; font-weight: bold;">Уроки без дня:</div>
          ${noDayLessonsList}
        </div>
      `;

      analysisHtml += courseHtml;
    });

    // Добавляем общую статистику
    analysisHtml = `
      <div>
        <h3>Общая статистика</h3>
        <div><span style="color: #61afef;">Всего курсов:</span> ${courseIds.length}</div>
        <div><span style="color: #61afef;">Всего дней:</span> ${totalDays}</div>
        <div><span style="color: #61afef;">Всего уроков:</span> ${totalLessons}</div>
        <div><span style="color: #61afef;">Всего специальных уроков:</span> ${totalSpecialLessons}</div>
        <div><span style="color: #61afef;">Всего уроков без дня:</span> ${totalNoDayLessons}</div>
        <div><span style="color: #61afef;">Всего вебхуков:</span> ${totalWebhooks}</div>
      </div>
      ${analysisHtml}
    `;

    // Добавляем анализ URL вебхуков
    if (webhookUrls.length > 0) {
      // Считаем уникальные URL
      const uniqueUrls = [...new Set(webhookUrls)];

      analysisHtml += `
        <div style="margin-top: 20px;">
          <h3>Анализ URL вебхуков</h3>
          <div><span style="color: #61afef;">Всего вебхуков:</span> ${webhookUrls.length}</div>
          <div><span style="color: #61afef;">Уникальных URL:</span> ${uniqueUrls.length}</div>
          <div style="margin-top: 10px;">
            <div style="color: #61afef; font-weight: bold;">Список URL:</div>
            <ul style="margin-top: 5px; padding-left: 20px;">
              ${uniqueUrls.map(url => `<li>${url}</li>`).join('')}
            </ul>
          </div>
        </div>
      `;
    }

    // Устанавливаем HTML
    analysisContainer.innerHTML = analysisHtml;
  }

  /**
   * Добавление информационных значков к формам администратора
   */
  addInfoBadgesToAdminForms() {
    // Проверяем, находимся ли мы на странице администратора
    if (!window.location.pathname.includes('admin.html')) return;

    // Добавляем индикаторы статуса к полям вебхуков
    const webhookFields = document.querySelectorAll('input[id*="webhook"]:not([data-dev-mode-badged])');

    webhookFields.forEach(field => {
      // Добавляем атрибут, чтобы не добавлять значок повторно
      field.setAttribute('data-dev-mode-badged', 'true');

      // Создаем контейнер для поля и значка
      const container = document.createElement('div');
      container.className = 'admin-webhook-info';
      container.style.width = '100%';
      container.style.display = 'flex';
      container.style.alignItems = 'center';

      // Клонируем поле ввода
      const clonedField = field.cloneNode(true);
      clonedField.style.flex = '1';

      // Создаем значок информации
      const infoIcon = document.createElement('span');
      infoIcon.innerHTML = `<i class="fas fa-info-circle"></i>`;
      infoIcon.style.marginLeft = '5px';
      infoIcon.style.color = '#3498db';
      infoIcon.style.cursor = 'pointer';

      // Добавляем подсказку при наведении
      infoIcon.title = 'Проверить URL';

      // Обработчик для проверки URL
      infoIcon.addEventListener('click', () => {
        this.testWebhookUrl(clonedField.value);
      });

      // Создаем значок статуса
      const statusIcon = document.createElement('span');
      statusIcon.innerHTML = `<i class="fas fa-question-circle"></i>`;
      statusIcon.style.marginLeft = '5px';
      statusIcon.style.color = '#e5c07b';
      statusIcon.style.cursor = 'pointer';
      statusIcon.title = 'Статус URL не проверен';

      // Добавляем поле и значки в контейнер
      container.appendChild(clonedField);
      container.appendChild(infoIcon);
      container.appendChild(statusIcon);

      // Заменяем оригинальное поле на контейнер
      field.parentNode.insertBefore(container, field);
      field.parentNode.removeChild(field);

      // Копируем ID и другие атрибуты
      clonedField.id = field.id;
      clonedField.name = field.name;

      // Добавляем обработчик изменения поля
      clonedField.addEventListener('input', () => {
        // Сбрасываем статус при изменении URL
        statusIcon.innerHTML = `<i class="fas fa-question-circle"></i>`;
        statusIcon.style.color = '#e5c07b';
        statusIcon.title = 'Статус URL не проверен';
      });

      // Проверяем URL при загрузке, если он не пустой
      if (clonedField.value) {
        this.checkWebhookUrl(clonedField.value, statusIcon);
      }
    });
  }

  /**
   * Удаление информационных значков из форм администратора
   */
  removeInfoBadgesFromAdminForms() {
    // Сбрасываем атрибут data-dev-mode-badged у всех полей
    const webhookFields = document.querySelectorAll('input[data-dev-mode-badged="true"]');

    webhookFields.forEach(field => {
      field.removeAttribute('data-dev-mode-badged');
    });
  }

  /**
   * Проверка URL вебхука
   */
  checkWebhookUrl(url, statusIcon) {
    if (!url) {
      statusIcon.innerHTML = `<i class="fas fa-times-circle"></i>`;
      statusIcon.style.color = '#e06c75';
      statusIcon.title = 'URL не указан';
      return;
    }

    // Обновляем значок на "загрузка"
    statusIcon.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;
    statusIcon.style.color = '#e5c07b';
    statusIcon.title = 'Проверка URL...';

    // Выполняем проверку URL
    fetch(url, { method: 'GET', mode: 'cors', headers: { 'Accept': 'application/json, text/plain, */*' } })
      .then(response => {
        if (response.ok) {
          statusIcon.innerHTML = `<i class="fas fa-check-circle"></i>`;
          statusIcon.style.color = '#98c379';
          statusIcon.title = `URL доступен (${response.status} ${response.statusText})`;
        } else {
          statusIcon.innerHTML = `<i class="fas fa-exclamation-circle"></i>`;
          statusIcon.style.color = '#e06c75';
          statusIcon.title = `Ошибка: ${response.status} ${response.statusText}`;
        }
      })
      .catch(error => {
        statusIcon.innerHTML = `<i class="fas fa-times-circle"></i>`;
        statusIcon.style.color = '#e06c75';
        statusIcon.title = `Ошибка: ${error.message}`;
      });
  }

  /**
   * Полная проверка URL вебхука с отображением результатов
   */
  testWebhookUrl(url) {
    if (!url) {
      alert('URL не указан');
      return;
    }

    // Создаем модальное окно для отображения результатов
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    modal.style.zIndex = '10000';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';

    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = '#282c34';
    modalContent.style.color = '#abb2bf';
    modalContent.style.padding = '20px';
    modalContent.style.borderRadius = '5px';
    modalContent.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.3)';
    modalContent.style.width = '80%';
    modalContent.style.maxWidth = '800px';
    modalContent.style.maxHeight = '80vh';
    modalContent.style.overflow = 'auto';

    modalContent.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h3 style="margin: 0;">Проверка URL вебхука</h3>
        <button id="close-webhook-test" style="background: none; border: none; color: #e06c75; font-size: 20px; cursor: pointer;">&times;</button>
      </div>
      <div>
        <p>URL: <span style="color: #61afef;">${url}</span></p>
        <div id="webhook-test-status" style="margin: 15px 0;">
          <p style="display: flex; align-items: center;">
            <i class="fas fa-spinner fa-spin" style="margin-right: 10px;"></i>
            Отправка запроса...
          </p>
        </div>
      </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Обработчик для закрытия модального окна
    document.getElementById('close-webhook-test').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    // Выполняем проверку URL
    const startTime = performance.now();

    fetch(url, { 
      method: 'GET', 
      mode: 'cors', 
      headers: { 'Accept': 'application/json, text/plain, */*' }
    })
      .then(response => {
        const endTime = performance.now();
        const duration = (endTime - startTime).toFixed(2);

        return response.text().then(text => {
          return { 
            status: response.status, 
            statusText: response.statusText, 
            headers: Object.fromEntries(response.headers.entries()),
            body: text,
            duration: duration
          };
        });
      })
      .then(result => {
        const statusDiv = document.getElementById('webhook-test-status');

        let formattedBody = result.body;

        // Пытаемся форматировать JSON
        try {
          const parsedBody = JSON.parse(result.body);
          formattedBody = JSON.stringify(parsedBody, null, 2);
        } catch (e) {
          // Не JSON, пробуем обработать как HTML
          if (result.body.trim().startsWith('<!DOCTYPE') || result.body.trim().startsWith('<html')) {
            formattedBody = 'HTML-контент (слишком длинный для отображения)';
            if (result.body.length < 5000) {
              formattedBody = result.body.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            }
          }
        }

        let statusColor = '#e06c75'; // Красный для ошибок
        let statusIcon = 'fa-times-circle';

        if (result.status >= 200 && result.status < 300) {
          statusColor = '#98c379'; // Зеленый для успеха
          statusIcon = 'fa-check-circle';
        } else if (result.status >= 300 && result.status < 400) {
          statusColor = '#61afef'; // Синий для перенаправлений
          statusIcon = 'fa-info-circle';
        } else if (result.status >= 400 && result.status < 500) {
          statusColor = '#e5c07b'; // Желтый для клиентских ошибок
          statusIcon = 'fa-exclamation-circle';
        }

        statusDiv.innerHTML = `
          <p style="display: flex; align-items: center; color: ${statusColor};">
            <i class="fas ${statusIcon}" style="margin-right: 10px;"></i>
            Статус: ${result.status} ${result.statusText} (${result.duration} мс)
          </p>
          <div style="margin-top: 15px;">
            <h4 style="margin: 0 0 10px 0;">Заголовки ответа:</h4>
            <pre style="margin: 0; background-color: #2c313a; padding: 10px; border-radius: 3px; overflow-x: auto;">${JSON.stringify(result.headers, null, 2)}</pre>
          </div>
          <div style="margin-top: 15px;">
            <h4 style="margin: 0 0 10px 0;">Тело ответа:</h4>
            <pre style="margin: 0; background-color: #2c313a; padding: 10px; border-radius: 3px; overflow-x: auto; max-height: 300px;">${formattedBody}</pre>
          </div>
        `;
      })
      .catch(error => {
        const statusDiv = document.getElementById('webhook-test-status');

        statusDiv.innerHTML = `
          <p style="display: flex; align-items: center; color: #e06c75;">
            <i class="fas fa-times-circle" style="margin-right: 10px;"></i>
            Ошибка: ${error.message}
          </p>
          <div style="margin-top: 15px;">
            <p>Возможные причины ошибки:</p>
            <ul style="padding-left: 20px;">
              <li>Неправильный URL или сервер недоступен</li>
              <li>Проблемы с CORS (Cross-Origin Resource Sharing)</li>
              <li>Сетевая ошибка или таймаут</li>
              <li>Сервер не отвечает или вернул некорректный ответ</li>
            </ul>
          </div>
        `;
      });
  }
}

// Создаем и экспортируем экземпляр DevMode
const devMode = new DevMode();
export default devMode;