// Load environment variables FIRST
require('dotenv').config();
console.log('[DEBUG] AVIATION_STACK_API_KEY in index.js:', process.env.AVIATION_STACK_API_KEY); // Debug line

const express = require('express');
const cors = require('cors');
const aviationService = require('./services/aviationStack'); // Now this will be imported AFTER dotenv has run
const aviationRouter = require('./routes/aviation');
const apiRoutes = require('./routes/api');

// Environment configuration
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const AVIATION_STACK_API_KEY = process.env.AVIATION_STACK_API_KEY;

// Disable mock data mode to use real API
const USE_MOCK_DATA = false;

console.log('[DEBUG] AVIATION_STACK_API_KEY in index.js:', AVIATION_STACK_API_KEY);

// Create Express app
const app = express();

// Configure middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enhanced request logger middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  console.log(`Query params:`, req.query);
  console.log(`Headers:`, req.headers);
  next();
});

// Mount aviation router with all flight-related endpoints
// This includes:
//  - /api/airports
//  - /api/flights
//  - /api/flightsFuture (new endpoint for future flight searches)
app.use('/api', aviationRouter);

// Mount API routes
app.use('/api', apiRoutes);

// Log that we're using the new aviation router
console.log('[SERVER] Mounted aviation router at /api path');

// Health check endpoint
app.get('/health', (req, res) => {
  const serviceStatus = aviationService.getServiceStatus();
  res.json({
    status: 'healthy',
    environment: NODE_ENV,
    apiKey: AVIATION_STACK_API_KEY ? 'configured' : 'missing',
    service: serviceStatus
  });
});

// Test endpoint to check API
app.get('/test', (req, res) => {
  res.json({ status: 'success', message: 'API is working' });
});

// Global error handler with detailed logging
app.use((err, req, res, next) => {
  console.error('=== ERROR DETAILS ===');
  console.error('Timestamp:', new Date().toISOString());
  console.error('URL:', req.url);
  console.error('Method:', req.method);
  console.error('Query:', req.query);
  console.error('Error message:', err.message);
  console.error('Error stack:', err.stack);
  console.error('===================');
  
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n=== SIMPLIFIED BACKEND SERVER ===`);
  console.log(`Server running on port ${PORT} in ${NODE_ENV} mode`);
  console.log(`AviationStack API key: ${AVIATION_STACK_API_KEY ? 'Configured ✅' : 'Missing ❌'}`);
  console.log(`\nOpen http://localhost:${PORT}/test to verify the API is working`);
  console.log(`Open http://localhost:${PORT}/api/airports?keyword=DFW to test airport search`);
  console.log(`Open http://localhost:${PORT}/health to check service status`);
  console.log(`=========================================\n`);
});
