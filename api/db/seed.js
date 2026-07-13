// api/db/seed.js
// Populates the SQLite database with realistic sample data for the
// Student Management System (Students, Courses, Enrollments).
// Run with: npm run seed

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'database.sqlite');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

function seedDatabase() {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(DB_PATH)) {
      fs.unlinkSync(DB_PATH);
    }

    const db = new sqlite3.Database(DB_PATH);

    db.serialize(() => {
      const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8');
      db.exec(schemaSql, (err) => {
        if (err) {
          db.close();
          return reject(err);
        }

        const insertStudent = db.prepare(
          `INSERT INTO students (first_name, last_name, email, date_of_birth) VALUES (?, ?, ?, ?)`
        );
        students.forEach((s) => insertStudent.run(s));
        insertStudent.finalize();

        const insertCourse = db.prepare(
          `INSERT INTO courses (code, title, credits, department) VALUES (?, ?, ?, ?)`
        );
        courses.forEach((c) => insertCourse.run(c));
        insertCourse.finalize();

        const insertEnrollment = db.prepare(
          `INSERT OR IGNORE INTO enrollments (student_id, course_id, grade) VALUES (?, ?, ?)`
        );

        for (let studentId = 1; studentId <= students.length; studentId++) {
          const numCourses = 1 + Math.floor(Math.random() * 3);
          const takenCourseIds = new Set();

          while (takenCourseIds.size < numCourses) {
            const courseId = 1 + Math.floor(Math.random() * courses.length);
            takenCourseIds.add(courseId);
          }

          takenCourseIds.forEach((courseId) => {
            insertEnrollment.run(studentId, courseId, randomFrom(grades));
          });
        }

        insertEnrollment.finalize((err) => {
          if (err) {
            db.close();
            return reject(err);
          }
          console.log('Seed complete: 22 students, 6 courses, enrollments with mixed graded/pending rows.');
          db.close();
          resolve();
        });
      });
    });
  });
}

seedDatabase().catch((err) => {
  console.error('Failed to seed database:', err.message);
  process.exit(1);
});

const students = [
  ['Alice', 'Nguyen', 'alice.nguyen@example.com', '2003-04-12'],
  ['Ben', 'Carter', 'ben.carter@example.com', '2002-11-02'],
  ['Chloe', 'Smith', 'chloe.smith@example.com', '2003-01-27'],
  ['David', 'Okafor', 'david.okafor@example.com', '2001-09-15'],
  ['Emily', 'Wright', 'emily.wright@example.com', '2003-06-30'],
  ['Farhan', 'Ahmed', 'farhan.ahmed@example.com', '2002-03-08'],
  ['Grace', 'Kim', 'grace.kim@example.com', '2003-12-19'],
  ['Harry', 'Jones', 'harry.jones@example.com', '2002-07-22'],
  ['Isla', 'Murphy', 'isla.murphy@example.com', '2003-02-14'],
  ['Jack', 'Patel', 'jack.patel@example.com', '2001-10-05'],
  ['Katie', 'Brown', 'katie.brown@example.com', '2003-08-11'],
  ['Liam', 'Walsh', 'liam.walsh@example.com', '2002-05-27'],
  ['Mia', 'Davies', 'mia.davies@example.com', '2003-03-03'],
  ['Noah', 'Evans', 'noah.evans@example.com', '2002-01-16'],
  ['Olivia', 'Hughes', 'olivia.hughes@example.com', '2003-09-24'],
  ['Priya', 'Sharma', 'priya.sharma@example.com', '2002-12-01'],
  ['Quinn', 'Taylor', 'quinn.taylor@example.com', '2003-07-07'],
  ['Ryan', 'Foster', 'ryan.foster@example.com', '2001-11-29'],
  ['Sofia', 'Rossi', 'sofia.rossi@example.com', '2003-05-18'],
  ['Tom', 'Baker', 'tom.baker@example.com', '2002-09-09'],
  ['Uma', 'Iyer', 'uma.iyer@example.com', '2003-10-21'],
  ['Victor', 'Lopez', 'victor.lopez@example.com', '2001-06-13'],
];

const courses = [
  ['CS101', 'Introduction to Programming', 20, 'Computer Science'],
  ['CS205', 'Web Application Development', 20, 'Computer Science'],
  ['CS310', 'Databases and Data Modelling', 15, 'Computer Science'],
  ['MA110', 'Discrete Mathematics', 15, 'Mathematics'],
  ['BU150', 'Introduction to Business', 10, 'Business'],
  ['DS220', 'Data Structures and Algorithms', 20, 'Computer Science'],
];

const grades = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', null]; // null = pending

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
