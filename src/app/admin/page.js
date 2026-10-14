'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { CATEGORIES } from '@/lib/categories';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');

  const [backdrops, setBackdrops] = useState([]);
  const [company, setCompany] = useState({});
  const [inquiries, setInquiries] = useState([]);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'categories' | 'company' | 'inquiries'
  const [selectedManageCategory, setSelectedManageCategory] = useState('All');

  // Upload Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Wedding Decorations');
  const [description, setDescription] = useState('');
  const [dimensions, setDimensions] = useState('24ft x 12ft (Customizable)');
  const [idealFor, setIdealFor] = useState('Weddings, Receptions');
  const [included, setIncluded] = useState('Full Floral Arch, Stage Lights, Velvet Sofa');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [validationError, setValidationError] = useState('');

  // Replace photo state
  const [replacingItemId, setReplacingItemId] = useState(null);
  const replaceFileInputRef = useRef(null);

  // Check authentication & load initial data
  useEffect(() => {
    const savedAuth = typeof window !== 'undefined' ? localStorage.getItem('fs_admin_logged') : null;
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }

    fetchBackdrops();
    fetchCompany();
    fetchInquiries();
  }, []);

  function handleLogin(e) {
    e.preventDefault();
    // Default admin PIN: 1234 or empty for convenience
    if (passcode === '1234' || passcode === 'admin' || passcode === 'admin123') {
      setIsAuthenticated(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('fs_admin_logged', 'true');
      }
      setAuthError('');
    } else {
      setAuthError('Incorrect passcode. (Default demo PIN is: 1234)');
    }
  }

  function handleLogout() {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fs_admin_logged');
    }
  }

  async function fetchBackdrops() {
    try {
      const res = await fetch('/api/backdrops');
      const data = await res.json();
      if (Array.isArray(data)) setBackdrops(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchCompany() {
    try {
      const res = await fetch('/api/company');
      const data = await res.json();
      setCompany(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchInquiries() {
    try {
      const res = await fetch('/api/inquiries');
      const data = await res.json();
      if (Array.isArray(data)) setInquiries(data);
    } catch (err) {
      console.error(err);
    }
  }

  function validateFile(file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type.toLowerCase())) {
      return 'Unsupported format. Please select a JPG, PNG, WEBP, or GIF image.';
    }
    if (file.size > maxSize) {
      return `File size is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Maximum allowed is 10MB.`;
    }
    return '';
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    setValidationError('');
    if (file) {
      const err = validateFile(file);
      if (err) {
        setValidationError(err);
        setImageFile(null);
        setImagePreview(null);
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  }

  async function handleUploadBackdrop(e) {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a backdrop title.');
      return;
    }

    setIsSubmitting(true);
    setStatusMessage('Uploading setup photo and saving specifications...');

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('category', category);
      formData.append('description', description);
      formData.append('dimensions', dimensions);
      formData.append('idealFor', idealFor);
      formData.append('included', included);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const res = await fetch('/api/backdrops', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (result.success) {
        setStatusMessage('✓ Photo & setup published successfully to the website!');
        setTitle('');
        setDescription('');
        setImageFile(null);
        setImagePreview(null);
        fetchBackdrops();
        setTimeout(() => setStatusMessage(''), 4000);
      } else {
        setStatusMessage('Error: ' + result.error);
      }
    } catch (err) {
      setStatusMessage('Upload failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Replace photo workflow
  function triggerReplacePhoto(id) {
    setReplacingItemId(id);
    if (replaceFileInputRef.current) {
      replaceFileInputRef.current.value = '';
      replaceFileInputRef.current.click();
    }
  }

  async function handleExecuteReplacePhoto(e) {
    const file = e.target.files[0];
    if (!file || !replacingItemId) return;

    const err = validateFile(file);
    if (err) {
      alert(err);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('id', replacingItemId);
      formData.append('image', file);

      const res = await fetch('/api/backdrops', {
        method: 'PUT',
        body: formData,
      });

      const result = await res.json();
      if (result.success) {
        alert('✓ Photo replaced successfully!');
        fetchBackdrops();
      } else {
        alert('Replace failed: ' + result.error);
      }
    } catch (err) {
      alert('Error replacing photo: ' + err.message);
    } finally {
      setReplacingItemId(null);
    }
  }

  async function handleDeleteBackdrop(id, itemTitle) {
    if (!confirm(`Are you sure you want to delete "${itemTitle || 'this setup'}"?`)) return;
    try {
      const res = await fetch(`/api/backdrops?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchBackdrops();
      }
    } catch (err) {
      alert('Delete failed');
    }
  }

  async function handleSaveCompany(e) {
    e.preventDefault();
    try {
      const res = await fetch('/api/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(company),
      });
      const data = await res.json();
      if (data.success) {
        alert('✓ Company details updated successfully!');
      }
    } catch (err) {
      alert('Update failed');
    }
  }

  // If not authenticated, display luxury admin security gate
  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--color-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}>
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '20px',
          padding: '44px 36px',
          maxWidth: '440px',
          width: '100%',
          boxShadow: 'var(--shadow-lg)',
          textAlign: 'center'
        }}>
          <img
            src="/logo.png"
            alt="FlowerSpot"
            style={{ height: '64px', width: 'auto', borderRadius: '12px', background: '#FFF', padding: '4px', marginBottom: '16px' }}
          />
          <h2 style={{ fontSize: '1.6rem', color: 'var(--color-sage)', marginBottom: '8px' }}>
            Administrator Access
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
            Please enter your administrator passcode to upload and manage company photos across the 9 verticals.
          </p>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '18px', textAlign: 'left' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-sage)', display: 'block', marginBottom: '8px' }}>
                Admin Passcode
              </label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter passcode (Default: 1234)"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                autoFocus
                required
              />
            </div>

            {authError && (
              <div style={{ color: '#D32F2F', fontSize: '0.82rem', marginBottom: '16px', fontWeight: 500 }}>
                {authError}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
              🔓 Unlock Admin Dashboard
            </button>
          </form>

          <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <Link href="/" style={{ fontSize: '0.85rem', color: 'var(--color-gold)', textDecoration: 'none' }}>
              ← Return to Public Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Filter backdrops by selected category in manager tab
  const displayBackdrops = selectedManageCategory === 'All'
    ? backdrops
    : backdrops.filter((b) => b.category?.toLowerCase() === selectedManageCategory.toLowerCase());

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Hidden file input for Replace Photo */}
      <input
        type="file"
        ref={replaceFileInputRef}
        accept="image/*"
        onChange={handleExecuteReplacePhoto}
        style={{ display: 'none' }}
      />

      {/* Admin Top Bar */}
      <div style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--border-subtle)', padding: '16px 24px' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img
              src="/logo.png"
              alt="FlowerSpot Logo"
              style={{
                height: '46px',
                width: 'auto',
                borderRadius: '8px',
                background: '#FFFFFF',
                padding: '2px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}
            />
            <div>
              <h2 style={{ fontSize: '1.35rem', color: 'var(--color-sage)', margin: 0 }}>
                FlowerSpot Administrator Portal
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                Manage photos, specifications, and details across all 9 event verticals
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Link href="/" className="btn btn-outline" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
              ← View Live Website
            </Link>
            <button
              onClick={handleLogout}
              className="btn btn-ghost"
              style={{ padding: '8px 14px', fontSize: '0.82rem' }}
            >
              🔒 Lock / Logout
            </button>
          </div>
        </div>
      </div>

      <div className="admin-container">
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('upload')}
            className={`filter-btn ${activeTab === 'upload' ? 'active' : ''}`}
          >
            📸 Upload New Photo / Setup
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`filter-btn ${activeTab === 'categories' ? 'active' : ''}`}
          >
            🗂️ Manage 9 Verticals ({backdrops.length} Uploaded)
          </button>
          <button
            onClick={() => setActiveTab('company')}
            className={`filter-btn ${activeTab === 'company' ? 'active' : ''}`}
          >
            🏢 Company &amp; Contact Details
          </button>
          <button
            onClick={() => setActiveTab('inquiries')}
            className={`filter-btn ${activeTab === 'inquiries' ? 'active' : ''}`}
          >
            📬 Customer Inquiries ({inquiries.length})
          </button>
        </div>

        {/* TAB 1: UPLOAD PHOTO / BACKDROP */}
        {activeTab === 'upload' && (
          <div className="admin-panel-card">
            <div style={{ marginBottom: '24px' }}>
              <span className="badge badge-gold" style={{ marginBottom: '6px' }}>Photo Management</span>
              <h3 style={{ fontSize: '1.6rem', color: 'var(--color-sage)' }}>
                Upload Real Company Setup Photo
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Select one of the 9 categories below to publish your real event photos. Uploaded images instantly appear in the Backdrop Catalogue and Our Services sections.
              </p>
            </div>

            {statusMessage && (
              <div style={{
                padding: '12px 18px',
                borderRadius: '8px',
                marginBottom: '20px',
                background: statusMessage.includes('✓') ? '#E8F5E9' : '#FFF3E0',
                color: statusMessage.includes('✓') ? '#2E7D32' : '#E65100',
                fontWeight: 600,
                fontSize: '0.9rem'
              }}>
                {statusMessage}
              </div>
            )}

            {validationError && (
              <div style={{
                padding: '12px 18px',
                borderRadius: '8px',
                marginBottom: '20px',
                background: '#FFEBEE',
                color: '#C62828',
                fontWeight: 600,
                fontSize: '0.88rem'
              }}>
                ⚠️ {validationError}
              </div>
            )}

            <form onSubmit={handleUploadBackdrop}>
              {/* Category Picker (All 9 Categories) */}
              <div className="form-group">
                <label>Target Category (Choose from 9 Verticals) *</label>
                <select
                  className="form-control"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--color-sage)' }}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.icon} {cat.name} — {cat.badge}
                    </option>
                  ))}
                </select>
              </div>

              {/* Photo Upload Zone */}
              <div className="form-group">
                <label>Select Photo (Max: 10MB | Supports: JPG, PNG, WEBP, GIF) *</label>
                <div style={{
                  border: '2px dashed var(--color-mauve)',
                  borderRadius: '12px',
                  padding: '30px',
                  textAlign: 'center',
                  background: 'var(--color-mauve-tint)',
                  cursor: 'pointer'
                }}>
                  {imagePreview ? (
                    <div>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{ maxHeight: '240px', borderRadius: '8px', marginBottom: '14px', objectFit: 'contain' }}
                      />
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-sage)', fontWeight: 600 }}>
                        {imageFile?.name} ({(imageFile?.size / 1024).toFixed(0)} KB)
                      </p>
                      <label htmlFor="file-input" className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
                        Change Selected Image
                      </label>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '2.4rem', marginBottom: '8px' }}>📸</div>
                      <p style={{ fontWeight: 600, color: 'var(--color-sage)', marginBottom: '4px' }}>
                        Click to select image or take photo from phone
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                        Maximum upload size: 10MB • High resolution recommended
                      </p>
                      <label htmlFor="file-input" className="btn btn-primary" style={{ marginTop: '14px', fontSize: '0.85rem', padding: '8px 20px' }}>
                        Browse Photo File
                      </label>
                    </div>
                  )}
                  <input
                    id="file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Setup / Backdrop Title *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Royal Jasmine & Brass Bell Mandap"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Stage Dimensions</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 24ft x 12ft (Customizable)"
                    value={dimensions}
                    onChange={(e) => setDimensions(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ideal For</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Muhurtham, Grand Receptions, Sangeet"
                    value={idealFor}
                    onChange={(e) => setIdealFor(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Included Items (comma-separated)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Full Floral Arch, 4 Chandeliers, Stage Lights, Sofa"
                    value={included}
                    onChange={(e) => setIncluded(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description &amp; Specifications</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Describe the floral work, lighting, colors, or materials used..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-gold"
                disabled={isSubmitting}
                style={{ width: '100%', padding: '16px', fontSize: '1rem' }}
              >
                {isSubmitting ? 'Uploading & Publishing...' : '✨ Publish Photo to Website'}
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: MANAGE BY CATEGORY */}
        {activeTab === 'categories' && (
          <div className="admin-panel-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '1.6rem', color: 'var(--color-sage)', margin: 0 }}>
                  Manage Collections by Category
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '4px 0 0' }}>
                  Total {backdrops.length} setups uploaded across 9 verticals. Replace or delete photos as needed.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('upload')}
                className="btn btn-primary"
                style={{ fontSize: '0.85rem', padding: '8px 18px' }}
              >
                + Upload New Photo
              </button>
            </div>

            {/* Category Filter Pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
              <button
                onClick={() => setSelectedManageCategory('All')}
                className={`filter-btn ${selectedManageCategory === 'All' ? 'active' : ''}`}
                style={{ fontSize: '0.82rem', padding: '6px 14px' }}
              >
                All Verticals ({backdrops.length})
              </button>
              {CATEGORIES.map((c) => {
                const count = backdrops.filter((b) => b.category?.toLowerCase() === c.name.toLowerCase()).length;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedManageCategory(c.name)}
                    className={`filter-btn ${selectedManageCategory === c.name ? 'active' : ''}`}
                    style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                  >
                    {c.icon} {c.name} ({count})
                  </button>
                );
              })}
            </div>

            {/* List of Category Panels */}
            {selectedManageCategory === 'All' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                {CATEGORIES.map((cat) => {
                  const catItems = backdrops.filter((b) => b.category?.toLowerCase() === cat.name.toLowerCase());

                  return (
                    <div
                      key={cat.id}
                      style={{
                        background: '#FAF8F5',
                        borderRadius: '16px',
                        border: '1px solid var(--border-subtle)',
                        padding: '24px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '1.4rem' }}>{cat.icon}</span>
                          <h4 style={{ fontSize: '1.25rem', color: 'var(--color-sage)', margin: 0 }}>
                            {cat.name}
                          </h4>
                          <span className={catItems.length > 0 ? 'badge badge-sage' : 'badge badge-gold'}>
                            {catItems.length} {catItems.length === 1 ? 'Photo' : 'Photos'}
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            setCategory(cat.name);
                            setActiveTab('upload');
                          }}
                          className="btn btn-outline"
                          style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                        >
                          + Upload to {cat.name}
                        </button>
                      </div>

                      {catItems.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '18px' }}>
                          {catItems.map((item) => (
                            <div
                              key={item.id}
                              style={{
                                background: '#FFF',
                                borderRadius: '10px',
                                border: '1px solid var(--border-subtle)',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column'
                              }}
                            >
                              <div style={{ height: '150px', background: '#F0ECE4', overflow: 'hidden', position: 'relative' }}>
                                {item.image ? (
                                  <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-light)', fontSize: '0.8rem' }}>
                                    No Image
                                  </div>
                                )}
                              </div>
                              <div style={{ padding: '14px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                <h5 style={{ fontSize: '1rem', color: 'var(--color-sage)', margin: '0 0 6px' }}>
                                  {item.title}
                                </h5>
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 10px', flexGrow: 1 }}>
                                  {item.description}
                                </p>
                                <span style={{ fontSize: '0.74rem', color: 'var(--text-light)', marginBottom: '12px' }}>
                                  📐 {item.dimensions}
                                </span>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button
                                    onClick={() => triggerReplacePhoto(item.id)}
                                    className="btn btn-outline"
                                    style={{ flex: 1, padding: '6px', fontSize: '0.78rem' }}
                                  >
                                    🔄 Replace Photo
                                  </button>
                                  <button
                                    onClick={() => handleDeleteBackdrop(item.id, item.title)}
                                    style={{
                                      padding: '6px 10px',
                                      background: '#FFEBEE',
                                      color: '#D32F2F',
                                      border: '1px solid #FFCDD2',
                                      borderRadius: '6px',
                                      fontSize: '0.78rem',
                                      fontWeight: 600,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{
                          padding: '24px',
                          border: '2px dashed rgba(184, 150, 92, 0.4)',
                          borderRadius: '10px',
                          textAlign: 'center',
                          background: '#FFFDF9'
                        }}>
                          <span className="placeholder-tag" style={{ marginBottom: '6px' }}>
                            Empty Placeholder Active on Website
                          </span>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 12px' }}>
                            No photos uploaded yet for this vertical. Website currently displays a designated placeholder.
                          </p>
                          <button
                            onClick={() => {
                              setCategory(cat.name);
                              setActiveTab('upload');
                            }}
                            className="btn btn-gold"
                            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                          >
                            + Add First Photo
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Single Selected Category View */
              <div>
                {displayBackdrops.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {displayBackdrops.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          background: '#FFF',
                          borderRadius: '12px',
                          border: '1px solid var(--border-subtle)',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        <div style={{ height: '170px', overflow: 'hidden', position: 'relative' }}>
                          {item.image ? (
                            <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-light)', fontSize: '0.85rem' }}>
                              No Image Uploaded
                            </div>
                          )}
                          <span className="badge badge-sage" style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '0.7rem' }}>
                            {item.category}
                          </span>
                        </div>
                        <div style={{ padding: '16px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                          <h4 style={{ fontSize: '1.05rem', color: 'var(--color-sage)', marginBottom: '6px' }}>{item.title}</h4>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '10px', flexGrow: 1 }}>
                            {item.description}
                          </p>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginBottom: '14px' }}>
                            📐 {item.dimensions}
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => triggerReplacePhoto(item.id)}
                              className="btn btn-outline"
                              style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}
                            >
                              🔄 Replace Photo
                            </button>
                            <button
                              onClick={() => handleDeleteBackdrop(item.id, item.title)}
                              style={{
                                padding: '8px 12px',
                                background: '#FFEBEE',
                                color: '#D32F2F',
                                borderRadius: '6px',
                                fontSize: '0.82rem',
                                fontWeight: 600,
                                border: '1px solid #FFCDD2',
                                cursor: 'pointer'
                              }}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    padding: '50px 20px',
                    textAlign: 'center',
                    background: '#FAF8F5',
                    borderRadius: '16px',
                    border: '2px dashed rgba(184, 150, 92, 0.45)'
                  }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📁</div>
                    <h4 style={{ color: 'var(--color-sage)', fontSize: '1.3rem', marginBottom: '6px' }}>
                      No Photos Uploaded for {selectedManageCategory}
                    </h4>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
                      The website currently shows a luxury designated empty placeholder for this category.
                    </p>
                    <button
                      onClick={() => {
                        setCategory(selectedManageCategory);
                        setActiveTab('upload');
                      }}
                      className="btn btn-gold"
                      style={{ fontSize: '0.85rem', padding: '8px 18px' }}
                    >
                      + Upload First Photo to {selectedManageCategory}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: COMPANY DETAILS */}
        {activeTab === 'company' && (
          <div className="admin-panel-card">
            <h3 style={{ fontSize: '1.6rem', marginBottom: '8px', color: 'var(--color-sage)' }}>Company &amp; Contact Details</h3>
            <p style={{ marginBottom: '24px', color: 'var(--text-muted)' }}>
              These details are displayed across your website header, footer, contact section, and WhatsApp booking triggers.
            </p>

            <form onSubmit={handleSaveCompany}>
              <div className="form-row">
                <div className="form-group">
                  <label>Business Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={company.name || ''}
                    onChange={(e) => setCompany({ ...company, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Tagline / Headline</label>
                  <input
                    type="text"
                    className="form-control"
                    value={company.tagline || ''}
                    onChange={(e) => setCompany({ ...company, tagline: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>WhatsApp Number (without + or spaces, e.g. 918098415066)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={company.whatsapp || ''}
                    onChange={(e) => setCompany({ ...company, whatsapp: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Display Phone Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={company.phone || ''}
                    onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Workshop / Store Address</label>
                <input
                  type="text"
                  className="form-control"
                  value={company.address || ''}
                  onChange={(e) => setCompany({ ...company, address: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Operating Hours</label>
                  <input
                    type="text"
                    className="form-control"
                    value={company.workingHours || ''}
                    onChange={(e) => setCompany({ ...company, workingHours: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Google Maps Directions URL</label>
                  <input
                    type="text"
                    className="form-control"
                    value={company.googleMapsUrl || ''}
                    onChange={(e) => setCompany({ ...company, googleMapsUrl: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-gold" style={{ padding: '14px 28px', fontSize: '0.95rem' }}>
                💾 Save Company Details
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: CUSTOMER INQUIRIES */}
        {activeTab === 'inquiries' && (
          <div className="admin-panel-card">
            <h3 style={{ fontSize: '1.6rem', marginBottom: '8px', color: 'var(--color-sage)' }}>Customer Quotation Inquiries</h3>
            <p style={{ marginBottom: '24px', color: 'var(--text-muted)' }}>
              Inquiries received through the website quote form.
            </p>

            {inquiries.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {inquiries.map((inq) => (
                  <div
                    key={inq.id}
                    style={{
                      background: '#FAF8F5',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      padding: '20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '14px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <strong style={{ fontSize: '1.1rem', color: 'var(--color-sage)' }}>{inq.name}</strong>
                        <span className="badge badge-gold">{inq.eventType || 'General'}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                          {inq.receivedAt ? new Date(inq.receivedAt).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0' }}>
                        📞 <strong>Phone:</strong> {inq.phone} | 📅 <strong>Event Date:</strong> {inq.eventDate || 'Not specified'}
                      </p>
                      {(inq.venueName || inq.venueCity) && (
                        <div style={{
                          background: '#F0ECE1',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          margin: '6px 0',
                          fontSize: '0.85rem',
                          color: 'var(--color-sage)'
                        }}>
                          <div>
                            📍 <strong>Venue:</strong> {inq.venueName || 'Venue not named'}{inq.venueCity ? `, ${inq.venueCity}` : ''}
                            {inq.venueType ? ` (${inq.venueType})` : ''}
                          </div>
                          {(inq.venueSetting || inq.stageDimensions || inq.venueLandmark) && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                              {inq.venueSetting && <span>🏛️ {inq.venueSetting} </span>}
                              {inq.stageDimensions && <span>• 📐 Stage: {inq.stageDimensions} </span>}
                              {inq.venueLandmark && <span>• 📌 {inq.venueLandmark}</span>}
                            </div>
                          )}
                        </div>
                      )}
                      {inq.selectedBackdrop && (
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-light)', margin: '2px 0' }}>
                          🎯 Setup: {inq.selectedBackdrop}
                        </p>
                      )}
                      {inq.notes && (
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0', fontStyle: 'italic' }}>
                          "{inq.notes}"
                        </p>
                      )}
                    </div>

                    <a
                      href={`https://wa.me/${inq.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${inq.name}! Thank you for your inquiry with FlowerSpot Events regarding ${inq.eventType}${inq.venueName ? ` at ${inq.venueName}` : ''}. We have reviewed your stage requirements and would love to provide availability and quotation.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-whatsapp"
                      style={{ fontSize: '0.82rem', padding: '8px 16px' }}
                    >
                      💬 Reply on WhatsApp
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
                📬 No inquiries received yet. When visitors submit quotation requests on the website, they will appear here.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
