
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
  
  // Настраиваем периодическую синхронизацию с облаком (каждые 5 минут)
  setupCloudSync();
  
  console.log('Приложение инициализировано успешно');
}

// Настройка периодической синхронизации с облаком
function setupCloudSync() {
  const syncInterval = 60 * 1000; // 1 минута - более частая синхронизация для оперативного обновления
  
  // Функция для проверки необходимости синхронизации и её выполнения
  const syncWithCloud = async () => {
    // Проверяем наличие настроек вебхуков
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
    
    // Если URL не найден в webhookSettings, проверяем другие источники
    if (!importWebhookUrl) {
      importWebhookUrl = localStorage.getItem('importWebhookUrl') || 
                          localStorage.getItem('adminImportWebhook') || 
                          localStorage.getItem('testImportUrl');
    }
    
    // Если найден URL импорта, используем его
    if (importWebhookUrl) {
      if (window.devMode && window.devMode.enabled) {
        console.log('🔧 [DevMode] Выполняется периодическая синхронизация с облаком');
        console.log(`🔧 [DevMode] URL для импорта: ${importWebhookUrl}`);
      }
      
      await tryImportFromUrl(importWebhookUrl);
    } else {
      console.log('URL вебхука для импорта не найден, синхронизация пропущена');
    }
  };
  
  // Функция для импорта данных с указанного URL
  const tryImportFromUrl = async (url) => {
    console.log(`Синхронизация с облаком: ${url}`);
    
    try {
      // Получаем данные с вебхука
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        },
        cache: 'no-store' // Всегда получаем свежие данные
      });
      
      if (!response.ok) {
        console.error(`Ошибка при синхронизации: HTTP ${response.status}`);
        return;
      }
      
      // Получаем текст ответа
      const responseText = await response.text();
      
      // Пытаемся обработать данные
      try {
        let importData;
        
        // Пробуем распарсить JSON
        try {
          importData = JSON.parse(responseText);
        } catch (jsonError) {
          console.log('Не удалось распарсить ответ как JSON, ищем JSON в тексте');
          
          // Пробуем найти JSON в тексте
          const jsonRegex = /{[\s\S]*}/;
          const match = responseText.match(jsonRegex);
          
          if (match && match[0]) {
            importData = JSON.parse(match[0]);
          } else {
            throw new Error('Не удалось извлечь JSON из ответа');
          }
        }
        
        // Ищем данные о курсах в разных форматах
        let coursesData = null;
        
        // Вариант 1: Прямой объект courses
        if (importData.courses) {
          coursesData = importData.courses;
          if (window.devMode && window.devMode.enabled) {
            console.log('🔧 [DevMode] Найдены курсы в поле courses');
          }
        }
        // Вариант 2: Данные в поле data
        else if (importData.data) {
          if (typeof importData.data === 'object') {
            coursesData = importData.data;
            if (window.devMode && window.devMode.enabled) {
              console.log('🔧 [DevMode] Найдены курсы в поле data (объект)');
            }
          } else if (typeof importData.data === 'string') {
            // Пытаемся распарсить JSON строку
            try {
              const parsedData = JSON.parse(importData.data);
              coursesData = parsedData.courses || parsedData;
              if (window.devMode && window.devMode.enabled) {
                console.log('🔧 [DevMode] Найдены курсы в поле data (JSON строка)');
              }
            } catch (e) {
              console.log(`Не удалось распарсить JSON в поле data: ${e.message}`);
            }
          }
        }
        // Вариант 3: Данные в поле content как объект
        else if (importData.content && typeof importData.content === 'object') {
          coursesData = importData.content;
          if (window.devMode && window.devMode.enabled) {
            console.log('🔧 [DevMode] Найдены курсы в поле content (объект)');
          }
        }
        // Вариант 4: Прямое использование root объекта как courses
        else if (typeof importData === 'object') {
          // Проверяем структуру
          const hasValidStructure = Object.values(importData).some(value => {
            return value && typeof value === 'object' && 
                  (value.days || value.specialLessons || value.title || value.redirectUrl || value.noDayLessons);
          });
          
          if (hasValidStructure) {
            coursesData = importData;
            if (window.devMode && window.devMode.enabled) {
              console.log('🔧 [DevMode] Использование корневого объекта как courses');
            }
          }
        }
        
        if (coursesData) {
          // Проверка и валидация структуры
          const isValid = validateCoursesStructure(coursesData);
          if (!isValid) {
            console.error('Неверная структура данных курсов');
            return;
          }
          
          // Сравниваем с текущими данными
          const currentCoursesJson = JSON.stringify(courseManager.courses);
          const newCoursesJson = JSON.stringify(coursesData);
          
          if (currentCoursesJson !== newCoursesJson) {
            if (window.devMode && window.devMode.enabled) {
              console.log('🔧 [DevMode] Обнаружены изменения данных, применяем обновления из облака');
            }
            
            // Сохраняем резервную копию текущих данных
            localStorage.setItem('coursesBackup', currentCoursesJson);
            localStorage.setItem('coursesBackupTimestamp', new Date().toISOString());
            
            // Кешируем все URL вебхуков из уроков для быстрого доступа
            cacheWebhookUrls(coursesData);
            
            // Применяем новые данные
            courseManager.courses = coursesData;
            
            // Если мы находимся на странице курса, полностью обновляем интерфейс
            if (courseManager.currentProfession) {
              console.log('Обновляем интерфейс после синхронизации с облаком');
              
              // Сохраняем текущие выбранные значения
              const currentProfession = courseManager.currentProfession;
              const currentDayId = courseManager.currentDay ? courseManager.currentDay.id : null;
              const currentLessonId = courseManager.currentLesson ? courseManager.currentLesson.id : null;
              
              // Обновляем список профессий в селекторе
              updateProfessionSelector();
              
              // Переключаемся на ту же профессию для обновления данных
              courseManager.switchProfession(currentProfession);
              
              // Обновляем список дней
              updateDaysList();
              
              // Если был выбран день, пытаемся выбрать его снова
              if (currentDayId) {
                courseManager.selectDay(currentDayId);
                updateLessonsList(); // Обновляем список уроков
                
                // Если был выбран урок, пытаемся выбрать его снова и обновить контент
                if (currentLessonId) {
                  courseManager.selectLesson(currentLessonId);
                  // Перезагружаем контент текущего урока
                  if (document.getElementById('guide').classList.contains('hidden') === false) {
                    loadLessonContent();
                  }
                }
              }
            }
            
            console.log('Синхронизация с облаком успешно завершена, интерфейс обновлен');
          } else if (window.devMode && window.devMode.enabled) {
            console.log('🔧 [DevMode] Данные актуальны, синхронизация не требуется');
          }
        } else {
          console.log('Не удалось найти данные о курсах в ответе');
        }
      } catch (parseError) {
        console.error('Ошибка при обработке данных:', parseError);
      }
    } catch (error) {
      console.error('Ошибка при синхронизации с облаком:', error);
      if (window.devMode && window.devMode.enabled) {
        console.log(`🔧 [DevMode] Ошибка синхронизации: ${error.message}`);
      }
    }
  };
  
  // Функция для валидации структуры данных курсов
  const validateCoursesStructure = (coursesData) => {
    if (!coursesData || typeof coursesData !== 'object') {
      return false;
    }
    
    // Проверяем наличие хотя бы одного курса с правильной структурой
    const courseKeys = Object.keys(coursesData);
    return courseKeys.length > 0 && 
      courseKeys.some(key => {
        const course = coursesData[key];
        return course && typeof course === 'object' && 
               (course.days || course.specialLessons || course.redirectUrl || course.noDayLessons);
      });
  };
  
  // Функция для кеширования всех URL вебхуков из уроков
  const cacheWebhookUrls = (coursesData) => {
    const webhookUrls = {};
    
    // Проходим по всем курсам
    Object.keys(coursesData).forEach(professionId => {
      const course = coursesData[professionId];
      
      // Проверяем дни и уроки в них
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
      
      // Проверяем специальные уроки
      if (course.specialLessons && Array.isArray(course.specialLessons)) {
        course.specialLessons.forEach(lesson => {
          if (lesson.contentSource && lesson.contentSource.type === 'webhook' && lesson.contentSource.url) {
            const key = `${professionId}_special_${lesson.id}`;
            webhookUrls[key] = lesson.contentSource.url;
          }
        });
      }
      
      // Проверяем уроки без дней
      if (course.noDayLessons && Array.isArray(course.noDayLessons)) {
        course.noDayLessons.forEach(lesson => {
          if (lesson.contentSource && lesson.contentSource.type === 'webhook' && lesson.contentSource.url) {
            const key = `${professionId}_noday_${lesson.id}`;
            webhookUrls[key] = lesson.contentSource.url;
          }
        });
      }
    });
    
    // Сохраняем кеш URL вебхуков в localStorage
    localStorage.setItem('webhookUrlsCache', JSON.stringify(webhookUrls));
    
    if (window.devMode && window.devMode.enabled) {
      console.log(`🔧 [DevMode] Кешировано ${Object.keys(webhookUrls).length} URL вебхуков для уроков`);
    }
  };
  
  // Функция для обновления селектора профессий
  const updateProfessionSelector = () => {
    const professionSelect = document.getElementById('profession-select');
    if (!professionSelect) return;
    
    // Сохраняем текущее выбранное значение
    const currentValue = professionSelect.value;
    
    // Получаем список профессий
    const professions = courseManager.getProfessions();
    
    // Очищаем селектор
    professionSelect.innerHTML = '';
    
    // Добавляем опции для каждой профессии
    professions.forEach(professionId => {
      const course = courseManager.courses[professionId];
      const option = document.createElement('option');
      option.value = professionId;
      option.textContent = course.title || professionId;
      professionSelect.appendChild(option);
    });
    
    // Восстанавливаем выбранное значение, если оно все еще доступно
    if (professions.includes(currentValue)) {
      professionSelect.value = currentValue;
    }
  };
  
  // Функция для обновления списка дней
  const updateDaysList = () => {
    const daySelectionContainer = document.getElementById('day-selection');
    if (!daySelectionContainer) return;
    
    // Получаем список дней
    const days = courseManager.getDays();
    
    // Очищаем контейнер
    const container = daySelectionContainer.querySelector('.content-cards') || daySelectionContainer;
    container.innerHTML = '';
    
    // Добавляем карточки для каждого дня
    days.forEach(day => {
      const card = document.createElement('div');
      card.className = 'course-card';
      card.innerHTML = `
        <h3>${day.title || `День ${day.id}`}</h3>
        <p>${day.description || 'Нажмите, чтобы просмотреть уроки'}</p>
      `;
      card.onclick = () => selectDay(day.id);
      container.appendChild(card);
    });
  };
  
  // Функция для обновления списка уроков
  const updateLessonsList = () => {
    if (!courseManager.currentDay) return;
    
    const taskButtonsDiv = document.getElementById('task-buttons');
    if (!taskButtonsDiv) return;
    
    // Очищаем список уроков
    taskButtonsDiv.innerHTML = '';
    
    // Получаем уроки для текущего дня
    const lessons = courseManager.getLessonsForCurrentDay();
    
    // Добавляем кнопки для каждого урока
    lessons.forEach(lesson => {
      const btn = document.createElement('button');
      btn.innerText = lesson.title;
      btn.onclick = function() { selectLesson(lesson.id); };
      taskButtonsDiv.appendChild(btn);
    });
  };
  
  // Запускаем синхронизацию при запуске приложения и периодически
  syncWithCloud();
  setInterval(syncWithCloud, syncInterval);
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
  
  // Сохраняем текущий урок и логируем информацию
  console.log(`Выбран урок: ${lesson.title} (ID: ${lesson.id})`);
  
  // Логгируем информацию об источнике контента
  if (lesson.contentSource) {
    console.log(`Источник контента: ${lesson.contentSource.type}`);
    if (lesson.contentSource.type === 'webhook') {
      console.log(`URL вебхука: ${lesson.contentSource.url}`);
      
      // Проверяем, не изменился ли URL вебхука по сравнению с кешированным
      const cacheKey = `${courseManager.currentProfession}_${courseManager.currentDay ? courseManager.currentDay.id : 'special'}_${lesson.id}`;
      const cachedUrl = getCachedWebhookUrl(cacheKey);
      
      if (cachedUrl && cachedUrl !== lesson.contentSource.url) {
        console.log(`Обнаружено изменение URL вебхука для урока ${lesson.id}`);
        console.log(`Предыдущий URL: ${cachedUrl}`);
        console.log(`Новый URL: ${lesson.contentSource.url}`);
      }
    }
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
  
  // Проверяем и отображаем аудио для урока
  const audioInfo = courseManager.getAudioInfo();
  if (audioInfo) {
    // Логика отображения соответствующего аудио
    if (lessonId === 'vocabulary') {
      const vocabAudio = document.getElementById('audio-vocabulary');
      if (vocabAudio) {
        vocabAudio.classList.remove('hidden');
        // Обновляем источник аудио, если он изменился
        if (audioInfo.trackUrl) {
          const iframe = vocabAudio.querySelector('iframe');
          if (iframe && iframe.src !== audioInfo.trackUrl) {
            iframe.src = audioInfo.trackUrl;
          }
        }
      }
    } else if (lessonId === 'what-prompting-is') {
      const firstLessonAudio = document.getElementById('audio-first-lesson');
      if (firstLessonAudio) {
        firstLessonAudio.classList.remove('hidden');
        // Обновляем источник аудио, если он изменился
        if (audioInfo.trackUrl) {
          const iframe = firstLessonAudio.querySelector('iframe');
          if (iframe && iframe.src !== audioInfo.trackUrl) {
            iframe.src = audioInfo.trackUrl;
          }
        }
      }
    }
  }
  
  // Показываем страницу гайда и загружаем контент
  showSection('guide');
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
