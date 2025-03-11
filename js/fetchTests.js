
// Function to fetch tests for available courses
const fetchTests = async function() {
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
};

// Check if courseManager is already initialized
const checkCourseManagerStatus = function() {
  if (window.courseManager && window.courseManager.courses) {
    console.log('CourseManager already initialized, fetching tests...');
    fetchTests().then(testData => {
      window.testData = testData;
      console.log('Test data saved to window.testData');
    });
    return true;
  }
  return false;
};

// Start polling after a short delay to ensure other scripts have loaded
setTimeout(() => {
  // First check if courseManager is already available
  if (!checkCourseManagerStatus()) {
    console.log('CourseManager not yet initialized, setting up polling...');
    
    // Set up polling with decreasing frequency
    let attempts = 0;
    const maxAttempts = 30;
    let checkInterval = 1000; // Start with 1 second
    
    const intervalId = setInterval(() => {
      attempts++;
      
      if (checkCourseManagerStatus()) {
        clearInterval(intervalId);
        console.log('CourseManager found and tests initialized');
      } else {
        console.log(`Waiting for courseManager to be initialized... (attempt ${attempts}/${maxAttempts})`);
        
        // Increase the interval time to reduce load
        if (attempts % 5 === 0) {
          clearInterval(intervalId);
          checkInterval = Math.min(checkInterval * 1.5, 5000); // Cap at 5 seconds
          
          if (attempts >= maxAttempts) {
            console.warn('Max attempts reached. Tests may not be available.');
            return;
          }
          
          setTimeout(() => {
            const newIntervalId = setInterval(() => {
              attempts++;
              
              if (checkCourseManagerStatus()) {
                clearInterval(newIntervalId);
                console.log('CourseManager found and tests initialized');
              } else {
                console.log(`Waiting for courseManager to be initialized... (attempt ${attempts}/${maxAttempts})`);
                
                if (attempts >= maxAttempts) {
                  clearInterval(newIntervalId);
                  console.warn('Max attempts reached. Tests may not be available.');
                }
              }
            }, checkInterval);
          }, 100);
        }
      }
    }, checkInterval);
  }
}, 2000);

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { fetchTests };
}
