import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { isAuthorizedAdmin } from '@/lib/adminAuth';

const dataFilePath = path.join(process.cwd(), 'data', 'backdrops.json');
const uploadDir = path.join(process.cwd(), 'public', 'uploads');

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml'
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function getLocalBackdrops() {
  try {
    if (!fs.existsSync(dataFilePath)) {
      return [];
    }
    const content = fs.readFileSync(dataFilePath, 'utf-8');
    return JSON.parse(content || '[]');
  } catch (err) {
    console.error('Error reading backdrops:', err);
    return [];
  }
}

function saveLocalBackdrops(data) {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving local backdrops:', err);
  }
}

export async function GET() {
  // 1. Try Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('backdrops')
        .select('*')
        .order('createdat', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const normalized = data.map((b) => ({
          id: b.id,
          title: b.title,
          category: b.category,
          image: b.image || '',
          description: b.description || '',
          dimensions: b.dimensions || '',
          idealFor: b.idealfor || b.idealFor || '',
          included: Array.isArray(b.included) ? b.included : [],
          createdAt: b.createdat || b.createdAt
        }));
        return NextResponse.json(normalized);
      }
      if (error) {
        console.warn('Supabase fetch failed or table empty, using local backup:', error?.message);
      }
    } catch (e) {
      console.error('Supabase exception:', e);
    }
  }

  // 2. Fallback to local JSON storage
  const backdrops = getLocalBackdrops();
  return NextResponse.json(backdrops);
}

export async function POST(request) {
  if (!isAuthorizedAdmin(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication required.' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const title = formData.get('title') || 'Untitled Setup';
    const category = formData.get('category') || 'Wedding Decorations';
    const description = formData.get('description') || '';
    const dimensions = formData.get('dimensions') || 'Customizable Stage Size';
    const idealFor = formData.get('idealFor') || 'All Events';
    const includedStr = formData.get('included') || '';
    const file = formData.get('image');

    let imageUrl = '';

    if (file && typeof file === 'object' && file.name) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, error: 'File size exceeds maximum 10MB limit.' },
          { status: 400 }
        );
      }

      if (file.type && !ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
        return NextResponse.json(
          { success: false, error: 'Unsupported file format. Please upload JPG, PNG, WEBP, or GIF.' },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

      // A. If Supabase is configured, upload to Supabase Storage bucket 'uploads'
      if (isSupabaseConfigured && supabase) {
        try {
          const { error: storageErr } = await supabase.storage
            .from('uploads')
            .upload(safeName, buffer, {
              contentType: file.type || 'image/jpeg',
              upsert: true
            });

          if (!storageErr) {
            const { data: urlData } = supabase.storage
              .from('uploads')
              .getPublicUrl(safeName);
            imageUrl = urlData.publicUrl;
          } else {
            console.warn('Supabase storage upload error:', storageErr.message);
          }
        } catch (storageException) {
          console.error('Supabase storage exception:', storageException);
        }
      }

      // B. Also save locally into public/uploads as fallback/mirror
      try {
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const filePath = path.join(uploadDir, safeName);
        fs.writeFileSync(filePath, buffer);
        if (!imageUrl) {
          imageUrl = `/uploads/${safeName}`;
        }
      } catch (localWriteErr) {
        console.error('Error writing local file:', localWriteErr);
      }
    } else if (typeof file === 'string' && file.trim()) {
      imageUrl = file.trim();
    }

    const included = includedStr
      ? includedStr.split(',').map((s) => s.trim()).filter(Boolean)
      : ['Full Stage Setup', 'Stage Lighting', 'On-site Assembly'];

    const newBackdrop = {
      id: `bd-${Date.now()}`,
      title,
      category,
      image: imageUrl,
      description,
      dimensions,
      idealFor,
      included,
      createdAt: new Date().toISOString()
    };

    // Save to Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const supabaseRow = {
          id: newBackdrop.id,
          title: newBackdrop.title,
          category: newBackdrop.category,
          image: newBackdrop.image || null,
          description: newBackdrop.description || null,
          dimensions: newBackdrop.dimensions || null,
          idealfor: newBackdrop.idealFor || null,
          included: Array.isArray(newBackdrop.included) ? newBackdrop.included : [],
          createdat: newBackdrop.createdAt || new Date().toISOString()
        };

        const { error: dbError } = await supabase
          .from('backdrops')
          .insert([supabaseRow]);

        if (dbError) {
          console.warn('Supabase DB insert error:', dbError.message);
        }
      } catch (dbException) {
        console.error('Supabase DB exception:', dbException);
      }
    }

    // Always mirror to local JSON
    const backdrops = getLocalBackdrops();
    backdrops.unshift(newBackdrop);
    saveLocalBackdrops(backdrops);

    return NextResponse.json({ success: true, backdrop: newBackdrop });
  } catch (error) {
    console.error('Error adding backdrop:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  if (!isAuthorizedAdmin(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication required.' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const id = formData.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing item ID.' }, { status: 400 });
    }

    const backdrops = getLocalBackdrops();
    const index = backdrops.findIndex((b) => b.id === id);
    const current = index !== -1 ? backdrops[index] : {};

    const title = formData.get('title') ?? current.title;
    const category = formData.get('category') ?? current.category;
    const description = formData.get('description') ?? current.description;
    const dimensions = formData.get('dimensions') ?? current.dimensions;
    const idealFor = formData.get('idealFor') ?? current.idealFor;
    const includedStr = formData.get('included');
    const file = formData.get('image');

    let imageUrl = current.image || '';

    if (file && typeof file === 'object' && file.name) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, error: 'File size exceeds maximum 10MB limit.' },
          { status: 400 }
        );
      }
      if (file.type && !ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
        return NextResponse.json(
          { success: false, error: 'Unsupported file format.' },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

      if (isSupabaseConfigured && supabase) {
        try {
          const { error: sErr } = await supabase.storage
            .from('uploads')
            .upload(safeName, buffer, { contentType: file.type || 'image/jpeg', upsert: true });

          if (!sErr) {
            const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(safeName);
            imageUrl = urlData.publicUrl;
          }
        } catch (e) {
          console.error(e);
        }
      }

      try {
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const filePath = path.join(uploadDir, safeName);
        fs.writeFileSync(filePath, buffer);
        if (!imageUrl || !imageUrl.startsWith('http')) {
          imageUrl = `/uploads/${safeName}`;
        }
      } catch (e) {
        console.error(e);
      }
    }

    const included = includedStr !== null && includedStr !== undefined
      ? includedStr.split(',').map((s) => s.trim()).filter(Boolean)
      : current.included;

    const updated = {
      ...current,
      id,
      title,
      category,
      image: imageUrl,
      description,
      dimensions,
      idealFor,
      included,
      updatedAt: new Date().toISOString()
    };

    // Update in Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const supabaseUpdate = {
          title: updated.title,
          category: updated.category,
          image: updated.image || null,
          description: updated.description || null,
          dimensions: updated.dimensions || null,
          idealfor: updated.idealFor || null,
          included: Array.isArray(updated.included) ? updated.included : [],
          updatedat: new Date().toISOString()
        };
        await supabase.from('backdrops').update(supabaseUpdate).eq('id', id);
      } catch (e) {
        console.error(e);
      }
    }

    // Update locally
    if (index !== -1) {
      backdrops[index] = updated;
      saveLocalBackdrops(backdrops);
    }

    return NextResponse.json({ success: true, backdrop: updated });
  } catch (error) {
    console.error('Error updating backdrop:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!isAuthorizedAdmin(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication required.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    // Delete in Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('backdrops').delete().eq('id', id);
      } catch (e) {
        console.error(e);
      }
    }

    // Delete locally
    const backdrops = getLocalBackdrops();
    const filtered = backdrops.filter((b) => b.id !== id);
    saveLocalBackdrops(filtered);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting backdrop:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
