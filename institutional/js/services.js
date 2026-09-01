// ==========================================
// EDUBRIDGE — SERVICE LAYER (Faculty Module)
// API-ready: swap mock data for fetch() calls
// ==========================================

import {
  FACULTY,
  FACULTY_INTERNSHIPS,
  INDUSTRIAL_TRAININGS,
  FDPS,
  WORKSHOPS,
  CONSULTANCY,
  RESEARCH,
  GUEST_LECTURES,
  MENTORSHIP_PROGRAMS,
  FACULTY_APPLICATIONS,
  EVENTS,
  NOTIFICATIONS
} from "./mock-data.js";

const API_BASE = "/api"; // Replace with actual API base URL when backend is ready
const USE_MOCK = true;   // Set to false to use real API

// ---- UTILITY ----
async function apiGet(endpoint) {
  if (USE_MOCK) return null;
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function apiPost(endpoint, data) {
  if (USE_MOCK) return { success: true, id: Date.now() };
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ==========================================
// FACULTY PROFILE SERVICES
// ==========================================
export async function getFacultyProfile(uid) {
  try {
    const data = await apiGet(`/faculty/${uid}/profile`);
    return data || FACULTY;
  } catch (e) {
    console.warn("Using mock data:", e.message);
    return FACULTY;
  }
}

export async function updateFacultyProfile(uid, profileData) {
  return apiPost(`/faculty/${uid}/profile`, profileData);
}

export async function getFacultyEngagementScore(uid) {
  const profile = await getFacultyProfile(uid);
  return {
    overall: profile.engagementScore,
    breakdown: profile.engagementBreakdown
  };
}

// ==========================================
// OPPORTUNITY SERVICES
// ==========================================
export async function getFacultyInternships(filters = {}) {
  try {
    const data = await apiGet("/faculty/internships");
    return data || FACULTY_INTERNSHIPS;
  } catch {
    return FACULTY_INTERNSHIPS;
  }
}

export async function getIndustrialTrainings(filters = {}) {
  try {
    const data = await apiGet("/faculty/industrial-trainings");
    return data || INDUSTRIAL_TRAININGS;
  } catch {
    return INDUSTRIAL_TRAININGS;
  }
}

export async function getFDPs(filters = {}) {
  try {
    const data = await apiGet("/faculty/fdps");
    return data || FDPS;
  } catch {
    return FDPS;
  }
}

export async function getWorkshops(filters = {}) {
  try {
    const data = await apiGet("/faculty/workshops");
    return data || WORKSHOPS;
  } catch {
    return WORKSHOPS;
  }
}

export async function getConsultancyOpportunities(filters = {}) {
  try {
    const data = await apiGet("/faculty/consultancy");
    return data || CONSULTANCY;
  } catch {
    return CONSULTANCY;
  }
}

export async function getResearchOpportunities(filters = {}) {
  try {
    const data = await apiGet("/faculty/research");
    return data || RESEARCH;
  } catch {
    return RESEARCH;
  }
}

export async function getGuestLectureOpportunities(filters = {}) {
  try {
    const data = await apiGet("/faculty/guest-lectures");
    return data || GUEST_LECTURES;
  } catch {
    return GUEST_LECTURES;
  }
}

export async function getMentorshipPrograms(filters = {}) {
  try {
    const data = await apiGet("/faculty/mentorship");
    return data || MENTORSHIP_PROGRAMS;
  } catch {
    return MENTORSHIP_PROGRAMS;
  }
}

// ==========================================
// APPLICATION SERVICES
// ==========================================
export async function getFacultyApplications(uid) {
  try {
    const data = await apiGet(`/faculty/${uid}/applications`);
    return data || FACULTY_APPLICATIONS;
  } catch {
    return FACULTY_APPLICATIONS;
  }
}

export async function applyForFacultyOpportunity(uid, opportunityId, type, data) {
  return apiPost(`/faculty/${uid}/applications`, { opportunityId, type, ...data });
}

export async function withdrawApplication(uid, appId) {
  return apiPost(`/faculty/${uid}/applications/${appId}/withdraw`, {});
}

// ==========================================
// EVENTS SERVICES
// ==========================================
export async function getEvents(filters = {}) {
  try {
    const data = await apiGet("/faculty/events");
    return data || EVENTS;
  } catch {
    return EVENTS;
  }
}

export async function registerForEvent(uid, eventId) {
  return apiPost(`/faculty/${uid}/events/${eventId}/register`, {});
}

// ==========================================
// NOTIFICATIONS SERVICES
// ==========================================
export async function getNotifications(uid) {
  try {
    const data = await apiGet(`/faculty/${uid}/notifications`);
    return data || NOTIFICATIONS;
  } catch {
    return NOTIFICATIONS;
  }
}

export async function markNotificationRead(uid, notifId) {
  return apiPost(`/faculty/${uid}/notifications/${notifId}/read`, {});
}

// ==========================================
// PORTFOLIO SERVICES
// ==========================================
export async function getFacultyPortfolio(uid) {
  return getFacultyProfile(uid);
}

export async function updatePortfolioSection(uid, section, data) {
  return apiPost(`/faculty/${uid}/portfolio/${section}`, data);
}
