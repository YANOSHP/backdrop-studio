import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { isAuthorizedAdmin } from '@/lib/adminAuth';

const companyFilePath = path.join(process.cwd(), 'data', 'company.json');

function getLocalCompanyData() {
  try {
    if (!fs.existsSync(companyFilePath)) {
      return {};
    }
    return JSON.parse(fs.readFileSync(companyFilePath, 'utf-8'));
  } catch (err) {
    console.error('Error reading company data:', err);
    return {};
  }
}

function saveLocalCompanyData(data) {
  try {
    fs.writeFileSync(companyFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving company data:', err);
  }
}

export async function GET() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('company')
        .select('*')
        .limit(1)
        .single();

      if (!error && data && data.name) {
        return NextResponse.json(data);
      }
    } catch (e) {
      console.error('Supabase company fetch exception:', e);
    }
  }

  return NextResponse.json(getLocalCompanyData());
}

export async function POST(request) {
  if (!isAuthorizedAdmin(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication required.' }, { status: 401 });
  }

  try {
    const updated = await request.json();
    const current = getLocalCompanyData();
    const merged = { ...current, ...updated, id: 'company_profile' };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('company')
          .upsert([merged]);
      } catch (e) {
        console.error('Supabase company upsert error:', e);
      }
    }

    saveLocalCompanyData(merged);
    return NextResponse.json({ success: true, company: merged });
  } catch (err) {
    console.error('Error updating company data:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
