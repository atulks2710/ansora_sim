function redirectByRole(role) {
  const normalizedRole = String(role || '').trim().toLowerCase();
  const routes = {
    student: 'student/student-home.html',
    academician: 'academician/academician-home.html',
    industry: 'industry/index.html',
    institution: 'institutional/index.html',
    institutional: 'institutional/index.html',
  };

  const target = routes[normalizedRole] || 'index.html';
  window.location.href = target;
}

window.redirectByRole = redirectByRole;
