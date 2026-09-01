// ==========================================
// SKILLBRIDGE INSTITUTION SERVICE LAYER
// Firestore-backed version of the institution module
// ==========================================

import { auth, db } from "../../../js/firebase-config.js";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const opportunityCollections = {
  internships: "opportunities",
  industrialTrainings: "institutional_trainings",
  fdps: "fdps",
  workshops: "workshops",
  consultancy: "consultancy",
  research: "research",
  guestLectures: "guest_lectures",
  mentorship: "mentorship_programs"
};

function requireCurrentUid(uid) {
  const currentUid = auth.currentUser?.uid;
  if (!currentUid) throw new Error("You must be logged in.");
  if (uid && uid !== currentUid) throw new Error("Unauthorized user.");
  return currentUid;
}

async function getById(path) {
  const snap = await getDoc(doc(db, ...path));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

async function getCollection(name, filters = []) {
  const constraints = filters.map(([field, op, value]) => where(field, op, value));
  const q = query(collection(db, name), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function addInstitutionalRecord(uid, collectionName, data) {
  const ownerId = requireCurrentUid(uid);
  const ref = await addDoc(collection(db, collectionName), {
    ...data,
    institutionId: ownerId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return { success: true, id: ref.id };
}

// ==========================================
// FACULTY PROFILE
// ==========================================
export async function getFacultyProfile(uid) {
  const ownerId = requireCurrentUid(uid);
  const profile = await getById(["users", ownerId]);
  if (!profile) return null;
  return profile;
}

export async function updateFacultyProfile(uid, profileData) {
  const ownerId = requireCurrentUid(uid);
  await setDoc(doc(db, "users", ownerId), {
    ...profileData,
    uid: ownerId,
    role: "institution",
    updatedAt: serverTimestamp()
  }, { merge: true });
  return { success: true };
}

export async function getFacultyEngagementScore(uid) {
  const profile = await getFacultyProfile(uid);
  return {
    overall: profile?.engagementScore || 0,
    breakdown: profile?.engagementBreakdown || {}
  };
}

// ==========================================
// OPPORTUNITY DISCOVERY
// ==========================================
export async function getFacultyInternships() {
  return getCollection(opportunityCollections.internships, [["status", "==", "Active"]]);
}

export async function getIndustrialTrainings() {
  return getCollection(opportunityCollections.industrialTrainings, [["status", "==", "Active"]]);
}

export async function getFDPs() {
  return getCollection(opportunityCollections.fdps, [["status", "==", "Active"]]);
}

export async function getWorkshops() {
  return getCollection(opportunityCollections.workshops, [["status", "==", "Active"]]);
}

export async function getConsultancyOpportunities() {
  return getCollection(opportunityCollections.consultancy, [["status", "==", "Active"]]);
}

export async function getResearchOpportunities() {
  return getCollection(opportunityCollections.research, [["status", "==", "Active"]]);
}

export async function getGuestLectureOpportunities() {
  return getCollection(opportunityCollections.guestLectures, [["status", "==", "Active"]]);
}

export async function getMentorshipPrograms() {
  return getCollection(opportunityCollections.mentorship, [["status", "==", "Active"]]);
}

// ==========================================
// FACULTY APPLICATIONS
// ==========================================
export async function getFacultyApplications(uid) {
  const ownerId = requireCurrentUid(uid);
  return getCollection("institution_applications", [["facultyId", "==", ownerId]]);
}

export async function applyForFacultyOpportunity(uid, opportunityId, type, data = {}) {
  const ownerId = requireCurrentUid(uid);

  // Applications are linked to a canonical opportunity.
  const ref = await addDoc(collection(db, "institution_applications"), {
    facultyId: ownerId,
    opportunityId,
    type,
    ...data,
    status: "Applied",
    appliedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return { success: true, id: ref.id };
}

export async function withdrawApplication(uid, appId) {
  const ownerId = requireCurrentUid(uid);
  await updateDoc(doc(db, "institution_applications", appId), {
    status: "Withdrawn",
    updatedAt: serverTimestamp()
  });
  return { success: true, facultyId: ownerId, id: appId };
}

// ==========================================
// EVENTS / LEARNING
// ==========================================
export async function getEvents() {
  return getCollection("events", [["status", "==", "Active"]]);
}

export async function registerForEvent(uid, eventId) {
  const ownerId = requireCurrentUid(uid);
  return addInstitutionalRecord(ownerId, "event_registrations", { eventId, facultyId: ownerId, status: "Registered" });
}

// ==========================================
// NOTIFICATIONS
// ==========================================
export async function getNotifications(uid) {
  const ownerId = requireCurrentUid(uid);
  return getCollection("notifications", [["userId", "==", ownerId]]);
}

export async function markNotificationRead(uid, notifId) {
  const ownerId = requireCurrentUid(uid);
  await updateDoc(doc(db, "notifications", notifId), { read: true, readAt: serverTimestamp() });
  return { success: true, userId: ownerId, id: notifId };
}

// ==========================================
// PORTFOLIO
// ==========================================
export async function getFacultyPortfolio(uid) {
  return getFacultyProfile(uid);
}

export async function updatePortfolioSection(uid, section, data) {
  const ownerId = requireCurrentUid(uid);
  await setDoc(doc(db, "institution_profiles", ownerId, "portfolio", section), {
    ...data,
    updatedAt: serverTimestamp()
  }, { merge: true });
  return { success: true };
}

// ==========================================
// INDUSTRY COLLABORATION BRIDGE
// ==========================================
export async function createIndustryOpportunity(uid, data) {
  const ownerId = requireCurrentUid(uid);
  return addInstitutionalRecord(ownerId, "institution_industry_opportunities", {
    ...data,
    institutionId: ownerId
  });
}
