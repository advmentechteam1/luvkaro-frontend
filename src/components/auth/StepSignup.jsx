import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';

// Verified local portrait presets for Women and Men (from frontend/public)
const FEMALE_AVATAR_PRESETS = [
  '/priya-sharma.jpg',
  '/images%20(7).jpg',
  '/images%20(11).jpg',
  '/images%20(5).jpg',
  '/images%20(13).jpg',
  '/images%20(10).jpg',
];

const MALE_AVATAR_PRESETS = [
  '/rohit-verma.jpg',
  '/aman-singh.jpg',
  '/images%20(14).jpg',
  '/images%20(6).jpg',
  '/images%20(2).jpg',
  '/images%20(18).jpg',
];

const POPULAR_INTERESTS = [
  'Traveling', 'Music', 'Fitness & Gym', 'Cooking', 'Movies',
  'Reading', 'Photography', 'Coffee', 'Nature', 'Tech & Coding',
  'Dancing', 'Pets & Dogs', 'Yoga', 'Cricket', 'Art'
];

export default function StepSignup({ onSwitchToLogin, onClose }) {
  const { signup } = useAuth();

  // Current Step: 1 = Phone/OTP, 2 = Identity & Age/DOB, 3 = Email & Password, 4 = Matrimonial & Community, 5 = Photo & Bio, 6 = Success Screen
  const [step, setStep] = useState(1);

  // Form Data State
  const [formData, setFormData] = useState({
    // Step 1: Phone & OTP
    phone: '',
    otp: '',
    isPhoneVerified: false,
    verificationToken: '',

    // Step 2: Basic Identity, Age & DOB
    name: '',
    age: 22,
    dob: '2004-01-01',
    gender: 'female',
    interestedIn: 'male',

    // Step 3: Account
    email: '',
    password: '',
    confirmPassword: '',

    // Step 4: Matrimonial, Cultural & Lifestyle
    maritalStatus: 'Never Married',
    religion: 'Hindu',
    motherTongue: 'Hindi',
    city: 'Delhi',
    occupation: 'Software Engineer',
    education: "Bachelor's Degree",

    // Step 5: Photo & Bio
    avatar: FEMALE_AVATAR_PRESETS[0],
    bio: '',
    interests: ['Traveling', 'Music', 'Coffee'],
  });

  const activeAvatarPresets =
    formData.gender === 'male' ? MALE_AVATAR_PRESETS : FEMALE_AVATAR_PRESETS;

  const [userExplicitlySelectedInterest, setUserExplicitlySelectedInterest] = useState(false);

  // Handle Gender Selection -> Suggest matching opposite gender only if user hasn't explicitly set their preference yet
  const handleSelectGender = (selectedGender) => {
    const autoInterestedIn = userExplicitlySelectedInterest
      ? formData.interestedIn
      : selectedGender === 'male'
      ? 'female'
      : selectedGender === 'female'
      ? 'male'
      : 'everyone';

    const isUsingPreset =
      FEMALE_AVATAR_PRESETS.includes(formData.avatar) ||
      MALE_AVATAR_PRESETS.includes(formData.avatar) ||
      !formData.avatar;
    const nextAvatar = isUsingPreset
      ? selectedGender === 'male'
        ? MALE_AVATAR_PRESETS[0]
        : FEMALE_AVATAR_PRESETS[0]
      : formData.avatar;

    setFormData((prev) => ({
      ...prev,
      gender: selectedGender,
      interestedIn: autoInterestedIn,
      avatar: nextAvatar,
    }));
    setError('');
  };

  const handleSelectInterestedIn = (selectedInterest) => {
    setUserExplicitlySelectedInterest(true);
    setFormData((prev) => ({
      ...prev,
      interestedIn: selectedInterest,
    }));
    setError('');
  };

  // UI state
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [devOtpHint, setDevOtpHint] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);

  // Helper to update form fields
  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  // Direct Age Change Handler (Option to enter age directly)
  const handleAgeChange = (e) => {
    const val = e.target.value;
    const ageNum = parseInt(val, 10);
    updateField('age', val === '' ? '' : ageNum);

    if (!isNaN(ageNum) && ageNum >= 18) {
      // Synchronize DOB with entered age
      const d = new Date();
      d.setFullYear(d.getFullYear() - ageNum);
      const year = d.getFullYear();
      updateField('dob', `${year}-01-01`);
    }
  };

  // DOB Change Handler -> auto calculates Age
  const handleDobChange = (e) => {
    const dobValue = e.target.value;
    updateField('dob', dobValue);

    if (dobValue) {
      const birthDate = new Date(dobValue);
      if (!isNaN(birthDate.getTime())) {
        const today = new Date();
        let calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--;
        }
        updateField('age', calculatedAge > 0 ? calculatedAge : 18);
      }
    }
  };

  // Toggle Interest tag
  const toggleInterest = (interest) => {
    const current = formData.interests;
    if (current.includes(interest)) {
      updateField('interests', current.filter((i) => i !== interest));
    } else {
      if (current.length >= 7) {
        setError('You can select up to 7 interests');
        return;
      }
      updateField('interests', [...current, interest]);
    }
  };

  // Custom photo upload via file input
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      updateField('avatar', event.target.result);
    };
    reader.readAsDataURL(file);
  };

  // ----------------------------------------------------
  // STEP 1: SEND & VERIFY OTP
  // ----------------------------------------------------
  const handleSendOtp = async () => {
    setError('');
    const cleanPhone = formData.phone.trim();
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.sendOtp(cleanPhone);
      setOtpSent(true);
      setResendTimer(60);
      if (res.data?.otp) {
        setDevOtpHint(res.data.otp);
      }
      const interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    if (!formData.otp || formData.otp.length < 6) {
      setError('Please enter the 6-digit OTP sent to your number');
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.verifyOtp(formData.phone, formData.otp);
      updateField('isPhoneVerified', true);
      updateField('verificationToken', res.data.verificationToken);
      setTimeout(() => setStep(2), 400);
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // STEP NAVIGATION VALIDATION
  // ----------------------------------------------------
  const handleNextStep = () => {
    setError('');

    // Step 2 Validation: Name & Age
    if (step === 2) {
      if (!formData.name.trim()) {
        setError('Please enter your full name');
        return;
      }
      const ageNum = Number(formData.age);
      if (!ageNum || isNaN(ageNum)) {
        setError('Please enter your age');
        return;
      }
      if (ageNum < 18) {
        setError('You must be at least 18 years old to join LoveKaro');
        return;
      }
      if (!formData.dob) {
        const d = new Date();
        d.setFullYear(d.getFullYear() - ageNum);
        updateField('dob', `${d.getFullYear()}-01-01`);
      }
      setStep(3);
      return;
    }

    // Step 3 Validation: Email & Password
    if (step === 3) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      setStep(4);
      return;
    }

    // Step 4 Validation: Marital Status & City
    if (step === 4) {
      if (!formData.city.trim()) {
        setError('Please enter your city/location');
        return;
      }
      setStep(5);
      return;
    }
  };

  // ----------------------------------------------------
  // FINAL SUBMISSION (Save to Database)
  // ----------------------------------------------------
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.bio.trim()) {
      setError('Please write a brief About Me / Bio to attract great matches');
      return;
    }

    // Ensure valid Age & DOB before submission
    const ageNum = Number(formData.age) || 18;
    let finalDob = formData.dob;
    if (!finalDob || isNaN(new Date(finalDob).getTime())) {
      const d = new Date();
      d.setFullYear(d.getFullYear() - ageNum);
      finalDob = `${d.getFullYear()}-01-01`;
    }

    const payload = {
      ...formData,
      age: ageNum,
      dob: finalDob,
    };

    try {
      setLoading(true);
      const result = await signup(payload);
      setCreatedUser(result);
      // Advance to Step 6: The Brand New Welcome Profile Screen!
      setStep(6);
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'Signup failed. Please try again or check fields.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`auth-form-card signup-card ${step === 6 ? 'full-new-screen-card' : ''}`}>
      {/* Step Progress Bar (Only visible before success screen) */}
      {step < 6 && (
        <div className="signup-stepper-header">
          <div className="stepper-dots">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`step-dot ${step === s ? 'active' : ''} ${step > s ? 'completed' : ''}`}
                onClick={() => {
                  if (formData.isPhoneVerified && s < step) setStep(s);
                }}
              >
                {step > s ? '✓' : s}
              </div>
            ))}
          </div>
          <div className="step-title-row">
            <span className="step-count">Step {step} of 5</span>
            <span className="step-name">
              {step === 1 && 'Mobile & OTP Verification'}
              {step === 2 && 'Identity, Age & Gender'}
              {step === 3 && 'Email & Security'}
              {step === 4 && 'Community & Lifestyle'}
              {step === 5 && 'Photo & Detailed About Me'}
            </span>
          </div>
        </div>
      )}

      {error && <div className="auth-error-banner">⚠️ {error}</div>}

      {/* ==================================================== */}
      {/* STEP 1: MOBILE & OTP                                */}
      {/* ==================================================== */}
      {step === 1 && (
        <div className="step-content">
          <div className="auth-header">
            <h2>Enter Your <span className="gradient-text">Mobile Number</span></h2>
            <p>We'll send a 6-digit verification code to keep your profile secure</p>
          </div>

          <div className="form-group">
            <label>Mobile Number</label>
            <div className="phone-input-row">
              <span className="country-code">🇮🇳 +91</span>
              <input
                type="tel"
                maxLength="10"
                placeholder="9876543210"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, ''))}
                disabled={otpSent && formData.isPhoneVerified}
                required
              />
              {!otpSent ? (
                <button
                  type="button"
                  className="send-otp-btn"
                  onClick={handleSendOtp}
                  disabled={loading || formData.phone.length < 10}
                >
                  {loading ? 'Sending...' : 'Get OTP'}
                </button>
              ) : (
                <button
                  type="button"
                  className="change-phone-btn"
                  onClick={() => {
                    setOtpSent(false);
                    updateField('otp', '');
                    setDevOtpHint('');
                  }}
                >
                  Edit
                </button>
              )}
            </div>
          </div>

          {otpSent && (
            <div className="form-group">
              <div className="label-row">
                <label>Enter 6-Digit OTP</label>
                {resendTimer > 0 ? (
                  <span className="timer-text">Resend in {resendTimer}s</span>
                ) : (
                  <button
                    type="button"
                    className="resend-link"
                    onClick={handleSendOtp}
                    disabled={loading}
                  >
                    Resend OTP
                  </button>
                )}
              </div>
              <div className="input-wrap">
                <span className="input-icon">🔐</span>
                <input
                  type="text"
                  maxLength="6"
                  placeholder="e.g. 123456"
                  value={formData.otp}
                  onChange={(e) => updateField('otp', e.target.value.replace(/\D/g, ''))}
                  disabled={formData.isPhoneVerified}
                />
              </div>

              {devOtpHint && (
                <div
                  className="dev-otp-pill"
                  onClick={() => updateField('otp', devOtpHint)}
                  title="Click to auto-fill"
                >
                  💡 Test OTP: <strong>{devOtpHint}</strong> (Click to auto-fill)
                </div>
              )}

              <button
                type="button"
                className="auth-primary-btn"
                onClick={handleVerifyOtp}
                disabled={loading || formData.otp.length < 6}
                style={{ marginTop: '1rem' }}
              >
                {loading ? 'Verifying OTP...' : 'Verify OTP & Continue ➜'}
              </button>
            </div>
          )}

          <div className="auth-footer-prompt">
            <span>Already have an account?</span>
            <button type="button" className="switch-auth-link" onClick={onSwitchToLogin}>
              Log In
            </button>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* STEP 2: NAME, AGE & DOB                             */}
      {/* ==================================================== */}
      {step === 2 && (
        <div className="step-content">
          <div className="auth-header">
            <h2>Personal <span className="gradient-text">Identity</span></h2>
            <p>Tell us your name, age and gender</p>
          </div>

          <div className="form-group">
            <label>Full Name</label>
            <div className="input-wrap">
              <span className="input-icon">👤</span>
              <input
                type="text"
                placeholder="e.g. Priya Sharma or Rahul Verma"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            {/* Direct Age Input Field */}
            <div className="form-group age-input-container">
              <label>Age (Years) *</label>
              <div className="input-wrap age-input-wrap">
                <input
                  type="number"
                  min="18"
                  max="99"
                  placeholder="24"
                  value={formData.age !== undefined ? formData.age : ''}
                  onChange={handleAgeChange}
                  className="age-number-input"
                  required
                />
                <span className="age-unit">years</span>
              </div>
            </div>

            {/* Date of Birth Picker */}
            <div className="form-group flex-1">
              <label>Date of Birth (DOB)</label>
              <div className="input-wrap">
                <input
                  type="date"
                  value={formData.dob || ''}
                  onChange={handleDobChange}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>I am a (Select Your Gender)</label>
            <div className="pill-selector">
              {['female', 'male', 'other'].map((g) => (
                <button
                  type="button"
                  key={g}
                  className={`pill-btn ${formData.gender === g ? 'active' : ''}`}
                  onClick={() => handleSelectGender(g)}
                >
                  {g === 'female' ? '👩 Woman' : g === 'male' ? '👨 Man' : '🌈 Non-Binary / Other'}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group pill-group-wrap">
            <label>Interested In Matches (Select Who You Want to Meet) *</label>
            <div className="pill-selector">
              {[
                { key: 'male', label: '👨 Men Profiles' },
                { key: 'female', label: '👩 Women Profiles' },
                { key: 'everyone', label: '✨ Everyone' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.key}
                  className={`pill-btn ${formData.interestedIn === item.key ? 'active' : ''}`}
                  onClick={() => handleSelectInterestedIn(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live Database Opposite-Gender Matching Info Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, #fff5f8 0%, #fff0f5 100%)',
              border: '1px solid #f9cadb',
              borderRadius: '16px',
              padding: '12px 14px',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: '0.83rem', fontWeight: 700, color: '#be185d' }}>
              {formData.gender === 'male'
                ? '💖 You selected Man — Signup ke baad aapko database se real registered Women profiles with photos show hongi!'
                : formData.gender === 'female'
                ? '💖 You selected Woman — Signup ke baad aapko database se real registered Men profiles with photos show hongi!'
                : '💖 Signup ke baad aapko database se real registered profiles with photos show hongi!'}
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                background: '#ffffff',
                color: '#e11d48',
                padding: '4px 10px',
                borderRadius: '999px',
                border: '1px solid #fecdd3',
              }}
            >
              100% Real Database Users
            </span>
          </div>

          <div className="step-actions">
            <button type="button" className="step-back-btn" onClick={() => setStep(1)}>
              ← Back
            </button>
            <button type="button" className="auth-primary-btn" onClick={handleNextStep}>
              Continue to Step 3 ➜
            </button>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* STEP 3: EMAIL & PASSWORD                            */}
      {/* ==================================================== */}
      {step === 3 && (
        <div className="step-content">
          <div className="auth-header">
            <h2>Account <span className="gradient-text">Credentials</span></h2>
            <p>Set up your email and password for future logins</p>
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <div className="input-wrap">
              <span className="input-icon">✉️</span>
              <input
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Create Password</label>
            <div className="input-wrap">
              <span className="input-icon">🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <div className="input-wrap">
              <span className="input-icon">🔑</span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="step-actions">
            <button type="button" className="step-back-btn" onClick={() => setStep(2)}>
              ← Back
            </button>
            <button type="button" className="auth-primary-btn" onClick={handleNextStep}>
              Continue to Step 4 ➜
            </button>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* STEP 4: MATRIMONIAL & COMMUNITY (Hindi, Muslim, etc) */}
      {/* ==================================================== */}
      {step === 4 && (
        <div className="step-content">
          <div className="auth-header">
            <h2>Community & <span className="gradient-text">Lifestyle</span></h2>
            <p>Help compatible partners discover you based on values and preferences</p>
          </div>

          <div className="form-group">
            <label>Marital Status</label>
            <div className="pill-selector">
              {['Never Married', 'Divorced', 'Widowed', 'Awaiting Divorce'].map((status) => (
                <button
                  type="button"
                  key={status}
                  className={`pill-btn ${formData.maritalStatus === status ? 'active' : ''}`}
                  onClick={() => updateField('maritalStatus', status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label>Religion / Faith</label>
              <select
                className="custom-select"
                value={formData.religion}
                onChange={(e) => updateField('religion', e.target.value)}
              >
                {['Hindu', 'Muslim', 'Sikh', 'Christian', 'Jain', 'Buddhist', 'Parsi', 'Spiritual', 'Other'].map(
                  (rel) => (
                    <option key={rel} value={rel}>
                      {rel}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="form-group flex-1">
              <label>Mother Tongue</label>
              <select
                className="custom-select"
                value={formData.motherTongue}
                onChange={(e) => updateField('motherTongue', e.target.value)}
              >
                {['Hindi', 'Punjabi', 'Bengali', 'Marathi', 'Gujarati', 'Urdu', 'Tamil', 'Telugu', 'English', 'Other'].map(
                  (lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label>City / Location</label>
              <div className="input-wrap">
                <span className="input-icon">📍</span>
                <input
                  type="text"
                  placeholder="e.g. Mumbai, Delhi, Bengaluru"
                  value={formData.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group flex-1">
              <label>Profession / Job</label>
              <div className="input-wrap">
                <span className="input-icon">💼</span>
                <input
                  type="text"
                  placeholder="e.g. Designer, Doctor, Engineer"
                  value={formData.occupation}
                  onChange={(e) => updateField('occupation', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="step-actions">
            <button type="button" className="step-back-btn" onClick={() => setStep(3)}>
              ← Back
            </button>
            <button type="button" className="auth-primary-btn" onClick={handleNextStep}>
              Continue to Step 5 ➜
            </button>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* STEP 5: PHOTO & DETAILED ABOUT ME                   */}
      {/* ==================================================== */}
      {step === 5 && (
        <form onSubmit={handleFinalSubmit} className="step-content">
          <div className="auth-header">
            <h2>Photo & <span className="gradient-text">Detailed About Me</span></h2>
            <p>Profiles with photos and great bios receive 5x more genuine matches!</p>
          </div>

          {/* Profile Photo Section */}
          <div className="form-group">
            <label>Profile Photo</label>
            <div className="avatar-preview-container">
              <img src={formData.avatar} alt="Profile Preview" className="selected-avatar-img" />
              <div className="avatar-upload-cta">
                <label className="upload-btn-label">
                  📷 Upload Your Photo
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                </label>
                <span className="avatar-hint">Or choose one of our verified avatars below:</span>
              </div>
            </div>

            {/* Presets */}
            <div className="avatar-presets-grid">
              {activeAvatarPresets.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`Preset ${idx + 1}`}
                  className={`preset-thumb ${formData.avatar === url ? 'active' : ''}`}
                  onClick={() => updateField('avatar', url)}
                />
              ))}
            </div>
          </div>

          {/* Detailed About Me */}
          <div className="form-group">
            <label>About Me / Bio ("Pura Ek About")</label>
            <textarea
              className="custom-textarea"
              rows="4"
              placeholder="Tell people about yourself: what you love doing, your values, your vibe, and what kind of partner you are looking for..."
              value={formData.bio}
              onChange={(e) => updateField('bio', e.target.value)}
              required
            />
            <span className="char-count">{formData.bio.length} characters</span>
          </div>

          {/* Interests */}
          <div className="form-group">
            <label>Interests & Hobbies (Pick up to 7)</label>
            <div className="interests-cloud">
              {POPULAR_INTERESTS.map((item) => {
                const isSelected = formData.interests.includes(item);
                return (
                  <button
                    type="button"
                    key={item}
                    className={`interest-chip ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleInterest(item)}
                  >
                    {isSelected ? '✓ ' : '+ '} {item}
                  </button>
                );
              })}
            </div>
          </div>

          {error && <div className="auth-error-banner" style={{ marginTop: '12px' }}>⚠️ {error}</div>}

          <div className="step-actions">
            <button type="button" className="step-back-btn" onClick={() => setStep(4)} disabled={loading}>
              ← Back
            </button>
            <button type="submit" className="auth-primary-btn complete-btn" disabled={loading}>
              {loading ? 'Saving Profile to Database...' : 'Complete Profile & Save ✨'}
            </button>
          </div>
        </form>
      )}

      {/* ==================================================== */}
      {/* STEP 6: NEW SCREEN (CONGRATULATIONS & WELCOME CARD) */}
      {/* ==================================================== */}
      {step === 6 && (
        <div className="step-content full-welcome-screen">
          <div className="celebration-particles">✨ 💖 🎉 🌟 ✨</div>
          <div className="success-confetti-badge">🎉 Profile Created Successfully!</div>
          <h2 className="welcome-main-title">
            Welcome to <span className="gradient-text">LoveKaro</span>, {formData.name}!
          </h2>
          <p className="success-subtext">
            Aapka complete profile database me save ho chuka hai! Here is your official matrimonial & dating preview:
          </p>

          {/* Beautiful Live Profile Preview Card */}
          <div className="user-success-card">
            <div className="card-photo-wrapper">
              <img src={formData.avatar} alt={formData.name} className="card-user-photo" />
              <div className="card-badge-row">
                <span className="verified-pill">🛡️ Phone Verified</span>
                <span className="community-pill">{formData.religion} • {formData.motherTongue}</span>
              </div>
            </div>

            <div className="card-details-section">
              <div className="card-name-age">
                <h3>{formData.name}, <span className="highlight-age">{formData.age} yrs</span></h3>
                <span className="card-location">📍 {formData.city}, India</span>
              </div>

              <div className="card-status-badges">
                <span className="badge-tag">💍 {formData.maritalStatus}</span>
                {formData.occupation && <span className="badge-tag">💼 {formData.occupation}</span>}
                {formData.education && <span className="badge-tag">🎓 {formData.education}</span>}
              </div>

              <div className="card-bio-block">
                <h4>About Me</h4>
                <p>"{formData.bio}"</p>
              </div>

              {formData.interests.length > 0 && (
                <div className="card-interests-row">
                  {formData.interests.map((tag) => (
                    <span key={tag} className="interest-mini-pill">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="success-action-buttons">
            <button
              type="button"
              className="auth-primary-btn big-action pulse-animation"
              onClick={() => {
                if (onClose) onClose();
                window.location.hash = 'profile';
              }}
            >
              Open My Profile &amp; View {formData.gender === 'male' ? 'Women' : 'Men'} Matches 👤✨
            </button>
            <button
              type="button"
              className="step-back-btn view-matches-btn"
              onClick={() => {
                if (onClose) onClose();
                window.location.hash = 'matches';
              }}
            >
              Explore {formData.gender === 'male' ? 'Women' : 'Men'} Profiles 💖
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
