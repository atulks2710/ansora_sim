function redirectByRole(role) {
  const routes = {
    student: 'student-home.html',
    academician: 'academician-home.html',
    industry: 'industry-home.html',
    institution: 'institution-home.html',
  };

  const target = routes[role] || 'index.html';
  window.location.href = target;
}

window.redirectByRole = redirectByRole;
