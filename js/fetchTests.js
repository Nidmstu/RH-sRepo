
// Script to fetch test data from webhooks and save to JSON

async function fetchTests() {
  console.log('Starting to fetch test data from webhooks...');
  
  // Parse the WebhookURLs from the courseManager data
  const courseManager = window.courseManager || {};
  const courses = courseManager.courses || {};
  
  // Collection to store test data
  const testData = {};
  
  // Process all courses
  for (const courseId in courses) {
    const course = courses[courseId];
    testData[courseId] = { 
      title: course.title || courseId,
      days: [] 
    };
    
    // Process days
    if (course.days && Array.isArray(course.days)) {
      for (const day of course.days) {
        const dayData = {
          id: day.id,
          title: day.title || `Day ${day.id}`,
          lessons: []
        };
        
        // Process lessons in each day
        if (day.lessons && Array.isArray(day.lessons)) {
          for (const lesson of day.lessons) {
            if (lesson.testSource && lesson.testSource.url) {
              console.log(`Found test webhook for lesson ${lesson.id}: ${lesson.testSource.url}`);
              
              try {
                // Fetch test data
                const testContent = await fetchTestContent(lesson.testSource.url);
                
                dayData.lessons.push({
                  id: lesson.id,
                  title: lesson.title,
                  testData: testContent
                });
              } catch (error) {
                console.error(`Error fetching test for ${lesson.id}:`, error);
                dayData.lessons.push({
                  id: lesson.id,
                  title: lesson.title,
                  testData: null,
                  error: error.message
                });
              }
            } else {
              // Lesson without test
              dayData.lessons.push({
                id: lesson.id,
                title: lesson.title,
                testData: null
              });
            }
          }
        }
        
        testData[courseId].days.push(dayData);
      }
    }
    
    // Process special lessons
    if (course.specialLessons && Array.isArray(course.specialLessons)) {
      if (!testData[courseId].specialLessons) {
        testData[courseId].specialLessons = [];
      }
      
      for (const lesson of course.specialLessons) {
        if (lesson.testSource && lesson.testSource.url) {
          console.log(`Found test webhook for special lesson ${lesson.id}: ${lesson.testSource.url}`);
          
          try {
            // Fetch test data
            const testContent = await fetchTestContent(lesson.testSource.url);
            
            testData[courseId].specialLessons.push({
              id: lesson.id,
              title: lesson.title,
              testData: testContent
            });
          } catch (error) {
            console.error(`Error fetching test for special lesson ${lesson.id}:`, error);
            testData[courseId].specialLessons.push({
              id: lesson.id,
              title: lesson.title,
              testData: null,
              error: error.message
            });
          }
        } else {
          // Lesson without test
          testData[courseId].specialLessons.push({
            id: lesson.id,
            title: lesson.title,
            testData: null
          });
        }
      }
    }
  }
  
  // Save test data to file
  saveTestsToFile(testData);
  
  return testData;
}

// Function to fetch test content from a webhook URL
async function fetchTestContent(url) {
  console.log(`Fetching test data from: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      cache: 'no-store',
      mode: 'cors',
      credentials: 'omit'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const responseText = await response.text();
    console.log(`Received response from ${url}, length: ${responseText.length} bytes`);
    
    // Try to parse as JSON
    try {
      const data = JSON.parse(responseText);
      return processTestData(data);
    } catch (jsonError) {
      console.log('Response is not JSON, trying to parse as HTML or extract JSON from text');
      
      // Try to extract JSON from text response
      const jsonMatch = responseText.match(/{[\s\S]*}/);
      if (jsonMatch && jsonMatch[0]) {
        try {
          const extractedData = JSON.parse(jsonMatch[0]);
          return processTestData(extractedData);
        } catch (e) {
          console.error('Failed to extract JSON from text response');
        }
      }
      
      // If it's HTML, try to parse relevant test data
      if (responseText.includes('<!DOCTYPE html>') || responseText.includes('<html>')) {
        return extractTestFromHTML(responseText);
      }
      
      // Return raw text as fallback
      return {
        rawContent: responseText,
        format: 'text',
        parsed: false
      };
    }
  } catch (error) {
    console.error(`Error fetching test content from ${url}:`, error);
    throw error;
  }
}

// Process test data from JSON response
function processTestData(data) {
  // Check common structures to identify and normalize test data
  if (data.questions) {
    return {
      name: data.name || data.title || 'Unnamed Test',
      description: data.description || '',
      questions: data.questions.map(q => ({
        question: q.question || q.text || '',
        options: q.options || q.answers || [],
        correctAnswer: q.correctAnswer || q.correct || q.correct_answer || '',
        points: q.points || 1
      })),
      format: 'json',
      parsed: true,
      task: data.task || null
    };
  } else if (data.test && data.test.questions) {
    return {
      name: data.test.name || data.test.title || 'Unnamed Test',
      description: data.test.description || '',
      questions: data.test.questions.map(q => ({
        question: q.question || q.text || '',
        options: q.options || q.answers || [],
        correctAnswer: q.correctAnswer || q.correct || q.correct_answer || '',
        points: q.points || 1
      })),
      format: 'json',
      parsed: true,
      task: data.test.task || data.task || null
    };
  } else if (Array.isArray(data)) {
    // If it's an array, assume it's an array of questions
    return {
      name: 'Unnamed Test',
      description: '',
      questions: data.map(q => ({
        question: q.question || q.text || '',
        options: q.options || q.answers || [],
        correctAnswer: q.correctAnswer || q.correct || q.correct_answer || '',
        points: q.points || 1
      })),
      format: 'json',
      parsed: true
    };
  }
  
  // Return the raw data if we couldn't normalize it
  return {
    rawData: data,
    format: 'json',
    parsed: false
  };
}

// Extract test data from HTML response
function extractTestFromHTML(html) {
  const testData = {
    name: '',
    description: '',
    questions: [],
    format: 'html',
    parsed: false
  };
  
  // Try to extract the title
  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  if (titleMatch && titleMatch[1]) {
    testData.name = titleMatch[1].trim();
  }
  
  // Look for questions in HTML
  const questionRegex = /<div class="question"[^>]*data-points="(\d+)"[^>]*>\s*<h3>(.*?)<\/h3>([\s\S]*?)<\/div>/g;
  let match;
  
  while ((match = questionRegex.exec(html)) !== null) {
    const points = parseInt(match[1]) || 1;
    const questionText = match[2].replace(/<[^>]*>/g, '').trim();
    const optionsHTML = match[3];
    
    const options = [];
    let correctAnswer = '';
    
    // Extract options and correct answer
    const optionRegex = /<label><input type="radio" name="[^"]*" value="([^"]*)"(?:\s+data-correct="([^"]*)")?\s*>\s*(.*?)<\/label>/g;
    let optionMatch;
    
    while ((optionMatch = optionRegex.exec(optionsHTML)) !== null) {
      const value = optionMatch[1];
      const isCorrect = optionMatch[2] === 'true';
      const text = optionMatch[3].replace(/<[^>]*>/g, '').trim();
      
      options.push({ value, text });
      if (isCorrect) {
        correctAnswer = value;
      }
    }
    
    testData.questions.push({
      question: questionText,
      options,
      correctAnswer,
      points
    });
  }
  
  testData.parsed = testData.questions.length > 0;
  return testData;
}

// Save tests data to a file
function saveTestsToFile(data) {
  const jsonData = JSON.stringify(data, null, 2);
  
  // Function to send a fetch to save file
  function saveToFileSystem(content, filename) {
    try {
      // Also try to save via server if we're in a Replit environment
      if (window.fetch) {
        try {
          fetch('/save-tests', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content, filename })
          })
          .then(response => response.text())
          .then(result => {
            console.log('Server save result:', result);
          })
          .catch(error => {
            console.error('Error saving via server:', error);
          });
        } catch (e) {
          console.error('Error trying to save via server:', e);
        }
      }
    } catch (error) {
      console.error('Error preparing file for download:', error);
    }
  }
  
  saveToFileSystem(jsonData, 'tests.json');
  console.log('Tests data prepared for server save');
}

// Only execute in browser environment
if (typeof window !== 'undefined') {
  let waitCount = 0;
  const maxWaits = 30; // Максимум 30 секунд ожидания

  // Wait for the courseManager to be initialized
  function waitForCourseManager() {
    if (window.courseManager && window.courseManager.courses) {
      fetchTests().then(testData => {
        console.log('Test data fetch complete, data saved');
        window.testData = testData;
      });
    } else {
      waitCount++;
      if (waitCount <= maxWaits) {
        console.log(`Waiting for courseManager to be initialized... (${waitCount}/${maxWaits})`);
        setTimeout(waitForCourseManager, 1000);
      } else {
        console.warn('Exceeded maximum wait time for courseManager. Aborting test data fetch.');
      }
    }
  }
  
  // Wait for DOM content to be fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      // Delay the start to give time for app.js to initialize
      setTimeout(waitForCourseManager, 3000);
    });
  } else {
    // Document already loaded, delay the start
    setTimeout(waitForCourseManager, 3000);
  }
}

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { fetchTests };
}
