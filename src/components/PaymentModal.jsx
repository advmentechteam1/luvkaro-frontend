import { useState } from 'react';
import { userApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './PaymentModal.css';

export const PAYMENT_PLANS = [
  {
    id: 'starter',
    name: 'Starter Chat Pass',
    price: 199,
    originalPrice: 399,
    duration: '7 Days Access',
    badge: 'Quick Start',
    features: [
      'Unlimited Chat Messages (No 5-prompt limit)',
      'Share Phone & WhatsApp Freely',
      'Unlock Partner Bio-Data & Profile',
      'Instant Match Notifications',
    ],
  },
  {
    id: 'gold',
    name: 'Gold VIP Unlimited Pass',
    price: 499,
    originalPrice: 999,
    duration: '30 Days Access',
    badge: '⭐ Most Popular',
    recommended: true,
    features: [
      'Unlimited Live Chat with ALL Matches',
      'Share Phone, WhatsApp & Instagram ID',
      '100% Full Profile & Bio-Data Check',
      'Golden Verified VIP Badge on Profile',
      'Priority Customer & Trust Support',
    ],
  },
  {
    id: 'diamond',
    name: 'Diamond Matrimony Pass',
    price: 999,
    originalPrice: 1999,
    duration: '90 Days Access',
    badge: '👑 Best Value',
    features: [
      '90 Days Unlimited VIP Access',
      'Unlimited Direct Calling & Audio/Video Chat',
      'Share Social Handles & Direct Numbers',
      'Top Profile Visibility in Search & Discover',
      'Personal Relationship Manager Support',
    ],
  },
];

export default function PaymentModal({
  isOpen,
  onClose,
  reason = '',
  partner = null,
  onSuccess = null,
}) {
  const { user, updateUser } = useAuth();
  const [selectedPlanId, setSelectedPlanId] = useState('gold');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [upiIdInput, setUpiIdInput] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [processing, setProcessing] = useState(false);
  const [successState, setSuccessState] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  if (!isOpen) return null;

  const selectedPlan = PAYMENT_PLANS.find((p) => p.id === selectedPlanId) || PAYMENT_PLANS[1];

  const handleCopyUpi = () => {
    navigator.clipboard?.writeText('lovekaro@upi');
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      const res = await userApi.createPayment({
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        amount: selectedPlan.price,
        paymentMethod,
        paymentReference: utrNumber || upiIdInput || `${user?.phone || 'user'}@upi`,
        unlockedPartnerId: partner?.id || '',
        unlockedPartnerName: partner?.name || '',
      });

      if (res.data) {
        if (res.data.user) {
          updateUser(res.data.user);
        } else {
          updateUser({ isPremium: true, premiumPlan: selectedPlan.name });
        }

        setSuccessState(true);
        if (onSuccess) onSuccess(res.data);

        setTimeout(() => {
          setSuccessState(false);
          onClose();
        }, 1800);
      }
    } catch (err) {
      alert(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="pay-modal-overlay" onClick={onClose}>
      <div className="pay-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button type="button" className="pay-close-x" onClick={onClose} aria-label="Close">
          ✕
        </button>

        {successState ? (
          <div className="pay-success-screen">
            <div className="pay-success-icon">🎉</div>
            <h2>VIP Premium Activated!</h2>
            <p>
              Badhaai ho! Aapka <b>{selectedPlan.name}</b> successfully activate ho chuka hai.
              Ab aap unlimited live chat kar sakte hain aur contacts share kar sakte hain!
            </p>
            <div className="pay-success-pill">💎 Unlimited VIP Access Active</div>
          </div>
        ) : (
          <>
            {/* Modal Header */}
            <div className="pay-header">
              <span className="vip-badge-tag">💎 LOVEKARO VIP RECHARGE</span>
              <h2>Unlock Unlimited Chat &amp; Contacts</h2>
              {reason && (
                <div className="pay-reason-alert">
                  <span>ℹ️</span> {reason}
                </div>
              )}
            </div>

            {/* Plans Grid */}
            <div className="pay-plans-container">
              {PAYMENT_PLANS.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                return (
                  <div
                    key={plan.id}
                    className={`pay-plan-card ${isSelected ? 'active' : ''} ${
                      plan.recommended ? 'recommended' : ''
                    }`}
                    onClick={() => setSelectedPlanId(plan.id)}
                  >
                    {plan.recommended && <div className="popular-ribbon">POPULAR</div>}
                    <div className="plan-badge-pill">{plan.badge}</div>
                    <h3>{plan.name}</h3>
                    <div className="plan-price-row">
                      <span className="price-curr">₹</span>
                      <span className="price-val">{plan.price}</span>
                      <span className="price-orig">₹{plan.originalPrice}</span>
                    </div>
                    <span className="plan-duration-tag">{plan.duration}</span>
                    <ul className="plan-perks-list">
                      {plan.features.map((feat, i) => (
                        <li key={i}>
                          <span className="check-icon">✓</span> {feat}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            {/* Payment Method Selector & Gateway Ready UI */}
            <form onSubmit={handleSubmitPayment} className="pay-details-form">
              <div className="pay-method-tabs">
                <button
                  type="button"
                  className={paymentMethod === 'UPI' ? 'active' : ''}
                  onClick={() => setPaymentMethod('UPI')}
                >
                  📱 UPI / QR Code
                </button>
                <button
                  type="button"
                  className={paymentMethod === 'CARD' ? 'active' : ''}
                  onClick={() => setPaymentMethod('CARD')}
                >
                  💳 Debit / Credit Card
                </button>
                <button
                  type="button"
                  className={paymentMethod === 'NETBANKING' ? 'active' : ''}
                  onClick={() => setPaymentMethod('NETBANKING')}
                >
                  🏦 Net Banking
                </button>
              </div>

              {paymentMethod === 'UPI' && (
                <div className="upi-pay-body">
                  <div className="upi-qr-card">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=lovekaro@upi%26pn=LoveKaro%26am=${selectedPlan.price}%26cu=INR`}
                      alt="UPI QR Code"
                      className="upi-qr-img"
                    />
                    <small>Scan with Google Pay, PhonePe, Paytm, or BHIM</small>
                  </div>
                  <div className="upi-manual-inputs">
                    <div className="upi-id-box">
                      <span>Official UPI ID:</span>
                      <code>lovekaro@upi</code>
                      <button type="button" onClick={handleCopyUpi}>
                        {copiedUpi ? 'Copied! ✓' : 'Copy'}
                      </button>
                    </div>
                    <label>
                      <span>Your UPI ID / Phone (Optional):</span>
                      <input
                        type="text"
                        placeholder="e.g. yourname@oksbi / 9876543210"
                        value={upiIdInput}
                        onChange={(e) => setUpiIdInput(e.target.value)}
                      />
                    </label>
                    <label>
                      <span>UTR / Transaction Reference (Optional for Instant Demo):</span>
                      <input
                        type="text"
                        placeholder="e.g. UPI Ref / UTR 12 Digits"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value)}
                      />
                    </label>
                  </div>
                </div>
              )}

              {paymentMethod === 'CARD' && (
                <div className="card-pay-body">
                  <label>
                    <span>Card Number</span>
                    <input type="text" placeholder="4532 •••• •••• 8821" maxLength="19" defaultValue="4532 8921 7654 8821" />
                  </label>
                  <div className="card-sub-grid">
                    <label>
                      <span>Expiry Date</span>
                      <input type="text" placeholder="MM/YY" maxLength="5" defaultValue="12/28" />
                    </label>
                    <label>
                      <span>CVV</span>
                      <input type="password" placeholder="•••" maxLength="4" defaultValue="786" />
                    </label>
                  </div>
                </div>
              )}

              {paymentMethod === 'NETBANKING' && (
                <div className="netbank-body">
                  <label>
                    <span>Select Your Bank</span>
                    <select defaultValue="HDFC">
                      <option value="HDFC">HDFC Bank</option>
                      <option value="SBI">State Bank of India</option>
                      <option value="ICICI">ICICI Bank</option>
                      <option value="AXIS">Axis Bank</option>
                      <option value="KOTAK">Kotak Mahindra Bank</option>
                      <option value="PNB">Punjab National Bank</option>
                    </select>
                  </label>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pay-modal-actions">
                <button type="button" className="pay-cancel-btn" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="pay-submit-btn" disabled={processing}>
                  {processing ? 'Processing...' : `⚡ Pay ₹${selectedPlan.price} & Activate VIP Pass`}
                </button>
              </div>

              <div className="pay-secure-note">
                🔒 256-Bit SSL Encrypted • Ready for Razorpay / Stripe Gateway Integration • Instant Activation
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

