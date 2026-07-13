// api/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');

const studentsRouter = require('./routes/students');
const coursesRouter = require('./routes/courses');
const enrollmentsRouter = require('./routes/enrollments');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve generated APIDOC site at /docs
app.use('/docs', express.static(path.join(__dirname, '..', 'docs')));

app.use('/students', studentsRouter);
app.use('/courses', coursesRouter);
app.use('/enrollments', enrollmentsRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'student-management-api' });
});

app.get('/', (req, res) => {
  res.json({ message: 'Student Management API is running. See /docs for documentation.' });
});

// 404 for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'NotFound', message: 'Route does not exist.' });
});

// Centralised error handler (must be last)
app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Student Management API listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
