# CET252 Portfolio Task B2 — Student Management System

A small Node/Express/SQLite REST API with a vanilla JS client, built to demonstrate CRUD functionality, error handling, generated API documentation, and functional testing, per the CET252 Portfolio B2 brief.

## Project structure
```
api/        REST API (Express + SQLite)
client/     Frontend that consumes the API
docs/       Generated APIDOC site (created by `npm run docs`)
```

## Prerequisites
- Node 20.10.0 LTS
- npm

## 1. Set up and run the API
```
cd api
npm install
npm run seed      # builds database.sqlite and populates sample data
npm start          # starts the API on http://localhost:3000
```

## 2. Generate API documentation
```
cd api
npm run docs        # generates docs into /docs
```
With the API running, visit http://localhost:3000/docs to view it.

## 3. Run the client
In a separate terminal:
```
cd client
npm install
npm start            # serves the client on http://localhost:5000
```
Open http://localhost:5000 in a browser. The page performs a live `GET /students` request against the API.

## 4. Run functional tests
With both the API and client running:
```
cd client
npm test
```

## API overview
| Resource | Endpoints |
|---|---|
| Students | GET /students, GET /students/:id, POST /students, PUT /students/:id, DELETE /students/:id |
| Courses | GET /courses, GET /courses/:id, POST /courses, PUT /courses/:id, DELETE /courses/:id |
| Enrollments | GET /enrollments, POST /enrollments, PUT /enrollments/:id, DELETE /enrollments/:id |

A simple health check endpoint is available at `/health` for quick local verification.

Full documentation with parameters and example responses is generated via APIDOC (see step 2 above).

## Notes
- Deleting a student or course with active enrollments returns `409 Conflict`.
- Duplicate enrollments (same student + course) are rejected with `409 Conflict`, enforced at the database level via a UNIQUE constraint.
- All error responses share the shape `{ "error": "...", "message": "..." }`.

## Not included in this archive
- Trello board (see separate B1 submission)
- Figma lo-fi and hi-fi prototype files
- Screencast recording
