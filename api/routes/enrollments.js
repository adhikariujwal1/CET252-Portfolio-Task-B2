// api/routes/enrollments.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDb } = require('../db/database');

const router = express.Router();

/**
 * @api {get} /enrollments Get all enrollments (with student/course detail)
 * @apiName GetEnrollments
 * @apiGroup Enrollments
 */
router.get('/', (req, res, next) => {
  const db = getDb();
  const sql = `
    SELECT e.id, e.student_id, e.course_id, e.enrolled_on, e.grade,
           s.first_name, s.last_name, c.code AS course_code, c.title AS course_title
    FROM enrollments e
    JOIN students s ON s.id = e.student_id
    JOIN courses c ON c.id = e.course_id
    ORDER BY e.id
  `;
  db.all(sql, [], (err, rows) => {
    db.close();
    if (err) return next(err);
    res.status(200).json(rows);
  });
});

const enrollmentValidationRules = [
  body('student_id').isInt({ min: 1 }).withMessage('student_id must be a positive integer'),
  body('course_id').isInt({ min: 1 }).withMessage('course_id must be a positive integer'),
];

/**
 * @api {post} /enrollments Enrol a student on a course
 * @apiName CreateEnrollment
 * @apiGroup Enrollments
 * @apiBody {Number} student_id ID of the student.
 * @apiBody {Number} course_id ID of the course.
 * @apiSuccess (201) {Object} enrollment The newly created enrollment.
 * @apiError (400) ValidationError One or more fields failed validation.
 * @apiError (404) StudentNotFound Student with the given id was not found.
 * @apiError (404) CourseNotFound Course with the given id was not found.
 * @apiError (409) DuplicateEnrollment Student is already enrolled on this course.
 */
router.post('/', enrollmentValidationRules, (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'ValidationError', message: 'One or more fields failed validation.', details: errors.array() });
  }

  const { student_id, course_id } = req.body;
  const db = getDb();

  db.get('SELECT id FROM students WHERE id = ?', [student_id], (err, student) => {
    if (err) { db.close(); return next(err); }
    if (!student) {
      db.close();
      return res.status(404).json({ error: 'StudentNotFound', message: `Student with id ${student_id} not found.` });
    }

    db.get('SELECT id FROM courses WHERE id = ?', [course_id], (err, course) => {
      if (err) { db.close(); return next(err); }
      if (!course) {
        db.close();
        return res.status(404).json({ error: 'CourseNotFound', message: `Course with id ${course_id} not found.` });
      }

      db.run(
        `INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)`,
        [student_id, course_id],
        function (err) {
          db.close();
          if (err) {
            if (err.message.includes('UNIQUE')) {
              return res.status(409).json({
                error: 'DuplicateEnrollment',
                message: 'This student is already enrolled on this course.',
              });
            }
            return next(err);
          }
          res.status(201).json({ id: this.lastID, student_id, course_id, grade: null });
        }
      );
    });
  });
});

/**
 * @api {get} /enrollments/:id Get a single enrollment
 * @apiName GetEnrollment
 * @apiGroup Enrollments
 * @apiParam {Number} id Enrollment's unique ID.
 * @apiSuccess {Object} enrollment Enrollment record with student and course details.
 * @apiError (404) EnrollmentNotFound Enrollment with the given id was not found.
 */
router.get('/:id', (req, res, next) => {
  const db = getDb();
  const sql = `
    SELECT e.id, e.student_id, e.course_id, e.enrolled_on, e.grade,
           s.first_name, s.last_name, c.code AS course_code, c.title AS course_title
    FROM enrollments e
    JOIN students s ON s.id = e.student_id
    JOIN courses c ON c.id = e.course_id
    WHERE e.id = ?
  `;
  db.get(sql, [req.params.id], (err, row) => {
    db.close();
    if (err) return next(err);
    if (!row) {
      return res.status(404).json({ error: 'EnrollmentNotFound', message: `Enrollment with id ${req.params.id} not found.` });
    }
    res.status(200).json(row);
  });
});

/**
 * @api {put} /enrollments/:id Update an enrollment's grade
 * @apiName UpdateEnrollmentGrade
 * @apiGroup Enrollments
 * @apiParam {Number} id Enrollment's unique ID.
 * @apiBody {String} grade Enrollment grade.
 * @apiSuccess {Object} enrollment Updated enrollment record.
 * @apiError (400) ValidationError grade is required.
 * @apiError (404) EnrollmentNotFound Enrollment with the given id was not found.
 */
router.put('/:id', body('grade').isString().notEmpty(), (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'ValidationError', message: 'grade is required.', details: errors.array() });
  }

  const db = getDb();
  db.run('UPDATE enrollments SET grade = ? WHERE id = ?', [req.body.grade, req.params.id], function (err) {
    db.close();
    if (err) return next(err);
    if (this.changes === 0) {
      return res.status(404).json({ error: 'EnrollmentNotFound', message: `Enrollment with id ${req.params.id} not found.` });
    }
    res.status(200).json({ id: Number(req.params.id), grade: req.body.grade });
  });
});

/**
 * @api {delete} /enrollments/:id Remove an enrollment
 * @apiName DeleteEnrollment
 * @apiGroup Enrollments
 * @apiParam {Number} id Enrollment's unique ID.
 * @apiError (404) EnrollmentNotFound Enrollment with the given id was not found.
 */
router.delete('/:id', (req, res, next) => {
  const db = getDb();
  db.run('DELETE FROM enrollments WHERE id = ?', [req.params.id], function (err) {
    db.close();
    if (err) return next(err);
    if (this.changes === 0) {
      return res.status(404).json({ error: 'EnrollmentNotFound', message: `Enrollment with id ${req.params.id} not found.` });
    }
    res.status(204).send();
  });
});

module.exports = router;
