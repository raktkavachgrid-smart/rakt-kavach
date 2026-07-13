/**
 * Rakt Kavach - Enhanced Security Layer
 * Zero-Trust Architecture with AES-256 Encryption & Data Integrity Signing
 * Implements cryptographic signatures for tamper-proof transactions
 */

const crypto = require('crypto');

class SecurityEngine {
  /**
   * Initialize the security engine with cryptographic keys
   * @param {string} masterSecret - Master encryption key (environment-based)
   */
  constructor(masterSecret = process.env.MASTER_SECRET || 'rakt-kavach-secure-key-2026') {
    this.masterSecret = masterSecret;
    this.algorithm = 'aes-256-cbc';
    this.encryptionKey = crypto.createHash('sha256').update(masterSecret).digest();
    this.signingKey = crypto.createHash('sha512').update(masterSecret + '-signing').digest('hex');
    console.log('[SECURITY] SecurityEngine initialized with cryptographic keys');
  }

  /**
   * Encrypt sensitive data using AES-256-CBC
   * @param {string} plaintext - Data to encrypt
   * @returns {object} { iv, encryptedData } - IV and encrypted payload
   */
  encrypt(plaintext) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      return {
        iv: iv.toString('hex'),
        encryptedData: encrypted,
        timestamp: new Date().toISOString(),
        algorithm: this.algorithm,
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt encrypted data
   * @param {object} encryptedPayload - { iv, encryptedData }
   * @returns {string} Decrypted plaintext
   */
  decrypt(encryptedPayload) {
    try {
      const iv = Buffer.from(encryptedPayload.iv, 'hex');
      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
      let decrypted = decipher.update(encryptedPayload.encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * DATA INTEGRITY FUNCTION: Generate cryptographic signature for transaction
   * Creates a tamper-proof signature that verifies data has not been modified
   * Uses HMAC-SHA256 for industry-standard integrity verification
   * 
   * @param {string} data - Data to sign (transaction, record, etc.)
   * @returns {string} HMAC signature for verification
   */
  generateDataSignature(data) {
    try {
      if (typeof data === 'object') {
        data = JSON.stringify(data);
      }

      // Create HMAC-SHA256 signature using signing key
      const hmac = crypto.createHmac('sha256', this.signingKey);
      hmac.update(data);
      const signature = hmac.digest('hex');

      console.log(`[DATA_INTEGRITY] Signature generated for ${data.substring(0, 50)}...`);

      return signature;
    } catch (error) {
      throw new Error(`Signature generation failed: ${error.message}`);
    }
  }

  /**
   * DATA INTEGRITY FUNCTION: Verify cryptographic signature
   * Validates that data has not been tampered with since signing
   * Uses timing-safe comparison to prevent timing attacks
   * 
   * @param {string} data - Original data
   * @param {string} signature - Signature to verify against
   * @returns {boolean} Verification result
   */
  verifyDataSignature(data, signature) {
    try {
      if (typeof data === 'object') {
        data = JSON.stringify(data);
      }

      // Regenerate signature and compare
      const hmac = crypto.createHmac('sha256', this.signingKey);
      hmac.update(data);
      const computedSignature = hmac.digest('hex');

      // Use timing-safe comparison to prevent timing attacks
      const isValid = crypto.timingSafeEqual(
        Buffer.from(computedSignature),
        Buffer.from(signature)
      );

      console.log(`[DATA_INTEGRITY] Signature verified: ${isValid}`);

      return isValid;
    } catch (error) {
      console.error(`[DATA_INTEGRITY] Signature verification failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Generate cryptographic hash for data integrity verification
   * @param {string} data - Data to hash
   * @returns {string} SHA-256 hash
   */
  generateHash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Verify data integrity using hash comparison
   * @param {string} data - Original data
   * @param {string} hash - Hash to verify against
   * @returns {boolean} Hash validation result
   */
  verifyHash(data, hash) {
    const computedHash = this.generateHash(data);
    return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(hash));
  }

  /**
   * Data masking for PII and sensitive fields
   * Applies Zero-Trust principle: minimum exposure
   * @param {string} data - Data to mask
   * @param {number} visibleChars - Number of visible characters (default: 4)
   * @returns {string} Masked data
   */
  maskData(data, visibleChars = 4) {
    if (typeof data !== 'string' || data.length === 0) {
      return '****';
    }
    
    const lastChars = data.slice(-visibleChars);
    const maskedChars = '*'.repeat(Math.max(data.length - visibleChars, 4));
    return maskedChars + lastChars;
  }

  /**
   * Generate secure session token
   * @param {number} length - Token length in bytes
   * @returns {string} Secure random token
   */
  generateSessionToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Validate Zero-Trust access request
   * Checks multiple security layers:
   * - Authentication header presence
   * - User-Agent validation
   * - HTTPS protocol
   * 
   * @param {object} request - Request object with auth headers
   * @returns {object} { isValid, reason, validations }
   */
  validateZeroTrust(request) {
    const validations = {
      hasAuthHeader: !!request.headers?.authorization,
      hasUserAgent: !!request.headers?.['user-agent'],
      hasValidToken: !!request.sessionToken,
      isHttpsOrDev: request.protocol === 'https' || process.env.NODE_ENV === 'development',
      hasRequestId: !!request.requestId,
    };

    const isValid = Object.values(validations).every(v => v);
    const reason = isValid ? 'Access granted' : 'Security validation failed';

    return {
      isValid,
      reason,
      validations,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create audit log entry for security events
   * Every transaction is logged with cryptographic verification
   * 
   * @param {object} event - Event details
   * @returns {object} Audit log entry with integrity hash
   */
  createAuditLog(event) {
    const auditEntry = {
      id: this.generateSessionToken(16),
      timestamp: new Date().toISOString(),
      eventType: event.type || 'UNKNOWN',
      userId: event.userId || 'SYSTEM',
      action: event.action || 'ACCESS',
      resource: event.resource || 'UNKNOWN',
      status: event.status || 'PENDING',
      ipAddress: event.ipAddress || 'UNKNOWN',
    };

    // Generate integrity hash for audit entry
    auditEntry.hash = this.generateHash(JSON.stringify(auditEntry));

    console.log(`[AUDIT] Event logged - ${event.type} by ${event.userId}`);

    return auditEntry;
  }

  /**
   * Create transaction record with integrity verification
   * Used for all critical operations (blood requests, pricing, registrations)
   * 
   * @param {object} transactionData - Transaction details
   * @returns {object} Transaction record with signature
   */
  createTransactionRecord(transactionData) {
    const transaction = {
      id: this.generateSessionToken(16),
      type: transactionData.type,
      data: transactionData.data,
      timestamp: new Date().toISOString(),
      createdBy: transactionData.userId || 'SYSTEM',
    };

    // Generate signature for transaction
    const transactionString = JSON.stringify({
      id: transaction.id,
      type: transaction.type,
      data: transaction.data,
      timestamp: transaction.timestamp,
    });

    transaction.signature = this.generateDataSignature(transactionString);

    console.log(`[TRANSACTION] Created - ID: ${transaction.id}, Type: ${transaction.type}`);

    return transaction;
  }

  /**
   * Verify transaction integrity
   * Ensures transaction has not been tampered with
   * 
   * @param {object} transaction - Transaction record with signature
   * @returns {object} { isValid, timestamp, details }
   */
  verifyTransactionIntegrity(transaction) {
    try {
      const transactionString = JSON.stringify({
        id: transaction.id,
        type: transaction.type,
        data: transaction.data,
        timestamp: transaction.timestamp,
      });

      const isValid = this.verifyDataSignature(transactionString, transaction.signature);

      return {
        isValid,
        transactionId: transaction.id,
        type: transaction.type,
        timestamp: transaction.timestamp,
        verifiedAt: new Date().toISOString(),
        message: isValid ? 'Transaction integrity verified' : 'Transaction tampered - integrity check failed',
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Generate encryption certificate for secure channels
   * @returns {object} Certificate with public/private key references
   */
  generateEncryptionCertificate() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    return {
      certificateId: this.generateSessionToken(16),
      publicKey,
      privateKey,
      algorithm: 'RSA-4096',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  /**
   * Get security engine status
   * @returns {object} Security configuration details
   */
  getStatus() {
    return {
      status: 'ACTIVE',
      algorithms: {
        encryption: this.algorithm,
        signature: 'HMAC-SHA256',
        hashing: 'SHA-256',
        keyExchange: 'RSA-4096',
      },
      features: {
        dataIntegrity: 'ENABLED',
        zeroTrustValidation: 'ENABLED',
        auditLogging: 'ENABLED',
        transactionVerification: 'ENABLED',
      },
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
module.exports = new SecurityEngine();
