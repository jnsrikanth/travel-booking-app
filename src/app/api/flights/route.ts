import { NextResponse } from 'next/server';
import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const response = await axios.get(`${BACKEND_URL}/api/flights`, { params });
    
    if (!response.data) {
      throw new Error('No data received from backend');
    }

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('[API] Flight search error:', error);
    
    const errorMessage = error.response?.data?.message || error.message || 'Failed to search flights';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: error.response?.status || 500 }
    );
  }
} 