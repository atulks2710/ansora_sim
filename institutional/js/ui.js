// ==========================================
// EDUBRIDGE — SHARED UI UTILITIES
// ==========================================

/**
 * Renders the sidebar HTML string
 * @param {string} activeItem - key matching data-nav attributes
 */
export function getSidebarHTML(activeItem = "dashboard") {
  const navItems = [
    { key: "dashboard", icon: "grid", label: "Dashboard", href: "index.html" },
    { key: "profile", icon: "user", label: "My Profile", href: "profile.html" },
    { key: "opportunities", icon: "compass", label: "Opportunities", href: "opportunities.html", section: "OPPORTUNITIES" },
    { key: "internships", icon: "briefcase", label: "Faculty Internships", href: "internships.html" },
    { key: "industrial-training", icon: "building", label: "Industrial Training", href: "industrial-training.html" },
    { key: "fdp", icon: "award", label: "FDPs", href: "fdp.html" },
    { key: "workshops", icon: "tool", label: "Workshops", href: "workshops.html" },
    { key: "consultancy", icon: "dollar-sign", label: "Consultancy", href: "consultancy.html" },
    { key: "research", icon: "flask", label: "Research", href: "research.html" },
    { key: "guest-lectures", icon: "mic", label: "Guest Lectures", href: "guest-lectures.html" },
    { key: "mentorship", icon: "users", label: "Mentorship", href: "mentorship.html" },
    { key: "applications", icon: "file-text", label: "Applications", href: "applications.html", section: "MY WORK" },
    { key: "portfolio", icon: "layout", label: "Portfolio", href: "portfolio.html" },
    { key: "events", icon: "calendar", label: "Events", href: "events.html" },
    { key: "notifications", icon: "bell", label: "Notifications", href: "notifications.html", section: "ACCOUNT" },
    { key: "settings", icon: "settings", label: "Settings", href: "settings.html" },
  ];

  const iconMap = {
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    compass: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>',
    briefcase: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
    building: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="9" width="18" height="12" rx="1"/><path d="M3 9l9-6 9 6"/><line x1="9" y1="21" x2="9" y2="12"/><line x1="15" y1="21" x2="15" y2="12"/></svg>',
    award: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>',
    tool: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
    "dollar-sign": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    flask: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3h6v10l4 8H5l4-8V3"/><line x1="9" y1="3" x2="9" y2="10"/><line x1="15" y1="3" x2="15" y2="10"/></svg>',
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    "file-text": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
    layout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    "log-out": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
    "help-circle": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  };

  let html = `
    <div class="sidebar-brand">
      <a href="index.html" class="brand">
        <div class="brand-mark">SB</div>
        <div class="brand-name">SKILL<span>BRIDGE</span></div>
      </a>
    </div>
    <div style="padding:4px 18px 12px;font-size:9px;font-weight:700;color:var(--teal);letter-spacing:1.5px">INSTITUTION PORTAL</div>
    <nav class="sidebar-nav">`;

  navItems.forEach(item => {
    if (item.section) {
      html += `<div class="nav-section-title">${item.section}</div>`;
    }
    html += `
      <a href="${item.href}" class="nav-item${activeItem === item.key ? " active" : ""}" data-nav="${item.key}">
        <span class="nav-icon">${iconMap[item.icon] || ""}</span>
        <span>${item.label}</span>
      </a>`;
  });

  html += `</nav>
    <div class="sidebar-footer">
      <div class="sidebar-user">
        <div class="user-avatar" data-user-initials>PN</div>
        <div class="user-meta">
          <strong data-user-name>Dr. Priya Nair</strong>
          <span data-user-designation>Associate Professor</span>
        </div>
      </div>
      <button class="sidebar-action-btn" onclick="window.open('../../index.html','_self')">
        <span class="nav-icon">${iconMap["help-circle"]}</span> Help
      </button>
      <button class="sidebar-action-btn" id="logoutBtn">
        <span class="nav-icon">${iconMap["log-out"]}</span> Logout
      </button>
    </div>`;

  return html;
}

/**
 * Renders topbar HTML
 */
export function getTopbarHTML(pageTitle = "Dashboard", notifCount = 3) {
  return `
    <button class="hamburger" id="hamburger" aria-label="Toggle menu">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>
    <div class="topbar-left">
      <span class="page-title">${pageTitle}</span>
    </div>
    <div class="topbar-search">
      <div class="search-wrap">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input type="text" placeholder="Search opportunities, FDPs, events..." aria-label="Search">
      </div>
    </div>
    <div class="topbar-right">
      <a href="notifications.html" class="icon-btn" aria-label="Notifications">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        ${notifCount > 0 ? `<span class="notif-badge">${notifCount}</span>` : ""}
      </a>
      <a href="profile.html" class="topbar-avatar" aria-label="Profile" data-user-initials>PN</a>
    </div>`;
}

/**
 * Renders mobile bottom navigation HTML
 */
export function getMobileNavHTML(activeItem = "dashboard") {
  const items = [
    { key: "dashboard", label: "Home", href: "index.html", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>' },
    { key: "opportunities", label: "Explore", href: "opportunities.html", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>' },
    { key: "applications", label: "Applications", href: "applications.html", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' },
    { key: "portfolio", label: "Portfolio", href: "portfolio.html", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>' },
    { key: "profile", label: "Profile", href: "profile.html", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' },
  ];

  return items.map(item => `
    <a href="${item.href}" class="mobile-nav-item${activeItem === item.key ? " active" : ""}">
      ${item.icon}
      <span>${item.label}</span>
    </a>`).join("");
}

/**
 * Initialize sidebar mobile toggle
 */
export function initSidebarToggle() {
  const hamburger = document.getElementById("hamburger");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");

  if (hamburger && sidebar) {
    hamburger.addEventListener("click", () => {
      sidebar.classList.toggle("open");
      if (overlay) overlay.classList.toggle("open");
    });
  }

  if (overlay) {
    overlay.addEventListener("click", () => {
      sidebar.classList.remove("open");
      overlay.classList.remove("open");
    });
  }
}

/**
 * Show a toast notification
 */
export function showToast(message, type = "info", duration = 3500) {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      ${type === "success"
        ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'
        : type === "error"
        ? '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'
        : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'}
    </svg>
    <span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(20px)";
    toast.style.transition = "all .3s";
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Render a progress bar
 */
export function progressBar(label, value, type = "") {
  return `
    <div class="progress-wrap">
      <div class="progress-header">
        <span class="progress-label">${label}</span>
        <span class="progress-value">${value}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill ${type}" style="width: ${value}%"></div>
      </div>
    </div>`;
}

/**
 * Render an opportunity card
 */
export function oppCard({ title, organization, orgInitials, location, mode, duration, domain, skills, deadline, match, id, type, btnLabel = "View Details" }) {
  return `
    <div class="opp-card" data-id="${id}">
      <div class="opp-header">
        <div class="flex items-center gap-3">
          <div class="opp-org-logo">${orgInitials}</div>
          <div>
            <div class="opp-title">${title}</div>
            <div class="opp-org">${organization}</div>
          </div>
        </div>
        ${match ? `<div class="badge badge-teal">${match}% Match</div>` : ""}
      </div>
      <div class="opp-meta">
        ${location ? `<span class="meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${location}</span>` : ""}
        ${mode ? `<span class="meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>${mode}</span>` : ""}
        ${duration ? `<span class="meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${duration}</span>` : ""}
        ${domain ? `<span class="badge badge-navy">${domain}</span>` : ""}
      </div>
      ${skills && skills.length ? `<div class="opp-skills">${skills.map(s => `<span class="skill-tag">${s}</span>`).join("")}</div>` : ""}
      <div class="opp-footer">
        ${deadline ? `<span class="deadline-text">📅 Deadline: ${deadline}</span>` : ""}
        <button class="btn btn-primary btn-sm" onclick="viewDetail('${type}','${id}')">${btnLabel}</button>
      </div>
    </div>`;
}

/**
 * Render a status badge
 */
export function statusBadge(status) {
  const map = {
    "Applied": "badge-navy",
    "Under Review": "badge-warning",
    "Shortlisted": "badge-teal",
    "Interview": "badge-purple",
    "Accepted": "badge-success",
    "Completed": "badge-gray",
    "Rejected": "badge-error",
    "Selected": "badge-success",
    "Scheduled": "badge-teal"
  };
  return `<span class="badge ${map[status] || "badge-gray"}">${status}</span>`;
}

/**
 * Render skeleton loading cards
 */
export function renderSkeletons(count = 3) {
  return Array(count).fill("").map(() => `
    <div class="card">
      <div class="skeleton skel-line mb-3"></div>
      <div class="skeleton skel-line short mb-3"></div>
      <div class="skeleton skel-line medium mb-3"></div>
      <div style="display:flex;gap:8px;margin-top:12px">
        <div class="skeleton" style="height:28px;width:80px;border-radius:6px"></div>
        <div class="skeleton" style="height:28px;width:100px;border-radius:6px"></div>
      </div>
    </div>`).join("");
}
