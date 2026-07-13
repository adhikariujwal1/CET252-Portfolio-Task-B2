// api/middleware/errorHandler.js
// Centralised error handler — guarantees every error response shares the
// same JSON shape: { error, message }

function errorHandler(err, req, res, next) {
  console.error(err);

  const status = err.status || 500;
  const errorName = err.name || 'ServerError';
  const message = err.message || 'An unexpected error occurred.';

  res.status(status).json({ error: errorName, message });
}

module.exports = errorHandler;
