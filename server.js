/**
 * Rakt Kavach - Express.js Server
 * Secure Gateway with Zero-Trust Architecture
 * National Digital Blood Grid Entry Point
 */

import express from 'express';
import bodyParser from 'body-parser';
import crypto from 'crypto';

// Import core modules
import security from './src/core/security.js';
import transparency from './src/api/transparency.js';
import gemini from './src/utils/geminiConnector.js';

// Initialize Express application
const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware configuration
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request tracking for audit trail
app.use((req, res, next) => {
  req.requestId = security.generateSessionToken(16);
  req.timestamp = new Date().toISOString();
  req.ipAddress = req.socket.remoteAddress;
  next();
});

// Zero-Trust validation middleware
app.use((req, res, next) => {
  // Skip validation for health endpoints
  if (req.path === '/health' || req.path === '/') {
    return next();
  }

  // Validate Zero-Trust requirements
  const zeroTrustValidation = security.validateZeroTrust(req);
  
  if (!zeroTrustValidation.isValid && NODE_ENV === 'production') {
    // Create security audit log
    const auditLog = security.createAuditLog({
      type: 'ZERO_TRUST_VIOLATION',
      userId: 'UNKNOWN',
      action: 'REJECTED_REQUEST',
      resource: req.path,
      status: 'FAILED',
      ipAddress: req.ipAddress,
    });

    res.status(403).json({
      error: 'Access denied - Zero-Trust validation failed',
      reason: zeroTrustValidation.reason,
      auditId: auditLog.id,
      timestamp: req.timestamp,
    });
    return;
  }

  res.locals.zeroTrust = zeroTrustValidation;
  next();
});

// ============================================
// ROOT & HEALTH CHECK ENDPOINTS
// ============================================

/**
 * Root endpoint - System information
 */
app.get('/', (req, res) => {
  const systemInfo = {
    system: 'Rakt Kavach - National Digital Blood Grid',
    version: '2.0.0-core-logic',
    status: 'OPERATIONAL',
    environment: NODE_ENV,
    architecture: 'Zero-Trust Fortress',
    uptime: process.uptime(),
    timestamp: req.timestamp,
    features: {
      dataSovereignty: 'ENABLED',
      realTimeIntegrity: 'ENABLED',
      transparencyProtocol: 'ENABLED',
      userEmpowerment: 'ENABLED',
      geminiIntegration: gemini.getStatus().mode,
    },
    endpoints: {
      health: '/health',
      donor: {
        register: 'POST /api/donor/register',
        status: 'GET /api/donor/status?donorId=<id>',
      },
      transparency: {
        fairPrice: 'POST /api/check-fair-price',
        report: 'GET /api/transparency/report',
      },
      security: {
        verifySignature: 'POST /api/security/verify-signature',
        auditLog: 'GET /api/security/audit-log',
      },
    },
  };

  res.json(systemInfo);
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  const health = {
    status: 'HEALTHY',
    uptime: process.uptime(),
    environment: NODE_ENV,
    modules: {
      securityEngine: 'ACTIVE',
      transparencyModule: 'ACTIVE',
      geminiConnector: gemini.getStatus().status,
    },
    timestamp: new Date().toISOString(),
  };

  res.json(health);
});

// ============================================
// DONOR REGISTRATION ENDPOINTS
// ============================================

/**
 * Register a new blood donor
 * POST /api/donor/register
 * 
 * Request body:
 * {
 *   "name": "string",
 *   "bloodType": "string (O+, O-, A+, A-, B+, B-, AB+, AB-)",
 *   "email": "string",
 *   "phone": "string",
 *   "age": "number",
 *   "lastDonationDate": "ISO date string",
 *   "medicalHistory": "string"
 * }
 */
app.post('/api/donor/register', async (req, res) => {
  try {
    const { name, bloodType, email, phone, age, lastDonationDate, medicalHistory } = req.body;

    // Validate input
    const validation = validateDonorRegistration({ name, bloodType, email, phone, age });
    if (!validation.isValid) {
      const auditLog = security.createAuditLog({
        type: 'DONOR_REGISTRATION_FAILED',
        userId: email || 'UNKNOWN',
        action: 'INVALID_INPUT',
        resource: 'DONOR_REGISTRATION',
        status: 'VALIDATION_ERROR',
        ipAddress: req.ipAddress,
      });

      return res.status(400).json({
        success: false,
        error: validation.error,
        auditId: auditLog.id,
      });
    }

    // Create donor profile
    const donorProfile = {
      id: security.generateSessionToken(16),
      name: security.maskData(name),
      bloodType,
      email: security.maskData(email),
      phone: security.maskData(phone),
      age,
      lastDonationDate,
      medicalHistory,
      registrationDate: req.timestamp,
      status: 'ACTIVE',
    };

    // Encrypt sensitive donor data
    const encryptedData = {
      name: security.encrypt(name),
      email: security.encrypt(email),
      phone: security.encrypt(phone),
      medicalHistory: security.encrypt(medicalHistory || ''),
    };

    // Generate integrity signature for donor record
    const donorDataString = JSON.stringify({
      id: donorProfile.id,
      bloodType: donorProfile.bloodType,
      age: donorProfile.age,
      registrationDate: donorProfile.registrationDate,
    });

    const signature = security.generateDataSignature(donorDataString);

    // Create audit log entry
    const auditLog = security.createAuditLog({
      type: 'DONOR_REGISTRATION_SUCCESS',
      userId: donorProfile.id,
      action: 'REGISTER_DONOR',
      resource: `DONOR:${donorProfile.id}`,
      status: 'SUCCESS',
      ipAddress: req.ipAddress,
    });

    // Store in transparency module
    transparency.registerDonor({
      donorId: donorProfile.id,
      profile: donorProfile,
      encrypted: encryptedData,
      signature,
      auditId: auditLog.id,
    });

    res.status(201).json({
      success: true,
      message: 'Donor registration successful',
      donorId: donorProfile.id,
      maskedData: {
        name: donorProfile.name,
        email: donorProfile.email,
        phone: donorProfile.phone,
        bloodType: donorProfile.bloodType,
      },
      signature,
      auditId: auditLog.id,
      registrationTimestamp: req.timestamp,
    });

  } catch (error) {
    console.error('[DONOR_REGISTRATION]', error.message);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: error.message,
    });
  }
});

/**
 * Get donor status and donation history
 * GET /api/donor/status?donorId=<id>
 */
app.get('/api/donor/status', (req, res) => {
  try {
    const { donorId } = req.query;

    if (!donorId) {
      return res.status(400).json({
        error: 'donorId query parameter required',
      });
    }

    const donorStatus = transparency.getDonorStatus(donorId);

    if (!donorStatus.success) {
      return res.status(404).json(donorStatus);
    }

    res.json(donorStatus);

  } catch (error) {
    console.error('[DONOR_STATUS]', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve donor status',
    });
  }
});

// ============================================
// TRANSPARENCY & FAIR PRICING ENDPOINTS
// ============================================

/**
 * Check Fair Price with Gemini AI Integration
 * POST /api/check-fair-price
 * 
 * Request body:
 * {
 *   "bloodType": "string",
 *   "quantity": "number",
 *   "location": "string",
 *   "priority": "NORMAL | EMERGENCY",
 *   "patientId": "string"
 * }
 */
app.post('/api/check-fair-price', async (req, res) => {
  try {
    const { bloodType, quantity, location, priority, patientId } = req.body;

    // Validate request
    const validation = validatePriceCheckRequest({ bloodType, quantity, location });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }

    // Get basic price calculation
    const basicPrice = transparency.calculateFairPrice({
      bloodType,
      quantity,
      priority: priority || 'NORMAL',
    });

    // Prepare data for Gemini AI analysis
    const analysisData = {
      bloodType,
      quantity,
      location,
      priority,
      basePriceINR: basicPrice.totalPrice,
      timestamp: req.timestamp,
    };

    // Call Gemini for AI-driven analysis
    console.log('[GEMINI] Initiating fair-price analysis...');
    const aiAnalysis = await gemini.analyzeData(analysisData);

    // Create integrity signature for price quote
    const quoteData = JSON.stringify({
      bloodType,
      quantity,
      location,
      basePriceINR: basicPrice.totalPrice,
      timestamp: req.timestamp,
    });

    const priceSignature = security.generateDataSignature(quoteData);

    // Create audit log for price check
    const auditLog = security.createAuditLog({
      type: 'FAIR_PRICE_CHECK',
      userId: patientId || 'ANONYMOUS',
      action: 'REQUEST_PRICE_CHECK',
      resource: `PRICE_CHECK:${bloodType}`,
      status: 'SUCCESS',
      ipAddress: req.ipAddress,
    });

    // Compile response
    const response = {
      success: true,
      priceAnalysis: {
        bloodType,
        quantity,
        location,
        priority: priority || 'NORMAL',
        basicCalculation: basicPrice,
        aiVerification: {
          model: aiAnalysis.model,
          status: aiAnalysis.success ? 'VERIFIED' : 'PENDING',
          analysis: aiAnalysis.analysis || {},
        },
        finalPriceINR: basicPrice.totalPrice,
        priceValidUntil: basicPrice.priceValidUntil,
      },
      integrity: {
        signature: priceSignature,
        verified: security.verifyDataSignature(quoteData, priceSignature),
      },
      auditId: auditLog.id,
      requestId: req.requestId,
      timestamp: req.timestamp,
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('[FAIR_PRICE_CHECK]', error.message);
    res.status(500).json({
      success: false,
      error: 'Price check failed',
      message: error.message,
    });
  }
});

/**
 * Get transparency report
 * GET /api/transparency/report
 */
app.get('/api/transparency/report', (req, res) => {
  try {
    const report = transparency.generateTransparencyReport();

    res.json({
      success: true,
      report,
      timestamp: req.timestamp,
    });

  } catch (error) {
    console.error('[TRANSPARENCY_REPORT]', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to generate transparency report',
    });
  }
});

// ============================================
// SECURITY & INTEGRITY ENDPOINTS
// ============================================

/**
 * Verify data signature and integrity
 * POST /api/security/verify-signature
 * 
 * Request body:
 * {
 *   "data": "string",
 *   "signature": "string"
 * }
 */
app.post('/api/security/verify-signature', (req, res) => {
  try {
    const { data, signature } = req.body;

    if (!data || !signature) {
      return res.status(400).json({
        error: 'data and signature required',
      });
    }

    const isValid = security.verifyDataSignature(data, signature);

    res.json({
      success: true,
      dataIntegrity: {
        verified: isValid,
        data: security.maskData(data),
        signature: signature.substring(0, 16) + '...',
      },
      timestamp: req.timestamp,
    });

  } catch (error) {
    console.error('[SIGNATURE_VERIFICATION]', error.message);
    res.status(500).json({
      success: false,
      error: 'Signature verification failed',
    });
  }
});

/**
 * Get audit log entries
 * GET /api/security/audit-log?limit=<number>&offset=<number>
 */
app.get('/api/security/audit-log', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;

    const auditLog = transparency.getAuditLog(limit, offset);

    res.json({
      success: true,
      auditLog,
      pagination: {
        limit,
        offset,
        total: transparency.getAuditLogCount(),
      },
      timestamp: req.timestamp,
    });

  } catch (error) {
    console.error('[AUDIT_LOG]', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve audit log',
    });
  }
});

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validate donor registration input
 */
function validateDonorRegistration(data) {
  if (!data.name || typeof data.name !== 'string' || data.name.length < 2) {
    return { isValid: false, error: 'Valid name required' };
  }

  const validBloodTypes = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
  if (!data.bloodType || !validBloodTypes.includes(data.bloodType)) {
    return { isValid: false, error: 'Valid blood type required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email)) {
    return { isValid: false, error: 'Valid email required' };
  }

  const phoneRegex = /^\d{10}$/;
  if (!data.phone || !phoneRegex.test(data.phone.replace(/\D/g, ''))) {
    return { isValid: false, error: 'Valid 10-digit phone number required' };
  }

  if (!data.age || data.age < 18 || data.age > 75) {
    return { isValid: false, error: 'Age must be between 18 and 75' };
  }

  return { isValid: true };
}

/**
 * Validate price check request
 */
function validatePriceCheckRequest(data) {
  const validBloodTypes = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
  if (!data.bloodType || !validBloodTypes.includes(data.bloodType)) {
    return { isValid: false, error: 'Valid blood type required' };
  }

  if (!data.quantity || data.quantity < 1 || data.quantity > 100) {
    return { isValid: false, error: 'Quantity must be between 1 and 100 units' };
  }

  if (!data.location || typeof data.location !== 'string' || data.location.length < 2) {
    return { isValid: false, error: 'Valid location required' };
  }

  return { isValid: true };
}

// ============================================
// ERROR HANDLERS & SERVER STARTUP
// ============================================

/**
 * 404 Not Found handler
 */
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method,
    availableEndpoints: [
      'GET /',
      'GET /health',
      'POST /api/donor/register',
      'GET /api/donor/status',
      'POST /api/check-fair-price',
      'GET /api/transparency/report',
      'POST /api/security/verify-signature',
      'GET /api/security/audit-log',
    ],
  });
});

/**
 * Global error handler
 */
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  
  const auditLog = security.createAuditLog({
    type: 'SYSTEM_ERROR',
    userId: 'SYSTEM',
    action: 'ERROR_CAUGHT',
    resource: req.path,
    status: 'ERROR',
    ipAddress: req.ipAddress,
  });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: NODE_ENV === 'development' ? err.message : 'An error occurred',
    auditId: auditLog.id,
  });
});

// ============================================
// SERVER STARTUP
// ============================================

const server = app.listen(PORT, () => {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║     RAKT KAVACH v2.0 - Core Logic Initialized               ║');
  console.log('║   National Digital Blood Grid with Zero-Trust Architecture  ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  console.log('✓ Express Server initialized on port ' + PORT);
  console.log('✓ Environment: ' + NODE_ENV);
  console.log('✓ Data Sovereignty: ENABLED (AES-256 Encryption)');
  console.log('✓ Real-Time Integrity: ENABLED (Cryptographic Signatures)');
  console.log('✓ Transparency Protocol: ENABLED (Fair-Price Audits)');
  console.log('✓ User Empowerment: ENABLED (Donor Registration)');
  console.log('✓ Gemini Integration: ' + gemini.getStatus().mode);
  console.log('✓ Zero-Trust Architecture: ACTIVE\n');

  console.log('📍 API Endpoints Ready:');
  console.log(`   GET  http://localhost:${PORT}/`);
  console.log(`   GET  http://localhost:${PORT}/health`);
  console.log(`   POST http://localhost:${PORT}/api/donor/register`);
  console.log(`   GET  http://localhost:${PORT}/api/donor/status`);
  console.log(`   POST http://localhost:${PORT}/api/check-fair-price`);
  console.log(`   GET  http://localhost:${PORT}/api/transparency/report`);
  console.log(`   POST http://localhost:${PORT}/api/security/verify-signature`);
  console.log(`   GET  http://localhost:${PORT}/api/security/audit-log\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Initiating graceful shutdown...');
  server.close(() => {
    console.log('✓ Server closed safely');
    console.log('✓ All connections terminated\n');
    process.exit(0);
  });
});

export { app, server };
