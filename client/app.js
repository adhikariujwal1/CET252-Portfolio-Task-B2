// client/app.js
// Demonstrates a GET request to the local Student Management API
// and renders the results in the table (S7.1).

const API_BASE = 'http://127.0.0.1:3000';

const statusEl = document.getElementById('status');
const rowsEl = document.getElementById('student-rows');
const apiEndpointEl = document.getElementById('api-endpoint');
const studentCountEl = document.getElementById('student-count');
const refreshButton = document.getElementById('refresh-button');
const studentForm = document.getElementById('student-form');
const firstNameInput = document.getElementById('first-name');
const lastNameInput = document.getElementById('last-name');
const emailInput = document.getElementById('email');
const dobInput = document.getElementById('date-of-birth');

function formatDate(isoDate) {
  if (!isoDate) return '—';
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
}

async function loadStudents() {
  statusEl.textContent = 'Loading students…';
  statusEl.classList.remove('error');
  apiEndpointEl.textContent = `${API_BASE}/students`;

  try {
    const response = await fetch(`${API_BASE}/students`);

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const students = await response.json();

    rowsEl.innerHTML = '';
    students.forEach((student) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${student.first_name} ${student.last_name}</td>
        <td>${student.email}</td>
        <td>${formatDate(student.enrolled_since)}</td>
        <td><button type="button" class="delete-button" data-id="${student.id}">Delete</button></td>
      `;

      const deleteButton = row.querySelector('.delete-button');
      deleteButton.addEventListener('click', async () => {
        await deleteStudent(student.id);
      });

      rowsEl.appendChild(row);
    });

    studentCountEl.textContent = students.length;
    statusEl.textContent = `Loaded ${students.length} students from GET ${API_BASE}/students`;
  } catch (err) {
    rowsEl.innerHTML = '';
    studentCountEl.textContent = '0';
    statusEl.textContent = `Could not load students: ${err.message}. Is the API running on ${API_BASE}?`;
    statusEl.classList.add('error');
  }
}

async function createStudent(event) {
  event.preventDefault();
  const studentData = {
    first_name: firstNameInput.value.trim(),
    last_name: lastNameInput.value.trim(),
    email: emailInput.value.trim(),
    date_of_birth: dobInput.value || null,
  };

  setStatus('Creating student…');

  try {
    const response = await fetch(`${API_BASE}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentData),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => null);
      throw new Error(errorPayload?.message || `API responded with status ${response.status}`);
    }

    await loadStudents();
    studentForm.reset();
    setStatus('Student created successfully and list refreshed.');
  } catch (err) {
    setStatus(`Could not create student: ${err.message}`, true);
  }
}

async function deleteStudent(studentId) {
  setStatus('Deleting student…');

  try {
    const response = await fetch(`${API_BASE}/students/${studentId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => null);
      throw new Error(errorPayload?.message || `API responded with status ${response.status}`);
    }

    await loadStudents();
    setStatus('Student deleted successfully.');
  } catch (err) {
    setStatus(`Could not delete student: ${err.message}`, true);
  }
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle('error', isError);
}

refreshButton.addEventListener('click', () => {
  loadStudents();
});

studentForm.addEventListener('submit', createStudent);

loadStudents();
