import { NextResponse } from 'next/server';
import { generateAdminSessionToken, isAuthorizedAdmin } from '@/lib/adminAuth';

/**
 * POST /api/admin/auth
 * Validates the admin secret master key against the server environment variable.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const key = (body?.key || body?.passcode || '').trim();

    if (!key) {
      return NextResponse.json(
        { success: false, error: 'Please enter your master passkey.' },
        { status: 400 }
      );
    }

    const token = generateAdminSessionToken(key);

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Invalid master key. Please check your credentials.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Access granted.',
      token
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || 'Server authentication error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/auth
 * Verifies if the current stored token or key in headers is still valid.
 */
export async function GET(request) {
  const authorized = isAuthorizedAdmin(request);
  return NextResponse.json({ authenticated: authorized });
}
