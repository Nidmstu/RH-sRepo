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
      return Object.keys(this.courses).filter(profId => {
        const course = this.courses[profId];
        // Проверяем точное значение hidden: true
        return course.hidden !== true;
      });
    }
  }