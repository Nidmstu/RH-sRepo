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
      // Получаем URL вебхука для импорта из localStorage
      const importWebhookUrl = localStorage.getItem('importWebhookUrl');
      
      if (window.devMode && window.devMode.enabled) {
        console.log('🔧 [DevMode] Начало инициализации CourseManager');
        if (importWebhookUrl) {
          console.log(`🔧 [DevMode] Будет использован вебхук для импорта: ${importWebhookUrl}`);
        } else {
          console.log('🔧 [DevMode] URL вебхука для импорта не найден в localStorage, будет использован локальный файл');
        }
      }
      
      // Пытаемся загрузить структуру курсов с вебхука импорта, если он настроен
      if (importWebhookUrl) {
        try {
          if (window.devMode && window.devMode.enabled) {
            console.log(`🔧 [DevMode] Отправка запроса на вебхук импорта: ${importWebhookUrl}`);
          }
          
          const importResponse = await fetch(importWebhookUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
          
          if (importResponse.ok) {
            const importData = await importResponse.json();
            
            if (window.devMode && window.devMode.enabled) {
              console.log('🔧 [DevMode] Успешно получены данные с вебхука импорта');
              console.log('🔧 [DevMode] Размер полученных данных:', JSON.stringify(importData).length, 'байт');
            }
            
            // Проверяем структуру полученных данных
            if (importData.courses) {
              this.courses = importData.courses;
              console.log('Курсы успешно загружены с вебхука импорта');
              
              // Сохраняем копию в localStorage для резервного восстановления
              localStorage.setItem('coursesBackup', JSON.stringify(this.courses));
              localStorage.setItem('coursesBackupTimestamp', new Date().toISOString());
              
              if (window.devMode && window.devMode.enabled) {
                console.log('🔧 [DevMode] Сохранена резервная копия курсов в localStorage');
              }
            } else {
              throw new Error('Полученные данные не содержат информацию о курсах');
            }
          } else {
            throw new Error(`Ошибка запроса к вебхуку импорта: ${importResponse.status}`);
          }
        } catch (importError) {
          console.error('Ошибка при загрузке данных с вебхука импорта:', importError);
          
          if (window.devMode && window.devMode.enabled) {
            console.log(`🔧 [DevMode] Ошибка при загрузке с вебхука: ${importError.message}`);
            console.log('🔧 [DevMode] Переключение на загрузку из локального файла');
          }
          
          // При ошибке пытаемся загрузить из локального файла
          try {
            const coursesResponse = await fetch('data/courses.json');
            if (coursesResponse.ok) {
              this.courses = await coursesResponse.json();
              console.log('Курсы успешно загружены из файла courses.json');
              
              // Сохраняем копию в localStorage для резервного восстановления
              localStorage.setItem('coursesBackup', JSON.stringify(this.courses));
              localStorage.setItem('coursesBackupTimestamp', new Date().toISOString());
              
              if (window.devMode && window.devMode.enabled) {
                console.log('🔧 [DevMode] Сохранена резервная копия курсов в localStorage');
              }
            } else {
              throw new Error(`Не удалось загрузить структуру курсов: ${coursesResponse.status}`);
            }
          } catch (coursesError) {
            console.error('Ошибка при загрузке courses.json:', coursesError);
            
            // Пытаемся восстановить из localStorage
            const backupStr = localStorage.getItem('coursesBackup');
            if (backupStr) {
              try {
                this.courses = JSON.parse(backupStr);
                const timestamp = localStorage.getItem('coursesBackupTimestamp') || 'неизвестно';
                console.log(`Курсы восстановлены из резервной копии (${timestamp})`);
                
                if (window.devMode && window.devMode.enabled) {
                  console.log(`🔧 [DevMode] Загружена резервная копия курсов из localStorage от ${timestamp}`);
                }
              } catch (backupError) {
                console.error('Ошибка при восстановлении из резервной копии:', backupError);
                this.courses = {};
              }
            } else {
              console.warn('Резервная копия курсов не найдена, используется пустой объект');
              this.courses = {};
            }
          }
        }
      } else {
        // Если URL вебхука не настроен, загружаем из локального файла
        try {
          if (window.devMode && window.devMode.enabled) {
            console.log('🔧 [DevMode] Загрузка курсов из локального файла courses.json');
          }
          
          const coursesResponse = await fetch('data/courses.json');
          if (coursesResponse.ok) {
            this.courses = await coursesResponse.json();
            console.log('Курсы успешно загружены из файла courses.json');
            
            // Сохраняем копию в localStorage для резервного восстановления
            localStorage.setItem('coursesBackup', JSON.stringify(this.courses));
            localStorage.setItem('coursesBackupTimestamp', new Date().toISOString());
            
            if (window.devMode && window.devMode.enabled) {
              console.log('🔧 [DevMode] Сохранена резервная копия курсов в localStorage');
            }
          } else {
            throw new Error(`Не удалось загрузить структуру курсов: ${coursesResponse.status}`);
          }
        } catch (coursesError) {
          console.error('Ошибка при загрузке courses.json:', coursesError);
          
          // Пытаемся восстановить из localStorage
          const backupStr = localStorage.getItem('coursesBackup');
          if (backupStr) {
            try {
              this.courses = JSON.parse(backupStr);
              const timestamp = localStorage.getItem('coursesBackupTimestamp') || 'неизвестно';
              console.log(`Курсы восстановлены из резервной копии (${timestamp})`);
              
              if (window.devMode && window.devMode.enabled) {
                console.log(`🔧 [DevMode] Загружена резервная копия курсов из localStorage от ${timestamp}`);
              }
            } catch (backupError) {
              console.error('Ошибка при восстановлении из резервной копии:', backupError);
              this.courses = {};
            }
          } else {
            console.warn('Резервная копия курсов не найдена, используется пустой объект');
            this.courses = {};
          }
        }
      }

      // Загружаем резервный контент
      try {
        const fallbacksResponse = await fetch('data/fallbacks.json');
        if (fallbacksResponse.ok) {
          this.fallbacks = await fallbacksResponse.json();
          
          // Сохраняем копию в localStorage
          localStorage.setItem('fallbacksBackup', JSON.stringify(this.fallbacks));
          localStorage.setItem('fallbacksBackupTimestamp', new Date().toISOString());
        } else {
          throw new Error(`Не удалось загрузить резервный контент: ${fallbacksResponse.status}`);
        }
      } catch (fallbacksError) {
        console.warn('Ошибка при загрузке fallbacks.json:', fallbacksError);
        
        // Пытаемся восстановить из localStorage
        const backupStr = localStorage.getItem('fallbacksBackup');
        if (backupStr) {
          try {
            this.fallbacks = JSON.parse(backupStr);
            const timestamp = localStorage.getItem('fallbacksBackupTimestamp') || 'неизвестно';
            console.log(`Резервный контент восстановлен из копии (${timestamp})`);
          } catch (backupError) {
            console.error('Ошибка при восстановлении резервного контента:', backupError);
            this.fallbacks = {};
          }
        } else {
          console.warn('Резервная копия fallbacks не найдена, используется пустой объект');
          this.fallbacks = {};
        }
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

  /**
   * Сохранить резервную копию данных
   */
  saveBackup() {
    if (this.courses) {
      localStorage.setItem('coursesBackup', JSON.stringify(this.courses));
      localStorage.setItem('coursesBackupTimestamp', new Date().toISOString());
      
      if (window.devMode && window.devMode.enabled) {
        console.log('🔧 [DevMode] Сохранена резервная копия курсов');
      }
    }
    
    if (this.fallbacks) {
      localStorage.setItem('fallbacksBackup', JSON.stringify(this.fallbacks));
      localStorage.setItem('fallbacksBackupTimestamp', new Date().toISOString());
    }
  }

  /**
   * Восстановить из резервной копии
   */
  restoreFromBackup() {
    const coursesBackup = localStorage.getItem('coursesBackup');
    const fallbacksBackup = localStorage.getItem('fallbacksBackup');
    
    let restored = false;
    
    if (coursesBackup) {
      try {
        this.courses = JSON.parse(coursesBackup);
        const timestamp = localStorage.getItem('coursesBackupTimestamp') || 'неизвестно';
        console.log(`Восстановлены курсы из резервной копии (${timestamp})`);
        restored = true;
      } catch (e) {
        console.error('Ошибка при восстановлении курсов из резервной копии:', e);
      }
    }
    
    if (fallbacksBackup) {
      try {
        this.fallbacks = JSON.parse(fallbacksBackup);
        console.log('Восстановлен резервный контент из копии');
      } catch (e) {
        console.error('Ошибка при восстановлении резервного контента:', e);
      }
    }
    
    return restored;
  }
}

// Создаем экземпляр класса
const courseManager = new CourseManager();

// Экспортируем как именованный экспорт для совместимости
export { courseManager };

// Также экспортируем как экспорт по умолчанию
export default courseManager;