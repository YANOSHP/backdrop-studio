'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { CATEGORIES } from '@/lib/categories';

export default function AdminPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionToken, setSessionToken] = useState('');
  const [passcode, setPasscode] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [authError, setAuthError] = useState('');

  const [backdrops, setBackdrops] = useState([]);
  const [company, setCompany] = useState({});
  const [inquiries, setInquiries] = useState([]);
  const [activeTab, setActiveTab] = useState('carousel'); // 'carousel' | 'upload' | 'categories' | 'company' | 'inquiries'
  const [selectedManageCategory, setSelectedManageCategory] = useState('All');

  // Card Fan Carousel Management State
  const [carouselItems, setCarouselItems] = useState([]);
  const [isLoadingCarousel, setIsLoadingCarousel] = useState(false);
  const [pendingCarouselFiles, setPendingCarouselFiles] = useState([]);
  const [isCarouselUploading, setIsCarouselUploading] = useState(false);
  const [carouselStatusMessage, setCarouselStatusMessage] = useState('');
  const [carouselErrorMessage, setCarouselErrorMessage] = useState('');
  const [editingCarouselItem, setEditingCarouselItem] = useState(null);
  const [deletingCarouselItem, setDeletingCarouselItem] = useState(null);
  const [draggedCarouselId, setDraggedCarouselId] = useState(null);
  const carouselFileInputRef = useRef(null);

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

  function getAdminPasscode() {
    if (sessionToken) return sessionToken;
    if (passcode) return passcode;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('fs_admin_token') || localStorage.getItem('fs_admin_passcode') || '';
    }
    return '';
  }

  // Load initial data and verify active session after mounting
  useEffect(() => {
    setIsMounted(true);
    const isLogged = typeof window !== 'undefined' && localStorage.getItem('fs_admin_logged') === 'true';
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('fs_admin_token') || '' : '';

    if (isLogged) {
      setIsAuthenticated(true);
      setSessionToken(storedToken);
    }

    async function verifySession() {
      if (storedToken) {
        try {
          const res = await fetch('/api/admin/auth', {
            headers: { 'x-admin-token': storedToken }
          });
          const data = await res.json();
          if (!data.authenticated) {
            setIsAuthenticated(false);
            localStorage.removeItem('fs_admin_logged');
            localStorage.removeItem('fs_admin_token');
          }
        } catch (_) {}
      }
    }

    if (storedToken) {
      verifySession();
    }
    fetchBackdrops();
    fetchCompany();
    fetchInquiries();
    fetchCarouselItems();
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    const cleanKey = passcode.trim();
    if (!cleanKey) {
      setAuthError('Please enter your Secret Master Key.');
      return;
    }

    setIsVerifying(true);
    setAuthError('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: cleanKey })
      });

      const data = await res.json();
      if (data.success && data.token) {
        setIsAuthenticated(true);
        setSessionToken(data.token);
        if (typeof window !== 'undefined') {
          localStorage.setItem('fs_admin_logged', 'true');
          localStorage.setItem('fs_admin_token', data.token);
          localStorage.setItem('fs_admin_passcode', cleanKey);
        }
        setAuthError('');
      } else {
        setAuthError(data.error || 'Incorrect Secret Master Key. Access denied.');
      }
    } catch (err) {
      setAuthError('Authentication error: ' + err.message);
    } finally {
      setIsVerifying(false);
    }
  }

  function handleLogout() {
    setIsAuthenticated(false);
    setSessionToken('');
    setPasscode('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fs_admin_logged');
      localStorage.removeItem('fs_admin_token');
      localStorage.removeItem('fs_admin_passcode');
    }
  }

  async function fetchCarouselItems() {
    setIsLoadingCarousel(true);
    try {
      const res = await fetch('/api/carousel?all=true');
      const data = await res.json();
      if (Array.isArray(data)) {
        setCarouselItems(data);
      }
    } catch (err) {
      console.error('Failed to fetch carousel items:', err);
    } finally {
      setIsLoadingCarousel(false);
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
        headers: { 'x-admin-token': getAdminPasscode() },
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
        headers: { 'x-admin-token': getAdminPasscode() },
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
      const res = await fetch(`/api/backdrops?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': getAdminPasscode() }
      });
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
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': getAdminPasscode()
        },
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

  // ==========================================
  // CARD FAN CAROUSEL MANAGEMENT HANDLERS
  // ==========================================

  function handleCarouselFileSelection(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setCarouselErrorMessage('');
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const validNewFiles = [];
    const errorMsgs = [];

    files.forEach((file) => {
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      const mime = (file.type || '').toLowerCase();
      if (!validTypes.includes(mime) && !['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
        errorMsgs.push(`${file.name}: Unsupported format (JPG, PNG, WebP only).`);
        return;
      }
      if (file.size > maxSize) {
        errorMsgs.push(`${file.name}: Exceeds 10MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      const cleanBase = file.name.substring(0, file.name.lastIndexOf('.'))
        .replace(/[_-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      validNewFiles.push({
        id: `pending-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        previewUrl,
        title: cleanBase || 'Grand Stage Backdrop',
        alt: cleanBase || 'Luxury Stage Backdrop Coimbatore',
        description: '',
        linkUrl: '#backdrops',
        sizeFormatted: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
      });
    });

    if (errorMsgs.length > 0) {
      setCarouselErrorMessage(errorMsgs.join(' '));
    }

    if (validNewFiles.length > 0) {
      setPendingCarouselFiles((prev) => [...prev, ...validNewFiles]);
    }

    if (carouselFileInputRef.current) {
      carouselFileInputRef.current.value = '';
    }
  }

  function handleRemovePendingCarouselFile(id) {
    setPendingCarouselFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target && target.previewUrl) {
        try { URL.revokeObjectURL(target.previewUrl); } catch (_) {}
      }
      return prev.filter((item) => item.id !== id);
    });
  }

  function handleUpdatePendingCarouselFile(id, field, value) {
    setPendingCarouselFiles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  }

  async function handleUploadCarouselBatch(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (pendingCarouselFiles.length === 0) {
      setCarouselErrorMessage('Please select at least one photo to upload.');
      return;
    }

    setIsCarouselUploading(true);
    setCarouselStatusMessage(`Uploading ${pendingCarouselFiles.length} photo(s) to Card Fan Carousel...`);
    setCarouselErrorMessage('');

    try {
      const formData = new FormData();
      pendingCarouselFiles.forEach((item, index) => {
        formData.append('photos', item.file);
        formData.append(`title_${index}`, item.title || '');
        formData.append(`alt_${index}`, item.alt || '');
        formData.append(`description_${index}`, item.description || '');
        formData.append(`linkUrl_${index}`, item.linkUrl || '#backdrops');
      });

      const res = await fetch('/api/carousel', {
        method: 'POST',
        headers: {
          'x-admin-passcode': getAdminPasscode()
        },
        body: formData
      });

      const result = await res.json();
      if (result.success) {
        pendingCarouselFiles.forEach((item) => {
          if (item.previewUrl) {
            try { URL.revokeObjectURL(item.previewUrl); } catch (_) {}
          }
        });
        setPendingCarouselFiles([]);
        setCarouselStatusMessage(`✓ Successfully added ${result.count || pendingCarouselFiles.length} photo(s) to the Card Fan Carousel!`);
        fetchCarouselItems();
        setTimeout(() => setCarouselStatusMessage(''), 5000);
      } else {
        setCarouselErrorMessage(result.error || 'Failed to upload photos.');
      }
    } catch (err) {
      setCarouselErrorMessage('Network or upload error: ' + err.message);
    } finally {
      setIsCarouselUploading(false);
    }
  }

  async function handleMoveCarouselItem(index, direction) {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= carouselItems.length) return;

    const newItems = [...carouselItems];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, moved);

    setCarouselItems(newItems);

    try {
      const res = await fetch('/api/carousel', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-passcode': getAdminPasscode()
        },
        body: JSON.stringify({
          action: 'reorder',
          order: newItems.map((item) => item.id)
        })
      });

      const result = await res.json();
      if (!result.success) {
        alert('Failed to reorder: ' + (result.error || 'Unknown error'));
        fetchCarouselItems();
      }
    } catch (err) {
      console.error('Reorder error:', err);
      alert('Failed to save photo order.');
      fetchCarouselItems();
    }
  }

  async function handleDropCarouselReorder(draggedId, dropTargetId) {
    if (!draggedId || !dropTargetId || draggedId === dropTargetId) return;

    const fromIndex = carouselItems.findIndex((item) => item.id === draggedId);
    const toIndex = carouselItems.findIndex((item) => item.id === dropTargetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const newItems = [...carouselItems];
    const [moved] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, moved);

    setCarouselItems(newItems);

    try {
      const res = await fetch('/api/carousel', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-passcode': getAdminPasscode()
        },
        body: JSON.stringify({
          action: 'reorder',
          order: newItems.map((item) => item.id)
        })
      });

      const result = await res.json();
      if (!result.success) {
        alert('Failed to save order: ' + (result.error || 'Unknown error'));
        fetchCarouselItems();
      }
    } catch (err) {
      console.error('Reorder error:', err);
      fetchCarouselItems();
    }
  }

  async function handleSaveEditingCarouselItem(e) {
    e.preventDefault();
    if (!editingCarouselItem) return;

    try {
      const res = await fetch('/api/carousel', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-passcode': getAdminPasscode()
        },
        body: JSON.stringify({
          id: editingCarouselItem.id,
          title: editingCarouselItem.title,
          alt: editingCarouselItem.alt,
          description: editingCarouselItem.description,
          linkUrl: editingCarouselItem.linkUrl,
          active: editingCarouselItem.active
        })
      });

      const result = await res.json();
      if (result.success) {
        setEditingCarouselItem(null);
        setCarouselStatusMessage('✓ Photo details updated successfully!');
        fetchCarouselItems();
        setTimeout(() => setCarouselStatusMessage(''), 4000);
      } else {
        alert('Update failed: ' + result.error);
      }
    } catch (err) {
      alert('Error updating photo: ' + err.message);
    }
  }

  async function handleExecuteDeleteCarouselItem() {
    if (!deletingCarouselItem) return;

    try {
      const res = await fetch(`/api/carousel?id=${encodeURIComponent(deletingCarouselItem.id)}`, {
        method: 'DELETE',
        headers: {
          'x-admin-passcode': getAdminPasscode()
        }
      });

      const result = await res.json();
      if (result.success) {
        setDeletingCarouselItem(null);
        setCarouselStatusMessage('✓ Photo deleted from Card Fan Carousel.');
        fetchCarouselItems();
        setTimeout(() => setCarouselStatusMessage(''), 4000);
      } else {
        alert('Delete failed: ' + result.error);
      }
    } catch (err) {
      alert('Delete error: ' + err.message);
    }
  }

  async function handleToggleCarouselActive(item) {
    try {
      const newActive = item.active === false ? true : false;
      const res = await fetch('/api/carousel', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-passcode': getAdminPasscode()
        },
        body: JSON.stringify({
          id: item.id,
          active: newActive
        })
      });

      const result = await res.json();
      if (result.success) {
        fetchCarouselItems();
      } else {
        alert('Failed to update status');
      }
    } catch (err) {
      alert('Error toggling status: ' + err.message);
    }
  }

  // Server-safe hydration guard: renders identical loading shell during SSR & initial client render
  if (!isMounted) {
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
          <h2 style={{ fontSize: '1.4rem', color: 'var(--color-sage)', marginBottom: '8px', fontFamily: 'var(--font-serif)' }}>
            FlowerSpot Management
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
            Verifying admin security session...
          </p>
        </div>
      </div>
    );
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
          <h2 style={{ fontSize: '1.6rem', color: 'var(--color-sage)', marginBottom: '8px', fontFamily: 'var(--font-serif)' }}>
            FlowerSpot Management Access
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.5 }}>
            Please enter your secret <strong>Admin Master Key</strong> to manage the live website catalogue, customer inquiries, and 3D card carousel.
          </p>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '18px', textAlign: 'left' }}>
              <label htmlFor="admin-master-key" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-sage)', display: 'block', marginBottom: '8px' }}>
                Secret Master Key
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="admin-master-key"
                  name="masterKey"
                  type={showKey ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="form-control"
                  placeholder="Enter secret master key..."
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  autoFocus
                  required
                  style={{ paddingRight: '42px', fontSize: '0.95rem', letterSpacing: showKey ? 'normal' : '0.1em' }}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    color: 'var(--text-muted)',
                    padding: '4px'
                  }}
                  title={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {authError && (
              <div style={{
                background: '#FFEBEE',
                border: '1px solid #FFCDD2',
                borderRadius: '8px',
                color: '#C62828',
                fontSize: '0.84rem',
                padding: '10px 14px',
                marginBottom: '16px',
                fontWeight: 500,
                textAlign: 'left'
              }}>
                ⚠️ {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifying}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
            >
              {isVerifying ? '⏳ Verifying...' : '🔐 Unlock Admin Portal'}
            </button>
          </form>

          <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '16px', marginBottom: 0 }}>
            🛡️ Server-secured via <code>ADMIN_MASTER_KEY</code>. Unauthorized access is blocked.
          </p>

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
        id="replace-photo-input"
        name="replacePhoto"
        aria-label="Replace Photo"
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
            onClick={() => setActiveTab('carousel')}
            className={`filter-btn ${activeTab === 'carousel' ? 'active' : ''}`}
          >
            🎡 Card Fan Carousel Management ({carouselItems.length})
          </button>
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

        {/* TAB 0: CARD FAN CAROUSEL MANAGEMENT */}
        {activeTab === 'carousel' && (
          <div className="admin-panel-card">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
              <div>
                <span className="badge badge-gold" style={{ marginBottom: '6px' }}>Hero Section Curation</span>
                <h3 style={{ fontSize: '1.6rem', color: 'var(--color-sage)', margin: '4px 0 6px' }}>
                  Card Fan Carousel Management
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '720px', margin: 0 }}>
                  Manage the photos displayed in the 3D Card Fan Carousel on the public website.
                  Upload multiple photos at once, reorder with accessible controls or drag-and-drop, and edit photo titles and links.
                </p>
              </div>

              {/* Status metrics */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ background: '#FAF8F5', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '8px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-sage)' }}>{carouselItems.length}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Photos</div>
                </div>
                <div style={{ background: '#FAF8F5', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '8px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#2E7D32' }}>{carouselItems.filter((i) => i.active !== false).length}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Live</div>
                </div>
                <div style={{ background: '#FAF8F5', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '8px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-gold)' }}>10 MB</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Max Size</div>
                </div>
              </div>
            </div>

            {/* Notification messages */}
            {carouselStatusMessage && (
              <div style={{
                padding: '12px 18px',
                borderRadius: '8px',
                marginBottom: '20px',
                background: '#E8F5E9',
                color: '#2E7D32',
                fontWeight: 600,
                fontSize: '0.9rem'
              }}>
                {carouselStatusMessage}
              </div>
            )}

            {carouselErrorMessage && (
              <div style={{
                padding: '12px 18px',
                borderRadius: '8px',
                marginBottom: '20px',
                background: '#FFEBEE',
                color: '#C62828',
                fontWeight: 600,
                fontSize: '0.88rem'
              }}>
                ⚠️ {carouselErrorMessage}
              </div>
            )}

            {/* Multi-Photo Upload Section */}
            <div style={{
              background: '#FAF8F5',
              border: '2px dashed rgba(184, 150, 92, 0.4)',
              borderRadius: '16px',
              padding: '28px 24px',
              textAlign: 'center',
              marginBottom: '32px'
            }}>
              <input
                type="file"
                id="carousel-files-input"
                name="carouselPhotos"
                aria-label="Upload multiple photos to card fan carousel"
                ref={carouselFileInputRef}
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleCarouselFileSelection}
                style={{ display: 'none' }}
              />

              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📸</div>
              <h4 style={{ fontSize: '1.2rem', color: 'var(--color-sage)', margin: '0 0 6px' }}>
                Upload Multiple Photos to Carousel
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', maxWidth: '580px', margin: '0 auto 18px' }}>
                Select one or more stage setup photos (JPEG, PNG, WebP up to 10MB each). You will be able to preview, customize titles, and confirm before saving.
              </p>

              <button
                type="button"
                onClick={() => carouselFileInputRef.current && carouselFileInputRef.current.click()}
                className="btn btn-gold"
                style={{ padding: '10px 24px', fontSize: '0.92rem' }}
              >
                ➕ Select Photos From Device (Multi-Select)
              </button>
            </div>

            {/* Pending Previews (Review before saving) */}
            {pendingCarouselFiles.length > 0 && (
              <div style={{
                background: '#FFFFFF',
                border: '1.5px solid var(--color-gold)',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '36px',
                boxShadow: '0 4px 20px rgba(184, 150, 92, 0.15)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
                  <div>
                    <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>Ready to Save</span>
                    <h4 style={{ fontSize: '1.15rem', color: 'var(--color-sage)', margin: '4px 0 0' }}>
                      Preview &amp; Edit Metadata ({pendingCarouselFiles.length} Selected)
                    </h4>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        pendingCarouselFiles.forEach((p) => {
                          if (p.previewUrl) try { URL.revokeObjectURL(p.previewUrl); } catch (_) {}
                        });
                        setPendingCarouselFiles([]);
                      }}
                      className="btn btn-ghost"
                      style={{ fontSize: '0.82rem', padding: '8px 14px' }}
                    >
                      Clear Selection
                    </button>
                    <button
                      type="button"
                      onClick={handleUploadCarouselBatch}
                      disabled={isCarouselUploading}
                      className="btn btn-primary"
                      style={{ fontSize: '0.88rem', padding: '9px 22px' }}
                    >
                      {isCarouselUploading ? '⏳ Uploading...' : `✓ Save & Publish ${pendingCarouselFiles.length} Photo(s)`}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                  {pendingCarouselFiles.map((item, idx) => (
                    <div
                      key={item.id}
                      style={{
                        background: '#FAF8F5',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '12px',
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <img
                          src={item.previewUrl}
                          alt={item.title}
                          style={{
                            width: '100px',
                            height: '75px',
                            borderRadius: '8px',
                            objectFit: 'cover',
                            flexShrink: 0,
                            border: '1px solid #EAE3D9'
                          }}
                        />
                        <div style={{ flexGrow: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--color-gold)', fontWeight: 700 }}>
                              PHOTO #{idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemovePendingCarouselFile(item.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#D32F2F',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                padding: '2px 6px'
                              }}
                              title="Discard"
                            >
                              ✖ Remove
                            </button>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '2px' }}>
                            {item.sizeFormatted}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label htmlFor={`carousel-title-${item.id}`} style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--color-sage)', display: 'block', marginBottom: '4px' }}>
                          Card Title
                        </label>
                        <input
                          id={`carousel-title-${item.id}`}
                          name={`carouselCardTitle_${item.id}`}
                          type="text"
                          className="form-control"
                          style={{ fontSize: '0.84rem', padding: '6px 10px' }}
                          value={item.title}
                          onChange={(e) => handleUpdatePendingCarouselFile(item.id, 'title', e.target.value)}
                          placeholder="e.g. Royal Wedding Mandap"
                        />
                      </div>

                      <div>
                        <label htmlFor={`carousel-alt-${item.id}`} style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--color-sage)', display: 'block', marginBottom: '4px' }}>
                          Alt Text (SEO &amp; Accessibility)
                        </label>
                        <input
                          id={`carousel-alt-${item.id}`}
                          name={`carouselCardAlt_${item.id}`}
                          type="text"
                          className="form-control"
                          style={{ fontSize: '0.84rem', padding: '6px 10px' }}
                          value={item.alt}
                          onChange={(e) => handleUpdatePendingCarouselFile(item.id, 'alt', e.target.value)}
                          placeholder="Describe the stage setup"
                        />
                      </div>

                      <div>
                        <label htmlFor={`carousel-link-${item.id}`} style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--color-sage)', display: 'block', marginBottom: '4px' }}>
                          Target Link
                        </label>
                        <input
                          id={`carousel-link-${item.id}`}
                          name={`carouselCardLink_${item.id}`}
                          type="text"
                          className="form-control"
                          style={{ fontSize: '0.84rem', padding: '6px 10px' }}
                          value={item.linkUrl}
                          onChange={(e) => handleUpdatePendingCarouselFile(item.id, 'linkUrl', e.target.value)}
                          placeholder="#backdrops"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Current Carousel Gallery */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <h4 style={{ fontSize: '1.25rem', color: 'var(--color-sage)', margin: 0 }}>
                  Active Carousel Gallery ({carouselItems.length} Photos)
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                  💡 Cards fan from left to right in this exact sequence. Drag cards or use Move buttons to reorder.
                </p>
              </div>

              {isLoadingCarousel ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  ⏳ Loading Card Fan Carousel photos...
                </div>
              ) : carouselItems.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '20px' }}>
                  {carouselItems.map((item, index) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={() => setDraggedCarouselId(item.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        handleDropCarouselReorder(draggedCarouselId, item.id);
                        setDraggedCarouselId(null);
                      }}
                      style={{
                        background: '#FFFFFF',
                        border: draggedCarouselId === item.id ? '2px dashed var(--color-gold)' : '1px solid var(--border-subtle)',
                        borderRadius: '14px',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        cursor: 'grab'
                      }}
                    >
                      {/* Thumbnail Container */}
                      <div style={{ height: '180px', position: 'relative', overflow: 'hidden', background: '#F5F2EB' }}>
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.alt || item.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-light)', fontSize: '0.85rem' }}>
                            No Image File
                          </div>
                        )}

                        {/* Order Badge */}
                        <div style={{
                          position: 'absolute',
                          top: '10px',
                          left: '10px',
                          background: 'rgba(27, 42, 33, 0.9)',
                          color: '#F4ECE1',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          backdropFilter: 'blur(4px)',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                        }}>
                          #{index + 1}
                        </div>

                        {/* Active status pill */}
                        <div style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          background: item.active !== false ? 'rgba(46, 125, 50, 0.9)' : 'rgba(100, 100, 100, 0.85)',
                          color: '#FFFFFF',
                          padding: '3px 9px',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          backdropFilter: 'blur(4px)'
                        }}>
                          {item.active !== false ? '● Live' : '○ Hidden'}
                        </div>
                      </div>

                      {/* Content */}
                      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                        <div style={{ marginBottom: '10px', flexGrow: 1 }}>
                          <h5 style={{ fontSize: '1rem', color: 'var(--color-sage)', margin: '0 0 4px', fontWeight: 600 }}>
                            {item.title || 'Untitled Backdrop'}
                          </h5>
                          {item.alt && item.alt !== item.title && (
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 4px', fontStyle: 'italic' }}>
                              Alt: &ldquo;{item.alt}&rdquo;
                            </p>
                          )}
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', margin: 0 }}>
                            🔗 Destination: <code>{item.linkUrl || '#backdrops'}</code>
                          </p>
                        </div>

                        {/* Move Position Controls */}
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                          <button
                            type="button"
                            onClick={() => handleMoveCarouselItem(index, 'up')}
                            disabled={index === 0}
                            className="btn btn-outline"
                            style={{
                              flex: 1,
                              padding: '6px 8px',
                              fontSize: '0.75rem',
                              opacity: index === 0 ? 0.4 : 1,
                              cursor: index === 0 ? 'not-allowed' : 'pointer'
                            }}
                            title="Move earlier in 3D carousel sequence"
                          >
                            ◀ Move Left
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveCarouselItem(index, 'down')}
                            disabled={index === carouselItems.length - 1}
                            className="btn btn-outline"
                            style={{
                              flex: 1,
                              padding: '6px 8px',
                              fontSize: '0.75rem',
                              opacity: index === carouselItems.length - 1 ? 0.4 : 1,
                              cursor: index === carouselItems.length - 1 ? 'not-allowed' : 'pointer'
                            }}
                            title="Move later in 3D carousel sequence"
                          >
                            Move Right ▶
                          </button>
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => setEditingCarouselItem(item)}
                            className="btn btn-ghost"
                            style={{ flex: 1, padding: '7px 8px', fontSize: '0.78rem', border: '1px solid var(--border-subtle)' }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleCarouselActive(item)}
                            className="btn btn-ghost"
                            style={{ padding: '7px 10px', fontSize: '0.78rem', border: '1px solid var(--border-subtle)' }}
                            title={item.active !== false ? 'Hide from public carousel' : 'Show in public carousel'}
                          >
                            {item.active !== false ? '👁️' : '👁️‍🗨️'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingCarouselItem(item)}
                            style={{
                              padding: '7px 12px',
                              background: '#FFEBEE',
                              color: '#D32F2F',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              border: '1px solid #FFCDD2',
                              cursor: 'pointer'
                            }}
                            title="Delete Photo"
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
                  padding: '50px 24px',
                  textAlign: 'center',
                  background: '#FAF8F5',
                  borderRadius: '16px',
                  border: '2px dashed rgba(184, 150, 92, 0.4)'
                }}>
                  <div style={{ fontSize: '2.8rem', marginBottom: '10px' }}>🎡</div>
                  <h4 style={{ color: 'var(--color-sage)', fontSize: '1.3rem', margin: '0 0 6px' }}>
                    No Photos Uploaded to Card Fan Carousel Yet
                  </h4>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '540px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                    The public website currently displays an intentional, layout-preserving empty hero frame without showing any AI placeholders or stock imagery.
                    Upload your real event photos above to make them fan across the hero showcase.
                  </p>
                  <button
                    type="button"
                    onClick={() => carouselFileInputRef.current && carouselFileInputRef.current.click()}
                    className="btn btn-gold"
                    style={{ padding: '10px 22px', fontSize: '0.88rem' }}
                  >
                    + Add First Carousel Photo
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

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
                <label htmlFor="backdrop-category-select">Target Category (Choose from 9 Verticals) *</label>
                <select
                  id="backdrop-category-select"
                  name="backdropCategory"
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
                <label htmlFor="file-input">Select Photo (Max: 10MB | Supports: JPG, PNG, WEBP, GIF) *</label>
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
                    name="backdropPhoto"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="backdrop-title-input">Setup / Backdrop Title *</label>
                  <input
                    id="backdrop-title-input"
                    name="backdropTitle"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Royal Jasmine & Brass Bell Mandap"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="backdrop-dimensions-input">Stage Dimensions</label>
                  <input
                    id="backdrop-dimensions-input"
                    name="backdropDimensions"
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
                  <label htmlFor="backdrop-ideal-for-input">Ideal For</label>
                  <input
                    id="backdrop-ideal-for-input"
                    name="backdropIdealFor"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Muhurtham, Grand Receptions, Sangeet"
                    value={idealFor}
                    onChange={(e) => setIdealFor(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="backdrop-included-input">Included Items (comma-separated)</label>
                  <input
                    id="backdrop-included-input"
                    name="backdropIncluded"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Full Floral Arch, 4 Chandeliers, Stage Lights, Sofa"
                    value={included}
                    onChange={(e) => setIncluded(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="backdrop-description-textarea">Description &amp; Specifications</label>
                <textarea
                  id="backdrop-description-textarea"
                  name="backdropDescription"
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
                  <label htmlFor="company-name-input">Business Name</label>
                  <input
                    id="company-name-input"
                    name="companyName"
                    type="text"
                    autoComplete="organization"
                    className="form-control"
                    value={company.name || ''}
                    onChange={(e) => setCompany({ ...company, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="company-tagline-input">Tagline / Headline</label>
                  <input
                    id="company-tagline-input"
                    name="companyTagline"
                    type="text"
                    className="form-control"
                    value={company.tagline || ''}
                    onChange={(e) => setCompany({ ...company, tagline: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="company-whatsapp-input">WhatsApp Number (without + or spaces, e.g. 918098415066)</label>
                  <input
                    id="company-whatsapp-input"
                    name="companyWhatsapp"
                    type="tel"
                    autoComplete="tel"
                    className="form-control"
                    value={company.whatsapp || ''}
                    onChange={(e) => setCompany({ ...company, whatsapp: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="company-phone-input">Display Phone Number</label>
                  <input
                    id="company-phone-input"
                    name="companyPhone"
                    type="tel"
                    autoComplete="tel"
                    className="form-control"
                    value={company.phone || ''}
                    onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="company-address-input">Workshop / Store Address</label>
                <input
                  id="company-address-input"
                  name="companyAddress"
                  type="text"
                  autoComplete="street-address"
                  className="form-control"
                  value={company.address || ''}
                  onChange={(e) => setCompany({ ...company, address: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="company-hours-input">Operating Hours</label>
                  <input
                    id="company-hours-input"
                    name="companyHours"
                    type="text"
                    className="form-control"
                    value={company.workingHours || ''}
                    onChange={(e) => setCompany({ ...company, workingHours: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="company-maps-input">Google Maps Directions URL</label>
                  <input
                    id="company-maps-input"
                    name="companyMaps"
                    type="url"
                    className="form-control"
                    value={company.googleMapsUrl || ''}
                    onChange={(e) => setCompany({ ...company, googleMapsUrl: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="company-instagram-input">Instagram Handle or URL (e.g. flow_erspot_events or https://www.instagram.com/flow_erspot_events/)</label>
                <input
                  id="company-instagram-input"
                  name="companyInstagram"
                  type="text"
                  className="form-control"
                  placeholder="flow_erspot_events"
                  value={company.instagram || ''}
                  onChange={(e) => setCompany({ ...company, instagram: e.target.value })}
                />
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
                          {inq.receivedAt ? inq.receivedAt.split('T')[0] : 'Recent'}
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
                          &ldquo;{inq.notes}&rdquo;
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

      {/* Edit Carousel Metadata Modal */}
      {editingCarouselItem && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '520px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h4 style={{ fontSize: '1.25rem', color: 'var(--color-sage)', margin: 0 }}>
                Edit Carousel Photo Details
              </h4>
              <button
                type="button"
                onClick={() => setEditingCarouselItem(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            {editingCarouselItem.imageUrl && (
              <div style={{ height: '140px', borderRadius: '10px', overflow: 'hidden', marginBottom: '18px', background: '#F5F2EB' }}>
                <img
                  src={editingCarouselItem.imageUrl}
                  alt={editingCarouselItem.alt || editingCarouselItem.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}

            <form onSubmit={handleSaveEditingCarouselItem}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label htmlFor="edit-carousel-title-input" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-sage)', display: 'block', marginBottom: '6px' }}>
                  Photo Title
                </label>
                <input
                  id="edit-carousel-title-input"
                  name="carouselItemTitle"
                  type="text"
                  className="form-control"
                  value={editingCarouselItem.title || ''}
                  onChange={(e) => setEditingCarouselItem({ ...editingCarouselItem, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label htmlFor="edit-carousel-alt-input" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-sage)', display: 'block', marginBottom: '6px' }}>
                  Alternative Text (Alt Text for SEO)
                </label>
                <input
                  id="edit-carousel-alt-input"
                  name="carouselItemAlt"
                  type="text"
                  className="form-control"
                  value={editingCarouselItem.alt || ''}
                  onChange={(e) => setEditingCarouselItem({ ...editingCarouselItem, alt: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label htmlFor="edit-carousel-desc-textarea" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-sage)', display: 'block', marginBottom: '6px' }}>
                  Description (Optional)
                </label>
                <textarea
                  id="edit-carousel-desc-textarea"
                  name="carouselItemDescription"
                  className="form-control"
                  rows={2}
                  value={editingCarouselItem.description || ''}
                  onChange={(e) => setEditingCarouselItem({ ...editingCarouselItem, description: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label htmlFor="edit-carousel-link-input" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-sage)', display: 'block', marginBottom: '6px' }}>
                  Click Destination (Target Link URL)
                </label>
                <input
                  id="edit-carousel-link-input"
                  name="carouselItemLink"
                  type="text"
                  className="form-control"
                  value={editingCarouselItem.linkUrl || ''}
                  onChange={(e) => setEditingCarouselItem({ ...editingCarouselItem, linkUrl: e.target.value })}
                  placeholder="#backdrops"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px' }}>
                <input
                  type="checkbox"
                  id="carousel-active-checkbox"
                  name="carouselItemActive"
                  checked={editingCarouselItem.active !== false}
                  onChange={(e) => setEditingCarouselItem({ ...editingCarouselItem, active: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--color-gold)', cursor: 'pointer' }}
                />
                <label htmlFor="carousel-active-checkbox" style={{ fontSize: '0.85rem', color: 'var(--color-sage)', cursor: 'pointer', fontWeight: 500 }}>
                  Active on Public Website (Visible in 3D Card Fan Carousel)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingCarouselItem(null)}
                  className="btn btn-ghost"
                  style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '8px 22px', fontSize: '0.85rem' }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCarouselItem && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '440px',
            width: '100%',
            padding: '26px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>⚠️</div>
            <h4 style={{ fontSize: '1.25rem', color: '#D32F2F', margin: '0 0 10px' }}>
              Confirm Photo Deletion
            </h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '18px', lineHeight: 1.5 }}>
              Are you sure you want to delete <strong>&ldquo;{deletingCarouselItem.title || 'this photo'}&rdquo;</strong> from the Card Fan Carousel?
              The image file will be permanently removed from storage.
            </p>

            {deletingCarouselItem.imageUrl && (
              <div style={{ height: '110px', borderRadius: '8px', overflow: 'hidden', marginBottom: '20px', border: '1px solid var(--border-subtle)' }}>
                <img
                  src={deletingCarouselItem.imageUrl}
                  alt={deletingCarouselItem.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setDeletingCarouselItem(null)}
                className="btn btn-ghost"
                style={{ padding: '9px 20px', fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDeleteCarouselItem}
                style={{
                  background: '#D32F2F',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 22px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Yes, Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
