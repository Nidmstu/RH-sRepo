// Tests data handler for learning platform

// Global object to store test data
window.testData = {};

// Function to extract test data from courseManager
function extractTestData() {
  try {
    if (!window.courseManager || !window.courseManager.courses) {
      console.log('Tests: CourseManager not available');
      return false;
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
    return true;
  } catch (error) {
    console.error('Tests: Error extracting test data:', error);
    return false;
  }
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

  // Initialize by checking if courseManager is already available
  initialize: function() {
    if (extractTestData()) {
      return Promise.resolve();
    }

    // If not available yet, we'll just return a resolved promise
    // The extraction will happen when app.js calls our function
    return Promise.resolve();
  }
};

// Expose the API to the global scope
window.testManager = testManager;

// Add a method to be called from app.js after courseManager is initialized
window.updateTestData = function() {
  console.log('Tests: Updating test data from courseManager');
  return extractTestData();
};

// Export for Node.js environment if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = testManager;
}