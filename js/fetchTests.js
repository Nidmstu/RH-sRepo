
// Tests data handler for learning platform
// This module is responsible for loading test data for courses

// Store test data globally to make it accessible to other modules
let testData = {};
let initialized = false;
let initAttemptCount = 0;
const MAX_ATTEMPTS = 20;
let initialCheckDone = false;

// Immediately invoking function to set up initialization without polluting global scope
(function() {
  // Only set up once
  if (initialCheckDone) return;
  initialCheckDone = true;
  
  // Wait for document to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndInitialize);
  } else {
    // If DOM is already loaded, check on next tick
    setTimeout(checkAndInitialize, 100);
  }
})();

// Check if courseManager is ready and initialize if needed
function checkAndInitialize() {
  // If already initialized, nothing to do
  if (initialized) return;
  
  // Check if courseManager exists and is initialized
  if (window.courseManager && window.courseManager.courses) {
    console.log('CourseManager found, initializing tests');
    initializeTests();
    return;
  }
  
  // If not initialized, set up polling with exponential backoff
  console.log('CourseManager not ready, will poll');
  pollForCourseManager();
}

// Poll for courseManager with exponential backoff
function pollForCourseManager() {
  let delay = 500; // Start with 500ms
  let attempt = 0;
  
  function attemptInit() {
    attempt++;
    initAttemptCount = attempt;
    
    if (window.courseManager && window.courseManager.courses) {
      console.log(`CourseManager found on attempt ${attempt}, initializing tests`);
      initializeTests();
      return true;
    }
    
    if (attempt >= MAX_ATTEMPTS) {
      console.warn(`Max attempts (${MAX_ATTEMPTS}) reached waiting for courseManager. Tests may not be available.`);
      return false;
    }
    
    console.log(`Waiting for courseManager to be initialized... (attempt ${attempt}/${MAX_ATTEMPTS})`);
    
    // Increase delay with each attempt (exponential backoff)
    delay = Math.min(delay * 1.5, 3000); // Cap at 3 seconds
    
    // Schedule next attempt
    setTimeout(attemptInit, delay);
    return false;
  }
  
  // Start polling
  attemptInit();
}

// Initialize tests data
function initializeTests() {
  if (initialized) return;
  
  console.log('Initializing test data...');
  loadTestsData()
    .then(data => {
      if (data) {
        testData = data;
        window.testData = data; // Make available globally
        initialized = true;
        console.log('Test data successfully initialized');
      } else {
        console.warn('Failed to load test data');
      }
    })
    .catch(error => {
      console.error('Error initializing test data:', error);
    });
}

// Load tests data from course manager
async function loadTestsData() {
  try {
    if (!window.courseManager || !window.courseManager.courses) {
      console.log('CourseManager not available, cannot load tests');
      return null;
    }
    
    const coursesData = window.courseManager.courses;
    const result = {};
    
    // Process each course/profession
    for (const profId in coursesData) {
      const course = coursesData[profId];
      result[profId] = {};
      
      // Skip courses with redirects
      if (course.redirectUrl) continue;
      
      // Process each day and its lessons
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
    
    return result;
  } catch (error) {
    console.error('Error loading test data:', error);
    return null;
  }
}

// Get test URL for a specific lesson
function getTestUrl(professionId, lessonId) {
  if (!testData || !testData[professionId] || !testData[professionId][lessonId]) {
    return null;
  }
  
  return testData[professionId][lessonId].url;
}

// Get all tests for a profession
function getTestsForProfession(professionId) {
  if (!testData || !testData[professionId]) {
    return {};
  }
  
  return testData[professionId];
}

// Check initialization status
function isInitialized() {
  return initialized;
}

// Manually trigger initialization
function manualInit() {
  if (!initialized) {
    checkAndInitialize();
  }
  return initialized;
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getTestUrl,
    getTestsForProfession,
    isInitialized,
    manualInit
  };
}

// Make functions available globally if needed
window.testManager = {
  getTestUrl,
  getTestsForProfession,
  isInitialized,
  manualInit
};
