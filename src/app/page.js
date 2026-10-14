'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CATEGORIES } from '@/lib/categories';
import SocialCards from '@/components/ui/card-fan-carousel';
import WorksWheel from '@/components/ui/works-wheel';

export default function Home() {
  const [backdrops, setBackdrops] = useState([]);
  const [company, setCompany] = useState({
    name: 'FlowerSpot Events & Wedding Planners',
    tagline: 'Grand Stage Backdrops, Fresh Floral Artistry & Concert-Grade AV Setup',
    city: 'Coimbatore, Tamil Nadu',
    address: 'Shop No.B6, Poomarket, Coimbatore - 641001.',
    phone: '8098415066',
    whatsapp: '918098415066',
    workingHours: 'Open Every Day: 24/7',
    experienceYears: '6+',
    completedEvents: '500+',
    googleMapsUrl: 'https://maps.app.goo.gl/iL3jNKRZjuhBiK7n9'
  });

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeModalBackdrop, setActiveModalBackdrop] = useState(null);

  // Quote Form State
  const [quoteName, setQuoteName] = useState('');
  const [quotePhone, setQuotePhone] = useState('');
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
  const [quoteNotes, setQuoteNotes] = useState('');
  const [quoteSubmitted, setQuoteSubmitted] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [bdRes, compRes] = await Promise.all([
          fetch('/api/backdrops'),
          fetch('/api/company')
        ]);
        const bdData = await bdRes.json();
        const compData = await compRes.json();
        if (Array.isArray(bdData)) setBackdrops(bdData);
        if (compData && compData.name) setCompany(compData);
      } catch (err) {
        console.error('Failed to load website data:', err);
      }
    }
    loadData();
  }, []);

  // Prepare cards for the Card Fan Carousel (supports 50+ photos as uploaded)
  const uploadedCards = backdrops
    .filter((b) => b.image)
    .map((b) => ({
      imgUrl: b.image,
      alt: b.title,
      linkUrl: '#backdrops'
    }));

  const stockFallbackCards = [
    { imgUrl: '/uploads/backdrop-1.jpg', alt: 'Royal Dusty Mauve Mandap', linkUrl: '#backdrops' },
    { imgUrl: '/uploads/backdrop-2.jpg', alt: 'Heritage Jasmine Temple Mandap', linkUrl: '#backdrops' },
    { imgUrl: '/uploads/backdrop-3.jpg', alt: 'Bohemian Haldi Swing Decor', linkUrl: '#backdrops' },
    { imgUrl: '/uploads/backdrop-4.jpg', alt: 'Concert LED Video Wall Stage', linkUrl: '#backdrops' },
    { imgUrl: '/uploads/backdrop-5.jpg', alt: 'Golden Ring Floral Arch', linkUrl: '#backdrops' },
    { imgUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80', alt: 'Traditional South Indian Wedding Muhurtham', linkUrl: '#backdrops' },
    { imgUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80', alt: 'Grand Reception Floral Walkway', linkUrl: '#backdrops' },
    { imgUrl: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=80', alt: 'Floral Arch & Stage Lighting', linkUrl: '#backdrops' },
    { imgUrl: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80', alt: 'Celebration Stage Lighting Truss', linkUrl: '#backdrops' },
    { imgUrl: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80', alt: 'Banquet Hall Floral Styling', linkUrl: '#backdrops' }
  ];

  const carouselCards = uploadedCards.length >= 7
    ? uploadedCards
    : [...uploadedCards, ...stockFallbackCards.slice(uploadedCards.length)];

  // Service items for WorksWheel (White theme, NO images, rich service info)
  const servicesWheelItems = CATEGORIES.map((service) => ({
    title: service.name,
    icon: service.icon,
    badge: service.badge,
    description: service.serviceDesc,
    highlights: service.highlights,
    href: generateWhatsAppUrl(`Hi FlowerSpot! I am inquiring about your ${service.name} service for an upcoming event.`),
  }));

  // Filter backdrops when a specific category is chosen
  const filteredBackdrops = selectedCategory === 'All'
    ? backdrops
    : backdrops.filter((b) => b.category?.toLowerCase() === selectedCategory.toLowerCase());

  const currentCategoryMeta = CATEGORIES.find(
    (c) => c.name.toLowerCase() === selectedCategory.toLowerCase()
  );

  function generateWhatsAppUrl(customText) {
    const phone = company.whatsapp || '918098415066';
    const message = customText || `Hello! I would like to inquire about backdrop decorations for my upcoming event.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  function handleResetQuote() {
    setQuoteName('');
    setQuotePhone('');
    setQuoteDate('');
    setQuoteType('Wedding Decorations');
    setQuoteSelectedBackdrop('');
    setQuoteVenueName('');
    setQuoteVenueCity('');
    setQuoteVenueType('Kalyana Mandapam / Marriage Mahal');
    setQuoteVenueSetting('Indoor AC Hall');
    setQuoteStageDimensions('');
    setQuoteVenueLandmark('');
    setQuoteNotes('');
    setQuoteSubmitted(false);
  }

  async function handleQuoteSubmit(e) {
    e.preventDefault();
    const payload = {
      name: quoteName,
      phone: quotePhone,
      eventDate: quoteDate,
      eventType: quoteType,
      selectedBackdrop: quoteSelectedBackdrop || 'General Inquiry',
      venueName: quoteVenueName,
      venueCity: quoteVenueCity,
      venueType: quoteVenueType,
      venueSetting: quoteVenueSetting,
      stageDimensions: quoteStageDimensions,
      venueLandmark: quoteVenueLandmark,
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

    setQuoteSubmitted(true);

    const waText = `🌸 *New Event Quotation Inquiry - ${company.name}*\n\n` +
      `👤 *Customer Information:*\n` +
      `• *Name:* ${quoteName}\n` +
      `• *Phone / WhatsApp:* ${quotePhone}\n\n` +
      `📅 *Event Details:*\n` +
      `• *Service / Category:* ${quoteType}\n` +
      `• *Event Date:* ${quoteDate || 'To be decided'}\n` +
      `• *Preferred Setup:* ${quoteSelectedBackdrop || 'General Consultation'}\n\n` +
      `📍 *VENUE DETAILS:*\n` +
      `• *Venue / Hall Name:* ${quoteVenueName || 'Not specified'}\n` +
      `• *City / Area:* ${quoteVenueCity || 'Coimbatore'}\n` +
      `• *Venue Type:* ${quoteVenueType}\n` +
      `• *Setup Environment:* ${quoteVenueSetting}\n` +
      (quoteStageDimensions ? `• *Stage Dimensions:* ${quoteStageDimensions}\n` : '') +
      (quoteVenueLandmark ? `• *Landmark / Address:* ${quoteVenueLandmark}\n` : '') +
      (quoteNotes ? `\n📝 *Special Requests / Notes:* ${quoteNotes}\n\n` : '\n') +
      `Please check availability and send custom quotation!`;

    window.open(generateWhatsAppUrl(waText), '_blank');
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
        📍Located in Poomarket, Coimbatore | Serving Weddings &amp; Celebrations Across Tamil Nadu &amp; Kerala | Call: {company.phone}
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
            <Link href="/admin" className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
              ⚙️ Admin Panel
            </Link>
            <a
              href={generateWhatsAppUrl()}
              target="_blank"
              rel="noreferrer"
              className="btn btn-whatsapp"
              style={{ padding: '9px 20px', fontSize: '0.85rem' }}
            >
              💬 WhatsApp
            </a>
          </div>
        </div>
      </header>

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
              Explore 9 Collections ↓
            </a>
            <a
              href={generateWhatsAppUrl("Hi! I would like to book a consultation for an upcoming event stage setup.")}
              target="_blank"
              rel="noreferrer"
              className="btn btn-gold"
            >
              Chat on WhatsApp
            </a>
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
              <h3>{carouselCards.length >= 511 ? `${carouselCards.length}+` : '520+'}</h3>
              <p>Stage Setups</p>
            </div>
            <div className="stat-item">
              <h3>9</h3>
              <p>Curated Verticals</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. BACKDROP CATALOGUE SECTION */}
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
                        <a
                          href={generateWhatsAppUrl(`Hello! I would like to inquire about ${cat.name} for my event.`)}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-whatsapp"
                          style={{ padding: '10px 14px', fontSize: '0.85rem' }}
                        >
                          💬 Quote
                        </a>
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
                  <Link
                    href={`/admin`}
                    className="btn btn-ghost"
                    style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                  >
                    ⚙️ Manage in Admin
                  </Link>
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
                          <a
                            href={generateWhatsAppUrl(`Hello! I'm interested in booking the "${item.title}" (${item.category}). Please let me know quote and availability.`)}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-whatsapp"
                          >
                            WhatsApp Quote
                          </a>
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
                    This category card is ready for company photos. The administrator can upload high-resolution setup photos, dimensions, and descriptions directly from the Admin Panel.
                  </p>

                  <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link href="/admin" className="btn btn-primary" style={{ padding: '10px 22px' }}>
                      📸 Upload Photos in Admin Panel
                    </Link>
                    <a
                      href={generateWhatsAppUrl(`Hi, I am looking for custom designs and quotations for ${selectedCategory}.`)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-whatsapp"
                      style={{ padding: '10px 22px' }}
                    >
                      💬 Inquire on WhatsApp
                    </a>
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
                <a
                  href={generateWhatsAppUrl(`Hi, I am looking at "${activeModalBackdrop.title}" on your website and want to check pricing and availability.`)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-whatsapp"
                  style={{ flex: 1 }}
                >
                  Book Setup on WhatsApp
                </a>
                <a
                  href={`tel:${company.phone.replace(/[^0-9]/g, '')}`}
                  className="btn btn-outline"
                >
                  Call Store
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. OUR SERVICES SECTION (POWERED BY WORKS-WHEEL - 100% CLEAN WHITE THEME & NO IMAGES) */}
      <section id="services" style={{ background: '#FFFFFF', padding: '90px 0 70px', borderTop: '1px solid #EAE5DE', borderBottom: '1px solid #EAE5DE' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 30px' }}>
          <span className="badge badge-mauve" style={{ marginBottom: '10px' }}>What We Provide</span>
          <h2 style={{ fontSize: '2.8rem', color: 'var(--color-sage)', margin: '10px 0 16px' }}>
            Our Comprehensive Event Services
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.6' }}>
            Turn the interactive wheel or click any category to browse our nine dedicated event production and floral artistry verticals.
          </p>
        </div>

        {/* WorksWheel Showcase (Clean White Theme, NO Images) */}
        <div style={{ width: '100%', height: '620px', position: 'relative' }}>
          <WorksWheel
            items={servicesWheelItems}
            label="Our Services"
            action="Enquire on WhatsApp"
          />
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
                background: '#E8F5E9',
                border: '1px solid #A5D6A7',
                borderRadius: '16px',
                padding: '30px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>✓</div>
                <h3 style={{ color: '#2E7D32', marginBottom: '8px' }}>Thank You! Quotation Request Received</h3>
                <p style={{ color: '#1B5E20', fontSize: '0.95rem', marginBottom: '16px' }}>
                  We opened WhatsApp for you with the event and venue details. Our team in Poomarket will respond shortly!
                </p>
                <button
                  onClick={handleResetQuote}
                  className="btn btn-primary"
                  style={{ fontSize: '0.85rem' }}
                >
                  Submit Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleQuoteSubmit}>
                {/* 1. Customer Contact Details */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Your Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Ramesh Kumar"
                      value={quoteName}
                      onChange={(e) => setQuoteName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone / WhatsApp Number *</label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="e.g. 80984 15066"
                      value={quotePhone}
                      onChange={(e) => setQuotePhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* 2. Event Essentials */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Tentative Event Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={quoteDate}
                      onChange={(e) => setQuoteDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Type of Event / Service *</label>
                    <select
                      className="form-control"
                      value={quoteType}
                      onChange={(e) => setQuoteType(e.target.value)}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
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
                      <label>Venue / Hall / Mahal Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Codissia Hall E, Sri Krishna Mahal, Residency Hotel, Home"
                        value={quoteVenueName}
                        onChange={(e) => setQuoteVenueName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label>City / Town / Area *</label>
                      <input
                        type="text"
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
                      <label>Venue Type</label>
                      <select
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
                  <label>Additional Notes / Theme / Deliverables (Optional)</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="e.g. Fresh jasmine fragrance, pastel pink color palette, LED wall video loop, sound setup..."
                    value={quoteNotes}
                    onChange={(e) => setQuoteNotes(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-gold" style={{ width: '100%', padding: '16px', fontSize: '1.05rem' }}>
                  🚀 Get Instant Quote via WhatsApp
                </button>
              </form>
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
              <a href={`tel:${company.phone.replace(/[^0-9]/g, '')}`} className="btn btn-outline">
                📞 Call {company.phone}
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

            <div className="info-row">
              <div className="info-icon">📞</div>
              <div className="info-content">
                <h4>Phone &amp; Bookings</h4>
                <p>{company.phone}</p>
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
              <li><a href="#backdrops">Backdrop Catalogue</a></li>
              <li><a href="#services">Our Services</a></li>
              <li><a href="#quote">Get Quotation</a></li>
              <li><Link href="/admin">⚙️ Admin Dashboard</Link></li>
            </ul>
          </div>
        </div>

        <div className="container" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', textAlign: 'center', fontSize: '0.8rem' }}>
          © 2026 {company.name}. All Rights Reserved. Designed for Coimbatore Weddings &amp; Events.
        </div>
      </footer>

      {/* 10. FLOATING DESKTOP WHATSAPP BUTTON */}
      <div className="floating-actions">
        <a
          href={generateWhatsAppUrl()}
          target="_blank"
          rel="noreferrer"
          className="floating-whatsapp-btn"
        >
          💬 WhatsApp Us
        </a>
      </div>

      {/* 11. MOBILE BOTTOM STICKY BAR */}
      <div className="mobile-bottom-bar">
        <a href={`tel:${company.phone.replace(/[^0-9]/g, '')}`} className="btn btn-outline">
          📞 Call Now
        </a>
        <a href={generateWhatsAppUrl()} target="_blank" rel="noreferrer" className="btn btn-whatsapp">
          💬 WhatsApp Quote
        </a>
      </div>
    </>
  );
}
