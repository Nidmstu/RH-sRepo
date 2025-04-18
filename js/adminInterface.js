/**
 * Административный интерфейс для управления курсами и материалами
 */
class AdminInterface {
  constructor() {
    this.isInitialized = false;
    this.container = null;
    this.currentEditing = {
      course: null,
      day: null,
      lesson: null,
      isNew: false
    };
  }

  /**
   * Инициализация административного интерфейса
   */
  async initialize() {
    if (this.isInitialized) return;

    console.log('Инициализация административного интерфейса...');

    // Для admin.html не создаем новый контейнер, используем существующую структуру
    if (window.location.pathname.includes('admin.html')) {
      this.container = document;

      // Заполняем содержимое блока редактирования урока
      const lessonEditor = document.getElementById('admin-lesson-editor');
      if (lessonEditor) {
        lessonEditor.innerHTML = `
          <div class="admin-section-header">
            <h2>Редактирование урока</h2>
            <div class="admin-section-actions">
              <button id="admin-save-lesson" class="admin-btn admin-btn-primary">Сохранить</button>
              <button id="admin-cancel-lesson" class="admin-btn">Отмена</button>
            </div>
          </div>

          <div class="admin-form">
            <div class="admin-form-row">
              <div class="admin-form-group">
                <label for="admin-lesson-id">ID урока:</label>
                <input type="text" id="admin-lesson-id" class="admin-input" placeholder="what-prompting-is">
              </div>
              <div class="admin-form-group">
                <label for="admin-lesson-title">Название урока:</label>
                <input type="text" id="admin-lesson-title" class="admin-input" placeholder="What prompting is">
              </div>
            </div>

            <div class="admin-section-divider"></div>

            <!-- Источник контента -->
            <div class="admin-accordion">
              <div class="admin-accordion-header">
                <h3>Источник контента</h3>
                <i class="fas fa-chevron-down"></i>
              </div>
              <div class="admin-accordion-content">
                <div class="admin-form-group">
                  <label for="admin-content-source-type">Тип источника:</label>
                  <select id="admin-content-source-type" class="admin-select">
                    <option value="webhook">Webhook (внешний API)</option>
                    <option value="local">Локальный (из файла fallbacks.json)</option>
                    <option value="markdown">Встроенный Markdown</option>
                  </select>
                </div>

                <!-- Поля для webhook -->
                <div id="admin-content-webhook-fields">
                  <div class="admin-form-group">
                    <label for="admin-content-webhook-url">URL webhook:</label>
                    <input type="text" id="admin-content-webhook-url" class="admin-input" placeholder="https://example.com/api/content">
                  </div>
                  <div class="admin-form-row">
                    <div class="admin-form-group">
                      <label for="admin-content-fallback-type">Тип резервного контента:</label>
                      <select id="admin-content-fallback-type" class="admin-select">
                        <option value="none">Нет</option>
                        <option value="local">Локальный</option>
                      </select>
                    </div>
                    <div class="admin-form-group" id="admin-content-fallback-id-group">
                      <label for="admin-content-fallback-id">ID резервного контента:</label>
                      <input type="text" id="admin-content-fallback-id" class="admin-input" placeholder="content-id">
                    </div>
                  </div>
                </div>

                <!-- Поля для локального контента -->
                <div id="admin-content-local-fields" class="hidden">
                  <div class="admin-form-group">
                    <label for="admin-content-local-id">ID в fallbacks.json:</label>
                    <input type="text" id="admin-content-local-id" class="admin-input" placeholder="what-prompting-is">
                  </div>
                </div>

                <!-- Поля для встроенного markdown -->
                <div id="admin-content-markdown-fields" class="hidden">
                  <div class="admin-form-group">
                    <label for="admin-content-markdown">Markdown контент:</label>
                    <textarea id="admin-content-markdown" class="admin-textarea" rows="10" placeholder="# Заголовок урока

Основной текст урока..."></textarea>
                  </div>
                </div>
              </div>
            </div>

            <!-- Источник теста -->
            <div class="admin-accordion">
              <div class="admin-accordion-header">
                <h3>Тест</h3>
                <i class="fas fa-chevron-down"></i>
              </div>
              <div class="admin-accordion-content">
                <div class="admin-form-group">
                  <label for="admin-test-source-type">Тип источника теста:</label>
                  <select id="admin-test-source-type" class="admin-select">
                    <option value="none">Нет</option>
                    <option value="webhook">Webhook (внешний API)</option>
                    <option value="markdown">Локальный Markdown-файл</option>
                  </select>
                </div>

                <!-- Поля для webhook -->
                <div id="admin-test-webhook-fields" class="hidden">
                  <div class="admin-form-group">
                    <label for="admin-test-webhook-url">URL webhook:</label>
                    <input type="text" id="admin-test-webhook-url" class="admin-input" placeholder="https://example.com/api/test">
                  </div>
                  <div class="admin-form-row">
                    <div class="admin-form-group">
                      <label for="admin-test-fallback-type">Тип резервного теста:</label>
                      <select id="admin-test-fallback-type" class="admin-select">
                        <option value="none">Нет</option>
                        <option value="markdown">Markdown-файл</option>
                      </select>
                    </div>
                    <div class="admin-form-group" id="admin-test-fallback-id-group" class="hidden">
                      <label for="admin-test-fallback-id">ID файла:</label>
                      <input type="text" id="admin-test-fallback-id" class="admin-input" placeholder="test-what-prompting-is">
                    </div>
                  </div>
                </div>

                <!-- Поля для markdown-файла -->
                <div id="admin-test-markdown-fields" class="hidden">
                  <div class="admin-form-group">
                    <label for="admin-test-markdown-id">ID тестового файла:</label>
                    <input type="text" id="admin-test-markdown-id" class="admin-input" placeholder="test-what-prompting-is">
                  </div>
                  <div class="admin-form-group">
                    <label for="admin-test-markdown">Содержимое теста:</label>
                    <textarea id="admin-test-markdown" class="admin-textarea" rows="10" placeholder="# Тест по теме

1. Вопрос один?
   - Ответ А
   - Ответ Б"></textarea>
                  </div>
                </div>
              </div>
            </div>

            <!-- Задание -->
            <div class="admin-accordion">
              <div class="admin-accordion-header">
                <h3>Практическое задание</h3>
                <i class="fas fa-chevron-down"></i>
              </div>
              <div class="admin-accordion-content">
                <div class="admin-form-group">
                  <label for="admin-task-source-type">Включить задание:</label>
                  <select id="admin-task-source-type" class="admin-select">
                    <option value="none">Нет</option>
                    <option value="markdown">Markdown</option>
                  </select>
                </div>

                <div id="admin-task-markdown-fields" class="hidden">
                  <div class="admin-form-group">
                    <label for="admin-task-markdown">Текст задания:</label>
                    <textarea id="admin-task-markdown" class="admin-textarea" rows="8" placeholder="# Задание

Создайте промпт, который..."></textarea>
                  </div>
                </div>
              </div>
            </div>

            <!-- Аудио -->
            <div class="admin-accordion">
              <div class="admin-accordion-header">
                <h3>Аудио</h3>
                <i class="fas fa-chevron-down"></i>
              </div>
              <div class="admin-accordion-content">
                <div class="admin-form-group">
                  <label for="admin-audio-source-type">Тип аудио:</label>
                  <select id="admin-audio-source-type" class="admin-select">
                    <option value="none">Нет</option>
                    <option value="soundcloud">SoundCloud</option>
                    <option value="embed">Произвольный HTML embed</option>
                  </select>
                </div>

                <div id="admin-audio-soundcloud-fields" class="hidden">
                  <div class="admin-form-group">
                    <label for="admin-audio-account-url">URL аккаунта SoundCloud:</label>
                    <input type="text" id="admin-audio-account-url" class="admin-input" placeholder="https://soundcloud.com/username">
                  </div>
                  <div class="admin-form-group">
                    <label for="admin-audio-track-url">URL трека:</label>
                    <input type="text" id="admin-audio-track-url" class="admin-input" placeholder="https://soundcloud.com/username/track-name">
                  </div>
                </div>
                
                <div id="admin-audio-embed-fields" class="hidden">
                  <div class="admin-form-group">
                    <label for="admin-audio-embed-code">HTML-код для встраивания:</label>
                    <textarea id="admin-audio-embed-code" class="admin-textarea" rows="6" placeholder="<iframe src='https://example.com/embed' ...></iframe>"></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      }
    } else {
      // Для встроенной панели администратора создаем контейнер
      this.container = document.createElement('div');
      this.container.id = 'admin-interface';
      this.container.className = 'admin-panel hidden';
      document.body.appendChild(this.container);

      // Добавляем базовую структуру HTML
      this.container.innerHTML = `
      <div class="admin-header">
        <h1>Управление курсами и материалами</h1>
        <div class="admin-header-actions">
          <button id="admin-toggle-fullscreen" class="admin-btn"><i class="fas fa-expand"></i></button>
          <button id="admin-close" class="admin-btn admin-btn-danger"><i class="fas fa-times"></i></button>
        </div>
      </div>

      <div class="admin-body">
        <div class="admin-sidebar">
          <div class="admin-sidebar-section">
            <h3>Курсы</h3>
            <div id="admin-courses-list" class="admin-list"></div>
            <button id="admin-add-course" class="admin-btn admin-btn-success admin-btn-block">
              <i class="fas fa-plus"></i> Добавить курс
            </button>
          </div>
        </div>

        <div class="admin-content">
          <!-- Начальный экран -->
          <div id="admin-welcome" class="admin-panel-section">
            <div class="admin-welcome-content">
              <h2>Добро пожаловать в панель управления</h2>
              <p>Выберите курс в боковом меню или создайте новый</p>
            </div>
          </div>

          <!-- Редактирование курса -->
          <div id="admin-course-editor" class="admin-panel-section hidden">
            <div class="admin-section-header">
              <h2>Редактирование курса: <span id="admin-course-title">Название курса</span></h2>
              <div class="admin-section-actions">
                <button id="admin-save-course" class="admin-btn admin-btn-primary">Сохранить</button>
                <button id="admin-export-course" class="admin-btn">Экспорт</button>
                <button id="admin-import-course" class="admin-btn">Импорт курса</button>
                <button id="admin-import-lessons" class="admin-btn">Импорт уроков</button>
              </div>
            </div>

            <div class="admin-course-form">
              <div class="admin-form-group">
                <label for="admin-course-id">ID курса:</label>
                <input type="text" id="admin-course-id" class="admin-input">
              </div>
              <div class="admin-form-group">
                <label for="admin-course-title-input">Название курса:</label>
                <input type="text" id="admin-course-title-input" class="admin-input">
              </div>
              <div class="admin-form-group">
                <label for="admin-course-redirect">URL перенаправления (опционально):</label>
                <input type="text" id="admin-course-redirect" class="admin-input" placeholder="Оставьте пустым, если перенаправление не требуется">
              </div>
              <div class="admin-form-group">
                <label for="admin-course-hidden">
                  <input type="checkbox" id="admin-course-hidden" style="width: auto; margin-right: 10px;">
                  Скрыть курс (курс будет виден только в админке)
                </label>
              </div>
            </div>

            <div class="admin-section-divider"></div>

            <div class="admin-tabs">
              <div class="admin-tab-header">
                <button class="admin-tab-btn active" data-tab="days">Дни обучения</button>
                <button class="admin-tab-btn" data-tab="special-lessons">Специальные уроки</button>
              </div>

              <div class="admin-tab-content">
                <!-- Дни обучения -->
                <div id="admin-tab-days" class="admin-tab-pane active">
                  <div class="admin-section-header">
                    <h3>Дни обучения</h3>
                    <button id="admin-add-day" class="admin-btn admin-btn-sm admin-btn-success">
                      <i class="fas fa-plus"></i> Добавить день
                    </button>
                  </div>
                  <div id="admin-days-list" class="admin-list"></div>
                </div>

                <!-- Специальные уроки -->
                <div id="admin-tab-special-lessons" class="admin-tab-pane">
                  <div class="admin-section-header">
                    <h3>Специальные уроки</h3>
                    <button id="admin-add-special-lesson" class="admin-btn admin-btn-sm admin-btn-success">
                      <i class="fas fa-plus"></i> Добавить урок
                    </button>
                  </div>
                  <div id="admin-special-lessons-list" class="admin-list"></div>
                </div>
              </div>
            </div>
            <div class="admin-section-header" style="margin-top: 20px;">
                <h3>Уроки без дня</h3>
                <p>Уроки, доступные без выбора дня обучения, например "Словарь"</p>
              </div>
              <button id="admin-add-vocabulary" class="admin-btn admin-btn-success" style="margin-bottom: 10px;">
                <i class="fas fa-plus"></i> Добавить словарь
              </button>
              <div id="admin-no-day-lessons-list" class="admin-list"></div>
          </div>

          <!-- Редактирование дня -->
          <div id="admin-day-editor" class="admin-panel-section hidden">
            <div class="admin-section-header">
              <h2>Редактирование дня</h2>
              <div class="admin-section-actions">
                <button id="admin-save-day" class="admin-btn admin-btn-primary">Сохранить</button>
                <button id="admin-cancel-day" class="admin-btn">Отмена</button>
              </div>
            </div>

            <div class="admin-form">
              <div class="admin-form-group">
                <label for="admin-day-id">ID дня:</label>
                <input type="number" id="admin-day-id" class="admin-input" min="1">
              </div>
              <div class="admin-form-group">
                <label for="admin-day-title">Название дня:</label>
                <input type="text" id="admin-day-title" class="admin-input" placeholder="День 1">
              </div>

              <div class="admin-section-divider"></div>

              <div class="admin-section-header">
                <h3>Уроки</h3>
                <button id="admin-add-lesson" class="admin-btn admin-btn-sm admin-btn-success">
                  <i class="fas fa-plus"></i> Добавить урок
                </button>
              </div>
              <div id="admin-lessons-list" class="admin-list"></div>
            </div>
          </div>

          <!-- Редактирование урока -->
          <div id="admin-lesson-editor" class="admin-panel-section hidden">
            <div class="admin-section-header">
              <h2>Редактирование урока</h2>
              <div class="admin-section-actions">
                <button id="admin-save-lesson" class="admin-btn admin-btn-primary">Сохранить</button>
                <button id="admin-cancel-lesson" class="admin-btn">Отмена</button>
              </div>
            </div>

            <div class="admin-form">
              <div class="admin-form-row">
                <div class="admin-form-group">
                  <label for="admin-lesson-id">ID урока:</label>
                  <input type="text" id="admin-lesson-id" class="admin-input" placeholder="what-prompting-is">
                </div>
                <div class="admin-form-group">
                  <label for="admin-lesson-title">Название урока:</label>
                  <input type="text" id="admin-lesson-title" class="admin-input" placeholder="What prompting is">
                </div>
              </div>

              <div class="admin-section-divider"></div>

              <!-- Источник контента -->
              <div class="admin-accordion">
                <div class="admin-accordion-header">
                  <h3>Источник контента</h3>
                  <i class="fas fa-chevron-down"></i>
                </div>
                <div class="admin-accordion-content">
                  <div class="admin-form-group">
                    <label for="admin-content-source-type">Тип источника:</label>
                    <select id="admin-content-source-type" class="admin-select">
                      <option value="webhook">Webhook (внешний API)</option>
                      <option value="local">Локальный (из файла fallbacks.json)</option>
                      <option value="markdown">Встроенный Markdown</option>
                    </select>
                  </div>

                  <!-- Поля для webhook -->
                  <div id="admin-content-webhook-fields">
                    <div class="admin-form-group">
                      <label for="admin-content-webhook-url">URL webhook:</label>
                      <input type="text" id="admin-content-webhook-url" class="admin-input" placeholder="https://example.com/api/content">
                    </div>
                    <div class="admin-form-row">
                      <div class="admin-form-group">
                        <label for="admin-content-fallback-type">Тип резервного контента:</label>
                        <select id="admin-content-fallback-type" class="admin-select">
                          <option value="none">Нет</option>
                          <option value="local">Локальный</option>
                        </select>
                      </div>
                      <div class="admin-form-group" id="admin-content-fallback-id-group">
                        <label for="admin-content-fallback-id">ID резервного контента:</label>
                        <input type="text" id="admin-content-fallback-id" class="admin-input" placeholder="content-id">
                      </div>
                    </div>
                  </div>

                  <!-- Поля для локального контента -->
                  <div id="admin-content-local-fields" class="hidden">
                    <div class="admin-form-group">
                      <label for="admin-content-local-id">ID в fallbacks.json:</label>
                      <input type="text" id="admin-content-local-id" class="admin-input" placeholder="what-prompting-is">
                    </div>
                  </div>

                  <!-- Поля для встроенного markdown -->
                  <div id="admin-content-markdown-fields" class="hidden">
                    <div class="admin-form-group">
                      <label for="admin-content-markdown">Markdown контент:</label>
                      <textarea id="admin-content-markdown" class="admin-textarea" rows="10" placeholder="# Заголовок урока

Основной текст урока..."></textarea>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Источник теста -->
              <div class="admin-accordion">
                <div class="admin-accordion-header">
                  <h3>Тест</h3>
                  <i class="fas fa-chevron-down"></i>
                </div>
                <div class="admin-accordion-content">
                  <div class="admin-form-group">
                    <label for="admin-test-source-type">Тип источника теста:</label>
                    <select id="admin-test-source-type" class="admin-select">
                      <option value="none">Нет</option>
                      <option value="webhook">Webhook (внешний API)</option>
                      <option value="markdown">Локальный Markdown-файл</option>
                    </select>
                  </div>

                  <!-- Поля для webhook -->
                  <div id="admin-test-webhook-fields" class="hidden">
                    <div class="admin-form-group">
                      <label for="admin-test-webhook-url">URL webhook:</label>
                      <input type="text" id="admin-test-webhook-url" class="admin-input" placeholder="https://example.com/api/test">
                    </div>
                    <div class="admin-form-row">
                      <div class="admin-form-group">
                        <label for="admin-test-fallback-type">Тип резервного теста:</label>
                        <select id="admin-test-fallback-type" class="admin-select">
                          <option value="none">Нет</option>
                          <option value="markdown">Markdown-файл</option>
                        </select>
                      </div>
                      <div class="admin-form-group" id="admin-test-fallback-id-group" class="hidden">
                        <label for="admin-test-fallback-id">ID файла:</label>
                        <input type="text" id="admin-test-fallback-id" class="admin-input" placeholder="test-what-prompting-is">
                      </div>
                    </div>
                  </div>

                  <!-- Поля для markdown-файла -->
                  <div id="admin-test-markdown-fields" class="hidden">
                    <div class="admin-form-group">
                      <label for="admin-test-markdown-id">ID тестового файла:</label>
                      <input type="text" id="admin-test-markdown-id" class="admin-input" placeholder="test-what-prompting-is">
                    </div>
                    <div class="admin-form-group">
                      <label for="admin-test-markdown">Содержимое теста:</label>
                      <textarea id="admin-test-markdown" class="admin-textarea" rows="10" placeholder="# Тест по теме

1. Вопрос один?
   - Ответ А
   - Ответ Б"></textarea>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Задание -->
              <div class="admin-accordion">
                <div class="admin-accordion-header">
                  <h3>Практическое задание</h3>
                  <i class="fas fa-chevron-down"></i>
                </div>
                <div class="admin-accordion-content">
                  <div class="admin-form-group">
                    <label for="admin-task-source-type">Включить задание:</label>
                    <select id="admin-task-source-type" class="admin-select">
                      <option value="none">Нет</option>
                      <option value="markdown">Markdown</option>
                    </select>
                  </div>

                  <div id="admin-task-markdown-fields" class="hidden">
                    <div class="admin-form-group">
                      <label for="admin-task-markdown">Текст задания:</label>
                      <textarea id="admin-task-markdown" class="admin-textarea" rows="8" placeholder="# Задание

Создайте промпт, который..."></textarea>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Аудио -->
              <div class="admin-accordion">
                <div class="admin-accordion-header">
                  <h3>Аудио</h3>
                  <i class="fas fa-chevron-down"></i>
                </div>
                <div class="admin-accordion-content">
                  <div class="admin-form-group">
                    <label for="admin-audio-source-type">Тип аудио:</label>
                    <select id="admin-audio-source-type" class="admin-select">
                      <option value="none">Нет</option>
                      <option value="soundcloud">SoundCloud</option>
                    </select>
                  </div>

                  <div id="admin-audio-soundcloud-fields" class="hidden">
                    <div class="admin-form-group">
                      <label for="admin-audio-account-url">URL аккаунта SoundCloud:</label>
                      <input type="text" id="admin-audio-account-url" class="admin-input" placeholder="https://soundcloud.com/username">
                    </div>
                    <div class="admin-form-group">
                      <label for="admin-audio-track-url">URL трека:</label>
                      <input type="text" id="admin-audio-track-url" class="admin-input" placeholder="https://soundcloud.com/username/track-name">
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

      // Добавляем стили для админ-панели
      this.addStyles();
    }
    
    // Подключаем обработчики событий
    this.setupEventListeners();

    this.isInitialized = true;
    console.log('Административный интерфейс инициализирован');
  }

  /**
   * Добавление стилей для административного интерфейса
   */
  addStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      /* Стили для скрытых курсов */
      .admin-list-item-hidden {
        opacity: 0.7;
        background-color: #f9f9f9;
      }
      
      .admin-hidden-badge {
        display: inline-block;
        background-color: #f0ad4e;
        color: white;
        font-size: 0.7em;
        padding: 2px 6px;
        border-radius: 10px;
        margin-left: 8px;
        vertical-align: middle;
      }
      /* Основные стили для админ-панели */
      .admin-panel {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: #f5f5f5;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: #333;
        overflow: auto;
      }

      .admin-panel.hidden {
        display: none;
      }

      /* Шапка админ-панели */
      .admin-header {
        background-color: #2c3e50;
        color: white;
        padding: 15px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      }

      .admin-header h1 {
        margin: 0;
        font-size: 1.5rem;
      }

      .admin-header-actions {
        display: flex;
        gap: 10px;
      }

      /* Основное содержимое */
      .admin-body {
        display: flex;
        flex-direction: row;
        overflow: auto;
      }

      /* Адаптивные стили для мобильных устройств */
      @media (max-width: 768px) {
        .admin-body {
          flex-direction: column;
        }

        .admin-sidebar, 
        .admin-main {
          width: 100% !important;
          max-width: 100% !important;
        }

        .admin-header h1 {
          font-size: 1.2rem;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          font-size: 16px; /* Предотвращает масштабирование на iOS */
        }

        .admin-panel button {
          width: 100%;
          margin: 5px 0;
        }

        #admin-courses-list {
          margin-bottom: 15px;
          width: 100%;
        }
      }

      .admin-body {
        height: calc(100% - 60px);
        overflow: hidden;
      }

      /* Боковая панель */
      .admin-sidebar {
        width: 280px;
        background-color: #fff;
        border-right: 1px solid #ddd;
        overflow-y: auto;
        padding: 15px;
      }

      .admin-sidebar-section {
        margin-bottom: 20px;
      }

      .admin-sidebar-section h3 {
        margin-top: 0;
        padding-bottom: 8px;
        border-bottom: 1px solid #eee;
      }

      /* Основной контент */
      .admin-content {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        background-color: #f9f9f9;
      }

      /* Секции панели */
      .admin-panel-section {
        background-color: #fff;
        border-radius: 5px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        padding: 20px;
        margin-bottom: 20px;
      }

      .admin-panel-section.hidden {
        display: none;
      }

      /* Заголовки секций */
      .admin-section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
      }

      .admin-section-header h2, 
      .admin-section-header h3 {
        margin: 0;
      }

      .admin-section-actions {
        display: flex;
        gap: 10px;
      }

      /* Разделители */
      .admin-section-divider {
        height: 1px;
        background-color: #eee;
        margin: 20px 0;
      }

      /* Кнопки */
      .admin-btn {
        padding: 8px 15px;
        background-color: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
        color: #333;
        transition: all 0.2s;
      }

      .admin-btn:hover {
        background-color: #e0e0e0;
      }

      .admin-btn-primary {
        background-color: #3498db;
        border-color: #2980b9;
        color: white;
      }

      .admin-btn-primary:hover {
        background-color: #2980b9;
      }

      .admin-btn-success {
        background-color: #2ecc71;
        border-color: #27ae60;
        color: white;
      }

      .admin-btn-success:hover {
        background-color: #27ae60;
      }

      .admin-btn-danger {
        background-color: #e74c3c;
        border-color: #c0392b;
        color: white;
      }

      .admin-btn-danger:hover {
        background-color: #c0392b;
      }

      .admin-btn-sm {
        padding: 4px 10px;
        font-size: 0.8rem;
      }

      .admin-btn-block {
        display: block;
        width: 100%;
        text-align: center;
        margin-top: 10px;
      }

      /* Формы */
      .admin-form {
        max-width: 100%;
      }

      .admin-form-group {
        margin-bottom: 15px;
        flex: 1;
      }

      .admin-form-row {
        display: flex;
        gap: 15px;
        margin-bottom: 15px;
      }

      .admin-form-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
      }

      .admin-input,
      .admin-select,
      .admin-textarea {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #ddd;border-radius: 4px;
        font-size: 0.9rem;
        font-family: inherit;
      }

      .admin-input:focus,
      .admin-select:focus,
      .admin-textarea:focus {
        border-color: #3498db;
        outline: none;
        box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
      }

      .admin-textarea {
        resize: vertical;
        min-height: 80px;
      }

      /* Списки */
      .admin-list {
        border: 1px solid #eee;
        border-radius: 4px;
        overflow: hidden;
      }

      .admin-list:empty::after {
        content: "Нет элементов";
        display: block;
        padding: 15px;
        text-align: center;
        color: #999;
        font-style: italic;
      }

      .admin-list-item {
        padding: 12px 15px;
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: #fff;
        transition: background-color 0.2s;
      }

      .admin-list-item:last-child {
        border-bottom: none;
      }

      .admin-list-item:hover {
        background-color: #f5f5f5;
      }

      .admin-list-item-info {
        flex: 1;
      }

      .admin-list-item-title {
        font-weight: 500;
        margin-bottom: 3px;
      }

      .admin-list-item-subtitle {
        font-size: 0.8rem;
        color: #777;
      }

      .admin-list-item-actions {
        display: flex;
        gap: 5px;
      }

      /* Аккордеон */
      .admin-accordion {
        border: 1px solid #eee;
        border-radius: 4px;
        margin-bottom: 15px;
        overflow: hidden;
      }

      .admin-accordion-header {
        padding: 12px 15px;
        background-color: #f5f5f5;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .admin-accordion-header h3 {
        margin: 0;
        font-size: 1rem;
      }

      .admin-accordion-content {
        padding: 15px;
        background-color: #fff;
        border-top: 1px solid #eee;
      }

      /* Вкладки */
      .admin-tabs {
        margin-top: 20px;
      }

      .admin-tab-header {
        display: flex;
        border-bottom: 1px solid #ddd;
        margin-bottom: 15px;
      }

      .admin-tab-btn {
        padding: 10px 15px;
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        cursor: pointer;
        margin-right: 10px;
        font-weight: 500;
      }

      .admin-tab-btn.active {
        border-bottom-color: #3498db;
        color: #3498db;
      }

      .admin-tab-pane {
        display: none;
      }

      .admin-tab-pane.active {
        display: block;
      }

      /* Экран приветствия */
      .admin-welcome-content {
        text-align: center;
        padding: 50px 0;
      }

      /* Вспомогательные классы */
      .hidden {
        display: none;
      }

      /* Мобильная навигация */
      .admin-mobile-nav-toggle {
        background-color: #3498db;
        color: white;
        border: none;
        width: 100%;
        padding: 12px;
        margin-bottom: 15px;
        text-align: center;
        font-weight: bold;
        cursor: pointer;
        border-radius: 4px;
        z-index: 100;
        position: sticky;
        top: 0;
      }

      /* Адаптивные стили для мобильных устройств */
      @media (max-width: 768px) {
        .admin-body {
          flex-direction: column;
        }

        .admin-sidebar,
        .admin-main {
          width: 100% !important;
          max-width: 100% !important;
        }

        .admin-header h1 {
          font-size: 1.2rem;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          font-size: 16px;
          /* Предотвращает масштабирование на iOS */
        }

        .admin-panel button {
          width: 100%;
          margin: 5px 0;
        }

        #admin-courses-list {
          margin-bottom: 15px;
          width: 100%;
        }
      }
    `;
    document.head.appendChild(styleElement);

    // Добавим Font Awesome для иконок
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const fontAwesome = document.createElement('link');
      fontAwesome.rel = 'stylesheet';
      fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.1/css/all.min.css';
      document.head.appendChild(fontAwesome);
    }
  }

  /**
   * Настройка обработчиков событий
   */
  setupEventListeners() {
    // Закрытие админ-панели (только для встроенной панели)
    const closeBtn = document.getElementById('admin-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hide();
      });
    }

    // Переключение полноэкранного режима (только для встроенной панели)
    const fullscreenBtn = document.getElementById('admin-toggle-fullscreen');
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        this.toggleFullscreen();
      });
    }

    // Добавление нового курса
    const addCourseBtn = document.getElementById('admin-add-course');
    if (addCourseBtn) {
      addCourseBtn.addEventListener('click', () => {
        this.createCourse();
      });
    }

    // Сохранение курса
    const saveCourseBtn = document.getElementById('admin-save-course');
    if (saveCourseBtn) {
      saveCourseBtn.addEventListener('click', () => {
        this.saveCourse();
      });
    }

    // Экспорт курса
    const exportCourseBtn = document.getElementById('admin-export-course');
    if (exportCourseBtn) {
      exportCourseBtn.addEventListener('click', () => {
        this.exportCourse();
      });
    }

    // Импорт курса
    const importCourseBtn = document.getElementById('admin-import-course');
    if (importCourseBtn) {
      importCourseBtn.addEventListener('click', () => {
        this.importCourse();
      });
    }
    
    // Импорт уроков
    const importLessonsBtn = document.getElementById('admin-import-lessons');
    if (importLessonsBtn) {
      importLessonsBtn.addEventListener('click', () => {
        this.importLessons();
      });
    }
    
    // Импорт JSON из текстового поля
    const importJsonModal = document.getElementById('import-json-modal');
    const closeImportJsonModalBtn = document.getElementById('close-import-json-modal');
    const cancelImportJsonBtn = document.getElementById('cancel-import-json');
    const importJsonBtn = document.getElementById('import-json-btn');
    
    // Добавляем обработчик для открытия модального окна импорта
    const openJsonImportBtn = document.createElement('button');
    openJsonImportBtn.innerHTML = '<i class="fas fa-code"></i> Импорт из JSON';
    openJsonImportBtn.className = 'admin-btn';
    openJsonImportBtn.style.marginLeft = '5px';
    
    if (importCourseBtn && importCourseBtn.parentNode) {
      importCourseBtn.parentNode.appendChild(openJsonImportBtn);
    }
    
    openJsonImportBtn.addEventListener('click', () => {
      if (importJsonModal) {
        importJsonModal.style.display = 'block';
      }
    });
    
    // Закрытие модального окна
    if (closeImportJsonModalBtn) {
      closeImportJsonModalBtn.addEventListener('click', () => {
        if (importJsonModal) {
          importJsonModal.style.display = 'none';
        }
      });
    }
    
    if (cancelImportJsonBtn) {
      cancelImportJsonBtn.addEventListener('click', () => {
        if (importJsonModal) {
          importJsonModal.style.display = 'none';
        }
      });
    }
    
    // Обработка импорта из JSON
    if (importJsonBtn) {
      importJsonBtn.addEventListener('click', () => {
        this.importJsonFromTextarea();
      });
    }
    
    // Обработчик для кнопки копирования шаблона JSON
    const copyJsonTemplateBtn = document.getElementById('copy-json-template');
    if (copyJsonTemplateBtn) {
      copyJsonTemplateBtn.addEventListener('click', () => {
        const templateElement = document.getElementById('json-template');
        if (templateElement) {
          try {
            // Используем современный API буфера обмена
            navigator.clipboard.writeText(templateElement.textContent)
              .then(() => {
                // Изменяем текст кнопки для обратной связи
                const originalText = copyJsonTemplateBtn.innerHTML;
                copyJsonTemplateBtn.innerHTML = '<i class="fas fa-check"></i> Скопировано';
                copyJsonTemplateBtn.style.backgroundColor = '#d4edda';
                copyJsonTemplateBtn.style.borderColor = '#c3e6cb';
                
                // Восстанавливаем исходный текст через 2 секунды
                setTimeout(() => {
                  copyJsonTemplateBtn.innerHTML = originalText;
                  copyJsonTemplateBtn.style.backgroundColor = '';
                  copyJsonTemplateBtn.style.borderColor = '';
                }, 2000);
              })
              .catch(err => {
                console.error('Не удалось скопировать текст: ', err);
                // Альтернативный способ копирования для старых браузеров
                this.fallbackCopyTextToClipboard(templateElement.textContent);
              });
          } catch (e) {
            console.error('Ошибка при копировании: ', e);
            // Альтернативный способ копирования для старых браузеров
            this.fallbackCopyTextToClipboard(templateElement.textContent);
          }
        }
      });
    }
    
    // Экспорт всех данных на вебхук
    const webhookExportBtn = document.getElementById('admin-webhook-export');
    if (webhookExportBtn) {
      webhookExportBtn.addEventListener('click', () => {
        const settingsStr = localStorage.getItem('webhookSettings');
        if (settingsStr) {
          try {
            const settings = JSON.parse(settingsStr);
            if (settings.exportUrl) {
              this.exportDataToWebhook(settings.exportUrl);
            } else {
              alert('URL для экспорта не настроен. Пожалуйста, настройте URL в разделе "Настройки вебхуков".');
            }
          } catch (e) {
            console.error('Error accessing webhook settings:', e);
            alert('Ошибка при доступе к настройкам вебхуков.');
          }
        } else {
          alert('Настройки вебхуков не найдены. Пожалуйста, настройте вебхуки в разделе "Настройки вебхуков".');
        }
      });
    }

    // Добавление нового дня
    const addDayBtn = document.getElementById('admin-add-day');
    if (addDayBtn) {
      addDayBtn.addEventListener('click', () => {
        this.createDay();
      });
    }

    // Сохранение дня
    const saveDayBtn = document.getElementById('admin-save-day');
    if (saveDayBtn) {
      saveDayBtn.addEventListener('click', () => {
        this.saveDay();
      });
    }

    // Отмена редактирования дня
    const cancelDayBtn = document.getElementById('admin-cancel-day');
    if (cancelDayBtn) {
      cancelDayBtn.addEventListener('click', () => {
        this.cancelDayEdit();
      });
    }

    // Добавление урока к дню
    const addLessonBtn = document.getElementById('admin-add-lesson');
    if (addLessonBtn) {
      addLessonBtn.addEventListener('click', () => {
        this.createLesson(false);
      });
    }

    // Добавление специального урока
    const addSpecialLessonBtn = document.getElementById('admin-add-special-lesson');
    if (addSpecialLessonBtn) {
      addSpecialLessonBtn.addEventListener('click', () => {
        this.createLesson(true);
      });
    }

    // Сохранение урока
    const saveLessonBtn = document.getElementById('admin-save-lesson');
    if (saveLessonBtn) {
      saveLessonBtn.addEventListener('click', () => {
        this.saveLesson();
      });
    }

    // Отмена редактирования урока
    const cancelLessonBtn = document.getElementById('admin-cancel-lesson');
    if (cancelLessonBtn) {
      cancelLessonBtn.addEventListener('click', () => {
        this.cancelLessonEdit();
      });
    }

    // Переключение вкладок - улучшенный обработчик
    const setupTabButtons = () => {
      const tabButtons = document.querySelectorAll('.admin-tab-btn');
      console.log(`Настройка обработчиков для ${tabButtons.length} кнопок вкладок`);
      
      if (tabButtons.length > 0) {
        tabButtons.forEach(tab => {
          // Удаляем старые обработчики, клонируя элемент
          const newTab = tab.cloneNode(true);
          tab.parentNode.replaceChild(newTab, tab);
          
          // Добавляем новый обработчик
          newTab.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const tabId = newTab.getAttribute('data-tab');
            console.log(`Клик по вкладке: ${tabId} (${newTab.textContent.trim()})`);
            
            if (!tabId) {
              console.error('Не удалось определить ID вкладки из клика');
              return;
            }
            
            // Вызываем функцию переключения вкладок
            this.switchTab(tabId);
          });
        });
      } else {
        console.error('Не найдены кнопки вкладок (.admin-tab-btn)');
      }
    };
    
    // Вызываем настройку кнопок вкладок
    setupTabButtons();
    
    // Добавляем обработчик для кнопки добавления словаря
    const addVocabularyBtn = document.getElementById('admin-add-vocabulary');
    if (addVocabularyBtn) {
      // Очищаем старые обработчики
      const newBtn = addVocabularyBtn.cloneNode(true);
      addVocabularyBtn.parentNode.replaceChild(newBtn, addVocabularyBtn);
      
      newBtn.addEventListener('click', () => {
        console.log('Клик по кнопке добавления словаря');
        this.createNoDayLesson();
      });
    }

    // Переключение типа источника контента
    const contentSourceType = document.getElementById('admin-content-source-type');
    if (contentSourceType) {
      contentSourceType.addEventListener('change', (e) => {
        this.toggleSourceFields('content', e.target.value);
      });
    }

    // Переключение типа источника теста
    const testSourceType = document.getElementById('admin-test-source-type');
    if (testSourceType) {
      testSourceType.addEventListener('change', (e) => {
        this.toggleSourceFields('test', e.target.value);
      });
    }

    // Переключение типа задания
    const taskSourceType = document.getElementById('admin-task-source-type');
    if (taskSourceType) {
      taskSourceType.addEventListener('change', (e) => {
        this.toggleSourceFields('task', e.target.value);
      });
    }

    // Переключение типа аудио
    const audioSourceType = document.getElementById('admin-audio-source-type');
    if (audioSourceType) {
      audioSourceType.addEventListener('change', (e) => {
        this.toggleSourceFields('audio', e.target.value);
      });
    }

    // Переключение резервного типа контента
    const contentFallbackType = document.getElementById('admin-content-fallback-type');
    if (contentFallbackType) {
      contentFallbackType.addEventListener('change', (e) => {
        const fallbackIdGroup = document.getElementById('admin-content-fallback-id-group');
        if (fallbackIdGroup) {
          if (e.target.value === 'none') {
            fallbackIdGroup.classList.add('hidden');
          } else {
            fallbackIdGroup.classList.remove('hidden');
          }
        }
      });
    }

    // Переключение резервного типа теста
    const testFallbackType = document.getElementById('admin-test-fallback-type');
    if (testFallbackType) {
      testFallbackType.addEventListener('change', (e) => {
        const fallbackIdGroup = document.getElementById('admin-test-fallback-id-group');
        if (fallbackIdGroup) {
          if (e.target.value === 'none') {
            fallbackIdGroup.classList.add('hidden');
          } else {
            fallbackIdGroup.classList.remove('hidden');
          }
        }
      });
    }

    // Аккордеоны
    const accordionHeaders = document.querySelectorAll('.admin-accordion-header');
    if (accordionHeaders && accordionHeaders.length > 0) {
      accordionHeaders.forEach(header => {
        header.addEventListener('click', function() {
          const content = this.nextElementSibling;
          if (content) {
            content.style.display = content.style.display === 'none' ? 'block' : 'none';
            const icon = this.querySelector('i');
            if (icon) {
              icon.classList.toggle('fa-chevron-down');
              icon.classList.toggle('fa-chevron-up');
            }
          }
        });
      });
    }

    // Добавляем обработчик для кнопки переключения боковой панели
    const toggleSidebarBtn = document.getElementById('toggle-sidebar');
    if (toggleSidebarBtn) {
      toggleSidebarBtn.addEventListener('click', () => {
        const sidebar = document.querySelector('.admin-sidebar');
        if (sidebar) {
          if (sidebar.style.display === 'none') {
            sidebar.style.display = 'block';
            toggleSidebarBtn.innerHTML = '<i class="fas fa-times"></i> Скрыть меню курсов';
          } else {
            sidebar.style.display = 'none';
            toggleSidebarBtn.innerHTML = '<i class="fas fa-bars"></i> Показать меню курсов';
          }
        }
      });
    }
    
    // Обработчики для кнопок настроек вебхуков
    const saveWebhooksBtn = document.getElementById('admin-save-webhooks');
    if (saveWebhooksBtn) {
      saveWebhooksBtn.addEventListener('click', () => {
        this.saveWebhookSettings();
      });
    }
    
    const testExportWebhookBtn = document.getElementById('admin-test-export-webhook');
    if (testExportWebhookBtn) {
      testExportWebhookBtn.addEventListener('click', () => {
        const exportWebhookUrl = document.getElementById('admin-export-webhook-url').value;
        if (exportWebhookUrl) {
          this.exportDataToWebhook(exportWebhookUrl);
        } else {
          this.showWebhookStatus('URL для экспорта не указан', 'error');
        }
      });
    }
    
    const testImportWebhookBtn = document.getElementById('admin-test-import-webhook');
    if (testImportWebhookBtn) {
      testImportWebhookBtn.addEventListener('click', () => {
        const importWebhookUrl = document.getElementById('admin-import-webhook-url').value;
        if (importWebhookUrl) {
          this.importDataFromWebhook(importWebhookUrl);
        } else {
          this.showWebhookStatus('URL для импорта не указан', 'error');
        }
      });
    }
    
    // Обработчик для кнопки получения вебхуков
    const getWebhooksBtn = document.getElementById('admin-get-webhooks');
    if (getWebhooksBtn) {
      getWebhooksBtn.addEventListener('click', () => {
        // Используем URL из поля ввода или запрашиваем его, если поле пустое
        let webhookUrl = document.getElementById('admin-get-webhooks-url').value;
        
        if (!webhookUrl) {
          webhookUrl = prompt('Введите URL для получения вебхуков:', 'https://auto.crm-s.com/webhook-test/GetOnboardingHooks');
          if (webhookUrl && document.getElementById('admin-get-webhooks-url')) {
            document.getElementById('admin-get-webhooks-url').value = webhookUrl;
          }
        }
        
        if (webhookUrl) {
          this.getWebhooksFromServer(webhookUrl);
        } else {
          this.showWebhookStatus('URL для получения вебхуков не указан', 'error');
        }
      });
    }
    
    // Обработчики для кнопок справки
    const helpButtons = document.querySelectorAll('.admin-help-btn');
    if (helpButtons && helpButtons.length > 0) {
      helpButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          const helpType = btn.getAttribute('data-help');
          if (helpType) {
            const modalId = `help-modal-${helpType}`;
            const modal = document.getElementById(modalId);
            
            if (modal) {
              modal.style.display = 'block';
              
              // Обработчик закрытия модального окна по клику на крестик
              const closeBtn = modal.querySelector('.admin-help-modal-close');
              if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                  modal.style.display = 'none';
                });
              }
              
              // Закрытие по клику вне содержимого
              modal.addEventListener('click', (event) => {
                if (event.target === modal) {
                  modal.style.display = 'none';
                }
              });
            }
          }
        });
      });
    }
    
    // Обработчики закрытия для всех модальных окон справки
    const helpModals = document.querySelectorAll('.admin-help-modal');
    if (helpModals && helpModals.length > 0) {
      helpModals.forEach(modal => {
        const closeBtn = modal.querySelector('.admin-help-modal-close');
        if (closeBtn) {
          closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
          });
        }
        
        modal.addEventListener('click', (event) => {
          if (event.target === modal) {
            modal.style.display = 'none';
          }
        });
      });
    }
  }

  /**
   * Переключение полей в зависимости от типа источника
   */
  toggleSourceFields(prefix, type) {
    // Скрываем все поля для данного префикса
    document.querySelectorAll(`[id^="admin-${prefix}-"][id$="-fields"]`).forEach(el => {
      el.classList.add('hidden');
    });

    // Показываем нужные поля
    if (type !== 'none') {
      const fieldsEl = document.getElementById(`admin-${prefix}-${type}-fields`);
      if (fieldsEl) {
        fieldsEl.classList.remove('hidden');
      }
    }

    // На мобильных устройствах прокручиваем к выбранному разделу
    if (window.innerWidth <= 768) {
      const container = document.getElementById(`admin-${prefix}-${type}-fields`);
      if (container) {
        setTimeout(() => {
          container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }

  /**
   * Переключение между вкладками
   */
  switchTab(tabId) {
    console.log(`Переключение на вкладку: ${tabId}`);
    
    try {
      // Найдем все кнопки вкладок и панели
      const allTabButtons = document.querySelectorAll('.admin-tab-btn');
      const allTabPanes = document.querySelectorAll('.admin-tab-pane');
      
      console.log(`Найдено ${allTabButtons.length} кнопок вкладок и ${allTabPanes.length} панелей`);
      
      // Сначала деактивируем все кнопки и скрываем все панели
      allTabButtons.forEach(button => {
        button.classList.remove('active');
      });
      
      allTabPanes.forEach(pane => {
        pane.classList.add('hidden');
        pane.style.display = 'none';
      });
      
      // Теперь активируем нужную кнопку
      const activeButton = document.querySelector(`.admin-tab-btn[data-tab="${tabId}"]`);
      if (activeButton) {
        activeButton.classList.add('active');
        console.log(`Кнопка вкладки "${tabId}" активирована`);
      } else {
        console.error(`Кнопка вкладки с data-tab="${tabId}" не найдена`);
      }
      
      // И показываем соответствующую панель
      const activePane = document.getElementById(`admin-tab-${tabId}`);
      if (activePane) {
        activePane.classList.remove('hidden');
        activePane.style.display = 'block';
        console.log(`Панель "admin-tab-${tabId}" активирована`);
        
        // Если это вкладка специальных уроков, обновляем списки
        if (tabId === 'special-lessons') {
          console.log('Загружаем список специальных уроков и уроков без дня');
          setTimeout(() => {
            // Используем setTimeout, чтобы дать DOM обновиться
            this.loadSpecialLessonsList();
            this.loadNoDayLessonsList();
          }, 100);
          
          // Убедимся, что кнопка добавления словаря работает
          const addVocabularyBtn = document.getElementById('admin-add-vocabulary');
          if (addVocabularyBtn) {
            console.log('Настраиваем кнопку добавления словаря');
            // Удаляем старые обработчики
            const newBtn = addVocabularyBtn.cloneNode(true);
            addVocabularyBtn.parentNode.replaceChild(newBtn, addVocabularyBtn);
            
            // Добавляем новый обработчик
            newBtn.addEventListener('click', () => {
              console.log('Клик по кнопке добавления словаря');
              this.createNoDayLesson();
            });
          } else {
            console.error('Кнопка добавления словаря не найдена!');
          }
        }
      } else {
        console.error(`Панель вкладки с id="admin-tab-${tabId}" не найдена`);
        const availablePanes = Array.from(document.querySelectorAll('[id^="admin-tab-"]')).map(el => el.id);
        console.log('Доступные панели:', availablePanes);
      }
    } catch (error) {
      console.error('Ошибка при переключении вкладок:', error);
    }
  }

  /**
   * Показать админ-панель
   */
  show() {
    this.initialize().then(() => {
      // Если мы на странице admin.html, сразу загружаем список курсов
      if (window.location.pathname.includes('admin.html')) {
        this.loadCoursesList();
      } else {
        // Для встроенной панели, показываем контейнер
        this.container.classList.remove('hidden');
        this.loadCoursesList();
        
        // Убедимся, что кнопка управления интерфейсом видна
        setTimeout(() => {
          const toggleContainer = document.getElementById('ui-controls-container');
          if (toggleContainer) {
            toggleContainer.style.display = 'inline-block';
          } else if (window.adminPanel && typeof window.adminPanel.addUIToggleButton === 'function') {
            window.adminPanel.addUIToggleButton();
          }
        }, 200);
      }
    });
  }

  /**
   * Скрыть админ-панель
   */
  hide() {
    // Только для встроенной панели
    if (!window.location.pathname.includes('admin.html')) {
      this.container.classList.add('hidden');
    } else {
      // На странице admin.html кнопка закрытия ведет на главную страницу
      window.location.href = 'index.html';
    }
  }

  /**
   * Переключение полноэкранного режима
   */
  toggleFullscreen() {
    const icon = document.getElementById('admin-toggle-fullscreen').querySelector('i');
    if (icon.classList.contains('fa-expand')) {
      icon.classList.remove('fa-expand');
      icon.classList.add('fa-compress');
      // Дополнительная логика для полноэкранного режима
    } else {
      icon.classList.remove('fa-compress');
      icon.classList.add('fa-expand');
      // Дополнительная логика для выхода из полноэкранного режима
    }
  }

  /**
   * Загрузка списка курсов
   */
  loadCoursesList() {
    const coursesList = document.getElementById('admin-courses-list');
    if (!coursesList) {
      console.error('Элемент списка курсов не найден!');
      return;
    }
    coursesList.innerHTML = '';

    console.log('Загружаю список курсов...');
    console.log('Доступные профессии:', Object.keys(window.courseManager.courses || {}));

    // Убеждаемся, что courseManager и courses существуют
    if (!window.courseManager || !window.courseManager.courses) {
      console.error('CourseManager не инициализирован или отсутствуют данные о курсах');
      coursesList.innerHTML = '<div class="admin-list-empty">Ошибка загрузки курсов. Обновите страницу.</div>';
      return;
    }

    // В админке показываем все курсы, включая скрытые
    const professions = window.courseManager.getProfessions(true); 
    console.log('Полученные профессии:', professions);

    if (!professions || professions.length === 0) {
      console.log('Курсы не найдены в системе');
      coursesList.innerHTML = '<div class="admin-list-empty">Курсы не найдены. Добавьте новый курс.</div>';
      return;
    }

    // Создаем временный контейнер для собранных элементов
    const fragment = document.createDocumentFragment();

    professions.forEach(professionId => {
      console.log(`Обработка профессии: ${professionId}`);

      const course = window.courseManager.courses[professionId];
      if (!course) {
        console.error(`Курс не найден для ID: ${professionId}`);
        return;
      }

      const title = course.title || professionId;
      console.log(`Название курса: ${title}`);

      const courseItem = document.createElement('div');
      courseItem.className = 'admin-list-item';
      
      // Добавляем класс для скрытых курсов
      if (course.hidden) {
        courseItem.classList.add('admin-list-item-hidden');
      }
      
      courseItem.innerHTML = `
        <div class="admin-list-item-info">
          <div class="admin-list-item-title">
            ${title}
            ${course.hidden ? '<span class="admin-hidden-badge">Скрыт</span>' : ''}
          </div>
          <div class="admin-list-item-subtitle">${professionId}</div>
        </div>
        <div class="admin-list-item-actions">
          <button class="admin-btn admin-btn-sm edit-course" data-id="${professionId}">
            <i class="fas fa-edit"></i> Изменить
          </button>
          <button class="admin-btn admin-btn-sm admin-btn-danger delete-course" data-id="${professionId}">
            <i class="fas fa-trash"></i> Удалить
          </button>
        </div>
      `;

      // Добавляем усиленные прямые обработчики событий для кнопок
      const editButton = courseItem.querySelector('.edit-course');
      const deleteButton = courseItem.querySelector('.delete-course');

      if (editButton) {
        // Используем более надежные обработчики для мобильных устройств
        const clickHandler = function(e) {
          e.preventDefault();
          e.stopPropagation();
          console.log("Клик по кнопке Изменить для курса:", professionId);
          
          // Короткая задержка чтобы избежать проблем с двойными кликами на мобильных
          setTimeout(function() {
            adminInterface.editCourse(professionId);
          }, 50);
          
          // На мобильных устройствах скрываем боковую панель после выбора курса
          if (window.innerWidth <= 768) {
            const sidebar = document.querySelector('.admin-sidebar');
            const toggleBtn = document.getElementById('toggle-sidebar');

            if (sidebar && toggleBtn) {
              sidebar.style.display = 'none';
              toggleBtn.innerHTML = '<i class="fas fa-bars"></i> Показать меню курсов';
            }
          }
          return false;
        };
        
        // Назначаем обработчик на разные события для лучшей работы на мобильных
        editButton.onclick = clickHandler;
        editButton.addEventListener('click', clickHandler);
        editButton.addEventListener('touchstart', clickHandler);
        editButton.addEventListener('touchend', clickHandler);
        
        // Добавляем атрибуты для улучшения доступности на мобильных
        editButton.setAttribute('role', 'button');
        editButton.setAttribute('tabindex', '0');
      }

      if (deleteButton) {
        // Используем прямой onclick вместо addEventListener
        deleteButton.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log("Клик по кнопке Удалить для курса:", professionId);
          this.deleteCourse(professionId);
          return false;
        };
      }

      fragment.appendChild(courseItem);
    });

    // Добавляем все элементы сразу для лучшей производительности
    coursesList.appendChild(fragment);

    // Добавляем стили для пустого списка, если их еще нет
    if (!document.querySelector('style[data-for="admin-list-empty"]')) {
      const style = document.createElement('style');
      style.setAttribute('data-for', 'admin-list-empty');
      style.textContent = `
        .admin-list-empty {
          padding: 15px;
          text-align: center;
          color: #666;
          font-style: italic;
        }
      `;
      document.head.appendChild(style);
    }

    // Убеждаемся, что список курсов виден на мобильных устройствах
    coursesList.style.display = 'block';
  }

  /**
   * Редактирование курса
   */
  editCourse(professionId) {
    console.log(`Редактирование курса: ${professionId}`);

    if (!window.courseManager || !window.courseManager.courses) {
      console.error('CourseManager не инициализирован или отсутствуют данные о курсах');
      alert('Ошибка: не удалось получить данные курса. Пожалуйста, обновите страницу.');
      return;
    }

    const course = window.courseManager.courses[professionId];
    if (!course) {
      console.error(`Курс с ID ${professionId} не найден`);
      alert(`Ошибка: курс с ID "${professionId}" не найден`);
      return;
    }

    // Создаем копию объекта курса для предотвращения непреднамеренного изменения
    this.currentEditing.course = Object.assign({}, course);
    // Явно добавляем ID в объект курса для дальнейшего использования
    this.currentEditing.course.id = professionId;
    this.currentEditing.day = null;
    this.currentEditing.lesson = null;
    
    console.log('Текущий редактируемый курс:', this.currentEditing.course);

    try {
      // Заполняем форму курса
      const courseIdInput = document.getElementById('admin-course-id');
      if (!courseIdInput) {
        throw new Error('Элемент admin-course-id не найден');
      }
      
      courseIdInput.value = professionId;
      // Сохраняем оригинальный ID для отслеживания изменений
      courseIdInput.setAttribute('data-original-id', professionId);
      
      // Заполняем остальные поля формы
      const titleInput = document.getElementById('admin-course-title-input');
      if (titleInput) titleInput.value = course.title || '';
      
      const redirectInput = document.getElementById('admin-course-redirect');
      if (redirectInput) redirectInput.value = course.redirectUrl || '';
      
      const titleElement = document.getElementById('admin-course-title');
      if (titleElement) titleElement.textContent = course.title || professionId;
      
      // Устанавливаем статус скрытия курса
      const hiddenCheckbox = document.getElementById('admin-course-hidden');
      if (hiddenCheckbox) hiddenCheckbox.checked = course.hidden || false;

      // Загружаем дни и специальные уроки
      this.loadDaysList();
      this.loadSpecialLessonsList();
      this.loadNoDayLessonsList(); // Load lessons without day
      
      // Загружаем настройки вебхуков
      this.loadWebhookSettings();

      // Показываем редактор курса
      const welcomePanel = document.getElementById('admin-welcome');
      if (welcomePanel) welcomePanel.classList.add('hidden');
      
      const dayEditor = document.getElementById('admin-day-editor');
      if (dayEditor) dayEditor.classList.add('hidden');
      
      const lessonEditor = document.getElementById('admin-lesson-editor');
      if (lessonEditor) lessonEditor.classList.add('hidden');
      
      const courseEditor = document.getElementById('admin-course-editor');
      if (courseEditor) courseEditor.classList.remove('hidden');
      else console.error('Элемент admin-course-editor не найден');

      // Переключаемся на вкладку с днями
      this.switchTab('days');
      
      console.log('Курс успешно открыт для редактирования');
    } catch (error) {
      console.error('Ошибка при открытии курса для редактирования:', error);
      alert(`Ошибка при открытии курса для редактирования: ${error.message}`);
    }
  }

  /**
   * Создание нового курса
   */
  createCourse() {
    // Создаем шаблон нового курса
    const newCourse = {
      title: "Новый курс",
      days: [],
      specialLessons: [],
      noDayLessons: [] //Add lessons without day
    };

    // Запрашиваем ID курса
    const courseId = prompt("Введите ID нового курса (например, 'prompt-engineer'):");
    if (!courseId) return;

    // Проверяем, что курса с таким ID еще нет
    if (window.courseManager.courses[courseId]) {
      alert(`Курс с ID '${courseId}' уже существует!`);
      return;
    }

    // Добавляем новый курс
    window.courseManager.courses[courseId] = newCourse;

    // Обновляем список и переходим к редактированию
    this.loadCoursesList();
    this.editCourse(courseId);
  }

  /**
   * Удаление курса
   */
  deleteCourse(professionId) {
    if (!confirm(`Вы уверены, что хотите удалить курс '${professionId}'?`)) {
      return;
    }

    // Удаляем курс
    delete window.courseManager.courses[professionId];

    // Обновляем список
    this.loadCoursesList();

    // Если это был текущий редактируемый курс, возвращаемся к начальному экрану
    if (this.currentEditing.course && this.currentEditing.course.id === professionId) {
      this.currentEditing.course = null;
      document.getElementById('admin-course-editor').classList.add('hidden');
      document.getElementById('admin-welcome').classList.remove('hidden');
    }
  }

  /**
   * Сохранение изменений в курсе
   */
  saveCourse() {
    if (!this.currentEditing.course) return;

    const oldId = document.getElementById('admin-course-id').getAttribute('data-original-id') || document.getElementById('admin-course-id').value;
    const newId = document.getElementById('admin-course-id').value;
    const title = document.getElementById('admin-course-title-input').value;
    const redirectUrl = document.getElementById('admin-course-redirect').value;
    const isHidden = document.getElementById('admin-course-hidden').checked;

    // Обновляем данные курса
    this.currentEditing.course.title = title;
    
    // Обновляем статус скрытия курса
    if (isHidden) {
      this.currentEditing.course.hidden = true;
    } else if (this.currentEditing.course.hidden) {
      delete this.currentEditing.course.hidden;
    }

    if (redirectUrl) {
      this.currentEditing.course.redirectUrl = redirectUrl;
    } else if (this.currentEditing.course.redirectUrl) {
      delete this.currentEditing.course.redirectUrl;
    }

    // Если ID изменился, нужно создать новый курс и удалить старый
    if (oldId !== newId) {
      window.courseManager.courses[newId] = this.currentEditing.course;
      delete window.courseManager.courses[oldId];
      this.currentEditing.course = window.courseManager.courses[newId];
    }

    // Сохраняем изменения в JSON файл или отправляем на вебхук
    this.saveCoursesToJSON();

    // Обновляем список курсов и продолжаем редактирование
    this.loadCoursesList();
    this.editCourse(newId);

    alert('Курс успешно сохранен!');
  }

  /**
   * Экспорт курса в JSON файл
   */
  exportCourse() {
    if (!this.currentEditing.course) return;

    const courseId = document.getElementById('admin-course-id').value;
    const courseData = JSON.stringify(this.currentEditing.course, null, 2);

    // Создаем blob и ссылку для скачивания
    const blob = new Blob([courseData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${courseId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Импорт курса из JSON файла
   */
  importCourse() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const courseData = JSON.parse(event.target.result);

          // Запрашиваем ID для импортируемого курса
          const courseId = prompt("Введите ID для импортируемого курса:", "");
          if (!courseId) return;

          // Проверяем, существует ли уже курс с таким ID
          if (window.courseManager.courses[courseId] &&
              !confirm(`Курс с ID '${courseId}' уже существует. Заменить?`)) {
            return;
          }

          // Сохраняем курс
          window.courseManager.courses[courseId] = courseData;

          // Обновляем список курсов и открываем импортированный курс
          this.loadCoursesList();
          this.editCourse(courseId);

          // Сохраняем изменения в JSON файл
          this.saveCoursesToJSON();

          alert('Курс успешно импортирован!');
        } catch (err) {
          alert('Ошибка при импорте файла: ' + err.message);
        }
      };
      reader.readAsText(file);
    };

    input.click();
  }
  
  /**
   * Импорт уроков из JSON файла в текущий курс
   */
  importLessons() {
    if (!this.currentEditing.course) {
      alert('Сначала выберите курс для импорта уроков');
      return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          let importedData = JSON.parse(event.target.result);
          
          // Определим, что было импортировано: массив уроков или курс с уроками
          let lessons = [];
          
          // Если это массив, предполагаем что это уроки
          if (Array.isArray(importedData)) {
            lessons = importedData;
          }
          // Если это объект с полем lessons, извлекаем уроки оттуда
          else if (importedData.lessons && Array.isArray(importedData.lessons)) {
            lessons = importedData.lessons;
          }
          // Если это курс с днями
          else if (importedData.days && Array.isArray(importedData.days)) {
            const allDayLessons = [];
            importedData.days.forEach(day => {
              if (day.lessons && Array.isArray(day.lessons)) {
                allDayLessons.push(...day.lessons);
              }
            });
            lessons = allDayLessons;
          }
          // Если это уроки из определенного дня
          else if (importedData.lessons && Array.isArray(importedData.lessons)) {
            lessons = importedData.lessons;
          }
          
          if (lessons.length === 0) {
            alert('В импортированном файле не найдены уроки');
            return;
          }
          
          // Показываем модальное окно для выбора уроков
          this.showLessonsSelectionModal(lessons);
          
        } catch (err) {
          alert('Ошибка при импорте файла: ' + err.message);
        }
      };
      reader.readAsText(file);
    };

    input.click();
  }
  
  /**
   * Показать модальное окно для выбора уроков для импорта
   */
  showLessonsSelectionModal(lessons) {
    // Создаем модальное окно
    const modalId = 'import-lessons-modal';
    let modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'admin-modal';
    
    // Создаем содержимое модального окна
    modal.innerHTML = `
      <div class="admin-modal-content" style="width: 90%; max-width: 800px; max-height: 80vh;">
        <div class="admin-modal-header">
          <h3>Выберите уроки для импорта</h3>
          <span class="admin-modal-close">&times;</span>
        </div>
        <div class="admin-modal-body" style="overflow-y: auto; max-height: 60vh;">
          <p>Найдено ${lessons.length} уроков. Выберите уроки для импорта в текущий курс.</p>
          <p>
            <label>
              <input type="checkbox" id="select-all-lessons" checked> 
              Выбрать все
            </label>
            &nbsp;|&nbsp;
            <select id="import-destination">
              <option value="current-day">В текущий день</option>
              <option value="new-day">В новый день</option>
              <option value="special">В специальные уроки</option>
            </select>
          </p>
          <div class="admin-divider" style="height: 1px; background: #ddd; margin: 10px 0;"></div>
          <div id="lessons-list" style="margin-top: 15px;">
            ${lessons.map((lesson, index) => `
              <div class="lesson-item" style="padding: 8px; border-bottom: 1px solid #eee; display: flex; align-items: center;">
                <input type="checkbox" class="lesson-checkbox" data-index="${index}" checked>
                <div style="margin-left: 10px; flex: 1;">
                  <div><strong>${lesson.title || 'Без названия'}</strong></div>
                  <div style="font-size: 0.85em; color: #666;">ID: ${lesson.id || 'Нет ID'}</div>
                  ${lesson.contentSource ? `<div style="font-size: 0.85em; color: #666;">Источник: ${lesson.contentSource.type}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="admin-modal-footer" style="padding: 15px; border-top: 1px solid #ddd; text-align: right;">
          <button id="cancel-import" class="admin-btn">Отмена</button>
          <button id="import-selected-lessons" class="admin-btn admin-btn-primary" style="margin-left: 10px;">Импортировать выбранные</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Добавляем обработчики событий
    const closeBtn = modal.querySelector('.admin-modal-close');
    const cancelBtn = modal.querySelector('#cancel-import');
    const selectAllCheckbox = modal.querySelector('#select-all-lessons');
    const lessonCheckboxes = modal.querySelectorAll('.lesson-checkbox');
    const importBtn = modal.querySelector('#import-selected-lessons');
    
    // Закрытие модального окна
    const closeModal = () => {
      document.body.removeChild(modal);
    };
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    // Выбор всех уроков
    selectAllCheckbox.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      lessonCheckboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
      });
    });
    
    // Импорт выбранных уроков
    importBtn.addEventListener('click', () => {
      const selectedLessons = [];
      lessonCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
          const index = parseInt(checkbox.getAttribute('data-index'));
          if (!isNaN(index) && index >= 0 && index < lessons.length) {
            selectedLessons.push(lessons[index]);
          }
        }
      });
      
      if (selectedLessons.length === 0) {
        alert('Не выбрано ни одного урока для импорта');
        return;
      }
      
      // Определяем куда импортировать уроки
      const destination = document.getElementById('import-destination').value;
      
      // Импортируем уроки в выбранное место
      this.importSelectedLessons(selectedLessons, destination);
      
      // Закрываем модальное окно
      closeModal();
    });
  }
  
  /**
   * Импорт выбранных уроков в текущий курс
   */
  importSelectedLessons(lessons, destination) {
    if (!this.currentEditing.course) return;
    
    switch (destination) {
      case 'current-day':
        // Проверяем, выбран ли день
        if (!this.currentEditing.day) {
          // Если день не выбран, спрашиваем, создать ли новый день
          if (confirm('Текущий день не выбран. Создать новый день с импортированными уроками?')) {
            // Создаем новый день
            const maxId = this.currentEditing.course.days ? 
              this.currentEditing.course.days.reduce((max, day) => Math.max(max, day.id), 0) : 0;
            
            const newDay = {
              id: maxId + 1,
              title: `День ${maxId + 1}`,
              lessons: lessons
            };
            
            // Добавляем день в курс
            if (!this.currentEditing.course.days) {
              this.currentEditing.course.days = [];
            }
            
            this.currentEditing.course.days.push(newDay);
          } else {
            return; // Пользователь отменил импорт
          }
        } else {
          // Добавляем уроки в текущий день
          if (!this.currentEditing.day.lessons) {
            this.currentEditing.day.lessons = [];
          }
          
          this.currentEditing.day.lessons.push(...lessons);
        }
        break;
        
      case 'new-day':
        // Создаем новый день
        const maxId = this.currentEditing.course.days ? 
          this.currentEditing.course.days.reduce((max, day) => Math.max(max, day.id), 0) : 0;
        
        const dayTitle = prompt('Введите название нового дня:', `День ${maxId + 1}`);
        if (!dayTitle) return; // Пользователь отменил
        
        const newDay = {
          id: maxId + 1,
          title: dayTitle,
          lessons: lessons
        };
        
        // Добавляем день в курс
        if (!this.currentEditing.course.days) {
          this.currentEditing.course.days = [];
        }
        
        this.currentEditing.course.days.push(newDay);
        break;
        
      case 'special':
        // Добавляем уроки в специальные уроки
        if (!this.currentEditing.course.specialLessons) {
          this.currentEditing.course.specialLessons = [];
        }
        
        this.currentEditing.course.specialLessons.push(...lessons);
        break;
    }
    
    // Обновляем интерфейс
    this.loadDaysList();
    this.loadSpecialLessonsList();
    
    // Сохраняем изменения
    this.saveCoursesToJSON();
    
    // Уведомляем пользователя
    alert(`Успешно импортировано ${lessons.length} уроков`);
  }

  /**
   * Импорт курса из JSON в текстовом поле
   */
  importJsonFromTextarea() {
    const jsonTextarea = document.getElementById('json-import-content');
    const importJsonModal = document.getElementById('import-json-modal');
    const fragmentTypeSelect = document.getElementById('fragment-type-select');
    
    if (!jsonTextarea || !jsonTextarea.value.trim()) {
      alert('Пожалуйста, введите JSON данные для импорта');
      return;
    }
    
    try {
      // Парсим JSON из текстового поля
      const jsonData = JSON.parse(jsonTextarea.value);
      
      // Проверяем, что это объект
      if (typeof jsonData !== 'object' || jsonData === null || Array.isArray(jsonData)) {
        throw new Error('JSON должен быть объектом');
      }
      
      // Проверяем тип импорта (все данные или только конкретные фрагменты)
      const importType = fragmentTypeSelect ? fragmentTypeSelect.value : 'all';
      
      // Если тип импорта - только аудио, то обрабатываем особым образом
      if (importType === 'audio') {
        this.importAudioFromJson(jsonData);
        return;
      }
      
      // Проверяем, что в JSON есть хотя бы один курс
      const courseIds = Object.keys(jsonData);
      if (courseIds.length === 0) {
        throw new Error('JSON не содержит данных о курсах');
      }
      
      // Проверка структуры каждого курса
      let hasValidStructure = false;
      for (const courseId of courseIds) {
        const course = jsonData[courseId];
        if (typeof course === 'object' && 
            (course.title || course.days || course.specialLessons || course.noDayLessons || course.redirectUrl)) {
          hasValidStructure = true;
        }
      }
      
      if (!hasValidStructure) {
        throw new Error('Структура JSON не соответствует формату курсов');
      }
      
      // Проверка успешна, импортируем данные
      // Создаем резервную копию текущих курсов
      const backupCourses = JSON.parse(JSON.stringify(window.courseManager.courses || {}));
      
      // Спрашиваем пользователя о стратегии импорта
      const importStrategy = confirm(
        'Выберите стратегию импорта:\n' +
        'OK = Заменить все текущие курсы\n' +
        'Отмена = Объединить с текущими курсами'
      );
      
      if (importStrategy) {
        // Полная замена
        window.courseManager.courses = jsonData;
      } else {
        // Объединение с существующими курсами
        if (!window.courseManager.courses) {
          window.courseManager.courses = {};
        }
        
        // Объединяем курсы
        for (const courseId of courseIds) {
          window.courseManager.courses[courseId] = jsonData[courseId];
        }
      }
      
      // Закрываем модальное окно
      if (importJsonModal) {
        importJsonModal.style.display = 'none';
      }
      
      // Очищаем текстовое поле
      if (jsonTextarea) {
        jsonTextarea.value = '';
      }
      
      // Сохраняем изменения в локальное хранилище
      this.saveCoursesToJSON();
      
      // Обновляем интерфейс
      this.loadCoursesList();
      
      // Сообщаем пользователю об успешном импорте
      const courseCount = courseIds.length;
      alert(`Успешно импортировано ${courseCount} курсов`);
      
    } catch (error) {
      console.error('Ошибка при импорте JSON:', error);
      alert(`Ошибка при импорте JSON: ${error.message}`);
    }
  }
  
  /**
   * Импорт данных аудио из JSON
   */
  importAudioFromJson(jsonData) {
    try {
      if (!this.currentEditing.course) {
        alert('Сначала выберите курс для импорта аудио');
        return;
      }
      
      console.log('Импорт аудио из JSON:', jsonData);
      
      let importedCount = 0;
      
      // Проходим по всем курсам в JSON
      for (const courseId in jsonData) {
        const course = jsonData[courseId];
        
        // Проходим по всем дням
        if (course.days && Array.isArray(course.days)) {
          course.days.forEach(day => {
            if (day.lessons && Array.isArray(day.lessons)) {
              day.lessons.forEach(lesson => {
                if (lesson.id && lesson.audioSource) {
                  // Ищем соответствующий урок в текущем курсе
                  this.importAudioToLesson(lesson.id, lesson.audioSource);
                  importedCount++;
                }
              });
            }
          });
        }
        
        // Проходим по специальным урокам
        if (course.specialLessons && Array.isArray(course.specialLessons)) {
          course.specialLessons.forEach(lesson => {
            if (lesson.id && lesson.audioSource) {
              this.importAudioToLesson(lesson.id, lesson.audioSource, true);
              importedCount++;
            }
          });
        }
        
        // Проходим по урокам без дня
        if (course.noDayLessons && Array.isArray(course.noDayLessons)) {
          course.noDayLessons.forEach(lesson => {
            if (lesson.id && lesson.audioSource) {
              this.importAudioToLesson(lesson.id, lesson.audioSource, false, true);
              importedCount++;
            }
          });
        }
      }
      
      // Сохраняем изменения
      this.saveCoursesToJSON();
      
      // Обновляем интерфейс
      this.loadCoursesList();
      
      // Сообщаем о результате
      alert(`Успешно импортировано аудио для ${importedCount} уроков`);
      
      // Закрываем модальное окно
      const importJsonModal = document.getElementById('import-json-modal');
      if (importJsonModal) {
        importJsonModal.style.display = 'none';
      }
    } catch (error) {
      console.error('Ошибка при импорте аудио:', error);
      alert(`Ошибка при импорте аудио: ${error.message}`);
    }
  }
  
  /**
   * Импорт аудио в конкретный урок
   */
  importAudioToLesson(lessonId, audioSource, isSpecial = false, isNoDay = false) {
    let lessonFound = false;
    
    // Ищем урок в зависимости от его типа
    if (isSpecial && this.currentEditing.course.specialLessons) {
      // Ищем в специальных уроках
      const lessonIndex = this.currentEditing.course.specialLessons.findIndex(l => l.id === lessonId);
      if (lessonIndex !== -1) {
        this.currentEditing.course.specialLessons[lessonIndex].audioSource = audioSource;
        console.log(`Импортировано аудио для специального урока ${lessonId}:`, audioSource);
        lessonFound = true;
      }
    } else if (isNoDay && this.currentEditing.course.noDayLessons) {
      // Ищем в уроках без дня
      const lessonIndex = this.currentEditing.course.noDayLessons.findIndex(l => l.id === lessonId);
      if (lessonIndex !== -1) {
        this.currentEditing.course.noDayLessons[lessonIndex].audioSource = audioSource;
        console.log(`Импортировано аудио для урока без дня ${lessonId}:`, audioSource);
        lessonFound = true;
      }
    } else if (this.currentEditing.course.days) {
      // Ищем в обычных уроках
      for (const day of this.currentEditing.course.days) {
        if (day.lessons) {
          const lessonIndex = day.lessons.findIndex(l => l.id === lessonId);
          if (lessonIndex !== -1) {
            day.lessons[lessonIndex].audioSource = audioSource;
            console.log(`Импортировано аудио для урока ${lessonId} в дне ${day.id}:`, audioSource);
            lessonFound = true;
            break;
          }
        }
      }
    }
    
    if (!lessonFound) {
      console.warn(`Урок с ID ${lessonId} не найден в текущем курсе`);
    }
    
    return lessonFound;
  }
  
  /**
   * Импорт выбранных уроков в текущий курс
   */
  importSelectedLessons(lessons, destination) {
    if (!this.currentEditing.course) return;
    
    switch (destination) {
      case 'current-day':
        // Проверяем, выбран ли день
        if (!this.currentEditing.day) {
          // Если день не выбран, спрашиваем, создать ли новый день
          if (confirm('Текущий день не выбран. Создать новый день с импортированными уроками?')) {
            // Создаем новый день
            const maxId = this.currentEditing.course.days ? 
              this.currentEditing.course.days.reduce((max, day) => Math.max(max, day.id), 0) : 0;
            
            const newDay = {
              id: maxId + 1,
              title: `День ${maxId + 1}`,
              lessons: lessons
            };
            
            // Добавляем день в курс
            if (!this.currentEditing.course.days) {
              this.currentEditing.course.days = [];
            }
            
            this.currentEditing.course.days.push(newDay);
          } else {
            return; // Пользователь отменил импорт
          }
        } else {
          // Добавляем уроки в текущий день
          if (!this.currentEditing.day.lessons) {
            this.currentEditing.day.lessons = [];
          }
          
          this.currentEditing.day.lessons.push(...lessons);
        }
        break;
        
      case 'new-day':
        // Создаем новый день
        const maxId = this.currentEditing.course.days ? 
          this.currentEditing.course.days.reduce((max, day) => Math.max(max, day.id), 0) : 0;
        
        const dayTitle = prompt('Введите название нового дня:', `День ${maxId + 1}`);
        if (!dayTitle) return; // Пользователь отменил
        
        const newDay = {
          id: maxId + 1,
          title: dayTitle,
          lessons: lessons
        };
        
        // Добавляем день в курс
        if (!this.currentEditing.course.days) {
          this.currentEditing.course.days = [];
        }
        
        this.currentEditing.course.days.push(newDay);
        break;
        
      case 'special':
        // Добавляем уроки в специальные уроки
        if (!this.currentEditing.course.specialLessons) {
          this.currentEditing.course.specialLessons = [];
        }
        
        this.currentEditing.course.specialLessons.push(...lessons);
        break;
    }
    
    // Обновляем интерфейс
    this.loadDaysList();
    this.loadSpecialLessonsList();
    
    // Сохраняем изменения
    this.saveCoursesToJSON();
    
    // Уведомляем пользователя
    alert(`Успешно импортировано ${lessons.length} уроков`);
  }

  /**
   * Загрузка списка дней курса
   */
  loadDaysList() {
    const daysList = document.getElementById('admin-days-list');
    daysList.innerHTML = '';

    if (!this.currentEditing.course || !this.currentEditing.course.days) return;

    this.currentEditing.course.days.forEach((day, index) => {
      const dayItem = document.createElement('div');
      dayItem.className = 'admin-list-item';
      dayItem.innerHTML = `
        <div class="admin-list-item-info">
          <div class="admin-list-item-title">${day.title || `День ${day.id}`}</div>
          <div class="admin-list-item-subtitle">
            ID: ${day.id} | Уроков: ${day.lessons ? day.lessons.length : 0}
          </div>
        </div>
        <div class="admin-list-item-actions">
          <button class="admin-btn admin-btn-sm edit-day" data-index="${index}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="admin-btn admin-btn-sm admin-btn-danger delete-day" data-index="${index}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      daysList.appendChild(dayItem);

      // Обработчик редактирования
      dayItem.querySelector('.edit-day').addEventListener('click', () => {
        this.editDay(index);
      });

      // Обработчик удаления
      dayItem.querySelector('.delete-day').addEventListener('click', () => {
        this.deleteDay(index);
      });
    });
  }

  /**
   * Загрузка списка специальных уроков
   */
  loadSpecialLessonsList() {
    const specialLessonsList = document.getElementById('admin-special-lessons-list');
    specialLessonsList.innerHTML = '';

    if (!this.currentEditing.course) return;

    // Убедимся, что массив specialLessons существует
    if (!this.currentEditing.course.specialLessons) {
      this.currentEditing.course.specialLessons = [];
    }

    console.log('Специальные уроки:', this.currentEditing.course.specialLessons);

    if (this.currentEditing.course.specialLessons.length === 0) {
      specialLessonsList.innerHTML = '<div class="admin-list-empty">Нет специальных уроков. Добавьте новый специальный урок.</div>';
    }

    this.currentEditing.course.specialLessons.forEach((lesson, index) => {
      // Формируем информацию об источнике контента
      let contentSourceInfo = '';
      if (lesson.contentSource) {
        contentSourceInfo = `<div class="admin-list-item-source">Контент: ${lesson.contentSource.type}`;
        if (lesson.contentSource.type === 'webhook' && lesson.contentSource.url) {
          contentSourceInfo += ` (${lesson.contentSource.url.substring(0, 30)}${lesson.contentSource.url.length > 30 ? '...' : ''})`;
        } else if (lesson.contentSource.type === 'local' && lesson.contentSource.id) {
          contentSourceInfo += ` (ID: ${lesson.contentSource.id})`;
        }
        contentSourceInfo += '</div>';
      }

      // Формируем информацию об источнике теста
      let testSourceInfo = '';
      if (lesson.testSource) {
        testSourceInfo = `<div class="admin-list-item-source">Тест: ${lesson.testSource.type}`;
        if (lesson.testSource.type === 'webhook' && lesson.testSource.url) {
          testSourceInfo += ` (${lesson.testSource.url.substring(0, 30)}${lesson.testSource.url.length > 30 ? '...' : ''})`;
        }
        testSourceInfo += '</div>';
      }
      
      const lessonItem = document.createElement('div');
      lessonItem.className = 'admin-list-item';
      lessonItem.innerHTML = `
        <div class="admin-list-item-info">
          <div class="admin-list-item-title">${lesson.title || 'Без названия'}</div>
          <div class="admin-list-item-subtitle">ID: ${lesson.id || 'Без ID'}</div>
          ${contentSourceInfo}
          ${testSourceInfo}
        </div>
        <div class="admin-list-item-actions">
          <button class="admin-btn admin-btn-sm edit-special-lesson" data-index="${index}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="admin-btn admin-btn-sm admin-btn-danger delete-special-lesson" data-index="${index}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      specialLessonsList.appendChild(lessonItem);

      // Обработчик редактирования
      const editButton = lessonItem.querySelector('.edit-special-lesson');
      if (editButton) {
        editButton.addEventListener('click', () => {
          this.editSpecialLesson(index);
        });
      }

      // Обработчик удаления
      const deleteButton = lessonItem.querySelector('.delete-special-lesson');
      if (deleteButton) {
        deleteButton.addEventListener('click', () => {
          this.deleteSpecialLesson(index);
        });
      }
    });
  }

  /**
   * Создание нового дня
   */
  createDay() {
    if (!this.currentEditing.course) return;

    // Находим максимальный ID дня
    const maxId = this.currentEditing.course.days.reduce((max, day) =>
      Math.max(max, day.id), 0);

    // Создаем новый день
    const newDay = {
      id: maxId + 1,
      title: `День ${maxId + 1}`,
      lessons: []
    };

    // Добавляем день в курс
    this.currentEditing.course.days.push(newDay);

    // Обновляем список дней
    this.loadDaysList();

    // Открываем редактор нового дня
    this.editDay(this.currentEditing.course.days.length - 1);
  }

  /**
   * Редактирование дня
   */
  editDay(index) {
    if (!this.currentEditing.course || !this.currentEditing.course.days[index]) return;

    const day = this.currentEditing.course.days[index];
    this.currentEditing.day = day;
    this.currentEditing.dayIndex = index;
    this.currentEditing.lesson = null;

    // Заполняем форму дня
    document.getElementById('admin-day-id').value = day.id;
    document.getElementById('admin-day-title').value = day.title || `День ${day.id}`;

    // Загружаем уроки для этого дня
    this.loadLessonsList();

    // Показываем редактор дня
    document.getElementById('admin-welcome').classList.add('hidden');
    document.getElementById('admin-course-editor').classList.add('hidden');
    document.getElementById('admin-lesson-editor').classList.add('hidden');
    document.getElementById('admin-day-editor').classList.remove('hidden');
  }

  /**
   * Загрузка списка уроков для дня
   */
  loadLessonsList() {
    const lessonsList = document.getElementById('admin-lessons-list');
    lessonsList.innerHTML = '';

    if (!this.currentEditing.day || !this.currentEditing.day.lessons) return;

    this.currentEditing.day.lessons.forEach((lesson, index) => {
      // Формируем информацию об источнике контента
      let contentSourceInfo = '';
      if (lesson.contentSource) {
        contentSourceInfo = `<div class="admin-list-item-source">Контент: ${lesson.contentSource.type}`;
        if (lesson.contentSource.type === 'webhook' && lesson.contentSource.url) {
          contentSourceInfo += ` (${lesson.contentSource.url.substring(0, 30)}${lesson.contentSource.url.length > 30 ? '...' : ''})`;
        } else if (lesson.contentSource.type === 'local' && lesson.contentSource.id) {
          contentSourceInfo += ` (ID: ${lesson.contentSource.id})`;
        }
        contentSourceInfo += '</div>';
      }

      // Формируем информацию об источнике теста
      let testSourceInfo = '';
      if (lesson.testSource) {
        testSourceInfo = `<div class="admin-list-item-source">Тест: ${lesson.testSource.type}`;
        if (lesson.testSource.type === 'webhook' && lesson.testSource.url) {
          testSourceInfo += ` (${lesson.testSource.url.substring(0, 30)}${lesson.testSource.url.length > 30 ? '...' : ''})`;
        }
        testSourceInfo += '</div>';
      }

      const lessonItem = document.createElement('div');
      lessonItem.className = 'admin-list-item';
      lessonItem.innerHTML = `
        <div class="admin-list-item-info">
          <div class="admin-list-item-title">${lesson.title}</div>
          <div class="admin-list-item-subtitle">ID: ${lesson.id}</div>
          ${contentSourceInfo}
          ${testSourceInfo}
        </div>
        <div class="admin-list-item-actions">
          <button class="admin-btn admin-btn-sm edit-lesson" data-index="${index}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="admin-btn admin-btn-sm admin-btn-danger delete-lesson" data-index="${index}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      lessonsList.appendChild(lessonItem);

      // Обработчик редактирования
      lessonItem.querySelector('.edit-lesson').addEventListener('click', () => {
        this.editLesson(index, false);
      });

      // Обработчик удаления
      lessonItem.querySelector('.delete-lesson').addEventListener('click', () => {
        this.deleteLesson(index, false);
      });
    });
  }

  /**
   * Сохранение изменений в дне
   */
  saveDay() {
    if (!this.currentEditing.day) return;

    const id = parseInt(document.getElementById('admin-day-id').value);
    const title = document.getElementById('admin-day-title').value;

    // Обновляем данные дня
    this.currentEditing.day.id = id;
    this.currentEditing.day.title = title;

    // Сохраняем изменения в JSON файл или отправляем на вебхук
    this.saveCoursesToJSON();

    // Обновляем список дней
    this.loadDaysList();

    // Возвращаемся к редактору курса
    this.cancelDayEdit();

    alert('День успешно сохранен!');
  }

  /**
   * Отмена редактирования дня
   */
  cancelDayEdit() {
    this.currentEditing.day = null;
    document.getElementById('admin-day-editor').classList.add('hidden');
    document.getElementById('admin-course-editor').classList.remove('hidden');
  }

  /**
   * Удаление дня
   */
  deleteDay(index) {
    if (!this.currentEditing.course || !this.currentEditing.course.days[index]) return;

    const day = this.currentEditing.course.days[index];

    if (!confirm(`Вы уверены, что хотите удалить день "${day.title || `День ${day.id}`}"?`)) {
      return;
    }

    // Удаляем день
    this.currentEditing.course.days.splice(index, 1);

    // Обновляем список
    this.loadDaysList();

    // Сохраняем изменения в JSON файл
    this.saveCoursesToJSON();
  }

  /**
   * Создание нового урока
   */
  createLesson(isSpecial = false) {
    console.log(`Создание нового ${isSpecial ? 'специального' : 'обычного'} урока`);
    
    // Создаем шаблон нового урока
    const newLesson = {
      id: "",
      title: isSpecial ? "Новый специальный урок" : "Новый урок",
      contentSource: {
        type: "webhook",
        url: ""
      }
    };

    // Заполняем форму урока
    this.fillLessonForm(newLesson);

    // Настраиваем параметры редактирования
    this.currentEditing.lesson = newLesson;
    this.currentEditing.lessonIndex = -1;
    this.currentEditing.isSpecial = isSpecial;
    this.currentEditing.isNew = true;

    // Показываем редактор урока
    document.getElementById('admin-welcome').classList.add('hidden');
    document.getElementById('admin-course-editor').classList.add('hidden');
    document.getElementById('admin-day-editor').classList.add('hidden');
    document.getElementById('admin-lesson-editor').classList.remove('hidden');
  }

  /**
   * Редактирование обычного урока
   */
  editLesson(index, isSpecial = false) {
    let lesson;

    if (isSpecial) {
      if (!this.currentEditing.course || !this.currentEditing.course.specialLessons[index]) return;
      lesson = this.currentEditing.course.specialLessons[index];
    } else {
      if (!this.currentEditing.day || !this.currentEditing.day.lessons[index]) return;
      lesson = this.currentEditing.day.lessons[index];
    }

    // Заполняем форму урока
    this.fillLessonForm(lesson);

    // Настраиваем параметры редактирования
    this.currentEditing.lesson = lesson;
    this.currentEditing.lessonIndex = index;
    this.currentEditing.isSpecial = isSpecial;
    this.currentEditing.isNew = false;

    // Показываем редактор урока
    document.getElementById('admin-welcome').classList.add('hidden');
    document.getElementById('admin-course-editor').classList.add('hidden');
    document.getElementById('admin-day-editor').classList.add('hidden');
    document.getElementById('admin-lesson-editor').classList.remove('hidden');
  }

  /**
   * Редактирование специального урока
   */
  editSpecialLesson(index) {
    if (!this.currentEditing.course || !this.currentEditing.course.specialLessons[index]) return;
    
    const lesson = this.currentEditing.course.specialLessons[index];
    
    // Заполняем форму урока
    this.fillLessonForm(lesson);
    
    // Настраиваем параметры редактирования
    this.currentEditing.lesson = lesson;
    this.currentEditing.lessonIndex = index;
    this.currentEditing.isSpecial = true;
    this.currentEditing.isNew = false;
    
    // Показываем редактор урока
    document.getElementById('admin-welcome').classList.add('hidden');
    document.getElementById('admin-course-editor').classList.add('hidden');
    document.getElementById('admin-day-editor').classList.add('hidden');
    document.getElementById('admin-lesson-editor').classList.remove('hidden');
  }

  /**
   * Заполнение формы урока данными
   */
  fillLessonForm(lesson) {
    // Основные поля
    document.getElementById('admin-lesson-id').value = lesson.id || '';
    document.getElementById('admin-lesson-title').value = lesson.title || '';

    // Источник контента
    if (lesson.contentSource) {
      document.getElementById('admin-content-source-type').value = lesson.contentSource.type || 'webhook';
      this.toggleSourceFields('content', lesson.contentSource.type);

      if (lesson.contentSource.type === 'webhook') {
        document.getElementById('admin-content-webhook-url').value = lesson.contentSource.url || '';
        document.getElementById('admin-content-fallback-type').value = lesson.contentSource.fallbackType || 'none';
        document.getElementById('admin-content-fallback-id').value = lesson.contentSource.fallbackId || '';

        if (lesson.contentSource.fallbackType && lesson.contentSource.fallbackType !== 'none') {
          document.getElementById('admin-content-fallback-id-group').classList.remove('hidden');
        } else {
          document.getElementById('admin-content-fallback-id-group').classList.add('hidden');
        }
      } else if (lesson.contentSource.type === 'local') {
        document.getElementById('admin-content-local-id').value = lesson.contentSource.id || '';
      } else if (lesson.contentSource.type === 'markdown') {
        document.getElementById('admin-content-markdown').value = lesson.contentSource.content || '';
      }
    } else {
      document.getElementById('admin-content-source-type').value = 'webhook';
      this.toggleSourceFields('content', 'webhook');
    }

    // Источник теста
    if (lesson.testSource) {
      document.getElementById('admin-test-source-type').value = lesson.testSource.type || 'none';
      this.toggleSourceFields('test', lesson.testSource.type);

      if (lesson.testSource.type === 'webhook') {
        document.getElementById('admin-test-webhook-url').value = lesson.testSource.url || '';
        document.getElementById('admin-test-fallback-type').value = lesson.testSource.fallbackType || 'none';
        document.getElementById('admin-test-fallback-id').value = lesson.testSource.fallbackId || '';

        if (lesson.testSource.fallbackType && lesson.testSource.fallbackType !== 'none') {
          document.getElementById('admin-test-fallback-id-group').classList.remove('hidden');
        } else {
          document.getElementById('admin-test-fallback-id-group').classList.add('hidden');
        }
      } else if (lesson.testSource.type === 'markdown') {
        document.getElementById('admin-test-markdown-id').value = lesson.testSource.id || '';
        // Чтение содержимого теста из файла, если есть
        // Здесь нужна асинхронная загрузка содержимого файла
      }
    } else {
      document.getElementById('admin-test-source-type').value = 'none';
      this.toggleSourceFields('test', 'none');
    }

    // Задание
    if (lesson.taskSource) {
      document.getElementById('admin-task-source-type').value = lesson.taskSource.type || 'none';
      this.toggleSourceFields('task', lesson.taskSource.type);

      if (lesson.taskSource.type === 'markdown') {
        document.getElementById('admin-task-markdown').value = lesson.taskSource.content || '';
      }
    } else {
      document.getElementById('admin-task-source-type').value = 'none';
      this.toggleSourceFields('task', 'none');
    }

    // Аудио
    if (lesson.audioSource) {
      const audioType = lesson.audioSource.type || 'none';
      document.getElementById('admin-audio-source-type').value = audioType;
      this.toggleSourceFields('audio', audioType);

      if (audioType === 'soundcloud') {
        document.getElementById('admin-audio-account-url').value = lesson.audioSource.url || '';
        document.getElementById('admin-audio-track-url').value = lesson.audioSource.trackUrl || '';
      } else if (audioType === 'embed') {
        document.getElementById('admin-audio-embed-code').value = lesson.audioSource.embedCode || '';
      }
    } else {
      document.getElementById('admin-audio-source-type').value = 'none';
      this.toggleSourceFields('audio', 'none');
    }
  }

  /**
   * Сохранение изменений в уроке
   */
  saveLesson() {
    // Собираем данные из формы
    const lessonData = {
      id: document.getElementById('admin-lesson-id').value,
      title: document.getElementById('admin-lesson-title').value
    };

    // Валидация
    if (!lessonData.id) {
      alert('ID урока обязателен!');
      return;
    }

    if (!lessonData.title) {
      alert('Название урока обязательно!');
      return;
    }

    // Собираем данные об источнике контента
    const contentSourceType = document.getElementById('admin-content-source-type').value;
    if (contentSourceType !== 'none') {
      lessonData.contentSource = {
        type: contentSourceType
      };

      if (contentSourceType === 'webhook') {
        lessonData.contentSource.url = document.getElementById('admin-content-webhook-url').value;
        const fallbackType = document.getElementById('admin-content-fallback-type').value;
        if (fallbackType !== 'none') {
          lessonData.contentSource.fallbackType = fallbackType;
          lessonData.contentSource.fallbackId = document.getElementById('admin-content-fallback-id').value;
        }
      } else if (contentSourceType === 'local') {
        lessonData.contentSource.id = document.getElementById('admin-content-local-id').value;
      } else if (contentSourceType === 'markdown') {
        lessonData.contentSource.content = document.getElementById('admin-content-markdown').value;
      }
    }

    // Собираем данные об источнике теста
    const testSourceType = document.getElementById('admin-test-source-type').value;
    if (testSourceType !== 'none') {
      lessonData.testSource = {
        type: testSourceType
      };

      if (testSourceType === 'webhook') {
        lessonData.testSource.url = document.getElementById('admin-test-webhook-url').value;
        const fallbackType = document.getElementById('admin-test-fallback-type').value;
        if (fallbackType !== 'none') {
          lessonData.testSource.fallbackType = fallbackType;
          lessonData.testSource.fallbackId = document.getElementById('admin-test-fallback-id').value;
        }
      } else if (testSourceType === 'markdown') {
        lessonData.testSource.id = document.getElementById('admin-test-markdown-id').value;
        lessonData.testSource.content = document.getElementById('admin-test-markdown').value;
      }
    }

    // Собираем данные о задании
    const taskSourceType = document.getElementById('admin-task-source-type').value;
    if (taskSourceType !== 'none') {
      lessonData.taskSource = {
        type: taskSourceType
      };

      if (taskSourceType === 'markdown') {
        lessonData.taskSource.content = document.getElementById('admin-task-markdown').value;
      }
    }

    // Собираем данные об аудио
    const audioSourceType = document.getElementById('admin-audio-source-type').value;
    if (audioSourceType !== 'none') {
      lessonData.audioSource = {
        type: audioSourceType
      };

      if (audioSourceType === 'soundcloud') {
        lessonData.audioSource.url = document.getElementById('admin-audio-account-url').value;
        lessonData.audioSource.trackUrl = document.getElementById('admin-audio-track-url').value;
      } else if (audioSourceType === 'embed') {
        lessonData.audioSource.embedCode = document.getElementById('admin-audio-embed-code').value;
      }
    }

    // Определяем тип урока для сохранения
    const isNoDayLesson = this.currentEditing.isNoDayLesson || (!this.currentEditing.isSpecial && !this.currentEditing.day);

    // Сохраняем изменения в зависимости от типа урока
    if (isNoDayLesson) {
      // Убедимся, что массив уроков без дня существует
      if (!this.currentEditing.course.noDayLessons) {
        this.currentEditing.course.noDayLessons = [];
      }

      // Сохраняем урок без дня
      if (this.currentEditing.isNew) {
        // Новый урок
        this.currentEditing.course.noDayLessons.push(lessonData);
        console.log('Создан новый урок без дня:', lessonData);
      } else {
        // Обновляем существующий
        this.currentEditing.course.noDayLessons[this.currentEditing.lessonIndex] = lessonData;
        console.log('Обновлен урок без дня:', lessonData);
      }

      // Обновляем список
      this.loadNoDayLessonsList();
    } else if (this.currentEditing.isSpecial) {
      // Убедимся, что массив специальных уроков существует
      if (!this.currentEditing.course.specialLessons) {
        this.currentEditing.course.specialLessons = [];
      }

      // Сохраняем специальный урок
      if (this.currentEditing.isNew) {
        // Новый урок
        this.currentEditing.course.specialLessons.push(lessonData);
        console.log('Создан новый специальный урок:', lessonData);
      } else {
        // Обновляем существующий
        this.currentEditing.course.specialLessons[this.currentEditing.lessonIndex] = lessonData;
        console.log('Обновлен специальный урок:', lessonData);
      }

      // Обновляем список
      this.loadSpecialLessonsList();
    } else {
      // Сохраняем обычный урок
      if (this.currentEditing.isNew) {
        // Новый урок
        if (!this.currentEditing.day.lessons) {
          this.currentEditing.day.lessons = [];
        }
        this.currentEditing.day.lessons.push(lessonData);
        console.log('Создан новый урок:', lessonData);
      } else {
        // Обновляем существующий
        this.currentEditing.day.lessons[this.currentEditing.lessonIndex] = lessonData;
        console.log('Обновлен урок:', lessonData);
      }

      // Обновляем список
      this.loadLessonsList();
    }

    // Сбрасываем флаг типа урока
    this.currentEditing.isNoDayLesson = false;

    // Сохраняем изменения в JSON файл или отправляем на вебхук
    this.saveCoursesToJSON();

    // Возвращаемся к предыдущему экрану
    this.cancelLessonEdit();

    alert('Урок успешно сохранен!');
  }

  /**
   * Отмена редактирования урока
   */
  cancelLessonEdit() {
    // Определяем тип урока для корректного возврата к предыдущему экрану
    const isNoDayLesson = this.currentEditing.isNoDayLesson || (!this.currentEditing.isSpecial && !this.currentEditing.day);

    // Очищаем текущие данные редактирования
    this.currentEditing.lesson = null;
    this.currentEditing.isNoDayLesson = false;

    // Возвращаемся к соответствующему экрану в зависимости от типа урока
    if (isNoDayLesson || this.currentEditing.isSpecial) {
      document.getElementById('admin-lesson-editor').classList.add('hidden');
      document.getElementById('admin-course-editor').classList.remove('hidden');
      
      // Переключаемся на вкладку специальных уроков, если это был специальный или noDay урок
      if (this.currentEditing.isSpecial || isNoDayLesson) {
        this.switchTab('special-lessons');
      }
    } else {
      document.getElementById('admin-lesson-editor').classList.add('hidden');
      document.getElementById('admin-day-editor').classList.remove('hidden');
    }
    
    console.log('Редактирование урока отменено');
  }

  /**
   * Удаление урока
   */
  deleteLesson(index, isSpecial = false) {
    let lesson;

    if (isSpecial) {
      if (!this.currentEditing.course || !this.currentEditing.course.specialLessons[index]) return;
      lesson = this.currentEditing.course.specialLessons[index];

      if (!confirm(`Вы уверены, что хотите удалить специальный урок "${lesson.title}"?`)) {
        return;
      }

      // Удаляем урок
      this.currentEditing.course.specialLessons.splice(index, 1);

      // Обновляем список
      this.loadSpecialLessonsList();
    } else {
      if (!this.currentEditing.day || !this.currentEditing.day.lessons[index]) return;
      lesson = this.currentEditing.day.lessons[index];

      if (!confirm(`Вы уверены, что хотите удалить урок "${lesson.title}"?`)) {
        return;
      }

      // Удаляем урок
      this.currentEditing.day.lessons.splice(index, 1);

      // Обновляем список
      this.loadLessonsList();
    }

    // Сохраняем изменения в JSON файл
    this.saveCoursesToJSON();
  }

  /**
   * Удаление специального урока
   */
  deleteSpecialLesson(index) {
    this.deleteLesson(index, true);
  }

  /**
   * Сохранение курсов в JSON файл и синхронизация с облаком
   */
  saveCoursesToJSON() {
    // Сохраняем копию в localStorage для восстановления
    localStorage.setItem('coursesBackup', JSON.stringify(window.courseManager.courses));
    localStorage.setItem('coursesBackupTimestamp', new Date().toISOString());
    
    if (window.devMode && window.devMode.enabled) {
      console.log('🔧 [DevMode] Сохранена резервная копия курсов в localStorage');
    }
    
    // Проверяем, есть ли настроенный URL для экспорта
    const webhookSettings = this.getWebhookSettings();
    
    // Если настроен URL для экспорта, отправляем данные на вебхук
    if (webhookSettings && webhookSettings.exportUrl) {
      if (window.devMode && window.devMode.enabled) {
        console.log('🔧 [DevMode] Автоматическая синхронизация с облаком (экспорт)');
      }
      // Отправляем данные на вебхук и не показываем диалог скачивания
      this.exportDataToWebhook(webhookSettings.exportUrl);
      return;
    }
    
    // Если URL для экспорта не настроен, предлагаем скачать JSON файл
    const coursesData = JSON.stringify(window.courseManager.courses, null, 2);
    const blob = new Blob([coursesData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Показываем сообщение о необходимости сохранить файл
    const downloadPrompt = document.createElement('div');
    downloadPrompt.className = 'admin-download-prompt';
    downloadPrompt.innerHTML = `
      <div class="admin-download-dialog">
        <h3>Сохранение изменений</h3>
        <p>Скачайте обновленный файл courses.json и замените им существующий файл в вашем проекте.</p>
        <div class="admin-download-actions">
          <a href="${url}" download="courses.json" class="admin-btn admin-btn-primary">Скачать courses.json</a>
          <button class="admin-btn admin-cancel-download">Закрыть</button>
        </div>
      </div>
    `;
    document.body.appendChild(downloadPrompt);

    // Добавляем стили для диалога
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .admin-download-prompt {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 2000;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .admin-download-dialog {
        background-color: white;
        padding: 20px;
        border-radius: 5px;
        max-width: 500px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
      }

      .admin-download-actions {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-top: 20px;
      }
    `;
    document.head.appendChild(styleElement);

    // Обработчик для закрытия диалога
    downloadPrompt.querySelector('.admin-cancel-download').addEventListener('click', () => {
      document.body.removeChild(downloadPrompt);
      URL.revokeObjectURL(url);
    });

    // Обработчик для скачивания файла
    downloadPrompt.querySelector('a').addEventListener('click', () => {
      setTimeout(() => {
        document.body.removeChild(downloadPrompt);
        URL.revokeObjectURL(url);
      }, 1000);
    });
  }

  /**
   * Экспорт всех данных
   */
  exportAllData() {
    // Создаем zip-архив со всеми необходимыми файлами
    // Примечание: для реальной реализации потребуется библиотека JSZip
    const data = {
      courses: window.courseManager.courses,
      fallbacks: window.courseManager.fallbacks
    };

    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'course_data_export.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  /**
   * Сохранение настроек вебхуков
   */
  saveWebhookSettings() {
    const exportWebhookUrl = document.getElementById('admin-export-webhook-url').value;
    const importWebhookUrl = document.getElementById('admin-import-webhook-url').value;
    const getWebhooksUrl = document.getElementById('admin-get-webhooks-url').value;
    
    // Проверка корректности URL
    if (exportWebhookUrl && !this.isValidUrl(exportWebhookUrl)) {
      this.showWebhookStatus('Ошибка: Некорректный URL для экспорта', 'error');
      return;
    }
    
    if (importWebhookUrl && !this.isValidUrl(importWebhookUrl)) {
      this.showWebhookStatus('Ошибка: Некорректный URL для импорта', 'error');
      return;
    }
    
    // Сохраняем URL импорта в localStorage для использования в CourseManager
    localStorage.setItem('importWebhookUrl', importWebhookUrl);
    
    if (window.devMode && window.devMode.enabled) {
      console.log(`🔧 [DevMode] URL импорта сохранен в localStorage: ${importWebhookUrl}`);
    }
    
    if (getWebhooksUrl && !this.isValidUrl(getWebhooksUrl)) {
      this.showWebhookStatus('Ошибка: Некорректный URL для получения вебхуков', 'error');
      return;
    }
    
    // Сохраняем настройки в localStorage для дальнейшего использования
    const webhookSettings = {
      exportUrl: exportWebhookUrl,
      importUrl: importWebhookUrl,
      getWebhooksUrl: getWebhooksUrl,
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem('webhookSettings', JSON.stringify(webhookSettings));
    
    // Всегда отправляем настройки на фиксированный URL SaveWebhooks
    this.sendWebhookSettingsToURL('', webhookSettings);
  }
  
  /**
   * Отправка настроек вебхуков на указанный URL
   */
  sendWebhookSettingsToURL(webhookUrl, settings) {
    this.showWebhookStatus('Отправка настроек вебхуков...', 'info');
    
    // Используем фиксированный URL для сохранения настроек вебхуков
    const targetUrl = 'https://auto.crm-s.com/webhook/SaveWebhooks';
    console.log('СЕТЕВОЙ ЗАПРОС: Отправка данных на вебхук:', targetUrl);
    
    const data = {
      webhookSettings: settings,
      timestamp: new Date().toISOString(),
      source: window.location.hostname || 'onboarding-app',
      type: 'webhook_settings_update'
    };
    
    // Отправляем данные через XMLHttpRequest вместо fetch для большей совместимости
    const xhr = new XMLHttpRequest();
    xhr.open('POST', targetUrl, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept', 'application/json, text/plain, */*');
    
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        console.log('XHR статус:', xhr.status);
        console.log('XHR ответ:', xhr.responseText);
        
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log('Webhook settings response:', xhr.responseText);
          this.showWebhookStatus('Настройки вебхуков успешно отправлены', 'success');
        } else {
          console.error('Webhook settings error:', xhr.statusText);
          this.showWebhookStatus(`Ошибка при отправке настроек: ${xhr.statusText || 'Неизвестная ошибка'}`, 'error');
        }
      }
    };
    
    xhr.onerror = (e) => {
      console.error('XHR ошибка:', e);
      this.showWebhookStatus('Ошибка соединения с сервером', 'error');
    };
    
    xhr.timeout = 10000; // 10 секунд таймаут
    xhr.ontimeout = () => {
      this.showWebhookStatus('Истекло время ожидания ответа от сервера', 'error');
    };
    
    try {
      xhr.send(JSON.stringify(data));
    } catch (e) {
      console.error('Ошибка при отправке запроса:', e);
      this.showWebhookStatus(`Ошибка при отправке запроса: ${e.message}`, 'error');
    }
  }
  
  /**
   * Проверка валидности URL
   */
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Отображение статуса операций с вебхуками
   */
  showWebhookStatus(message, type = 'info') {
    const statusEl = document.getElementById('admin-webhook-status');
    if (!statusEl) {
      console.warn('Элемент для отображения статуса вебхука не найден');
      return;
    }
    
    let bgColor = '#e3f2fd'; // info
    if (type === 'success') bgColor = '#e8f5e9';
    if (type === 'error') bgColor = '#ffebee';
    
    const timestamp = new Date().toLocaleTimeString();
    
    // Сохраняем предыдущие сообщения
    const previousMessages = statusEl.innerHTML;
    
    // Добавляем новое сообщение в начало с указанием времени
    statusEl.innerHTML = `
      <div style="padding: 8px; margin-bottom: 8px; border-radius: 4px; background-color: ${bgColor};">
        <p style="margin: 0; font-weight: ${type === 'error' ? 'bold' : 'normal'}">
          <span style="color: #666; font-size: 0.8em;">[${timestamp}]</span> 
          ${message}
        </p>
      </div>
      ${previousMessages}
    `;
    
    // Логируем сообщение в консоль
    console.log(`СТАТУС ВЕБХУКА [${type}]: ${message}`);
    
    // Автоматически очищаем блок через 30 секунд, если накопилось слишком много сообщений
    if (statusEl.childElementCount > 10) {
      setTimeout(() => {
        while (statusEl.childElementCount > 5) {
          statusEl.removeChild(statusEl.lastChild);
        }
      }, 30000);
    }
  }
  
  /**
   * Экспорт данных на вебхук
   */
  exportDataToWebhook(webhookUrl) {
    this.showWebhookStatus('Отправка данных курсов на вебхук...', 'info');
    
    // Используем URL из настроек
    const targetUrl = webhookUrl;
    console.log('ЭКСПОРТ: Отправка данных на URL:', targetUrl);
    
    // Добавляем информацию для режима разработчика
    if (window.devMode && window.devMode.enabled) {
      console.log(`🔧 [DevMode] Экспорт данных курсов на URL: ${targetUrl}`);
    }
    
    // Создаем JSON строку курсов
    const coursesJsonString = JSON.stringify(window.courseManager.courses, null, 2);
    
    // Подготавливаем данные для отправки - курсы как текст внутри поля data
    const data = {
      data: coursesJsonString,
      timestamp: new Date().toISOString(),
      source: window.location.hostname || 'onboarding-app',
      type: 'full_courses_export'
    };
    
    // Используем только XMLHttpRequest для максимальной совместимости
    const xhr = new XMLHttpRequest();
    xhr.open('POST', targetUrl, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept', 'application/json, text/plain, */*');
    
    // Добавляем заголовок для идентификации запросов в режиме разработчика
    if (window.devMode && window.devMode.enabled) {
      xhr.setRequestHeader('X-DevMode', 'true');
    }
    
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        console.log('ЭКСПОРТ: XHR статус:', xhr.status);
        console.log('ЭКСПОРТ: XHR ответ:', xhr.responseText);
        
        if (xhr.status >= 200 && xhr.status < 300) {
          this.showWebhookStatus('Данные курсов успешно отправлены на вебхук', 'success');
          
          // Добавляем информацию для режима разработчика
          if (window.devMode && window.devMode.enabled) {
            console.log(`🔧 [DevMode] Экспорт данных успешно выполнен, получен ответ: ${xhr.responseText.substring(0, 100)}${xhr.responseText.length > 100 ? '...' : ''}`);
          }
        } else {
          this.showWebhookStatus(`Ошибка при отправке данных: ${xhr.statusText || 'Неизвестная ошибка'}`, 'error');
          
          // Добавляем информацию для режима разработчика
          if (window.devMode && window.devMode.enabled) {
            console.log(`🔧 [DevMode] Ошибка при экспорте данных: ${xhr.status} ${xhr.statusText}`);
          }
        }
      }
    };
    
    xhr.onerror = (e) => {
      console.error('ЭКСПОРТ: XHR ошибка:', e);
      this.showWebhookStatus('Ошибка соединения с сервером при экспорте данных', 'error');
      
      // Добавляем информацию для режима разработчика
      if (window.devMode && window.devMode.enabled) {
        console.log(`🔧 [DevMode] Ошибка соединения при экспорте данных:`, e);
      }
    };
    
    xhr.timeout = 15000; // 15 секунд таймаут
    xhr.ontimeout = () => {
      this.showWebhookStatus('Истекло время ожидания ответа от сервера при экспорте данных', 'error');
      
      // Добавляем информацию для режима разработчика
      if (window.devMode && window.devMode.enabled) {
        console.log(`🔧 [DevMode] Таймаут соединения (15 сек) при экспорте данных на URL: ${targetUrl}`);
      }
    };
    
    try {
      // Преобразовываем JSON и отправляем данные
      const jsonData = JSON.stringify(data);
      console.log('ЭКСПОРТ: Размер данных для отправки:', jsonData.length, 'байт');
      
      // Добавляем информацию для режима разработчика
      if (window.devMode && window.devMode.enabled) {
        console.log(`🔧 [DevMode] Отправка данных размером ${jsonData.length} байт на URL: ${targetUrl}`);
        console.log(`🔧 [DevMode] Формат данных: JSON с курсами как текст в поле 'data'`);
      }
      
      xhr.send(jsonData);
    } catch (e) {
      console.error('ЭКСПОРТ: Ошибка при отправке запроса:', e);
      this.showWebhookStatus(`Ошибка при отправке запроса: ${e.message}`, 'error');
      
      // Добавляем информацию для режима разработчика
      if (window.devMode && window.devMode.enabled) {
        console.log(`🔧 [DevMode] Исключение при отправке данных: ${e.message}`);
      }
    }
  }
  
  /**
   * Импорт данных с вебхука
   */
  importDataFromWebhook(webhookUrl) {
    if (!webhookUrl) {
      this.showWebhookStatus('URL для импорта не указан', 'error');
      return;
    }
    
    this.showWebhookStatus('Получение данных с вебхука...', 'info');
    
    // Сохраняем URL для использования при следующей загрузке приложения
    localStorage.setItem('importWebhookUrl', webhookUrl);
    localStorage.setItem('lastImportAttempt', new Date().toISOString());
    
    // Добавляем информацию для режима разработчика
    if (window.devMode && window.devMode.enabled) {
      console.log(`🔧 [DevMode] Импорт данных с URL: ${webhookUrl}`);
    }
    
    // Создаём заголовки запроса с информацией о режиме разработчика
    const headers = new Headers();
    if (window.devMode && window.devMode.enabled) {
      headers.append('X-DevMode', 'true');
    }
    headers.append('Accept', 'application/json, text/plain, */*');
    
    fetch(webhookUrl, { 
      method: 'GET',
      headers: headers,
      mode: 'cors',
      cache: 'no-store' // Всегда получаем свежие данные
    })
      .then(response => {
        // Добавляем информацию для режима разработчика
        if (window.devMode && window.devMode.enabled) {
          console.log(`🔧 [DevMode] Получен ответ с кодом: ${response.status} ${response.statusText}`);
          console.log(`🔧 [DevMode] Заголовки ответа:`, Object.fromEntries(response.headers.entries()));
        }
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        // Получаем Content-Type заголовок
        const contentType = response.headers.get('content-type') || '';
        
        // Сначала пробуем получить текст, а потом уже решаем, как его обрабатывать
        return response.text().then(text => {
          return { text, contentType };
        });
      })
      .then(({ text, contentType }) => {
        let data;
        
        // Пытаемся определить, что за данные мы получили
        if (window.devMode && window.devMode.enabled) {
          console.log(`🔧 [DevMode] Получены данные (${text.length} символов) с Content-Type: ${contentType}`);
          console.log(`🔧 [DevMode] Первые 100 символов:`, text.substring(0, 100));
        }
        
        // Пробуем распарсить JSON
        try {
          data = JSON.parse(text);
          if (window.devMode && window.devMode.enabled) {
            console.log(`🔧 [DevMode] Данные успешно распарсены как JSON`);
            console.log(`🔧 [DevMode] Структура данных:`, Object.keys(data));
          }
        } catch (e) {
          if (window.devMode && window.devMode.enabled) {
            console.log(`🔧 [DevMode] Не удалось распарсить как JSON: ${e.message}`);
          }
          
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
                
                if (window.devMode && window.devMode.enabled) {
                  console.log(`🔧 [DevMode] Извлечен JSON из поля "data"`, jsonString.substring(0, 100));
                }
                
                data = { courses: JSON.parse(jsonString) };
              }
            } catch (innerError) {
              if (window.devMode && window.devMode.enabled) {
                console.log(`🔧 [DevMode] Не удалось распарсить данные из поля data: ${innerError.message}`);
              }
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
              
              if (window.devMode && window.devMode.enabled) {
                console.log(`🔧 [DevMode] Извлечен JSON из текста`);
              }
            }
          } catch (e) {
            if (window.devMode && window.devMode.enabled) {
              console.log(`🔧 [DevMode] Не удалось извлечь JSON из текста: ${e.message}`);
            }
          }
        }
        
        // Если данные все еще не определены, сдаемся
        if (!data) {
          throw new Error('Не удалось распарсить данные из ответа. Проверьте формат ответа сервера.');
        }
        
        // УЛУЧШЕННАЯ ПРОВЕРКА СТРУКТУРЫ КУРСОВ
        let coursesData = null;
        
        // Вариант 1: Данные уже содержат поле courses
        if (data.courses) {
          coursesData = data.courses;
          if (window.devMode && window.devMode.enabled) {
            console.log(`🔧 [DevMode] Найдены данные курсов в поле 'courses'`);
          }
        } 
        // Вариант 2: Данные сами являются courses 
        else if (typeof data === 'object' && Object.keys(data).length > 0) {
          // Проверяем наличие структуры курсов (первый уровень должен содержать объекты с days/specialLessons)
          const hasCoursesStructure = Object.values(data).some(item => 
            item && typeof item === 'object' && 
            (item.days || item.specialLessons || item.title || item.redirectUrl)
          );
          
          if (hasCoursesStructure) {
            coursesData = data;
            if (window.devMode && window.devMode.enabled) {
              console.log(`🔧 [DevMode] Используем полученный объект как courses`);
            }
          } else if (window.devMode && window.devMode.enabled) {
            console.log(`🔧 [DevMode] Структура данных не соответствует формату курсов:`, 
              Object.keys(data).map(key => ({
                key, 
                type: typeof data[key], 
                hasValidProps: data[key] && typeof data[key] === 'object' ? 
                  Object.keys(data[key]) : 'not-object'
              }))
            );
          }
        }
        
        // Финальная проверка
        if (!coursesData) {
          throw new Error('Полученные данные не содержат информацию о курсах в ожидаемом формате');
        }
        
        // Создаем объект с курсами для обновления
        data = { courses: coursesData };
        
        // Добавляем информацию для режима разработчика
        if (window.devMode && window.devMode.enabled) {
          const courseCount = Object.keys(data.courses).length;
          console.log(`🔧 [DevMode] Получены данные курсов (${courseCount} курсов)`);
          console.log(`🔧 [DevMode] Идентификаторы курсов: ${Object.keys(data.courses).join(', ')}`);
        }
        
        // Сохраняем копию текущих курсов для возможности отката
        const backupCourses = JSON.parse(JSON.stringify(window.courseManager.courses));
        
        try {
          // Применяем полученные данные
          window.courseManager.courses = data.courses;
          
          // Обновляем интерфейс
          this.loadCoursesList();
          
          this.showWebhookStatus('Данные успешно импортированы', 'success');
          
          // Добавляем информацию для режима разработчика
          if (window.devMode && window.devMode.enabled) {
            console.log(`🔧 [DevMode] Данные успешно импортированы и применены`);
          }
          
          // Сохраняем резервную копию в localStorage
          localStorage.setItem('coursesBackup', JSON.stringify(backupCourses));
          localStorage.setItem('coursesBackupTimestamp', new Date().toISOString());
        } catch (e) {
          // В случае ошибки при применении данных, восстанавливаем бэкап
          window.courseManager.courses = backupCourses;
          
          // Добавляем информацию для режима разработчика
          if (window.devMode && window.devMode.enabled) {
            console.log(`🔧 [DevMode] Ошибка при применении импортированных данных: ${e.message}`);
            console.log(`🔧 [DevMode] Восстановлена предыдущая версия курсов`);
          }
          
          throw new Error(`Ошибка при применении данных: ${e.message}`);
        }
      })
      .catch(error => {
        console.error('Import error:', error);
        this.showWebhookStatus(`Ошибка при импорте данных: ${error.message}`, 'error');
        
        // Добавляем информацию для режима разработчика
        if (window.devMode && window.devMode.enabled) {
          console.log(`🔧 [DevMode] Ошибка импорта данных с ${webhookUrl}: ${error.message}`);
          if (error.stack) {
            console.log(`🔧 [DevMode] Стек ошибки: ${error.stack}`);
          }
        }
      });
  }
  
  /**
   * Получение вебхуков с сервера и отображение в модальном окне
   */
  getWebhooksFromServer(url) {
    if (!url) {
      this.showWebhookStatus('URL для получения вебхуков не указан', 'error');
      return;
    }
    
    // Сохраняем URL для получения вебхуков в настройках
    const webhookSettings = {
      exportUrl: document.getElementById('admin-export-webhook-url').value,
      importUrl: document.getElementById('admin-import-webhook-url').value,
      getWebhooksUrl: url,
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem('webhookSettings', JSON.stringify(webhookSettings));
    
    // Добавляем информацию для режима разработчика
    if (window.devMode && window.devMode.enabled) {
      console.log(`🔧 [DevMode] Получение вебхуков с URL: ${url}`);
      console.log(`🔧 [DevMode] Текущие настройки вебхуков:`, webhookSettings);
    }
    
    this.showWebhookStatus('Получение вебхуков с сервера...', 'info');
    
    // Создаем и показываем модальное окно с индикатором загрузки
    const modalId = 'webhooks-modal';
    let modal = document.getElementById(modalId);
    
    if (!modal) {
      modal = document.createElement('div');
      modal.id = modalId;
      modal.className = 'admin-modal';
      modal.innerHTML = `
        <div class="admin-modal-content">
          <div class="admin-modal-header">
            <h3>Получение вебхуков</h3>
            <span class="admin-modal-close">&times;</span>
          </div>
          <div class="admin-modal-body">
            <div class="spinner" style="margin: 20px auto; border: 6px solid #f3f3f3; border-top: 6px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 2s linear infinite;"></div>
            <p id="webhook-loading-message" style="text-align: center;">Загрузка данных с сервера...</p>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      
      // Добавляем стили для модального окна, если они еще не добавлены
      if (!document.querySelector('style[data-for="admin-modal"]')) {
        const style = document.createElement('style');
        style.setAttribute('data-for', 'admin-modal');
        style.textContent = `
          .admin-modal {
            display: block;
            position: fixed;
            z-index: 9999;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            overflow: auto;
          }
          
          .admin-modal-content {
            background-color: #fefefe;
            margin: 10% auto;
            padding: 0;
            border: 1px solid #888;
            border-radius: 5px;
            width: 80%;
            max-width: 700px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            max-height: 80vh;
            display: flex;
            flex-direction: column;
          }
          
          .admin-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            background-color: #f5f5f5;
            border-bottom: 1px solid #ddd;
          }
          
          .admin-modal-header h3 {
            margin: 0;
          }
          
          .admin-modal-close {
            color: #aaa;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
          }
          
          .admin-modal-close:hover {
            color: #333;
          }
          
          .admin-modal-body {
            padding: 20px;
            overflow-y: auto;
            flex: 1;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .webhooks-data {
            max-height: 500px;
            overflow-y: auto;
            border: 1px solid #ddd;
            padding: 15px;
            background-color: #f9f9f9;
            border-radius: 4px;
          }
          
          .webhooks-data pre {
            margin: 0;
            white-space: pre-wrap;
            word-break: break-word;
          }
          
          .admin-modal-actions {
            padding: 15px 20px;
            background-color: #f5f5f5;
            border-top: 1px solid #ddd;
            text-align: right;
          }
          
          .webhook-item {
            margin-bottom: 15px;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            background-color: #f9f9f9;
          }
          
          .webhook-item h4 {
            margin-top: 0;
            color: #3498db;
          }
          
          .webhook-item-details {
            margin-top: 10px;
            font-size: 0.9em;
          }
          
          .webhook-apply-btn {
            margin-top: 10px;
            background-color: #2ecc71;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 3px;
            cursor: pointer;
          }
          
          .webhook-apply-btn:hover {
            background-color: #27ae60;
          }
        `;
        document.head.appendChild(style);
      }
      
      // Добавляем обработчик для закрытия модального окна
      modal.querySelector('.admin-modal-close').addEventListener('click', () => {
        document.body.removeChild(modal);
      });
      
      // Закрытие по клику вне контента
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
        }
      });
    }
    
    // Выполняем запрос к серверу
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
        }
        return response.text(); // Сначала получаем текст ответа
      })
      .then(responseText => {
        try {
          // Пытаемся распарсить как JSON
          const jsonData = JSON.parse(responseText);
          
          // Обрабатываем полученные данные и заполняем поля ввода в интерфейсе
          this.processWebhooksData(jsonData);
          
          // Обновляем содержимое модального окна со структурированным отображением вебхуков
          let webhooksHtml = '<h3>Найденные вебхуки</h3>';
          let foundWebhooks = false;
          
          // Проверяем наличие webhooks в объекте
          if (jsonData.webhooks && Array.isArray(jsonData.webhooks)) {
            foundWebhooks = true;
            webhooksHtml += '<div class="webhooks-list">';
            
            jsonData.webhooks.forEach((webhook, index) => {
              webhooksHtml += `
                <div class="webhook-item">
                  <h4>${webhook.description || webhook.id || `Вебхук ${index + 1}`}</h4>
                  <div class="webhook-item-details">
                    <p><strong>Тип:</strong> ${webhook.type || 'Не указан'}</p>
                    <p><strong>URL:</strong> ${webhook.url || 'Не указан'}</p>
                    <p><strong>Метод:</strong> ${webhook.method || 'GET'}</p>
                    <p><strong>Статус:</strong> ${webhook.active ? 'Активен' : 'Неактивен'}</p>
                  </div>
                  <button class="webhook-apply-btn" data-webhook-index="${index}">Применить этот вебхук</button>
                </div>
              `;
            });
            
            webhooksHtml += '</div>';
          } else if (jsonData.exportUrl || jsonData.importUrl || jsonData.getWebhooksUrl) {
            // Если это объект с настройками вебхуков
            foundWebhooks = true;
            webhooksHtml += `
              <div class="webhook-item">
                <h4>Настройки вебхуков</h4>
                <div class="webhook-item-details">
                  ${jsonData.exportUrl ? `<p><strong>URL экспорта:</strong> ${jsonData.exportUrl}</p>` : ''}
                  ${jsonData.importUrl ? `<p><strong>URL импорта:</strong> ${jsonData.importUrl}</p>` : ''}
                  ${jsonData.getWebhooksUrl ? `<p><strong>URL получения вебхуков:</strong> ${jsonData.getWebhooksUrl}</p>` : ''}
                  ${jsonData.lastUpdated ? `<p><strong>Последнее обновление:</strong> ${jsonData.lastUpdated}</p>` : ''}
                </div>
                <button class="webhook-apply-settings-btn">Применить эти настройки</button>
              </div>
            `;
          } else {
            // Проверяем наличие URL-адресов в любом месте объекта
            const foundUrls = this.findUrlsInObject(jsonData);
            if (foundUrls.length > 0) {
              foundWebhooks = true;
              webhooksHtml += '<div class="webhooks-list">';
              
              foundUrls.forEach((urlInfo, index) => {
                webhooksHtml += `
                  <div class="webhook-item">
                    <h4>Найденный URL ${index + 1}</h4>
                    <div class="webhook-item-details">
                      <p><strong>URL:</strong> ${urlInfo.url}</p>
                      <p><strong>Путь в объекте:</strong> ${urlInfo.path}</p>
                    </div>
                    <button class="webhook-apply-url-btn" data-url="${urlInfo.url}" data-type="${urlInfo.type || 'unknown'}">
                      Использовать как ${this.getWebhookTypeLabel(urlInfo.type)}
                    </button>
                  </div>
                `;
              });
              
              webhooksHtml += '</div>';
            }
          }
          
          if (!foundWebhooks) {
            // Отображаем весь JSON, если не удалось найти структурированные данные
            webhooksHtml = `
              <div class="webhooks-data">
                <h3>Полученные данные (формат JSON)</h3>
                <pre>${JSON.stringify(jsonData, null, 2)}</pre>
              </div>
            `;
          }
          
          // Добавляем кнопки действий
          webhooksHtml += `
            <div class="admin-modal-actions">
              <button id="close-webhooks-modal" class="admin-btn">Закрыть</button>
              <button id="copy-webhooks-data" class="admin-btn admin-btn-primary">
                <i class="fas fa-copy"></i> Скопировать JSON
              </button>
            </div>
          `;
          
          // Обновляем содержимое модального окна
          modal.querySelector('.admin-modal-body').innerHTML = webhooksHtml;
          
          // Добавляем обработчики для кнопок
          modal.querySelector('#close-webhooks-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
          });
          
          // Обработчик для копирования данных
          modal.querySelector('#copy-webhooks-data').addEventListener('click', () => {
            try {
              navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2))
                .then(() => {
                  alert('Данные скопированы в буфер обмена');
                })
                .catch(err => {
                  console.error('Ошибка при копировании: ', err);
                  
                  // Альтернативный способ копирования
                  const textArea = document.createElement('textarea');
                  textArea.value = JSON.stringify(jsonData, null, 2);
                  document.body.appendChild(textArea);
                  textArea.select();
                  document.execCommand('copy');
                  document.body.removeChild(textArea);
                  alert('Данные скопированы в буфер обмена');
                });
            } catch (err) {
              console.error('Ошибка при копировании: ', err);
              alert('Не удалось скопировать данные: ' + err.message);
            }
          });
          
          // Добавляем обработчики для кнопок применения вебхуков
          const applyButtons = modal.querySelectorAll('.webhook-apply-btn');
          applyButtons.forEach(button => {
            button.addEventListener('click', () => {
              const index = parseInt(button.getAttribute('data-webhook-index'));
              const webhook = jsonData.webhooks[index];
              
              if (webhook && webhook.url) {
                // Определяем, какой тип вебхука перед нами
                if (webhook.type === 'export' || webhook.id === 'export_courses_hook') {
                  document.getElementById('admin-export-webhook-url').value = webhook.url;
                  this.showWebhookStatus(`URL экспорта установлен: ${webhook.url}`, 'success');
                } else if (webhook.type === 'import' || webhook.id === 'import_courses_hook') {
                  document.getElementById('admin-import-webhook-url').value = webhook.url;
                  this.showWebhookStatus(`URL импорта установлен: ${webhook.url}`, 'success');
                } else if (webhook.type === 'notification' || webhook.id === 'notify_updates_hook') {
                  // Можем добавить другие типы вебхуков по необходимости
                  document.getElementById('admin-get-webhooks-url').value = webhook.url;
                  this.showWebhookStatus(`URL уведомлений установлен: ${webhook.url}`, 'success');
                } else {
                  // Если тип не определен, предлагаем выбрать вручную
                  const urlType = prompt(`Выберите тип для вебхука ${webhook.url} (export, import, get):`, 'export');
                  
                  if (urlType === 'export') {
                    document.getElementById('admin-export-webhook-url').value = webhook.url;
                    this.showWebhookStatus(`URL экспорта установлен: ${webhook.url}`, 'success');
                  } else if (urlType === 'import') {
                    document.getElementById('admin-import-webhook-url').value = webhook.url;
                    this.showWebhookStatus(`URL импорта установлен: ${webhook.url}`, 'success');
                  } else if (urlType === 'get') {
                    document.getElementById('admin-get-webhooks-url').value = webhook.url;
                    this.showWebhookStatus(`URL получения вебхуков установлен: ${webhook.url}`, 'success');
                  }
                }
              }
            });
          });
          
          // Обработчик для кнопки применения настроек
          const applySettingsBtn = modal.querySelector('.webhook-apply-settings-btn');
          if (applySettingsBtn) {
            applySettingsBtn.addEventListener('click', () => {
              if (jsonData.exportUrl) {
                document.getElementById('admin-export-webhook-url').value = jsonData.exportUrl;
              }
              if (jsonData.importUrl) {
                document.getElementById('admin-import-webhook-url').value = jsonData.importUrl;
              }
              if (jsonData.getWebhooksUrl) {
                document.getElementById('admin-get-webhooks-url').value = jsonData.getWebhooksUrl;
              }
              
              this.showWebhookStatus('Настройки вебхуков успешно применены', 'success');
            });
          }
          
          // Обработчики для найденных URL
          const applyUrlButtons = modal.querySelectorAll('.webhook-apply-url-btn');
          applyUrlButtons.forEach(button => {
            button.addEventListener('click', () => {
              const url = button.getAttribute('data-url');
              const type = button.getAttribute('data-type');
              
              if (url) {
                if (type === 'export') {
                  document.getElementById('admin-export-webhook-url').value = url;
                  this.showWebhookStatus(`URL экспорта установлен: ${url}`, 'success');
                } else if (type === 'import') {
                  document.getElementById('admin-import-webhook-url').value = url;
                  this.showWebhookStatus(`URL импорта установлен: ${url}`, 'success');
                } else if (type === 'get') {
                  document.getElementById('admin-get-webhooks-url').value = url;
                  this.showWebhookStatus(`URL получения вебхуков установлен: ${url}`, 'success');
                } else {
                  // Если тип не определен, предлагаем выбрать вручную
                  const urlType = prompt(`Выберите тип для URL ${url} (export, import, get):`, 'export');
                  
                  if (urlType === 'export') {
                    document.getElementById('admin-export-webhook-url').value = url;
                    this.showWebhookStatus(`URL экспорта установлен: ${url}`, 'success');
                  } else if (urlType === 'import') {
                    document.getElementById('admin-import-webhook-url').value = url;
                    this.showWebhookStatus(`URL импорта установлен: ${url}`, 'success');
                  } else if (urlType === 'get') {
                    document.getElementById('admin-get-webhooks-url').value = url;
                    this.showWebhookStatus(`URL получения вебхуков установлен: ${url}`, 'success');
                  }
                }
              }
            });
          });
          
          this.showWebhookStatus('Вебхуки успешно получены', 'success');
        } catch (e) {
          console.error('Ошибка при обработке JSON:', e);
          
          // Если это не JSON, просто отображаем текст и пытаемся найти URL в тексте
          let textContent = `
            <div class="webhooks-data">
              <h3>Получен текстовый ответ</h3>
              <pre>${responseText}</pre>
            </div>
          `;
          
          // Пытаемся найти URL в тексте
          const urlRegex = /(https?:\/\/[^\s"]+)/g;
          const urls = responseText.match(urlRegex);
          
          if (urls && urls.length > 0) {
            textContent += `
              <div style="margin-top: 20px;">
                <h3>Найденные URL-адреса:</h3>
                <ul style="padding-left: 20px;">
            `;
            
            urls.forEach((url, index) => {
              textContent += `
                <li style="margin-bottom: 10px;">
                  ${url}
                  <div style="margin-top: 5px;">
                    <button class="webhook-text-url-btn" data-url="${url}" data-type="export">
                      Использовать для экспорта
                    </button>
                    <button class="webhook-text-url-btn" data-url="${url}" data-type="import">
                      Использовать для импорта
                    </button>
                    <button class="webhook-text-url-btn" data-url="${url}" data-type="get">
                      Использовать для получения вебхуков
                    </button>
                  </div>
                </li>
              `;
            });
            
            textContent += `
                </ul>
              </div>
            `;
          }
          
          textContent += `
            <div class="admin-modal-actions">
              <button id="close-webhooks-modal" class="admin-btn">Закрыть</button>
              <button id="copy-text-data" class="admin-btn admin-btn-primary">
                <i class="fas fa-copy"></i> Скопировать текст
              </button>
            </div>
          `;
          
          // Обновляем содержимое модального окна
          modal.querySelector('.admin-modal-body').innerHTML = textContent;
          
          // Добавляем обработчики для кнопок
          modal.querySelector('#close-webhooks-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
          });
          
          // Копирование текста
          modal.querySelector('#copy-text-data').addEventListener('click', () => {
            try {
              navigator.clipboard.writeText(responseText)
                .then(() => {
                  alert('Текст скопирован в буфер обмена');
                })
                .catch(err => {
                  console.error('Ошибка при копировании: ', err);
                  
                  // Альтернативный способ копирования
                  const textArea = document.createElement('textarea');
                  textArea.value = responseText;
                  document.body.appendChild(textArea);
                  textArea.select();
                  document.execCommand('copy');
                  document.body.removeChild(textArea);
                  alert('Текст скопирован в буфер обмена');
                });
            } catch (err) {
              console.error('Ошибка при копировании: ', err);
              alert('Не удалось скопировать текст: ' + err.message);
            }
          });
          
          // Добавляем обработчики для найденных URL
          setTimeout(() => {
            const urlButtons = modal.querySelectorAll('.webhook-text-url-btn');
            urlButtons.forEach(button => {
              button.addEventListener('click', () => {
                const url = button.getAttribute('data-url');
                const type = button.getAttribute('data-type');
                
                if (url) {
                  if (type === 'export') {
                    document.getElementById('admin-export-webhook-url').value = url;
                    this.showWebhookStatus(`URL экспорта установлен: ${url}`, 'success');
                  } else if (type === 'import') {
                    document.getElementById('admin-import-webhook-url').value = url;
                    this.showWebhookStatus(`URL импорта установлен: ${url}`, 'success');
                  } else if (type === 'get') {
                    document.getElementById('admin-get-webhooks-url').value = url;
                    this.showWebhookStatus(`URL получения вебхуков установлен: ${url}`, 'success');
                  }
                }
              });
            });
          }, 100);
          
          this.showWebhookStatus('Получен текстовый ответ, URL-адреса обработаны', 'success');
        }
      })
      .catch(error => {
        console.error('Ошибка при получении вебхуков:', error);
        
        // Отображаем ошибку в модальном окне
        modal.querySelector('.admin-modal-body').innerHTML = `
          <div style="color: #721c24; background-color: #f8d7da; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
            <h4 style="margin-top: 0;">Ошибка при получении вебхуков</h4>
            <p>${error.message}</p>
          </div>
          <div class="admin-modal-actions">
            <button id="close-webhooks-modal" class="admin-btn">Закрыть</button>
            <button id="retry-webhooks" class="admin-btn admin-btn-primary">Повторить</button>
          </div>
        `;
        
        // Добавляем обработчики для кнопок
        modal.querySelector('#close-webhooks-modal').addEventListener('click', () => {
          document.body.removeChild(modal);
        });
        
        modal.querySelector('#retry-webhooks').addEventListener('click', () => {
          document.body.removeChild(modal);
          this.getWebhooksFromServer(url);
        });
        
        this.showWebhookStatus(`Ошибка при получении вебхуков: ${error.message}`, 'error');
      });
  }
  
  /**
   * Получить текстовое описание типа вебхука
   */
  getWebhookTypeLabel(type) {
    switch (type) {
      case 'export': return 'URL экспорта';
      case 'import': return 'URL импорта';
      case 'get': return 'URL получения вебхуков';
      default: return 'URL (назначение не определено)';
    }
  }
  
  /**
   * Обработка данных вебхуков и заполнение полей формы
   */
  processWebhooksData(data) {
    try {
      // Проверяем разные форматы данных
      
      // 1. Если есть webhooks массив
      if (data.webhooks && Array.isArray(data.webhooks)) {
        console.log(`Найдено ${data.webhooks.length} вебхуков в массиве webhooks`);
        
        // Ищем вебхуки по типу или ID
        for (const webhook of data.webhooks) {
          if (webhook.url) {
            if (webhook.type === 'export' || webhook.id === 'export_courses_hook') {
              document.getElementById('admin-export-webhook-url').value = webhook.url;
              console.log(`Установлен URL экспорта: ${webhook.url}`);
            } else if (webhook.type === 'import' || webhook.id === 'import_courses_hook') {
              document.getElementById('admin-import-webhook-url').value = webhook.url;
              console.log(`Установлен URL импорта: ${webhook.url}`);
            } else if (webhook.type === 'notification' || webhook.id === 'notify_updates_hook' || webhook.id === 'get_webhooks_hook') {
              document.getElementById('admin-get-webhooks-url').value = webhook.url;
              console.log(`Установлен URL получения вебхуков: ${webhook.url}`);
            }
          }
        }
      }
      
      // 2. Если данные содержат прямые поля с URL
      if (data.exportUrl) {
        document.getElementById('admin-export-webhook-url').value = data.exportUrl;
        console.log(`Установлен URL экспорта: ${data.exportUrl}`);
      }
      
      if (data.importUrl) {
        document.getElementById('admin-import-webhook-url').value = data.importUrl;
        console.log(`Установлен URL импорта: ${data.importUrl}`);
      }
      
      if (data.getWebhooksUrl) {
        document.getElementById('admin-get-webhooks-url').value = data.getWebhooksUrl;
        console.log(`Установлен URL получения вебхуков: ${data.getWebhooksUrl}`);
      }
      
      // 3. Если в данных есть URL в других форматах
      const urls = this.findUrlsInObject(data);
      if (urls.length > 0) {
        console.log(`Найдено ${urls.length} URL-адресов в данных`);
        
        // Автоматически устанавливаем URL, если можем определить их тип
        urls.forEach(urlInfo => {
          if (urlInfo.type === 'export') {
            document.getElementById('admin-export-webhook-url').value = urlInfo.url;
            console.log(`Автоматически установлен URL экспорта: ${urlInfo.url}`);
          } else if (urlInfo.type === 'import') {
            document.getElementById('admin-import-webhook-url').value = urlInfo.url;
            console.log(`Автоматически установлен URL импорта: ${urlInfo.url}`);
          } else if (urlInfo.type === 'get') {
            document.getElementById('admin-get-webhooks-url').value = urlInfo.url;
            console.log(`Автоматически установлен URL получения вебхуков: ${urlInfo.url}`);
          }
        });
      }
      
      // Обновляем настройки вебхуков
      this.saveWebhookSettings();
      this.showWebhookStatus('Данные вебхуков успешно обработаны', 'success');
      
    } catch (error) {
      console.error('Ошибка при обработке данных вебхуков:', error);
      this.showWebhookStatus(`Ошибка при обработке данных: ${error.message}`, 'error');
    }
  }
  
  /**
   * Рекурсивный поиск URL в объекте
   */
  findUrlsInObject(obj, path = '', results = []) {
    if (!obj || typeof obj !== 'object') return results;
    
    // Обрабатываем все свойства объекта
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        const currentPath = path ? `${path}.${key}` : key;
        
        // Если значение - строка, проверяем, является ли оно URL
        if (typeof value === 'string' && this.isValidUrl(value)) {
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
          this.findUrlsInObject(value, currentPath, results);
        }
      }
    }
    
    return results;
  }
  
  /**
   * Запасной метод копирования для браузеров без поддержки clipboard API
   */
  fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Делаем элемент невидимым
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        // Находим кнопку и обновляем её текст
        const copyButton = document.getElementById('copy-json-template');
        if (copyButton) {
          const originalText = copyButton.innerHTML;
          copyButton.innerHTML = '<i class="fas fa-check"></i> Скопировано';
          copyButton.style.backgroundColor = '#d4edda';
          copyButton.style.borderColor = '#c3e6cb';
          
          setTimeout(() => {
            copyButton.innerHTML = originalText;
            copyButton.style.backgroundColor = '';
            copyButton.style.borderColor = '';
          }, 2000);
        }
      } else {
        console.error('Не удалось скопировать текст через execCommand');
        alert('Не удалось скопировать текст. Пожалуйста, выделите и скопируйте его вручную.');
      }
    } catch (err) {
      console.error('Ошибка при использовании execCommand:', err);
      alert('Не удалось скопировать текст. Пожалуйста, выделите и скопируйте его вручную.');
    }
    
    document.body.removeChild(textArea);
  }

  /**
   * Получение настроек вебхуков из localStorage
   */
  getWebhookSettings() {
    const settingsStr = localStorage.getItem('webhookSettings');
    if (settingsStr) {
      try {
        return JSON.parse(settingsStr);
      } catch (e) {
        console.error('Error parsing webhook settings:', e);
        return null;
      }
    }
    return null;
  }

  /**
   * Загрузка настроек вебхуков в форму
   */
  loadWebhookSettings() {
    const settings = this.getWebhookSettings();
    if (settings) {
      const exportUrlInput = document.getElementById('admin-export-webhook-url');
      const importUrlInput = document.getElementById('admin-import-webhook-url');
      const getWebhooksUrlInput = document.getElementById('admin-get-webhooks-url');
      
      if (exportUrlInput && settings.exportUrl) {
        exportUrlInput.value = settings.exportUrl;
      }
      
      if (importUrlInput && settings.importUrl) {
        importUrlInput.value = settings.importUrl;
      }
      
      if (getWebhooksUrlInput) {
        // Set the default URL even if not in settings
        getWebhooksUrlInput.value = settings.getWebhooksUrl || "https://auto.crm-s.com/webhook/GetOnboardingHooks";
      }
    } else {
      // If no settings exist, set default URL for webhooks
      const getWebhooksUrlInput = document.getElementById('admin-get-webhooks-url');
      if (getWebhooksUrlInput) {
        getWebhooksUrlInput.value = "https://auto.crm-s.com/webhook/GetOnboardingHooks";
      }
    }
  }

  loadNoDayLessonsList() {
    const noDayLessonsList = document.getElementById('admin-no-day-lessons-list');
    noDayLessonsList.innerHTML = '';

    if (!this.currentEditing.course) return;

    // Убедимся, что массив noDayLessons существует
    if (!this.currentEditing.course.noDayLessons) {
      this.currentEditing.course.noDayLessons = [];
    }

    if (this.currentEditing.course.noDayLessons.length === 0) {
      noDayLessonsList.innerHTML = '<div class="admin-list-empty">Нет уроков без дня. Добавьте новый урок.</div>';
      return;
    }

    this.currentEditing.course.noDayLessons.forEach((lesson, index) => {
      // Формируем информацию об источнике контента
      let contentSourceInfo = '';
      if (lesson.contentSource) {
        contentSourceInfo = `<div class="admin-list-item-source">Контент: ${lesson.contentSource.type}`;
        if (lesson.contentSource.type === 'webhook' && lesson.contentSource.url) {
          contentSourceInfo += ` (${lesson.contentSource.url.substring(0, 30)}${lesson.contentSource.url.length > 30 ? '...' : ''})`;
        } else if (lesson.contentSource.type === 'local' && lesson.contentSource.id) {
          contentSourceInfo += ` (ID: ${lesson.contentSource.id})`;
        } else if (lesson.contentSource.type === 'markdown') {
          contentSourceInfo += ` (встроенный)`;
        }
        contentSourceInfo += '</div>';
      }

      // Формируем информацию об источнике теста
      let testSourceInfo = '';
      if (lesson.testSource) {
        testSourceInfo = `<div class="admin-list-item-source">Тест: ${lesson.testSource.type}`;
        if (lesson.testSource.type === 'webhook' && lesson.testSource.url) {
          testSourceInfo += ` (${lesson.testSource.url.substring(0, 30)}${lesson.testSource.url.length > 30 ? '...' : ''})`;
        }
        testSourceInfo += '</div>';
      }
      
      // Формируем информацию об аудио
      let audioSourceInfo = '';
      if (lesson.audioSource) {
        audioSourceInfo = `<div class="admin-list-item-source">Аудио: ${lesson.audioSource.type}`;
        if (lesson.audioSource.type === 'soundcloud' && lesson.audioSource.trackUrl) {
          audioSourceInfo += ` (${lesson.audioSource.trackUrl.substring(0, 30)}${lesson.audioSource.trackUrl.length > 30 ? '...' : ''})`;
        }
        audioSourceInfo += '</div>';
      }
      
      const lessonItem = document.createElement('div');
      lessonItem.className = 'admin-list-item';
      lessonItem.innerHTML = `
        <div class="admin-list-item-info">
          <div class="admin-list-item-title">${lesson.title || 'Без названия'}</div>
          <div class="admin-list-item-subtitle">ID: ${lesson.id || 'Без ID'}</div>
          ${contentSourceInfo}
          ${testSourceInfo}
          ${audioSourceInfo}
        </div>
        <div class="admin-list-item-actions">
          <button class="admin-btn admin-btn-sm edit-no-day-lesson" data-index="${index}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="admin-btn admin-btn-sm admin-btn-danger delete-no-day-lesson" data-index="${index}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      noDayLessonsList.appendChild(lessonItem);

      lessonItem.querySelector('.edit-no-day-lesson').addEventListener('click', () => {
        this.editNoDayLesson(index);
      });

      lessonItem.querySelector('.delete-no-day-lesson').addEventListener('click', () => {
        this.deleteNoDayLesson(index);
      });
    });
  }

  editNoDayLesson(index) {
    if (!this.currentEditing.course || !this.currentEditing.course.noDayLessons[index]) return;
    
    const lesson = this.currentEditing.course.noDayLessons[index];
    
    // Заполняем форму урока
    this.fillLessonForm(lesson);
    
    // Настраиваем параметры редактирования
    this.currentEditing.lesson = lesson;
    this.currentEditing.lessonIndex = index;
    this.currentEditing.isSpecial = false;
    this.currentEditing.day = null; // Явно указываем, что это урок не привязан к дню
    this.currentEditing.isNew = false;
    this.currentEditing.isNoDayLesson = true;
    
    // Показываем редактор урока
    document.getElementById('admin-welcome').classList.add('hidden');
    document.getElementById('admin-course-editor').classList.add('hidden');
    document.getElementById('admin-day-editor').classList.add('hidden');
    document.getElementById('admin-lesson-editor').classList.remove('hidden');
    
    console.log('Редактирование урока без дня:', lesson.id);
  }

  deleteNoDayLesson(index) {
    if (!this.currentEditing.course || !this.currentEditing.course.noDayLessons[index]) return;
    
    const lesson = this.currentEditing.course.noDayLessons[index];
    
    if (!confirm(`Вы уверены, что хотите удалить урок "${lesson.title}"?`)) {
      return;
    }

    // Удаляем урок
    this.currentEditing.course.noDayLessons.splice(index, 1);
    
    // Обновляем список
    this.loadNoDayLessonsList();
    
    // Сохраняем изменения
    this.saveCoursesToJSON();
    
    console.log('Урок без дня удален:', lesson.id);
  }

  createNoDayLesson() {
    console.log('Создание нового урока без дня');
    
    // Создаем шаблон нового урока с полной структурой
    const newLesson = {
      id: `no-day-lesson-${Date.now().toString().slice(-6)}`,
      title: 'Новый урок без дня',
      contentSource: { 
        type: 'markdown', 
        content: '# Новый урок без дня\n\nДобавьте контент для урока здесь.' 
      },
      testSource: null,
      taskSource: null,
      audioSource: null
    };
    
    // Убедимся, что массив noDayLessons существует
    if (!this.currentEditing.course.noDayLessons) {
      this.currentEditing.course.noDayLessons = [];
    }
    
    // Заполняем форму урока
    this.fillLessonForm(newLesson);
    
    // Настраиваем параметры редактирования
    this.currentEditing.lesson = newLesson;
    this.currentEditing.lessonIndex = -1;
    this.currentEditing.isSpecial = false;
    this.currentEditing.day = null; // Явно указываем, что это урок не привязан к дню
    this.currentEditing.isNew = true;
    this.currentEditing.isNoDayLesson = true;
    
    // Показываем редактор урока
    document.getElementById('admin-welcome').classList.add('hidden');
    document.getElementById('admin-course-editor').classList.add('hidden');
    document.getElementById('admin-day-editor').classList.add('hidden');
    document.getElementById('admin-lesson-editor').classList.remove('hidden');
    
    console.log('Форма создания урока без дня открыта');
  }

  /**
   * Сохранение урока без дня
   */
  saveNoDayLesson() {
    // Собираем данные из формы
    const lessonData = {
      id: document.getElementById('admin-lesson-id').value,
      title: document.getElementById('admin-lesson-title').value
    };

    // Валидация
    if (!lessonData.id) {
      alert('ID урока обязателен!');
      return;
    }

    if (!lessonData.title) {
      alert('Название урока обязательно!');
      return;
    }

    // Собираем данные об источнике контента
    const contentSourceType = document.getElementById('admin-content-source-type').value;
    if (contentSourceType !== 'none') {
      lessonData.contentSource = {
        type: contentSourceType
      };

      if (contentSourceType === 'webhook') {
        lessonData.contentSource.url = document.getElementById('admin-content-webhook-url').value;
        const fallbackType = document.getElementById('admin-content-fallback-type').value;
        if (fallbackType !== 'none') {
          lessonData.contentSource.fallbackType = fallbackType;
          lessonData.contentSource.fallbackId = document.getElementById('admin-content-fallback-id').value;
        }
      } else if (contentSourceType === 'local') {
        lessonData.contentSource.id = document.getElementById('admin-content-local-id').value;
      } else if (contentSourceType === 'markdown') {
        lessonData.contentSource.content = document.getElementById('admin-content-markdown').value;
      }
    }

    // Собираем данные об источнике теста
    const testSourceType = document.getElementById('admin-test-source-type').value;
    if (testSourceType !== 'none') {
      lessonData.testSource = {
        type: testSourceType
      };

      if (testSourceType === 'webhook') {
        lessonData.testSource.url = document.getElementById('admin-test-webhook-url').value;
        const fallbackType = document.getElementById('admin-test-fallback-type').value;
        if (fallbackType !== 'none') {
          lessonData.testSource.fallbackType = fallbackType;
          lessonData.testSource.fallbackId = document.getElementById('admin-test-fallback-id').value;
        }
      } else if (testSourceType === 'markdown') {
        lessonData.testSource.id = document.getElementById('admin-test-markdown-id').value;
        lessonData.testSource.content = document.getElementById('admin-test-markdown').value;
      }
    }

    // Собираем данные о задании
    const taskSourceType = document.getElementById('admin-task-source-type').value;
    if (taskSourceType !== 'none') {
      lessonData.taskSource = {
        type: taskSourceType
      };

      if (taskSourceType === 'markdown') {
        lessonData.taskSource.content = document.getElementById('admin-task-markdown').value;
      }
    }

    // Собираем данные об аудио
    const audioSourceType = document.getElementById('admin-audio-source-type').value;
    if (audioSourceType !== 'none') {
      lessonData.audioSource = {
        type: audioSourceType
      };

      if (audioSourceType === 'soundcloud') {
        lessonData.audioSource.url = document.getElementById('admin-audio-account-url').value;
        lessonData.audioSource.trackUrl = document.getElementById('admin-audio-track-url').value;
      } else if (audioSourceType === 'embed') {
        lessonData.audioSource.embedCode = document.getElementById('admin-audio-embed-code').value;
      }
    }

    // Убедимся, что массив noDayLessons существует
    if (!this.currentEditing.course.noDayLessons) {
      this.currentEditing.course.noDayLessons = [];
    }

    // Сохраняем урок без дня
    if (this.currentEditing.isNew) {
      this.currentEditing.course.noDayLessons.push(lessonData);
      console.log('Создан новый урок без дня:', lessonData);
    } else {
      this.currentEditing.course.noDayLessons[this.currentEditing.lessonIndex] = lessonData;
      console.log('Обновлен урок без дня:', lessonData);
    }

    // Обновляем список уроков без дня
    this.loadNoDayLessonsList();
    
    // Сохраняем изменения в JSON
    this.saveCoursesToJSON();
    
    // Возвращаемся к редактору курса
    this.cancelLessonEdit();
    
    alert('Урок без дня успешно сохранен!');
  }
}

// Создаем и экспортируем синглтон интерфейса администратора
const adminInterface = new AdminInterface();
export default adminInterface;