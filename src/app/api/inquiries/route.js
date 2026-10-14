import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const inquiriesFilePath = path.join(process.cwd(), 'data', 'inquiries.json');

function getLocalInquiries() {
  try {
    if (!fs.existsSync(inquiriesFilePath)) {
      return [];
    }
    return JSON.parse(fs.readFileSync(inquiriesFilePath, 'utf-8'));
  } catch (err) {
    return [];
  }
}

function saveLocalInquiries(data) {
  try {
    fs.writeFileSync(inquiriesFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving local inquiries:', err);
  }
}

export async function GET() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('inquiries')
        .select('*')
        .order('receivedat', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const normalized = data.map((item) => ({
          id: item.id,
          name: item.name,
          phone: item.phone,
          eventDate: item.eventdate || item.eventDate || '',
          eventType: item.eventtype || item.eventType || 'General',
          selectedBackdrop: item.selectedbackdrop || item.selectedBackdrop || '',
          notes: item.notes || '',
          status: item.status || 'New',
          receivedAt: item.receivedat || item.receivedAt || new Date().toISOString()
        }));
        return NextResponse.json(normalized);
      }
    } catch (e) {
      console.error('Supabase inquiries fetch exception:', e);
    }
  }

  return NextResponse.json(getLocalInquiries());
}

export async function POST(request) {
  try {
    const body = await request.json();
    const newEntry = {
      id: `inq-${Date.now()}`,
      ...body,
      receivedAt: new Date().toISOString(),
      status: 'New'
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const extraDetails = [
          body.venueName ? `Venue: ${body.venueName}${body.venueCity ? `, ${body.venueCity}` : ''}` : '',
          body.venueType ? `Type: ${body.venueType}` : '',
          body.venueSetting ? `Setting: ${body.venueSetting}` : '',
          body.stageDimensions ? `Stage: ${body.stageDimensions}` : '',
          body.budget ? `Budget: ${body.budget}` : '',
          body.email ? `Email: ${body.email}` : ''
        ].filter(Boolean).join(' | ');

        const combinedNotes = [
          body.notes || '',
          extraDetails ? `[Details: ${extraDetails}]` : ''
        ].filter(Boolean).join('\n');

        const supabaseRow = {
          id: newEntry.id,
          name: newEntry.name,
          phone: newEntry.phone,
          eventdate: newEntry.eventDate || null,
          eventtype: newEntry.eventType || 'General',
          selectedbackdrop: newEntry.selectedBackdrop || 'General Inquiry',
          notes: combinedNotes || null,
          status: newEntry.status || 'New',
          receivedat: newEntry.receivedAt
        };

        const { error: inqErr } = await supabase.from('inquiries').insert([supabaseRow]);
        if (inqErr) {
          console.warn('Supabase inquiries insert error:', inqErr.message);
        }
      } catch (e) {
        console.error('Supabase inquiries insert error:', e);
      }
    }

    const inquiries = getLocalInquiries();
    inquiries.unshift(newEntry);
    saveLocalInquiries(inquiries);

    return NextResponse.json({ success: true, inquiry: newEntry });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
