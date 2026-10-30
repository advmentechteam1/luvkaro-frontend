import { useState, useEffect, useMemo } from 'react';
import Logo from '../components/Logo';
import { adminApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { isRealRegisteredUser } from '../data/profiles';
import './AdminPage.css';

// 3D Glossy Icons from frontend/public
const PUBLIC_ICONS = {
  heart: '/heart-love.png',
  users: '/love-mom.png',
  selfLove: '/self-love.png',
  lock: '/love-lock.png',
  calendar: '/love-calendar.png',
  favicon: '/favicon.svg',
};

const EMPTY_NEW_USER = {
  name: '',
  email: '',
  phone: '',
  password: 'password123',
  age: 24,
  gender: 'female',
  interestedIn: 'male',
  maritalStatus: 'Never Married',
  religion: 'Hindu',
  motherTongue: 'Hindi',
  city: 'Delhi',
  state: 'Delhi',
  occupation: 'Software Engineer',
  education: "Bachelor's Degree",
  bio: '',
  interests: 'Traveling, Music, Coffee',
  role: 'user',
  isPremium: false,
};

function isRealAvatar(url) {
  if (!url || typeof url !== 'string') return false;
  if (url.includes('images.unsplash.com')) return false;
  return true;
}

function getInitials(name = 'User') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function UserAvatar({ name, avatar, sizeClass = '' }) {
  if (isRealAvatar(avatar)) {
    return <img src={avatar} alt={name || 'User'} className={`lk-real-avatar ${sizeClass}`} />;
  }
  return (
    <div className={`lk-avatar-initials ${sizeClass}`} aria-label={name || 'User'}>
      {getInitials(name)}
    </div>
  );
}

// Helper to build smooth SVG path from 7 points
function buildSmoothSvgPath(points) {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M${points[0].x},${points[0].y}`;
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const ctrlX1 = Math.round(curr.x + (next.x - curr.x) / 2);
    const ctrlY1 = curr.y;
    const ctrlX2 = Math.round(curr.x + (next.x - curr.x) / 2);
    const ctrlY2 = next.y;
    d += ` C${ctrlX1},${ctrlY1} ${ctrlX2},${ctrlY2} ${next.x},${next.y}`;
  }
  return d;
}

export default function AdminPage({ isLoginUrl = false }) {
  const { user: loggedInUser } = useAuth();
  const { socket, connected } = useSocket();
  // Admin Authentication State (Only accessible via URL: #admin-login / #admin)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    if (isLoginUrl) return false;
    return Boolean(localStorage.getItem('lovekaro_admin_auth'));
  });
  const [loginEmail, setLoginEmail] = useState('admin@lovekaro.com');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    if (isLoginUrl) {
      setIsAdminAuthenticated(false);
    }
  }, [isLoginUrl]);

  // Active Sidebar Section:
  // 'dashboard' | 'users' | 'payments' | 'matches' | 'messages' | 'reports' | 'events' | 'profile' | 'settings' | 'help'
  const [activeNav, setActiveNav] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Backend Overview Data (100% Real MongoDB Data)
  const [adminProfile, setAdminProfile] = useState({
    name: 'Admin',
    email: 'admin@lovekaro.com',
    phone: '9811223344',
    designation: 'Founder & Super Admin',
    department: 'Platform Operations & Trust Safety',
    city: 'New Delhi, India',
    bio: 'Managing LoveKaro platform operations, user safety, real-time chat moderation, and VIP memberships.',
    avatar: '',
    role: 'Super Admin',
    permissions: [
      'Full Database Read/Write',
      'VIP Payment & Revenue Ledger',
      '360° User Profile Moderation',
      'Real-Time Chat & Anti-Spam Filter',
      'Mobile App REST API v1 Control',
    ],
  });
  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    phone: '',
    designation: '',
    department: '',
    city: '',
    bio: '',
    avatar: '',
    newPassword: '',
  });
  const [savingAdminProfile, setSavingAdminProfile] = useState(false);

  // Platform Settings State (100% MongoDB Backed)
  const [platformSettings, setPlatformSettings] = useState({
    siteName: 'LoveKaro',
    tagline: 'Meaningful Indian Dating & Matrimony',
    supportEmail: 'support@lovekaro.com',
    supportPhone: '+91 9811223344',
    whatsappSupport: '+91 9811223344',
    freePromptsLimit: 5,
    blockContactSharingInFreeChat: true,
    requirePhoneOtpVerification: true,
    autoApproveNewUsers: true,
    maintenanceMode: false,
    starterPlanPrice: 199,
    goldPlanPrice: 499,
    diamondPlanPrice: 999,
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // System Health & Help Tickets State (100% MongoDB Backed)
  const [systemHealth, setSystemHealth] = useState({
    status: 'Healthy',
    databaseStatus: 'Connected',
    databaseName: 'lovekaro',
    databaseHost: 'localhost',
    socketServer: 'Active (Socket.IO Real-Time)',
    apiVersion: 'v1 (Mobile & Web Ready)',
    uptimeSeconds: 0,
    nodeVersion: '',
    memoryRssMb: 0,
    memoryHeapUsedMb: 0,
    collections: {
      users: 0,
      payments: 0,
      messages: 0,
      otps: 0,
      notifications: 0,
    },
  });
  const [helpTickets, setHelpTickets] = useState([]);
  const [ticketForm, setTicketForm] = useState({
    title: '',
    category: 'General Help',
    priority: 'Medium',
    contactInfo: '',
    description: '',
  });
  const [savingTicket, setSavingTicket] = useState(false);

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    verifiedUsers: 0,
    premiumUsers: 0,
    maleUsers: 0,
    femaleUsers: 0,
    otherUsers: 0,
    newUsersToday: 0,
    newUsersThisWeek: 0,
    totalPayments: 0,
    totalRevenue: 0,
    totalMessages: 0,
    blockedAttemptsCount: 0,
    totalOtps: 0,
    cityBreakdown: {},
    religionBreakdown: {},
    chartSeries: [],
  });
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [blockedMessages, setBlockedMessages] = useState([]);
  const [otps, setOtps] = useState([]);

  // Filters & Global Search
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  // 360° User Detail & Edit Modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalMode, setModalMode] = useState('view'); // 'view' | 'edit' | 'activity'
  const [userActivity, setUserActivity] = useState({
    messages: [],
    payments: [],
    otpHistory: [],
  });
  const [editForm, setEditForm] = useState({});
  const [savingUser, setSavingUser] = useState(false);

  // Create New User Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_NEW_USER);

  const showNotice = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev.message === message ? { message: '', type: 'success' } : prev));
    }, 4200);
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getOverview();
      if (!res || res.offline) {
        return;
      }
      if (res.data) {
        setStats(res.data.stats || {});
        if (res.data.adminProfile) {
          setAdminProfile(res.data.adminProfile);
          setAdminForm({
            name: res.data.adminProfile.name || '',
            email: res.data.adminProfile.email || '',
            phone: res.data.adminProfile.phone || '',
            designation: res.data.adminProfile.designation || 'Founder & Super Admin',
            department:
              res.data.adminProfile.department || 'Platform Operations & Trust Safety',
            city: res.data.adminProfile.city || 'New Delhi, India',
            bio: res.data.adminProfile.bio || '',
            avatar: isRealAvatar(res.data.adminProfile.avatar)
              ? res.data.adminProfile.avatar
              : '',
            newPassword: '',
          });
        }
        if (res.data.platformSettings) {
          setPlatformSettings(res.data.platformSettings);
        }
        if (res.data.systemHealth) {
          setSystemHealth(res.data.systemHealth);
        }
        if (res.data.helpTickets) {
          setHelpTickets(res.data.helpTickets);
        }
        const realOnlyUsers = (res.data.users || []).filter(isRealRegisteredUser);
        setUsers(realOnlyUsers);
        setStats((prev) => ({
          ...(res.data.stats || prev),
          totalUsers: realOnlyUsers.length,
          activeUsers: realOnlyUsers.filter((u) => u.isActive !== false).length,
          blockedUsers: realOnlyUsers.filter((u) => u.isActive === false).length,
          verifiedUsers: realOnlyUsers.filter((u) => u.isPhoneVerified).length,
          premiumUsers: realOnlyUsers.filter((u) => u.isPremium).length,
          maleUsers: realOnlyUsers.filter((u) => u.gender === 'male').length,
          femaleUsers: realOnlyUsers.filter((u) => u.gender === 'female').length,
        }));
        setPayments(res.data.payments || []);
        setMessages(res.data.messages || []);
        setBlockedMessages(res.data.blockedMessages || []);
        setOtps(res.data.otps || []);
      }
    } catch (err) {
      showNotice(err.message || 'Failed to load admin overview', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await adminApi.login(loginEmail, loginPassword);
      if (res && (res.success || res.data)) {
        localStorage.setItem(
          'lovekaro_admin_auth',
          JSON.stringify(res.data || { email: loginEmail, role: 'admin' })
        );
        setIsAdminAuthenticated(true);
        if (window.location.hash !== '#admin') {
          window.history.replaceState(null, '', '/#admin');
        }
        fetchAdminData();
        showNotice('Welcome back, Super Admin! 🛡️✨');
      } else {
        setLoginError('Invalid Admin credentials. Default: admin@lovekaro.com / admin123');
      }
    } catch (err) {
      setLoginError(err.message || 'Invalid Admin credentials. Default: admin@lovekaro.com / admin123');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('lovekaro_admin_auth');
    setIsAdminAuthenticated(false);
    window.location.hash = 'admin-login';
  };

  useEffect(() => {
    document.body.classList.add('admin-mode-body');
    if (isAdminAuthenticated) {
      fetchAdminData();
    }
    return () => {
      document.body.classList.remove('admin-mode-body');
    };
  }, [isAdminAuthenticated]);

  // Join Socket.IO Admin room and auto-refresh on live backend events
  useEffect(() => {
    if (!socket) return;
    socket.emit('join_admin');

    const handleLiveUpdate = (payload) => {
      fetchAdminData();
      if (payload?.type === 'new_payment' && payload?.payment) {
        showNotice(
          `💳 Live Payment Received: ₹${payload.payment.amount} from ${payload.payment.userName}!`
        );
      } else if (payload?.type === 'blocked_attempt' && payload?.message) {
        showNotice(
          `🚨 Live Blocked Attempt: ${payload.message.userName} tried sharing contact info!`,
          'error'
        );
      } else if (payload?.type === 'new_user' && payload?.user) {
        showNotice(`👤 New User Joined: ${payload.user.name} (${payload.user.phone})`);
      }
    };

    socket.on('admin_live_update', handleLiveUpdate);
    return () => {
      socket.off('admin_live_update', handleLiveUpdate);
    };
  }, [socket]);

  // Dynamic 7-Day Chart Geometry computed 100% from real MongoDB `stats.chartSeries`
  const chartData = useMemo(() => {
    const series =
      Array.isArray(stats.chartSeries) && stats.chartSeries.length > 0
        ? stats.chartSeries
        : Array.from({ length: 7 }, (_, idx) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - idx));
            return {
              label: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
              users: idx === 6 ? users.length : 0,
              payments: idx === 6 ? payments.length : 0,
              messages: idx === 6 ? messages.length : 0,
            };
          });

    const maxVal = Math.max(
      4,
      ...series.map((s) => Math.max(s.users || 0, s.payments || 0, s.messages || 0))
    );

    const xCoords = [55, 175, 295, 415, 535, 655, 790];
    const yBottom = 158;
    const yTop = 32;
    const toY = (val) =>
      Math.round(yBottom - (Math.min(val, maxVal) / maxVal) * (yBottom - yTop));

    const userPoints = series.map((s, idx) => ({
      x: xCoords[idx] || 55 + idx * 120,
      y: toY(s.users || 0),
      label: s.label,
      value: s.users || 0,
    }));
    const paymentPoints = series.map((s, idx) => ({
      x: xCoords[idx] || 55 + idx * 120,
      y: toY(s.payments || 0),
      value: s.payments || 0,
    }));
    const messagePoints = series.map((s, idx) => ({
      x: xCoords[idx] || 55 + idx * 120,
      y: toY(s.messages || 0),
      value: s.messages || 0,
    }));

    const userLine = buildSmoothSvgPath(userPoints);
    const userArea = userLine
      ? `${userLine} L${userPoints[userPoints.length - 1].x},165 L${userPoints[0].x},165 Z`
      : '';
    const paymentLine = buildSmoothSvgPath(paymentPoints);
    const messageLine = buildSmoothSvgPath(messagePoints);

    const yTicks = [
      maxVal,
      Math.round(maxVal * 0.75),
      Math.round(maxVal * 0.5),
      Math.round(maxVal * 0.25),
    ];

    return {
      userPoints,
      userLine,
      userArea,
      paymentLine,
      messageLine,
      yTicks,
    };
  }, [stats.chartSeries, users.length, payments.length, messages.length]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.phone || '').toLowerCase().includes(q) ||
        (u.location?.city || '').toLowerCase().includes(q) ||
        (u.occupation || '').toLowerCase().includes(q) ||
        (u.religion || '').toLowerCase().includes(q);

      const matchesGender = genderFilter === 'all' || u.gender === genderFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && u.isActive !== false) ||
        (statusFilter === 'blocked' && u.isActive === false);
      const matchesPlan =
        planFilter === 'all' ||
        (planFilter === 'premium' && u.isPremium) ||
        (planFilter === 'free' && !u.isPremium);

      return matchesSearch && matchesGender && matchesStatus && matchesPlan;
    });
  }, [users, searchQuery, genderFilter, statusFilter, planFilter]);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return payments;
    return payments.filter(
      (p) =>
        (p.userName || '').toLowerCase().includes(q) ||
        (p.userPhone || '').toLowerCase().includes(q) ||
        (p.userEmail || '').toLowerCase().includes(q) ||
        (p.transactionId || '').toLowerCase().includes(q) ||
        (p.planName || '').toLowerCase().includes(q)
    );
  }, [payments, searchQuery]);

  // Admin Profile Photo Upload (Saves directly to MongoDB)
  const handleAdminAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showNotice('Please select a valid image file', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64Url = ev.target.result;
      setAdminForm((prev) => ({ ...prev, avatar: base64Url }));
      try {
        const res = await adminApi.updateProfile({ ...adminForm, avatar: base64Url });
        if (res.data) {
          setAdminProfile((prev) => ({ ...prev, ...res.data }));
          showNotice('Admin profile photo saved to database! 📸');
        }
      } catch (err) {
        showNotice(err.message || 'Could not upload admin photo', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  // Save Admin Own Profile to MongoDB
  const handleSaveAdminProfile = async (e) => {
    e.preventDefault();
    setSavingAdminProfile(true);
    try {
      const res = await adminApi.updateProfile(adminForm);
      if (res.data) {
        setAdminProfile((prev) => ({ ...prev, ...res.data }));
        setAdminForm((prev) => ({ ...prev, newPassword: '' }));
        showNotice('Admin Profile saved to MongoDB database successfully! ✨');
      }
    } catch (err) {
      showNotice(err.message || 'Failed to update admin profile', 'error');
    } finally {
      setSavingAdminProfile(false);
    }
  };

  // Save Platform Settings to MongoDB
  const handleSavePlatformSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await adminApi.updateSettings(platformSettings);
      if (res.data) {
        setPlatformSettings(res.data);
        showNotice('Platform settings saved to MongoDB database! ⚙️');
      }
    } catch (err) {
      showNotice(err.message || 'Failed to save platform settings', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  // Create Help Ticket / Note in MongoDB
  const handleCreateHelpTicket = async (e) => {
    e.preventDefault();
    if (!ticketForm.title.trim()) {
      showNotice('Please enter a ticket or note title', 'error');
      return;
    }
    setSavingTicket(true);
    try {
      const res = await adminApi.createHelpTicket(ticketForm);
      if (res.data) {
        setHelpTickets(res.data);
        setTicketForm({
          title: '',
          category: 'General Help',
          priority: 'Medium',
          contactInfo: '',
          description: '',
        });
        showNotice('Support ticket / note saved to database! 🩺');
      }
    } catch (err) {
      showNotice(err.message || 'Could not create ticket', 'error');
    } finally {
      setSavingTicket(false);
    }
  };

  // Toggle Help Ticket Status (open / resolved) in MongoDB
  const handleToggleTicketStatus = async (ticket) => {
    const nextStatus = ticket.status === 'resolved' ? 'open' : 'resolved';
    try {
      const res = await adminApi.updateHelpTicketStatus(ticket._id, nextStatus);
      if (res.data) {
        setHelpTickets(res.data);
        showNotice(
          nextStatus === 'resolved' ? 'Ticket marked as Resolved ✅' : 'Ticket reopened 🔄'
        );
      }
    } catch (err) {
      showNotice(err.message || 'Failed to update ticket status', 'error');
    }
  };

  // Delete Help Ticket from MongoDB
  const handleDeleteTicket = async (ticketId) => {
    try {
      const res = await adminApi.deleteHelpTicket(ticketId);
      if (res.data) {
        setHelpTickets(res.data);
        showNotice('Ticket deleted from database.');
      }
    } catch (err) {
      showNotice(err.message || 'Failed to delete ticket', 'error');
    }
  };

  // Export Database Snapshot (JSON or CSV)
  const handleExportData = (type = 'users_csv') => {
    if (type === 'users_csv') {
      const headers = ['Name', 'Email', 'Phone', 'Age', 'Gender', 'City', 'Plan', 'Status'];
      const rows = users.map((u) => [
        `"${(u.name || '').replace(/"/g, '""')}"`,
        `"${u.email || ''}"`,
        `"+91 ${u.phone || ''}"`,
        u.age || '',
        u.gender || '',
        `"${u.location?.city || 'Delhi'}"`,
        u.isPremium ? 'VIP Paid' : 'Free',
        u.isActive !== false ? 'Active' : 'Blocked',
      ]);
      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lovekaro-users-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showNotice('Users CSV exported from database! 📥');
      return;
    }

    const snapshot = {
      exportedAt: new Date().toISOString(),
      adminProfile,
      platformSettings,
      systemHealth,
      stats,
      usersCount: users.length,
      paymentsCount: payments.length,
      users,
      payments,
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lovekaro-db-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotice('Complete Database JSON backup downloaded! 💾');
  };

  // Open 360° User Inspector Modal
  const handleInspectUser = async (userObj, initialMode = 'view') => {
    setSelectedUser(userObj);
    setModalMode(initialMode);
    setEditForm({
      name: userObj.name || '',
      email: userObj.email || '',
      phone: userObj.phone || '',
      age: userObj.age || 24,
      dob: userObj.dob ? new Date(userObj.dob).toISOString().split('T')[0] : '2002-01-01',
      gender: userObj.gender || 'female',
      interestedIn: userObj.interestedIn || 'everyone',
      maritalStatus: userObj.maritalStatus || 'Never Married',
      religion: userObj.religion || 'Hindu',
      motherTongue: userObj.motherTongue || 'Hindi',
      city: userObj.location?.city || 'Delhi',
      state: userObj.location?.state || '',
      occupation: userObj.occupation || '',
      education: userObj.education || '',
      height: userObj.height || '',
      diet: userObj.diet || 'Veg',
      bio: userObj.bio || '',
      avatar: isRealAvatar(userObj.avatar) ? userObj.avatar : '',
      interests: Array.isArray(userObj.interests) ? userObj.interests.join(', ') : '',
      role: userObj.role || 'user',
      isActive: userObj.isActive !== false,
      isPhoneVerified: Boolean(userObj.isPhoneVerified),
      isPremium: Boolean(userObj.isPremium),
      premiumPlan: userObj.premiumPlan || 'Free',
      newPassword: '',
    });

    try {
      const res = await adminApi.getUserDetail(userObj._id);
      if (res.data) {
        setUserActivity({
          messages: res.data.messages || [],
          payments: res.data.payments || [],
          otpHistory: res.data.otpHistory || [],
        });
      }
    } catch (err) {
      console.warn('Could not load user activity:', err.message);
    }
  };

  // Save Edited User from Admin Modal
  const handleSaveUserEdit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSavingUser(true);
    try {
      const res = await adminApi.updateUser(selectedUser._id, {
        ...editForm,
        age: Number(editForm.age) || 18,
      });
      if (res.data) {
        setUsers((prev) => prev.map((u) => (u._id === selectedUser._id ? res.data : u)));
        setSelectedUser(res.data);
        showNotice(`Updated ${res.data.name}'s profile in database! ✨`);
        setModalMode('view');
      }
    } catch (err) {
      showNotice(err.message || 'Failed to update user', 'error');
    } finally {
      setSavingUser(false);
    }
  };

  // Toggle Active / Blocked Status
  const handleToggleStatus = async (userObj) => {
    try {
      const newStatus = userObj.isActive === false ? true : false;
      const res = await adminApi.toggleUserStatus(userObj._id, newStatus);
      if (res.data) {
        setUsers((prev) => prev.map((u) => (u._id === userObj._id ? res.data : u)));
        if (selectedUser && selectedUser._id === userObj._id) {
          setSelectedUser(res.data);
        }
        showNotice(res.message || 'User status updated');
      }
    } catch (err) {
      showNotice(err.message || 'Could not change user status', 'error');
    }
  };

  // Toggle Premium VIP Status
  const handleTogglePremium = async (userObj) => {
    try {
      const res = await adminApi.toggleUserPremium(userObj._id, !userObj.isPremium);
      if (res.data) {
        setUsers((prev) => prev.map((u) => (u._id === userObj._id ? res.data : u)));
        if (selectedUser && selectedUser._id === userObj._id) {
          setSelectedUser(res.data);
        }
        showNotice(res.message || 'Premium status updated');
      }
    } catch (err) {
      showNotice(err.message || 'Could not toggle premium status', 'error');
    }
  };

  // Delete User Permanently
  const handleDeleteUser = async (userObj) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete user "${userObj.name}" (${userObj.email})?`
    );
    if (!confirmed) return;

    try {
      await adminApi.deleteUser(userObj._id);
      setUsers((prev) => prev.filter((u) => u._id !== userObj._id));
      if (selectedUser && selectedUser._id === userObj._id) {
        setSelectedUser(null);
      }
      showNotice(`User ${userObj.name} deleted permanently.`);
    } catch (err) {
      showNotice(err.message || 'Failed to delete user', 'error');
    }
  };

  // Create New User by Admin
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSavingUser(true);
    try {
      const res = await adminApi.createUser(createForm);
      if (res.data) {
        setUsers((prev) => [res.data, ...prev]);
        setShowCreateModal(false);
        setCreateForm(EMPTY_NEW_USER);
        showNotice(`New user "${res.data.name}" created in database! 🎉`);
      }
    } catch (err) {
      showNotice(err.message || 'Failed to create user', 'error');
    } finally {
      setSavingUser(false);
    }
  };

  // Delete Chat Message
  const handleDeleteMessage = async (msgId) => {
    try {
      await adminApi.deleteMessage(msgId);
      setMessages((prev) => prev.filter((m) => m._id !== msgId));
      setBlockedMessages((prev) => prev.filter((m) => m._id !== msgId));
      showNotice('Message record deleted from database.');
    } catch (err) {
      showNotice(err.message || 'Failed to delete message', 'error');
    }
  };

  // Creative Sidebar Navigation using 3D Icons from frontend/public
  // Includes Admin Profile, Settings, and Help & Health sections!
  const SIDEBAR_ITEMS = [
    { id: 'dashboard', img: PUBLIC_ICONS.heart, label: 'Dashboard', badge: null },
    { id: 'users', img: PUBLIC_ICONS.users, label: 'Users Directory', badge: users.length },
    {
      id: 'payments',
      img: PUBLIC_ICONS.selfLove,
      label: 'Payments & VIP',
      badge: payments.length || null,
    },
    {
      id: 'matches',
      img: PUBLIC_ICONS.heart,
      label: 'Matches & Analytics',
      badge: null,
    },
    {
      id: 'messages',
      img: PUBLIC_ICONS.selfLove,
      label: 'Live Messages',
      badge: messages.length || null,
    },
    {
      id: 'reports',
      img: PUBLIC_ICONS.lock,
      label: 'Reports & Blocked',
      badge: blockedMessages.length || null,
    },
    {
      id: 'events',
      img: PUBLIC_ICONS.calendar,
      label: 'OTP & Events',
      badge: otps.length || null,
    },
    {
      id: 'profile',
      img: PUBLIC_ICONS.users,
      label: 'Admin Profile',
      badge: null,
    },
    {
      id: 'settings',
      img: PUBLIC_ICONS.lock,
      label: 'Settings',
      badge: null,
    },
    {
      id: 'help',
      img: PUBLIC_ICONS.calendar,
      label: 'Help & Health',
      badge: helpTickets.filter((t) => t.status === 'open').length || null,
    },
  ];

  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const displayAdminName = adminProfile?.name || loggedInUser?.name || 'Admin';
  const displayAdminRole = adminProfile?.designation || 'Super Admin';
  const displayAdminAvatar = adminProfile?.avatar || loggedInUser?.avatar || '';
  const alertBadgeCount = payments.length + blockedMessages.length;

  // Render Dedicated Admin Login Screen when accessed via URL (#admin-login / #admin when not logged in)
  if (!isAdminAuthenticated) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100%',
          background:
            'radial-gradient(circle at 20% 20%, #ffe4ee 0%, #fff6f9 48%, #f8eefc 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 16px',
          fontFamily: "'Plus Jakarta Sans', 'DM Sans', sans-serif",
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '440px',
            background: '#ffffff',
            borderRadius: '28px',
            padding: '36px 32px',
            boxShadow: '0 24px 60px rgba(242, 46, 99, 0.14)',
            border: '1px solid #f6d5e1',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <a href="#home" style={{ textDecoration: 'none' }}>
              <Logo />
            </a>
            <span
              style={{
                background: '#fff0f5',
                color: '#e11d48',
                fontSize: '0.74rem',
                fontWeight: 800,
                padding: '5px 12px',
                borderRadius: '999px',
                border: '1px solid #fecdd3',
              }}
            >
              🛡️ SUPER ADMIN PORTAL
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
            <img
              src={PUBLIC_ICONS.lock}
              alt="Admin Security"
              style={{
                width: '54px',
                height: '54px',
                objectFit: 'contain',
                background: '#fff0f5',
                padding: '8px',
                borderRadius: '16px',
              }}
            />
            <div>
              <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: '#1e1620' }}>
                Admin Control Login
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#64748b' }}>
                Authorized access via direct URL only
              </p>
            </div>
          </div>

          {loginError && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '10px 14px',
                borderRadius: '12px',
                fontSize: '0.83rem',
                fontWeight: 600,
                marginBottom: '16px',
              }}
            >
              ⚠️ {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#334155',
                  marginBottom: '6px',
                }}
              >
                Admin Email or Phone
              </label>
              <input
                type="text"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@lovekaro.com"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: '1.5px solid #ead5de',
                  fontSize: '0.92rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#334155',
                  marginBottom: '6px',
                }}
              >
                Admin Password
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter admin password"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: '1.5px solid #ead5de',
                  fontSize: '0.92rem',
                  outline: 'none',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              style={{
                marginTop: '6px',
                width: '100%',
                padding: '13px 20px',
                borderRadius: '999px',
                border: 'none',
                background: 'linear-gradient(135deg, #ff2e63 0%, #ff6498 100%)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 10px 24px rgba(255, 46, 99, 0.28)',
              }}
            >
              {loginLoading ? 'Verifying Admin Credentials...' : 'Sign In to Admin Dashboard →'}
            </button>
          </form>

          <div
            style={{
              marginTop: '18px',
              paddingTop: '14px',
              borderTop: '1px solid #f3e3ea',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.8rem',
              color: '#64748b',
            }}
          >
            <span>Default: admin@lovekaro.com / admin123</span>
            <a
              href="#home"
              style={{ color: '#e11d48', fontWeight: 700, textDecoration: 'none' }}
            >
              ← Back to Website
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lk-admin-layout">
      {/* Toast Notification */}
      {toast.message && (
        <div className={`admin-toast ${toast.type}`}>
          <img src={PUBLIC_ICONS.heart} alt="" className="toast-3d-ico" />
          <p>{toast.message}</p>
        </div>
      )}

      {/* ================================================================ */}
      {/* FIXED TOP BAR (HAMBURGER + CREATIVE 3D PUBLIC ICONS + ADMIN PILL)*/}
      {/* ================================================================ */}
      <header className="lk-admin-topbar">
        <div className="lk-topbar-brand">
          <button
            type="button"
            className={`lk-sidebar-hamburger ${sidebarCollapsed ? 'is-collapsed' : ''}`}
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            title={
              sidebarCollapsed
                ? 'Expand Sidebar Menu (Show Labels)'
                : 'Collapse Sidebar Menu (Show Icons Only)'
            }
            aria-label="Toggle Sidebar"
          >
            <span className="hb-line" />
            <span className="hb-line" />
            <span className="hb-line" />
          </button>

          <a href="#home" className="lk-brand-link" title="Back to LoveKaro Home">
            <Logo />
          </a>
        </div>

        <div className="lk-topbar-search">
          <img src={PUBLIC_ICONS.heart} alt="" width="24" height="24" className="search-3d-ico" />
          <input
            type="text"
            placeholder="Search users, payments, phone numbers, messages, or anything..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (activeNav === 'dashboard' && e.target.value.trim().length > 0) {
                setActiveNav('users');
              }
            }}
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')}>
              ✕
            </button>
          )}
        </div>

        <div className="lk-topbar-right">
          <span
            className={`lk-live-socket-pill ${connected ? 'online' : ''}`}
            onClick={() => setActiveNav('help')}
            style={{ cursor: 'pointer' }}
            title="Click to view System & Database Health"
          >
            <i /> {connected ? 'Live DB Connected' : 'Connecting...'}
          </span>

          <a href="#home" className="lk-back-site-btn">
            ← Back to Site
          </a>

          <button
            type="button"
            className="lk-notif-bell"
            onClick={() => setActiveNav('payments')}
            title="Recent Payments & Security Alerts"
          >
            <img src={PUBLIC_ICONS.lock} alt="Alerts" width="28" height="28" className="bell-3d-img" />
            {alertBadgeCount > 0 && <span className="bell-badge">{alertBadgeCount}</span>}
          </button>

          <button
            type="button"
            className={`lk-admin-profile-pill ${activeNav === 'profile' ? 'active-pill' : ''}`}
            onClick={() => setActiveNav('profile')}
            title="Open Admin Profile Section"
          >
            <UserAvatar
              name={displayAdminName}
              avatar={displayAdminAvatar}
              sizeClass="topbar-avatar"
            />
            <div>
              <strong>{displayAdminName}</strong>
              <small>{displayAdminRole}</small>
            </div>
          </button>

          <button
            type="button"
            className="lk-back-site-btn"
            onClick={handleAdminLogout}
            style={{
              background: '#fff0f3',
              color: '#e11d48',
              border: '1px solid #fecdd3',
              cursor: 'pointer',
            }}
            title="Sign out of Admin Portal"
          >
            Logout
          </button>
        </div>
      </header>

      {/* ================================================================ */}
      {/* 2-COLUMN BODY: COLLAPSIBLE LEFT SIDEBAR + SCROLLABLE WORKSPACE   */}
      {/* ================================================================ */}
      <div className={`lk-admin-body ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* LEFT NAVIGATION SIDEBAR (NON-SCROLLING / LOCKED, COLLAPSES TO ICONS) */}
        <aside className={`lk-admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <nav className="lk-sidebar-menu">
            {SIDEBAR_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`lk-nav-btn ${activeNav === item.id ? 'active' : ''}`}
                onClick={() => setActiveNav(item.id)}
                title={item.label}
              >
                <span className="lk-nav-3d-box">
                  <img
                    src={item.img}
                    alt={item.label}
                    width="22"
                    height="22"
                    className="lk-nav-3d-img"
                  />
                </span>
                {!sidebarCollapsed && <span className="lk-nav-text">{item.label}</span>}
                {item.badge !== null && (
                  <span className={`lk-nav-badge ${sidebarCollapsed ? 'mini-dot-badge' : ''}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Creative 3D Promo Card (Only shown when Sidebar is Expanded) */}
          {!sidebarCollapsed && (
            <div className="lk-sidebar-promo-card">
              <div className="promo-heart-circle">
                <img
                  src={PUBLIC_ICONS.heart}
                  alt="LoveKaro"
                  width="34"
                  height="34"
                  className="promo-3d-heart"
                />
              </div>
              <h4>
                Better Connections
                <br />
                Bigger Stories
              </h4>
              <div className="promo-divider">
                <span>✦ Real Database Live ✦</span>
              </div>
              <button
                type="button"
                className="promo-pink-btn"
                onClick={() => setShowCreateModal(true)}
              >
                + Add New User
              </button>
            </div>
          )}
        </aside>

        {/* RIGHT MAIN WORKSPACE (ONLY THIS AREA SCROLLS!) */}
        <main className="lk-admin-main">
          {/* ============================================================== */}
          {/* VIEW 1: MAIN DASHBOARD OVERVIEW (CREATIVE 3D PUBLIC ICONS)     */}
          {/* ============================================================== */}
          {activeNav === 'dashboard' && (
            <>
              {/* Creative 3D Welcome Banner (Only in Dashboard Tab) */}
              <div className="lk-welcome-row creative-welcome-banner">
                <div className="welcome-left-cluster">
                  <div className="welcome-3d-mascot-wrap">
                    <img
                      src={PUBLIC_ICONS.users}
                      alt="Welcome Admin"
                      className="welcome-3d-mascot"
                    />
                    <img
                      src={PUBLIC_ICONS.heart}
                      alt=""
                      className="welcome-floating-mini-heart"
                    />
                  </div>
                  <div>
                    <span className="welcome-kicker-pill">
                      ✦ {platformSettings.siteName?.toUpperCase() || 'LOVEKARO'} SUPER ADMIN COMMAND
                      CENTER
                    </span>
                    <h1>
                      Welcome back, <span>{displayAdminName}!</span>
                    </h1>
                    <p>
                      100% live metrics, user profiles, VIP payments &amp; chat logs directly from
                      your MongoDB database.
                    </p>
                  </div>
                </div>

                <div className="lk-date-box creative-date-pill">
                  <img
                    src={PUBLIC_ICONS.calendar}
                    alt="Calendar"
                    className="date-pill-3d-icon"
                  />
                  <div>
                    <strong>{todayFormatted}</strong>
                    <button
                      type="button"
                      className="inline-refresh-link"
                      onClick={fetchAdminData}
                    >
                      🔄 {loading ? 'Syncing DB...' : 'Refresh Live Data'}
                    </button>
                  </div>
                </div>
              </div>

              {/* 4 CREATIVE 3D KPI CARDS USING FRONTEND/PUBLIC PNG ICONS */}
              <section className="lk-kpi-row">
                {/* Card 1: Total Registered Users -> /love-mom.png */}
                <div
                  className="lk-kpi-card kpi-theme-pink"
                  onClick={() => setActiveNav('users')}
                >
                  <img
                    src={PUBLIC_ICONS.users}
                    alt=""
                    className="kpi-bg-watermark"
                    aria-hidden="true"
                  />
                  <div className="lk-kpi-top-line">
                    <div className="lk-kpi-3d-pedestal pink-glow">
                      <img src={PUBLIC_ICONS.users} alt="Total Users" />
                    </div>
                    <span className="kpi-live-tag">LIVE DB</span>
                  </div>
                  <span className="lk-kpi-label">Total Registered Users</span>
                  <strong className="lk-kpi-value">{stats.totalUsers ?? users.length}</strong>
                  <div className="lk-kpi-trend">
                    <span className="trend-up">+{stats.newUsersToday || 0} today</span>
                    <small>+{stats.newUsersThisWeek || 0} joined this week</small>
                  </div>
                </div>

                {/* Card 2: Total Payments & VIP Revenue -> /self-love.png */}
                <div
                  className="lk-kpi-card kpi-theme-coral"
                  onClick={() => setActiveNav('payments')}
                >
                  <img
                    src={PUBLIC_ICONS.selfLove}
                    alt=""
                    className="kpi-bg-watermark"
                    aria-hidden="true"
                  />
                  <div className="lk-kpi-top-line">
                    <div className="lk-kpi-3d-pedestal coral-glow">
                      <img src={PUBLIC_ICONS.selfLove} alt="Payments & VIP" />
                    </div>
                    <span className="kpi-live-tag gold">VIP LEDGER</span>
                  </div>
                  <span className="lk-kpi-label">Total Payments &amp; Revenue</span>
                  <strong className="lk-kpi-value">
                    ₹{(stats.totalRevenue || 0).toLocaleString('en-IN')}
                  </strong>
                  <div className="lk-kpi-trend">
                    <span className="trend-up">
                      {payments.length} Paid ({stats.premiumUsers || 0} VIP)
                    </span>
                    <small>Click to inspect ledger</small>
                  </div>
                </div>

                {/* Card 3: Total Chat Messages & Matches -> /heart-love.png */}
                <div
                  className="lk-kpi-card kpi-theme-rose"
                  onClick={() => setActiveNav('messages')}
                >
                  <img
                    src={PUBLIC_ICONS.heart}
                    alt=""
                    className="kpi-bg-watermark"
                    aria-hidden="true"
                  />
                  <div className="lk-kpi-top-line">
                    <div className="lk-kpi-3d-pedestal rose-glow">
                      <img src={PUBLIC_ICONS.heart} alt="Messages" />
                    </div>
                    <span className="kpi-live-tag">SOCKET.IO</span>
                  </div>
                  <span className="lk-kpi-label">Total Chat Messages</span>
                  <strong className="lk-kpi-value">
                    {stats.totalMessages ?? messages.length}
                  </strong>
                  <div className="lk-kpi-trend">
                    <span className="trend-up">
                      {stats.activeUsers || users.length} Active Users
                    </span>
                    <small>{platformSettings.freePromptsLimit || 5}-Prompt Free Limit</small>
                  </div>
                </div>

                {/* Card 4: Blocked Contact Attempts & Security -> /love-lock.png */}
                <div
                  className="lk-kpi-card kpi-theme-ruby"
                  onClick={() => setActiveNav('reports')}
                >
                  <img
                    src={PUBLIC_ICONS.lock}
                    alt=""
                    className="kpi-bg-watermark"
                    aria-hidden="true"
                  />
                  <div className="lk-kpi-top-line">
                    <div className="lk-kpi-3d-pedestal ruby-glow">
                      <img src={PUBLIC_ICONS.lock} alt="Blocked Attempts" />
                    </div>
                    <span className="kpi-live-tag shield">GUARD ON</span>
                  </div>
                  <span className="lk-kpi-label">Blocked Contact Attempts</span>
                  <strong className="lk-kpi-value">
                    {stats.blockedAttemptsCount ?? blockedMessages.length}
                  </strong>
                  <div className="lk-kpi-trend">
                    <span className="trend-up">Phone/Insta Filter</span>
                    <small>Auto-protected chats</small>
                  </div>
                </div>
              </section>

              {/* Platform Overview Real 7-Day Database Chart Card */}
              <section className="lk-panel-card lk-chart-card">
                <div className="lk-card-head">
                  <div className="lk-card-title-with-icon">
                    <img src={PUBLIC_ICONS.calendar} alt="" className="section-3d-ico" />
                    <div>
                      <h3>Platform Overview (Live 7-Day Database Activity)</h3>
                      <p className="lk-subtext">
                        Real-time daily registrations, VIP payments, and chat volume from MongoDB
                      </p>
                    </div>
                  </div>
                  <div className="lk-chart-legend">
                    <span>
                      <i className="dot pink" /> Users ({users.length})
                    </span>
                    <span>
                      <i className="dot lightpink" /> Payments ({payments.length})
                    </span>
                    <span>
                      <i className="dot navy" /> Messages ({messages.length})
                    </span>
                  </div>
                  <span className="lk-period-select">Last 7 Days (Live DB)</span>
                </div>

                <div className="lk-svg-chart-wrap">
                  <svg viewBox="0 0 820 195" className="lk-overview-svg">
                    <defs>
                      <linearGradient id="pinkAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ff2e63" stopOpacity="0.26" />
                        <stop offset="100%" stopColor="#ff2e63" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {[32, 74, 116, 158].map((y, idx) => (
                      <g key={y}>
                        <line
                          x1="45"
                          y1={y}
                          x2="795"
                          y2={y}
                          stroke="#f2e6ea"
                          strokeDasharray="3 3"
                        />
                        <text x="10" y={y + 4} fill="#9c8990" fontSize="11">
                          {chartData.yTicks[idx]}
                        </text>
                      </g>
                    ))}

                    {chartData.userArea && (
                      <path d={chartData.userArea} fill="url(#pinkAreaGrad)" />
                    )}

                    {chartData.userLine && (
                      <path
                        d={chartData.userLine}
                        fill="none"
                        stroke="#ff2e63"
                        strokeWidth="3"
                      />
                    )}

                    {chartData.paymentLine && (
                      <path
                        d={chartData.paymentLine}
                        fill="none"
                        stroke="#ff9ebb"
                        strokeWidth="2.5"
                      />
                    )}

                    {chartData.messageLine && (
                      <path
                        d={chartData.messageLine}
                        fill="none"
                        stroke="#1e293b"
                        strokeWidth="2.5"
                      />
                    )}

                    {chartData.userPoints.map((pt) => (
                      <g key={pt.label}>
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="4.5"
                          fill="#ff2e63"
                          stroke="#fff"
                          strokeWidth="1.5"
                        />
                        <text x={pt.x - 16} y="185" fill="#7c6970" fontSize="11">
                          {pt.label}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
              </section>

              {/* Bottom 2-Column Section: Recent Registrations + Recent Payments & Reports */}
              <div className="lk-bottom-split">
                {/* Left: Recent User Registrations */}
                <section className="lk-panel-card">
                  <div className="lk-card-head">
                    <div className="lk-card-title-with-icon">
                      <img src={PUBLIC_ICONS.users} alt="" className="section-3d-ico" />
                      <h3>Recent User Registrations</h3>
                    </div>
                    <button
                      type="button"
                      className="lk-view-all-link"
                      onClick={() => setActiveNav('users')}
                    >
                      View all ({users.length}) →
                    </button>
                  </div>

                  {users.length === 0 ? (
                    <div className="lk-empty-mini">
                      <img src={PUBLIC_ICONS.users} alt="" className="empty-3d-icon" />
                      <p>No users registered in the database yet.</p>
                    </div>
                  ) : (
                    <div className="lk-mini-table-wrap">
                      <table className="lk-clean-table">
                        <thead>
                          <tr>
                            <th>User</th>
                            <th>Age</th>
                            <th>Location</th>
                            <th>Plan / Payment</th>
                            <th>Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.slice(0, 6).map((u) => (
                            <tr key={u._id} onClick={() => handleInspectUser(u, 'view')}>
                              <td>
                                <div className="lk-user-cell">
                                  <UserAvatar name={u.name} avatar={u.avatar} />
                                  <div>
                                    <strong>{u.name}</strong>
                                    <small>{u.email}</small>
                                  </div>
                                </div>
                              </td>
                              <td>{u.age}</td>
                              <td>{u.location?.city || 'Delhi'}, India</td>
                              <td>
                                {u.isPremium ? (
                                  <span className="pill-vip">💎 Paid VIP</span>
                                ) : (
                                  <span className="pill-free">
                                    Free ({u.freePromptsUsed || 0}/5)
                                  </span>
                                )}
                              </td>
                              <td>
                                <span
                                  className={`pill-status ${
                                    u.isActive !== false ? 'active' : 'blocked'
                                  }`}
                                >
                                  {u.isActive !== false ? 'Active' : 'Blocked'}
                                </span>
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="dots-action-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleInspectUser(u, 'view');
                                  }}
                                >
                                  👁️ Detail
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                {/* Right: Recent Payments Received & Blocked Contact Reports */}
                <section className="lk-panel-card">
                  <div className="lk-card-head">
                    <div className="lk-card-title-with-icon">
                      <img src={PUBLIC_ICONS.selfLove} alt="" className="section-3d-ico" />
                      <h3>Recent Payments &amp; Security Alerts</h3>
                    </div>
                    <button
                      type="button"
                      className="lk-view-all-link"
                      onClick={() => setActiveNav('payments')}
                    >
                      All Payments ({payments.length}) →
                    </button>
                  </div>

                  <div className="lk-reports-feed">
                    {payments.slice(0, 4).map((pay) => (
                      <div
                        key={pay._id}
                        className="lk-report-item payment-item"
                        onClick={() => setActiveNav('payments')}
                      >
                        <img
                          src={PUBLIC_ICONS.selfLove}
                          alt="Paid"
                          className="feed-3d-badge"
                        />
                        <div className="rep-info">
                          <strong>
                            {pay.userName} paid ₹{pay.amount} ({pay.paymentMethod})
                          </strong>
                          <small>
                            {pay.planName} • TXN: {pay.transactionId}
                          </small>
                        </div>
                        <div className="rep-right">
                          <span className="sev-badge paid">Paid ✅</span>
                        </div>
                      </div>
                    ))}

                    {blockedMessages.slice(0, 4).map((bm) => (
                      <div
                        key={bm._id}
                        className="lk-report-item"
                        onClick={() => setActiveNav('reports')}
                      >
                        <img
                          src={PUBLIC_ICONS.lock}
                          alt="Blocked"
                          className="feed-3d-badge"
                        />
                        <div className="rep-info">
                          <strong>{bm.blockReason || 'Restricted Contact Info'}</strong>
                          <small>
                            {bm.userId?.name || 'User'} tried sending: &ldquo;{bm.text}&rdquo;
                          </small>
                        </div>
                        <div className="rep-right">
                          <span className="sev-badge high">Blocked</span>
                        </div>
                      </div>
                    ))}

                    {payments.length === 0 && blockedMessages.length === 0 && (
                      <div className="lk-empty-mini">
                        <img src={PUBLIC_ICONS.lock} alt="" className="empty-3d-icon" />
                        <p>
                          No payments or security alerts in database yet. When a user completes a
                          payment or tries sharing a phone number/Insta ID, it appears here live!
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </>
          )}

          {/* ============================================================== */}
          {/* VIEW 2: PAYMENTS & VIP REVENUE LEDGER (`kis-kis ka payment`)   */}
          {/* ============================================================== */}
          {activeNav === 'payments' && (
            <section className="lk-panel-card">
              <div className="lk-card-head">
                <div className="lk-card-title-with-icon">
                  <img src={PUBLIC_ICONS.selfLove} alt="" className="section-3d-ico" />
                  <div>
                    <h3>Payments &amp; VIP Unlock Ledger ({filteredPayments.length})</h3>
                    <p className="lk-subtext">
                      Complete list of users who completed payment in MongoDB to unlock unlimited
                      chat and full profile viewing
                    </p>
                  </div>
                </div>
                <div className="lk-revenue-pill">
                  Total Revenue: <strong>₹{(stats.totalRevenue || 0).toLocaleString('en-IN')}</strong>
                </div>
              </div>

              {filteredPayments.length === 0 ? (
                <div className="lk-empty-state">
                  <img src={PUBLIC_ICONS.selfLove} alt="" className="empty-3d-icon" />
                  <p>
                    Abhi tak kisi user ka payment record database me nahi aaya hai. Jab koi user 5
                    prompts ke baad ya profile unlock ke liye payment karega, to uski poori detail
                    yahan live show hogi!
                  </p>
                </div>
              ) : (
                <div className="lk-mini-table-wrap">
                  <table className="lk-clean-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Paid User</th>
                        <th>Contact (Phone &amp; Email)</th>
                        <th>Plan Unlocked</th>
                        <th>Amount</th>
                        <th>Method &amp; Ref</th>
                        <th>Unlocked Partner</th>
                        <th>Transaction ID &amp; Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.map((p, idx) => (
                        <tr key={p._id}>
                          <td>{idx + 1}</td>
                          <td>
                            <div className="lk-user-cell">
                              <UserAvatar
                                name={p.userName}
                                avatar={p.userAvatar || p.userId?.avatar}
                              />
                              <div>
                                <strong>{p.userName}</strong>
                                <small>VIP Unlocked</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <strong>📱 +91 {p.userPhone}</strong>
                            <br />
                            <small>✉️ {p.userEmail}</small>
                          </td>
                          <td>
                            <strong>💎 {p.planName}</strong>
                          </td>
                          <td>
                            <strong style={{ color: '#047857', fontSize: '1.05rem' }}>
                              ₹{p.amount}
                            </strong>
                          </td>
                          <td>
                            <strong>{p.paymentMethod}</strong>
                            <br />
                            <small>{p.paymentReference}</small>
                          </td>
                          <td>
                            {p.unlockedPartnerName ? (
                              <span>💖 {p.unlockedPartnerName}</span>
                            ) : (
                              <span>All Profiles</span>
                            )}
                          </td>
                          <td>
                            <code>{p.transactionId}</code>
                            <br />
                            <small>
                              {p.createdAt
                                ? new Date(p.createdAt).toLocaleString('en-IN')
                                : 'Recently'}
                            </small>
                          </td>
                          <td>
                            <span className="pill-status active">Paid ✅</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* ============================================================== */}
          {/* VIEW 3: ALL USERS DIRECTORY & 360° MANAGEMENT                  */}
          {/* ============================================================== */}
          {activeNav === 'users' && (
            <section className="lk-panel-card">
              <div className="lk-card-head">
                <div className="lk-card-title-with-icon">
                  <img src={PUBLIC_ICONS.users} alt="" className="section-3d-ico" />
                  <div>
                    <h3>All Registered Users ({filteredUsers.length})</h3>
                    <p className="lk-subtext">
                      Real users fetched directly from MongoDB. Click any row or &ldquo;👁️ Full
                      Detail&rdquo; to inspect 100% profile bio-data, payments, and chat logs.
                    </p>
                  </div>
                </div>
                <div className="lk-filter-bar">
                  <select
                    value={genderFilter}
                    onChange={(e) => setGenderFilter(e.target.value)}
                  >
                    <option value="all">All Genders</option>
                    <option value="female">Women</option>
                    <option value="male">Men</option>
                  </select>
                  <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}>
                    <option value="all">All Plans (VIP + Free)</option>
                    <option value="premium">💎 Paid VIP Only</option>
                    <option value="free">🎁 Free Users Only</option>
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active Only</option>
                    <option value="blocked">Blocked Only</option>
                  </select>
                </div>
              </div>

              <div className="lk-mini-table-wrap">
                <table className="lk-clean-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>User</th>
                      <th>Phone &amp; Email</th>
                      <th>Age &amp; Gender</th>
                      <th>Community &amp; City</th>
                      <th>Plan &amp; Prompts</th>
                      <th>Status</th>
                      <th>Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u, i) => {
                      const isBlocked = u.isActive === false;
                      return (
                        <tr key={u._id}>
                          <td>{i + 1}</td>
                          <td onClick={() => handleInspectUser(u, 'view')}>
                            <div className="lk-user-cell" style={{ cursor: 'pointer' }}>
                              <UserAvatar name={u.name} avatar={u.avatar} />
                              <div>
                                <strong>{u.name}</strong>
                                <small>
                                  Joined:{' '}
                                  {u.createdAt
                                    ? new Date(u.createdAt).toLocaleDateString('en-IN')
                                    : 'Recently'}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <strong>📱 +91 {u.phone}</strong>
                            <br />
                            <small>{u.email}</small>
                          </td>
                          <td>
                            <strong>
                              {u.age} yrs •{' '}
                              <span style={{ textTransform: 'capitalize' }}>{u.gender}</span>
                            </strong>
                            <br />
                            <small>💍 {u.maritalStatus || 'Never Married'}</small>
                          </td>
                          <td>
                            <strong>📍 {u.location?.city || 'Delhi'}</strong>
                            <br />
                            <small>
                              {u.religion || 'Hindu'} • {u.motherTongue || 'Hindi'}
                            </small>
                          </td>
                          <td>
                            {u.isPremium ? (
                              <span
                                className="pill-vip"
                                onClick={() => handleTogglePremium(u)}
                                style={{ cursor: 'pointer' }}
                                title="Click to toggle VIP status"
                              >
                                💎 Paid VIP
                              </span>
                            ) : (
                              <span
                                className="pill-free"
                                onClick={() => handleTogglePremium(u)}
                                style={{ cursor: 'pointer' }}
                                title="Click to grant VIP status"
                              >
                                Free ({u.freePromptsUsed || 0}/5 used)
                              </span>
                            )}
                          </td>
                          <td>
                            <span className={`pill-status ${isBlocked ? 'blocked' : 'active'}`}>
                              {isBlocked ? 'Blocked' : 'Active'}
                            </span>
                          </td>
                          <td>
                            <div className="lk-action-group">
                              <button
                                type="button"
                                className="act-btn view"
                                onClick={() => handleInspectUser(u, 'view')}
                              >
                                👁️ Full Detail
                              </button>
                              <button
                                type="button"
                                className="act-btn edit"
                                onClick={() => handleInspectUser(u, 'edit')}
                              >
                                ✏️ Edit
                              </button>
                              <button
                                type="button"
                                className={`act-btn ${isBlocked ? 'unblock' : 'block'}`}
                                onClick={() => handleToggleStatus(u)}
                              >
                                {isBlocked ? 'Activate' : 'Block'}
                              </button>
                              <button
                                type="button"
                                className="act-btn delete"
                                onClick={() => handleDeleteUser(u)}
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ============================================================== */}
          {/* VIEW 4: REPORTS & BLOCKED CONTACT-SHARING ATTEMPTS             */}
          {/* ============================================================== */}
          {activeNav === 'reports' && (
            <section className="lk-panel-card">
              <div className="lk-card-head">
                <div className="lk-card-title-with-icon">
                  <img src={PUBLIC_ICONS.lock} alt="" className="section-3d-ico" />
                  <div>
                    <h3>Blocked Contact-Sharing Attempts ({blockedMessages.length})</h3>
                    <p className="lk-subtext">
                      Free users who tried sending phone numbers, Instagram IDs (@handle), or social
                      links before payment
                    </p>
                  </div>
                </div>
              </div>

              {blockedMessages.length === 0 ? (
                <div className="lk-empty-state">
                  <img src={PUBLIC_ICONS.lock} alt="" className="empty-3d-icon" />
                  <p>No blocked contact-sharing attempts recorded in database yet.</p>
                </div>
              ) : (
                <div className="lk-mini-table-wrap">
                  <table className="lk-clean-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Target Partner</th>
                        <th>Violation Reason</th>
                        <th>Blocked Message Text</th>
                        <th>Time</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blockedMessages.map((bm) => (
                        <tr key={bm._id}>
                          <td>
                            <strong>{bm.userId?.name || 'User'}</strong>
                            <br />
                            <small>+91 {bm.userId?.phone || ''}</small>
                          </td>
                          <td>{bm.partnerName || bm.partnerId}</td>
                          <td>
                            <span className="pill-status blocked">
                              🚫 {bm.blockReason || 'Contact Info Restricted'}
                            </span>
                          </td>
                          <td>
                            <code>{bm.text}</code>
                          </td>
                          <td>{bm.time}</td>
                          <td>
                            <button
                              type="button"
                              className="act-btn delete"
                              onClick={() => handleDeleteMessage(bm._id)}
                            >
                              🗑️ Clear
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* ============================================================== */}
          {/* VIEW 5: ALL CHAT MESSAGES MONITOR                              */}
          {/* ============================================================== */}
          {activeNav === 'messages' && (
            <section className="lk-panel-card">
              <div className="lk-card-head">
                <div className="lk-card-title-with-icon">
                  <img src={PUBLIC_ICONS.heart} alt="" className="section-3d-ico" />
                  <div>
                    <h3>All Platform Chat Messages ({messages.length})</h3>
                    <p className="lk-subtext">
                      Real-time log of all user chat messages stored in MongoDB
                    </p>
                  </div>
                </div>
              </div>
              {messages.length === 0 ? (
                <div className="lk-empty-state">
                  <img src={PUBLIC_ICONS.heart} alt="" className="empty-3d-icon" />
                  <p>No chat messages recorded in database yet.</p>
                </div>
              ) : (
                <div className="lk-mini-table-wrap">
                  <table className="lk-clean-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Partner</th>
                        <th>Type</th>
                        <th>Message</th>
                        <th>Time</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {messages.map((m) => (
                        <tr key={m._id}>
                          <td>
                            <strong>{m.userId?.name || 'User'}</strong>
                            <br />
                            <small>+91 {m.userId?.phone || ''}</small>
                          </td>
                          <td>{m.partnerName || m.partnerId}</td>
                          <td>
                            <span
                              className={`pill-status ${
                                m.isBlockedAttempt ? 'blocked' : 'active'
                              }`}
                            >
                              {m.isBlockedAttempt ? '🚫 Blocked' : m.type}
                            </span>
                          </td>
                          <td>{m.text}</td>
                          <td>{m.time}</td>
                          <td>
                            <button
                              type="button"
                              className="act-btn delete"
                              onClick={() => handleDeleteMessage(m._id)}
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* ============================================================== */}
          {/* VIEW 6: MATCHES & OTP EVENTS                                   */}
          {/* ============================================================== */}
          {(activeNav === 'matches' || activeNav === 'events') && (
            <section className="lk-panel-card">
              <div className="lk-card-head">
                <div className="lk-card-title-with-icon">
                  <img
                    src={activeNav === 'matches' ? PUBLIC_ICONS.heart : PUBLIC_ICONS.calendar}
                    alt=""
                    className="section-3d-ico"
                  />
                  <h3>
                    {activeNav === 'matches' && 'Platform Demographics & City Breakdown'}
                    {activeNav === 'events' &&
                      `Recent Mobile OTP Verification Logs (${otps.length})`}
                  </h3>
                </div>
              </div>

              {activeNav === 'matches' && (
                <div className="admin-analytics-grid">
                  <div>
                    <h4>📍 City Distribution (Real DB Users)</h4>
                    <div className="breakdown-list">
                      {Object.entries(stats.cityBreakdown || {}).map(([city, count]) => {
                        const pct = users.length ? Math.round((count / users.length) * 100) : 0;
                        return (
                          <div key={city} className="breakdown-row">
                            <div className="breakdown-label">
                              <strong>{city}</strong>
                              <span>
                                {count} ({pct}%)
                              </span>
                            </div>
                            <div className="breakdown-bar">
                              <div className="breakdown-fill" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <h4>🕉️ Community / Religion Breakdown</h4>
                    <div className="breakdown-list">
                      {Object.entries(stats.religionBreakdown || {}).map(([rel, count]) => {
                        const pct = users.length ? Math.round((count / users.length) * 100) : 0;
                        return (
                          <div key={rel} className="breakdown-row">
                            <div className="breakdown-label">
                              <strong>{rel}</strong>
                              <span>
                                {count} ({pct}%)
                              </span>
                            </div>
                            <div className="breakdown-bar">
                              <div
                                className="breakdown-fill secondary"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {activeNav === 'events' && (
                <div className="lk-mini-table-wrap">
                  <table className="lk-clean-table">
                    <thead>
                      <tr>
                        <th>Mobile Number</th>
                        <th>OTP Code</th>
                        <th>Status</th>
                        <th>Created At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {otps.map((o) => (
                        <tr key={o._id}>
                          <td>
                            <strong>📱 +91 {o.phone}</strong>
                          </td>
                          <td>
                            <span className="otp-code-badge">{o.otp}</span>
                          </td>
                          <td>
                            <span className={`pill-status ${o.verified ? 'active' : 'blocked'}`}>
                              {o.verified ? 'Verified' : 'Pending'}
                            </span>
                          </td>
                          <td>
                            {o.createdAt ? new Date(o.createdAt).toLocaleTimeString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* ============================================================== */}
          {/* VIEW 7: ADMIN PROFILE SECTION (100% DATABASE BACKED)           */}
          {/* ============================================================== */}
          {activeNav === 'profile' && (
            <div className="admin-profile-section-wrap">
              {/* Top Executive Hero Identity Banner */}
              <section className="lk-panel-card admin-profile-hero-card">
                <div className="admin-hero-left">
                  <div className="admin-hero-avatar-box">
                    <UserAvatar
                      name={displayAdminName}
                      avatar={adminForm.avatar || displayAdminAvatar}
                      sizeClass="admin-hero-avatar"
                    />
                    <label
                      className="admin-photo-upload-badge"
                      title="Upload New Admin Profile Photo"
                    >
                      📷 Edit
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAdminAvatarUpload}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>

                  <div className="admin-hero-meta">
                    <span className="welcome-kicker-pill">
                      🛡️ VERIFIED MASTER ADMINISTRATOR • DATABASE SYNCED
                    </span>
                    <h2>{displayAdminName}</h2>
                    <p className="admin-hero-role">
                      {adminProfile.designation || 'Founder & Super Admin'} •{' '}
                      {adminProfile.department || 'Platform Operations & Trust Safety'}
                    </p>
                    <div className="admin-hero-contact-pills">
                      <span className="adm-contact-chip">✉️ {adminProfile.email}</span>
                      <span className="adm-contact-chip">
                        📱 +91 {adminProfile.phone || '9811223344'}
                      </span>
                      <span className="adm-contact-chip">
                        📍 {adminProfile.city || 'Delhi, India'}
                      </span>
                      <span className="adm-contact-chip active-chip">● Super Admin Active</span>
                    </div>
                  </div>
                </div>

                <div className="admin-hero-right-3d">
                  <div className="admin-hero-3d-stamp">
                    <div className="admin-shield-icon-badge">
                      🛡️
                    </div>
                    <div>
                      <small>Access Level</small>
                      <strong>Master Root Control</strong>
                    </div>
                  </div>
                  <div className="admin-hero-quick-btns">
                    <button
                      type="button"
                      className="act-btn view"
                      onClick={() => setActiveNav('settings')}
                    >
                      ⚙️ Platform Settings
                    </button>
                    <button
                      type="button"
                      className="act-btn unblock"
                      onClick={() => setActiveNav('help')}
                    >
                      🩺 System Health
                    </button>
                  </div>
                </div>
              </section>

              {/* 4 Live Admin Impact Mini Cards */}
              <section className="admin-profile-stats-strip">
                <div className="adm-stat-tile" onClick={() => setActiveNav('users')}>
                  <div className="adm-stat-icon-box">
                    <img src={PUBLIC_ICONS.users} alt="" width="32" height="32" className="adm-mini-stat-img" />
                  </div>
                  <div>
                    <strong>{users.length}</strong>
                    <span>Users Managed in DB</span>
                  </div>
                </div>
                <div className="adm-stat-tile" onClick={() => setActiveNav('payments')}>
                  <div className="adm-stat-icon-box">
                    <img src={PUBLIC_ICONS.selfLove} alt="" width="32" height="32" className="adm-mini-stat-img" />
                  </div>
                  <div>
                    <strong>₹{(stats.totalRevenue || 0).toLocaleString('en-IN')}</strong>
                    <span>Total VIP Revenue</span>
                  </div>
                </div>
                <div className="adm-stat-tile" onClick={() => setActiveNav('messages')}>
                  <div className="adm-stat-icon-box">
                    <img src={PUBLIC_ICONS.heart} alt="" width="32" height="32" className="adm-mini-stat-img" />
                  </div>
                  <div>
                    <strong>{messages.length}</strong>
                    <span>Chats Monitored</span>
                  </div>
                </div>
                <div className="adm-stat-tile" onClick={() => setActiveNav('reports')}>
                  <div className="adm-stat-icon-box">
                    <img src={PUBLIC_ICONS.lock} alt="" width="32" height="32" className="adm-mini-stat-img" />
                  </div>
                  <div>
                    <strong>{blockedMessages.length}</strong>
                    <span>Violations Blocked</span>
                  </div>
                </div>
              </section>

              {/* Split Grid: Left = Bio & Permissions | Right = Edit Admin Profile Form */}
              <div className="lk-bottom-split">
                <section className="lk-panel-card">
                  <div className="lk-card-head">
                    <div className="lk-card-title-with-icon">
                      <img
                        src={PUBLIC_ICONS.heart}
                        alt=""
                        width="32"
                        height="32"
                        className="section-3d-ico"
                      />
                      <div>
                        <h3>Admin Bio &amp; Active Permissions</h3>
                        <p className="lk-subtext">
                          Stored in MongoDB <code>platformsettings</code> &amp; <code>users</code>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="admin-bio-display-box">
                    <h4>📝 About Admin</h4>
                    <p>
                      {adminProfile.bio ||
                        'Managing LoveKaro platform operations, user safety, real-time chat moderation, and VIP matrimony & dating memberships.'}
                    </p>
                  </div>

                  <h4 style={{ margin: '1rem 0 0.65rem', fontSize: '0.88rem', color: '#0f172a' }}>
                    🔐 Super Admin Privileges &amp; Access Scope
                  </h4>
                  <div className="admin-permissions-cloud" style={{ marginBottom: '1rem' }}>
                    {(adminProfile.permissions || []).map((perm) => (
                      <span key={perm} className="perm-badge">
                        ✅ {perm}
                      </span>
                    ))}
                  </div>

                  <div className="admin-db-meta-box">
                    <div>
                      <span>Database Record ID:</span>
                      <code>{adminProfile._id || 'master_admin_id'}</code>
                    </div>
                    <div>
                      <span>Role &amp; Collection:</span>
                      <strong>Super Admin (users + platformsettings)</strong>
                    </div>
                    <div>
                      <span>Last Synced:</span>
                      <strong>
                        {adminProfile.lastUpdatedAt
                          ? new Date(adminProfile.lastUpdatedAt).toLocaleString('en-IN')
                          : 'Live Synced'}
                      </strong>
                    </div>
                  </div>
                </section>

                <section className="lk-panel-card">
                  <div className="lk-card-head">
                    <div className="lk-card-title-with-icon">
                      <img
                        src={PUBLIC_ICONS.users}
                        alt=""
                        width="32"
                        height="32"
                        className="section-3d-ico"
                      />
                      <div>
                        <h3>Edit Admin Profile &amp; Security</h3>
                        <p className="lk-subtext">
                          Changes are saved directly to the MongoDB database
                        </p>
                      </div>
                    </div>
                  </div>

                  <form className="admin-edit-user-form" onSubmit={handleSaveAdminProfile}>
                    <div className="admin-form-grid">
                      <div className="admin-field">
                        <label>Admin Full Name *</label>
                        <input
                          type="text"
                          required
                          value={adminForm.name}
                          onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                        />
                      </div>
                      <div className="admin-field">
                        <label>Official Email Address *</label>
                        <input
                          type="email"
                          required
                          value={adminForm.email}
                          onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                        />
                      </div>
                      <div className="admin-field">
                        <label>Mobile Number *</label>
                        <input
                          type="text"
                          required
                          value={adminForm.phone}
                          onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
                        />
                      </div>
                      <div className="admin-field">
                        <label>Designation / Title</label>
                        <input
                          type="text"
                          value={adminForm.designation}
                          onChange={(e) =>
                            setAdminForm({ ...adminForm, designation: e.target.value })
                          }
                        />
                      </div>
                      <div className="admin-field">
                        <label>Department</label>
                        <input
                          type="text"
                          value={adminForm.department}
                          onChange={(e) =>
                            setAdminForm({ ...adminForm, department: e.target.value })
                          }
                        />
                      </div>
                      <div className="admin-field">
                        <label>City / Location</label>
                        <input
                          type="text"
                          value={adminForm.city}
                          onChange={(e) => setAdminForm({ ...adminForm, city: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="admin-field" style={{ marginBottom: '0.85rem' }}>
                      <label>Admin Bio / Operational Notes</label>
                      <textarea
                        rows="3"
                        className="admin-textarea"
                        value={adminForm.bio}
                        onChange={(e) => setAdminForm({ ...adminForm, bio: e.target.value })}
                      />
                    </div>

                    <div className="admin-field" style={{ marginBottom: '1rem' }}>
                      <label>Update Admin Password (Optional)</label>
                      <input
                        type="password"
                        placeholder="Leave blank to keep current password"
                        value={adminForm.newPassword}
                        onChange={(e) =>
                          setAdminForm({ ...adminForm, newPassword: e.target.value })
                        }
                      />
                    </div>

                    <button
                      type="submit"
                      className="save-user-btn"
                      disabled={savingAdminProfile}
                    >
                      {savingAdminProfile
                        ? 'Saving to MongoDB...'
                        : '💾 Save Admin Profile to Database'}
                    </button>
                  </form>
                </section>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 8: PLATFORM SETTINGS SECTION (100% DATABASE BACKED)       */}
          {/* ============================================================== */}
          {activeNav === 'settings' && (
            <section className="lk-panel-card">
              <div className="lk-card-head">
                <div className="lk-card-title-with-icon">
                  <img src={PUBLIC_ICONS.lock} alt="" className="section-3d-ico" />
                  <div>
                    <h3>Platform Settings, Pricing &amp; Chat Rules Configuration</h3>
                    <p className="lk-subtext">
                      All configuration changes are persisted in MongoDB (
                      <code>platformsettings</code> collection)
                    </p>
                  </div>
                </div>
              </div>

              <form className="admin-settings-master-form" onSubmit={handleSavePlatformSettings}>
                <div className="settings-2col-grid">
                  {/* Left Column: Brand, Support & VIP Plan Pricing */}
                  <div className="settings-subcard">
                    <h4>🏷️ Platform Identity &amp; Support Details</h4>
                    <div className="admin-form-grid">
                      <div className="admin-field">
                        <label>Platform Name</label>
                        <input
                          type="text"
                          value={platformSettings.siteName}
                          onChange={(e) =>
                            setPlatformSettings({
                              ...platformSettings,
                              siteName: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="admin-field">
                        <label>Tagline</label>
                        <input
                          type="text"
                          value={platformSettings.tagline}
                          onChange={(e) =>
                            setPlatformSettings({
                              ...platformSettings,
                              tagline: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="admin-field">
                        <label>Support Email</label>
                        <input
                          type="email"
                          value={platformSettings.supportEmail}
                          onChange={(e) =>
                            setPlatformSettings({
                              ...platformSettings,
                              supportEmail: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="admin-field">
                        <label>Support Helpline Phone</label>
                        <input
                          type="text"
                          value={platformSettings.supportPhone}
                          onChange={(e) =>
                            setPlatformSettings({
                              ...platformSettings,
                              supportPhone: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <h4 style={{ marginTop: '1.25rem' }}>
                      💎 VIP Membership Pricing &amp; Free Chat Quota
                    </h4>
                    <div className="admin-form-grid">
                      <div className="admin-field">
                        <label>Free Chat Prompts Limit</label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={platformSettings.freePromptsLimit}
                          onChange={(e) =>
                            setPlatformSettings({
                              ...platformSettings,
                              freePromptsLimit: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div className="admin-field">
                        <label>Starter Pass Price (₹)</label>
                        <input
                          type="number"
                          min="1"
                          value={platformSettings.starterPlanPrice}
                          onChange={(e) =>
                            setPlatformSettings({
                              ...platformSettings,
                              starterPlanPrice: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div className="admin-field">
                        <label>Gold VIP Pass Price (₹)</label>
                        <input
                          type="number"
                          min="1"
                          value={platformSettings.goldPlanPrice}
                          onChange={(e) =>
                            setPlatformSettings({
                              ...platformSettings,
                              goldPlanPrice: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div className="admin-field">
                        <label>Diamond VIP Pass Price (₹)</label>
                        <input
                          type="number"
                          min="1"
                          value={platformSettings.diamondPlanPrice}
                          onChange={(e) =>
                            setPlatformSettings({
                              ...platformSettings,
                              diamondPlanPrice: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Interactive Security & Moderation Toggles */}
                  <div className="settings-subcard">
                    <h4>🛡️ Real-Time Security &amp; Moderation Switches</h4>
                    <div className="admin-switch-list">
                      <label className="admin-switch-item">
                        <div>
                          <strong>Block Phone Numbers &amp; Instagram IDs in Free Chat</strong>
                          <small>
                            Automatically block digits, @handles, WhatsApp, and social links before
                            VIP payment
                          </small>
                        </div>
                        <input
                          type="checkbox"
                          checked={Boolean(platformSettings.blockContactSharingInFreeChat)}
                          onChange={(e) =>
                            setPlatformSettings({
                              ...platformSettings,
                              blockContactSharingInFreeChat: e.target.checked,
                            })
                          }
                        />
                      </label>

                      <label className="admin-switch-item">
                        <div>
                          <strong>Require Mobile OTP Verification on Signup</strong>
                          <small>
                            Users must verify their 10-digit mobile number via OTP during
                            registration
                          </small>
                        </div>
                        <input
                          type="checkbox"
                          checked={Boolean(platformSettings.requirePhoneOtpVerification)}
                          onChange={(e) =>
                            setPlatformSettings({
                              ...platformSettings,
                              requirePhoneOtpVerification: e.target.checked,
                            })
                          }
                        />
                      </label>

                      <label className="admin-switch-item">
                        <div>
                          <strong>Auto-Activate New User Registrations</strong>
                          <small>
                            Allow newly registered users to appear in Discover immediately
                          </small>
                        </div>
                        <input
                          type="checkbox"
                          checked={Boolean(platformSettings.autoApproveNewUsers)}
                          onChange={(e) =>
                            setPlatformSettings({
                              ...platformSettings,
                              autoApproveNewUsers: e.target.checked,
                            })
                          }
                        />
                      </label>

                      <label className="admin-switch-item">
                        <div>
                          <strong>Platform Maintenance Mode</strong>
                          <small>
                            Display maintenance notice to non-admin visitors during upgrades
                          </small>
                        </div>
                        <input
                          type="checkbox"
                          checked={Boolean(platformSettings.maintenanceMode)}
                          onChange={(e) =>
                            setPlatformSettings({
                              ...platformSettings,
                              maintenanceMode: e.target.checked,
                            })
                          }
                        />
                      </label>
                    </div>

                    <div className="settings-save-bar">
                      <button
                        type="submit"
                        className="save-user-btn"
                        disabled={savingSettings}
                      >
                        {savingSettings
                          ? 'Saving Settings to DB...'
                          : '💾 Save All Settings to Database'}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </section>
          )}

          {/* ============================================================== */}
          {/* VIEW 9: HELP & SYSTEM HEALTH SECTION (100% DATABASE BACKED)    */}
          {/* ============================================================== */}
          {activeNav === 'help' && (
            <div className="admin-help-health-wrap">
              {/* Top Row: Live System & Database Health Cards */}
              <section className="lk-panel-card">
                <div className="lk-card-head">
                  <div className="lk-card-title-with-icon">
                    <img src={PUBLIC_ICONS.calendar} alt="" className="section-3d-ico" />
                    <div>
                      <h3>Live System, Database &amp; API Health Monitor</h3>
                      <p className="lk-subtext">
                        Real-time diagnostics from Node.js backend, Socket.IO engine, and MongoDB
                        collections
                      </p>
                    </div>
                  </div>
                  <div className="lk-filter-bar">
                    <button
                      type="button"
                      className="act-btn view"
                      onClick={() => handleExportData('users_csv')}
                    >
                      📥 Export Users CSV
                    </button>
                    <button
                      type="button"
                      className="act-btn edit"
                      onClick={() => handleExportData('full_json')}
                    >
                      💾 Download Full DB Backup (JSON)
                    </button>
                    <button
                      type="button"
                      className="act-btn unblock"
                      onClick={fetchAdminData}
                    >
                      🔄 Refresh Health Check
                    </button>
                  </div>
                </div>

                <div className="health-metrics-grid">
                  <div className="health-metric-card ok">
                    <span>MongoDB Database</span>
                    <strong>● {systemHealth.databaseStatus || 'Connected'}</strong>
                    <small>
                      DB: <code>{systemHealth.databaseName || 'lovekaro'}</code> (
                      {systemHealth.databaseHost || 'localhost'})
                    </small>
                  </div>

                  <div className="health-metric-card ok">
                    <span>Real-Time Socket.IO</span>
                    <strong>● {connected ? 'Connected & Live' : 'Reconnecting'}</strong>
                    <small>{systemHealth.socketServer || 'Active'}</small>
                  </div>

                  <div className="health-metric-card ok">
                    <span>Mobile &amp; Web REST API</span>
                    <strong>● {systemHealth.apiVersion || 'v1 Ready'}</strong>
                    <small>
                      Spec: <code>GET /api/v1/docs</code>
                    </small>
                  </div>

                  <div className="health-metric-card">
                    <span>Server Uptime &amp; Memory</span>
                    <strong>
                      {Math.floor((systemHealth.uptimeSeconds || 0) / 60)}m{' '}
                      {(systemHealth.uptimeSeconds || 0) % 60}s
                    </strong>
                    <small>
                      RAM: {systemHealth.memoryHeapUsedMb || 0} MB /{' '}
                      {systemHealth.memoryRssMb || 0} MB ({systemHealth.nodeVersion || 'Node.js'})
                    </small>
                  </div>
                </div>

                {/* MongoDB Collection Counts Strip */}
                <div className="db-collections-strip">
                  <div className="db-col-pill">
                    <span>users collection</span>
                    <strong>{systemHealth.collections?.users ?? users.length} docs</strong>
                  </div>
                  <div className="db-col-pill">
                    <span>payments collection</span>
                    <strong>{systemHealth.collections?.payments ?? payments.length} docs</strong>
                  </div>
                  <div className="db-col-pill">
                    <span>messages collection</span>
                    <strong>{systemHealth.collections?.messages ?? messages.length} docs</strong>
                  </div>
                  <div className="db-col-pill">
                    <span>otps collection</span>
                    <strong>{systemHealth.collections?.otps ?? otps.length} docs</strong>
                  </div>
                  <div className="db-col-pill">
                    <span>notifications collection</span>
                    <strong>{systemHealth.collections?.notifications ?? 0} docs</strong>
                  </div>
                </div>
              </section>

              {/* Bottom Split: Left = Create Support/Help Ticket | Right = Database Help Tickets List */}
              <div className="lk-bottom-split">
                <section className="lk-panel-card">
                  <div className="lk-card-head">
                    <div className="lk-card-title-with-icon">
                      <img src={PUBLIC_ICONS.selfLove} alt="" className="section-3d-ico" />
                      <div>
                        <h3>Log New Admin Help Ticket / Support Task</h3>
                        <p className="lk-subtext">
                          Saved directly in MongoDB for admin team tracking
                        </p>
                      </div>
                    </div>
                  </div>

                  <form className="admin-edit-user-form" onSubmit={handleCreateHelpTicket}>
                    <div className="admin-field" style={{ marginBottom: '0.75rem' }}>
                      <label>Issue / Task Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Verify VIP payment for user +91 98XXXXXXXX"
                        value={ticketForm.title}
                        onChange={(e) =>
                          setTicketForm({ ...ticketForm, title: e.target.value })
                        }
                      />
                    </div>

                    <div className="admin-form-grid">
                      <div className="admin-field">
                        <label>Category</label>
                        <select
                          className="admin-select-input"
                          value={ticketForm.category}
                          onChange={(e) =>
                            setTicketForm({ ...ticketForm, category: e.target.value })
                          }
                        >
                          <option value="Payment Issue">Payment Issue</option>
                          <option value="Account & OTP">Account &amp; OTP</option>
                          <option value="Profile Verification">Profile Verification</option>
                          <option value="Bug / Technical">Bug / Technical</option>
                          <option value="General Help">General Help</option>
                        </select>
                      </div>

                      <div className="admin-field">
                        <label>Priority</label>
                        <select
                          className="admin-select-input"
                          value={ticketForm.priority}
                          onChange={(e) =>
                            setTicketForm({ ...ticketForm, priority: e.target.value })
                          }
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Critical">Critical</option>
                        </select>
                      </div>
                    </div>

                    <div className="admin-field" style={{ marginBottom: '0.75rem' }}>
                      <label>User Phone / Email Reference (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. +91 9811223344 or user@email.com"
                        value={ticketForm.contactInfo}
                        onChange={(e) =>
                          setTicketForm({ ...ticketForm, contactInfo: e.target.value })
                        }
                      />
                    </div>

                    <div className="admin-field" style={{ marginBottom: '1rem' }}>
                      <label>Detailed Description / Resolution Notes</label>
                      <textarea
                        rows="3"
                        className="admin-textarea"
                        placeholder="Write details about the support request or action needed..."
                        value={ticketForm.description}
                        onChange={(e) =>
                          setTicketForm({ ...ticketForm, description: e.target.value })
                        }
                      />
                    </div>

                    <button type="submit" className="save-user-btn" disabled={savingTicket}>
                      {savingTicket ? 'Saving Ticket...' : '➕ Save Help Ticket to Database'}
                    </button>
                  </form>
                </section>

                <section className="lk-panel-card">
                  <div className="lk-card-head">
                    <div className="lk-card-title-with-icon">
                      <img src={PUBLIC_ICONS.lock} alt="" className="section-3d-ico" />
                      <div>
                        <h3>Active Help Center Tickets &amp; Notes ({helpTickets.length})</h3>
                        <p className="lk-subtext">
                          Helpline: {platformSettings.supportEmail} •{' '}
                          {platformSettings.supportPhone}
                        </p>
                      </div>
                    </div>
                  </div>

                  {helpTickets.length === 0 ? (
                    <div className="lk-empty-mini">
                      <img src={PUBLIC_ICONS.heart} alt="" className="empty-3d-icon" />
                      <p>No help tickets in database. Add one on the left!</p>
                    </div>
                  ) : (
                    <div className="help-tickets-list">
                      {helpTickets.map((t) => (
                        <div
                          key={t._id}
                          className={`help-ticket-card ${
                            t.status === 'resolved' ? 'resolved' : ''
                          }`}
                        >
                          <div className="ticket-top-row">
                            <span className="ticket-cat-pill">{t.category}</span>
                            <span className={`ticket-prio-pill ${(t.priority || 'Medium').toLowerCase()}`}>
                              {t.priority}
                            </span>
                            <span
                              className={`pill-status ${
                                t.status === 'resolved' ? 'active' : 'blocked'
                              }`}
                            >
                              {t.status === 'resolved' ? 'Resolved ✅' : 'Open ⏳'}
                            </span>
                          </div>
                          <h4>{t.title}</h4>
                          {t.description && <p>{t.description}</p>}
                          <div className="ticket-foot-row">
                            <small>
                              {t.contactInfo ? `📞 ${t.contactInfo} • ` : ''}
                              {t.createdAt
                                ? new Date(t.createdAt).toLocaleDateString('en-IN')
                                : 'Today'}
                            </small>
                            <div className="lk-action-group">
                              <button
                                type="button"
                                className={`act-btn ${
                                  t.status === 'resolved' ? 'block' : 'unblock'
                                }`}
                                onClick={() => handleToggleTicketStatus(t)}
                              >
                                {t.status === 'resolved' ? 'Reopen' : '✓ Mark Resolved'}
                              </button>
                              <button
                                type="button"
                                className="act-btn delete"
                                onClick={() => handleDeleteTicket(t._id)}
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ================================================================ */}
      {/* 360° COMPLETE USER DETAIL & EDIT MODAL                           */}
      {/* ================================================================ */}
      {selectedUser && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedUser(null)}>
          <div
            className="admin-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="admin-modal-header">
              <div className="modal-user-summary">
                <UserAvatar
                  name={selectedUser.name}
                  avatar={selectedUser.avatar}
                  sizeClass="modal-avatar"
                />
                <div>
                  <h2>
                    {selectedUser.name}, {selectedUser.age} yrs{' '}
                    {selectedUser.isPremium && <span className="pill-vip">💎 VIP PAID</span>}
                  </h2>
                  <p>
                    📱 +91 {selectedUser.phone} • ✉️ {selectedUser.email} • ID:{' '}
                    <code>{selectedUser._id}</code>
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-x"
                onClick={() => setSelectedUser(null)}
              >
                ✕
              </button>
            </div>

            <div className="admin-modal-subtabs">
              <button
                type="button"
                className={modalMode === 'view' ? 'active' : ''}
                onClick={() => setModalMode('view')}
              >
                📋 Complete 360° Bio-Data &amp; Details
              </button>
              <button
                type="button"
                className={modalMode === 'edit' ? 'active' : ''}
                onClick={() => setModalMode('edit')}
              >
                ✏️ Edit User &amp; VIP Status
              </button>
              <button
                type="button"
                className={modalMode === 'activity' ? 'active' : ''}
                onClick={() => setModalMode('activity')}
              >
                💳 Payments ({userActivity.payments.length}) &amp; Chats (
                {userActivity.messages.length})
              </button>
            </div>

            <div className="admin-modal-body">
              {modalMode === 'view' && (
                <div className="user-360-view">
                  <div className="quick-status-strip">
                    <span>
                      Status:{' '}
                      <strong>
                        {selectedUser.isActive !== false ? '✅ Active' : '🚫 Blocked'}
                      </strong>
                    </span>
                    <span>
                      Plan:{' '}
                      <strong>
                        {selectedUser.isPremium
                          ? `💎 Paid VIP (${selectedUser.premiumPlan || 'VIP'})`
                          : `🎁 Free (${selectedUser.freePromptsUsed || 0}/5 prompts used)`}
                      </strong>
                    </span>
                    <span>
                      Mobile OTP:{' '}
                      <strong>
                        {selectedUser.isPhoneVerified ? '✅ Verified' : '⏳ Unverified'}
                      </strong>
                    </span>
                  </div>

                  <div className="detail-grid-3">
                    <div className="detail-box">
                      <span>Full Name</span>
                      <strong>{selectedUser.name}</strong>
                    </div>
                    <div className="detail-box">
                      <span>Email Address</span>
                      <strong>{selectedUser.email}</strong>
                    </div>
                    <div className="detail-box">
                      <span>Mobile Number</span>
                      <strong>+91 {selectedUser.phone}</strong>
                    </div>
                    <div className="detail-box">
                      <span>Age &amp; Gender</span>
                      <strong style={{ textTransform: 'capitalize' }}>
                        {selectedUser.age} Years • {selectedUser.gender}
                      </strong>
                    </div>
                    <div className="detail-box">
                      <span>Interested In</span>
                      <strong style={{ textTransform: 'capitalize' }}>
                        {selectedUser.interestedIn || 'Everyone'}
                      </strong>
                    </div>
                    <div className="detail-box">
                      <span>Marital Status</span>
                      <strong>{selectedUser.maritalStatus || 'Never Married'}</strong>
                    </div>
                    <div className="detail-box">
                      <span>Religion &amp; Mother Tongue</span>
                      <strong>
                        {selectedUser.religion || 'Hindu'} •{' '}
                        {selectedUser.motherTongue || 'Hindi'}
                      </strong>
                    </div>
                    <div className="detail-box">
                      <span>City &amp; State</span>
                      <strong>
                        {selectedUser.location?.city || 'Delhi'}
                        {selectedUser.location?.state ? `, ${selectedUser.location.state}` : ''}
                      </strong>
                    </div>
                    <div className="detail-box">
                      <span>Profession &amp; Education</span>
                      <strong>
                        {selectedUser.occupation || 'Not specified'} •{' '}
                        {selectedUser.education || 'Not specified'}
                      </strong>
                    </div>
                  </div>

                  <div className="detail-bio-section">
                    <h4>📝 About / Bio</h4>
                    <p>{selectedUser.bio || 'No bio written by user.'}</p>
                  </div>
                </div>
              )}

              {modalMode === 'edit' && (
                <form className="admin-edit-user-form" onSubmit={handleSaveUserEdit}>
                  <div className="admin-form-grid">
                    <div className="admin-field">
                      <label>Full Name</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="admin-field">
                      <label>Email Address</label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="admin-field">
                      <label>Mobile Number</label>
                      <input
                        type="text"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        required
                      />
                    </div>
                    <div className="admin-field">
                      <label>Age</label>
                      <input
                        type="number"
                        min="18"
                        max="80"
                        value={editForm.age}
                        onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                      />
                    </div>
                    <div className="admin-field">
                      <label>City</label>
                      <input
                        type="text"
                        value={editForm.city}
                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      />
                    </div>
                    <div className="admin-field">
                      <label>Reset Password (Optional)</label>
                      <input
                        type="text"
                        placeholder="Leave blank to keep existing"
                        value={editForm.newPassword}
                        onChange={(e) =>
                          setEditForm({ ...editForm, newPassword: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="admin-checkbox-row">
                    <label>
                      <input
                        type="checkbox"
                        checked={editForm.isPremium}
                        onChange={(e) =>
                          setEditForm({ ...editForm, isPremium: e.target.checked })
                        }
                      />
                      💎 Paid VIP Member (Unlimited Chat &amp; Full Profile Access)
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={editForm.isActive}
                        onChange={(e) =>
                          setEditForm({ ...editForm, isActive: e.target.checked })
                        }
                      />
                      ✅ Account Active
                    </label>
                  </div>

                  <div className="modal-footer-btns">
                    <button type="submit" className="save-user-btn" disabled={savingUser}>
                      {savingUser ? 'Saving...' : '💾 Save Changes to Database'}
                    </button>
                  </div>
                </form>
              )}

              {modalMode === 'activity' && (
                <div className="user-activity-logs">
                  <h4>💳 Payments by {selectedUser.name}</h4>
                  {userActivity.payments.length === 0 ? (
                    <p className="muted-note">No payments made by this user yet.</p>
                  ) : (
                    <ul className="mini-log-list">
                      {userActivity.payments.map((p) => (
                        <li key={p._id}>
                          <strong>₹{p.amount}</strong> — {p.planName} ({p.paymentMethod}) • TXN:{' '}
                          <code>{p.transactionId}</code>
                        </li>
                      ))}
                    </ul>
                  )}

                  <h4 style={{ marginTop: '1.25rem' }}>💬 Chat Messages by {selectedUser.name}</h4>
                  {userActivity.messages.length === 0 ? (
                    <p className="muted-note">No messages sent by this user yet.</p>
                  ) : (
                    <ul className="mini-log-list">
                      {userActivity.messages.map((m) => (
                        <li key={m._id}>
                          <strong>To {m.partnerName || m.partnerId}:</strong> &ldquo;{m.text}&rdquo;{' '}
                          {m.isBlockedAttempt && (
                            <span className="pill-status blocked">
                              🚫 Blocked ({m.blockReason})
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* CREATE NEW USER MODAL                                            */}
      {/* ================================================================ */}
      {showCreateModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div
            className="admin-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="admin-modal-header">
              <h2>➕ Create New User Account</h2>
              <button
                type="button"
                className="modal-close-x"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
              <form className="admin-edit-user-form" onSubmit={handleCreateUser}>
                <div className="admin-form-grid">
                  <div className="admin-field">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      required
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    />
                  </div>
                  <div className="admin-field">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      required
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    />
                  </div>
                  <div className="admin-field">
                    <label>10-Digit Mobile *</label>
                    <input
                      type="text"
                      required
                      value={createForm.phone}
                      onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="admin-field">
                    <label>Password *</label>
                    <input
                      type="text"
                      required
                      value={createForm.password}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, password: e.target.value })
                      }
                    />
                  </div>
                  <div className="admin-field">
                    <label>Age</label>
                    <input
                      type="number"
                      value={createForm.age}
                      onChange={(e) => setCreateForm({ ...createForm, age: e.target.value })}
                    />
                  </div>
                  <div className="admin-field">
                    <label>City</label>
                    <input
                      type="text"
                      value={createForm.city}
                      onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                    />
                  </div>
                </div>
                <div className="admin-checkbox-row">
                  <label>
                    <input
                      type="checkbox"
                      checked={createForm.isPremium}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, isPremium: e.target.checked })
                      }
                    />
                    💎 Grant VIP Paid Membership Immediately
                  </label>
                </div>
                <div className="modal-footer-btns">
                  <button type="submit" className="save-user-btn" disabled={savingUser}>
                    {savingUser ? 'Creating...' : '➕ Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
