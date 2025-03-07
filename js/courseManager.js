
/**
 * Менеджер курсов - управляет курсами, загрузкой данных и взаимодействием с API
 */
class CourseManager {
  constructor() {
    this.courses = {};
    this.initialized = false;
    this.fallbacks = {};
  }

  /**
   * Инициализация менеджера курсов
   */
  async initialize() {
    if (this.initialized) return;
    
    console.log('Инициализация менеджера курсов...');
    try {
      // Пытаемся загрузить данные из локального хранилища
      const storedCourses = localStorage.getItem('courses');
      if (storedCourses) {
        try {
          this.courses = JSON.parse(storedCourses);
          console.log('Загружены курсы из локального хранилища');
        } catch (e) {
          console.error('Ошибка при разборе JSON из локального хранилища:', e);
          // Если ошибка, загружаем из файла
          await this.loadCoursesFromFile();
        }
      } else {
        // Если нет данных в localStorage, загружаем из файла
        await this.loadCoursesFromFile();
      }
      
      // Загружаем резервные данные
      await this.loadFallbacks();
      
      this.initialized = true;
      console.log('Менеджер курсов инициализирован успешно');
    } catch (error) {
      console.error('Ошибка при инициализации менеджера курсов:', error);
      throw error;
    }
  }

  /**
   * Загрузка курсов из JSON файла
   */
  async loadCoursesFromFile() {
    try {
      console.log('Загрузка курсов из файла...');
      const response = await fetch('data/courses.json');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      this.courses = data;
      
      // Сохраняем в localStorage для будущих загрузок
      localStorage.setItem('courses', JSON.stringify(data));
      
      console.log('Курсы успешно загружены из файла');
    } catch (error) {
      console.error('Ошибка при загрузке курсов из файла:', error);
      // Если файл не загрузился, создаем пустой объект
      this.courses = {};
    }
  }

  /**
   * Загрузка резервных данных
   */
  async loadFallbacks() {
    try {
      console.log('Загрузка резервных данных...');
      const response = await fetch('data/fallbacks.json');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      this.fallbacks = await response.json();
      console.log('Резервные данные успешно загружены');
    } catch (error) {
      console.error('Ошибка при загрузке резервных данных:', error);
      this.fallbacks = {};
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

    console.log('getProfessions с includeHidden =', includeHidden);
    
    try {
      if (includeHidden) {
        return Object.keys(this.courses);
      } else {
        // Фильтруем скрытые курсы
        const filtered = Object.keys(this.courses).filter(profId => {
          const course = this.courses[profId];
          // Проверяем точное значение hidden: true
          return course && course.hidden !== true;
        });
        console.log('Отфильтрованные курсы:', filtered);
        return filtered;
      }
    } catch (error) {
      console.error('Ошибка при фильтрации курсов:', error);
      // В случае ошибки просто возвращаем все ключи
      return Object.keys(this.courses);
    }
  }

  /**
   * Получить курс по ID профессии
   * @param {string} professionId - ID профессии
   */
  getCourse(professionId) {
    return this.courses[professionId];
  }

  /**
   * Сохранить данные курсов
   */
  saveCourses() {
    try {
      // Проверяем, что courses - это объект
      if (!this.courses || typeof this.courses !== 'object') {
        console.error('Ошибка: this.courses не является объектом', this.courses);
        return false;
      }
      
      // Преобразуем объект в JSON строку
      const coursesJson = JSON.stringify(this.courses);
      
      // Проверяем, что получили валидную JSON строку
      if (!coursesJson || coursesJson === 'undefined' || coursesJson === 'null') {
        console.error('Ошибка: Невалидная JSON строка', coursesJson);
        return false;
      }
      
      // Сохраняем в localStorage
      localStorage.setItem('courses', coursesJson);
      console.log('Курсы успешно сохранены в локальное хранилище');
      return true;
    } catch (error) {
      console.error('Ошибка при сохранении курсов:', error);
      return false;
    }
  }
  
  /**
   * Получить день курса по ID
   * @param {string} professionId - ID профессии
   * @param {number} dayId - ID дня
   */
  getDay(professionId, dayId) {
    const course = this.getCourse(professionId);
    if (!course || !course.days) return null;
    
    return course.days.find(day => day.id === dayId);
  }
  
  /**
   * Получить урок по ID
   * @param {string} professionId - ID профессии
   * @param {number} dayId - ID дня
   * @param {string} lessonId - ID урока
   */
  getLesson(professionId, dayId, lessonId) {
    const day = this.getDay(professionId, dayId);
    if (!day || !day.lessons) return null;
    
    return day.lessons.find(lesson => lesson.id === lessonId);
  }
  
  /**
   * Получить специальный урок по ID
   * @param {string} professionId - ID профессии
   * @param {string} lessonId - ID урока
   */
  getSpecialLesson(professionId, lessonId) {
    const course = this.getCourse(professionId);
    if (!course || !course.specialLessons) return null;
    
    return course.specialLessons.find(lesson => lesson.id === lessonId);
  }
}

// Экспортируем синглтон менеджера курсов
export const courseManager = new CourseManager();
