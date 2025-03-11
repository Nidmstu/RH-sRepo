javascript
// Function to fetch tests for available courses
async function fetchTests() {
  // Only run if we have the courseManager and its data available
  if (!window.courseManager || !window.courseManager.courses) {
    console.log('CourseManager not initialized yet, tests will be loaded later');
    return {};
  }

  try {
    console.log('Fetching test data for courses...');
    const testData = {};

    // For each course/profession
    const professions = Object.keys(window.courseManager.courses);
    for (const profId of professions) {
      testData[profId] = {};
      const course = window.courseManager.courses[profId];

      // Skip courses with redirects
      if (course.redirectUrl) continue;

      // Process each day and its lessons
      if (course.days && Array.isArray(course.days)) {
        for (const day of course.days) {
          if (day.lessons && Array.isArray(day.lessons)) {
            for (const lesson of day.lessons) {
              if (lesson.testSource && lesson.testSource.url) {
                try {
                  console.log(`Fetching test for ${profId} - Day ${day.id} - Lesson ${lesson.id}`);
                  // Store the URL rather than fetching now to avoid too many requests
                  testData[profId][lesson.id] = {
                    url: lesson.testSource.url,
                    title: lesson.title,
                    dayId: day.id
                  };
                } catch (error) {
                  console.error(`Error fetching test for ${lesson.id}:`, error);
                }
              }
            }
          }
        }
      }

      // Process special lessons
      if (course.specialLessons && Array.isArray(course.specialLessons)) {
        for (const lesson of course.specialLessons) {
          if (lesson.testSource && lesson.testSource.url) {
            try {
              console.log(`Fetching test for special lesson ${lesson.id}`);
              testData[profId][lesson.id] = {
                url: lesson.testSource.url,
                title: lesson.title,
                isSpecial: true
              };
            } catch (error) {
              console.error(`Error fetching test for special lesson ${lesson.id}:`, error);
            }
          }
        }
      }
    }

    console.log('Test data collection complete');
    return testData;
  } catch (error) {
    console.error('Error in fetchTests:', error);
    return {};
  }
}

// Initialize tests when document is ready
document.addEventListener('DOMContentLoaded', () => {
  // Periodically check for courseManager to be initialized
  const checkInterval = setInterval(() => {
    if (window.courseManager && window.courseManager.courses) {
      clearInterval(checkInterval);
      console.log('CourseManager initialized, fetching tests...');

      fetchTests().then(testData => {
        window.testData = testData;
        console.log('Test data saved to window.testData');
      });
    }
  }, 2000); // Check every 2 seconds

  // Stop checking after 30 seconds to prevent infinite loops
  setTimeout(() => {
    clearInterval(checkInterval);
    console.log('Stopped waiting for courseManager after timeout');
  }, 30000);
});

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { fetchTests };
}