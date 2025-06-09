import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Environment variables for backend API
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_API_URL || 'http://localhost:4000';

// API handler for /api/airports
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the keyword query parameter from the request
    const { keyword } = req.query;

    // Validate that keyword is provided and is a string
    if (!keyword || typeof keyword !== 'string') {
      return res.status(400).json({ error: 'Keyword query parameter is required' });
    }

    console.log(`[API] Searching airports with keyword: "${keyword}"`);

    // Make a request to the backend API to search for airports
    const result = await axios.get(`${BACKEND_API_URL}/api/airports`, { params: { keyword } });

    // Log the full response for debugging
    console.log('[API] Backend response:', JSON.stringify(result.data, null, 2));

    // Handle various response structures from backend
    let airportsData = [];
    let metaData = { total: 0, limit: 10, offset: 0 };
    
    if (result.data && result.data.status === 'success') {
      if (result.data.airports && result.data.airports.data) {
        // Handle nested structure { status, airports: { data: { airports, meta } } }
        airportsData = result.data.airports.data.airports || [];
        metaData = result.data.airports.data.meta || metaData;
      } else if (result.data.airports) {
        // Handle structure { status, airports: [...] }
        airportsData = result.data.airports || [];
      } else if (result.data.data && result.data.data.airports) {
        // Handle structure { status, data: { airports, meta } }
        airportsData = result.data.data.airports || [];
        metaData = result.data.data.meta || metaData;
      } else {
        console.log('[API] Invalid response format from backend:', JSON.stringify(result.data, null, 2));
        throw new Error('Invalid response format from backend server');
      }
      console.log('[API] Found ' + airportsData.length + ' airports for keyword "' + keyword + '"');
      return res.status(200).json({
        status: 'success',
        data: {
          airports: airportsData,
          meta: metaData
        }
      });
    } else {
      console.log('[API] Error searching airports: Unexpected response status');
      throw new Error('Unexpected response status from backend server');
    }
  } catch (error: any) {
    console.error('[API] Error searching airports:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Error searching airports',
      error: error.message
    });
  }
} 