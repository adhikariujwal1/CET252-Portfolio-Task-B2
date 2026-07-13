# Student Management Client

A simple frontend for the Student Management System REST API.

## Features
- View all students fetched from `GET /students`
- Create a student record using `POST /students`
- Delete a student using `DELETE /students/:id`
- Live status messages and error handling

## Running the client

1. Open a terminal in `client/`
2. Install dependencies: `npm install`
3. Start the app: `npm start`
4. Open `http://localhost:5000`

## Functional tests

With the API running on `http://localhost:3000` and the client served on `http://localhost:5000`:

```bash
cd client
npm test
```

This runs the TestCafe suite covering page load, refresh, create student, and delete student scenarios.
