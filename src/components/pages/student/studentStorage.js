import { studentProfile, academicRecord } from './studentSeedData';

const PROFILE_KEY = 'student-profile-data';
const RECORD_KEY = 'student-academic-record';
const ENROLLED_KEY = 'student-enrolled-sections';

export function loadStudentProfile() {
  if (typeof window === 'undefined') return studentProfile;
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return studentProfile;
    return JSON.parse(raw);
  } catch {
    return studentProfile;
  }
}

export function saveStudentProfile(profile) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error('Error saving student profile:', err);
  }
}

export function loadAcademicRecord() {
  if (typeof window === 'undefined') return academicRecord;
  try {
    const raw = window.localStorage.getItem(RECORD_KEY);
    if (!raw) return academicRecord;
    return JSON.parse(raw);
  } catch {
    return academicRecord;
  }
}

export function saveAcademicRecord(record) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(RECORD_KEY, JSON.stringify(record));
  } catch (err) {
    console.error('Error saving academic record:', err);
  }
}

export function loadEnrolledSections() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(ENROLLED_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveEnrolledSections(sections) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ENROLLED_KEY, JSON.stringify(sections));
  } catch (err) {
    console.error('Error saving enrolled sections:', err);
  }
}

export function resetEnrollment() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(ENROLLED_KEY);
  } catch (err) {
    console.error('Error resetting enrollment:', err);
  }
}
