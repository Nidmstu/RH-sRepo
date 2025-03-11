
const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static('./'));

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Route to save test data
app.post('/save-tests', (req, res) => {
  try {
    const { content, filename } = req.body;
    
    if (!content || !filename) {
      return res.status(400).send('Missing content or filename');
    }
    
    const filePath = path.join(__dirname, '..', 'data', filename);
    fs.writeFileSync(filePath, content);
    
    console.log(`File saved: ${filePath}`);
    res.send(`File saved successfully: ${filename}`);
  } catch (error) {
    console.error('Error saving file:', error);
    res.status(500).send(`Error saving file: ${error.message}`);
  }
});

// Route to get test data
app.get('/get-tests', (req, res) => {
  try {
    const filePath = path.join(__dirname, '..', 'data', 'tests.json');
    
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      res.type('application/json').send(data);
    } else {
      res.status(404).send('Tests data file not found');
    }
  } catch (error) {
    console.error('Error reading tests file:', error);
    res.status(500).send(`Error reading tests file: ${error.message}`);
  }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
