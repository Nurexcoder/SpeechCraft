import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { storeToken } from '../lib/token';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    const appPassword = process.env.APP_PASSWORD || 'hellfire@asdf';

    if (password !== appPassword) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Generate a secure random token
    const token = randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Store token
    storeToken(token, expiresAt);

    return NextResponse.json({
      token,
      expiresAt,
    });
  } catch (error) {
    console.error('Auth Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


