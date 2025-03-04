
/**
 * Административный модуль для управления курсами
 * 
 * Позволяет:
 * - Просматривать текущую структуру курсов
 * - Добавлять новые уроки
 * - Редактировать существующие уроки
 * - Управлять тестами
 * - Управлять заданиями
 */

import courseManager from './courseManager.js';

// Админ-панель может быть доступна по специальному URL или через секретную комбинацию клавиш
class AdminPanel {
  constructor() {
    this.isInitialized = false;
    this.container = null;
    this.currentCourseData = null;
  }

  /**
   * Инициализация админ-панели
   */
  async initialize() {
    if (this.isInitialized) return;
    
    console.log('Инициализация админ-панели...');
    
    // Сначала убедимся, что курсы загружены
    await courseManager.initialize();
    
    // Создаем контейнер для админ-панели
    this.container = document.createElement('div');
    this.container.id = 'admin-panel';
    this.container.className = 'admin-panel hidden';
    document.body.appendChild(this.container);
    
    // Устанавливаем базовую структуру
    this.container.innerHTML = `
      <div class="admin-header">
        <h1>Панель управления курсами</h1>
        <button id="close-admin-panel">Закрыть</button>
      </div>
      <div class="admin-content">
        <div class="admin-sidebar">
          <h2>Курсы</h2>
          <div id="course-list"></div>
          <button id="add-course">Добавить курс</button>
        </div>
        <div class="admin-main">
          <div id="course-editor" class="hidden">
            <h2>Редактирование курса: <span id="current-course-name"></span></h2>
            <div class="course-days">
              <h3>Дни обучения</h3>
              <div id="days-list"></div>
              <button id="add-day">Добавить день</button>
            </div>
            <div class="course-special-lessons">
              <h3>Специальные уроки</h3>
              <div id="special-lessons-list"></div>
              <button id="add-special-lesson">Добавить специальный урок</button>
            </div>
            <div class="course-actions">
              <button id="save-course">Сохранить изменения</button>
              <button id="export-course">Экспортировать курс</button>
            </div>
          </div>
          <div id="lesson-editor" class="hidden">
            <h2>Редактирование урока: <span id="current-lesson-name"></span></h2>
            <form id="lesson-form">
              <div class="form-group">
                <label for="lesson-id">ID урока:</label>
                <input type="text" id="lesson-id" required>
              </div>
              <div class="form-group">
                <label for="lesson-title">Название урока:</label>
                <input type="text" id="lesson-title" required>
              </div>
              
              <h3>Источник контента</h3>
              <div class="form-group">
                <label for="content-source-type">Тип источника:</label>
                <select id="content-source-type">
                  <option value="webhook">Вебхук</option>
                  <option value="local">Локальный</option>
                  <option value="markdown">Маркдаун</option>
                </select>
              </div>
              <div id="content-webhook-fields">
                <div class="form-group">
                  <label for="content-webhook-url">URL вебхука:</label>
                  <input type="url" id="content-webhook-url">
                </div>
                <div class="form-group">
                  <label for="content-fallback-type">Тип резервного источника:</label>
                  <select id="content-fallback-type">
                    <option value="none">Нет</option>
                    <option value="local">Локальный</option>
                  </select>
                </div>
                <div class="form-group" id="content-fallback-id-group">
                  <label for="content-fallback-id">ID резервного источника:</label>
                  <input type="text" id="content-fallback-id">
                </div>
              </div>
              <div id="content-local-fields" class="hidden">
                <div class="form-group">
                  <label for="content-local-id">ID локального источника:</label>
                  <input type="text" id="content-local-id">
                </div>
              </div>
              <div id="content-markdown-fields" class="hidden">
                <div class="form-group">
                  <label for="content-markdown">Контент (маркдаун):</label>
                  <textarea id="content-markdown" rows="10"></textarea>
                </div>
              </div>
              
              <h3>Источник теста</h3>
              <div class="form-group">
                <label for="test-source-type">Тип источника:</label>
                <select id="test-source-type">
                  <option value="none">Нет</option>
                  <option value="webhook">Вебхук</option>
                  <option value="markdown">Маркдаун</option>
                </select>
              </div>
              <div id="test-webhook-fields" class="hidden">
                <div class="form-group">
                  <label for="test-webhook-url">URL вебхука:</label>
                  <input type="url" id="test-webhook-url">
                </div>
                <div class="form-group">
                  <label for="test-fallback-type">Тип резервного источника:</label>
                  <select id="test-fallback-type">
                    <option value="none">Нет</option>
                    <option value="markdown">Маркдаун</option>
                  </select>
                </div>
                <div class="form-group" id="test-fallback-id-group" class="hidden">
                  <label for="test-fallback-id">ID резервного источника:</label>
                  <input type="text" id="test-fallback-id">
                </div>
              </div>
              <div id="test-markdown-fields" class="hidden">
                <div class="form-group">
                  <label for="test-markdown-id">ID маркдаун теста:</label>
                  <input type="text" id="test-markdown-id">
                </div>
                <div class="form-group">
                  <label for="test-markdown">Контент теста (маркдаун):</label>
                  <textarea id="test-markdown" rows="10"></textarea>
                </div>
              </div>
              
              <h3>Задание</h3>
              <div class="form-group">
                <label for="task-source-type">Тип источника:</label>
                <select id="task-source-type">
                  <option value="none">Нет</option>
                  <option value="markdown">Маркдаун</option>
                </select>
              </div>
              <div id="task-markdown-fields" class="hidden">
                <div class="form-group">
                  <label for="task-markdown">Контент задания (маркдаун):</label>
                  <textarea id="task-markdown" rows="10"></textarea>
                </div>
              </div>
              
              <h3>Аудио</h3>
              <div class="form-group">
                <label for="audio-source-type">Тип источника:</label>
                <select id="audio-source-type">
                  <option value="none">Нет</option>
                  <option value="soundcloud">SoundCloud</option>
                </select>
              </div>
              <div id="audio-soundcloud-fields" class="hidden">
                <div class="form-group">
                  <label for="audio-soundcloud-url">URL аккаунта SoundCloud:</label>
                  <input type="url" id="audio-soundcloud-url">
                </div>
                <div class="form-group">
                  <label for="audio-track-url">URL трека:</label>
                  <input type="url" id="audio-track-url">
                </div>
              </div>
              
              <div class="form-actions">
                <button type="submit">Сохранить урок</button>
                <button type="button" id="cancel-lesson-edit">Отмена</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    
    // Добавляем стили для админ-панели
    this.addStyles();
    
    // Настраиваем обработчики событий
    this.setupEventListeners();
    
    // Загружаем список курсов
    this.loadCoursesList();
    
    this.isInitialized = true;
    console.log('Админ-панель инициализирована');
  }
  
  /**
   * Добавление стилей для админ-панели
   */
  addStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .admin-panel {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.95);
        z-index: 1000;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      
      .admin-panel.hidden {
        display: none;
      }
      
      .admin-header {
        background: #333;
        color: white;
        padding: 10px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .admin-content {
        display: flex;
        height: calc(100% - 60px);
        overflow: hidden;
      }
      
      .admin-sidebar {
        width: 300px;
        background: #f5f5f5;
        padding: 15px;
        overflow-y: auto;
        border-right: 1px solid #ddd;
      }
      
      .admin-main {
        flex: 1;
        padding: 15px;
        overflow-y: auto;
      }
      
      .admin-panel button {
        padding: 8px 15px;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        margin: 5px 0;
      }
      
      .admin-panel button:hover {
        background: #45a049;
      }
      
      .form-group {
        margin-bottom: 15px;
      }
      
      .form-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
      }
      
      .form-group input,
      .form-group select,
      .form-group textarea {
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
      }
      
      .form-actions {
        margin-top: 20px;
        display: flex;
        gap: 10px;
      }
      
      .course-item,
      .day-item,
      .lesson-item {
        padding: 8px;
        margin: 5px 0;
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
      }
      
      .course-item:hover,
      .day-item:hover,
      .lesson-item:hover {
        background: #f0f0f0;
      }
      
      .item-actions {
        display: flex;
        gap: 5px;
      }
      
      .item-actions button {
        padding: 2px 5px;
        font-size: 12px;
        margin: 0;
      }
      
      .hidden {
        display: none;
      }
    `;
    document.head.appendChild(styleElement);
  }
  
  /**
   * Настройка обработчиков событий
   */
  setupEventListeners() {
    // Закрытие админ-панели
    document.getElementById('close-admin-panel').addEventListener('click', () => {
      this.hide();
    });
    
    // Обработчики для различных действий
    document.getElementById('add-course').addEventListener('click', () => {
      // Логика для добавления нового курса
    });
    
    document.getElementById('add-day').addEventListener('click', () => {
      // Логика для добавления нового дня
    });
    
    document.getElementById('add-special-lesson').addEventListener('click', () => {
      // Логика для добавления нового специального урока
    });
    
    document.getElementById('save-course').addEventListener('click', () => {
      this.saveCourseChanges();
    });
    
    document.getElementById('export-course').addEventListener('click', () => {
      this.exportCourseData();
    });
    
    // Обработчики переключения типов источников
    document.getElementById('content-source-type').addEventListener('change', (e) => {
      this.toggleSourceFields('content', e.target.value);
    });
    
    document.getElementById('test-source-type').addEventListener('change', (e) => {
      this.toggleSourceFields('test', e.target.value);
    });
    
    document.getElementById('task-source-type').addEventListener('change', (e) => {
      this.toggleSourceFields('task', e.target.value);
    });
    
    document.getElementById('audio-source-type').addEventListener('change', (e) => {
      this.toggleSourceFields('audio', e.target.value);
    });
    
    // Форма редактирования урока
    document.getElementById('lesson-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveLessonChanges();
    });
    
    document.getElementById('cancel-lesson-edit').addEventListener('click', () => {
      document.getElementById('lesson-editor').classList.add('hidden');
      document.getElementById('course-editor').classList.remove('hidden');
    });
    
    // Добавляем слушатель для горячих клавиш
    document.addEventListener('keydown', (e) => {
      // Alt+Shift+A для показа/скрытия админ-панели
      if (e.altKey && e.shiftKey && e.key === 'A') {
        if (this.container.classList.contains('hidden')) {
          this.show();
        } else {
          this.hide();
        }
      }
    });
  }
  
  /**
   * Переключение полей в зависимости от типа источника
   */
  toggleSourceFields(prefix, type) {
    // Скрываем все поля для данного префикса
    document.querySelectorAll(`[id^="${prefix}-"][id$="-fields"]`).forEach(el => {
      el.classList.add('hidden');
    });
    
    // Показываем нужные поля
    if (type !== 'none') {
      document.getElementById(`${prefix}-${type}-fields`).classList.remove('hidden');
    }
    
    // Дополнительные действия для некоторых типов
    if (prefix === 'content' && type === 'webhook') {
      document.getElementById('content-fallback-id-group').classList.remove('hidden');
    } else if (prefix === 'test' && type === 'webhook') {
      document.getElementById('test-fallback-id-group').classList.remove('hidden');
    }
  }
  
  /**
   * Загрузка списка курсов
   */
  loadCoursesList() {
    const courseList = document.getElementById('course-list');
    courseList.innerHTML = '';
    
    const courses = courseManager.getProfessions();
    courses.forEach(courseId => {
      const courseItem = document.createElement('div');
      courseItem.className = 'course-item';
      courseItem.innerHTML = `
        <span>${courseId}</span>
        <div class="item-actions">
          <button class="edit-course" data-id="${courseId}">Изменить</button>
          <button class="delete-course" data-id="${courseId}">Удалить</button>
        </div>
      `;
      courseList.appendChild(courseItem);
      
      // Добавляем обработчик для редактирования
      courseItem.querySelector('.edit-course').addEventListener('click', () => {
        this.editCourse(courseId);
      });
      
      // Добавляем обработчик для удаления
      courseItem.querySelector('.delete-course').addEventListener('click', () => {
        this.deleteCourse(courseId);
      });
    });
  }
  
  /**
   * Редактирование курса
   */
  editCourse(courseId) {
    console.log(`Редактирование курса: ${courseId}`);
    
    // Получаем данные курса
    this.currentCourseData = courseManager.courses[courseId];
    
    // Обновляем название
    document.getElementById('current-course-name').textContent = courseId;
    
    // Загружаем дни
    this.loadDaysList(courseId);
    
    // Загружаем специальные уроки
    this.loadSpecialLessonsList(courseId);
    
    // Показываем редактор курса
    document.getElementById('course-editor').classList.remove('hidden');
    document.getElementById('lesson-editor').classList.add('hidden');
  }
  
  /**
   * Загрузка списка дней курса
   */
  loadDaysList(courseId) {
    const daysList = document.getElementById('days-list');
    daysList.innerHTML = '';
    
    if (!this.currentCourseData || !this.currentCourseData.days) {
      return;
    }
    
    this.currentCourseData.days.forEach((day, index) => {
      const dayItem = document.createElement('div');
      dayItem.className = 'day-item';
      dayItem.innerHTML = `
        <span>${day.title} (Day ${day.id})</span>
        <div class="item-actions">
          <button class="edit-day" data-index="${index}">Изменить</button>
          <button class="delete-day" data-index="${index}">Удалить</button>
        </div>
      `;
      daysList.appendChild(dayItem);
      
      // Добавляем обработчики для кнопок
      
      // Разворачиваем список уроков для этого дня
      const lessonsContainer = document.createElement('div');
      lessonsContainer.className = 'lessons-container';
      daysList.appendChild(lessonsContainer);
      
      // Загружаем уроки для этого дня
      if (day.lessons && day.lessons.length > 0) {
        day.lessons.forEach((lesson, lessonIndex) => {
          const lessonItem = document.createElement('div');
          lessonItem.className = 'lesson-item';
          lessonItem.style.marginLeft = '20px';
          lessonItem.innerHTML = `
            <span>${lesson.title}</span>
            <div class="item-actions">
              <button class="edit-lesson" data-day="${index}" data-index="${lessonIndex}">Изменить</button>
              <button class="delete-lesson" data-day="${index}" data-index="${lessonIndex}">Удалить</button>
            </div>
          `;
          lessonsContainer.appendChild(lessonItem);
          
          // Добавляем обработчик для редактирования урока
          lessonItem.querySelector('.edit-lesson').addEventListener('click', () => {
            this.editLesson(lesson, index, lessonIndex);
          });
          
          // Добавляем обработчик для удаления урока
          lessonItem.querySelector('.delete-lesson').addEventListener('click', () => {
            this.deleteLesson(index, lessonIndex);
          });
        });
      } else {
        lessonsContainer.innerHTML = '<p style="margin-left: 20px;">Нет уроков</p>';
      }
      
      // Добавляем кнопку для добавления нового урока в этот день
      const addLessonBtn = document.createElement('button');
      addLessonBtn.className = 'add-lesson-btn';
      addLessonBtn.textContent = 'Добавить урок';
      addLessonBtn.style.marginLeft = '20px';
      addLessonBtn.dataset.day = index;
      lessonsContainer.appendChild(addLessonBtn);
      
      // Обработчик для добавления нового урока
      addLessonBtn.addEventListener('click', () => {
        this.addLesson(index);
      });
    });
  }
  
  /**
   * Загрузка списка специальных уроков
   */
  loadSpecialLessonsList(courseId) {
    const specialLessonsList = document.getElementById('special-lessons-list');
    specialLessonsList.innerHTML = '';
    
    if (!this.currentCourseData || !this.currentCourseData.specialLessons) {
      specialLessonsList.innerHTML = '<p>Нет специальных уроков</p>';
      return;
    }
    
    this.currentCourseData.specialLessons.forEach((lesson, index) => {
      const lessonItem = document.createElement('div');
      lessonItem.className = 'lesson-item';
      lessonItem.innerHTML = `
        <span>${lesson.title}</span>
        <div class="item-actions">
          <button class="edit-special-lesson" data-index="${index}">Изменить</button>
          <button class="delete-special-lesson" data-index="${index}">Удалить</button>
        </div>
      `;
      specialLessonsList.appendChild(lessonItem);
      
      // Обработчик для редактирования специального урока
      lessonItem.querySelector('.edit-special-lesson').addEventListener('click', () => {
        this.editSpecialLesson(lesson, index);
      });
      
      // Обработчик для удаления специального урока
      lessonItem.querySelector('.delete-special-lesson').addEventListener('click', () => {
        this.deleteSpecialLesson(index);
      });
    });
  }
  
  /**
   * Редактирование обычного урока
   */
  editLesson(lesson, dayIndex, lessonIndex) {
    console.log(`Редактирование урока: ${lesson.title}`);
    
    // Заполняем форму данными урока
    document.getElementById('current-lesson-name').textContent = lesson.title;
    document.getElementById('lesson-id').value = lesson.id || '';
    document.getElementById('lesson-title').value = lesson.title || '';
    
    // Заполняем данные об источнике контента
    if (lesson.contentSource) {
      document.getElementById('content-source-type').value = lesson.contentSource.type || 'webhook';
      this.toggleSourceFields('content', lesson.contentSource.type);
      
      if (lesson.contentSource.type === 'webhook') {
        document.getElementById('content-webhook-url').value = lesson.contentSource.url || '';
        document.getElementById('content-fallback-type').value = lesson.contentSource.fallbackType || 'none';
        document.getElementById('content-fallback-id').value = lesson.contentSource.fallbackId || '';
      } else if (lesson.contentSource.type === 'local') {
        document.getElementById('content-local-id').value = lesson.contentSource.id || '';
      } else if (lesson.contentSource.type === 'markdown') {
        document.getElementById('content-markdown').value = lesson.contentSource.content || '';
      }
    } else {
      document.getElementById('content-source-type').value = 'webhook';
      this.toggleSourceFields('content', 'webhook');
    }
    
    // Заполняем данные об источнике теста
    if (lesson.testSource) {
      document.getElementById('test-source-type').value = lesson.testSource.type || 'none';
      this.toggleSourceFields('test', lesson.testSource.type);
      
      if (lesson.testSource.type === 'webhook') {
        document.getElementById('test-webhook-url').value = lesson.testSource.url || '';
        document.getElementById('test-fallback-type').value = lesson.testSource.fallbackType || 'none';
        document.getElementById('test-fallback-id').value = lesson.testSource.fallbackId || '';
      } else if (lesson.testSource.type === 'markdown') {
        document.getElementById('test-markdown-id').value = lesson.testSource.id || '';
        // Здесь можно добавить логику загрузки содержимого теста
      }
    } else {
      document.getElementById('test-source-type').value = 'none';
      this.toggleSourceFields('test', 'none');
    }
    
    // Заполняем данные о задании
    if (lesson.taskSource) {
      document.getElementById('task-source-type').value = lesson.taskSource.type || 'none';
      this.toggleSourceFields('task', lesson.taskSource.type);
      
      if (lesson.taskSource.type === 'markdown') {
        document.getElementById('task-markdown').value = lesson.taskSource.content || '';
      }
    } else {
      document.getElementById('task-source-type').value = 'none';
      this.toggleSourceFields('task', 'none');
    }
    
    // Заполняем данные об аудио
    if (lesson.audioSource) {
      document.getElementById('audio-source-type').value = lesson.audioSource.type || 'none';
      this.toggleSourceFields('audio', lesson.audioSource.type);
      
      if (lesson.audioSource.type === 'soundcloud') {
        document.getElementById('audio-soundcloud-url').value = lesson.audioSource.url || '';
        document.getElementById('audio-track-url').value = lesson.audioSource.trackUrl || '';
      }
    } else {
      document.getElementById('audio-source-type').value = 'none';
      this.toggleSourceFields('audio', 'none');
    }
    
    // Сохраняем индексы для последующего сохранения
    document.getElementById('lesson-form').dataset.dayIndex = dayIndex;
    document.getElementById('lesson-form').dataset.lessonIndex = lessonIndex;
    document.getElementById('lesson-form').dataset.isSpecial = 'false';
    
    // Показываем редактор урока
    document.getElementById('course-editor').classList.add('hidden');
    document.getElementById('lesson-editor').classList.remove('hidden');
  }
  
  /**
   * Редактирование специального урока
   */
  editSpecialLesson(lesson, index) {
    console.log(`Редактирование специального урока: ${lesson.title}`);
    
    // Заполняем форму аналогично обычному уроку...
    
    // Показываем редактор урока
    document.getElementById('course-editor').classList.add('hidden');
    document.getElementById('lesson-editor').classList.remove('hidden');
  }
  
  /**
   * Добавление нового урока
   */
  addLesson(dayIndex) {
    console.log(`Добавление нового урока в день ${dayIndex + 1}`);
    
    // Очищаем форму
    document.getElementById('current-lesson-name').textContent = 'Новый урок';
    document.getElementById('lesson-id').value = '';
    document.getElementById('lesson-title').value = '';
    
    // Заполняем исходные данные для нового урока
    document.getElementById('content-source-type').value = 'webhook';
    this.toggleSourceFields('content', 'webhook');
    document.getElementById('test-source-type').value = 'none';
    this.toggleSourceFields('test', 'none');
    document.getElementById('task-source-type').value = 'none';
    this.toggleSourceFields('task', 'none');
    document.getElementById('audio-source-type').value = 'none';
    this.toggleSourceFields('audio', 'none');
    
    // Сохраняем данные для последующего создания
    document.getElementById('lesson-form').dataset.dayIndex = dayIndex;
    document.getElementById('lesson-form').dataset.lessonIndex = -1; // Новый урок
    document.getElementById('lesson-form').dataset.isSpecial = 'false';
    
    // Показываем редактор урока
    document.getElementById('course-editor').classList.add('hidden');
    document.getElementById('lesson-editor').classList.remove('hidden');
  }
  
  /**
   * Сохранение изменений в уроке
   */
  saveLessonChanges() {
    const form = document.getElementById('lesson-form');
    const dayIndex = parseInt(form.dataset.dayIndex);
    const lessonIndex = parseInt(form.dataset.lessonIndex);
    const isSpecial = form.dataset.isSpecial === 'true';
    
    // Считываем данные из формы
    const lessonData = {
      id: document.getElementById('lesson-id').value,
      title: document.getElementById('lesson-title').value
    };
    
    // Считываем данные об источнике контента
    const contentSourceType = document.getElementById('content-source-type').value;
    if (contentSourceType !== 'none') {
      lessonData.contentSource = {
        type: contentSourceType
      };
      
      if (contentSourceType === 'webhook') {
        lessonData.contentSource.url = document.getElementById('content-webhook-url').value;
        const fallbackType = document.getElementById('content-fallback-type').value;
        if (fallbackType !== 'none') {
          lessonData.contentSource.fallbackType = fallbackType;
          lessonData.contentSource.fallbackId = document.getElementById('content-fallback-id').value;
        }
      } else if (contentSourceType === 'local') {
        lessonData.contentSource.id = document.getElementById('content-local-id').value;
      } else if (contentSourceType === 'markdown') {
        lessonData.contentSource.content = document.getElementById('content-markdown').value;
      }
    }
    
    // Считываем данные об источнике теста
    const testSourceType = document.getElementById('test-source-type').value;
    if (testSourceType !== 'none') {
      lessonData.testSource = {
        type: testSourceType
      };
      
      if (testSourceType === 'webhook') {
        lessonData.testSource.url = document.getElementById('test-webhook-url').value;
        const fallbackType = document.getElementById('test-fallback-type').value;
        if (fallbackType !== 'none') {
          lessonData.testSource.fallbackType = fallbackType;
          lessonData.testSource.fallbackId = document.getElementById('test-fallback-id').value;
        }
      } else if (testSourceType === 'markdown') {
        lessonData.testSource.id = document.getElementById('test-markdown-id').value;
        // Здесь может быть логика для сохранения содержимого теста в файл
      }
    }
    
    // Считываем данные о задании
    const taskSourceType = document.getElementById('task-source-type').value;
    if (taskSourceType !== 'none') {
      lessonData.taskSource = {
        type: taskSourceType
      };
      
      if (taskSourceType === 'markdown') {
        lessonData.taskSource.content = document.getElementById('task-markdown').value;
      }
    }
    
    // Считываем данные об аудио
    const audioSourceType = document.getElementById('audio-source-type').value;
    if (audioSourceType !== 'none') {
      lessonData.audioSource = {
        type: audioSourceType
      };
      
      if (audioSourceType === 'soundcloud') {
        lessonData.audioSource.url = document.getElementById('audio-soundcloud-url').value;
        lessonData.audioSource.trackUrl = document.getElementById('audio-track-url').value;
      }
    }
    
    // Сохраняем изменения
    if (isSpecial) {
      // Сохраняем специальный урок
      if (lessonIndex === -1) {
        // Новый урок
        if (!this.currentCourseData.specialLessons) {
          this.currentCourseData.specialLessons = [];
        }
        this.currentCourseData.specialLessons.push(lessonData);
      } else {
        // Обновляем существующий
        this.currentCourseData.specialLessons[lessonIndex] = lessonData;
      }
    } else {
      // Сохраняем обычный урок
      if (lessonIndex === -1) {
        // Новый урок
        if (!this.currentCourseData.days[dayIndex].lessons) {
          this.currentCourseData.days[dayIndex].lessons = [];
        }
        this.currentCourseData.days[dayIndex].lessons.push(lessonData);
      } else {
        // Обновляем существующий
        this.currentCourseData.days[dayIndex].lessons[lessonIndex] = lessonData;
      }
    }
    
    // Обновляем списки в интерфейсе
    this.loadDaysList(this.currentCourseData.id);
    this.loadSpecialLessonsList(this.currentCourseData.id);
    
    // Возвращаемся к редактору курса
    document.getElementById('lesson-editor').classList.add('hidden');
    document.getElementById('course-editor').classList.remove('hidden');
    
    console.log('Урок сохранен', lessonData);
  }
  
  /**
   * Сохранение изменений в курсе
   */
  saveCourseChanges() {
    // Здесь может быть логика для сохранения изменений курса в хранилище
    // Например, через API или localStorage
    
    console.log('Сохранение изменений курса', this.currentCourseData);
    
    // Экспортируем данные в JSON строку
    const json = JSON.stringify(this.currentCourseData, null, 2);
    
    // Для демонстрации просто выводим в консоль
    console.log(json);
    
    // В реальном приложении здесь был бы код для отправки данных на сервер
    alert('Изменения сохранены для демонстрации. В реальном приложении здесь была бы отправка данных на сервер или сохранение в файл.');
  }
  
  /**
   * Экспорт данных курса
   */
  exportCourseData() {
    // Создаем JSON строку с данными курса
    const json = JSON.stringify(this.currentCourseData, null, 2);
    
    // Создаем blob
    const blob = new Blob([json], { type: 'application/json' });
    
    // Создаем ссылку для скачивания
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.currentCourseData.id || 'course'}.json`;
    
    // Добавляем ссылку в документ и эмулируем клик
    document.body.appendChild(a);
    a.click();
    
    // Удаляем ссылку
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  }
  
  /**
   * Показать админ-панель
   */
  show() {
    this.initialize().then(() => {
      this.container.classList.remove('hidden');
    });
  }
  
  /**
   * Скрыть админ-панель
   */
  hide() {
    this.container.classList.add('hidden');
  }
}

// Создаем и экспортируем синглтон админ-панели
const adminPanel = new AdminPanel();
export default adminPanel;

// Для удобства тестирования добавляем глобальную функцию
window.openAdminPanel = function() {
  adminPanel.show();
};

// Инициализируем скрытую панель горячими клавишами
document.addEventListener('DOMContentLoaded', () => {
  console.log('Админ-панель доступна по Alt+Shift+A');
});
