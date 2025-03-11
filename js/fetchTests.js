
// Tests data handler for learning platform
// This file handles test data without initialization loops

// Global object to store test data
window.testData = {};

// Global flag to track initialization state
let isInitializing = false;

// Function to check if courseManager is available
function checkCourseManager() {
  if (window.courseManager && window.courseManager.courses) {
    console.log('Tests: courseManager found, extracting test data');
    extractTestData();
    return true;
  }
  return false;
}

// Extract test data from courseManager
function extractTestData() {
  try {
    if (!window.courseManager || !window.courseManager.courses) {
      console.log('Tests: Cannot extract test data, courseManager not ready');
      return;
    }

    const coursesData = window.courseManager.courses;
    const result = {};

    // Process each course/profession
    for (const profId in coursesData) {
      const course = coursesData[profId];
      result[profId] = {};

      // Skip courses with redirects
      if (course.redirectUrl) continue;

      // Process days and lessons
      if (course.days && Array.isArray(course.days)) {
        for (const day of course.days) {
          if (day.lessons && Array.isArray(day.lessons)) {
            for (const lesson of day.lessons) {
              if (lesson.testSource && lesson.testSource.url) {
                result[profId][lesson.id] = {
                  url: lesson.testSource.url,
                  title: lesson.title,
                  dayId: day.id
                };
              }
            }
          }
        }
      }

      // Process special lessons
      if (course.specialLessons && Array.isArray(course.specialLessons)) {
        for (const lesson of course.specialLessons) {
          if (lesson.testSource && lesson.testSource.url) {
            result[profId][lesson.id] = {
              url: lesson.testSource.url,
              title: lesson.title,
              isSpecial: true
            };
          }
        }
      }
    }

    window.testData = result;
    console.log('Tests: Data extracted successfully');
  } catch (error) {
    console.error('Tests: Error extracting test data:', error);
  }
}

// Set up a gentle polling mechanism that doesn't cause conflicts
function setupPolling() {
  // Avoid multiple initialization attempts
  if (isInitializing) return;
  isInitializing = true;
  
  console.log('Tests: Setting up course manager check');
  
  // First immediate check
  if (checkCourseManager()) {
    isInitializing = false;
    return;
  }
  
  // If not immediately available, set up a simple polling mechanism
  let attempts = 0;
  const maxAttempts = 15;
  
  const intervalId = setInterval(() => {
    attempts++;
    
    if (checkCourseManager()) {
      clearInterval(intervalId);
      isInitializing = false;
      console.log('Tests: Initialization complete');
    } else {
      console.log(`Tests: Waiting for courseManager (attempt ${attempts}/${maxAttempts})`);
      
      if (attempts >= maxAttempts) {
        clearInterval(intervalId);
        isInitializing = false;
        console.warn('Tests: Max attempts reached, initialization failed');
      }
    }
  }, 2000); // Check every 2 seconds
}

// Create the API functions that will be exposed
const testManager = {
  // Get test URL for a specific lesson
  getTestUrl: function(professionId, lessonId) {
    if (!window.testData || !window.testData[professionId] || !window.testData[professionId][lessonId]) {
      return null;
    }
    return window.testData[professionId][lessonId].url;
  },
  
  // Get all tests for a profession
  getTestsForProfession: function(professionId) {
    if (!window.testData || !window.testData[professionId]) {
      return {};
    }
    return window.testData[professionId];
  },
  
  // Manual initialization function
  initialize: function() {
    setupPolling();
  }
};

// Expose the API to the global scope
window.testManager = testManager;

// Start initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Wait a moment to let other scripts initialize first
  setTimeout(setupPolling, 2000);
});

// Export for Node.js environment if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = testManager;
}
