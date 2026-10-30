import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';

export default function LoginForm({ onSwitchToSignup, onClose }) {
  const { login, loginWithOtp } = useAuth();
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' | 'otp'

  // Password Login State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP Login State
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Common UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Password Login Submit
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!identifier || !password) {
      setError('Please enter your email/phone and password');
      return;
    }

    try {
      setLoading(true);
      await login(identifier, password);
      if (onClose) onClose();
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // OTP Send
  const handleSendOtp = async () => {
    setError('');
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.sendOtp(phone);
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
      setError(err.message || 'Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // OTP Login Submit
  const handleOtpLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!phone || !otp) {
      setError('Please enter both phone number and OTP');
      return;
    }

    try {
      setLoading(true);
      await loginWithOtp(phone, otp);
      if (onClose) onClose();
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-card">
      <div className="auth-header">
        <h2>Welcome Back to <span className="gradient-text">LoveKaro</span></h2>
        <p>Find genuine matches and meaningful relationships</p>
      </div>

      {/* Login Tabs */}
      <div className="auth-tabs">
        <button
          type="button"
          className={`tab-btn ${loginMethod === 'password' ? 'active' : ''}`}
          onClick={() => {
            setLoginMethod('password');
            setError('');
          }}
        >
          Password Login
        </button>
        <button
          type="button"
          className={`tab-btn ${loginMethod === 'otp' ? 'active' : ''}`}
          onClick={() => {
            setLoginMethod('otp');
            setError('');
          }}
        >
          Quick OTP Login
        </button>
      </div>

      {error && <div className="auth-error-banner">⚠️ {error}</div>}

      {loginMethod === 'password' ? (
        <form onSubmit={handlePasswordLogin} className="auth-form">
          <div className="form-group">
            <label>Email or Mobile Number</label>
            <div className="input-wrap">
              <span className="input-icon">👤</span>
              <input
                type="text"
                placeholder="name@email.com or 9876543210"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="label-row">
              <label>Password</label>
              <button
                type="button"
                className="forgot-link"
                onClick={() => setLoginMethod('otp')}
              >
                Login via OTP instead?
              </button>
            </div>
            <div className="input-wrap">
              <span className="input-icon">🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-primary-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In to LoveKaro'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleOtpLogin} className="auth-form">
          <div className="form-group">
            <label>Mobile Number</label>
            <div className="phone-input-row">
              <span className="country-code">+91</span>
              <input
                type="tel"
                maxLength="10"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                disabled={otpSent}
                required
              />
              {!otpSent ? (
                <button
                  type="button"
                  className="send-otp-btn"
                  onClick={handleSendOtp}
                  disabled={loading || phone.length < 10}
                >
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>
              ) : (
                <button
                  type="button"
                  className="change-phone-btn"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp('');
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
                <span className="input-icon">🔑</span>
                <input
                  type="text"
                  maxLength="6"
                  placeholder="e.g. 123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>

              {devOtpHint && (
                <div
                  className="dev-otp-pill"
                  onClick={() => setOtp(devOtpHint)}
                  title="Click to auto-fill"
                >
                  💡 Test OTP: <strong>{devOtpHint}</strong> (Click to fill)
                </div>
              )}
            </div>
          )}

          {otpSent && (
            <button type="submit" className="auth-primary-btn" disabled={loading || otp.length < 6}>
              {loading ? 'Verifying...' : 'Verify & Log In'}
            </button>
          )}
        </form>
      )}

      <div className="auth-footer-prompt">
        <span>Don't have an account yet?</span>
        <button type="button" className="switch-auth-link" onClick={onSwitchToSignup}>
          Create New Profile
        </button>
      </div>
    </div>
  );
}
