// Tests data handler for learning platform
// This module makes test data available globally without initialization loops

// Global variable to store test data
window.testData = {};

// Simple function to get test URL for a specific lesson
function getTestUrl(professionId, lessonId) {
  if (!window.testData || !window.testData[professionId] || !window.testData[professionId][lessonId]) {
    return null;
  }
  return window.testData[professionId][lessonId].url;
}

// Get all tests for a profession
function getTestsForProfession(professionId) {
  if (!window.testData || !window.testData[professionId]) {
    return {};
  }
  return window.testData[professionId];
}

// Simplified initialization function that runs only once
function initializeTestData() {
  // If we've already run initialization, don't do it again
  if (window.testDataInitialized) return;
  window.testDataInitialized = true;

  console.log('Tests: Initializing test data');

  // Set up a simple observer that will load test data once courseManager is ready
  const checkCourseManager = () => {
    if (window.courseManager && window.courseManager.courses) {
      console.log('Tests: courseManager found, extracting test data');
      extractTestData();
      return true;
    }
    return false;
  };

  // Initial check
  if (!checkCourseManager()) {
    console.log('Tests: courseManager not ready, will check again later');

    // Set up a more gentle polling approach
    let attempts = 0;
    const maxAttempts = 10;

    const intervalId = setInterval(() => {
      attempts++;

      if (checkCourseManager()) {
        clearInterval(intervalId);
      } else {
        console.log(`Tests: Waiting for courseManager (attempt ${attempts}/${maxAttempts})`);

        if (attempts >= maxAttempts) {
          clearInterval(intervalId);
          console.warn('Tests: Max attempts reached for courseManager');
        }
      }
    }, 3000); // Check every 3 seconds
  }
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

// Make functions available globally
window.testManager = {
  getTestUrl,
  getTestsForProfession,
  initializeTestData
};

// Start the initialization process
document.addEventListener('DOMContentLoaded', () => {
  // Wait a moment to let other scripts initialize first
  setTimeout(initializeTestData, 1000);
});

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getTestUrl,
    getTestsForProfession
  };
}