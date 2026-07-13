// api/routes/students.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDb } = require('../db/database');

const router = express.Router();

/**
 * @api {get} /students Get all students
 * @apiName GetStudents
 * @apiGroup Students
 * @apiSuccess {Object[]} students List of student records.
 */
router.get('/', (req, res, next) => {
  const db = getDb();
  db.all('SELECT * FROM students ORDER BY last_name', [], (err, rows) => {
    db.close();
    if (err) return next(err);
    res.status(200).json(rows);
  });
});

/**
 * @api {get} /students/:id Get a single student
 * @apiName GetStudent
 * @apiGroup Students
 * @apiParam {Number} id Student's unique ID.
 * @apiError StudentNotFound The student with the given id was not found.
 */
router.get('/:id', (req, res, next) => {
  const db = getDb();
  db.get('SELECT * FROM students WHERE id = ?', [req.params.id], (err, row) => {
    db.close();
    if (err) return next(err);
    if (!row) {
      const notFound = new Error(`Student with id ${req.params.id} not found.`);
      notFound.status = 404;
      notFound.name = 'StudentNotFound';
      return next(notFound);
    }
    res.status(200).json(row);
  });
});

const studentValidationRules = [
  body('first_name').isString().trim().notEmpty().withMessage('first_name is required'),
  body('last_name').isString().trim().notEmpty().withMessage('last_name is required'),
  body('email').isEmail().withMessage('A valid email is required'),
  body('date_of_birth').optional().isISO8601().withMessage('date_of_birth must be YYYY-MM-DD'),
];

/**
 * @api {post} /students Enrol a new student
 * @apiName CreateStudent
 * @apiGroup Students
 * @apiBody {String} first_name Student's first name.
 * @apiBody {String} last_name Student's last name.
 * @apiBody {String} email Student's unique email address.
 * @apiBody {String} [date_of_birth] ISO date, e.g. 2003-04-12.
 * @apiSuccess (201) {Object} student The newly created student.
 * @apiError (400) ValidationError One or more fields failed validation.
 */
router.post('/', studentValidationRules, (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const validationError = new Error('One or more fields failed validation.');
    validationError.status = 400;
    validationError.name = 'ValidationError';
    validationError.details = errors.array();
    return res.status(400).json({
      error: validationError.name,
      message: validationError.message,
      details: validationError.details,
    });
  }

  const { first_name, last_name, email, date_of_birth } = req.body;
  const db = getDb();
  db.run(
    `INSERT INTO students (first_name, last_name, email, date_of_birth) VALUES (?, ?, ?, ?)`,
    [first_name, last_name, email, date_of_birth || null],
    function (err) {
      db.close();
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(409).json({ error: 'DuplicateEmail', message: 'A student with this email already exists.' });
        }
        return next(err);
      }
      res.status(201).json({ id: this.lastID, first_name, last_name, email, date_of_birth: date_of_birth || null });
    }
  );
});

/**
 * @api {put} /students/:id Update a student
 * @apiName UpdateStudent
 * @apiGroup Students
 * @apiParam {Number} id Student's unique ID.
 * @apiBody {String} first_name Student's first name.
 * @apiBody {String} last_name Student's last name.
 * @apiBody {String} email Student's unique email address.
 * @apiBody {String} [date_of_birth] ISO date, e.g. 2003-04-12.
 * @apiSuccess {Object} student Updated student record.
 * @apiError (400) ValidationError One or more fields failed validation.
 * @apiError (404) StudentNotFound Student with the given id was not found.
 * @apiError (409) DuplicateEmail A student with the same email already exists.
 */
router.put('/:id', studentValidationRules, (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'ValidationError', message: 'One or more fields failed validation.', details: errors.array() });
  }

  const { first_name, last_name, email, date_of_birth } = req.body;
  const db = getDb();
  db.run(
    `UPDATE students SET first_name = ?, last_name = ?, email = ?, date_of_birth = ? WHERE id = ?`,
    [first_name, last_name, email, date_of_birth || null, req.params.id],
    function (err) {
      db.close();
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(409).json({ error: 'DuplicateEmail', message: 'A student with this email already exists.' });
        }
        return next(err);
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'StudentNotFound', message: `Student with id ${req.params.id} not found.` });
      }
      res.status(200).json({ id: Number(req.params.id), first_name, last_name, email, date_of_birth: date_of_birth || null });
    }
  );
});

/**
 * @api {delete} /students/:id Remove a student
 * @apiName DeleteStudent
 * @apiGroup Students
 * @apiParam {Number} id Student's unique ID.
 * @apiError (409) HasActiveEnrollments Student cannot be deleted while enrollments exist.
 */
router.delete('/:id', (req, res, next) => {
  const db = getDb();
  db.get('SELECT COUNT(*) AS count FROM enrollments WHERE student_id = ?', [req.params.id], (err, row) => {
    if (err) {
      db.close();
      return next(err);
    }
    if (row.count > 0) {
      db.close();
      return res.status(409).json({
        error: 'HasActiveEnrollments',
        message: 'Cannot delete a student who has active enrollments. Remove enrollments first.',
      });
    }

    db.run('DELETE FROM students WHERE id = ?', [req.params.id], function (err) {
      db.close();
      if (err) return next(err);
      if (this.changes === 0) {
        return res.status(404).json({ error: 'StudentNotFound', message: `Student with id ${req.params.id} not found.` });
      }
      res.status(204).send();
    });
  });
});

module.exports = router;
