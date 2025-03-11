
// Function to fetch tests for available courses
async function fetchTests() {
  try {
    console.log('Attempting to fetch test data...');
    
    // Only proceed if courseManager is fully initialized
    if (!window.courseManager || !window.courseManager.courses) {
      console.log('CourseManager not initialized yet, will try again later');
      return null;
    }

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
                  // Store the URL rather than fetching now
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
    window.testData = testData;
    return testData;
  } catch (error) {
    console.error('Error in fetchTests:', error);
    return null;
  }
}

// Setup initialization without using recursive interval setup
let attemptCount = 0;
const maxAttempts = 30;

function initializeTests() {
  // Clear any existing intervals to prevent duplicates
  if (window.testInitInterval) {
    clearInterval(window.testInitInterval);
  }

  // Check for courseManager once on page load
  if (window.courseManager && window.courseManager.courses) {
    console.log('CourseManager already initialized, fetching tests immediately');
    fetchTests();
    return;
  }

  // Otherwise set up a polling interval
  console.log('Setting up courseManager polling');
  window.testInitInterval = setInterval(() => {
    attemptCount++;
    
    if (window.courseManager && window.courseManager.courses) {
      console.log('CourseManager found, fetching tests');
      clearInterval(window.testInitInterval);
      fetchTests();
      
    } else {
      console.log(`Waiting for courseManager to be initialized... (${attemptCount}/${maxAttempts})`);
      
      if (attemptCount >= maxAttempts) {
        console.log('Max attempts reached, canceling test data initialization');
        clearInterval(window.testInitInterval);
      }
    }
  }, 1000);
  
  // Set a timeout to cancel polling after 30 seconds
  setTimeout(() => {
    if (window.testInitInterval) {
      clearInterval(window.testInitInterval);
      console.log('Stopped waiting for courseManager after timeout');
    }
  }, 30000);
}

// Initialize once the DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeTests);
} else {
  // If DOMContentLoaded has already fired, run immediately
  initializeTests();
}

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { fetchTests };
}
