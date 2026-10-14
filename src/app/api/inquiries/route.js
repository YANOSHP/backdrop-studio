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
        .order('receivedAt', { ascending: false });

      if (!error && Array.isArray(data)) {
        return NextResponse.json(data);
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
        await supabase.from('inquiries').insert([newEntry]);
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
