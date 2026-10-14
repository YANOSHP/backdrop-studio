'use client';

import { useState, useEffect, useRef } from 'react';
import { COMPANY_CONTACT } from '@/lib/whatsapp';

export default function ContactCallModal({
  isOpen,
  onClose,
  phoneDisplay = COMPANY_CONTACT.phoneDisplay,
  phoneDial = COMPANY_CONTACT.phoneDial,
  companyName = COMPANY_CONTACT.name,
  workingHours = COMPANY_CONTACT.workingHours,
  address = COMPANY_CONTACT.address
}) {
  const [copied, setCopied] = useState(false);
  const modalRef = useRef(null);
  const callBtnRef = useRef(null);

  // Close on Escape & handle body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Focus primary action when opened
    const timer = setTimeout(() => {
      callBtnRef.current?.focus();
    }, 100);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen, onClose]);

  const handleClose = () => {
    setCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  const handleCopyNumber = async () => {
    try {
      // Copy clean display number
      await navigator.clipboard.writeText(phoneDisplay);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = phoneDisplay;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="call-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        background: 'rgba(20, 26, 22, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        ref={modalRef}
        className="contact-call-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          maxWidth: '520px',
          width: '100%',
          padding: '36px 32px 32px',
          position: 'relative',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(197, 160, 89, 0.25)',
          textAlign: 'center',
          animation: 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close dialog"
          className="modal-close-btn"
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: '#F5F2EC',
            border: 'none',
            color: 'var(--color-sage)',
            fontSize: '1.2rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
        >
          ✕
        </button>

        {/* Animated Phone Icon */}
        <div
          style={{
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #26382B 0%, #3C5542 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 12px 30px rgba(38, 56, 43, 0.28)',
            position: 'relative'
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: '-6px',
              borderRadius: '50%',
              border: '2px dashed rgba(197, 160, 89, 0.5)',
              animation: 'spinSlow 20s linear infinite'
            }}
          />
          <svg
            className="call-pulse-icon"
            style={{ width: '40px', height: '40px', fill: 'none', stroke: '#FFFFFF', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }}
            viewBox="0 0 24 24"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </div>

        {/* Badge */}
        <span
          className="badge badge-gold"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '12px',
            padding: '5px 14px',
            fontSize: '0.78rem',
            letterSpacing: '0.04em'
          }}
        >
          ✨ Direct Stage &amp; Wedding Planner Call
        </span>

        {/* Heading */}
        <h2
          id="call-modal-title"
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.75rem, 4vw, 2.15rem)',
            color: 'var(--color-sage)',
            lineHeight: 1.2,
            margin: '0 0 12px',
            fontWeight: 700
          }}
        >
          Let&apos;s Bring Your Vision to Life
        </h2>

        {/* Friendly Message */}
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.96rem',
            lineHeight: 1.6,
            maxWidth: '430px',
            margin: '0 auto 24px'
          }}
        >
          Have questions or need a personalized quote? Our team is happy to discuss your requirements, answer your questions, and help you plan your perfect event.
          <br />
          <strong style={{ color: 'var(--color-sage)', display: 'block', marginTop: '6px' }}>
            Call us directly — we&apos;re happy to help!
          </strong>
        </p>

        {/* Number Box */}
        <div
          style={{
            background: 'linear-gradient(135deg, #FAF8F5 0%, #F5F0E8 100%)',
            border: '1.5px solid var(--border-gold)',
            borderRadius: '16px',
            padding: '18px 20px',
            marginBottom: '26px'
          }}
        >
          <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-mauve-dark)', fontWeight: 600, marginBottom: '6px' }}>
            {companyName}
          </div>
          <div
            style={{
              fontSize: 'clamp(1.5rem, 5vw, 1.85rem)',
              fontWeight: 700,
              color: 'var(--color-sage)',
              letterSpacing: '0.02em',
              fontVariantNumeric: 'tabular-nums'
            }}
          >
            {phoneDisplay}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            📍 {address} • ⏰ {workingHours}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleCopyNumber}
            className="btn btn-outline"
            style={{
              flex: '1 1 180px',
              padding: '14px 20px',
              fontSize: '0.95rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: copied ? '#EDF3ED' : '#FFFFFF',
              borderColor: copied ? 'var(--color-sage)' : 'var(--border-subtle)',
              color: copied ? 'var(--color-sage)' : 'inherit',
              transition: 'all 0.2s ease'
            }}
          >
            {copied ? (
              <>
                <span style={{ color: '#2E7D32', fontWeight: 'bold' }}>✓</span>
                Number Copied!
              </>
            ) : (
              <>
                <svg style={{ width: '16px', height: '16px', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }} viewBox="0 0 24 24">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy Number
              </>
            )}
          </button>
        </div>

        {/* Native phone dialer note */}
        <p style={{ fontSize: '0.74rem', color: 'var(--text-light)', marginTop: '16px', marginBottom: 0 }}>
          💡 On mobile devices, &ldquo;Call Now&rdquo; opens your phone&apos;s native dialer ready to connect.
        </p>
      </div>

      <style jsx>{`
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .call-pulse-icon {
          animation: ringPulse 2.4s ease-in-out infinite;
        }
        @keyframes ringPulse {
          0%, 100% { transform: scale(1) rotate(0deg); }
          10%, 30% { transform: scale(1.1) rotate(-8deg); }
          20%, 40% { transform: scale(1.1) rotate(8deg); }
          50% { transform: scale(1) rotate(0deg); }
        }
        .modal-close-btn:hover {
          background: var(--color-sage) !important;
          color: #FFFFFF !important;
          transform: rotate(90deg);
        }
      `}</style>
    </div>
  );
}
