// In Vite local development (port 5173), always use relative URL so Vite proxy handles /api cleanly without cross-port ERR_CONNECTION_REFUSED
const CONFIGURED_BASE =
  typeof window !== 'undefined' && window.location.port === '5173'
    ? ''
    : (import.meta.env.VITE_API_URL || '');

// Brief cooldown when backend is unreachable so we never flood the browser console
let backendCooldownUntil = 0;

const request = async (endpoint, options = {}) => {
  const method = (options.method || 'GET').toUpperCase();
  if (method === 'GET' && Date.now() < backendCooldownUntil) {
    return { success: false, offline: true, data: [] };
  }

  const token = localStorage.getItem('lovekaro_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${CONFIGURED_BASE}/api${endpoint}`, {
      ...options,
      headers,
    });

    if ([502, 503, 504].includes(response.status)) {
      backendCooldownUntil = Date.now() + 4000;
      if (method === 'GET') {
        return { success: false, offline: true, data: [] };
      }
      throw new Error('Backend server is starting up. Please try again in a moment.');
    }

    const data = await response.json().catch(() => ({}));

    if (data && data.offline) {
      backendCooldownUntil = Date.now() + 3000;
      if (method === 'GET') {
        return data;
      }
      throw new Error(data.message || 'Backend server is starting up...');
    }

    if (!response.ok) {
      const errorMsg = data.message || data.error || 'Something went wrong';
      const err = new Error(errorMsg);
      err.status = response.status;
      err.data = data;
      err.requiresPayment = Boolean(data.requiresPayment);
      err.violationReason = data.violationReason || null;
      throw err;
    }

    backendCooldownUntil = 0;
    return data;
  } catch (err) {
    if (err.status) {
      throw err;
    }
    backendCooldownUntil = Date.now() + 4000;
    if (method === 'GET') {
      return { success: false, offline: true, data: [] };
    }
    throw new Error('Unable to connect to LoveKaro backend server. Please verify backend is running.');
  }
};

export const authApi = {
  // 1. Send OTP to Phone
  sendOtp: (phone) => {
    return request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  },

  // 2. Verify OTP
  verifyOtp: (phone, otp) => {
    return request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });
  },

  // 3. Step-by-Step Signup (Full profile registration)
  signup: (userData) => {
    return request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // 4. Login with Email or Phone & Password
  login: (identifier, password) => {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
  },

  // 5. Login via OTP
  loginWithOtp: (phone, otp) => {
    return request('/auth/login-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });
  },

  // 6. Get Current Profile
  getMe: () => {
    return request('/auth/me');
  },

  // 7. Upload Photo
  uploadPhoto: async (file) => {
    const token = localStorage.getItem('lovekaro_token');
    const formData = new FormData();
    formData.append('photo', file);

    for (const base of CANDIDATE_BASES) {
      try {
        const response = await fetch(`${base}/api/auth/upload-photo`, {
          method: 'POST',
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: formData,
        });
        if ([502, 503, 504].includes(response.status)) continue;
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Upload failed');
        return data;
      } catch (err) {
        if (base === CANDIDATE_BASES[CANDIDATE_BASES.length - 1]) throw err;
      }
    }
  },
};

export const userApi = {
  // 0. Get Public Profiles from Database (No Login Required)
  getPublicProfiles: (genderOrParams = 'all', city = 'all', viewerGender = '') => {
    if (typeof genderOrParams === 'object' && genderOrParams !== null) {
      const g = genderOrParams.gender || 'all';
      const c = genderOrParams.city || 'all';
      const vg = genderOrParams.viewerGender || '';
      return request(
        `/users/public?gender=${encodeURIComponent(g)}&city=${encodeURIComponent(c)}&viewerGender=${encodeURIComponent(vg)}`
      );
    }
    return request(
      `/users/public?gender=${encodeURIComponent(genderOrParams)}&city=${encodeURIComponent(city)}&viewerGender=${encodeURIComponent(viewerGender)}`
    );
  },

  // 1. Get Dashboard Data (User, Stats, Discover Profiles, Messages)
  getDashboard: () => {
    return request('/users/dashboard');
  },

  // 2. Get Discoverable Profiles
  getProfiles: (gender = 'all') => {
    return request(`/users?gender=${encodeURIComponent(gender)}`);
  },

  // 3. Update User Profile
  updateProfile: (profileData) => {
    return request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // 4. Update User Privacy/Notification Settings & Partner Preferences
  updateSettings: (settingsData) => {
    return request('/users/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsData),
    });
  },

  // 5. Change Password
  updatePassword: (passwordData) => {
    return request('/users/password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  },

  // 6. Get Chat Messages
  getMessages: () => {
    return request('/users/messages');
  },

  // 7. Send Chat Message
  sendMessage: (messagePayload) => {
    return request('/users/messages', {
      method: 'POST',
      body: JSON.stringify(messagePayload),
    });
  },

  // 8. Like / Unlike Profile
  likeProfile: (targetUserId) => {
    return request(`/users/${targetUserId}/like`, {
      method: 'POST',
    });
  },

  // 9. Process Payment & Unlock Unlimited Chat + Profile View
  createPayment: (paymentPayload) => {
    return request('/users/payments', {
      method: 'POST',
      body: JSON.stringify(paymentPayload),
    });
  },

  // 10. Get User Payments History
  getPayments: () => {
    return request('/users/payments');
  },

  // 11. Get Real-Time Notifications from Database
  getNotifications: () => {
    return request('/users/notifications');
  },

  // 12. Mark All Notifications as Read in Database
  markNotificationsRead: () => {
    return request('/users/notifications/read', {
      method: 'PUT',
    });
  },

  // 13. Request Social Media Access to view partner's social links
  requestSocialAccess: (partnerId) => {
    return request(`/users/${partnerId}/social-access/request`, {
      method: 'POST',
    });
  },

  // 14. Grant or Decline Social Media Access
  respondSocialAccess: (requesterId, action = 'allow') => {
    return request(`/users/social-access/${requesterId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  },
};

export const adminApi = {
  // 1. Admin Login
  login: (email, password) => {
    return request('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // 2. Get Full Admin Overview (Stats, All Users, Messages, OTP Logs)
  getOverview: () => {
    return request('/admin/overview');
  },

  // 3. Get Single User Complete 360 Detail
  getUserDetail: (userId) => {
    return request(`/admin/users/${userId}`);
  },

  // 4. Create New User from Admin Panel
  createUser: (userData) => {
    return request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // 5. Update Any User Full Details
  updateUser: (userId, userData) => {
    return request(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  // 6. Toggle User Active / Blocked Status
  toggleUserStatus: (userId, isActive) => {
    return request(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  },

  // 7. Toggle User Phone Verification
  toggleUserVerify: (userId, isPhoneVerified) => {
    return request(`/admin/users/${userId}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ isPhoneVerified }),
    });
  },

  // 8. Toggle User Premium Status
  toggleUserPremium: (userId, isPremium) => {
    return request(`/admin/users/${userId}/premium`, {
      method: 'PATCH',
      body: JSON.stringify({ isPremium }),
    });
  },

  // 8. Delete User Account
  deleteUser: (userId) => {
    return request(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  },

  // 9. Delete Chat Message
  deleteMessage: (messageId) => {
    return request(`/admin/messages/${messageId}`, {
      method: 'DELETE',
    });
  },

  // 10. Get & Update Admin Profile in Database
  getProfile: () => {
    return request('/admin/profile');
  },
  updateProfile: (profileData) => {
    return request('/admin/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // 11. Get & Update Platform Settings in Database
  getSettings: () => {
    return request('/admin/settings');
  },
  updateSettings: (settingsData) => {
    return request('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsData),
    });
  },

  // 12. System Health & Admin Help Tickets (Database Backed)
  getHelpHealth: () => {
    return request('/admin/help-health');
  },
  createHelpTicket: (ticketData) => {
    return request('/admin/help-tickets', {
      method: 'POST',
      body: JSON.stringify(ticketData),
    });
  },
  updateHelpTicketStatus: (ticketId, status) => {
    return request(`/admin/help-tickets/${ticketId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
  deleteHelpTicket: (ticketId) => {
    return request(`/admin/help-tickets/${ticketId}`, {
      method: 'DELETE',
    });
  },
};
