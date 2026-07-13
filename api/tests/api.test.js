const request = require('supertest');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

process.env.DB_PATH = path.join(__dirname, 'test-database.sqlite');
const app = require('../server');

beforeAll(() => {
  const seedPath = path.join(__dirname, '..', 'db', 'seed.js');
  execSync(`node "${seedPath}"`, { stdio: 'inherit' });
});

afterAll(() => {
  const dbPath = path.join(__dirname, 'test-database.sqlite');
  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
});

describe('API smoke tests', () => {
  test('GET /students returns student list', async () => {
    const response = await request(app).get('/students');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(20);
    expect(response.body[0]).toHaveProperty('email');
  });

  test('POST /students rejects invalid student input', async () => {
    const response = await request(app)
      .post('/students')
      .send({ first_name: '', last_name: 'Test', email: 'not-an-email' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'ValidationError');
  });

  test('GET /courses returns course list', async () => {
    const response = await request(app).get('/courses');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(6);
  });

  test('GET /enrollments returns enrollments with student/course details', async () => {
    const response = await request(app).get('/enrollments');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0]).toHaveProperty('student_id');
    expect(response.body[0]).toHaveProperty('course_id');
  });
});
