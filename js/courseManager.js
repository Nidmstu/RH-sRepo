
/**
 * Course Manager Module
 * Отвечает за загрузку и управление всеми данными курсов
 */
class CourseManager {
  constructor() {
    this.courses = null;
    this.fallbacks = null;
    this.currentProfession = "prompt-engineer";
    this.currentDay = null;
    this.currentLesson = null;
  }

  /**
   * Инициализирует менеджер курсов
   */
  async initialize() {
    try {
      // Загружаем структуру курсов с обработкой ошибок
      console.log('Загрузка структуры курсов...');
      let coursesResponse;
      try {
        coursesResponse = await fetch('data/courses.json');
        
        if (!coursesResponse.ok) {
          throw new Error(`Сервер вернул ошибку: ${coursesResponse.status} ${coursesResponse.statusText}`);
        }
        
        const coursesText = await coursesResponse.text();
        try {
          this.courses = JSON.parse(coursesText);
          console.log('Курсы успешно загружены и распарсены', Object.keys(this.courses));
        } catch (jsonError) {
          console.error('Ошибка при парсинге JSON курсов:', jsonError);
          console.log('Содержимое файла курсов (первые 100 символов):', coursesText.slice(0, 100));
          // Используем пустой объект курсов в случае ошибки парсинга
          this.courses = {
            "prompt-engineer": {
              "title": "Prompt Engineering Onboarding",
              "days": [],
              "specialLessons": [],
              "noDayLessons": []
            }
          };
        }
      } catch (fetchError) {
        console.error('Ошибка при загрузке файла курсов:', fetchError);
        // Создаем базовую структуру если не удалось загрузить файл
        this.courses = {
          "prompt-engineer": {
            "title": "Prompt Engineering Onboarding",
            "days": [],
            "specialLessons": [],
            "noDayLessons": []
          }
        };
      }

      // Загружаем резервный контент
      console.log('Загрузка резервного контента...');
      try {
        const fallbacksResponse = await fetch('data/fallbacks.json');
        if (!fallbacksResponse.ok) {
          console.warn('Не удалось загрузить резервный контент, будет использоваться базовый');
          this.fallbacks = {};
        } else {
          const fallbacksText = await fallbacksResponse.text();
          try {
            this.fallbacks = JSON.parse(fallbacksText);
          } catch (jsonError) {
            console.error('Ошибка при парсинге JSON резервного контента:', jsonError);
            this.fallbacks = {};
          }
        }
      } catch (fallbackError) {
        console.error('Ошибка при загрузке файла резервного контента:', fallbackError);
        this.fallbacks = {};
      }

      console.log('CourseManager инициализирован успешно');
      return true;
    } catch (error) {
      console.error('Критическая ошибка при инициализации CourseManager:', error);
      alert('Произошла ошибка при загрузке курсов. Пожалуйста, обновите страницу или обратитесь к администратору.');
      return false;
    }
  }

  /**
   * Получить список всех профессий
   */
  getProfessions() {
    if (!this.courses || typeof this.courses !== 'object') {
      console.error('Объект courses не определен или не является объектом:', this.courses);
      return [];
    }
    return Object.keys(this.courses);
  }

  /**
   * Переключиться на другую профессию
   */
  switchProfession(professionId) {
    if (this.courses[professionId]) {
      this.currentProfession = professionId;
      this.currentDay = null;
      this.currentLesson = null;
      return true;
    }
    return false;
  }

  /**
   * Проверить, имеет ли профессия redirect URL
   */
  hasRedirect(professionId = this.currentProfession) {
    return this.courses[professionId]?.redirectUrl !== undefined;
  }

  /**
   * Получить redirect URL для профессии
   */
  getRedirectUrl(professionId = this.currentProfession) {
    return this.courses[professionId]?.redirectUrl;
  }

  /**
   * Получить дни обучения для текущей профессии
   */
  getDays() {
    if (!this.courses[this.currentProfession] || !this.courses[this.currentProfession].days) {
      return [];
    }
    return this.courses[this.currentProfession].days;
  }

  /**
   * Получить специальные уроки (словарь и т.д.)
   */
  getSpecialLessons() {
    if (!this.courses[this.currentProfession] || !this.courses[this.currentProfession].specialLessons) {
      return [];
    }
    return this.courses[this.currentProfession].specialLessons;
  }

  /**
   * Выбрать день обучения
   */
  selectDay(dayId) {
    const day = this.getDays().find(d => d.id === dayId);
    if (day) {
      this.currentDay = day;
      this.currentLesson = null;
      return day;
    }
    return null;
  }

  /**
   * Получить уроки для текущего дня
   */
  getLessonsForCurrentDay() {
    if (!this.currentDay) return [];
    return this.currentDay.lessons || [];
  }

  /**
   * Выбрать урок
   */
  selectLesson(lessonId) {
    // Сначала ищем в текущем дне
    if (this.currentDay) {
      const lesson = this.currentDay.lessons.find(l => l.id === lessonId);
      if (lesson) {
        this.currentLesson = lesson;
        return lesson;
      }
    }
    
    // Затем ищем в специальных уроках
    const specialLesson = this.getSpecialLessons().find(l => l.id === lessonId);
    if (specialLesson) {
      this.currentLesson = specialLesson;
      return specialLesson;
    }
    
    return null;
  }

  /**
   * Загрузить контент для урока
   */
  async fetchLessonContent(lesson = this.currentLesson) {
    if (!lesson) {
      throw new Error('Урок не выбран');
    }

    try {
      const contentSource = lesson.contentSource;
      
      // Если источник - вебхук
      if (contentSource.type === 'webhook') {
        try {
          console.log(`Загрузка контента с вебхука: ${contentSource.url}`);
          
          const response = await fetch(contentSource.url, {
            method: 'GET',
            headers: {
              'Accept': 'text/plain, text/markdown, application/json, */*'
            },
            mode: 'cors',
            cache: 'no-cache'
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          
          let content = await response.text();
          
          // Если ответ выглядит как JSON, попробуем извлечь текст
          if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
            try {
              const json = JSON.parse(content);
              if (json.text) content = json.text;
              else if (json.content) content = json.content;
              else if (json.markdown) content = json.markdown;
            } catch (e) {
              console.log('Не удалось распарсить JSON, используем ответ как текст');
            }
          }
          
          return content;
        } catch (error) {
          console.error(`Ошибка при загрузке с вебхука: ${error.message}`);
          
          // Используем резервный контент, если есть
          if (contentSource.fallbackType === 'local' && contentSource.fallbackId) {
            console.log(`Используем локальный резервный контент: ${contentSource.fallbackId}`);
            return this.fallbacks[contentSource.fallbackId] || 
                   `# ${lesson.title}\n\nНе удалось загрузить контент для этого урока.`;
          }
        }
      }
      
      // Если источник - локальный
      else if (contentSource.type === 'local' && contentSource.id) {
        return this.fallbacks[contentSource.id] || 
               `# ${lesson.title}\n\nКонтент не найден.`;
      }
      
      // Если источник - непосредственно маркдаун
      else if (contentSource.type === 'markdown' && contentSource.content) {
        return contentSource.content;
      }
      
      // Если не удалось получить контент никаким способом
      return `# ${lesson.title}\n\nНе удалось загрузить контент для этого урока.`;
    } catch (error) {
      console.error('Ошибка при загрузке контента:', error);
      return `# ${lesson.title}\n\nПроизошла ошибка при загрузке контента:\n\n${error.message}`;
    }
  }

  /**
   * Загрузить тест для урока
   */
  async fetchTest(lesson = this.currentLesson) {
    if (!lesson || !lesson.testSource) {
      return null;
    }

    try {
      const testSource = lesson.testSource;
      
      // Если источник - вебхук
      if (testSource.type === 'webhook') {
        try {
          const response = await fetch(testSource.url, {
            method: 'GET',
            headers: {
              'Accept': 'text/plain, text/markdown, application/json, */*'
            },
            mode: 'cors',
            cache: 'no-cache'
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          
          let content = await response.text();
          
          // Если ответ выглядит как JSON, попробуем извлечь текст
          if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
            try {
              const json = JSON.parse(content);
              if (json.test) content = json.test;
              else if (json.content) content = json.content;
              else if (json.markdown) content = json.markdown;
            } catch (e) {
              console.log('Не удалось распарсить JSON, используем ответ как текст');
            }
          }
          
          return content;
        } catch (error) {
          console.error(`Ошибка при загрузке теста с вебхука: ${error.message}`);
          
          // Используем резервный контент, если есть
          if (testSource.fallbackType === 'markdown' && testSource.fallbackId) {
            try {
              const response = await fetch(`data/tests/${testSource.fallbackId}.md`);
              if (response.ok) {
                return await response.text();
              }
            } catch (e) {
              console.error(`Не удалось загрузить локальный тест: ${e.message}`);
            }
          }
        }
      }
      
      // Если источник - локальный markdown
      else if (testSource.type === 'markdown' && testSource.id) {
        try {
          const response = await fetch(`data/tests/${testSource.id}.md`);
          if (response.ok) {
            return await response.text();
          }
        } catch (e) {
          console.error(`Не удалось загрузить локальный тест: ${e.message}`);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Ошибка при загрузке теста:', error);
      return null;
    }
  }

  /**
   * Получить задание для урока
   */
  getTask(lesson = this.currentLesson) {
    if (!lesson || !lesson.taskSource) {
      return null;
    }

    const taskSource = lesson.taskSource;
    
    // Если источник - непосредственно маркдаун
    if (taskSource.type === 'markdown' && taskSource.content) {
      return taskSource.content;
    }
    
    return null;
  }

  /**
   * Получить информацию об аудио для урока
   */
  getAudioInfo(lesson = this.currentLesson) {
    if (!lesson || !lesson.audioSource) {
      return null;
    }
    
    return lesson.audioSource;
  }
}

// Экспортируем синглтон
const courseManager = new CourseManager();
export default courseManager;
