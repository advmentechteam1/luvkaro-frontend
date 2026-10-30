import { useState, useEffect, useMemo } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { userApi } from '../services/api';
import { getDefaultPhotoForGender, isRealRegisteredUser } from '../data/profiles';
import PaymentModal from '../components/PaymentModal';
import { detectRestrictedContactInfo } from '../utils/contactFilter';
import './ProfilePage.css';

const MAX_FREE_PROMPTS = 5;

const PAYMENT_PLANS = [
  {
    id: 'starter',
    name: 'Starter Chat & Profile Pass',
    price: 199,
    duration: '7 Days Access',
    badge: 'Quick Unlock',
    features: [
      'Unlimited Chat Messages (No 5-Prompt Limit)',
      'Unlock Full Partner Bio-Data & Profile Check',
      'Share Contact & Social Handles Freely',
    ],
  },
  {
    id: 'gold',
    name: 'Gold Unlimited Chat & Profile VIP',
    price: 499,
    duration: '30 Days Access',
    badge: '⭐ Most Popular',
    features: [
      'Unlimited Chat with All Matches',
      '100% Full Profile & Contact Details Check',
      'Share Phone Number & Instagram ID in Chat',
      'Verified VIP Gold Badge on Your Profile',
    ],
  },
  {
    id: 'diamond',
    name: 'Diamond Matrimony & Dating Pass',
    price: 999,
    duration: '90 Days VIP Access',
    badge: '👑 Best Value',
    features: [
      'Everything in Gold VIP + Priority Profile Boost',
      'Direct Phone & WhatsApp Connect with Matches',
      'Dedicated Relationship Compatibility Insights',
    ],
  },
];

function hasRealPhoto(url) {
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

function getFallbackPhotoByGender(gender = 'female', idx = 0) {
  return getDefaultPhotoForGender(gender, idx);
}

function AvatarOrInitials({ name, avatar, gender = 'female', className = '', style = {} }) {
  const resolvedSrc = hasRealPhoto(avatar) ? avatar : getFallbackPhotoByGender(gender, String(name || '').length);
  return (
    <img
      src={resolvedSrc}
      alt={name || 'User'}
      className={className}
      style={{ objectFit: 'cover', ...style }}
    />
  );
}

const ALL_INTERESTS = [
  'Traveling',
  'Music',
  'Fitness & Gym',
  'Cooking',
  'Movies',
  'Reading',
  'Photography',
  'Coffee',
  'Nature',
  'Tech & Coding',
  'Dancing',
  'Pets & Dogs',
  'Yoga',
  'Cricket',
  'Art',
];

const ICEBREAKERS = [
  'Adrak chai vs Filter coffee — what is your pick? ☕',
  'What does your ideal Sunday morning look like? ✨',
  'Favorite street food spot in your city? 😋',
  'Mountains or beaches for a weekend getaway? 🏔️🏖️',
];

export default function ProfilePage() {
  const { user, isAuthenticated, updateUser, logout, openLogin } = useAuth();
  const { lastIncomingMessage, onlineUsers, connected, sendChatMessage } = useSocket();

  // Active Dashboard Section: 'overview' | 'edit' | 'chats' | 'matches' | 'preferences' | 'settings'
  const [activeTab, setActiveTab] = useState('overview');

  // Toast / Status Banner
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [saving, setSaving] = useState(false);

  // Dashboard Backend State (100% Real MongoDB Data)
  const [stats, setStats] = useState({
    profileViews: 0,
    likesSent: 0,
    matchesCount: 0,
    completionPercent: 85,
    freePromptsUsed: 0,
    freePromptsRemaining: MAX_FREE_PROMPTS,
    isPremium: false,
  });
  const [dbProfiles, setDbProfiles] = useState([]);
  const [likedIds, setLikedIds] = useState([]);
  const [whoLikedMeIds, setWhoLikedMeIds] = useState([]);
  const [matchFilter, setMatchFilter] = useState('all');
  const [paymentsHistory, setPaymentsHistory] = useState([]);

  // Payment Unlock Modal & Partner Full Profile Modal State
  const [paymentModal, setPaymentModal] = useState({
    open: false,
    reason: '',
    partner: null,
  });
  const [selectedPlanId, setSelectedPlanId] = useState('gold');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentRef, setPaymentRef] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [inspectedPartner, setInspectedPartner] = useState(null);

  // Edit Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: '',
    age: 24,
    dob: '2002-01-01',
    gender: 'female',
    interestedIn: 'male',
    maritalStatus: 'Never Married',
    religion: 'Hindu',
    motherTongue: 'Hindi',
    city: 'Delhi',
    state: '',
    occupation: '',
    education: '',
    height: '5\'5"',
    diet: 'Veg',
    bio: '',
    avatar: '',
    photos: [],
    interests: [],
    socialLinks: {
      instagram: '',
      facebook: '',
      linkedin: '',
      twitter: '',
      youtube: '',
    },
  });

  // Settings & Partner Preferences State
  const [settingsForm, setSettingsForm] = useState({
    showOnlineStatus: true,
    showAge: true,
    showDistance: true,
    profileVisibility: 'everyone',
    emailNotifications: true,
    matchAlerts: true,
    messageAlerts: true,
    partnerPreferences: {
      minAge: 20,
      maxAge: 34,
      preferredReligion: 'Any',
      preferredMotherTongue: 'Any',
      preferredCity: 'Any',
      preferredMaritalStatus: 'Any',
    },
  });

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Chat State
  const [selectedChatId, setSelectedChatId] = useState('');
  const [chatSearch, setChatSearch] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [chatWarning, setChatWarning] = useState('');
  const [chatThreads, setChatThreads] = useState({});
  const [showEmojiTray, setShowEmojiTray] = useState(false);
  const [mobileChatView, setMobileChatView] = useState('list'); // 'list' | 'chat'

  const isPremiumUser = Boolean(user?.isPremium || stats.isPremium);
  const promptsUsed = stats.freePromptsUsed || 0;
  const promptsRemaining = isPremiumUser
    ? 9999
    : Math.max(0, MAX_FREE_PROMPTS - promptsUsed);

  const showNotice = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev.message === message ? { message: '', type: 'success' } : prev));
    }, 4500);
  };

  // Sync local forms whenever user changes
  useEffect(() => {
    if (user) {
      const dobStr = user.dob
        ? new Date(user.dob).toISOString().split('T')[0]
        : '2002-01-01';

      setProfileForm({
        name: user.name || '',
        age: user.age || 24,
        dob: dobStr,
        gender: user.gender || 'female',
        interestedIn: user.interestedIn || 'everyone',
        maritalStatus: user.maritalStatus || 'Never Married',
        religion: user.religion || 'Hindu',
        motherTongue: user.motherTongue || 'Hindi',
        city: user.location?.city || user.city || 'Delhi',
        state: user.location?.state || '',
        occupation: user.occupation || '',
        education: user.education || '',
        height: user.height || '5\'5"',
        diet: user.diet || 'Veg',
        bio: user.bio || '',
        avatar: hasRealPhoto(user.avatar)
          ? user.avatar
          : getFallbackPhotoByGender(user.gender || 'female', String(user.name || '').length),
        photos: (user.photos || []).filter(hasRealPhoto),
        interests: user.interests || [],
        socialLinks: {
          instagram: user.socialLinks?.instagram || '',
          facebook: user.socialLinks?.facebook || '',
          linkedin: user.socialLinks?.linkedin || '',
          twitter: user.socialLinks?.twitter || '',
          youtube: user.socialLinks?.youtube || '',
        },
      });

      if (user.settings) {
        setSettingsForm((prev) => ({
          ...prev,
          ...user.settings,
          partnerPreferences: {
            ...prev.partnerPreferences,
            ...(user.settings.partnerPreferences || {}),
          },
        }));
      }

      if (Array.isArray(user.likes)) {
        setLikedIds(user.likes.map((id) => id.toString()));
      }
    }
  }, [user]);

  // Fetch Dashboard Data from Backend
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadDashboard = async () => {
      try {
        const res = await userApi.getDashboard();
        if (res.data) {
          if (res.data.stats) setStats(res.data.stats);
          if (res.data.profiles) setDbProfiles(res.data.profiles);
          if (res.data.payments) setPaymentsHistory(res.data.payments);
          if (Array.isArray(res.data.whoLikedMeIds)) setWhoLikedMeIds(res.data.whoLikedMeIds);
          if (res.data.user) updateUser(res.data.user);
          if (res.data.messages && res.data.messages.length > 0) {
            setChatThreads((prev) => {
              const updated = { ...prev };
              const byPartner = {};
              res.data.messages.forEach((m) => {
                if (!byPartner[m.partnerId]) byPartner[m.partnerId] = [];
                byPartner[m.partnerId].push({
                  text: m.text,
                  type: m.type,
                  time: m.time || 'Recently',
                });
              });
              Object.keys(byPartner).forEach((pid) => {
                updated[pid] = byPartner[pid];
              });
              return updated;
            });
          }
        }
      } catch (err) {
        console.warn('Dashboard fetch warning:', err.message);
      }
    };

    loadDashboard();
  }, [isAuthenticated]);

  // Target Match Gender: Respect user's chosen interestedIn preference first (male, female, or everyone)
  const targetMatchGender = useMemo(() => {
    const pref = String(user?.interestedIn || '').toLowerCase();
    if (pref === 'male' || pref === 'female') return pref;
    if (pref === 'everyone' || pref === 'all') return 'all';

    const g = String(user?.gender || '').toLowerCase();
    if (g === 'male') return 'female';
    if (g === 'female') return 'male';
    return 'all';
  }, [user?.gender, user?.interestedIn]);

  const allMatchProfiles = useMemo(() => {
    const rawList = dbProfiles.filter((p) => {
      if (!isRealRegisteredUser(p)) return false;
      if (targetMatchGender === 'all') return true;
      return String(p.gender || '').toLowerCase() === targetMatchGender;
    });

    return rawList.map((p, idx) => {
      const pGender =
        p.gender || (targetMatchGender !== 'all' ? targetMatchGender : 'female');
      const photoUrl = hasRealPhoto(p.avatar || p.image)
        ? p.avatar || p.image
        : getFallbackPhotoByGender(pGender, idx);

      const profileIdStr = (p._id || p.id)?.toString();
      const hasLikedMe = Boolean(
        p.hasLikedMe ||
        (profileIdStr && whoLikedMeIds.includes(profileIdStr))
      );

      return {
        id: p._id || p.id || `match-${idx}`,
        name: p.name,
        gender: pGender,
        email: p.email || '',
        phone: p.phone || '',
        age: p.age || 24,
        city: p.location?.city || (p.city ? p.city.replace(', India', '') : 'Delhi'),
        state: p.location?.state || '',
        religion: p.religion || 'Hindu',
        motherTongue: p.motherTongue || 'Hindi',
        maritalStatus: p.maritalStatus || 'Never Married',
        occupation: p.occupation || 'Professional',
        education: p.education || "Bachelor's Degree",
        height: p.height || '5\'5"',
        diet: p.diet || 'Veg',
        avatar: photoUrl,
        image: photoUrl,
        online: onlineUsers.includes((p._id || p.id)?.toString()),
        hasLikedMe,
        compatibility: 97 - (idx % 10),
        bio: p.bio || 'Looking for a genuine and meaningful connection on LoveKaro.',
        interests: p.interests?.length
          ? p.interests
          : ['Traveling', 'Music', 'Coffee'],
      };
    });
  }, [dbProfiles, onlineUsers, targetMatchGender, whoLikedMeIds]);

  // Listen to real-time Socket incoming messages
  useEffect(() => {
    if (!lastIncomingMessage) return;
    const pid = (lastIncomingMessage.partnerId || lastIncomingMessage.senderId || '').toString();
    if (!pid) return;
    const incomingText = lastIncomingMessage.text || lastIncomingMessage.message?.text;
    if (!incomingText) return;
    const incomingType = lastIncomingMessage.type || lastIncomingMessage.message?.type || 'received';
    const incomingTime = lastIncomingMessage.time || lastIncomingMessage.message?.time || 'Just now';

    setChatThreads((prev) => {
      const existing = prev[pid] || [];
      const alreadyExists = existing.some(
        (m) => m.text === incomingText && m.type === incomingType
      );
      if (alreadyExists) return prev;
      return {
        ...prev,
        [pid]: [
          ...existing,
          {
            text: incomingText,
            type: incomingType,
            time: incomingTime,
          },
        ],
      };
    });
  }, [lastIncomingMessage]);

  // Real-Time Background Message Sync: Self-scheduling poll with backoff when offline
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    let timerId = null;

    const syncLiveMessages = async () => {
      let nextDelay = 3000;
      try {
        const res = await userApi.getMessages();
        if (res?.offline) {
          nextDelay = 8000;
        } else if (isMounted && Array.isArray(res?.data) && res.data.length > 0) {
          setChatThreads((prev) => {
            let changed = false;
            const updated = { ...prev };
            res.data.forEach((m) => {
              const pid = m.partnerId.toString();
              if (!updated[pid]) updated[pid] = [];
              const exists = updated[pid].some(
                (existing) => existing.text === m.text && existing.type === m.type
              );
              if (!exists) {
                updated[pid] = [
                  ...updated[pid],
                  { text: m.text, type: m.type, time: m.time || 'Recently' },
                ];
                changed = true;
              }
            });
            return changed ? updated : prev;
          });
        }
      } catch {
        nextDelay = 8000;
      }
      if (isMounted) {
        timerId = setTimeout(syncLiveMessages, nextDelay);
      }
    };

    timerId = setTimeout(syncLiveMessages, 2000);
    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [isAuthenticated]);

  const filteredMatches = useMemo(() => {
    if (matchFilter === 'liked') {
      return allMatchProfiles.filter((p) => likedIds.includes(p.id.toString()));
    }
    if (matchFilter === 'liked_you') {
      return allMatchProfiles.filter((p) => p.hasLikedMe || whoLikedMeIds.includes(p.id.toString()));
    }
    if (matchFilter === 'top') {
      return allMatchProfiles.filter((p) => p.compatibility >= 93);
    }
    return allMatchProfiles;
  }, [allMatchProfiles, matchFilter, likedIds, whoLikedMeIds]);

  const chatContacts = useMemo(() => {
    return allMatchProfiles.filter((c) =>
      c.name.toLowerCase().includes(chatSearch.toLowerCase())
    );
  }, [allMatchProfiles, chatSearch]);

  const activeChatPartner = useMemo(() => {
    if (allMatchProfiles.length === 0) return null;
    return (
      allMatchProfiles.find((c) => c.id.toString() === selectedChatId.toString()) ||
      allMatchProfiles[0]
    );
  }, [allMatchProfiles, selectedChatId]);

  // Handle "Check Full Profile" of another user (Requires Payment if not Premium!)
  const handleCheckPartnerProfile = (partner) => {
    if (!isPremiumUser) {
      setPaymentModal({
        open: true,
        reason: `🔒 ${partner.name} ki Full Profile, Contact Info aur Unlimited Chat dekhne ke liye Premium Plan unlock karein!`,
        partner,
      });
      return;
    }
    setInspectedPartner(partner);
  };

  // Request access to view target partner's private social media links
  const handleRequestSocial = async (partner) => {
    const targetId = partner?.id || partner?._id;
    if (!targetId) return;

    try {
      const res = await userApi.requestSocialAccess(targetId);
      showNotice(
        res.message || `Request sent! ${partner.name} ki permission milte hi links unlock hongi. ✨`,
        'success'
      );
      setInspectedPartner((prev) =>
        prev ? { ...prev, socialAccessStatus: 'requested' } : null
      );
      setDiscoverProfiles((prev) =>
        prev.map((p) =>
          p.id === targetId || p._id === targetId
            ? { ...p, socialAccessStatus: 'requested' }
            : p
        )
      );
    } catch (err) {
      showNotice(err.message || 'Could not send access request', 'error');
    }
  };

  // Respond to incoming social access request (Allow or Decline)
  const handleRespondSocialRequest = async (requesterId, action = 'allow') => {
    if (!requesterId) return;
    try {
      const res = await userApi.respondSocialAccess(requesterId, action);
      showNotice(
        res.message || (action === 'allow' ? 'Access granted!' : 'Request declined.'),
        'success'
      );
      // Remove from user's pendingSocialRequests
      if (user && user.pendingSocialRequests) {
        updateUser({
          ...user,
          pendingSocialRequests: user.pendingSocialRequests.filter(
            (r) => (r._id || r.id)?.toString() !== requesterId.toString()
          ),
        });
      }
    } catch (err) {
      showNotice(err.message || 'Action failed', 'error');
    }
  };

  // Photo Upload Handler
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotice('Please select a valid image file (JPG, PNG, WEBP)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64Url = ev.target.result;
      const newPhotos = [
        base64Url,
        ...(profileForm.photos || []).filter((p) => p !== base64Url),
      ].slice(0, 6);

      setProfileForm((prev) => ({
        ...prev,
        avatar: base64Url,
        photos: newPhotos,
      }));

      try {
        const res = await userApi.updateProfile({
          avatar: base64Url,
          photos: newPhotos,
        });
        if (res.data) {
          updateUser(res.data);
          showNotice('Profile photo updated successfully! 📸');
        }
      } catch (err) {
        showNotice(err.message || 'Could not save photo', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  // Save Profile Handler
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await userApi.updateProfile({
        ...profileForm,
        age: Number(profileForm.age) || 18,
        location: {
          city: profileForm.city,
          state: profileForm.state,
          country: 'India',
        },
      });
      if (res.data) {
        updateUser(res.data);
        showNotice('Your profile has been saved to database! ✨');
        setActiveTab('overview');
      }
    } catch (err) {
      showNotice(err.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Save Settings / Preferences Handler
  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await userApi.updateSettings(settingsForm);
      if (res.data) {
        updateUser(res.data);
        showNotice('Settings & preferences updated successfully! ⚙️');
      }
    } catch (err) {
      showNotice(err.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Change Password Handler
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      showNotice('Please enter your current and new password', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showNotice('New password must be at least 6 characters', 'error');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showNotice('New passwords do not match', 'error');
      return;
    }

    setSaving(true);
    try {
      await userApi.updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showNotice('Password changed successfully! 🔒');
    } catch (err) {
      showNotice(err.message || 'Failed to update password', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Like / Unlike Profile Handler
  const handleToggleLike = async (targetProfile) => {
    const pid = targetProfile.id.toString();
    const alreadyLiked = likedIds.includes(pid);

    setLikedIds((prev) =>
      alreadyLiked ? prev.filter((id) => id !== pid) : [...prev, pid]
    );

    try {
      await userApi.likeProfile(pid);
      if (!alreadyLiked) {
        showNotice(`You liked ${targetProfile.name}'s profile! 💖`);
      }
    } catch (err) {
      console.warn('Like toggle warning:', err.message);
    }
  };

  // Send Chat Message Handler (Enforces 5 Free Prompts + No Phone / No Insta ID)
  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    setChatWarning('');
    const text = chatInput.trim();
    if (!text || !activeChatPartner) return;

    // If already used 5 prompts on Free plan, open Payment Modal immediately
    if (!isPremiumUser) {
      if (promptsUsed >= MAX_FREE_PROMPTS) {
        setPaymentModal({
          open: true,
          reason:
            '🔒 Aapke 5 Free Chat Prompts poore ho chuke hain! Aage baat karne aur full profile dekhne ke liye abhi Recharge karein.',
          partner: activeChatPartner,
        });
        return;
      }

      // Enforce anti-contact-sharing filter in Free plan
      const violation = detectRestrictedContactInfo(text);
      if (violation) {
        setPaymentModal({
          open: true,
          reason: `🚫 ${violation}. Free chat me Phone Number ya Social ID send karna strictly band hai. Unlimited chat aur contact number share karne ke liye abhi VIP Plan Recharge karein!`,
          partner: activeChatPartner,
        });
        setChatWarning(violation);
        return;
      }
    }

    const partnerId = activeChatPartner.id.toString();
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Optimistic instant local update
    setChatThreads((prev) => ({
      ...prev,
      [partnerId]: [
        ...(prev[partnerId] || []),
        { text, type: 'sent', time: nowTime },
      ],
    }));
    setChatInput('');
    setSendingMsg(true);

    // 2. Real-time direct socket emission
    if (sendChatMessage) {
      sendChatMessage({
        recipientId: partnerId,
        text,
        time: nowTime,
        senderName: user?.name,
        senderAvatar: profileForm.avatar,
      });
    }

    try {
      const res = await userApi.sendMessage({
        partnerId,
        partnerName: activeChatPartner.name,
        text,
      });

      if (res.data) {
        const replyMsg = res.data.reply;
        const updatedUsed = res.data.freePromptsUsed ?? promptsUsed + 1;
        setStats((prev) => ({
          ...prev,
          freePromptsUsed: updatedUsed,
          freePromptsRemaining: isPremiumUser
            ? 9999
            : Math.max(0, MAX_FREE_PROMPTS - updatedUsed),
        }));

        if (replyMsg) {
          setTimeout(() => {
            setChatThreads((prev) => ({
              ...prev,
              [partnerId]: [
                ...(prev[partnerId] || []),
                { text: replyMsg.text, type: 'received', time: replyMsg.time || 'Now' },
              ],
            }));
          }, 500);
        }

        // As soon as 5th prompt is sent by a free user, open Payment Modal!
        if (!isPremiumUser && updatedUsed >= MAX_FREE_PROMPTS) {
          setTimeout(() => {
            setPaymentModal({
              open: true,
              reason:
                '🎉 Aapke 5 Free Prompts complete ho gaye! Unlimited Chat jaari rakhne aur ek dusre ki Full Profile check karne ke liye abhi Payment unlock karein.',
              partner: activeChatPartner,
            });
          }, 900);
        }
      }
    } catch (err) {
      setChatWarning(err.message);
      showNotice(err.message, 'error');
      if (err.requiresPayment) {
        setPaymentModal({
          open: true,
          reason: err.message,
          partner: activeChatPartner,
        });
      }
    } finally {
      setSendingMsg(false);
    }
  };

  // Complete Payment Handler (Saves to MongoDB Payment Collection & Unlocks Everything!)
  const handleCompletePayment = async (e) => {
    e.preventDefault();
    const chosenPlan =
      PAYMENT_PLANS.find((p) => p.id === selectedPlanId) || PAYMENT_PLANS[1];

    setProcessingPayment(true);
    try {
      const res = await userApi.createPayment({
        planId: chosenPlan.id,
        planName: chosenPlan.name,
        amount: chosenPlan.price,
        paymentMethod,
        paymentReference: paymentRef || `${user?.phone || 'user'}@ybl`,
        unlockedPartnerId: paymentModal.partner?.id || activeChatPartner?.id || '',
        unlockedPartnerName: paymentModal.partner?.name || activeChatPartner?.name || '',
      });

      if (res.data) {
        if (res.data.user) {
          updateUser(res.data.user);
        }
        if (res.data.payment) {
          setPaymentsHistory((prev) => [res.data.payment, ...prev]);
        }
        setStats((prev) => ({
          ...prev,
          isPremium: true,
          freePromptsRemaining: 9999,
        }));
        setChatWarning('');
        const partnerToOpen = paymentModal.partner;
        setPaymentModal({ open: false, reason: '', partner: null });
        showNotice(
          `🎉 Payment of ₹${chosenPlan.price} Successful! Unlimited Chat & Full Profile Check Unlocked!`
        );

        // If user clicked "Check Full Profile", open that partner's profile right away!
        if (partnerToOpen) {
          setInspectedPartner(partnerToOpen);
        }
      }
    } catch (err) {
      showNotice(err.message || 'Payment failed, please try again', 'error');
    } finally {
      setProcessingPayment(false);
    }
  };

  const toggleInterest = (interest) => {
    setProfileForm((prev) => {
      const exists = prev.interests.includes(interest);
      if (exists) {
        return { ...prev, interests: prev.interests.filter((i) => i !== interest) };
      }
      if (prev.interests.length >= 8) {
        showNotice('You can select up to 8 interests', 'error');
        return prev;
      }
      return { ...prev, interests: [...prev.interests, interest] };
    });
  };

  if (!isAuthenticated || !user) {
    return (
      <>
        <Header activePage="profile" />
        <main className="profile-guest-wrap wrap">
          <div className="profile-guest-card">
            <span className="guest-icon">🔐</span>
            <h1>Sign In to View Your Profile Dashboard</h1>
            <p>
              Log in with your mobile OTP or password to access your personal profile, live chats,
              curated matches, partner preferences, and privacy settings.
            </p>
            <button type="button" className="coral-button" onClick={openLogin}>
              Log In to My Account →
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const NAV_SECTIONS = [
    { id: 'overview', img: '/love-mom.png', label: 'My Profile', badge: null },
    { id: 'edit', img: '/love-calendar.png', label: 'Edit Profile', badge: null },
    {
      id: 'chats',
      img: '/self-love.png',
      label: 'Chats & Messages',
      badge: isPremiumUser ? 'VIP' : `${promptsRemaining}/5`,
    },
    {
      id: 'matches',
      img: '/heart-love.png',
      label: 'Matches & Likes',
      badge: allMatchProfiles.length,
    },
    { id: 'preferences', img: '/heart-love.png', label: 'Partner Preferences', badge: null },
    { id: 'settings', img: '/love-lock.png', label: 'Settings & Privacy', badge: null },
  ];

  return (
    <>
      <Header activePage="profile" />

      <main className="user-dashboard-page">
        {toast.message && (
          <div className={`dashboard-toast ${toast.type}`}>
            <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
            <p>{toast.message}</p>
          </div>
        )}

        <div className="dashboard-container wrap">
          {/* ============================================================ */}
          {/* LEFT SIDEBAR: USER CARD & MULTI-SECTION MENU                */}
          {/* ============================================================ */}
          <aside className="dashboard-sidebar">
            <div className="sidebar-user-card">
              <div className="sidebar-avatar-wrap">
                <AvatarOrInitials
                  name={user?.name || 'User'}
                  avatar={profileForm.avatar}
                  className="sidebar-avatar-img"
                  style={{ fontSize: '1.8rem' }}
                />
                <label className="sidebar-photo-edit-btn" title="Change Profile Photo">
                  📷
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    style={{ display: 'none' }}
                  />
                </label>
                {settingsForm.showOnlineStatus && <span className="online-dot-indicator" />}
              </div>

              <h2 className="sidebar-user-name">
                {user?.name || 'User'}, <span>{user?.age || 24}</span>
              </h2>
              <p className="sidebar-user-location">
                📍 {user.location?.city || 'Delhi'}, {user.location?.country || 'India'}
              </p>

              <div className="sidebar-badges">
                <span className="v-badge">🛡️ Verified</span>
                {isPremiumUser ? (
                  <span className="vip-gold-badge">💎 VIP Premium</span>
                ) : (
                  <span className="r-badge">
                    🎁 {promptsRemaining}/5 Free Prompts
                  </span>
                )}
              </div>

              {!isPremiumUser && (
                <button
                  type="button"
                  className="sidebar-upgrade-btn"
                  onClick={() =>
                    setPaymentModal({
                      open: true,
                      reason: '💎 Upgrade to VIP Premium for Unlimited Chat & Full Profile Access!',
                      partner: activeChatPartner,
                    })
                  }
                >
                  💎 Unlock Unlimited Chat &amp; Profiles
                </button>
              )}

              <div className="completion-box" style={{ marginTop: '10px' }}>
                <div className="completion-row">
                  <span>Profile Strength</span>
                  <strong>{stats.completionPercent}%</strong>
                </div>
                <div className="completion-bar">
                  <div
                    className="completion-fill"
                    style={{ width: `${stats.completionPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <nav className="sidebar-nav-menu" aria-label="Profile Sections">
              {NAV_SECTIONS.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  className={`sidebar-nav-item ${activeTab === sec.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(sec.id)}
                >
                  <img
                    src={sec.img}
                    alt=""
                    style={{ width: '24px', height: '24px', objectFit: 'contain', flexShrink: 0 }}
                  />
                  <span className="nav-item-label">{sec.label}</span>
                  {sec.badge !== null && <span className="nav-item-badge">{sec.badge}</span>}
                </button>
              ))}

              <button
                type="button"
                className="sidebar-nav-item logout-item"
                onClick={logout}
              >
                <span className="nav-item-icon">🚪</span>
                <span className="nav-item-label">Log Out</span>
              </button>
            </nav>
          </aside>

          {/* ============================================================ */}
          {/* RIGHT CONTENT AREA: ACTIVE SECTION                          */}
          {/* ============================================================ */}
          <section className="dashboard-main-content">
            <div className="mobile-section-tabs">
              {NAV_SECTIONS.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  className={`mobile-tab-pill ${activeTab === sec.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(sec.id)}
                >
                  <img
                    src={sec.img}
                    alt=""
                    style={{ width: '18px', height: '18px', objectFit: 'contain' }}
                  />{' '}
                  {sec.label}
                </button>
              ))}
            </div>

            {/* ------------------------------------------------------------ */}
            {/* SECTION 1: MY PROFILE OVERVIEW                              */}
            {/* ------------------------------------------------------------ */}
            {activeTab === 'overview' && (
              <div className="dashboard-section fade-in">
                <div className="profile-overview-banner">
                  <div className="banner-overlay-content">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <img
                        src="/self-love.png"
                        alt=""
                        style={{
                          width: '68px',
                          height: '68px',
                          objectFit: 'contain',
                          background: 'rgba(255,255,255,0.16)',
                          borderRadius: '20px',
                          padding: '6px',
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <span className="welcome-tag">
                          {isPremiumUser
                            ? '💎 LOVEKARO VIP PREMIUM MEMBER'
                            : `🎁 FREE PLAN (${promptsRemaining}/5 CHAT PROMPTS REMAINING)`}
                        </span>
                        <h1>Namaste, {(user?.name || 'Member').split(' ')[0]}! 💖</h1>
                        <p>
                          {isPremiumUser
                            ? 'You have full unlimited chat access and 100% profile viewing unlocked!'
                            : 'You have 5 free chat prompts. Phone numbers & Instagram IDs are restricted until you unlock Premium.'}
                        </p>
                      </div>
                    </div>
                    <div className="banner-quick-btns">
                      {!isPremiumUser && (
                        <button
                          type="button"
                          className="banner-btn primary"
                          onClick={() =>
                            setPaymentModal({
                              open: true,
                              reason:
                                '💎 Unlock Unlimited Chat & Check Full Profiles of All Matches!',
                              partner: activeChatPartner,
                            })
                          }
                        >
                          💎 Upgrade to Premium
                        </button>
                      )}
                      <button
                        type="button"
                        className="banner-btn secondary"
                        onClick={() => setActiveTab('chats')}
                      >
                        💬 Open Chats
                      </button>
                    </div>
                  </div>
                </div>

                <div className="dashboard-stats-grid">
                  <div className="stat-box" onClick={() => setActiveTab('matches')}>
                    <img
                      src="/love-mom.png"
                      alt="Views"
                      style={{
                        width: '48px',
                        height: '48px',
                        objectFit: 'contain',
                        background: '#fff0f4',
                        padding: '6px',
                        borderRadius: '14px',
                      }}
                    />
                    <div>
                      <strong>{stats.profileViews}</strong>
                      <p>Profile Views</p>
                    </div>
                  </div>
                  <div
                    className="stat-box"
                    onClick={() => {
                      setActiveTab('matches');
                      setMatchFilter('liked_you');
                    }}
                    title="View users who liked your profile"
                  >
                    <img
                      src="/heart-love.png"
                      alt="Liked You"
                      style={{
                        width: '48px',
                        height: '48px',
                        objectFit: 'contain',
                        background: '#ffe4ea',
                        padding: '6px',
                        borderRadius: '14px',
                      }}
                    />
                    <div>
                      <strong>{whoLikedMeIds.length || stats.likesReceived || 0}</strong>
                      <p>💖 Liked You</p>
                    </div>
                  </div>
                  <div className="stat-box" onClick={() => setActiveTab('matches')}>
                    <img
                      src="/heart-love.png"
                      alt="Liked"
                      style={{
                        width: '48px',
                        height: '48px',
                        objectFit: 'contain',
                        background: '#fff0f4',
                        padding: '6px',
                        borderRadius: '14px',
                      }}
                    />
                    <div>
                      <strong>{likedIds.length || stats.likesSent}</strong>
                      <p>Profiles Liked</p>
                    </div>
                  </div>
                  <div className="stat-box" onClick={() => setActiveTab('matches')}>
                    <img
                      src="/self-love.png"
                      alt="Matches"
                      style={{
                        width: '48px',
                        height: '48px',
                        objectFit: 'contain',
                        background: '#fff0f4',
                        padding: '6px',
                        borderRadius: '14px',
                      }}
                    />
                    <div>
                      <strong>{allMatchProfiles.length}</strong>
                      <p>Compatible Matches</p>
                    </div>
                  </div>
                  <div className="stat-box" onClick={() => setActiveTab('chats')}>
                    <img
                      src={isPremiumUser ? '/love-calendar.png' : '/love-lock.png'}
                      alt="Chat Quota"
                      style={{
                        width: '48px',
                        height: '48px',
                        objectFit: 'contain',
                        background: '#fff0f4',
                        padding: '6px',
                        borderRadius: '14px',
                      }}
                    />
                    <div>
                      <strong>{isPremiumUser ? 'Unlimited' : `${promptsRemaining}/5`}</strong>
                      <p>{isPremiumUser ? 'VIP Chat Pass' : 'Free Prompts Left'}</p>
                    </div>
                  </div>
                </div>

                {/* PENDING SOCIAL ACCESS REQUESTS CARD */}
                {user.pendingSocialRequests && user.pendingSocialRequests.length > 0 && (
                  <div className="content-card pending-social-card" style={{ marginBottom: '1.25rem', border: '1.5px solid #fda4af', background: '#fff5f7' }}>
                    <div className="section-title-block" style={{ marginBottom: '0.85rem' }}>
                      <h3 style={{ color: '#e11d48', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '1.05rem' }}>
                        🔑 Social Media Access Requests ({user.pendingSocialRequests.length})
                      </h3>
                      <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#64748b' }}>
                        In members ne aapke Social Media links dekhne ki permission mangi hai. Allow karne par hi unhe aapke links dikhenge.
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {user.pendingSocialRequests.map((reqUser) => (
                        <div
                          key={reqUser._id || reqUser.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            background: '#ffffff',
                            borderRadius: '12px',
                            border: '1px solid #fecdd3',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <AvatarOrInitials
                              name={reqUser.name}
                              avatar={reqUser.avatar}
                              style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                            <div>
                              <strong style={{ fontSize: '0.92rem', color: '#1e293b' }}>{reqUser.name}, {reqUser.age} yrs</strong>
                              <small style={{ display: 'block', color: '#64748b', fontSize: '0.78rem' }}>
                                📍 {reqUser.city || reqUser.location?.city || 'Delhi NCR'}
                              </small>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              className="save-primary-btn"
                              style={{ padding: '6px 14px', fontSize: '0.82rem', borderRadius: '20px' }}
                              onClick={() => handleRespondSocialRequest(reqUser._id || reqUser.id, 'allow')}
                            >
                              ✓ Allow
                            </button>
                            <button
                              type="button"
                              className="cancel-btn"
                              style={{ padding: '6px 12px', fontSize: '0.82rem', borderRadius: '20px' }}
                              onClick={() => handleRespondSocialRequest(reqUser._id || reqUser.id, 'decline')}
                            >
                              ✕ Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Opposite-Gender Recommended Profiles on Overview */}
                <div className="content-card">
                  <div className="card-header-row">
                    <div>
                      <h3>
                        💖 Recommended{' '}
                        {user.gender === 'male'
                          ? 'Women (Female)'
                          : user.gender === 'female'
                          ? 'Men (Male)'
                          : 'Compatible'}{' '}
                        Profiles For You ({allMatchProfiles.length})
                      </h3>
                      <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#64748b' }}>
                        {user.gender === 'male'
                          ? '✨ Since you registered as a Man, we have curated verified Women profiles with photos for you.'
                          : user.gender === 'female'
                          ? '✨ Since you registered as a Woman, we have curated verified Men profiles with photos for you.'
                          : '✨ Verified profiles curated from the database for you.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="text-action-btn"
                      onClick={() => setActiveTab('matches')}
                    >
                      View All {allMatchProfiles.length} Matches →
                    </button>
                  </div>

                  {allMatchProfiles.length === 0 ? (
                    <div
                      style={{
                        marginTop: '14px',
                        padding: '28px 20px',
                        background: '#fff8fa',
                        borderRadius: '16px',
                        border: '1px dashed #f3c6d5',
                        textAlign: 'center',
                        color: '#64748b',
                      }}
                    >
                      <strong style={{ display: 'block', color: '#be185d', marginBottom: '6px' }}>
                        100% Real Database Profiles Active
                      </strong>
                      Abhi database me koi real{' '}
                      {user.gender === 'male'
                        ? 'Woman (Female)'
                        : user.gender === 'female'
                        ? 'Man (Male)'
                        : 'opposite-gender'}{' '}
                      user signup nahi hua hai. Jaise hi naya user signup karega, unki real profile
                      with photo yahan automatically show hogi!
                    </div>
                  ) : (
                  <div className="dash-matches-grid" style={{ marginTop: '14px' }}>
                    {allMatchProfiles.slice(0, 3).map((person) => {
                      const isLiked = likedIds.includes(person.id.toString());
                      return (
                        <div key={person.id} className="dash-match-card">
                          <div className="dash-match-img-wrap">
                            <img
                              src={person.avatar}
                              alt={person.name}
                              style={{
                                width: '100%',
                                height: '220px',
                                objectFit: 'cover',
                                objectPosition: 'center 18%',
                                display: 'block',
                              }}
                            />
                            <span className="match-fit-tag">
                              ✦ {person.compatibility}% Match
                            </span>
                            {person.hasLikedMe && (
                              <span className="match-liked-you-badge">💖 Liked You!</span>
                            )}
                            {person.online && <span className="match-online-badge">Online</span>}
                          </div>

                          <div className="dash-match-body">
                            <div className="dash-match-title">
                              <h4>
                                {person.name}, {person.age}
                              </h4>
                              <span>📍 {person.city}</span>
                            </div>

                            <div className="dash-match-meta">
                              <span>🕉️ {person.religion}</span>
                              <span>🗣️ {person.motherTongue}</span>
                              <span>💼 {person.occupation}</span>
                            </div>

                            <p className="dash-match-bio">{person.bio}</p>

                            <div className="dash-match-actions">
                              <button
                                type="button"
                                className={`match-like-btn ${isLiked ? 'liked' : ''}`}
                                onClick={() => handleToggleLike(person)}
                              >
                                {isLiked ? '💖 Liked' : '🤍 Like'}
                              </button>
                              <button
                                type="button"
                                className="match-chat-btn"
                                onClick={() => {
                                  setSelectedChatId(person.id);
                                  setActiveTab('chats');
                                }}
                              >
                                💬 Chat
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  )}
                </div>

                {/* About Me Card */}
                <div className="content-card">
                  <div className="card-header-row">
                    <h3>📝 About Me ("Mera Parichay")</h3>
                    <button
                      type="button"
                      className="text-action-btn"
                      onClick={() => setActiveTab('edit')}
                    >
                      Edit Bio →
                    </button>
                  </div>
                  <p className="overview-bio-text">
                    {user.bio
                      ? `"${user.bio}"`
                      : 'Tell matches about your personality, hobbies, family values, and what kind of partner you are looking for.'}
                  </p>
                </div>

                {/* Personal, Matrimonial & Lifestyle Details Grid */}
                <div className="content-card">
                  <div className="card-header-row">
                    <h3>🪪 Personal &amp; Matrimonial Details</h3>
                    <button
                      type="button"
                      className="text-action-btn"
                      onClick={() => setActiveTab('edit')}
                    >
                      Update Details →
                    </button>
                  </div>

                  <div className="info-details-grid">
                    <div className="info-item">
                      <span>Full Name</span>
                      <strong>{user?.name || 'Member'}</strong>
                    </div>
                    <div className="info-item">
                      <span>Age &amp; DOB</span>
                      <strong>
                        {user?.age || 24} Years ({profileForm.dob})
                      </strong>
                    </div>
                    <div className="info-item">
                      <span>Gender</span>
                      <strong style={{ textTransform: 'capitalize' }}>{user?.gender || 'Not specified'}</strong>
                    </div>
                    <div className="info-item">
                      <span>Membership Plan</span>
                      <strong style={{ color: isPremiumUser ? '#047857' : '#c83e58' }}>
                        {isPremiumUser ? `💎 ${user?.premiumPlan || 'VIP Premium'}` : 'Free Plan (5 Prompts)'}
                      </strong>
                    </div>
                    <div className="info-item">
                      <span>Marital Status</span>
                      <strong>💍 {user?.maritalStatus || 'Never Married'}</strong>
                    </div>
                    <div className="info-item">
                      <span>Religion / Faith</span>
                      <strong>🕉️ {user?.religion || 'Hindu'}</strong>
                    </div>
                    <div className="info-item">
                      <span>Mother Tongue</span>
                      <strong>🗣️ {user?.motherTongue || 'Hindi'}</strong>
                    </div>
                    <div className="info-item">
                      <span>Location</span>
                      <strong>
                        📍 {user?.location?.city || 'Delhi'}, {user?.location?.country || 'India'}
                      </strong>
                    </div>
                    <div className="info-item">
                      <span>Profession / Job</span>
                      <strong>💼 {user?.occupation || 'Not specified'}</strong>
                    </div>
                    <div className="info-item">
                      <span>Education</span>
                      <strong>🎓 {user?.education || 'Not specified'}</strong>
                    </div>
                    <div className="info-item">
                      <span>Mobile Number</span>
                      <strong>📱 +91 {user?.phone || '98XXXXXXXX'} (Verified)</strong>
                    </div>
                    <div className="info-item">
                      <span>Email Address</span>
                      <strong>✉️ {user?.email || 'user@lovekaro.com'}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* SECTION 2: EDIT PROFILE                                      */}
            {/* ------------------------------------------------------------ */}
            {activeTab === 'edit' && (
              <div className="dashboard-section fade-in">
                <div className="content-card">
                  <div className="section-title-block">
                    <h2>✏️ Edit Your Profile</h2>
                    <p>
                      Keep your profile updated to attract the most compatible matches on LoveKaro.
                    </p>
                  </div>

                  <form onSubmit={handleSaveProfile} className="dashboard-form">
                    <div className="edit-avatar-banner">
                      <AvatarOrInitials
                        name={profileForm.name || user.name}
                        avatar={profileForm.avatar}
                        className="edit-avatar-preview"
                        style={{ fontSize: '1.5rem' }}
                      />
                      <div>
                        <h4>Profile Picture</h4>
                        <p>Upload a clear, smiling photo of yourself (JPG, PNG, WEBP under 5MB).</p>
                        <label className="upload-photo-btn">
                          📷 Upload New Photo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            style={{ display: 'none' }}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="form-grid-2">
                      <div className="dash-form-group">
                        <label>Full Name *</label>
                        <input
                          type="text"
                          value={profileForm.name}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, name: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div className="dash-form-group">
                        <label>Age (Years) *</label>
                        <input
                          type="number"
                          min="18"
                          max="99"
                          value={profileForm.age}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, age: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div className="dash-form-group">
                        <label>Date of Birth</label>
                        <input
                          type="date"
                          value={profileForm.dob}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, dob: e.target.value })
                          }
                        />
                      </div>

                      <div className="dash-form-group">
                        <label>Gender</label>
                        <select
                          value={profileForm.gender}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, gender: e.target.value })
                          }
                        >
                          <option value="female">Woman</option>
                          <option value="male">Man</option>
                          <option value="other">Non-Binary / Other</option>
                        </select>
                      </div>

                      <div className="dash-form-group">
                        <label>Marital Status</label>
                        <select
                          value={profileForm.maritalStatus}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, maritalStatus: e.target.value })
                          }
                        >
                          {[
                            'Never Married',
                            'Divorced',
                            'Widowed',
                            'Awaiting Divorce',
                            'Other',
                          ].map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="dash-form-group">
                        <label>Religion / Faith</label>
                        <select
                          value={profileForm.religion}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, religion: e.target.value })
                          }
                        >
                          {[
                            'Hindu',
                            'Muslim',
                            'Sikh',
                            'Christian',
                            'Jain',
                            'Buddhist',
                            'Parsi',
                            'Spiritual',
                            'Other',
                          ].map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="dash-form-group">
                        <label>Mother Tongue</label>
                        <input
                          type="text"
                          value={profileForm.motherTongue}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, motherTongue: e.target.value })
                          }
                        />
                      </div>

                      <div className="dash-form-group">
                        <label>City</label>
                        <input
                          type="text"
                          value={profileForm.city}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, city: e.target.value })
                          }
                        />
                      </div>

                      <div className="dash-form-group">
                        <label>Occupation / Profession</label>
                        <input
                          type="text"
                          value={profileForm.occupation}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, occupation: e.target.value })
                          }
                        />
                      </div>

                      <div className="dash-form-group">
                        <label>Education</label>
                        <input
                          type="text"
                          value={profileForm.education}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, education: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="dash-form-group full-width">
                      <label>About Me / Detailed Bio</label>
                      <textarea
                        rows="4"
                        value={profileForm.bio}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, bio: e.target.value })
                        }
                      />
                    </div>

                    <div className="dash-form-group full-width">
                      <label>Select Your Interests (Up to 8)</label>
                      <div className="edit-interests-cloud">
                        {ALL_INTERESTS.map((item) => {
                          const active = profileForm.interests.includes(item);
                          return (
                            <button
                              type="button"
                              key={item}
                              className={`edit-interest-tag ${active ? 'active' : ''}`}
                              onClick={() => toggleInterest(item)}
                            >
                              {active ? '✓ ' : '+ '} {item}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="dash-form-group full-width" style={{ marginTop: '0.75rem', padding: '16px', background: '#fdf2f4', borderRadius: '16px', border: '1px solid #fecdd3' }}>
                      <div style={{ marginBottom: '14px' }}>
                        <h4 style={{ margin: '0 0 4px', color: '#e11d48', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          🌐 Add Social Media Links (Protected &amp; Verified Access)
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                          🛡️ <strong>Privacy Protection:</strong> Yeh links doosre users ke liye default roop se locked rehti hain.
                          Jab koi user aapse permission mangega aur aap allow karenge, tabhi unhe link show hogi.
                        </p>
                      </div>

                      <div className="form-grid-2">
                        <div className="dash-form-group">
                          <label>📸 Instagram Handle / Link</label>
                          <input
                            type="text"
                            placeholder="@your_handle ya instagram.com/handle"
                            value={profileForm.socialLinks?.instagram || ''}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                socialLinks: {
                                  ...(profileForm.socialLinks || {}),
                                  instagram: e.target.value,
                                },
                              })
                            }
                          />
                        </div>

                        <div className="dash-form-group">
                          <label>👥 Facebook Profile Link</label>
                          <input
                            type="text"
                            placeholder="facebook.com/your_profile"
                            value={profileForm.socialLinks?.facebook || ''}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                socialLinks: {
                                  ...(profileForm.socialLinks || {}),
                                  facebook: e.target.value,
                                },
                              })
                            }
                          />
                        </div>

                        <div className="dash-form-group">
                          <label>💼 LinkedIn Profile Link</label>
                          <input
                            type="text"
                            placeholder="linkedin.com/in/your_profile"
                            value={profileForm.socialLinks?.linkedin || ''}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                socialLinks: {
                                  ...(profileForm.socialLinks || {}),
                                  linkedin: e.target.value,
                                },
                              })
                            }
                          />
                        </div>

                        <div className="dash-form-group">
                          <label>🐦 Twitter / X Profile Link</label>
                          <input
                            type="text"
                            placeholder="@handle ya x.com/handle"
                            value={profileForm.socialLinks?.twitter || ''}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                socialLinks: {
                                  ...(profileForm.socialLinks || {}),
                                  twitter: e.target.value,
                                },
                              })
                            }
                          />
                        </div>

                        <div className="dash-form-group full-width">
                          <label>📺 YouTube Channel Link</label>
                          <input
                            type="text"
                            placeholder="youtube.com/@channel"
                            value={profileForm.socialLinks?.youtube || ''}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                socialLinks: {
                                  ...(profileForm.socialLinks || {}),
                                  youtube: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-submit-bar">
                      <button
                        type="button"
                        className="cancel-btn"
                        onClick={() => setActiveTab('overview')}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="save-primary-btn" disabled={saving}>
                        {saving ? 'Saving Changes...' : 'Save Profile Changes 💾'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* SECTION 3: CHATS & MESSAGES (5 PROMPTS + CONTACT FILTER)     */}
            {/* ------------------------------------------------------------ */}
            {activeTab === 'chats' && (
              <div className="dashboard-section fade-in">
                {/* Free vs Premium Chat Quota Status Banner */}
                <div className={`chat-quota-banner ${isPremiumUser ? 'vip' : ''}`}>
                  <div>
                    {isPremiumUser ? (
                      <>
                        <strong>💎 VIP Premium Chat Active ({user.premiumPlan})</strong>
                        <p>
                          Unlimited messages, contact sharing, and full partner profile checks are
                          unlocked!
                        </p>
                      </>
                    ) : (
                      <>
                        <strong>
                          🎁 Free Trial Chat: {promptsUsed} / {MAX_FREE_PROMPTS} Prompts Used (
                          {promptsRemaining} Remaining)
                        </strong>
                        <p>
                          🚫 Note: Mobile Numbers, Instagram IDs (@handle), or social links cannot
                          be sent in Free Chat. After 5 prompts, unlock Premium to continue!
                        </p>
                      </>
                    )}
                  </div>
                  {!isPremiumUser && (
                    <button
                      type="button"
                      className="unlock-chat-cta-btn"
                      onClick={() =>
                        setPaymentModal({
                          open: true,
                          reason:
                            '💎 Upgrade to Premium to Chat Unlimited, Share Contact Details & View Full Profiles!',
                          partner: activeChatPartner,
                        })
                      }
                    >
                      🔓 Unlock Unlimited (₹199+)
                    </button>
                  )}
                </div>

                {chatWarning && (
                  <div className="chat-violation-alert">
                    <span>{chatWarning}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setPaymentModal({
                          open: true,
                          reason: chatWarning,
                          partner: activeChatPartner,
                        })
                      }
                    >
                      Unlock Now 💳
                    </button>
                  </div>
                )}

                <div className={`dashboard-chat-shell mobile-chat-view-${mobileChatView}`}>
                  {/* Left: Conversation List */}
                  <div className="dash-chat-sidebar">
                    <div className="dash-chat-header">
                      <h3>💬 Messages</h3>
                      <span className="chat-count-pill">{chatContacts.length}</span>
                    </div>

                    <div className="dash-chat-search">
                      <input
                        type="text"
                        placeholder="Search matches..."
                        value={chatSearch}
                        onChange={(e) => setChatSearch(e.target.value)}
                      />
                    </div>

                    <div className="dash-chat-contacts">
                      {chatContacts.length === 0 ? (
                        <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.86rem' }}>
                          Abhi database me koi dusra user register nahi hua hai. Jaise hi naya user join karega, yahan live show hoga!
                        </div>
                      ) : (
                        chatContacts.map((person) => {
                          const isSelected =
                            person.id.toString() === activeChatPartner?.id?.toString();
                          const thread = chatThreads[person.id] || [];
                          const lastMsg =
                            thread[thread.length - 1]?.text || 'Tap to start chatting 👋';
                          return (
                            <button
                              type="button"
                              key={person.id}
                              className={`dash-contact-item ${isSelected ? 'selected' : ''}`}
                              onClick={() => {
                                setSelectedChatId(person.id);
                                setMobileChatView('chat');
                              }}
                            >
                              <div className="contact-avatar-box">
                                <AvatarOrInitials
                                  name={person.name}
                                  avatar={person.avatar}
                                  style={{ width: '44px', height: '44px', fontSize: '0.9rem' }}
                                />
                                {person.online && <span className="contact-online-dot" />}
                              </div>
                              <div className="contact-meta">
                                <div className="contact-top-row">
                                  <strong>{person.name}</strong>
                                  <small>{person.compatibility}% fit</small>
                                </div>
                                <p>{lastMsg}</p>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Right: Active Conversation Window */}
                  <div className="dash-chat-window">
                    {!activeChatPartner ? (
                      <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#64748b' }}>
                        <h3>💬 Real-Time Database Chat</h3>
                        <p>
                          Database me jaise hi dusre users register karenge, aap unke sath real-time
                          chat kar sakenge!
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="dash-chat-window-head">
                          <button
                            type="button"
                            className="mobile-chat-back-btn"
                            onClick={() => setMobileChatView('list')}
                            aria-label="Back to contacts list"
                          >
                            ←
                          </button>
                          <div className="window-partner-info">
                            <AvatarOrInitials
                              name={activeChatPartner.name}
                              avatar={activeChatPartner.avatar}
                              className="window-partner-avatar"
                              style={{ width: '46px', height: '46px', fontSize: '0.95rem' }}
                            />
                            <div>
                              <h4>
                                {activeChatPartner.name}, {activeChatPartner.age}
                              </h4>
                              <span>
                                {activeChatPartner.online ? '● Online now' : '● Active recently'} • 📍{' '}
                                {activeChatPartner.city}
                              </span>
                            </div>
                          </div>
                          <div className="window-head-badges">
                            <button
                              type="button"
                              className="check-profile-head-btn"
                              onClick={() => handleCheckPartnerProfile(activeChatPartner)}
                            >
                              {isPremiumUser ? '👁️ Check Full Profile' : '🔒 Check Full Profile'}
                            </button>
                          </div>
                        </div>

                        {/* Icebreaker Quick Prompts */}
                        <div className="dash-icebreakers-bar">
                          <span>Quick Starters:</span>
                          <div className="icebreaker-scroll">
                            {ICEBREAKERS.map((prompt) => (
                              <button
                                key={prompt}
                                type="button"
                                onClick={() => setChatInput(prompt)}
                              >
                                {prompt}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Messages Feed */}
                        <div className="dash-chat-messages">
                          <div className="chat-day-divider">
                            <span>💬 Real-Time Live Chat</span>
                          </div>
                          {(chatThreads[activeChatPartner.id] || []).length === 0 ? (
                            <div className="chat-empty-state">
                              <span className="empty-chat-icon">💌</span>
                              <h4>Say hello to {activeChatPartner.name}!</h4>
                              <p>Neeche message likhein ya quick starters tap karke live chat start karein.</p>
                            </div>
                          ) : (
                            (chatThreads[activeChatPartner.id] || []).map((msg, i) => {
                              const isSent = msg.type === 'sent';
                              return (
                                <div
                                  key={i}
                                  className={`dash-msg-row ${isSent ? 'dash-sent-row' : 'dash-received-row'}`}
                                >
                                  <div className={`modern-chat-bubble ${isSent ? 'bubble-sent' : 'bubble-received'}`}>
                                    {!isSent && (
                                      <div className="bubble-sender-name">
                                        {activeChatPartner.name}
                                      </div>
                                    )}
                                    <div className="bubble-text">{msg.text}</div>
                                    <div className="bubble-meta">
                                      <span className="bubble-time">{msg.time}</span>
                                      {isSent && <span className="bubble-ticks">✓✓</span>}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}

                          {/* Inline Lock Card when 5 prompts reached */}
                          {!isPremiumUser && promptsUsed >= MAX_FREE_PROMPTS && (
                            <div className="chat-locked-inline-card">
                              <h4>🔒 5 Free Prompts Completed!</h4>
                              <p>
                                Aapne apne 5 free messages use kar liye hain.{' '}
                                <strong>{activeChatPartner.name}</strong> ke sath aage unlimited baat
                                karne aur unki full profile check karne ke liye abhi Recharge karein.
                              </p>
                              <button
                                type="button"
                                className="save-primary-btn"
                                onClick={() =>
                                  setPaymentModal({
                                    open: true,
                                    reason: `Unlock Unlimited Chat & Full Profile of ${activeChatPartner.name}!`,
                                    partner: activeChatPartner,
                                  })
                                }
                              >
                                💳 Recharge VIP &amp; Continue Chatting
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Modern Message Composer */}
                        <div className="dash-composer-wrap">
                          <div className="dash-prompts-chip">
                            {isPremiumUser ? (
                              <span className="chip-vip">💎 VIP Unlimited Member • Share Contact &amp; Social IDs Freely</span>
                            ) : (
                              <span className="chip-free">
                                🎁 Free Messages: <b>{Math.max(0, MAX_FREE_PROMPTS - promptsUsed)} of 5 left</b> • No Phone / Social IDs allowed •{' '}
                                <button
                                  type="button"
                                  className="recharge-text-btn"
                                  onClick={() =>
                                    setPaymentModal({
                                      open: true,
                                      reason: 'Upgrade to VIP for unlimited chat & sharing contact numbers!',
                                      partner: activeChatPartner,
                                    })
                                  }
                                >
                                  Recharge VIP 💎
                                </button>
                              </span>
                            )}
                          </div>

                          <form onSubmit={handleSendChatMessage} className="dash-chat-composer">
                            <div className="emoji-picker-container">
                              <button
                                type="button"
                                className="emoji-trigger-btn"
                                onClick={() => setShowEmojiTray((prev) => !prev)}
                                title="Add emoji"
                              >
                                😊
                              </button>
                              {showEmojiTray && (
                                <div className="emoji-floating-tray">
                                  {['😊', '❤️', '☕', '✨', '👋', '🌹', '😍', '🙏', '🙌', '🎉'].map((emo) => (
                                    <button
                                      key={emo}
                                      type="button"
                                      onClick={() => {
                                        setChatInput((prev) => prev + emo);
                                        setShowEmojiTray(false);
                                      }}
                                    >
                                      {emo}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            <input
                              type="text"
                              className="dash-composer-input"
                              placeholder={
                                !isPremiumUser && promptsUsed >= MAX_FREE_PROMPTS
                                  ? '🔒 5 Free Prompts complete — Click to Recharge...'
                                  : `Message ${(activeChatPartner?.name || 'Match').split(' ')[0]}...`
                              }
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              onClick={() => {
                                if (!isPremiumUser && promptsUsed >= MAX_FREE_PROMPTS) {
                                  setPaymentModal({
                                    open: true,
                                    reason: '🔒 5 Free Chat Prompts poore ho gaye hain! Aage chat karne ke liye abhi Recharge karein.',
                                    partner: activeChatPartner,
                                  });
                                }
                              }}
                              readOnly={!isPremiumUser && promptsUsed >= MAX_FREE_PROMPTS}
                            />

                            <button
                              type="submit"
                              className="dash-send-circle-btn"
                              disabled={sendingMsg}
                              title="Send Message"
                            >
                              {!isPremiumUser && promptsUsed >= MAX_FREE_PROMPTS ? '🔒' : '➤'}
                            </button>
                          </form>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* SECTION 4: MATCHES & LIKES                                   */}
            {/* ------------------------------------------------------------ */}
            {activeTab === 'matches' && (
              <div className="dashboard-section fade-in">
                <div className="content-card">
                  <div className="matches-header-bar">
                    <div>
                      <h2>
                        💖 Compatible{' '}
                        {user.gender === 'male'
                          ? 'Women (Female)'
                          : user.gender === 'female'
                          ? 'Men (Male)'
                          : ''}{' '}
                        Matches &amp; Profile Check
                      </h2>
                      <p>
                        {isPremiumUser
                          ? '💎 Premium Active: You can check full profile & contact details of any match!'
                          : '🔒 Free Plan: Upgrade to Premium to check complete profiles & contact details of matches.'}
                      </p>
                    </div>
                    <div className="matches-filter-pills">
                      <button
                        type="button"
                        className={matchFilter === 'all' ? 'active' : ''}
                        onClick={() => setMatchFilter('all')}
                      >
                        All ({allMatchProfiles.length})
                      </button>
                      <button
                        type="button"
                        className={matchFilter === 'liked_you' ? 'active' : ''}
                        onClick={() => setMatchFilter('liked_you')}
                      >
                        💖 Liked You ({allMatchProfiles.filter((p) => p.hasLikedMe || whoLikedMeIds.includes(p.id.toString())).length})
                      </button>
                      <button
                        type="button"
                        className={matchFilter === 'liked' ? 'active' : ''}
                        onClick={() => setMatchFilter('liked')}
                      >
                        Liked by You ({likedIds.length})
                      </button>
                      <button
                        type="button"
                        className={matchFilter === 'top' ? 'active' : ''}
                        onClick={() => setMatchFilter('top')}
                      >
                        93%+ Top Fit
                      </button>
                    </div>
                  </div>

                  <div className="dash-matches-grid">
                    {filteredMatches.map((person) => {
                      const isLiked = likedIds.includes(person.id.toString());
                      return (
                        <div key={person.id} className="dash-match-card">
                          <div className="dash-match-img-wrap">
                            <img
                              src={person.avatar}
                              alt={person.name}
                              style={{
                                width: '100%',
                                height: '220px',
                                objectFit: 'cover',
                                objectPosition: 'center 18%',
                                display: 'block',
                              }}
                            />
                            <span className="match-fit-tag">
                              ✦ {person.compatibility}% Match
                            </span>
                            {person.hasLikedMe && (
                              <span className="match-liked-you-badge">💖 Liked You!</span>
                            )}
                            {person.online && <span className="match-online-badge">Online</span>}
                          </div>

                          <div className="dash-match-body">
                            <div className="dash-match-title">
                              <h4>
                                {person.name}, {person.age}
                              </h4>
                              <span>📍 {person.city}</span>
                            </div>

                            <div className="dash-match-meta">
                              <span>🕉️ {person.religion}</span>
                              <span>🗣️ {person.motherTongue}</span>
                              <span>💼 {person.occupation}</span>
                            </div>

                            <p className="dash-match-bio">{person.bio}</p>

                            <div className="dash-match-actions">
                              <button
                                type="button"
                                className={`match-like-btn ${isLiked ? 'liked' : ''}`}
                                onClick={() => handleToggleLike(person)}
                              >
                                {isLiked ? '💖 Liked' : '🤍 Like'}
                              </button>
                              <button
                                type="button"
                                className="match-chat-btn"
                                onClick={() => {
                                  setSelectedChatId(person.id);
                                  setActiveTab('chats');
                                }}
                              >
                                💬 Chat
                              </button>
                            </div>
                            <button
                              type="button"
                              className="match-full-profile-btn"
                              onClick={() => handleCheckPartnerProfile(person)}
                            >
                              {isPremiumUser
                                ? '👁️ View Full Profile & Contact'
                                : '🔒 Unlock Full Profile Check'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* SECTION 5: PARTNER PREFERENCES                               */}
            {/* ------------------------------------------------------------ */}
            {activeTab === 'preferences' && (
              <div className="dashboard-section fade-in">
                <div className="content-card">
                  <div className="section-title-block">
                    <h2>🎯 Ideal Partner Preferences</h2>
                    <p>
                      Customize who we recommend to you in Discover and Daily Compatibility Matches.
                    </p>
                  </div>

                  <form onSubmit={handleSaveSettings} className="dashboard-form">
                    <div className="form-grid-2">
                      <div className="dash-form-group">
                        <label>Minimum Preferred Age</label>
                        <input
                          type="number"
                          min="18"
                          max="70"
                          value={settingsForm.partnerPreferences.minAge}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              partnerPreferences: {
                                ...settingsForm.partnerPreferences,
                                minAge: Number(e.target.value),
                              },
                            })
                          }
                        />
                      </div>

                      <div className="dash-form-group">
                        <label>Maximum Preferred Age</label>
                        <input
                          type="number"
                          min="18"
                          max="80"
                          value={settingsForm.partnerPreferences.maxAge}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              partnerPreferences: {
                                ...settingsForm.partnerPreferences,
                                maxAge: Number(e.target.value),
                              },
                            })
                          }
                        />
                      </div>

                      <div className="dash-form-group">
                        <label>Preferred Religion</label>
                        <select
                          value={settingsForm.partnerPreferences.preferredReligion}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              partnerPreferences: {
                                ...settingsForm.partnerPreferences,
                                preferredReligion: e.target.value,
                              },
                            })
                          }
                        >
                          {[
                            'Any',
                            'Hindu',
                            'Muslim',
                            'Sikh',
                            'Christian',
                            'Jain',
                            'Buddhist',
                            'Spiritual',
                          ].map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="dash-form-group">
                        <label>Preferred Mother Tongue</label>
                        <select
                          value={settingsForm.partnerPreferences.preferredMotherTongue}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              partnerPreferences: {
                                ...settingsForm.partnerPreferences,
                                preferredMotherTongue: e.target.value,
                              },
                            })
                          }
                        >
                          {[
                            'Any',
                            'Hindi',
                            'Punjabi',
                            'Bengali',
                            'Marathi',
                            'Gujarati',
                            'Urdu',
                            'Tamil',
                            'Telugu',
                            'English',
                          ].map((l) => (
                            <option key={l} value={l}>
                              {l}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-submit-bar">
                      <button type="submit" className="save-primary-btn" disabled={saving}>
                        {saving ? 'Saving Preferences...' : 'Save Partner Preferences 🎯'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* SECTION 6: SETTINGS, PRIVACY & SECURITY                      */}
            {/* ------------------------------------------------------------ */}
            {activeTab === 'settings' && (
              <div className="dashboard-section fade-in">
                <div className="content-card">
                  <div className="section-title-block">
                    <h2>🛡️ Privacy &amp; Visibility Settings</h2>
                    <p>Control how your profile appears to other members on LoveKaro.</p>
                  </div>

                  <div className="settings-toggles-list">
                    <div className="setting-toggle-row">
                      <div>
                        <h4>Show Online Status</h4>
                        <p>Let matches see when you are actively online on LoveKaro.</p>
                      </div>
                      <label className="switch-toggle">
                        <input
                          type="checkbox"
                          checked={settingsForm.showOnlineStatus}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              showOnlineStatus: e.target.checked,
                            })
                          }
                        />
                        <span className="slider-round" />
                      </label>
                    </div>

                    <div className="setting-toggle-row">
                      <div>
                        <h4>Display Age on Profile</h4>
                        <p>Show your age alongside your name on discovery cards.</p>
                      </div>
                      <label className="switch-toggle">
                        <input
                          type="checkbox"
                          checked={settingsForm.showAge}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              showAge: e.target.checked,
                            })
                          }
                        />
                        <span className="slider-round" />
                      </label>
                    </div>
                  </div>

                  <div className="form-submit-bar">
                    <button
                      type="button"
                      className="save-primary-btn"
                      onClick={handleSaveSettings}
                      disabled={saving}
                    >
                      {saving ? 'Saving Settings...' : 'Save Privacy Settings ⚙️'}
                    </button>
                  </div>
                </div>

                {/* Change Password Card */}
                <div className="content-card">
                  <div className="section-title-block">
                    <h2>🔒 Security &amp; Change Password</h2>
                    <p>Update your account password regularly to keep your profile safe.</p>
                  </div>

                  <form onSubmit={handlePasswordSubmit} className="dashboard-form">
                    <div className="form-grid-3">
                      <div className="dash-form-group">
                        <label>Current Password</label>
                        <input
                          type="password"
                          placeholder="Enter current password"
                          value={passwordForm.currentPassword}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              currentPassword: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="dash-form-group">
                        <label>New Password</label>
                        <input
                          type="password"
                          placeholder="At least 6 characters"
                          value={passwordForm.newPassword}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              newPassword: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="dash-form-group">
                        <label>Confirm New Password</label>
                        <input
                          type="password"
                          placeholder="Re-enter new password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              confirmPassword: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="form-submit-bar">
                      <button type="submit" className="save-primary-btn" disabled={saving}>
                        Update Password 🔐
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ============================================================== */}
        {/* INSTANT PAYMENT & UNLOCK MODAL (GATEWAY READY)                 */}
        {/* ============================================================== */}
        <PaymentModal
          isOpen={paymentModal.open}
          onClose={() => setPaymentModal({ open: false, reason: '', partner: null })}
          reason={paymentModal.reason}
          partner={paymentModal.partner}
          onSuccess={(data) => {
            showNotice('💎 VIP Pass Successfully Activated! Enjoy Unlimited Chat!', 'success');
            setStats((prev) => ({
              ...prev,
              isPremium: true,
              freePromptsRemaining: 9999,
            }));
          }}
        />

        {/* ============================================================== */}
        {/* PARTNER FULL PROFILE MODAL (UNLOCKED AFTER PAYMENT!)           */}
        {/* ============================================================== */}
        {inspectedPartner && (
          <div className="pay-modal-backdrop" onClick={() => setInspectedPartner(null)}>
            <div
              className="pay-modal-card partner-profile-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pay-modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <AvatarOrInitials
                    name={inspectedPartner.name}
                    avatar={inspectedPartner.avatar}
                    style={{
                      width: '68px',
                      height: '68px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid #22c55e',
                      fontSize: '1.4rem',
                    }}
                  />
                  <div>
                    <span className="pay-pill-tag">✅ VIP UNLOCKED FULL PROFILE</span>
                    <h2>
                      {inspectedPartner.name}, {inspectedPartner.age} yrs
                    </h2>
                    <p>
                      📍 {inspectedPartner.city} • ✦ {inspectedPartner.compatibility}% Match Fit
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="pay-close-btn"
                  onClick={() => setInspectedPartner(null)}
                >
                  ✕
                </button>
              </div>

              <div className="pay-modal-body">
                <div className="info-details-grid" style={{ marginBottom: '1.25rem' }}>
                  <div className="info-item">
                    <span>Verified Mobile (Privacy Protected)</span>
                    <strong style={{ color: '#e11d48' }}>
                      📱 {inspectedPartner.phone ? (inspectedPartner.phone.startsWith('+91') ? inspectedPartner.phone : `+91 ${inspectedPartner.phone}`) : '+91 98XXXXXX44'} 🔒
                    </strong>
                  </div>
                  <div className="info-item">
                    <span>Residential Address (Privacy Protected)</span>
                    <strong>
                      🏠 {inspectedPartner.location?.address || 'XXXXXXXXXXXXXX (Delhi NCR • Detailed address hidden for safety)'} 🔒
                    </strong>
                  </div>
                  <div className="info-item">
                    <span>Email Address</span>
                    <strong>✉️ {inspectedPartner.email || 's*****@lovekaro.com'} 🔒</strong>
                  </div>
                  <div className="info-item">
                    <span>Current City &amp; State</span>
                    <strong>📍 {inspectedPartner.city || 'Delhi NCR'}, India</strong>
                  </div>
                  <div className="info-item">
                    <span>Marital Status</span>
                    <strong>💍 {inspectedPartner.maritalStatus || 'Never Married'}</strong>
                  </div>
                  <div className="info-item">
                    <span>Religion &amp; Mother Tongue</span>
                    <strong>
                      🕉️ {inspectedPartner.religion} • 🗣️ {inspectedPartner.motherTongue}
                    </strong>
                  </div>
                  <div className="info-item">
                    <span>Profession / Career</span>
                    <strong>💼 {inspectedPartner.occupation || 'Professional'}</strong>
                  </div>
                  <div className="info-item">
                    <span>Education</span>
                    <strong>🎓 {inspectedPartner.education || 'Graduate'}</strong>
                  </div>
                </div>

                {/* Social Media Links & Permission Verification Section */}
                <div
                  className="social-links-inspect-block"
                  style={{
                    marginBottom: '1.25rem',
                    padding: '16px',
                    borderRadius: '16px',
                    background: inspectedPartner.hasSocialAccess ? '#f0fdf4' : '#fff5f7',
                    border: inspectedPartner.hasSocialAccess ? '1.5px solid #86efac' : '1.5px solid #fecdd3',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.98rem', color: inspectedPartner.hasSocialAccess ? '#166534' : '#e11d48', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        🌐 Social Media Links {inspectedPartner.hasSocialAccess ? '✅ Unlocked' : '🔒 Protected'}
                      </h4>
                      <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                        {inspectedPartner.hasSocialAccess
                          ? `✅ ${inspectedPartner.name} has approved your request to view their social media profiles.`
                          : `🔒 Privacy Lock: ${inspectedPartner.name} ke social links dekhne ke liye unse permission lena jaruri hai.`}
                      </p>
                    </div>
                    {inspectedPartner.hasSocialAccess && (
                      <span style={{ fontSize: '0.74rem', padding: '4px 10px', background: '#22c55e', color: '#fff', borderRadius: '12px', fontWeight: 700 }}>
                        ✓ Access Granted
                      </span>
                    )}
                  </div>

                  {inspectedPartner.hasSocialAccess ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {inspectedPartner.socialLinks?.instagram && (
                        <a
                          href={
                            inspectedPartner.socialLinks.instagram.startsWith('http')
                              ? inspectedPartner.socialLinks.instagram
                              : `https://instagram.com/${inspectedPartner.socialLinks.instagram.replace('@', '')}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="social-link-pill"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#fdf2f8',
                            color: '#db2777',
                            border: '1px solid #fbcfe8',
                            borderRadius: '20px',
                            padding: '6px 14px',
                            fontSize: '0.86rem',
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          📸 Instagram: {inspectedPartner.socialLinks.instagram} ↗
                        </a>
                      )}
                      {inspectedPartner.socialLinks?.facebook && (
                        <a
                          href={
                            inspectedPartner.socialLinks.facebook.startsWith('http')
                              ? inspectedPartner.socialLinks.facebook
                              : `https://facebook.com/${inspectedPartner.socialLinks.facebook}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="social-link-pill"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#eff6ff',
                            color: '#2563eb',
                            border: '1px solid #bfdbfe',
                            borderRadius: '20px',
                            padding: '6px 14px',
                            fontSize: '0.86rem',
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          👥 Facebook Profile ↗
                        </a>
                      )}
                      {inspectedPartner.socialLinks?.linkedin && (
                        <a
                          href={
                            inspectedPartner.socialLinks.linkedin.startsWith('http')
                              ? inspectedPartner.socialLinks.linkedin
                              : `https://linkedin.com/in/${inspectedPartner.socialLinks.linkedin}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="social-link-pill"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#f0f9ff',
                            color: '#0284c7',
                            border: '1px solid #bae6fd',
                            borderRadius: '20px',
                            padding: '6px 14px',
                            fontSize: '0.86rem',
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          💼 LinkedIn Profile ↗
                        </a>
                      )}
                      {inspectedPartner.socialLinks?.twitter && (
                        <a
                          href={
                            inspectedPartner.socialLinks.twitter.startsWith('http')
                              ? inspectedPartner.socialLinks.twitter
                              : `https://x.com/${inspectedPartner.socialLinks.twitter.replace('@', '')}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="social-link-pill"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#f8fafc',
                            color: '#0f172a',
                            border: '1px solid #cbd5e1',
                            borderRadius: '20px',
                            padding: '6px 14px',
                            fontSize: '0.86rem',
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          🐦 Twitter / X ↗
                        </a>
                      )}
                      {inspectedPartner.socialLinks?.youtube && (
                        <a
                          href={
                            inspectedPartner.socialLinks.youtube.startsWith('http')
                              ? inspectedPartner.socialLinks.youtube
                              : `https://youtube.com/${inspectedPartner.socialLinks.youtube}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="social-link-pill"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#fef2f2',
                            color: '#dc2626',
                            border: '1px solid #fecaca',
                            borderRadius: '20px',
                            padding: '6px 14px',
                            fontSize: '0.86rem',
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          📺 YouTube Channel ↗
                        </a>
                      )}
                      {!inspectedPartner.hasConfiguredSocial && (
                        <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b', fontStyle: 'italic' }}>
                          {inspectedPartner.name} ne abhi tak koi social media link configure nahi ki hai.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                        <div style={{ padding: '6px 12px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.82rem', color: '#64748b' }}>
                          <span>📸 Instagram: </span>
                          <strong style={{ color: '#94a3b8' }}>🔒 instagram.com/XXXXXXX</strong>
                        </div>
                        <div style={{ padding: '6px 12px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.82rem', color: '#64748b' }}>
                          <span>👥 Facebook: </span>
                          <strong style={{ color: '#94a3b8' }}>🔒 facebook.com/XXXXXXX</strong>
                        </div>
                        <div style={{ padding: '6px 12px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.82rem', color: '#64748b' }}>
                          <span>💼 LinkedIn: </span>
                          <strong style={{ color: '#94a3b8' }}>🔒 linkedin.com/in/XXXXXXX</strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {inspectedPartner.socialAccessStatus === 'requested' ? (
                          <button
                            type="button"
                            disabled
                            style={{
                              padding: '8px 18px',
                              borderRadius: '20px',
                              border: '1px solid #cbd5e1',
                              background: '#f1f5f9',
                              color: '#64748b',
                              fontSize: '0.86rem',
                              fontWeight: 600,
                              cursor: 'not-allowed',
                            }}
                          >
                            ⏳ Access Requested (Waiting for {inspectedPartner.name}&apos;s verification)
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="save-primary-btn"
                            style={{
                              padding: '8px 18px',
                              borderRadius: '20px',
                              fontSize: '0.86rem',
                              fontWeight: 600,
                            }}
                            onClick={() => handleRequestSocial(inspectedPartner)}
                          >
                            🔑 Request {inspectedPartner.name}&apos;s Permission to View Social Links
                          </button>
                        )}
                        <small style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                          🛡️ Only verified on approval
                        </small>
                      </div>
                    </div>
                  )}
                </div>

                <div className="overview-bio-text" style={{ marginBottom: '1.25rem' }}>
                  <strong>About {inspectedPartner.name}:</strong> &ldquo;{inspectedPartner.bio}&rdquo;
                </div>

                <div className="overview-tags-list" style={{ marginBottom: '1.25rem' }}>
                  {(inspectedPartner.interests || []).map((t) => (
                    <span key={t} className="overview-interest-pill">
                      ✦ {t}
                    </span>
                  ))}
                </div>

                <div className="pay-modal-footer">
                  <button
                    type="button"
                    className="save-primary-btn"
                    onClick={() => {
                      const pid = inspectedPartner.id;
                      setInspectedPartner(null);
                      setSelectedChatId(pid);
                      setActiveTab('chats');
                    }}
                  >
                    💬 Start Unlimited Chat with {inspectedPartner.name}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
