
const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static('./'));

// Route to save test data
app.post('/save-tests', (req, res) => {
  try {
    const { content, filename } = req.body;
    
    if (!content || !filename) {
      return res.status(400).send('Missing content or filename');
    }
    
    const filePath = path.join(__dirname, '..', filename);
    fs.writeFileSync(filePath, content);
    
    console.log(`File saved: ${filePath}`);
    res.send(`File saved: ${filename}`);
  } catch (error) {
    console.error('Error saving file:', error);
    res.status(500).send(`Error saving file: ${error.message}`);
  }
});

// Route to get test data
app.get('/get-test-data', (req, res) => {
  try {
    const filePath = path.join(__dirname, '..', 'tests.json');
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      res.json(JSON.parse(content));
    } else {
      res.status(404).send('Test data file not found');
    }
  } catch (error) {
    console.error('Error reading test data:', error);
    res.status(500).send(`Error reading test data: ${error.message}`);
  }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
