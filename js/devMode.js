
/**
 * Модуль режима разработчика
 * Позволяет отслеживать и отображать информацию о запросах и ответах в приложении
 */

class DevMode {
  constructor() {
    this.enabled = true; // По умолчанию включен
    this.logs = [];
    this.maxLogs = 100; // Максимальное количество логов для хранения
    this.requestCounter = 0;
    this._initialized = false;
  }

  /**
   * Инициализация режима разработчика
   */
  initialize() {
    if (this._initialized) return;
    
    console.log('🔧 Инициализация режима разработчика...');
    
    // Создаем панель для логов
    this.createDevPanel();
    
    // Перехватываем нативный метод fetch
    this.overrideFetch();
    
    // Перехватываем XMLHttpRequest
    this.overrideXHR();
    
    // Добавляем переключатель в интерфейс
    this.addDevModeToggle();
    
    this._initialized = true;
    console.log('🔧 Режим разработчика инициализирован');
  }
  
  /**
   * Создание панели разработчика
   */
  createDevPanel() {
    // Создаем контейнер для панели
    const devPanel = document.createElement('div');
    devPanel.id = 'dev-mode-panel';
    devPanel.className = 'dev-panel';
    devPanel.innerHTML = `
      <div class="dev-panel-header">
        <h3>Режим разработчика</h3>
        <div class="dev-panel-actions">
          <button id="dev-panel-sync" title="Синхронизировать с облаком"><i class="fas fa-sync-alt"></i></button>
          <button id="dev-panel-clear" title="Очистить логи"><i class="fas fa-trash"></i></button>
          <button id="dev-panel-minimize" title="Свернуть панель"><i class="fas fa-minus"></i></button>
        </div>
      </div>
      <div class="dev-panel-body">
        <div id="dev-panel-logs"></div>
      </div>
    `;
    
    document.body.appendChild(devPanel);
    
    // Добавляем стили для панели
    this.addDevPanelStyles();
    
    // Настраиваем обработчики событий
    document.getElementById('dev-panel-clear').addEventListener('click', () => {
      this.clearLogs();
    });
    
    document.getElementById('dev-panel-minimize').addEventListener('click', () => {
      devPanel.classList.toggle('minimized');
      if (devPanel.classList.contains('minimized')) {
        document.getElementById('dev-panel-minimize').innerHTML = '<i class="fas fa-plus"></i>';
      } else {
        document.getElementById('dev-panel-minimize').innerHTML = '<i class="fas fa-minus"></i>';
      }
    });
    
    // Добавляем обработчик для кнопки синхронизации
    document.getElementById('dev-panel-sync').addEventListener('click', () => {
      this.syncWithCloud();
    });
  }
  
  /**
   * Добавление стилей для панели разработчика
   */
  addDevPanelStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .dev-panel {
        position: fixed;
        bottom: 0;
        right: 0;
        width: 500px;
        max-width: 100%;
        height: 300px;
        background-color: rgba(40, 44, 52, 0.95);
        color: #eee;
        border-top-left-radius: 8px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
        font-family: 'Consolas', 'Monaco', monospace;
        font-size: 12px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        transition: all 0.3s ease;
      }
      
      .dev-panel.minimized {
        height: 36px;
        overflow: hidden;
      }
      
      .dev-panel-header {
        background-color: #1e2127;
        padding: 8px 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top-left-radius: 8px;
        user-select: none;
      }
      
      .dev-panel-header h3 {
        margin: 0;
        font-size: 14px;
        font-weight: normal;
      }
      
      .dev-panel-actions {
        display: flex;
        gap: 5px;
      }
      
      .dev-panel-actions button {
        background: none;
        border: none;
        color: #aaa;
        cursor: pointer;
        font-size: 12px;
        width: 20px;
        height: 20px;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 3px;
      }
      
      .dev-panel-actions button:hover {
        background-color: rgba(255, 255, 255, 0.1);
        color: #fff;
      }
      
      .dev-panel-body {
        flex: 1;
        overflow-y: auto;
        padding: 10px;
      }
      
      #dev-panel-logs {
        font-family: 'Consolas', 'Monaco', monospace;
        font-size: 12px;
        line-height: 1.4;
      }
      
      .dev-log-entry {
        margin-bottom: 10px;
        padding-bottom: 10px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .dev-log-entry-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 3px;
      }
      
      .dev-log-timestamp {
        color: #aaa;
        font-size: 10px;
      }
      
      .dev-log-url {
        color: #61afef;
        word-break: break-all;
      }
      
      .dev-log-method {
        color: #98c379;
        font-weight: bold;
        margin-right: 5px;
      }
      
      .dev-log-status {
        font-weight: bold;
      }
      
      .dev-log-status.success {
        color: #98c379;
      }
      
      .dev-log-status.error {
        color: #e06c75;
      }
      
      .dev-log-button {
        padding: 2px 5px;
        background-color: rgba(255, 255, 255, 0.1);
        border: none;
        border-radius: 3px;
        color: #ddd;
        cursor: pointer;
        font-size: 11px;
        margin-top: 5px;
      }
      
      .dev-log-button:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }
      
      .dev-log-details {
        background-color: rgba(0, 0, 0, 0.2);
        padding: 5px;
        margin-top: 5px;
        border-radius: 3px;
        display: none;
      }
      
      .dev-log-details.visible {
        display: block;
      }
      
      .dev-log-label {
        color: #d19a66;
        margin-right: 5px;
      }
      
      .dev-log-message {
        word-break: break-word;
      }
      
      .dev-log-message.success {
        color: #98c379;
      }
      
      .dev-log-message.error {
        color: #e06c75;
      }
      
      .dev-log-message.warning {
        color: #e5c07b;
      }
      
      .dev-log-message.info {
        color: #61afef;
      }
      
      .dev-info-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background-color: rgba(97, 175, 239, 0.8);
        color: white;
        font-size: 12px;
        cursor: pointer;
        margin-left: 5px;
        vertical-align: middle;
      }
      
      .dev-info-tooltip {
        position: absolute;
        background-color: #282c34;
        color: #eee;
        padding: 10px;
        border-radius: 5px;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
        z-index: 10001;
        max-width: 400px;
        font-size: 12px;
        display: none;
      }
      
      .dev-info-tooltip.visible {
        display: block;
      }
      
      .dev-info-badge:hover + .dev-info-tooltip {
        display: block;
      }
      
      .dev-mode-toggle {
        position: fixed;
        top: 10px;
        right: 10px;
        background-color: rgba(40, 44, 52, 0.8);
        color: white;
        border: none;
        border-radius: 4px;
        padding: 5px 10px;
        cursor: pointer;
        font-size: 12px;
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 5px;
      }
      
      .dev-mode-toggle i {
        font-size: 14px;
      }
      
      .dev-mode-toggle.enabled {
        background-color: rgba(152, 195, 121, 0.8);
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
  overrideXHR() {
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
        
        this.addEventListener('error', function(error) {
          const endTime = performance.now();
          const duration = endTime - this._devModeInfo.startTime;
          
          // Если режим разработчика включен, логируем ошибку
          if (self.enabled) {
            self.logError(this._devModeInfo.id, new Error('Network Error'), duration.toFixed(2));
          }
        });
        
        this.addEventListener('timeout', function() {
          const endTime = performance.now();
          const duration = endTime - this._devModeInfo.startTime;
          
          // Если режим разработчика включен, логируем ошибку
          if (self.enabled) {
            self.logError(this._devModeInfo.id, new Error('Request Timeout'), duration.toFixed(2));
          }
        });
      }
      
      return originalSend.apply(this, arguments);
    };
  }
  
  /**
   * Логирование запроса
   */
  logRequest(requestInfo) {
    // Добавляем запрос в массив логов
    const requestLog = {
      id: requestInfo.id,
      type: 'request',
      method: requestInfo.method,
      url: requestInfo.url,
      headers: requestInfo.headers,
      body: requestInfo.body,
      timestamp: requestInfo.timestamp,
      startTime: requestInfo.startTime
    };
    
    this.logs.push(requestLog);
    this.trimLogs();
    
    // Отображаем запрос в панели разработчика
    this.renderLogEntry(requestLog);
  }
  
  /**
   * Логирование ответа
   */
  logResponse(requestId, responseInfo) {
    // Находим запрос по ID
    const requestLog = this.logs.find(log => log.id === requestId && log.type === 'request');
    
    if (requestLog) {
      // Добавляем информацию об ответе
      const responseLog = {
        id: requestId,
        type: 'response',
        status: responseInfo.status,
        statusText: responseInfo.statusText,
        headers: responseInfo.headers,
        body: responseInfo.body,
        duration: responseInfo.duration,
        timestamp: new Date()
      };
      
      this.logs.push(responseLog);
      this.trimLogs();
      
      // Обновляем отображение в панели разработчика
      this.updateLogEntry(requestId, responseLog);
    }
  }
  
  /**
   * Логирование ошибки
   */
  logError(requestId, error, duration) {
    // Находим запрос по ID
    const requestLog = this.logs.find(log => log.id === requestId && log.type === 'request');
    
    if (requestLog) {
      // Добавляем информацию об ошибке
      const errorLog = {
        id: requestId,
        type: 'error',
        error: error.message || 'Unknown error',
        stack: error.stack,
        duration: duration,
        timestamp: new Date()
      };
      
      this.logs.push(errorLog);
      this.trimLogs();
      
      // Обновляем отображение в панели разработчика
      this.updateLogEntry(requestId, errorLog);
    }
  }
  
  /**
   * Ограничение количества логов
   */
  trimLogs() {
    if (this.logs.length > this.maxLogs) {
      const logsToRemove = this.logs.length - this.maxLogs;
      this.logs.splice(0, logsToRemove);
    }
  }
  
  /**
   * Отображение лога в панели разработчика
   */
  renderLogEntry(log) {
    const logsContainer = document.getElementById('dev-panel-logs');
    
    if (!logsContainer) return;
    
    const logEntry = document.createElement('div');
    logEntry.id = `dev-log-${log.id}`;
    logEntry.className = 'dev-log-entry';
    
    const timestamp = new Date(log.timestamp).toLocaleTimeString();
    
    if (log.type === 'request') {
      logEntry.innerHTML = `
        <div class="dev-log-entry-header">
          <span>
            <span class="dev-log-method">${log.method}</span>
            <span class="dev-log-url">${this.truncateString(log.url, 60)}</span>
          </span>
          <span class="dev-log-timestamp">${timestamp}</span>
        </div>
        <div>
          <button class="dev-log-button" onclick="window.devMode.toggleLogDetails(${log.id})">Детали</button>
        </div>
        <div id="dev-log-details-${log.id}" class="dev-log-details">
          <div><span class="dev-log-label">URL:</span> ${log.url}</div>
          <div><span class="dev-log-label">Метод:</span> ${log.method}</div>
          <div><span class="dev-log-label">Заголовки:</span> ${this.formatJson(log.headers)}</div>
          ${log.body ? `<div><span class="dev-log-label">Тело запроса:</span> ${this.formatRequestBody(log.body)}</div>` : ''}
        </div>
      `;
    }
    
    logsContainer.prepend(logEntry);
  }
  
  /**
   * Обновление отображения лога в панели разработчика
   */
  updateLogEntry(requestId, log) {
    const logEntry = document.getElementById(`dev-log-${requestId}`);
    
    if (!logEntry) return;
    
    const logDetails = document.getElementById(`dev-log-details-${requestId}`);
    
    if (log.type === 'response') {
      const statusClass = log.status >= 200 && log.status < 400 ? 'success' : 'error';
      
      const logHeader = logEntry.querySelector('.dev-log-entry-header');
      if (logHeader) {
        logHeader.insertAdjacentHTML('beforeend', `
          <span class="dev-log-status ${statusClass}">${log.status}</span>
        `);
      }
      
      // Добавляем длительность запроса
      const logActions = logEntry.querySelector('.dev-log-button').parentNode;
      if (logActions) {
        logActions.insertAdjacentHTML('beforeend', `
          <span style="margin-left: 10px; color: #aaa;">Длительность: ${log.duration} мс</span>
        `);
      }
      
      // Добавляем информацию об ответе
      if (logDetails) {
        logDetails.insertAdjacentHTML('beforeend', `
          <div style="margin-top: 10px; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 5px;">
            <div><span class="dev-log-label">Статус:</span> ${log.status} ${log.statusText}</div>
            <div><span class="dev-log-label">Заголовки ответа:</span> ${this.formatJson(log.headers)}</div>
            <div><span class="dev-log-label">Тело ответа:</span> ${this.formatResponseBody(log.body)}</div>
          </div>
        `);
      }
    } else if (log.type === 'error') {
      const logHeader = logEntry.querySelector('.dev-log-entry-header');
      if (logHeader) {
        logHeader.insertAdjacentHTML('beforeend', `
          <span class="dev-log-status error">ERROR</span>
        `);
      }
      
      // Добавляем длительность запроса
      const logActions = logEntry.querySelector('.dev-log-button').parentNode;
      if (logActions) {
        logActions.insertAdjacentHTML('beforeend', `
          <span style="margin-left: 10px; color: #aaa;">Длительность: ${log.duration} мс</span>
        `);
      }
      
      // Добавляем информацию об ошибке
      if (logDetails) {
        logDetails.insertAdjacentHTML('beforeend', `
          <div style="margin-top: 10px; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 5px;">
            <div><span class="dev-log-label">Ошибка:</span> <span style="color: #e06c75;">${log.error}</span></div>
            ${log.stack ? `<div><span class="dev-log-label">Стек:</span> <pre style="margin: 5px 0; white-space: pre-wrap;">${log.stack}</pre></div>` : ''}
          </div>
        `);
      }
    }
  }
  
  /**
   * Переключение отображения деталей лога
   */
  toggleLogDetails(logId) {
    const logDetails = document.getElementById(`dev-log-details-${logId}`);
    
    if (logDetails) {
      logDetails.classList.toggle('visible');
    }
  }
  
  /**
   * Форматирование JSON для отображения
   */
  formatJson(obj) {
    try {
      if (!obj) return 'null';
      
      // Преобразуем объект в строку JSON с отступами
      const jsonString = JSON.stringify(obj, null, 2);
      
      // Подсветка синтаксиса JSON (простая реализация)
      return `<pre style="margin: 5px 0;">${this.highlightJson(jsonString)}</pre>`;
    } catch (error) {
      return String(obj);
    }
  }
  
  /**
   * Подсветка синтаксиса JSON
   */
  highlightJson(jsonString) {
    // Простая подсветка синтаксиса
    return jsonString
      .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
        let cls = 'number';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'key';
            match = match.replace(/"/, '<span style="color: #d19a66;">').replace(/":\s*$/, '</span>:');
            return match;
          } else {
            cls = 'string';
            return `<span style="color: #98c379;">${match}</span>`;
          }
        } else if (/true|false/.test(match)) {
          cls = 'boolean';
          return `<span style="color: #56b6c2;">${match}</span>`;
        } else if (/null/.test(match)) {
          cls = 'null';
          return `<span style="color: #56b6c2;">${match}</span>`;
        } else {
          return `<span style="color: #d19a66;">${match}</span>`;
        }
      });
  }
  
  /**
   * Форматирование тела запроса
   */
  formatRequestBody(body) {
    if (!body) return 'null';
    
    if (typeof body === 'string') {
      try {
        // Пробуем распарсить как JSON
        const json = JSON.parse(body);
        return this.formatJson(json);
      } catch (e) {
        // Если не JSON, возвращаем как строку
        return `<pre style="margin: 5px 0; white-space: pre-wrap;">${body}</pre>`;
      }
    } else if (body instanceof FormData) {
      const entries = Array.from(body.entries());
      if (entries.length === 0) return 'FormData (пусто)';
      
      const formDataObj = {};
      entries.forEach(([key, value]) => {
        formDataObj[key] = value instanceof File ? `File: ${value.name} (${value.type}, ${value.size} bytes)` : value;
      });
      
      return this.formatJson(formDataObj);
    } else if (body instanceof Blob) {
      return `Blob (${body.type}, ${body.size} bytes)`;
    } else {
      // Для других типов данных
      return this.formatJson(body);
    }
  }
  
  /**
   * Форматирование тела ответа
   */
  formatResponseBody(body) {
    if (!body) return 'null';
    
    try {
      // Пробуем распарсить как JSON
      const json = JSON.parse(body);
      return this.formatJson(json);
    } catch (e) {
      // Если тело ответа большое, обрезаем его
      if (body.length > 5000) {
        return `<pre style="margin: 5px 0; white-space: pre-wrap;">${body.substring(0, 5000)}...</pre>
                <button class="dev-log-button" onclick="navigator.clipboard.writeText(\`${body.replace(/`/g, '\\`')}\`).then(() => alert('Скопировано в буфер обмена!'))">Скопировать полностью</button>`;
      }
      
      // Если не JSON, возвращаем как строку
      return `<pre style="margin: 5px 0; white-space: pre-wrap;">${body}</pre>`;
    }
  }
  
  /**
   * Добавление значков информации в административные формы
   */
  addInfoBadgesToAdminForms() {
    // Добавляем значки к полям вебхуков
    const webhookFields = [
      { 
        id: 'admin-export-webhook-url', 
        description: 'URL для экспорта данных. При сохранении курса данные будут отправлены на этот URL в формате JSON.'
      },
      { 
        id: 'admin-import-webhook-url', 
        description: 'URL для импорта данных. При импорте данные будут запрошены с этого URL.'
      },
      { 
        id: 'admin-get-webhooks-url', 
        description: 'URL для получения списка доступных вебхуков. Используется для автоматического заполнения полей экспорта и импорта.'
      },
      { 
        id: 'admin-content-webhook-url', 
        description: 'URL для получения контента урока. Система отправит GET-запрос на этот URL и отобразит полученный Markdown или HTML.'
      },
      { 
        id: 'admin-test-webhook-url', 
        description: 'URL для получения теста. Система отправит GET-запрос на этот URL и отобразит полученный тест.'
      }
    ];
    
    webhookFields.forEach(field => {
      const input = document.getElementById(field.id);
      if (input) {
        const label = input.previousElementSibling;
        if (label) {
          const infoBadge = document.createElement('span');
          infoBadge.className = 'dev-info-badge';
          infoBadge.textContent = 'i';
          infoBadge.setAttribute('data-tooltip', field.description);
          
          // Добавляем обработчик для отображения подсказки
          infoBadge.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showInfoTooltip(e.target, field.description);
          });
          
          label.appendChild(infoBadge);
        }
      }
    });
  }
  
  /**
   * Удаление значков информации из административных форм
   */
  removeInfoBadgesFromAdminForms() {
    document.querySelectorAll('.dev-info-badge').forEach(badge => {
      badge.remove();
    });
    
    document.querySelectorAll('.dev-info-tooltip').forEach(tooltip => {
      tooltip.remove();
    });
  }
  
  /**
   * Отображение всплывающей подсказки
   */
  showInfoTooltip(element, text) {
    // Удаляем существующие подсказки
    document.querySelectorAll('.dev-info-tooltip').forEach(tooltip => {
      tooltip.remove();
    });
    
    // Создаем новую подсказку
    const tooltip = document.createElement('div');
    tooltip.className = 'dev-info-tooltip';
    tooltip.textContent = text;
    tooltip.style.left = `${element.offsetLeft + element.offsetWidth + 5}px`;
    tooltip.style.top = `${element.offsetTop - 5}px`;
    
    // Добавляем подсказку в DOM
    document.body.appendChild(tooltip);
    
    // Настраиваем закрытие подсказки по клику за ее пределами
    document.addEventListener('click', function closeTooltip(e) {
      if (e.target !== tooltip && e.target !== element) {
        tooltip.remove();
        document.removeEventListener('click', closeTooltip);
      }
    });
    
    // Отображаем подсказку
    setTimeout(() => {
      tooltip.classList.add('visible');
    }, 10);
  }
  
  /**
   * Очистка логов
   */
  clearLogs() {
    this.logs = [];
    document.getElementById('dev-panel-logs').innerHTML = '';
  }
  
  /**
   * Обрезка строки до указанной длины
   */
  truncateString(str, maxLength) {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
  }
  
  /**
   * Синхронизация данных с облаком
   */
  async syncWithCloud() {
    // Получаем настройки вебхуков
    const webhookSettingsStr = localStorage.getItem('webhookSettings');
    if (!webhookSettingsStr) {
      this.logMessage('Ошибка синхронизации: настройки вебхуков не найдены в localStorage', 'error');
      return;
    }
    
    try {
      const webhookSettings = JSON.parse(webhookSettingsStr);
      
      // Проверяем URL для импорта
      if (webhookSettings.importUrl) {
        this.logMessage(`Выполняется синхронизация с облаком. URL импорта: ${webhookSettings.importUrl}`, 'info');
        
        try {
          // Получаем данные с вебхука
          const response = await fetch(webhookSettings.importUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            // Получаем Content-Type заголовок
            const contentType = response.headers.get('content-type') || '';
            this.logMessage(`Получен ответ с Content-Type: ${contentType}`, 'info');
            
            // Сначала пробуем получить текст, а потом уже решаем, как его обрабатывать
            const text = await response.text();
            this.logMessage(`Получены данные (${text.length} символов)`, 'info');
            
            let data;
            
            // Пробуем распарсить JSON
            try {
              data = JSON.parse(text);
              this.logMessage('Данные успешно распарсены как JSON', 'success');
            } catch (e) {
              this.logMessage(`Не удалось распарсить как JSON: ${e.message}`, 'warning');
              
              // Если это не JSON, возможно, это plain text представление JSON
              // Пытаемся распарсить данные из вида, где JSON содержится в поле "data"
              if (text.includes('"data"')) {
                try {
                  const regex = /"data"\s*:\s*"(.*?)"/s;
                  const match = text.match(regex);
                  
                  if (match && match[1]) {
                    let jsonString = match[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
                    
                    // Иногда кавычки могут быть экранированы несколько раз
                    while (jsonString.includes('\\')) {
                      jsonString = jsonString.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
                    }
                    
                    this.logMessage('Извлечен JSON из поля "data"', 'info');
                    data = { courses: JSON.parse(jsonString) };
                  }
                } catch (innerError) {
                  this.logMessage(`Не удалось распарсить данные из поля data: ${innerError.message}`, 'error');
                }
              }
            }
            
            // Если данные все еще не определены, пробуем искать JSON в тексте
            if (!data) {
              try {
                // Ищем любую JSON структуру в тексте
                const jsonRegex = /{[\s\S]*}/;
                const match = text.match(jsonRegex);
                
                if (match && match[0]) {
                  const possibleJson = match[0];
                  data = JSON.parse(possibleJson);
                  this.logMessage('Извлечен JSON из текста', 'info');
                }
              } catch (e) {
                this.logMessage(`Не удалось извлечь JSON из текста: ${e.message}`, 'error');
              }
            }
            
            // Если данные все еще не определены, сдаемся
            if (!data) {
              this.logMessage('Не удалось распарсить данные из ответа. Проверьте формат ответа сервера.', 'error');
              return;
            }
            
            // Проверяем наличие поля courses
            if (!data.courses) {
              // Может быть, сам data и есть courses
              if (typeof data === 'object' && Object.keys(data).length > 0) {
                // Проверяем, есть ли в объекте хотя бы один ключ с объектом, содержащим days/specialLessons
                const courseCandidate = Object.values(data).find(item => 
                  item && typeof item === 'object' && 
                  (item.days || item.specialLessons || item.title)
                );
                
                if (courseCandidate) {
                  this.logMessage('Используем полученный объект как courses', 'info');
                  data = { courses: data };
                }
              }
              
              // Если все еще нет courses, выбрасываем ошибку
              if (!data.courses) {
                this.logMessage('Полученные данные не содержат информацию о курсах', 'error');
                return;
              }
            }
            
            const courseCount = Object.keys(data.courses).length;
            this.logMessage(`Получены данные курсов (${courseCount} курсов)`, 'success');
            this.logMessage(`Идентификаторы курсов: ${Object.keys(data.courses).join(', ')}`, 'info');
            
            // Сохраняем копию текущих курсов для возможности отката
            const backupCourses = JSON.parse(JSON.stringify(window.courseManager.courses));
            
            try {
              // Применяем полученные данные
              window.courseManager.courses = data.courses;
              
              this.logMessage('Данные успешно импортированы и применены', 'success');
              
              // Обновляем интерфейс, если открыт список курсов
              if (window.adminInterface && window.adminInterface.loadCoursesList) {
                window.adminInterface.loadCoursesList();
              }
              
              // Сохраняем резервную копию в localStorage
              localStorage.setItem('coursesBackup', JSON.stringify(backupCourses));
              localStorage.setItem('coursesBackupTimestamp', new Date().toISOString());
              
              // Если настроен URL для экспорта, отправляем данные обратно
              if (webhookSettings.exportUrl) {
                this.logMessage(`Экспорт обновленных данных на ${webhookSettings.exportUrl}`, 'info');
                
                if (window.adminInterface && window.adminInterface.exportDataToWebhook) {
                  window.adminInterface.exportDataToWebhook(webhookSettings.exportUrl);
                }
              }
            } catch (e) {
              // В случае ошибки при применении данных, восстанавливаем бэкап
              window.courseManager.courses = backupCourses;
              this.logMessage(`Ошибка при применении импортированных данных: ${e.message}`, 'error');
              this.logMessage('Восстановлена предыдущая версия курсов', 'warning');
            }
          } else {
            this.logMessage(`Ошибка HTTP! Статус: ${response.status}`, 'error');
          }
        } catch (error) {
          this.logMessage(`Ошибка при синхронизации с облаком: ${error.message}`, 'error');
        }
      } else {
        this.logMessage('URL для импорта не найден в настройках вебхуков', 'error');
      }
    } catch (e) {
      this.logMessage(`Ошибка при обработке настроек вебхуков: ${e.message}`, 'error');
    }
  }
  
  /**
   * Логирование сообщения в панель разработчика
   */
  logMessage(message, type = 'info') {
    const logsContainer = document.getElementById('dev-panel-logs');
    if (!logsContainer) return;
    
    const timestamp = new Date().toLocaleTimeString();
    
    let typeClass;
    switch (type) {
      case 'success': typeClass = 'success'; break;
      case 'error': typeClass = 'error'; break;
      case 'warning': typeClass = 'warning'; break;
      default: typeClass = 'info';
    }
    
    const logEntry = document.createElement('div');
    logEntry.className = 'dev-log-entry';
    logEntry.innerHTML = `
      <div class="dev-log-entry-header">
        <span class="dev-log-message ${typeClass}">${message}</span>
        <span class="dev-log-timestamp">${timestamp}</span>
      </div>
    `;
    
    logsContainer.prepend(logEntry);
    console.log(`🔧 [DevMode] ${message}`);
  }
}

// Создаем глобальный экземпляр
const devMode = new DevMode();

// Инициализируем после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
  // Проверяем наличие Font Awesome
  if (!document.querySelector('link[href*="font-awesome"]')) {
    const fontAwesome = document.createElement('link');
    fontAwesome.rel = 'stylesheet';
    fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.1/css/all.min.css';
    document.head.appendChild(fontAwesome);
  }
  
  devMode.initialize();
});

// Экспортируем для использования в других модулях
window.devMode = devMode;
export default devMode;
