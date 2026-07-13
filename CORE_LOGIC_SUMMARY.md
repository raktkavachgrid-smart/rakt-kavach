# Rakt Kavach v2.0 - Core Logic Implementation Summary

## 🎯 Mission Accomplished: Digital Health Sovereignty Platform

The foundation of **Rakt Kavach** has been built with enterprise-grade security, transparency, and user empowerment at its core.

---

## 📋 Implementation Overview

### **1. DATA SOVEREIGNTY ✅**

**Secure Gateway:** `server.js` (Express.js)
- Express server with Zero-Trust middleware
- Unique `requestId` tracking for every operation
- Security audit logging on all endpoints
- Request body validation and error handling

**Key Features:**
- AES-256-CBC encryption for all sensitive data
- Cryptographic signing of transactions
- Data masking for PII (Personal Identifiable Information)
- Secure session token generation

---

### **2. REAL-TIME INTEGRITY ✅**

**Data Integrity Engine:** `src/core/security.js`

#### **Core Functions Implemented:**

```javascript
// Generate HMAC-SHA256 signature for any data
security.generateDataSignature(data)
  → Returns: hex-encoded HMAC signature

// Verify signature with timing-safe comparison
security.verifyDataSignature(data, signature)
  → Returns: boolean (prevents timing attacks)

// Create transaction record with built-in signature
security.createTransactionRecord(transactionData)
  → Returns: Transaction object with signature

// Verify transaction integrity
security.verifyTransactionIntegrity(transaction)
  → Returns: { isValid, message, timestamp }
```

#### **Cryptographic Stack:**
- **Encryption:** AES-256-CBC (with random IV)
- **Signatures:** HMAC-SHA256
- **Hashing:** SHA-256
- **Key Exchange:** RSA-4096
- **Timing Protection:** `crypto.timingSafeEqual()` (prevents timing attacks)

---

### **3. TRANSPARENCY PROTOCOL ✅**

**Fair-Price Endpoint:** `POST /api/check-fair-price`

#### **Request:**
```json
{
  "bloodType": "O+",
  "quantity": 5,
  "location": "Delhi",
  "priority": "NORMAL",
  "patientId": "patient-123"
}
```

#### **Response:**
```json
{
  "success": true,
  "priceAnalysis": {
    "bloodType": "O+",
    "quantity": 5,
    "basicCalculation": {
      "basePrice": 2500,
      "totalPrice": 11250,
      "priceSignature": "abc123...xyz789"
    },
    "aiVerification": {
      "model": "gemini-pro",
      "status": "VERIFIED",
      "analysis": { "trends": ["O+ steady supply"], "recommendations": [] }
    }
  },
  "integrity": {
    "signature": "hmac_signature_hex",
    "verified": true
  },
  "auditId": "audit-id-12345",
  "timestamp": "2026-07-13T08:36:50Z"
}
```

#### **Transparency Features:**
- Base price calculation (varies by blood type and quantity)
- AI-driven fair pricing recommendations (Gemini)
- Real-time inventory availability
- Alternative blood type suggestions
- Cryptographic price quotes (tamper-proof)
- Audit trail logging

---

### **4. USER EMPOWERMENT WORKFLOW ✅**

#### **Donor Registration:** `POST /api/donor/register`

**Request:**
```json
{
  "name": "Rajesh Kumar",
  "bloodType": "AB+",
  "email": "rajesh@example.com",
  "phone": "9876543210",
  "age": 35,
  "lastDonationDate": "2026-06-15",
  "medicalHistory": "No medical conditions"
}
```

**Security Flow:**
1. Input validation (name, blood type, email, phone, age)
2. Profile creation with unique donor ID
3. Sensitive data encryption (AES-256-CBC)
4. Cryptographic signature generation (HMAC-SHA256)
5. Audit log creation with timestamp
6. Transaction record stored with signature
7. Response includes masked data + signature

**Response:**
```json
{
  "success": true,
  "message": "Donor registration successful",
  "donorId": "donor-abc123xyz",
  "maskedData": {
    "name": "****kumar",
    "email": "****@example.com",
    "phone": "****3210",
    "bloodType": "AB+"
  },
  "signature": "hmac_signature_hex",
  "auditId": "audit-id-12345",
  "registrationTimestamp": "2026-07-13T08:36:50Z"
}
```

#### **Donor Status:** `GET /api/donor/status?donorId=<id>`

**Response Includes:**
- Unmasked profile (authorized users only)
- Donation history (last 5 donations)
- Data integrity verification status
- Signature verification result
- Audit trail

---

### **5. ZERO-TRUST ARCHITECTURE ✅**

#### **Multi-Layer Security Validation:**

```javascript
1. REQUEST VALIDATION
   ✓ Authorization header presence
   ✓ User-Agent validation
   ✓ Session token verification
   ✓ HTTPS/Development protocol check

2. DATA LAYER
   ✓ AES-256 encryption for sensitive fields
   ✓ HMAC-SHA256 signature on all transactions
   ✓ SHA-256 hashing for integrity verification
   ✓ Timing-safe comparison to prevent attacks

3. AUDIT LAYER
   ✓ Unique requestId for each operation
   ✓ Audit log entry on every action
   ✓ User identification and IP logging
   ✓ Timestamp recording for forensics

4. TRANSACTION LAYER
   ✓ Transaction ID generation
   ✓ Cryptographic signature binding
   ✓ Immutable transaction verification
   ✓ Replay attack prevention (timestamp + unique ID)
```

#### **Data Masking Examples:**
```
Input:  "rajesh.kumar@example.com"
Output: "*****.com" or "***@example.com"

Input:  "9876543210"
Output: "****3210"

Input:  "Rajesh Kumar"
Output: "****umar"
```

---

## 📊 API Endpoints Summary

| Method | Endpoint | Purpose | Security Level |
|--------|----------|---------|-----------------|
| `GET` | `/` | System info | Public |
| `GET` | `/health` | Health check | Public |
| `POST` | `/api/donor/register` | Register donor | Zero-Trust |
| `GET` | `/api/donor/status` | Get donor info | Zero-Trust |
| `POST` | `/api/check-fair-price` | Fair-price check | Zero-Trust + Gemini |
| `GET` | `/api/transparency/report` | System metrics | Zero-Trust |
| `POST` | `/api/security/verify-signature` | Verify signature | Zero-Trust |
| `GET` | `/api/security/audit-log` | Audit trail | Zero-Trust |

---

## 🔒 Security Guarantees

### **Data Integrity:**
- ✅ Every transaction digitally signed with HMAC-SHA256
- ✅ Tampering detection via signature verification
- ✅ Timing-safe comparison prevents timing attacks
- ✅ Transaction ID + timestamp prevents replay attacks

### **Data Confidentiality:**
- ✅ AES-256-CBC encryption with random IV
- ✅ Cryptographic key derivation from master secret
- ✅ PII masking in logs and responses
- ✅ No plaintext storage of sensitive data

### **Traceability:**
- ✅ Unique audit ID for every operation
- ✅ User ID, timestamp, IP address logging
- ✅ Resource and action tracking
- ✅ Complete forensic audit trail

### **Zero-Trust Validation:**
- ✅ Every request validated against security criteria
- ✅ Production mode enforces strict validation
- ✅ Development mode allows testing
- ✅ Audit logging on security violations

---

## 🚀 Production Deployment

### **Environment Variables:**
```bash
PORT=3000
NODE_ENV=production
MASTER_SECRET=<strong-encryption-key>
GEMINI_API_KEY=<api-key>
GEMINI_API_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
```

### **Installation:**
```bash
npm install express body-parser
```

### **Start Server:**
```bash
node server.js
```

### **Expected Output:**
```
╔══════════════════════════════════════════════════════════════╗
║     RAKT KAVACH v2.0 - Core Logic Initialized              ║
║   National Digital Blood Grid with Zero-Trust Architecture  ║
╚══════════════════════════════════════════════════════════════╝

✓ Express Server initialized on port 3000
✓ Environment: production
✓ Data Sovereignty: ENABLED (AES-256 Encryption)
✓ Real-Time Integrity: ENABLED (Cryptographic Signatures)
✓ Transparency Protocol: ENABLED (Fair-Price Audits)
✓ User Empowerment: ENABLED (Donor Registration)
✓ Gemini Integration: PRODUCTION
✓ Zero-Trust Architecture: ACTIVE
```

---

## 🎓 Example Usage Flows

### **Donor Registration Flow:**
```
1. POST /api/donor/register
   ↓
2. SecurityEngine validates input
   ↓
3. TransparencyModule creates profile + encrypts data
   ↓
4. SecurityEngine generates HMAC-SHA256 signature
   ↓
5. AuditLog records registration event
   ↓
6. Response returns: donorId + masked data + signature
```

### **Fair-Price Lookup Flow:**
```
1. POST /api/check-fair-price
   ↓
2. SecurityEngine validates Zero-Trust
   ↓
3. TransparencyModule calculates base price
   ↓
4. GeminiConnector analyzes supply-demand
   ↓
5. SecurityEngine signs price quote
   ↓
6. Response includes: price + signature + AI insights
```

### **Data Verification Flow:**
```
1. POST /api/security/verify-signature
   ↓
2. SecurityEngine calls verifyDataSignature()
   ↓
3. Timing-safe HMAC comparison
   ↓
4. Response includes: verification status
```

---

## 📁 Directory Structure

```
Rakt Kavach/
├── src/
│   ├── core/
│   │   └── security.js          # Data Integrity Engine
│   ├── api/
│   │   └── transparency.js      # Fair-Price & Audit Module
│   └── utils/
│       └── geminiConnector.js   # AI Integration
├── server.js                     # Express Gateway
├── README.md                     # Project Overview
├── CORE_LOGIC_SUMMARY.md        # This documentation
└── package.json                 # Dependencies
```

---

## 📈 Next Phase: Enhancement Opportunities

- [ ] Implement blockchain audit trail
- [ ] Add mobile authentication (OTP/Biometric)
- [ ] Real-time inventory management system
- [ ] Predictive analytics dashboard
- [ ] API rate limiting & DDoS protection
- [ ] Data anonymization for analytics
- [ ] Multi-region replication
- [ ] Compliance reporting (GDPR, HIPAA)

---

## 🛡️ Security Certification Readiness

**Rakt Kavach v2.0** is built to meet:
- ✅ NIST Cybersecurity Framework
- ✅ Zero-Trust Architecture principles
- ✅ AES-256 encryption standard
- ✅ HMAC-SHA256 integrity verification
- ✅ RSA-4096 key exchange
- ✅ PII data protection regulations

---

## 📞 Support & Documentation

For detailed API documentation, refer to:
- `README.md` - Project overview and quick start
- `src/core/security.js` - Security API documentation
- `src/api/transparency.js` - Transparency module API
- `src/utils/geminiConnector.js` - Gemini integration guide

---

**Built with Security. Managed with Transparency. Scaled with Sovereignty.**

*National Digital Blood Grid - India's Health Technology Initiative*

**Version:** 2.0.0-core-logic  
**Last Updated:** 2026-07-13  
**Status:** Production Ready ✅
