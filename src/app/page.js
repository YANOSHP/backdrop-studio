'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CATEGORIES } from '@/lib/categories';
import SocialCards from '@/components/ui/card-fan-carousel';
import WorksWheel from '@/components/ui/works-wheel';
import ContactCallModal from '@/components/ui/ContactCallModal';
import { COMPANY_CONTACT, buildWhatsAppQuoteUrl } from '@/lib/whatsapp';

export default function Home() {
  const [backdrops, setBackdrops] = useState([]);
  const [company, setCompany] = useState({
    name: 'FlowerSpot Events & Wedding Planners',
    tagline: 'Grand Stage Backdrops, Fresh Floral Artistry & Concert-Grade AV Setup',
    city: 'Coimbatore, Tamil Nadu',
    address: 'Shop No.B6, Poomarket, Coimbatore - 641001.',
    phone: '+91 80984 15066',
    whatsapp: '918098415066',
    instagram: 'flow_erspot_events',
    workingHours: 'Open Every Day: 24/7',
    experienceYears: '6+',
    completedEvents: '500+',
    googleMapsUrl: 'https://maps.app.goo.gl/iL3jNKRZjuhBiK7n9'
  });

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeModalBackdrop, setActiveModalBackdrop] = useState(null);
  const [carouselItems, setCarouselItems] = useState([]);

  // Call Modal State
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);

  // Mobile Navigation Drawer State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Mobile Services Active Tab State
  const [mobileActiveService, setMobileActiveService] = useState(0);
  const [mobileShowAllServices, setMobileShowAllServices] = useState(false);

  const handleOpenCallModal = () => {
    setIsCallModalOpen(true);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  const instagramHandle = company.instagram
    ? company.instagram.replace(/^@/, '').replace(/https?:\/\/(www\.)?instagram\.com\/?/, '').replace(/\/$/, '')
    : 'flow_erspot_events';

  const instagramUrl = company.instagram && company.instagram.startsWith('http')
    ? company.instagram
    : `https://www.instagram.com/${instagramHandle}/`;

  // Instagram Reels items dynamically powered by real studio setups
  const instagramReels = [
    {
      id: 'reel-1',
      title: 'Grand Royal Muhurtham Mandap',
      tag: 'Muhurtham • Traditional',
      location: 'Codissia Hall, Coimbatore',
      views: '18.4K',
      image: carouselItems[0]?.imageUrl || ''
    },
    {
      id: 'reel-2',
      title: 'Heritage Jasmine & Lotus Temple Stage',
      tag: 'Fresh Flowers • Scented',
      location: 'Sri Krishna Mahal, Coimbatore',
      views: '24.1K',
      image: carouselItems[1]?.imageUrl || ''
    },
    {
      id: 'reel-3',
      title: 'Concert LED Video Wall & Sharpy Beams',
      tag: 'LED Wall • Sangeet Night',
      location: 'The Residency Towers, Coimbatore',
      views: '32.8K',
      image: carouselItems[2]?.imageUrl || ''
    },
    {
      id: 'reel-4',
      title: 'Marigold Bohemian Haldi Swing & Dhol',
      tag: 'Haldi & Mehendi • Daytime',
      location: 'Private Villa, Pollachi',
      views: '15.9K',
      image: carouselItems[3]?.imageUrl || ''
    },
    {
      id: 'reel-5',
      title: 'Pastel Floral Arch Reception Walkway',
      tag: 'Reception • Luxury Walkway',
      location: 'Le Méridien, Coimbatore',
      views: '29.3K',
      image: carouselItems[4]?.imageUrl || ''
    }
  ];

  /**
   * Smoothly navigates to the "Get Instant Quote" section on the page,
   * pre-fills the requested service / backdrop, and focuses the form.
   */
  const navigateToQuote = (service = '', backdropTitle = '', note = '') => {
    // Reset submitted state so the form is visible and interactive
    setQuoteSubmitted(false);

    if (service) {
      const matched = CATEGORIES.find(
        (c) => c.name.toLowerCase() === service.toLowerCase()
      );
      setQuoteType(matched ? matched.name : service);
    }

    if (backdropTitle) {
      setQuoteSelectedBackdrop(backdropTitle);
    }

    if (note) {
      setQuoteNotes((prev) => (prev ? `${prev}\n${note}` : note));
    }

    if (typeof document !== 'undefined') {
      const quoteSection = document.getElementById('quote');
      if (quoteSection) {
        quoteSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => {
          const nameInput = document.getElementById('quote-name-input');
          if (nameInput) {
            nameInput.focus();
          }
        }, 500);
      }
    }
  };

  // Quote Form State
  const [quoteName, setQuoteName] = useState('');
  const [quotePhone, setQuotePhone] = useState('');
  const [quoteEmail, setQuoteEmail] = useState('');
  const [quoteDate, setQuoteDate] = useState('');
  const [quoteType, setQuoteType] = useState('Wedding Decorations');
  const [quoteSelectedBackdrop, setQuoteSelectedBackdrop] = useState('');
  // Dedicated Venue Details State
  const [quoteVenueName, setQuoteVenueName] = useState('');
  const [quoteVenueCity, setQuoteVenueCity] = useState('');
  const [quoteVenueType, setQuoteVenueType] = useState('Kalyana Mandapam / Marriage Mahal');
  const [quoteVenueSetting, setQuoteVenueSetting] = useState('Indoor AC Hall');
  const [quoteStageDimensions, setQuoteStageDimensions] = useState('');
  const [quoteVenueLandmark, setQuoteVenueLandmark] = useState('');
  const [quoteBudget, setQuoteBudget] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [quoteSubmitted, setQuoteSubmitted] = useState(false);
  const [submittedWhatsAppUrl, setSubmittedWhatsAppUrl] = useState('');
  const [submittedRawMessage, setSubmittedRawMessage] = useState('');
  const [copiedQuoteMessage, setCopiedQuoteMessage] = useState(false);
  const [minEventDate, setMinEventDate] = useState('');

  useEffect(() => {
    // Set minimum event date on client mount to avoid unstable prerender dates
    setMinEventDate(new Date().toISOString().split('T')[0]);

    async function loadData() {
      try {
        const [bdRes, compRes, carRes] = await Promise.all([
          fetch('/api/backdrops'),
          fetch('/api/company'),
          fetch('/api/carousel')
        ]);
        const bdData = await bdRes.json();
        const compData = await compRes.json();
        const carData = await carRes.json();
        if (Array.isArray(bdData)) setBackdrops(bdData);
        if (compData && compData.name) setCompany(compData);
        if (Array.isArray(carData)) setCarouselItems(carData);
      } catch (err) {
        console.error('Failed to load website data:', err);
      }
    }
    loadData();
  }, []);

  // Prepare cards dynamically from admin-uploaded carousel photos
  const carouselCards = carouselItems
    .filter((item) => item.active !== false && item.imageUrl)
    .map((item) => ({
      imgUrl: item.imageUrl,
      alt: item.alt || item.title || 'FlowerSpot Stage Setup',
      linkUrl: item.linkUrl || '#backdrops'
    }));

  // Service items for WorksWheel (White theme, NO images, rich service info)
  const servicesWheelItems = CATEGORIES.map((service) => ({
    title: service.name,
    icon: service.icon,
    badge: service.badge,
    description: service.serviceDesc,
    highlights: service.highlights,
    href: '#services',
  }));

  // Filter backdrops when a specific category is chosen
  const filteredBackdrops = selectedCategory === 'All'
    ? backdrops
    : backdrops.filter((b) => b.category?.toLowerCase() === selectedCategory.toLowerCase());

  const currentCategoryMeta = CATEGORIES.find(
    (c) => c.name.toLowerCase() === selectedCategory.toLowerCase()
  );

  function handleResetQuote() {
    setQuoteName('');
    setQuotePhone('');
    setQuoteEmail('');
    setQuoteDate('');
    setQuoteType('Wedding Decorations');
    setQuoteSelectedBackdrop('');
    setQuoteVenueName('');
    setQuoteVenueCity('');
    setQuoteVenueType('Kalyana Mandapam / Marriage Mahal');
    setQuoteVenueSetting('Indoor AC Hall');
    setQuoteStageDimensions('');
    setQuoteVenueLandmark('');
    setQuoteBudget('');
    setQuoteNotes('');
    setQuoteSubmitted(false);
    setSubmittedWhatsAppUrl('');
    setSubmittedRawMessage('');
    setCopiedQuoteMessage(false);
  }

  async function handleQuoteSubmit(e) {
    e.preventDefault();
    const payload = {
      name: quoteName,
      phone: quotePhone,
      email: quoteEmail || undefined,
      eventDate: quoteDate,
      eventType: quoteType,
      selectedBackdrop: quoteSelectedBackdrop || 'General Inquiry',
      venueName: quoteVenueName,
      venueCity: quoteVenueCity,
      venueType: quoteVenueType,
      venueSetting: quoteVenueSetting,
      stageDimensions: quoteStageDimensions,
      venueLandmark: quoteVenueLandmark,
      budget: quoteBudget || undefined,
      notes: quoteNotes
    };

    try {
      await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.error(e);
    }

    const fullVenueAndReqs = [
      quoteVenueName ? `Venue / Hall: ${quoteVenueName} (${quoteVenueCity || 'Coimbatore'})` : (quoteVenueCity ? `City: ${quoteVenueCity}` : ''),
      quoteSelectedBackdrop && quoteSelectedBackdrop !== 'General Inquiry' ? `Preferred Backdrop: ${quoteSelectedBackdrop}` : '',
      quoteVenueType ? `Venue Type: ${quoteVenueType}` : '',
      quoteStageDimensions ? `Stage Dimensions: ${quoteStageDimensions}` : '',
      quoteNotes ? quoteNotes : ''
    ].filter(Boolean).join('\n');

    const { url, rawMessage } = buildWhatsAppQuoteUrl({
      fullName: quoteName,
      whatsappNumber: quotePhone,
      email: quoteEmail,
      service: quoteType,
      eventDate: quoteDate,
      location: quoteVenueName ? `${quoteVenueName}, ${quoteVenueCity || 'Coimbatore'}` : (quoteVenueCity || 'Coimbatore'),
      budget: quoteBudget,
      requirements: fullVenueAndReqs || undefined,
      recipientNumber: company.whatsapp || COMPANY_CONTACT.whatsappNumber
    });

    setSubmittedWhatsAppUrl(url);
    setSubmittedRawMessage(rawMessage);
    setQuoteSubmitted(true);

    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
  }

  return (
    <>
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div style={{
        background: 'var(--color-sage)',
        color: '#E8ECE8',
        fontSize: '0.8rem',
        padding: '7px 20px',
        textAlign: 'center',
        fontWeight: 500,
        letterSpacing: '0.04em'
      }}>
        📍Located in Poomarket, Coimbatore | Serving Weddings &amp; Celebrations Across Tamil Nadu &amp; Kerala |{' '}
        <button
          type="button"
          onClick={handleOpenCallModal}
          style={{
            background: 'none',
            border: 'none',
            color: '#FFFFFF',
            fontWeight: 600,
            textDecoration: 'underline',
            cursor: 'pointer',
            padding: 0,
            font: 'inherit'
          }}
        >
          Call: {company.phone}
        </button>
      </div>

      {/* 2. NAVIGATION BAR */}
      <header className="navbar">
        <div className="container nav-inner">
          <Link href="/" className="logo-wrapper">
            <img
              src="/logo-transparent.png"
              alt="FlowerSpot Logo"
              className="logo-image"
            />
            <div className="logo-text">
              <h2>FlowerSpot</h2>
              <span>Events &amp; Planners • {company.city ? company.city.split(',')[0] : 'Coimbatore'}</span>
            </div>
          </Link>

          <nav>
            <ul className="nav-links">
              <li><a href="#backdrops">Backdrop Catalogue</a></li>
              <li><a href="#services">Our Services</a></li>
              <li><a href="#quote">Get Instant Quote</a></li>
              <li><a href="#company">About &amp; Location</a></li>
            </ul>
          </nav>

          <div className="nav-actions">
            <button
              type="button"
              onClick={() => navigateToQuote()}
              className="btn btn-whatsapp"
              style={{ padding: '9px 18px', fontSize: '0.85rem' }}
            >
              💬 WhatsApp
            </button>

            {/* Mobile Hamburger Menu Toggle Button (Visible ONLY in Mobile View) */}
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE OFF-CANVAS SIDE DRAWER (Visible ONLY in Mobile View) */}
      <div
        className={`mobile-drawer-backdrop ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden={!isMobileMenuOpen}
      />

      <aside
        className={`mobile-side-drawer ${isMobileMenuOpen ? 'open' : ''}`}
        aria-label="Mobile Navigation"
      >
        <div className="mobile-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/logo.png" alt="FlowerSpot" style={{ height: '36px', width: 'auto', borderRadius: '8px' }} />
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--color-sage)', fontFamily: 'var(--font-serif)', fontWeight: 700 }}>
                FlowerSpot
              </h3>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-mauve-dark)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Events &amp; Planners
              </span>
            </div>
          </div>
          <button
            type="button"
            className="mobile-drawer-close"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav className="mobile-drawer-nav">
          <ul className="mobile-drawer-list">
            <li>
              <a
                href="#backdrops"
                onClick={() => setIsMobileMenuOpen(false)}
                className="mobile-drawer-link"
              >
                <span className="mobile-link-icon">📸</span>
                <div className="mobile-link-text">
                  <strong>Backdrop Catalogue</strong>
                  <span>Browse 9 event verticals &amp; setups</span>
                </div>
                <span className="mobile-link-arrow">→</span>
              </a>
            </li>
            <li>
              <a
                href="#services"
                onClick={() => setIsMobileMenuOpen(false)}
                className="mobile-drawer-link"
              >
                <span className="mobile-link-icon">👑</span>
                <div className="mobile-link-text">
                  <strong>Our Services</strong>
                  <span>Complete decors, mandaps &amp; LED AV</span>
                </div>
                <span className="mobile-link-arrow">→</span>
              </a>
            </li>
            <li>
              <a
                href="#quote"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigateToQuote();
                }}
                className="mobile-drawer-link highlight"
              >
                <span className="mobile-link-icon">⚡</span>
                <div className="mobile-link-text">
                  <strong>Get Instant Quote</strong>
                  <span>WhatsApp quotation within 15 mins</span>
                </div>
                <span className="mobile-link-arrow">→</span>
              </a>
            </li>
            <li>
              <a
                href="#company"
                onClick={() => setIsMobileMenuOpen(false)}
                className="mobile-drawer-link"
              >
                <span className="mobile-link-icon">📍</span>
                <div className="mobile-link-text">
                  <strong>About &amp; Location</strong>
                  <span>Poomarket store, timings &amp; maps</span>
                </div>
                <span className="mobile-link-arrow">→</span>
              </a>
            </li>
            <li>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => setIsMobileMenuOpen(false)}
                className="mobile-drawer-link"
              >
                <span className="mobile-link-icon">📷</span>
                <div className="mobile-link-text">
                  <strong>Live Instagram Reels</strong>
                  <span>@{instagramHandle}</span>
                </div>
                <span className="mobile-link-arrow">↗</span>
              </a>
            </li>
          </ul>
        </nav>

        {/* Direct CTA Buttons inside Drawer */}
        <div className="mobile-drawer-cta">
          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(false);
              navigateToQuote();
            }}
            className="btn btn-whatsapp"
            style={{ width: '100%', padding: '12px', fontSize: '0.9rem', marginBottom: '10px' }}
          >
            💬 Chat on WhatsApp
          </button>
          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(false);
              handleOpenCallModal();
            }}
            className="btn btn-outline"
            style={{ width: '100%', padding: '12px', fontSize: '0.9rem' }}
          >
            📞 Call: {company.phone}
          </button>
        </div>

        <div className="mobile-drawer-footer">
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            📍 {company.address}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '0.74rem', color: 'var(--color-sage)', fontWeight: 600 }}>
            {company.workingHours}
          </p>
        </div>
      </aside>

      {/* 3. HERO SHOWCASE WITH CARD FAN CAROUSEL */}
      <section className="hero-section" style={{ padding: '40px 0 30px', overflow: 'hidden' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '860px', margin: '0 auto 20px' }}>
          <div className="hero-badges" style={{ justifyContent: 'center', marginBottom: '14px' }}>
            <span className="badge badge-gold">⭐ Luxury Event Production</span>
            <span className="badge badge-sage">📍 Poomarket, Coimbatore</span>
          </div>
          <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', lineHeight: 1.15, marginBottom: '14px' }}>
            Grand Stage Backdrops &amp; <span>Event Decors</span>
          </h1>
          <p className="hero-desc" style={{ maxWidth: '680px', margin: '0 auto 20px', fontSize: '1.02rem', color: 'var(--text-muted)' }}>
            Fanning through our real stage productions, Muhurtham mandaps, and concert LED walls. Click, drag, or swipe through our collection below.
          </p>

          <div className="hero-cta-group" style={{ justifyContent: 'center', marginBottom: '10px' }}>
            <a href="#backdrops" className="btn btn-primary">
              Explore The Collections ↓
            </a>
            <button
              type="button"
              onClick={() => navigateToQuote('', '', 'Hi! I would like to book a consultation for an upcoming event stage setup.')}
              className="btn btn-gold"
            >
              Chat on WhatsApp
            </button>
          </div>
        </div>

        {/* 3D Card Fan Carousel */}
        <div style={{ width: '100%', maxWidth: '100vw', overflow: 'visible', margin: '10px auto' }}>
          <SocialCards cards={carouselCards} />
        </div>

        {/* Key Metrics */}
        <div className="container" style={{ marginTop: '10px' }}>
          <div className="hero-stats" style={{ maxWidth: '820px', margin: '0 auto' }}>
            <div className="stat-item">
              <h3>{company.completedEvents}</h3>
              <p>Events Executed</p>
            </div>
            <div className="stat-item">
              <h3>{company.experienceYears}</h3>
              <p>Years in Coimbatore</p>
            </div>
            <div className="stat-item">
              <h3>{carouselCards.length > 0 ? `${carouselCards.length}` : (company.completedEvents || '500+')}</h3>
              <p>Stage Setups</p>
            </div>
            <div className="stat-item">
              <h3>9</h3>
              <p>Curated Verticals</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. INSTAGRAM REELS & LIVE EVENT SHOWCASE */}
      <section id="instagram" style={{
        background: '#FFFFFF',
        padding: '85px 0 75px',
        borderTop: '1px solid #ECE7E1',
        borderBottom: '1px solid #ECE7E1',
        position: 'relative'
      }}>
        <div className="container">
          {/* Header */}
          <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 40px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 18px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #F58529, #DD2A7B, #8134AF)',
              color: '#FFFFFF',
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: '16px',
              boxShadow: '0 4px 16px rgba(221, 42, 123, 0.25)'
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
              Watch On Instagram
            </div>

            <h2 style={{ fontSize: 'clamp(2.2rem, 4vw, 2.8rem)', color: 'var(--color-sage)', margin: '0 0 16px', lineHeight: 1.2 }}>
              Real Celebrations in Motion
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.02rem', lineHeight: '1.6', margin: '0 auto 28px' }}>
              Step behind the curtain. Explore our real event transformations, Muhurtham timelapses and fresh floral setups filmed live on-site across Coimbatore.
            </p>

            {/* Instagram Profile Social Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '20px',
              background: '#FAF8F5',
              border: '1.5px solid #EAE3D9',
              borderRadius: '16px',
              padding: '12px 20px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  padding: '2.5px',
                  background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                    <img src="/logo.png" alt="FlowerSpot" style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
                  </div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.98rem', color: '#1D2620' }}>
                      @{instagramHandle}
                    </span>
                    <span style={{ color: '#0095F6', fontSize: '0.9rem' }} title="Verified Profile">●</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    FlowerSpot Events • 500+ Setup Videos
                  </span>
                </div>
              </div>

              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: 'linear-gradient(135deg, #F58529, #DD2A7B, #8134AF)',
                  color: '#FFFFFF',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(221, 42, 123, 0.28)',
                  transition: 'transform 0.2s ease'
                }}
              >
                <span>Follow on Instagram</span>
                <span>↗</span>
              </a>
            </div>
          </div>

          {/* Reels Preview Grid (5 Distinct Verticals) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '18px',
            marginBottom: '36px'
          }}>
            {instagramReels.map((reel) => (
              <a
                key={reel.id}
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'block',
                  position: 'relative',
                  borderRadius: '18px',
                  overflow: 'hidden',
                  aspectRatio: '9/14',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                  textDecoration: 'none',
                  color: '#FFFFFF',
                  background: '#1A1F1B',
                  border: '1px solid rgba(0,0,0,0.06)',
                  cursor: 'pointer'
                }}
                className="instagram-reel-card"
              >
                {/* Image Background or Clean Video Frame */}
                {reel.image ? (
                  <img
                    src={reel.image}
                    alt={reel.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      transition: 'transform 0.4s ease'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, #1C271F 0%, #2E3E32 50%, #151F18 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    padding: '24px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.6rem',
                      marginBottom: '10px'
                    }}>
                      📹
                    </div>
                    <span style={{ fontSize: '0.85rem', color: '#E8E3DC', fontWeight: 600 }}>Watch Live Video</span>
                  </div>
                )}

                {/* Dark Cinematic Gradient Overlay */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.85) 100%)',
                  pointerEvents: 'none'
                }} />

                {/* Top Badge: Reels Info */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  right: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  pointerEvents: 'none'
                }}>
                  <span style={{
                    background: 'rgba(0, 0, 0, 0.55)',
                    backdropFilter: 'blur(8px)',
                    color: '#FFFFFF',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    padding: '4px 9px',
                    borderRadius: '999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <span>📹</span> {reel.views}
                  </span>
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.25)',
                    backdropFilter: 'blur(6px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    fontSize: '0.75rem'
                  }}>
                    📷
                  </div>
                </div>

                {/* Center Play Button Overlay */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.88)',
                  backdropFilter: 'blur(8px)',
                  color: '#1D2620',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  paddingLeft: '3px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  transition: 'all 0.25s ease'
                }} className="reel-play-btn">
                  ▶
                </div>

                {/* Bottom Details */}
                <div style={{
                  position: 'absolute',
                  bottom: '14px',
                  left: '14px',
                  right: '14px',
                  pointerEvents: 'none'
                }}>
                  <span style={{
                    display: 'inline-block',
                    fontSize: '0.7rem',
                    color: '#FFDE8A',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    marginBottom: '4px'
                  }}>
                    {reel.tag}
                  </span>
                  <h4 style={{
                    fontSize: '0.96rem',
                    fontWeight: 600,
                    lineHeight: '1.3',
                    margin: '0 0 4px',
                    color: '#FFFFFF'
                  }}>
                    {reel.title}
                  </h4>
                  <p style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.8)',
                    margin: '0 0 10px'
                  }}>
                    📍 {reel.location}
                  </p>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#FFFFFF',
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(6px)',
                    padding: '4px 10px',
                    borderRadius: '6px'
                  }}>
                    Watch Reel on Instagram ↗
                  </span>
                </div>
              </a>
            ))}
          </div>

          {/* Bottom Social Proof Bar */}
          <div style={{
            background: '#FAF8F5',
            borderRadius: '16px',
            border: '1px solid #EAE3D9',
            padding: '24px 30px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '18px'
          }}>
            <div>
              <h4 style={{ fontSize: '1.15rem', color: 'var(--color-sage)', margin: '0 0 4px', fontWeight: 700 }}>
                Looking for Video Walkthroughs of Your Venue?
              </h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
                We frequently film at all over Tamil Nadu. Check our reels or DM us.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="btn"
                style={{
                  background: 'linear-gradient(135deg, #F58529, #DD2A7B, #8134AF)',
                  color: '#FFFFFF',
                  padding: '10px 22px',
                  borderRadius: '10px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(221, 42, 123, 0.25)'
                }}
              >
                <span>📸</span> View 100+ Reels on Instagram
              </a>
              <a
                href="#backdrops"
                className="btn btn-primary"
                style={{ padding: '10px 22px', fontSize: '0.88rem' }}
              >
                Explore Catalogue Below ↓
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 5. BACKDROP CATALOGUE SECTION */}
      <section id="backdrops" style={{ padding: '90px 0', background: 'var(--color-bg)' }}>
        <div className="container">
          <div className="section-header">
            <span className="badge badge-sage">Portfolio</span>
            <h2>Backdrop &amp; Event Catalogue</h2>
            <p>
              Explore our nine curated event decoration &amp; production verticals. Browse category collections below to view real stage setups, specifications, and floral artistry.
            </p>
          </div>

          {/* Category Filter Pills (9 Categories + All) */}
          <div className="filter-bar">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`filter-btn ${selectedCategory === 'All' ? 'active' : ''}`}
            >
              All Categories (9)
            </button>
            {CATEGORIES.map((cat) => {
              const count = backdrops.filter((b) => b.category?.toLowerCase() === cat.name.toLowerCase()).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`filter-btn ${selectedCategory === cat.name ? 'active' : ''}`}
                >
                  {cat.icon} {cat.name} {count > 0 ? `(${count})` : ''}
                </button>
              );
            })}
          </div>

          {/* VIEW MODE 1: ALL 9 CATEGORIES OVERVIEW */}
          {selectedCategory === 'All' && (
            <div className="catalogue-grid">
              {CATEGORIES.map((cat) => {
                const catBackdrops = backdrops.filter(
                  (b) => b.category?.toLowerCase() === cat.name.toLowerCase()
                );
                const primaryImage = catBackdrops.find((b) => b.image)?.image;

                return (
                  <div key={cat.id} className="catalogue-card">
                    {/* Designated Image Area or Clean Admin Placeholder */}
                    {primaryImage ? (
                      <div
                        className="backdrop-image-wrap"
                        style={{ aspectRatio: '16/10' }}
                        onClick={() => setSelectedCategory(cat.name)}
                      >
                        <span className="badge badge-sage backdrop-badge-pos">
                          {cat.icon} {cat.name}
                        </span>
                        <img src={primaryImage} alt={cat.name} />
                        <span className="backdrop-zoom-hint">
                          📂 {catBackdrops.length} {catBackdrops.length === 1 ? 'Setup' : 'Setups'} Available
                        </span>
                      </div>
                    ) : (
                      <div
                        className="placeholder-photo-box"
                        onClick={() => setSelectedCategory(cat.name)}
                        style={{ cursor: 'pointer' }}
                      >
                        <span className="badge badge-gold backdrop-badge-pos" style={{ top: '12px', left: '12px' }}>
                          {cat.icon} {cat.name}
                        </span>
                        <div className="placeholder-icon">{cat.icon}</div>
                        <span className="placeholder-tag">Admin Photo Placeholder</span>
                        <p className="placeholder-hint">
                          Awaiting Company Photos • Ready for Admin Upload
                        </p>
                      </div>
                    )}

                    {/* Catalogue Card Body */}
                    <div className="catalogue-card-body">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-mauve-dark)', fontWeight: 600 }}>
                          {cat.badge}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 500 }}>
                          {catBackdrops.length} {catBackdrops.length === 1 ? 'Photo' : 'Photos'}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.4rem', color: 'var(--color-sage)', marginBottom: '8px' }}>
                        {cat.name}
                      </h3>

                      <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '16px', flexGrow: 1 }}>
                        {cat.shortDesc}
                      </p>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
                        {cat.highlights.slice(0, 3).map((item, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '0.72rem',
                              padding: '3px 8px',
                              background: '#F3EDE6',
                              borderRadius: '4px',
                              color: 'var(--color-sage)'
                            }}
                          >
                            ✓ {item}
                          </span>
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                        <button
                          onClick={() => setSelectedCategory(cat.name)}
                          className="btn btn-primary"
                          style={{ flex: 1, padding: '10px 14px', fontSize: '0.85rem' }}
                        >
                          View Collection →
                        </button>
                        <button
                          type="button"
                          onClick={() => navigateToQuote(cat.name, '', `Hello! I would like to inquire about ${cat.name} setup for my upcoming event.`)}
                          className="btn btn-whatsapp"
                          style={{ padding: '10px 14px', fontSize: '0.85rem' }}
                        >
                          💬 Quote
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW MODE 2: DEDICATED CATEGORY COLLECTION GALLERY */}
          {selectedCategory !== 'All' && (
            <div>
              {/* Category Active Header */}
              <div style={{
                background: 'var(--color-surface)',
                borderRadius: '16px',
                padding: '24px 30px',
                border: '1px solid var(--border-subtle)',
                marginBottom: '32px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '1.8rem' }}>{currentCategoryMeta?.icon}</span>
                    <h3 style={{ fontSize: '1.8rem', color: 'var(--color-sage)', margin: 0 }}>
                      {selectedCategory}
                    </h3>
                    <span className="badge badge-gold">{currentCategoryMeta?.badge}</span>
                  </div>
                  <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', margin: 0, maxWidth: '650px' }}>
                    {currentCategoryMeta?.serviceDesc || currentCategoryMeta?.shortDesc}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setSelectedCategory('All')}
                    className="btn btn-outline"
                    style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                  >
                    ← Back to All 9 Categories
                  </button>
                </div>
              </div>

              {/* Photos Gallery for Selected Category */}
              {filteredBackdrops.length > 0 ? (
                <div className="backdrop-grid">
                  {filteredBackdrops.map((item) => (
                    <div key={item.id} className="backdrop-card">
                      <div
                        className="backdrop-image-wrap"
                        onClick={() => setActiveModalBackdrop(item)}
                      >
                        <span className="badge badge-sage backdrop-badge-pos">
                          {item.category}
                        </span>
                        {item.image ? (
                          <img src={item.image} alt={item.title} />
                        ) : (
                          <div className="placeholder-photo-box" style={{ height: '100%' }}>
                            <div className="placeholder-icon">📷</div>
                            <span className="placeholder-tag">Photo Placeholder</span>
                            <p className="placeholder-hint">Uploaded entry without image</p>
                          </div>
                        )}
                        <span className="backdrop-zoom-hint">🔍 View Fullscreen</span>
                      </div>

                      <div className="backdrop-body">
                        <h3 className="backdrop-title">{item.title}</h3>
                        <p className="backdrop-desc">{item.description}</p>

                        <div className="backdrop-meta">
                          <span>Size: <strong>{item.dimensions}</strong></span>
                          <span>For: <strong>{item.idealFor || 'All Events'}</strong></span>
                        </div>

                        <div className="backdrop-actions">
                          <button
                            onClick={() => setActiveModalBackdrop(item)}
                            className="btn btn-outline"
                          >
                            Inspect Specs
                          </button>
                          <button
                            type="button"
                            onClick={() => navigateToQuote(item.category, item.title, `Interested in booking the "${item.title}" (${item.category}). Please provide quotation and availability.`)}
                            className="btn btn-whatsapp"
                          >
                            WhatsApp Quote
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Elegant Empty Placeholder State */
                <div style={{
                  textAlign: 'center',
                  padding: '70px 30px',
                  background: 'var(--color-surface)',
                  borderRadius: '20px',
                  border: '2px dashed rgba(184, 150, 92, 0.45)',
                  maxWidth: '750px',
                  margin: '0 auto 60px'
                }}>
                  <div style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    background: 'var(--color-mauve-tint)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.2rem',
                    margin: '0 auto 18px'
                  }}>
                    {currentCategoryMeta?.icon || '📷'}
                  </div>

                  <span className="badge badge-gold" style={{ marginBottom: '12px' }}>
                    Admin Photo Placeholder
                  </span>

                  <h3 style={{ fontSize: '1.8rem', color: 'var(--color-sage)', marginBottom: '10px' }}>
                    No Photos Uploaded for {selectedCategory} Yet
                  </h3>

                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '520px', margin: '0 auto 24px', lineHeight: '1.6' }}>
                    Custom stage designs, live floral artistry, and tailored backdrops are available for {selectedCategory}. Inquire with our event team for design portfolios, venue compatibility, and quotation.
                  </p>

                  <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => navigateToQuote(selectedCategory, '', `Inquiring for custom stage designs and quotations for ${selectedCategory}.`)}
                      className="btn btn-whatsapp"
                      style={{ padding: '10px 22px' }}
                    >
                      💬 Inquire on WhatsApp
                    </button>
                    <button
                      onClick={() => setSelectedCategory('All')}
                      className="btn btn-outline"
                      style={{ padding: '10px 20px' }}
                    >
                      ← Browse Other Collections
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 5. FULLSCREEN LIGHTBOX MODAL */}
      {activeModalBackdrop && (
        <div className="modal-backdrop" onClick={() => setActiveModalBackdrop(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setActiveModalBackdrop(null)}>✕</button>

            <div className="modal-img-wrap">
              {activeModalBackdrop.image ? (
                <img src={activeModalBackdrop.image} alt={activeModalBackdrop.title} />
              ) : (
                <div style={{ padding: '60px', textAlign: 'center', color: '#FFF' }}>
                  <div style={{ fontSize: '3rem' }}>📷</div>
                  <p>Admin Photo Placeholder</p>
                </div>
              )}
            </div>

            <div className="modal-details">
              <span className="badge badge-gold" style={{ alignSelf: 'flex-start', marginBottom: '12px' }}>
                {activeModalBackdrop.category}
              </span>
              <h2 style={{ fontSize: '2rem', lineHeight: '1.2', marginBottom: '14px' }}>
                {activeModalBackdrop.title}
              </h2>
              <p style={{ fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '20px' }}>
                {activeModalBackdrop.description}
              </p>

              <div style={{ background: '#FAF8F5', borderRadius: '12px', padding: '16px', marginBottom: '22px' }}>
                <div style={{ fontSize: '0.85rem', marginBottom: '8px' }}>
                  <strong>Stage Dimension:</strong> {activeModalBackdrop.dimensions}
                </div>
                <div style={{ fontSize: '0.85rem', marginBottom: '8px' }}>
                  <strong>Best Suited For:</strong> {activeModalBackdrop.idealFor}
                </div>
                {activeModalBackdrop.included && activeModalBackdrop.included.length > 0 && (
                  <div>
                    <strong style={{ fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Elements Included:</strong>
                    <ul style={{ paddingLeft: '20px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {activeModalBackdrop.included.map((inc, idx) => (
                        <li key={idx}>{inc}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    const backdrop = activeModalBackdrop;
                    setActiveModalBackdrop(null);
                    navigateToQuote(
                      backdrop.category,
                      backdrop.title,
                      `Interested in booking "${backdrop.title}" (${backdrop.category}${backdrop.dimensions ? `, Stage: ${backdrop.dimensions}` : ''}). Please check pricing and availability.`
                    );
                  }}
                  className="btn btn-whatsapp"
                  style={{ flex: 1 }}
                >
                  Book Setup on WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveModalBackdrop(null);
                    handleOpenCallModal();
                  }}
                  className="btn btn-outline"
                >
                  Call Store
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. OUR SERVICES SECTION */}
      <section id="services" style={{ background: '#FFFFFF', padding: '70px 0 60px', borderTop: '1px solid #EAE5DE', borderBottom: '1px solid #EAE5DE' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 30px' }}>
          <span className="badge badge-mauve" style={{ marginBottom: '10px' }}>What We Provide</span>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', color: 'var(--color-sage)', margin: '10px 0 16px' }}>
            Our Comprehensive Event Services
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.6' }}>
            Browse all nine dedicated event production and floral artistry verticals with complete deliverables and instant quotation triggers.
          </p>
        </div>

        {/* Desktop View: Interactive 3D WorksWheel (Hidden on Mobile) */}
        <div className="services-desktop-wheel" style={{ width: '100%', height: '620px', position: 'relative' }}>
          <WorksWheel
            items={servicesWheelItems}
            label="Our Services"
            action="Get Instant Quote"
            onItemAction={(item) => navigateToQuote(item.title, '', `Inquiring about ${item.title} service: ${item.description || ''}`)}
          />
        </div>

        {/* Mobile View: Dedicated Full-Detail Services Cards Showcase (Visible ONLY on Mobile/Tablet) */}
        <div className="services-mobile-showcase" style={{ padding: '0 16px' }}>
          {/* Quick Category Selector Chips */}
          <div style={{
            display: 'flex',
            overflowX: 'auto',
            gap: '8px',
            paddingBottom: '14px',
            marginBottom: '16px',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch'
          }}>
            {CATEGORIES.map((cat, idx) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setMobileActiveService(idx)}
                style={{
                  flexShrink: 0,
                  padding: '9px 16px',
                  borderRadius: '24px',
                  fontSize: '0.84rem',
                  fontWeight: mobileActiveService === idx ? '700' : '500',
                  background: mobileActiveService === idx ? 'var(--color-sage)' : '#FAF8F5',
                  color: mobileActiveService === idx ? '#FFFFFF' : 'var(--color-sage)',
                  border: mobileActiveService === idx ? '1px solid var(--color-sage)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  boxShadow: mobileActiveService === idx ? '0 4px 12px rgba(38, 56, 43, 0.2)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>

          {/* Active Featured Service Card with ALL details fully visible */}
          {(() => {
            const currentCat = CATEGORIES[mobileActiveService] || CATEGORIES[0];
            return (
              <div style={{
                background: '#FFFFFF',
                borderRadius: '20px',
                border: '2px solid rgba(197, 160, 89, 0.35)',
                boxShadow: '0 14px 35px rgba(38, 56, 43, 0.1)',
                padding: '24px 20px',
                position: 'relative'
              }}>
                {/* Header: Icon, Badge & Counter */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: '#EDF3ED',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.4rem',
                      boxShadow: '0 2px 8px rgba(38, 56, 43, 0.08)'
                    }}>
                      {currentCat.icon}
                    </div>
                    <span style={{
                      fontSize: '0.72rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '20px',
                      background: '#FAF6ED',
                      color: '#8C6D3B',
                      border: '1px solid rgba(197, 160, 89, 0.35)'
                    }}>
                      {currentCat.badge}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)' }}>
                    {mobileActiveService + 1} of {CATEGORIES.length}
                  </span>
                </div>

                {/* Service Title */}
                <h3 style={{
                  fontSize: '1.35rem',
                  color: 'var(--color-sage)',
                  fontFamily: 'var(--font-serif)',
                  fontWeight: 700,
                  margin: '0 0 10px',
                  lineHeight: 1.25
                }}>
                  {currentCat.name}
                </h3>

                {/* Full Overview Description (100% visible, not clamped) */}
                <p style={{
                  fontSize: '0.9rem',
                  lineHeight: '1.65',
                  color: '#4A574E',
                  margin: '0 0 18px',
                  background: '#FAF8F5',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid #F0ECE1'
                }}>
                  {currentCat.serviceDesc}
                </p>

                {/* Deliverables Checklist (All details visible) */}
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--color-sage)',
                    fontWeight: 700,
                    margin: '0 0 10px'
                  }}>
                    Included Deliverables &amp; Specialties:
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {currentCat.highlights.map((hl, hIdx) => (
                      <li key={hIdx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '0.86rem',
                        color: 'var(--color-sage)',
                        fontWeight: 500
                      }}>
                        <span style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: '#E8F5E9',
                          color: '#2E7D32',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          flexShrink: 0
                        }}>
                          ✓
                        </span>
                        <span>{hl}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Direct Action Trigger */}
                <button
                  type="button"
                  onClick={() => navigateToQuote(currentCat.name, '', `Inquiring for ${currentCat.name}: ${currentCat.serviceDesc}`)}
                  className="btn btn-gold"
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginBottom: '14px'
                  }}
                >
                  ⚡ Get Instant Quote for {currentCat.name} →
                </button>

                {/* Card Navigation Controls */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: '1px solid #F0ECE1'
                }}>
                  <button
                    type="button"
                    onClick={() => setMobileActiveService((prev) => (prev > 0 ? prev - 1 : CATEGORIES.length - 1))}
                    style={{
                      background: '#FAF8F5',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '8px 14px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'var(--color-sage)',
                      cursor: 'pointer'
                    }}
                  >
                    ← Previous
                  </button>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    {CATEGORIES.map((_, dotIdx) => (
                      <button
                        key={dotIdx}
                        type="button"
                        onClick={() => setMobileActiveService(dotIdx)}
                        style={{
                          width: mobileActiveService === dotIdx ? '18px' : '6px',
                          height: '6px',
                          borderRadius: '3px',
                          background: mobileActiveService === dotIdx ? 'var(--color-gold)' : 'rgba(38, 56, 43, 0.2)',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        aria-label={`Go to service ${dotIdx + 1}`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setMobileActiveService((prev) => (prev < CATEGORIES.length - 1 ? prev + 1 : 0))}
                    style={{
                      background: '#FAF8F5',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '8px 14px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'var(--color-sage)',
                      cursor: 'pointer'
                    }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Toggle button to see all 9 cards stacked */}
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button
              type="button"
              onClick={() => setMobileShowAllServices(!mobileShowAllServices)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-sage)',
                fontSize: '0.86rem',
                fontWeight: 600,
                textDecoration: 'underline',
                cursor: 'pointer',
                padding: '6px 12px'
              }}
            >
              {mobileShowAllServices ? '▲ Collapse Services List' : '▼ View All 9 Services in a List'}
            </button>
          </div>

          {/* All 9 Services Stack (Shown when user expands) */}
          {mobileShowAllServices && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              {CATEGORIES.map((cat) => (
                <div
                  key={cat.id}
                  style={{
                    background: '#FAF8F5',
                    borderRadius: '16px',
                    border: '1.5px solid var(--border-subtle)',
                    padding: '18px 16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.2rem' }}>{cat.icon}</span>
                      <strong style={{ fontSize: '1.05rem', color: 'var(--color-sage)' }}>{cat.name}</strong>
                    </div>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '12px',
                      background: '#FAF6ED',
                      color: '#8C6D3B'
                    }}>
                      {cat.badge}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.55', margin: '0 0 12px' }}>
                    {cat.serviceDesc}
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {cat.highlights.map((hl, hlIdx) => (
                      <li key={hlIdx} style={{ fontSize: '0.8rem', color: 'var(--color-sage)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: 'var(--color-gold)', fontWeight: 700 }}>✓</span>
                        <span>{hl}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => navigateToQuote(cat.name, '', `Inquiring for ${cat.name}`)}
                    className="btn btn-outline"
                    style={{ width: '100%', padding: '10px', fontSize: '0.85rem' }}
                  >
                    Select {cat.name} &amp; Quote →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 7. QUICK QUOTE FORM & BOOKING */}
      <section id="quote" style={{ padding: '90px 0', background: 'var(--color-bg)' }}>
        <div className="container">
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: '24px',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-md)',
            padding: '50px 40px',
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
              <span className="badge badge-gold">Quick Estimate</span>
              <h2 style={{ fontSize: '2.4rem', margin: '10px 0' }}>Request a Fast Stage Quotation</h2>
              <p>Fill out the details below. Our team will verify date availability and send you a custom quotation via WhatsApp within 15 minutes.</p>
            </div>

            {quoteSubmitted ? (
              <div style={{
                background: '#F0F9F1',
                border: '1.5px solid #A5D6A7',
                borderRadius: '20px',
                padding: '40px 30px',
                textAlign: 'center',
                boxShadow: '0 8px 30px rgba(46, 125, 50, 0.08)'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#2E7D32',
                  color: '#FFFFFF',
                  fontSize: '2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 18px',
                  boxShadow: '0 4px 14px rgba(46, 125, 50, 0.3)'
                }}>
                  ✓
                </div>
                <h3 style={{ color: '#1B5E20', fontSize: '1.8rem', fontWeight: 700, marginBottom: '8px' }}>
                  Quotation Request Sent!
                </h3>
                <p style={{ color: '#2E7D32', fontSize: '1.02rem', maxWidth: '620px', margin: '0 auto 20px', lineHeight: '1.6' }}>
                  We opened WhatsApp with your custom event and venue quotation details. Our Coimbatore team will review availability and reply promptly!
                </p>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '22px' }}>
                  {submittedWhatsAppUrl && (
                    <a
                      href={submittedWhatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-whatsapp"
                      style={{ padding: '12px 24px', fontSize: '1rem', textDecoration: 'none' }}
                    >
                      💬 Open WhatsApp Again
                    </a>
                  )}
                  {submittedRawMessage && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(submittedRawMessage);
                        setCopiedQuoteMessage(true);
                        setTimeout(() => setCopiedQuoteMessage(false), 3000);
                      }}
                      className="btn btn-outline"
                      style={{ padding: '12px 20px', fontSize: '0.95rem' }}
                    >
                      {copiedQuoteMessage ? '✓ Copied to Clipboard!' : '📋 Copy Quote Message'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleResetQuote}
                    className="btn btn-primary"
                    style={{ padding: '12px 22px', fontSize: '0.95rem' }}
                  >
                    Submit Another Inquiry
                  </button>
                </div>

                {submittedRawMessage && (
                  <details style={{
                    marginTop: '20px',
                    textAlign: 'left',
                    background: '#FFFFFF',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    border: '1px solid #C8E6C9'
                  }}>
                    <summary style={{ cursor: 'pointer', fontSize: '0.85rem', color: '#2E7D32', fontWeight: 600 }}>
                      View Sent WhatsApp Message Details
                    </summary>
                    <pre style={{
                      marginTop: '12px',
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'inherit',
                      fontSize: '0.84rem',
                      lineHeight: '1.5',
                      color: '#263238',
                      background: '#F9FBE7',
                      padding: '12px',
                      borderRadius: '8px'
                    }}>
                      {submittedRawMessage}
                    </pre>
                  </details>
                )}
              </div>
            ) : (
              <div>
                {/* Visual badge when a specific backdrop was chosen */}
                {quoteSelectedBackdrop && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#FAF3E8',
                    border: '1.5px solid #E5C38B',
                    borderRadius: '14px',
                    padding: '12px 18px',
                    marginBottom: '24px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.3rem' }}>✨</span>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#8C6826', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                          Selected Stage Setup
                        </span>
                        <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-sage)' }}>
                          {quoteSelectedBackdrop}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setQuoteSelectedBackdrop('')}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #D1AC68',
                        borderRadius: '8px',
                        color: '#8C6826',
                        padding: '5px 12px',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      ✕ Clear Selection
                    </button>
                  </div>
                )}

                <form onSubmit={handleQuoteSubmit}>
                  {/* 1. Customer Contact Details */}
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="quote-name-input">Your Name *</label>
                      <input
                        id="quote-name-input"
                        name="fullName"
                        type="text"
                        autoComplete="name"
                        className="form-control"
                        placeholder="e.g. Ramesh Kumar"
                        value={quoteName}
                        onChange={(e) => setQuoteName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="quote-phone-input">Phone / WhatsApp Number *</label>
                      <input
                        id="quote-phone-input"
                        name="telephone"
                        type="tel"
                        autoComplete="tel"
                        className="form-control"
                        placeholder="e.g. 80984 15066"
                        value={quotePhone}
                        onChange={(e) => setQuotePhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* 2. Email & Budget Range (Optional) */}
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="quote-email-input">Email Address (Optional)</label>
                      <input
                        id="quote-email-input"
                        name="emailAddress"
                        type="email"
                        autoComplete="email"
                        className="form-control"
                        placeholder="e.g. ramesh@example.com"
                        value={quoteEmail}
                        onChange={(e) => setQuoteEmail(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="quote-budget-select">Estimated Budget (Optional)</label>
                      <select
                        id="quote-budget-select"
                        name="budgetRange"
                        className="form-control"
                        value={quoteBudget}
                        onChange={(e) => setQuoteBudget(e.target.value)}
                      >
                        <option value="">Select a Budget Range (Optional)</option>
                        <option value="Under ₹30,000">Under ₹30,000</option>
                        <option value="₹30,000 - ₹50,000">₹30,000 - ₹50,000</option>
                        <option value="₹50,000 - ₹1,00,000">₹50,000 - ₹1,00,000</option>
                        <option value="₹1,00,000 - ₹2,50,000">₹1,00,000 - ₹2,50,000</option>
                        <option value="₹2,50,000 - ₹5,00,000">₹2,50,000 - ₹5,00,000</option>
                        <option value="₹5,00,000+">₹5,00,000+</option>
                        <option value="Flexible / Open to Recommendations">Flexible / Open to Recommendations</option>
                      </select>
                    </div>
                  </div>

                  {/* 3. Event Essentials */}
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="quote-date-input">Tentative Event Date</label>
                      <input
                        id="quote-date-input"
                        name="eventDate"
                        type="date"
                        className="form-control"
                        value={quoteDate}
                        onChange={(e) => setQuoteDate(e.target.value)}
                        min={minEventDate || undefined}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="quote-type-select">Type of Event / Service *</label>
                      <select
                        id="quote-type-select"
                        name="serviceType"
                        className="form-control"
                        value={quoteType}
                        onChange={(e) => setQuoteType(e.target.value)}
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat.id} value={cat.name}>
                            {cat.icon} {cat.name}
                          </option>
                        ))}
                        <option value="General Stage Decoration">✨ General Stage Decoration &amp; Mandap</option>
                        <option value="Complete Wedding Package">👑 Complete Wedding Package (Stage + AV + Flowers)</option>
                      </select>
                    </div>
                  </div>

                  {/* 3. DEDICATED VENUE SECTION */}
                  <div style={{
                    background: '#FAF8F5',
                    border: '1.5px solid var(--border-subtle)',
                    borderRadius: '16px',
                    padding: '24px 22px',
                    margin: '24px 0 22px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: 'var(--color-sage)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                        flexShrink: 0
                      }}>
                        📍
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.15rem', margin: 0, color: 'var(--color-sage)', fontWeight: '700' }}>
                          Venue &amp; Location Details
                        </h3>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                          Provide your hall name or event place so we can plan the right stage dimensions and transport logistics.
                        </p>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label htmlFor="quote-venue-name-input">Venue / Hall / Mahal Name *</label>
                        <input
                          id="quote-venue-name-input"
                          name="venueName"
                          type="text"
                          className="form-control"
                          placeholder="e.g. Codissia Hall E, Sri Krishna Mahal, Residency Hotel, Home"
                          value={quoteVenueName}
                          onChange={(e) => setQuoteVenueName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label htmlFor="quote-venue-city-input">City / Town / Area *</label>
                        <input
                          id="quote-venue-city-input"
                          name="venueCity"
                          type="text"
                          autoComplete="address-level2"
                          className="form-control"
                          placeholder="e.g. Coimbatore, Peelamedu (or Tiruppur, Erode, Pollachi)"
                          value={quoteVenueCity}
                          onChange={(e) => setQuoteVenueCity(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label htmlFor="quote-venue-type-select">Venue Type</label>
                        <select
                          id="quote-venue-type-select"
                          name="venueType"
                          className="form-control"
                          value={quoteVenueType}
                          onChange={(e) => setQuoteVenueType(e.target.value)}
                        >
                          <option value="Kalyana Mandapam / Marriage Mahal">Kalyana Mandapam / Marriage Mahal</option>
                          <option value="Hotel Banquet Hall / Resort">Hotel Banquet Hall / Resort</option>
                          <option value="Outdoor Lawn / Open Grounds">Outdoor Lawn / Open Grounds</option>
                          <option value="Residence / Home Setup">Residence / Home Setup</option>
                          <option value="Temple / Religious Hall">Temple / Religious Hall</option>
                          <option value="School / College Auditorium">School / College Auditorium</option>
                          <option value="Convention / Exhibition Centre">Convention / Exhibition Centre</option>
                          <option value="Community Hall / Other">Community Hall / Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 4. Special Requests / Notes */}
                  <div className="form-group">
                    <label htmlFor="quote-notes-textarea">Additional Notes / Theme / Deliverables (Optional)</label>
                    <textarea
                      id="quote-notes-textarea"
                      name="specialNotes"
                      className="form-control"
                      rows={3}
                      placeholder="e.g. Fresh jasmine fragrance, pastel pink color palette, LED wall video loop, sound setup..."
                      value={quoteNotes}
                      onChange={(e) => setQuoteNotes(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-gold"
                    style={{
                      width: '100%',
                      padding: '16px',
                      fontSize: '1.05rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    Submit
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 8. COMPANY ABOUT & LOCATION */}
      <section id="company" className="company-section">
        <div className="container company-grid">
          <div>
            <span className="badge badge-sage">About The Studio</span>
            <h2 style={{ fontSize: '2.8rem', margin: '14px 0 20px' }}>
              Crafted in Coimbatore, Loved Across Tamil Nadu
            </h2>
            <p style={{ fontSize: '1.05rem', lineHeight: '1.7', marginBottom: '24px' }}>
              Based at the vibrant flower trade heart of Coimbatore in Poomarket, we have been crafting bespoke floral backdrops, grand wedding stages, and professional event productions for over 15 years.
            </p>
            <p style={{ fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '32px' }}>
              Whether you need fresh traditional jasmine garlands brought straight from the morning auction or an ultra-modern 30-foot LED video wall with concert lighting, our in-house team handles design, logistics, assembly, and teardown seamlessly.
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <a href={company.googleMapsUrl} target="_blank" rel="noreferrer" className="btn btn-primary">
                📍 Open Google Maps Directions
              </a>
            </div>
          </div>

          <div className="contact-card">
            <h3 style={{ fontSize: '1.6rem', marginBottom: '24px' }}>Store &amp; Workshop Details</h3>

            <div className="info-row">
              <div className="info-icon">📍</div>
              <div className="info-content">
                <h4>Workshop &amp; Store Location</h4>
                <p>{company.address}</p>
              </div>
            </div>

            <div
              className="info-row"
              onClick={handleOpenCallModal}
              style={{ cursor: 'pointer', transition: 'all 0.2s ease', padding: '6px', borderRadius: '10px' }}
              title="Click to call our planners"
            >
              <div className="info-icon">📞</div>
              <div className="info-content">
                <h4>Phone &amp; Bookings</h4>
                <p style={{ color: 'var(--color-sage)', fontWeight: 600 }}>{company.phone} (Click to Call)</p>
              </div>
            </div>

            <div className="info-row">
              <div className="info-icon">⏰</div>
              <div className="info-content">
                <h4>Operating Hours</h4>
                <p>{company.workingHours}</p>
              </div>
            </div>

            <div className="info-row">
              <div className="info-icon">✨</div>
              <div className="info-content">
                <h4>Core Specialties</h4>
                <p>9 Verticals: Weddings, LED Walls, Pro Audio, Garlands, Bouquets &amp; Stage Decor</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '30px', paddingBottom: '40px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
              <img
                src="/logo.png"
                alt="FlowerSpot Logo"
                style={{
                  height: '52px',
                  width: 'auto',
                  borderRadius: '10px',
                  background: '#FFFFFF',
                  padding: '4px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}
              />
              <div>
                <h3 style={{ fontSize: '1.4rem', margin: 0, color: '#FFFFFF' }}>{company.name}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-gold)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>Bloom • Discover • Connect</span>
              </div>
            </div>
            <p style={{ maxWidth: '380px', fontSize: '0.9rem' }}>{company.tagline}</p>
            <p style={{ marginTop: '12px', fontSize: '0.85rem' }}>{company.address}</p>
          </div>

          <div>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>Our 9 Verticals</h4>
            <ul style={{ listStyle: 'none', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', fontSize: '0.85rem' }}>
              {CATEGORIES.map((c) => (
                <li key={c.id}>
                  <a
                    href="#backdrops"
                    onClick={() => setSelectedCategory(c.name)}
                    style={{ color: '#ADB8AF', textDecoration: 'none' }}
                  >
                    • {c.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>Quick Navigation</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem' }}>
              <li><a href="#instagram">Instagram Reels &amp; Videos</a></li>
              <li><a href="#backdrops">Backdrop Catalogue</a></li>
              <li><a href="#services">Our Services</a></li>
              <li><a href="#quote">Get Quotation</a></li>
            </ul>
          </div>
        </div>

        <div className="container" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', textAlign: 'center', fontSize: '0.8rem' }}>
          © 2026 {company.name}. All Rights Reserved. Designed for Coimbatore Weddings &amp; Events.
        </div>
      </footer>

      {/* 10. LIVE FLOATING INSTAGRAM APP */}
      <a
        href={instagramUrl}
        target="_blank"
        rel="noreferrer"
        className="floating-instagram-app"
        aria-label="Watch live videos and reels on Instagram"
      >
        <div className="floating-instagram-btn">
          {/* Live Reel Flashing Ping Indicator */}
          <div className="live-reel-ping" title="Live Event Reels">
            <span className="ping-circle" />
            <span className="ping-dot" />
          </div>

          {/* Instagram Camera SVG Icon */}
          <svg
            width="35"
            height="35"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ display: 'block', flexShrink: 0 }}
          >
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>
        </div>
      </a>

      {/* 11. MOBILE BOTTOM STICKY BAR */}
      <div className="mobile-bottom-bar" style={{ display: 'flex', gap: '12px' }}>
        <button
          type="button"
          onClick={handleOpenCallModal}
          className="btn btn-outline"
          style={{ flex: 1, padding: '12px 14px', fontSize: '0.9rem' }}
        >
          📞 Call Now
        </button>
      </div>

      {/* 12. CONTACT CALL MODAL */}
      <ContactCallModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        phoneDisplay={company.phone}
        companyName={company.name}
        workingHours={company.workingHours}
        address={company.address}
      />
    </>
  );
}
