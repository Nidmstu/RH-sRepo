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
    
    // Добавляем стили для кнопки и контейнера
    this.addUIControlsStyles();
    
    // Создаем и добавляем кнопку управления интерфейсом в админ-панель
    this.addUIToggleButton();
  },
  
  /**
   * Добавить стили для кнопки управления интерфейсом
   */
  addUIControlsStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .ui-controls-container {
        display: inline-block;
        margin-left: 10px;
      }
      
      .ui-controls-toggle {
        background-color: rgba(52, 152, 219, 0.8);
        color: white;
        border: none;
        border-radius: 4px;
        padding: 8px 12px;
        cursor: pointer;
        font-size: 14px;
        display: flex;
        align-items: center;
        transition: all 0.3s ease;
      }
      
      .ui-controls-toggle i {
        margin-right: 5px;
      }
      
      .ui-controls-toggle:hover {
        background-color: rgba(52, 152, 219, 1);
      }
      
      .ui-controls-toggle.controls-hidden {
        background-color: rgba(231, 76, 60, 0.8);
      }
      
      .ui-controls-toggle.controls-hidden:hover {
        background-color: rgba(231, 76, 60, 1);
      }
      
      .admin-toggle-hidden, .dev-mode-toggle-hidden {
        display: none !important;
      }
      
      @media (max-width: 768px) {
        .ui-controls-toggle span {
          display: none;
        }
        
        .ui-controls-toggle i {
          margin-right: 0;
        }
        
        .ui-controls-toggle {
          padding: 8px;
        }
      }
      
      .admin-header-actions {
        display: flex;
        align-items: center;
      }
    `;
    document.head.appendChild(style);
  },
  
  /**
   * Создать и добавить кнопку управления интерфейсом
   */
  addUIToggleButton() {
    // Создаем контейнер для кнопки и подписи
    const toggleContainer = document.createElement('div');
    toggleContainer.id = 'ui-controls-container';
    toggleContainer.className = 'ui-controls-container';
    
    // Создаем кнопку
    const toggleButton = document.createElement('button');
    toggleButton.id = 'ui-controls-toggle';
    toggleButton.className = 'ui-controls-toggle';
    toggleButton.innerHTML = '<i class="fas fa-eye-slash"></i> <span>Управление интерфейсом</span>';
    toggleButton.title = 'Скрыть/показать кнопки управления';
    
    // Добавляем кнопку в контейнер
    toggleContainer.appendChild(toggleButton);
    
    // Добавляем обработчик события
    toggleButton.addEventListener('click', function() {
      // Находим кнопки
      const adminToggle = document.getElementById('admin-toggle');
      const devModeToggle = document.getElementById('dev-mode-toggle');
      
      // Переключаем видимость кнопок
      if (adminToggle) {
        adminToggle.classList.toggle('admin-toggle-hidden');
      }
      
      if (devModeToggle) {
        devModeToggle.classList.toggle('dev-mode-toggle-hidden');
      }
      
      // Меняем иконку и текст на кнопке в зависимости от состояния
      if ((adminToggle && adminToggle.classList.contains('admin-toggle-hidden')) || 
          (devModeToggle && devModeToggle.classList.contains('dev-mode-toggle-hidden'))) {
        toggleButton.innerHTML = '<i class="fas fa-eye"></i> <span>Показать управление</span>';
        toggleButton.classList.add('controls-hidden');
        toggleButton.title = 'Показать кнопки управления';
      } else {
        toggleButton.innerHTML = '<i class="fas fa-eye-slash"></i> <span>Скрыть управление</span>';
        toggleButton.classList.remove('controls-hidden');
        toggleButton.title = 'Скрыть кнопки управления';
      }
    });
    
    // Добавляем кнопку в админ-интерфейс
    const addButtonToAdminPanel = () => {
      // Находим контейнер для кнопок в админ-панели
      const adminHeaderActions = document.querySelector('.admin-header-actions');
      if (adminHeaderActions) {
        // Вставляем нашу кнопку в контейнер действий админ-панели
        adminHeaderActions.appendChild(toggleContainer);
        console.log('Кнопка управления интерфейсом добавлена в админ-панель');
      } else {
        // Если не нашли контейнер в админ-панели, добавляем в body как запасной вариант
        document.body.appendChild(toggleContainer);
        console.log('Не найден контейнер admin-header-actions, добавляем кнопку в body');
      }
    };
    
    // Если админ-панель уже загружена, добавляем кнопку сразу
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(addButtonToAdminPanel, 500); // Небольшая задержка для уверенности, что DOM уже создан
    } else {
      // Иначе ждем полной загрузки страницы
      window.addEventListener('load', () => {
        setTimeout(addButtonToAdminPanel, 500);
      });
    }
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