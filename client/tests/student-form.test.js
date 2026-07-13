import { Selector } from 'testcafe';

const CLIENT_URL = 'http://localhost:5000';
let createdEmail = null;

fixture('Student Management System — Student CRUD')
  .page(CLIENT_URL);

  test('Create a student and refresh list', async (t) => {
    const firstName = Selector('#first-name');
    const lastName = Selector('#last-name');
    const email = Selector('#email');
    const dob = Selector('#date-of-birth');
    const submitButton = Selector('#create-button');
    const statusText = Selector('#status');
    const rows = Selector('#student-rows tr');

    const initialCount = await rows.count;
    createdEmail = `test.user.${Date.now()}@example.com`;

    await t
      .typeText(firstName, 'Test')
      .typeText(lastName, 'User')
      .typeText(email, createdEmail)
      .typeText(dob, '2005-05-05')
      .click(submitButton)
      .expect(statusText.textContent).contains('Student created successfully', { timeout: 7000 });

    await t.expect(rows.count).eql(initialCount + 1);
  });

  test('Delete a student from the list', async (t) => {
    const statusText = Selector('#status');
    const initialCount = await Selector('#student-rows tr').count;
    const createdRow = Selector('#student-rows tr').withText(createdEmail);
    const deleteButton = createdRow.find('.delete-button');

    await t.expect(createdRow.exists).ok({ timeout: 7000 });
    await t
      .click(deleteButton)
      .expect(statusText.textContent).contains('Student deleted successfully', { timeout: 7000 });

    await t.expect(Selector('#student-rows tr').count).eql(initialCount - 1);
  });
