// api/routes/courses.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDb } = require('../db/database');

const router = express.Router();

/**
 * @api {get} /courses Get all courses
 * @apiName GetCourses
 * @apiGroup Courses
 */
router.get('/', (req, res, next) => {
  const db = getDb();
  db.all('SELECT * FROM courses ORDER BY code', [], (err, rows) => {
    db.close();
    if (err) return next(err);
    res.status(200).json(rows);
  });
});

/**
 * @api {get} /courses/:id Get a single course
 * @apiName GetCourse
 * @apiGroup Courses
 * @apiParam {Number} id Course's unique ID.
 * @apiSuccess {Object} course The requested course.
 * @apiError (404) CourseNotFound Course with the given id was not found.
 */
router.get('/:id', (req, res, next) => {
  const db = getDb();
  db.get('SELECT * FROM courses WHERE id = ?', [req.params.id], (err, row) => {
    db.close();
    if (err) return next(err);
    if (!row) {
      return res.status(404).json({ error: 'CourseNotFound', message: `Course with id ${req.params.id} not found.` });
    }
    res.status(200).json(row);
  });
});

const courseValidationRules = [
  body('code').isString().trim().notEmpty().withMessage('code is required'),
  body('title').isString().trim().notEmpty().withMessage('title is required'),
  body('credits').isInt({ min: 1 }).withMessage('credits must be a positive integer'),
  body('department').isString().trim().notEmpty().withMessage('department is required'),
];

/**
 * @api {post} /courses Create a course
 * @apiName CreateCourse
 * @apiGroup Courses
 * @apiBody {String} code Course code, e.g. CS101.
 * @apiBody {String} title Course title.
 * @apiBody {Number} credits Course credit value.
 * @apiBody {String} department Course department.
 * @apiSuccess (201) {Object} course The newly created course.
 * @apiError (400) ValidationError One or more fields failed validation.
 * @apiError (409) DuplicateCourseCode A course with the same code already exists.
 */
router.post('/', courseValidationRules, (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'ValidationError', message: 'One or more fields failed validation.', details: errors.array() });
  }

  const { code, title, credits, department } = req.body;
  const db = getDb();
  db.run(
    `INSERT INTO courses (code, title, credits, department) VALUES (?, ?, ?, ?)`,
    [code, title, credits, department],
    function (err) {
      db.close();
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(409).json({ error: 'DuplicateCourseCode', message: 'A course with this code already exists.' });
        }
        return next(err);
      }
      res.status(201).json({ id: this.lastID, code, title, credits, department });
    }
  );
});

/**
 * @api {put} /courses/:id Update a course
 * @apiName UpdateCourse
 * @apiGroup Courses
 * @apiParam {Number} id Course's unique ID.
 * @apiBody {String} code Course code, e.g. CS101.
 * @apiBody {String} title Course title.
 * @apiBody {Number} credits Course credit value.
 * @apiBody {String} department Course department.
 * @apiSuccess {Object} course Updated course record.
 * @apiError (400) ValidationError One or more fields failed validation.
 * @apiError (404) CourseNotFound Course with the given id was not found.
 * @apiError (409) DuplicateCourseCode A course with the same code already exists.
 */
router.put('/:id', courseValidationRules, (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'ValidationError', message: 'One or more fields failed validation.', details: errors.array() });
  }

  const { code, title, credits, department } = req.body;
  const db = getDb();
  db.run(
    `UPDATE courses SET code = ?, title = ?, credits = ?, department = ? WHERE id = ?`,
    [code, title, credits, department, req.params.id],
    function (err) {
      db.close();
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(409).json({ error: 'DuplicateCourseCode', message: 'A course with this code already exists.' });
        }
        return next(err);
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'CourseNotFound', message: `Course with id ${req.params.id} not found.` });
      }
      res.status(200).json({ id: Number(req.params.id), code, title, credits, department });
    }
  );
});

/**
 * @api {delete} /courses/:id Remove a course
 * @apiName DeleteCourse
 * @apiGroup Courses
 * @apiParam {Number} id Course's unique ID.
 * @apiError (409) HasActiveEnrollments Course cannot be deleted while enrollments exist.
 * @apiError (404) CourseNotFound Course with the given id was not found.
 */
router.delete('/:id', (req, res, next) => {
  const db = getDb();
  db.get('SELECT COUNT(*) AS count FROM enrollments WHERE course_id = ?', [req.params.id], (err, row) => {
    if (err) {
      db.close();
      return next(err);
    }
    if (row.count > 0) {
      db.close();
      return res.status(409).json({
        error: 'HasActiveEnrollments',
        message: 'Cannot delete a course that has active enrollments. Remove enrollments first.',
      });
    }

    db.run('DELETE FROM courses WHERE id = ?', [req.params.id], function (err) {
      db.close();
      if (err) return next(err);
      if (this.changes === 0) {
        return res.status(404).json({ error: 'CourseNotFound', message: `Course with id ${req.params.id} not found.` });
      }
      res.status(204).send();
    });
  });
});

module.exports = router;
