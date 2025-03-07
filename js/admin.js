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

/**
 * Административный интерфейс для управления курсами
 */
const adminPanel = {
  /**
   * Показать административную панель
   */
  show() {
    const adminInterface = window.adminInterface;
    if (adminInterface) {
      adminInterface.show();
    } else {
      console.error('Административный интерфейс не инициализирован!');
    }
  },

  /**
   * Скрыть административную панель
   */
  hide() {
    const adminInterface = window.adminInterface;
    if (adminInterface) {
      adminInterface.hide();
    } else {
      console.error('Административный интерфейс не инициализирован!');
    }
  },

  /**
   * Инициализировать админ-панель
   */
  init() {
    // Добавляем горячую клавишу для вызова админ-панели (Alt+Shift+A)
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.shiftKey && e.key === 'A') {
        this.show();
      }
    });

    console.log('Админ-панель доступна по Alt+Shift+A');
  }
};

// Инициализируем админ-панель после загрузки страницы
document.addEventListener('DOMContentLoaded', () => {
  adminPanel.init();
  
  // Добавляем ID кнопке управления курсами для возможности её скрытия
  window.setTimeout(() => {
    const adminPanelButton = document.querySelector('[onclick="openAdminPanel()"]');
    if (adminPanelButton) {
      adminPanelButton.id = 'admin-toggle';
    }
  }, 500);
});

export default adminPanel;

// Для удобства тестирования добавляем глобальную функцию
window.openAdminPanel = function() {
  adminPanel.show();
};