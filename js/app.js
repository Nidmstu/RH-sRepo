
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
  
  // Инициализируем менеджер курсов
  const success = await courseManager.initialize();
  if (!success) {
    alert('Не удалось загрузить данные курсов. Попробуйте перезагрузить страницу.');
    return;
  }
  
  // Настраиваем обработчики событий
  setupEventListeners();
  
  // Отображаем начальный интерфейс
  renderHomePage();
  
  console.log('Приложение инициализировано успешно');
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
  showSection('home');
  daySelectionContainer.classList.remove('hidden');
  taskSelectionContainer.classList.add('hidden');
}

// Обработчик смены профессии
function handleProfessionChange() {
  const selectedProfession = professionSelect.value;
  
  // Проверяем, имеет ли профессия перенаправление
  if (courseManager.hasRedirect(selectedProfession)) {
    const redirectUrl = courseManager.getRedirectUrl(selectedProfession);
    if (redirectUrl) {
      window.location.href = redirectUrl;
      return;
    }
  }
  
  // Если нет перенаправления, переключаемся на эту профессию
  courseManager.switchProfession(selectedProfession);
  renderHomePage();
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
  dayHeader.innerText = day.title;
  daySelectionContainer.classList.add('hidden');
  taskSelectionContainer.classList.remove('hidden');
  
  // Получаем уроки для этого дня и генерируем кнопки
  const lessons = courseManager.getLessonsForCurrentDay();
  taskButtonsDiv.innerHTML = '';
  lessons.forEach(lesson => {
    const btn = document.createElement('button');
    btn.innerText = lesson.title;
    btn.onclick = function() { selectLesson(lesson.id); };
    taskButtonsDiv.appendChild(btn);
  });
};

// Выбор урока
window.selectLesson = function(lessonId) {
  // Используем менеджер курсов для выбора урока
  const lesson = courseManager.selectLesson(lessonId);
  if (!lesson) {
    console.error(`Урок с ID ${lessonId} не найден`);
    return;
  }
  
  // Обновляем интерфейс
  guideTitle.innerText = `Guide: ${lesson.title}`;
  
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
  
  // Проверяем, есть ли аудио для урока
  const audioInfo = courseManager.getAudioInfo();
  if (audioInfo) {
    // Логика отображения соответствующего аудио будет добавлена здесь
    if (lessonId === 'vocabulary') {
      document.getElementById('audio-vocabulary').classList.remove('hidden');
    } else if (lessonId === 'what-prompting-is') {
      document.getElementById('audio-first-lesson').classList.remove('hidden');
    }
  }
  
  // Показываем страницу гайда и загружаем контент
  showSection('guide');
  loadLessonContent();
};

// Открытие теста
function openTest(lesson) {
  // Открываем тест в новой вкладке или выполняем другую логику
  if (lesson.testSource && lesson.testSource.url) {
    window.open(lesson.testSource.url, '_blank');
  }
}

// Загрузка контента урока
async function loadLessonContent() {
  loadingSpinner.classList.remove('hidden');
  markdownContent.classList.add('hidden');
  
  try {
    // Получаем контент через менеджер курсов
    const content = await courseManager.fetchLessonContent();
    
    // Форматируем контент
    const formattedHTML = createCollapsibleBlocks(content);
    
    // Отображаем контент
    markdownContent.innerHTML = formattedHTML;
    loadingSpinner.classList.add('hidden');
    markdownContent.classList.remove('hidden');
    
    // Проверяем, есть ли задание для этого урока
    const task = courseManager.getTask();
    if (task) {
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
  } catch (error) {
    console.error('Ошибка при загрузке контента урока:', error);
    markdownContent.innerHTML = `
      <div style="background-color: #fff0f0; padding: 15px; border-left: 4px solid #ff0000; margin-bottom: 20px;">
        <h3>Ошибка загрузки контента</h3>
        <p>Пожалуйста, обратитесь к руководителю команды.</p>
        <p><strong>Причина:</strong> ${error.message || error.toString()}</p>
      </div>
    `;
    loadingSpinner.classList.add('hidden');
    markdownContent.classList.remove('hidden');
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
    'audio-first-lesson',
    'audio-vocabulary'
  ];
  audioIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
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
  // Имплементация функции createCollapsibleBlocks из вашего кода
  // ...
  
  // Упрощенная версия для примера
  return marked.parse(markdown);
}

// Редирект на страницу администрирования
window.openAdminPanel = function() {
  window.location.href = 'admin.html';
};

// Инициализация приложения при загрузке
document.addEventListener('DOMContentLoaded', initApp);
