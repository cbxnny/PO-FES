// Seeding default users for login/testing
const DEFAULT_USERS = [
  {
    name: 'Project Owner User',
    email: 'owner@qut.edu.au',
    password: 'Password123!',
    role: 'Project Owner'
  },
  {
    name: 'Student User',
    email: 'student@qut.edu.au',
    password: 'Password123!',
    role: 'Student'
  },
  {
    name: 'Industry Liaison User',
    email: 'liaison@qut.edu.au',
    password: 'Password123!',
    role: 'Industry Liaison'
  },
  {
    name: 'Unit Coordinator User',
    email: 'coordinator@qut.edu.au',
    password: 'Password123!',
    role: 'Unit Coordinator'
  }
];

// Initialize users in localStorage if they don't exist
export const initAuth = () => {
  if (!localStorage.getItem('po_fes_users')) {
    localStorage.setItem('po_fes_users', JSON.stringify(DEFAULT_USERS));
  }
};

// Get all users
const getUsers = () => {
  initAuth();
  return JSON.parse(localStorage.getItem('po_fes_users') || '[]');
};

// Validate email format
export const validateEmail = (email) => {
  // Checks that email has characters before @, characters between @ and ., and characters after .
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Check password strength and return score/requirements met
export const checkPasswordStrength = (password) => {
  let score = 0;
  const feedback = [];

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('At least 8 characters');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One uppercase letter');
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One number');
  }

  if (/[@$!%*?&]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One special character (@$!%*?&)');
  }

  let label = 'Weak';
  let color = '#ef4444'; // Red
  if (score === 2) {
    label = 'Fair';
    color = '#f59e0b'; // Amber
  } else if (score === 3) {
    label = 'Good';
    color = '#3b82f6'; // Blue
  } else if (score === 4) {
    label = 'Strong';
    color = '#10b981'; // Green
  }

  return {
    score,
    label,
    color,
    feedback,
    isValid: score === 4
  };
};

const API = 'http://localhost:3001/api';

export const registerUser = async (name, email, password, role) => {
  const res = await fetch(`${API}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
};

export const loginUser = async (email, password) => {
  const res = await fetch(`${API}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  sessionStorage.setItem('po_fes_current_user', JSON.stringify(data));
  return data;
};

export const getCurrentUser = () => {
  const u = sessionStorage.getItem('po_fes_current_user');
  return u ? JSON.parse(u) : null;
};

export const logoutUser = () => {
  sessionStorage.removeItem('po_fes_current_user');
};
