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
      // Загружаем структуру курсов
      const coursesResponse = await fetch('data/courses.json');
      if (!coursesResponse.ok) {
        throw new Error(`Не удалось загрузить структуру курсов: ${coursesResponse.status}`);
      }
      this.courses = await coursesResponse.json();

      // Загружаем резервный контент
      const fallbacksResponse = await fetch('data/fallbacks.json');
      if (!fallbacksResponse.ok) {
        console.warn('Не удалось загрузить резервный контент, будет использоваться базовый');
        this.fallbacks = {};
      } else {
        this.fallbacks = await fallbacksResponse.json();
      }

      console.log('CourseManager инициализирован успешно');
      return true;
    } catch (error) {
      console.error('Ошибка при инициализации CourseManager:', error);
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
  async fetchLessonContent() {
    if (!this.currentLesson) return null;

    const source = this.currentLesson.contentSource;
    if (!source) return null;

    // Показываем индикатор загрузки
    this.showLoadingIndicator();

    try {
      let content = '';

      if (source.type === 'webhook' && source.url) {
        // Пытаемся загрузить контент с вебхука
        try {
          // Добавляем информацию для режима разработчика
          if (window.devMode && window.devMode.enabled) {
            console.log(`🔧 [DevMode] Загрузка контента урока '${this.currentLesson.title}' с URL: ${source.url}`);
          }

          const response = await fetch(source.url);
          content = await response.text();

          // Добавляем информацию для режима разработчика
          if (window.devMode && window.devMode.enabled) {
            console.log(`🔧 [DevMode] Контент урока успешно загружен (${content.length} символов)`);
          }
        } catch (error) {
          console.error('Ошибка загрузки контента с вебхука:', error);

          // Если есть резервный источник, используем его
          if (source.fallbackType === 'local' && source.fallbackId) {
            console.log('Используем резервный локальный контент:', source.fallbackId);

            // Добавляем информацию для режима разработчика
            if (window.devMode && window.devMode.enabled) {
              console.log(`🔧 [DevMode] Использование резервного контента с ID: ${source.fallbackId}`);
            }

            content = await this.fetchLocalContent(source.fallbackId);
          } else {
            throw error;
          }
        }
      } else if (source.type === 'local' && source.id) {
        // Загружаем локальный контент
        if (window.devMode && window.devMode.enabled) {
          console.log(`🔧 [DevMode] Загрузка локального контента с ID: ${source.id}`);
        }

        content = await this.fetchLocalContent(source.id);
      } else if (source.type === 'markdown' && source.content) {
        // Используем встроенный Markdown контент
        if (window.devMode && window.devMode.enabled) {
          console.log(`🔧 [DevMode] Использование встроенного Markdown контента (${source.content.length} символов)`);
        }

        content = source.content;
      }

      // Скрываем индикатор загрузки
      this.hideLoadingIndicator();

      return content;
    } catch (error) {
      console.error('Ошибка при загрузке контента урока:', error);

      // Добавляем информацию для режима разработчика
      if (window.devMode && window.devMode.enabled) {
        console.log(`🔧 [DevMode] Ошибка при загрузке контента урока: ${error.message}`);
      }

      // Скрываем индикатор загрузки
      this.hideLoadingIndicator();

      throw error;
    }
  }

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

  showLoadingIndicator() {
    //Implementation for showing loading indicator
  }

  hideLoadingIndicator() {
    //Implementation for hiding loading indicator
  }

  async fetchLocalContent(id) {
    try {
      const response = await fetch(`data/content/${id}.md`);
      if (response.ok) {
        return await response.text();
      } else {
        throw new Error(`Не удалось загрузить локальный контент с ID ${id}: ${response.status}`);
      }
    } catch (error) {
      console.error("Ошибка загрузки локального контента:", error);
      return null;
    }
  }
}

// Экспортируем синглтон
const courseManager = new CourseManager();
export default courseManager;