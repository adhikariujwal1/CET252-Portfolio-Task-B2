// client/tests/student-list.test.js
// Functional tests for the Student Management client (S8.1)
// Run with: npx testcafe chrome tests/student-list.test.js
// Prerequisite: API running on http://localhost:3000, client served (e.g. `npx serve .`)

import { Selector } from 'testcafe';

const CLIENT_URL = 'http://localhost:5000'; // adjust to match your `serve` port

fixture('Student Management System — Student List')
  .page(CLIENT_URL);

test('Happy path: page loads and displays student rows fetched from the API', async (t) => {
  const statusText = Selector('#status');
  const rows = Selector('#student-rows tr');
  const endpointLabel = Selector('#api-endpoint');
  const studentCount = Selector('#student-count');

  await t
    .expect(statusText.textContent).contains('Loaded', { timeout: 5000 })
    .expect(endpointLabel.textContent).contains('http://127.0.0.1:3000/students')
    .expect(rows.count).gte(1);

  const rowCount = await rows.count;
  await t.expect(studentCount.textContent).eql(rowCount.toString());

  const firstRowText = await rows.nth(0).textContent;
  await t.expect(firstRowText.length).gt(0);
});

test('Table displays expected column headers', async (t) => {
  const headers = Selector('#student-table thead th');

  await t
    .expect(headers.count).eql(4)
    .expect(headers.nth(0).textContent).eql('Name')
    .expect(headers.nth(1).textContent).eql('Email')
    .expect(headers.nth(2).textContent).eql('Enrolled Since')
    .expect(headers.nth(3).textContent).eql('Actions');
});

test('Interaction: refresh button reloads the student list', async (t) => {
  const refreshButton = Selector('#refresh-button');
  const statusText = Selector('#status');

  await t
    .expect(refreshButton.exists).ok()
    .click(refreshButton)
    .expect(statusText.textContent).contains('Loaded', { timeout: 5000 });
});

test('Negative case: shows a clear error message when the API is unreachable', async (t) => {
  // This test is intended to be run with the API stopped, to verify
  // the client's error-handling path (see app.js catch block).
  // Comment out / skip during the happy-path suite run.
  const statusText = Selector('#status');

  await t
    .expect(statusText.textContent).contains('Could not load students', { timeout: 5000 })
    .expect(statusText.hasClass('error')).ok();
}).skip; // unskip manually when deliberately testing the API-down scenario
