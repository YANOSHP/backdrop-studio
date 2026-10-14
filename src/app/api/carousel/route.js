import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { isAuthorizedAdmin } from '@/lib/adminAuth';

const dataFilePath = path.join(process.cwd(), 'data', 'carousel.json');
const uploadDir = path.join(process.cwd(), 'public', 'uploads');

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp'
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per image

function isAuthorized(request) {
  return isAuthorizedAdmin(request);
}

function getLocalCarousel() {
  try {
    if (!fs.existsSync(dataFilePath)) {
      return [];
    }
    const content = fs.readFileSync(dataFilePath, 'utf-8');
    const parsed = JSON.parse(content || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading carousel data:', err);
    return [];
  }
}

function saveLocalCarousel(data) {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving carousel data:', err);
  }
}

// Ensure upload directory exists
function ensureUploadDir() {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}

/**
 * Public GET: Fetch all active carousel photos sorted by order.
 * Admins can pass ?all=true to see inactive photos as well.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const showAll = searchParams.get('all') === 'true';

  // 1. Try Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from('carousel')
        .select('*')
        .order('order', { ascending: true });

      if (!showAll) {
        query = query.eq('active', true);
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) {
        return NextResponse.json(data);
      }
    } catch (e) {
      console.warn('Supabase carousel fetch error, falling back to local JSON:', e);
    }
  }

  // 2. Fallback to local JSON store
  const items = getLocalCarousel();
  const sorted = [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const result = showAll ? sorted : sorted.filter((item) => item.active !== false);

  return NextResponse.json(result);
}

/**
 * Admin POST: Upload multiple photos at once with validation, safe naming, and metadata.
 */
export async function POST(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin authentication required.' },
      { status: 401 }
    );
  }

  try {
    ensureUploadDir();
    const formData = await request.formData();

    // Collect all uploaded files (handles multiple files under 'photos' or 'photo')
    const files = formData.getAll('photos').concat(formData.getAll('photo')).filter(
      (f) => f && typeof f === 'object' && typeof f.name === 'string' && f.name.length > 0
    );

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid image files provided.' },
        { status: 400 }
      );
    }

    const currentItems = getLocalCarousel();
    let maxOrder = currentItems.reduce((max, item) => Math.max(max, item.order ?? 0), -1);

    const uploadedItems = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // 1. File size validation
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: Exceeds 10MB limit.`);
        continue;
      }

      // 2. File MIME validation
      const mime = (file.type || '').toLowerCase();
      const ext = path.extname(file.name).toLowerCase();
      if (!ALLOWED_MIME_TYPES.includes(mime) && !ALLOWED_EXTENSIONS.includes(ext)) {
        errors.push(`${file.name}: Unsupported format. Please upload JPG, PNG, or WebP.`);
        continue;
      }

      // 3. Generate safe non-colliding filename
      const safeExtension = ALLOWED_EXTENSIONS.includes(ext) ? ext : '.jpg';
      const cleanBase = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
      const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const safeFilename = `carousel-${uniqueSuffix}-${cleanBase}${safeExtension}`;

      const buffer = Buffer.from(await file.arrayBuffer());
      let imageUrl = '';

      // Upload to Supabase if configured
      if (isSupabaseConfigured && supabase) {
        try {
          const { error: sErr } = await supabase.storage
            .from('uploads')
            .upload(safeFilename, buffer, {
              contentType: file.type || 'image/jpeg',
              upsert: true
            });

          if (!sErr) {
            const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(safeFilename);
            imageUrl = urlData.publicUrl;
          }
        } catch (e) {
          console.warn('Supabase storage upload error:', e);
        }
      }

      // Write to local disk storage
      try {
        const filePath = path.join(uploadDir, safeFilename);
        fs.writeFileSync(filePath, buffer);
        if (!imageUrl) {
          imageUrl = `/uploads/${safeFilename}`;
        }
      } catch (writeErr) {
        console.error('Local file write error:', writeErr);
        errors.push(`${file.name}: Failed to write to disk.`);
        continue;
      }

      // Optional metadata passed per-file or globally
      const itemTitle = formData.get(`title_${i}`) || formData.get('title') || cleanBase.replace(/_/g, ' ') || 'Stage Backdrop Setup';
      const itemAlt = formData.get(`alt_${i}`) || formData.get('alt') || itemTitle;
      const itemDescription = formData.get(`description_${i}`) || formData.get('description') || '';
      const itemLink = formData.get(`linkUrl_${i}`) || formData.get('linkUrl') || '#backdrops';

      maxOrder += 1;

      const newItem = {
        id: `car-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        imageUrl,
        filename: safeFilename,
        title: String(itemTitle).trim(),
        alt: String(itemAlt).trim(),
        description: String(itemDescription).trim(),
        linkUrl: String(itemLink).trim(),
        fileSize: file.size,
        order: maxOrder,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      uploadedItems.push(newItem);
    }

    if (uploadedItems.length === 0) {
      return NextResponse.json(
        { success: false, error: errors.join(' ') || 'All uploads failed validation.' },
        { status: 400 }
      );
    }

    // Persist new items locally
    const updatedCarousel = [...currentItems, ...uploadedItems];
    saveLocalCarousel(updatedCarousel);

    // Persist in Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('carousel').insert(uploadedItems);
      } catch (e) {
        console.warn('Supabase DB insert error:', e);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${uploadedItems.length} photo(s).`,
      count: uploadedItems.length,
      items: uploadedItems,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error in carousel upload:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Admin PUT: Reorder photos or update photo metadata (title, alt, linkUrl, active).
 */
export async function PUT(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin authentication required.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const currentItems = getLocalCarousel();

    // 1. Reorder Action: Array of IDs in the desired order
    if (body.action === 'reorder' && Array.isArray(body.order)) {
      const idOrderMap = new Map(body.order.map((id, index) => [id, index]));
      const updated = currentItems.map((item) => {
        if (idOrderMap.has(item.id)) {
          return {
            ...item,
            order: idOrderMap.get(item.id),
            updatedAt: new Date().toISOString()
          };
        }
        return item;
      });

      updated.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      saveLocalCarousel(updated);

      if (isSupabaseConfigured && supabase) {
        try {
          for (const item of updated) {
            await supabase.from('carousel').update({ order: item.order }).eq('id', item.id);
          }
        } catch (e) {
          console.warn('Supabase reorder update error:', e);
        }
      }

      return NextResponse.json({ success: true, items: updated });
    }

    // 2. Update Single Photo Metadata
    const { id, title, alt, description, linkUrl, active } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing photo ID.' }, { status: 400 });
    }

    const index = currentItems.findIndex((item) => item.id === id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Photo not found.' }, { status: 404 });
    }

    const current = currentItems[index];
    const updatedItem = {
      ...current,
      title: title !== undefined ? String(title).trim() : current.title,
      alt: alt !== undefined ? String(alt).trim() : current.alt,
      description: description !== undefined ? String(description).trim() : current.description,
      linkUrl: linkUrl !== undefined ? String(linkUrl).trim() : current.linkUrl,
      active: active !== undefined ? Boolean(active) : current.active,
      updatedAt: new Date().toISOString()
    };

    currentItems[index] = updatedItem;
    saveLocalCarousel(currentItems);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('carousel').update(updatedItem).eq('id', id);
      } catch (e) {
        console.warn('Supabase item update error:', e);
      }
    }

    return NextResponse.json({ success: true, item: updatedItem });
  } catch (error) {
    console.error('Error updating carousel item:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Admin DELETE: Remove photo metadata and delete corresponding file from storage.
 */
export async function DELETE(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin authentication required.' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing photo id' }, { status: 400 });
    }

    const currentItems = getLocalCarousel();
    const itemToDelete = currentItems.find((item) => item.id === id);

    if (!itemToDelete) {
      return NextResponse.json({ success: false, error: 'Photo not found' }, { status: 404 });
    }

    // 1. Delete physical file if saved locally
    if (itemToDelete.filename) {
      const localFilePath = path.join(uploadDir, itemToDelete.filename);
      if (fs.existsSync(localFilePath)) {
        try {
          fs.unlinkSync(localFilePath);
        } catch (unlinkErr) {
          console.warn('Could not delete local file:', unlinkErr);
        }
      }
    } else if (itemToDelete.imageUrl && itemToDelete.imageUrl.startsWith('/uploads/')) {
      const filename = path.basename(itemToDelete.imageUrl);
      const localFilePath = path.join(uploadDir, filename);
      if (fs.existsSync(localFilePath)) {
        try {
          fs.unlinkSync(localFilePath);
        } catch (unlinkErr) {
          console.warn('Could not delete local file:', unlinkErr);
        }
      }
    }

    // 2. Delete from Supabase Storage if configured
    if (isSupabaseConfigured && supabase && itemToDelete.filename) {
      try {
        await supabase.storage.from('uploads').remove([itemToDelete.filename]);
        await supabase.from('carousel').delete().eq('id', id);
      } catch (sErr) {
        console.warn('Supabase delete error:', sErr);
      }
    }

    // 3. Update local JSON store
    const filtered = currentItems.filter((item) => item.id !== id);
    // Re-index remaining order
    const reindexed = filtered.map((item, index) => ({
      ...item,
      order: index
    }));
    saveLocalCarousel(reindexed);

    return NextResponse.json({
      success: true,
      message: 'Photo deleted successfully.',
      remainingCount: reindexed.length
    });
  } catch (error) {
    console.error('Error deleting carousel photo:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
