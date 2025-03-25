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
      console.log('CourseManager: Начало инициализации...');
      console.log('CourseManager: Текущее время:', new Date().toISOString());

      // Подписчики на изменение курсов
      this.courseUpdateCallbacks = [];

      // Выводим текущее состояние и проверяем наличие данных
      console.log('CourseManager: Текущее состояние courses:', this.courses ? Object.keys(this.courses) : 'null');

      // Проверяем, есть ли уже загруженные данные из предыдущей синхронизации
      if (this.courses && Object.keys(this.courses).length > 0) {
        console.log('CourseManager: Данные уже загружены из синхронизации, продолжаем с ними');
        console.log('CourseManager: Количество загруженных профессий:', Object.keys(this.courses).length);
        console.log('CourseManager: Идентификаторы профессий:', Object.keys(this.courses).join(', '));

        // Дополнительная проверка данных - наличие дней и уроков для каждой профессии
        let dataIsValid = true;
        for (const profId of Object.keys(this.courses)) {
          const course = this.courses[profId];

          // Если это редирект, то дни не нужны
          if (course.redirectUrl) {
            console.log(`CourseManager: Профессия ${profId} имеет редирект, структура валидна`);
            continue;
          }

          // Проверяем наличие дней для этой профессии
          if (!course.days || !Array.isArray(course.days) || course.days.length === 0) {
            console.warn(`CourseManager: Профессия ${profId} не имеет дней обучения!`);
            dataIsValid = false;
          } else {
            // Проверяем наличие уроков для каждого дня
            course.days.forEach((day, idx) => {
              if (!day.lessons || !Array.isArray(day.lessons) || day.lessons.length === 0) {
                console.warn(`CourseManager: День ${idx + 1} профессии ${profId} не имеет уроков!`);
                dataIsValid = false;
              } else {
                // Проверяем наличие contentSource для первого урока
                const firstLesson = day.lessons[0];
                if (!firstLesson.contentSource) {
                  console.warn(`CourseManager: Первый урок в дне ${idx + 1} профессии ${profId} не имеет contentSource!`);
                  dataIsValid = false;
                }
              }
            });
          }
        }

        if (dataIsValid) {
          console.log('CourseManager: Проверка структуры данных успешна, данные валидны');
          // Уведомляем об имеющихся курсах
          this.notifyCoursesUpdated();
          return true;
        } else {
          console.warn('CourseManager: Структура данных некорректна, требуется повторная загрузка');
          // Не возвращаем, продолжаем загрузку для обновления данных
        }
      }

      console.log('CourseManager: Данные не найдены, начинаю загрузку...');

      // Получаем настройки вебхуков из localStorage в порядке приоритета
      let importWebhookUrl = null;

      // 1. Настройки из админ-панели (наивысший приоритет)
      const adminWebhookUrl = localStorage.getItem('adminImportWebhook');
      if (adminWebhookUrl) {
        importWebhookUrl = adminWebhookUrl;
        console.log(`CourseManager: Используется URL из adminImportWebhook: ${importWebhookUrl}`);
      }
      // 2. Настройки из webHookSettings
      else {
        const webhookSettingsStr = localStorage.getItem('webhookSettings');
        if (webhookSettingsStr) {
          try {
            const webhookSettings = JSON.parse(webhookSettingsStr);
            if (webhookSettings.importUrl) {
              importWebhookUrl = webhookSettings.importUrl;
              console.log(`CourseManager: Используется URL из webhookSettings: ${importWebhookUrl}`);
            }
          } catch (e) {
            console.error('Ошибка при парсинге настроек вебхуков:', e);
          }
        }
      }
      // 3. Сохраненный URL
      if (!importWebhookUrl) {
        importWebhookUrl = localStorage.getItem('importWebhookUrl');
        if (importWebhookUrl) {
          console.log(`CourseManager: Используется URL из importWebhookUrl: ${importWebhookUrl}`);
        }
      }
      // 4. Тестовый URL
      if (!importWebhookUrl) {
        importWebhookUrl = localStorage.getItem('testImportUrl');
        if (importWebhookUrl) {
          console.log(`CourseManager: Используется URL из testImportUrl: ${importWebhookUrl}`);
        }
      }

      if (window.devMode && window.devMode.enabled) {
        console.log('🔧 [DevMode] Начало инициализации CourseManager');
        if (importWebhookUrl) {
          console.log(`🔧 [DevMode] Будет использован вебхук для импорта: ${importWebhookUrl}`);
        } else {
          console.log('🔧 [DevMode] URL вебхука для импорта не найден в настройках, будет использован локальный файл');
        }
      }

      // Всегда пытаемся сначала загрузить с вебхука
      try {
        // Определяем URL для импорта, даже если он не был явно указан
        let webhookUrl = importWebhookUrl;

        // Если URL не найден в настройках, проверим другие возможные места
        if (!webhookUrl) {
          // Проверяем наличие в localStorage или других источниках
          const webhookSettings = localStorage.getItem('webhookSettings');
          const adminWebhookUrl = localStorage.getItem('adminImportWebhook');
          const testImportUrl = localStorage.getItem('testImportUrl');

          // Приоритет для настроек из админ-панели
          if (adminWebhookUrl) {
            webhookUrl = adminWebhookUrl;
            console.log(`Найден URL импорта в adminImportWebhook: ${webhookUrl}`);
          } else if (webhookSettings) {
            try {
              const settings = JSON.parse(webhookSettings);
              if (settings.importUrl) {
                webhookUrl = settings.importUrl;
                console.log(`Найден URL импорта в настройках вебхуков: ${webhookUrl}`);
                // Сохраняем для использования другими компонентами
                localStorage.setItem('importWebhookUrl', webhookUrl);
              }
            } catch (e) {
              console.error('Ошибка при парсинге настроек вебхуков:', e);
            }
          } else if (testImportUrl) {
            webhookUrl = testImportUrl;
            console.log(`Найден URL импорта в testImportUrl: ${webhookUrl}`);
          }
        }

        console.log('Попытка загрузки данных с URL:', webhookUrl);

        if (webhookUrl) {
          if (window.devMode && window.devMode.enabled) {
            console.log(`🔧 [DevMode] Отправка запроса на вебхук импорта: ${webhookUrl}`);
          }

          // Устанавливаем таймаут для запроса (10 секунд максимум)
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          try {
            const importResponse = await fetch(webhookUrl, {
              method: 'GET',
              headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
              },
              cache: 'no-store',  // Всегда получаем свежие данные
              signal: controller.signal
            });

            // Очищаем таймаут после получения ответа
            clearTimeout(timeoutId);

            if (importResponse.ok) {
              // Пытаемся получить JSON из ответа
              let importData;
              const responseText = await importResponse.text();

              console.log('Получен ответ от вебхука, размер:', responseText.length, 'байт');

              try {
                // Пытаемся распарсить JSON напрямую
                importData = JSON.parse(responseText);

                if (window.devMode && window.devMode.enabled) {
                  console.log('🔧 [DevMode] Успешно получены данные с вебхука импорта');
                  console.log('🔧 [DevMode] Размер полученных данных:', responseText.length, 'байт');
                }
              } catch (jsonError) {
                // Если не удалось распарсить напрямую, ищем JSON в тексте
                if (window.devMode && window.devMode.enabled) {
                  console.log(`🔧 [DevMode] Ошибка при парсинге JSON: ${jsonError.message}`);
                  console.log('🔧 [DevMode] Попытка найти JSON в тексте ответа');
                }

                try {
                  // Ищем любую JSON структуру в тексте
                  const jsonRegex = /{[\s\S]*}/;
                  const match = responseText.match(jsonRegex);

                  if (match && match[0]) {
                    importData = JSON.parse(match[0]);
                    if (window.devMode && window.devMode.enabled) {
                      console.log('🔧 [DevMode] Найден и распарсен JSON в тексте ответа');
                    }
                  }
                } catch (extractError) {
                  if (window.devMode && window.devMode.enabled) {
                    console.log(`🔧 [DevMode] Не удалось извлечь JSON из текста: ${extractError.message}`);
                  }
                  throw new Error('Не удалось распарсить JSON из ответа');
                }
              }

              // Проверяем наличие данных о курсах в разных форматах
              let coursesData = null;

              if (importData) {
                if (window.devMode && window.devMode.enabled) {
                  console.log(`🔧 [DevMode] Анализ полученных данных:`, Object.keys(importData));
                }

                // Способ 1: Прямой объект courses
                if (importData.courses) {
                  coursesData = importData.courses;
                  if (window.devMode && window.devMode.enabled) {
                    console.log(`🔧 [DevMode] Найдены курсы в поле 'courses'`);
                  }
                } 
                // Способ 2: Данные в поле data как объект
                else if (importData.data && typeof importData.data === 'object') {
                  coursesData = importData.data;
                  if (window.devMode && window.devMode.enabled) {
                    console.log(`🔧 [DevMode] Найдены курсы в поле 'data' (объект)`);
                  }
                } 
                // Способ 3: Данные в поле content как объект
                else if (importData.content && typeof importData.content === 'object') {
                  coursesData = importData.content;
                  if (window.devMode && window.devMode.enabled) {
                    console.log(`🔧 [DevMode] Найдены курсы в поле 'content' (объект)`);
                  }
                } 
                // Способ 4: Данные в поле data как строка JSON
                else if (importData.data && typeof importData.data === 'string') {
                  // Пытаемся распарсить JSON в строке
                  try {
                    const parsedData = JSON.parse(importData.data);
                    if (parsedData.courses) {
                      coursesData = parsedData.courses;
                      if (window.devMode && window.devMode.enabled) {
                        console.log(`🔧 [DevMode] Найдены курсы в поле 'data' (JSON строка -> courses)`);
                      }
                    } else {
                      coursesData = parsedData;
                      if (window.devMode && window.devMode.enabled) {
                        console.log(`🔧 [DevMode] Найдены курсы в поле 'data' (JSON строка -> весь объект)`);
                      }
                    }
                  } catch (e) {
                    if (window.devMode && window.devMode.enabled) {
                      console.log(`🔧 [DevMode] Ошибка при парсинге строки data: ${e.message}`);
                    }
                  }
                }
                // Способ 5: Прямое использование root объекта как courses
                else if (typeof importData === 'object') {
                  // Проверяем, имеет ли объект правильную структуру
                  const hasValidStructure = Object.values(importData).some(value => {
                    return value && typeof value === 'object' && 
                          (value.days || value.specialLessons || value.title || value.redirectUrl || value.noDayLessons);
                  });

                  if (hasValidStructure) {
                    coursesData = importData;
                    if (window.devMode && window.devMode.enabled) {
                      console.log(`🔧 [DevMode] Использование корневого объекта как courses (найдены поля days/specialLessons/title)`);
                    }
                  }

                  // Дополнительная проверка на отдельные уроки с вебхуками
                  const validateWebhooks = (obj) => {
                    // Проверка наличия вебхуков в уроках
                    let hasWebhooks = false;

                    // Проверяем, есть ли дни с уроками
                    if (obj.days && Array.isArray(obj.days)) {
                      obj.days.forEach(day => {
                        if (day.lessons && Array.isArray(day.lessons)) {
                          day.lessons.forEach(lesson => {
                            if (lesson.contentSource && lesson.contentSource.type === 'webhook') {
                              hasWebhooks = true;
                              // Сохраняем URL вебхука для использования в fetchLessonContent
                              const webhookUrl = lesson.contentSource.url;
                              console.log(`Сохраняем URL вебхука для урока ${lesson.id}: ${webhookUrl}`);
                            }
                          });
                        }
                      });
                    }

                    // Проверяем специальные уроки
                    if (obj.specialLessons && Array.isArray(obj.specialLessons)) {
                      obj.specialLessons.forEach(lesson => {
                        if (lesson.contentSource && lesson.contentSource.type === 'webhook') {
                          hasWebhooks = true;
                          // Сохраняем URL вебхука для использования в fetchLessonContent
                          const webhookUrl = lesson.contentSource.url;
                          console.log(`Сохраняем URL вебхука для специального урока ${lesson.id}: ${webhookUrl}`);
                        }
                      });
                    }

                    return hasWebhooks;
                  };

                  // Если найдены вебхуки в уроках, подтверждаем, что это структура курсов
                  if (validateWebhooks(coursesData)) {
                    console.log("Найдены вебхуки в структуре курсов, структура валидна");
                  }
                }
              }

              if (coursesData) {
                // Дополнительная проверка структуры данных курсов
                const courseKeys = Object.keys(coursesData);
                const validStructure = courseKeys.length > 0 && 
                  courseKeys.some(key => {
                    const course = coursesData[key];
                    return course && typeof course === 'object' && 
                          (course.days || course.specialLessons || course.redirectUrl);
                  });

                if (!validStructure) {
                  if (window.devMode && window.devMode.enabled) {
                    console.log(`🔧 [DevMode] Полученная структура данных не соответствует формату курсов`, coursesData);
                  }
                  throw new Error('Формат данных не соответствует структуре курсов');
                }

                this.courses = coursesData;
                console.log('Курсы успешно загружены с вебхука импорта');
                console.log('Загружены следующие профессии:', Object.keys(this.courses));

                // Подробный лог информации о загруженных курсах
                Object.keys(this.courses).forEach(profId => {
                  const course = this.courses[profId];
                  console.log(`Профессия ${profId}: ${course.title || 'Без названия'}`);

                  if (course.days) {
                    console.log(`- Дней обучения: ${course.days.length}`);
                    course.days.forEach(day => {
                      console.log(`  - День ${day.id}: ${day.title} (${day.lessons ? day.lessons.length : 0} уроков)`);
                    });
                  }

                  if (course.specialLessons) {
                    console.log(`- Специальных уроков: ${course.specialLessons.length}`);
                  }
                });

                // Сохраняем копию в localStorage для резервного восстановления
                localStorage.setItem('coursesBackup', JSON.stringify(this.courses));
                localStorage.setItem('coursesBackupTimestamp', new Date().toISOString());
                console.log('Резервная копия сохранена в localStorage, метка времени:', new Date().toISOString());

                if (window.devMode && window.devMode.enabled) {
                  console.log('🔧 [DevMode] Сохранена резервная копия курсов в localStorage');
                  console.log('🔧 [DevMode] Идентификаторы загруженных курсов:', Object.keys(this.courses));
                }

                // Уведомляем подписчиков об обновлении данных
                this.notifyCoursesUpdated();

                // Данные успешно загружены с вебхука, прерываем дальнейшее выполнение
                return true;
              } else {
                throw new Error('Полученные данные не содержат информацию о курсах');
              }
            } else {
              throw new Error(`Ошибка запроса к вебхуку импорта: ${importResponse.status}`);
            }
          } catch (fetchError) {
            // Очищаем таймаут, если ошибка произошла до его истечения
            clearTimeout(timeoutId);

            // Ошибка fetch (может быть таймаут, сетевая ошибка и т.д.)
            if (fetchError.name === 'AbortError') {
              throw new Error('Таймаут запроса к вебхуку импорта');
            } else {
              throw fetchError;
            }
          }
        } else {
          throw new Error('URL вебхука для импорта не найден');
        }
      } catch (importError) {
        console.error('Ошибка при загрузке данных с вебхука импорта:', importError);

        if (window.devMode && window.devMode.enabled) {
          console.log(`🔧 [DevMode] Ошибка при загрузке с вебхука: ${importError.message}`);
          console.log('🔧 [DevMode] Переключение на загрузку из localStorage');
        }

        // Сначала пытаемся восстановить из localStorage
        const backupStr = localStorage.getItem('coursesBackup');
        if (backupStr) {
          try {
            this.courses = JSON.parse(backupStr);
            const timestamp = localStorage.getItem('coursesBackupTimestamp') || 'неизвестно';
            console.log(`Курсы восстановлены из резервной копии (${timestamp})`);

            if (window.devMode && window.devMode.enabled) {
              console.log(`🔧 [DevMode] Загружена резервная копия курсов из localStorage от ${timestamp}`);
            }
            return true;
          } catch (backupError) {
            console.error('Ошибка при восстановлении из резервной копии:', backupError);

            if (window.devMode && window.devMode.enabled) {
              console.log(`🔧 [DevMode] Переключение на загрузку из локального файла`);
            }
          }
        } else {
          if (window.devMode && window.devMode.enabled) {
            console.log('🔧 [DevMode] Резервная копия не найдена, переключение на локальный файл');
          }
        }

        // Если ни вебхук, ни localStorage не сработали, загружаем из локального файла
        try {
          if (window.devMode && window.devMode.enabled) {
            console.log('🔧 [DevMode] Загрузка курсов из локального файла courses.json');
          }

          const coursesResponse = await fetch('data/courses.json');
          if (coursesResponse.ok) {
            this.courses = await coursesResponse.json();
            console.log('Курсы загружены из локального файла courses.json (резервный вариант)');

            // Сохраняем копию в localStorage для будущего использования
            localStorage.setItem('coursesBackup', JSON.stringify(this.courses));
            localStorage.setItem('coursesBackupTimestamp', new Date().toISOString());

            if (window.devMode && window.devMode.enabled) {
              console.log('🔧 [DevMode] Сохранена резервная копия курсов из локального файла');
            }
          } else {
            throw new Error(`Не удалось загрузить структуру курсов из локального файла: ${coursesResponse.status}`);
          }
        } catch (coursesError) {
          console.error('Ошибка при загрузке локального файла courses.json:', coursesError);
          this.courses = {};
          return false;
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
   * @param {boolean} includeHidden - Включать ли скрытые курсы в результат (по умолчанию false)
   */
  getProfessions(includeHidden = false) {
    if (!this.courses || typeof this.courses !== 'object') {
      console.error('Объект courses не определен или не является объектом:', this.courses);
      return [];
    }

    if (includeHidden) {
      return Object.keys(this.courses);
    } else {
      // Фильтруем скрытые курсы
      const visibleCourses = Object.keys(this.courses).filter(profId => {
        const course = this.courses[profId];
        const isHidden = course.hidden === true;
        console.log(`Проверка видимости курса ${profId}: hidden=${course.hidden}, isHidden=${isHidden}`);
        return !isHidden;
      });
      console.log('Видимые курсы:', visibleCourses);
      return visibleCourses;
    }
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
    // Проверяем, что курсы загружены
    if (!this.courses || Object.keys(this.courses).length === 0) {
      console.error('Ошибка: курсы еще не загружены, невозможно выбрать урок');
      return null;
    }

    // Сначала ищем в текущем дне
    if (this.currentDay && this.currentDay.lessons) {
      const lesson = this.currentDay.lessons.find(l => l.id === lessonId);
      if (lesson) {
        this.currentLesson = lesson;
        console.log(`Выбран урок из текущего дня: ${lesson.title} (ID: ${lesson.id})`);
        return lesson;
      }
    }

    // Затем ищем в специальных уроках
    const specialLessons = this.getSpecialLessons();
    if (specialLessons && specialLessons.length > 0) {
      const specialLesson = specialLessons.find(l => l.id === lessonId);
      if (specialLesson) {
        this.currentLesson = specialLesson;
        console.log(`Выбран специальный урок: ${specialLesson.title} (ID: ${specialLesson.id})`);
        return specialLesson;
      }
    }
    
    // Затем ищем в уроках без дня
    if (this.courses[this.currentProfession] && this.courses[this.currentProfession].noDayLessons) {
      const noDayLessons = this.courses[this.currentProfession].noDayLessons;
      if (Array.isArray(noDayLessons)) {
        const noDayLesson = noDayLessons.find(l => l.id === lessonId);
        if (noDayLesson) {
          this.currentLesson = noDayLesson;
          console.log(`Выбран урок без дня: ${noDayLesson.title} (ID: ${noDayLesson.id})`);
          return noDayLesson;
        }
      } else {
        console.warn(`noDayLessons существует, но не является массивом:`, noDayLessons);
      }
    } else {
      console.log(`Отсутствуют уроки без дня для профессии ${this.currentProfession}`);
    }

    console.error(`Урок с ID ${lessonId} не найден ни в текущем дне, ни в специальных уроках, ни в уроках без дня`);
    return null;
  }
  
  /**
   * Получить уроки без дня для текущей профессии
   */
  getNoDayLessons() {
    if (!this.courses[this.currentProfession] || !this.courses[this.currentProfession].noDayLessons) {
      return [];
    }
    return this.courses[this.currentProfession].noDayLessons;
  }

  /**
   * Загрузить контент для урока
   */
  async fetchLessonContent() {
    if (!this.currentLesson) {
      console.error('Ошибка: текущий урок не выбран');
      return null;
    }

    console.log(`Загрузка контента для урока: ${this.currentLesson.id} (${this.currentLesson.title})`);

    const source = this.currentLesson.contentSource;
    if (!source) {
      console.error('Ошибка: у урока нет источника контента');
      return `# ${this.currentLesson.title}\n\nК сожалению, для данного урока не указан источник контента.`;
    }

    console.log(`Источник контента:`, source);

    // Показываем индикатор загрузки
    this.showLoadingIndicator();

    // Добавим индикатор загрузки в глобальный индикатор
    const globalStatusElement = document.getElementById('global-loading-status');
    if (globalStatusElement) {
      globalStatusElement.textContent = `Загрузка контента урока "${this.currentLesson.title}"...`;
    }

    // Показываем глобальный индикатор при загрузке урока
    const globalLoadingOverlay = document.getElementById('global-loading-overlay');
    if (globalLoadingOverlay) {
      globalLoadingOverlay.style.display = 'flex';
      globalLoadingOverlay.style.opacity = '1';
    }

    try {
      let content = '';

      if (source.type === 'webhook' && source.url) {
        // Пытаемся загрузить контент с вебхука
        try {
          // Добавляем информацию для режима разработчика
          if (window.devMode && window.devMode.enabled) {
            console.log(`🔧 [DevMode] Загрузка контента урока '${this.currentLesson.title}' с URL: ${source.url}`);
          }

          console.log(`Fetching from: ${source.url}`);
          console.log(`Using simplified GET request`);

          // Используем более надежный подход для загрузки данных
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 секунд таймаут

          const response = await fetch(source.url, {
            method: 'GET',
            headers: {
              'Accept': 'text/plain, text/markdown, text/html, application/json, */*',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            },
            mode: 'cors',
            cache: 'no-store', // Всегда получаем свежие данные
            signal: controller.signal
          });

          // Очищаем таймаут после получения ответа
          clearTimeout(timeoutId);

          console.log(`Response status: ${response.status}`);

          if (!response.ok) {
            throw new Error(`HTTP ошибка! Статус: ${response.status}`);
          }

          content = await response.text();

          console.log(`Response size: ${content.length} bytes`);
          console.log(`Response preview: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"`);
          console.log(`Response received successfully!`);

          // Если это JSON-ответ, пытаемся извлечь текстовое содержимое
          if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
            try {
              const jsonData = JSON.parse(content);
              console.log('Получен JSON ответ, структура:', Object.keys(jsonData));

              // Извлекаем содержимое из разных возможных полей
              if (jsonData.content) {
                console.log('Используем поле content из JSON');
                content = jsonData.content;
              }
              else if (jsonData.markdown) {
                console.log('Используем поле markdown из JSON');
                content = jsonData.markdown;
              }
              else if (jsonData.text) {
                console.log('Используем поле text из JSON');
                content = jsonData.text;
              }
              else if (jsonData.html) {
                console.log('Используем поле html из JSON');
                content = jsonData.html;
              }
              else if (jsonData.data && typeof jsonData.data === 'string') {
                console.log('Используем поле data (строка) из JSON');
                content = jsonData.data;
              }
            } catch (e) {
              console.log('Не удалось распарсить JSON, используем ответ как текст:', e.message);
            }
          }

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
          } else if (source.fallbackType === 'markdown' && source.fallbackContent) {
            console.log('Используем встроенный резервный markdown-контент');
            content = source.fallbackContent;
          } else {
            // Генерируем простое сообщение об ошибке в формате markdown
            content = `# ${this.currentLesson.title}\n\n## Ошибка загрузки контента\n\nК сожалению, не удалось загрузить содержимое этого урока с сервера.\n\nОшибка: ${error.message}\n\nПожалуйста, попробуйте позже или обратитесь к руководителю команды.`;
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

  /**
   * Добавляет подписчика на обновление курсов
   * @param {Function} callback - Функция, вызываемая при обновлении курсов
   */
  onCoursesUpdated(callback) {
    if (typeof callback === 'function') {
      this.courseUpdateCallbacks.push(callback);
    }
  }

  /**
   * Вызывает все зарегистрированные подписчики при обновлении курсов
   */
  notifyCoursesUpdated() {
    if (this.courseUpdateCallbacks && Array.isArray(this.courseUpdateCallbacks)) {
      this.courseUpdateCallbacks.forEach(callback => {
        try {
          callback(this.courses);
        } catch (error) {
          console.error('Ошибка при вызове подписчика обновления курсов:', error);
        }
      });
    }
  }
}

// Создаем экземпляр класса
const courseManager = new CourseManager();

// Экспортируем как именованный экспорт для совместимости
export { courseManager };

// Также экспортируем как экспорт по умолчанию
export default courseManager;