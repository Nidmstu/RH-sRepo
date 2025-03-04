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

    // Добавление словаря (урока без дня)
    const addVocabularyBtn = document.getElementById('admin-add-vocabulary');
    if (addVocabularyBtn) {
      addVocabularyBtn.addEventListener('click', () => {
        this.createNoDayLesson();
      });
    }


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
                <button id="admin-import-course" class="admin-btn">Импорт</button>
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

      // Подключаем обработчики событий
      this.setupEventListeners();

      this.isInitialized = true;
      console.log('Административный интерфейс инициализирован');
    }
  }

  /**
   * Добавление стилей для административного интерфейса
   */
  addStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
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

    // Переключение вкладок
    const tabButtons = document.querySelectorAll('.admin-tab-btn');
    console.log(`Инициализация обработчиков для ${tabButtons.length} кнопок вкладок`);
    
    if (tabButtons && tabButtons.length > 0) {
      tabButtons.forEach(tab => {
        tab.addEventListener('click', (e) => {
          e.preventDefault(); // Предотвращаем поведение по умолчанию
          
          // Получаем data-tab из кнопки
          const tabId = tab.getAttribute('data-tab');
          console.log(`Клик по вкладке: ${tabId} (${tab.textContent.trim()})`);
          
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
      // Деактивируем все кнопки вкладок
      const allTabButtons = document.querySelectorAll('.admin-tab-btn');
      console.log(`Найдено ${allTabButtons.length} кнопок вкладок`);
      allTabButtons.forEach(button => {
        button.classList.remove('active');
      });
      
      // Активируем нужную кнопку вкладки
      const tabButton = document.querySelector(`.admin-tab-btn[data-tab="${tabId}"]`);
      if (tabButton) {
        tabButton.classList.add('active');
        console.log(`Кнопка вкладки ${tabId} активирована`);
      } else {
        console.error(`Кнопка вкладки с data-tab="${tabId}" не найдена`);
      }

      // Скрываем все панели вкладок
      const allTabPanes = document.querySelectorAll('.admin-tab-pane');
      console.log(`Найдено ${allTabPanes.length} панелей вкладок`);
      allTabPanes.forEach(pane => {
        pane.classList.add('hidden');
        pane.style.display = 'none'; // Устанавливаем display: none для всех панелей
      });
      
      // Показываем нужную панель
      const tabPaneId = `admin-tab-${tabId}`;
      const tabPane = document.getElementById(tabPaneId);
      
      if (tabPane) {
        console.log(`Панель ${tabPaneId} найдена, активируем её`);
        tabPane.style.display = 'block'; // Принудительно устанавливаем display: block
        tabPane.classList.remove('hidden');
        
        // Если это вкладка специальных уроков, обновляем их список
        if (tabId === 'special-lessons') {
          console.log('Загружаем список специальных уроков');
          this.loadSpecialLessonsList();
          this.loadNoDayLessonsList();
        }
      } else {
        console.error(`Панель вкладки с id="${tabPaneId}" не найдена`);
        
        // Выведем список всех доступных панелей для диагностики
        const allPanes = document.querySelectorAll('[id^="admin-tab-"]');
        console.log('Доступные панели вкладок:', Array.from(allPanes).map(el => el.id));
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

    const professions = window.courseManager.getProfessions();
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
      courseItem.innerHTML = `
        <div class="admin-list-item-info">
          <div class="admin-list-item-title">${title}</div>
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

      // Добавляем обработчики событий
      const editButton = courseItem.querySelector('.edit-course');
      const deleteButton = courseItem.querySelector('.delete-course');

      if (editButton) {
        editButton.addEventListener('click', () => {
          this.editCourse(professionId);

          // На мобильных устройствах скрываем боковую панель после выбора курса
          if (window.innerWidth <= 768) {
            const sidebar = document.querySelector('.admin-sidebar');
            const toggleBtn = document.getElementById('toggle-sidebar');

            if (sidebar && toggleBtn) {
              sidebar.style.display = 'none';
              toggleBtn.innerHTML = '<i class="fas fa-bars"></i> Показать меню курсов';
            }
          }
        });
      }

      if (deleteButton) {
        deleteButton.addEventListener('click', () => {
          this.deleteCourse(professionId);
        });
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

    const course = window.courseManager.courses[professionId];
    this.currentEditing.course = course;
    this.currentEditing.day = null;
    this.currentEditing.lesson = null;

    // Заполняем форму курса
    document.getElementById('admin-course-id').value = professionId;
    document.getElementById('admin-course-title-input').value = course.title || '';
    document.getElementById('admin-course-redirect').value = course.redirectUrl || '';
    document.getElementById('admin-course-title').textContent = course.title || professionId;

    // Загружаем дни и специальные уроки
    this.loadDaysList();
    this.loadSpecialLessonsList();
    this.loadNoDayLessonsList(); //Load lessons without day

    // Показываем редактор курса
    document.getElementById('admin-welcome').classList.add('hidden');
    document.getElementById('admin-day-editor').classList.add('hidden');
    document.getElementById('admin-lesson-editor').classList.add('hidden');
    document.getElementById('admin-course-editor').classList.remove('hidden');

    // Переключаемся на вкладку с днями
    this.switchTab('days');
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

    // Обновляем данные курса
    this.currentEditing.course.title = title;

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

    // Сохраняем изменения в JSON файл
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
      const lessonItem = document.createElement('div');
      lessonItem.className = 'admin-list-item';
      lessonItem.innerHTML = `
        <div class="admin-list-item-info">
          <div class="admin-list-item-title">${lesson.title || 'Без названия'}</div>
          <div class="admin-list-item-subtitle">ID: ${lesson.id || 'Без ID'}</div>
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
      const lessonItem = document.createElement('div');
      lessonItem.className = 'admin-list-item';
      lessonItem.innerHTML = `
        <div class="admin-list-item-info">
          <div class="admin-list-item-title">${lesson.title}</div>
          <div class="admin-list-item-subtitle">ID: ${lesson.id}</div>
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

    // Сохраняем изменения в JSON файл
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
      document.getElementById('admin-audio-source-type').value = lesson.audioSource.type || 'none';
      this.toggleSourceFields('audio', lesson.audioSource.type);

      if (lesson.audioSource.type === 'soundcloud') {
        document.getElementById('admin-audio-account-url').value = lesson.audioSource.url || '';
        document.getElementById('admin-audio-track-url').value = lesson.audioSource.trackUrl || '';
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
        // Здесь может быть логика для сохранения содержимого теста в файл
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
      }
    }

    // Сохраняем изменения
    if (this.currentEditing.isSpecial) {
      // Убедимся, что массив специальных уроков существует
      if (!this.currentEditing.course.specialLessons) {
        this.currentEditing.course.specialLessons = [];
      }

      // Сохраняем специальный урок
      if (this.currentEditing.isNew) {
        // Новый урок
        this.currentEditing.course.specialLessons.push(lessonData);
      } else {
        // Обновляем существующий
        this.currentEditing.course.specialLessons[this.currentEditing.lessonIndex] = lessonData;
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
      } else {
        // Обновляем существующий
        this.currentEditing.day.lessons[this.currentEditing.lessonIndex] = lessonData;
      }

      // Обновляем список
      this.loadLessonsList();
    }

    // Сохраняем изменения в JSON файл
    this.saveCoursesToJSON();

    // Возвращаемся к предыдущему экрану
    this.cancelLessonEdit();

    alert('Урок успешно сохранен!');
  }

  /**
   * Отмена редактирования урока
   */
  cancelLessonEdit() {
    this.currentEditing.lesson = null;

    if (this.currentEditing.isSpecial) {
      document.getElementById('admin-lesson-editor').classList.add('hidden');
      document.getElementById('admin-course-editor').classList.remove('hidden');
    } else {
      document.getElementById('admin-lesson-editor').classList.add('hidden');
      document.getElementById('admin-day-editor').classList.remove('hidden');
    }
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
   * Сохранение курсов в JSON файл
   */
  saveCoursesToJSON() {
    // Создаем кнопку для загрузки JSON
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

  loadNoDayLessonsList() {
    const noDayLessonsList = document.getElementById('admin-no-day-lessons-list');
    noDayLessonsList.innerHTML = '';

    if (!this.currentEditing.course || !this.currentEditing.course.noDayLessons) return;

    this.currentEditing.course.noDayLessons.forEach((lesson, index) => {
      const lessonItem = document.createElement('div');
      lessonItem.className = 'admin-list-item';
      lessonItem.innerHTML = `
        <div class="admin-list-item-info">
          <div class="admin-list-item-title">${lesson.title}</div>
          <div class="admin-list-item-subtitle">ID: ${lesson.id}</div>
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
    this.fillLessonForm(lesson);
    this.currentEditing.lesson = lesson;
    this.currentEditing.lessonIndex = index;
    this.currentEditing.isSpecial = false;
    this.currentEditing.isNew = false;
    document.getElementById('admin-welcome').classList.add('hidden');
    document.getElementById('admin-course-editor').classList.add('hidden');
    document.getElementById('admin-day-editor').classList.add('hidden');
    document.getElementById('admin-lesson-editor').classList.remove('hidden');
  }

  deleteNoDayLesson(index) {
    if (!this.currentEditing.course || !this.currentEditing.course.noDayLessons[index]) return;
    const lesson = this.currentEditing.course.noDayLessons[index];
    if (!confirm(`Вы уверены, что хотите удалить урок "${lesson.title}"?`)) return;
    this.currentEditing.course.noDayLessons.splice(index, 1);
    this.loadNoDayLessonsList();
    this.saveCoursesToJSON();
  }

  createNoDayLesson() {
    const newLesson = {
      id: '',
      title: 'Новый урок без дня',
      contentSource: { type: 'markdown', content: '' }
    };
    this.fillLessonForm(newLesson);
    this.currentEditing.lesson = newLesson;
    this.currentEditing.lessonIndex = -1;
    this.currentEditing.isSpecial = false;
    this.currentEditing.isNew = true;
    document.getElementById('admin-welcome').classList.add('hidden');
    document.getElementById('admin-course-editor').classList.add('hidden');
    document.getElementById('admin-day-editor').classList.add('hidden');
    document.getElementById('admin-lesson-editor').classList.remove('hidden');
  }


  saveNoDayLesson() {
    const lessonData = {
      id: document.getElementById('admin-lesson-id').value,
      title: document.getElementById('admin-lesson-title').value,
      contentSource: {
        type: document.getElementById('admin-content-source-type').value,
        content: document.getElementById('admin-content-markdown').value
      }
    };

    if (!lessonData.id || !lessonData.title) {
      alert('ID и название урока обязательны!');
      return;
    }

    if (this.currentEditing.isNew) {
      this.currentEditing.course.noDayLessons.push(lessonData);
    } else {
      this.currentEditing.course.noDayLessons[this.currentEditing.lessonIndex] = lessonData;
    }
    this.loadNoDayLessonsList();
    this.saveCoursesToJSON();
    this.cancelLessonEdit();
    alert('Урок успешно сохранен!');
  }
}

// Создаем и экспортируем синглтон интерфейса администратора
const adminInterface = new AdminInterface();
export default adminInterface;