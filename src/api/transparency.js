/**
 * Rakt Kavach - Enhanced Transparency Module
 * Fair-Price and Availability Audit System
 * Donor Registration & User Empowerment Workflow
 * Ensures transparent access to blood/medicine supply chain data
 */

const security = require('../core/security');

class TransparencyModule {
  constructor() {
    this.requestLog = [];
    this.donorRegistry = [];
    this.auditTrail = [];
    this.transactionLog = [];
    this.priceCache = new Map();
  }

  // ============================================
  // DONOR REGISTRATION & USER EMPOWERMENT
  // ============================================

  /**
   * Register a new blood donor with encrypted data
   * High-level encryption ensures privacy with full traceability
   * 
   * @param {object} donorData - { donorId, profile, encrypted, signature, auditId }
   * @returns {object} Registration confirmation
   */
  registerDonor(donorData) {
    try {
      const donorRecord = {
        donorId: donorData.donorId,
        profile: donorData.profile,
        encryptedData: donorData.encrypted,
        dataSignature: donorData.signature,
        registrationAuditId: donorData.auditId,
        registeredAt: new Date().toISOString(),
        status: 'ACTIVE',
        donationHistory: [],
        totalDonations: 0,
      };

      // Create transaction record for donor registration
      const transaction = security.createTransactionRecord({
        type: 'DONOR_REGISTRATION',
        data: {
          donorId: donorData.donorId,
          bloodType: donorData.profile.bloodType,
          registrationDate: donorData.profile.registrationDate,
        },
        userId: donorData.donorId,
      });

      // Store donor and transaction
      this.donorRegistry.push(donorRecord);
      this.transactionLog.push(transaction);

      console.log(`[DONOR_REGISTRY] New donor registered: ${donorData.donorId}`);

      return {
        success: true,
        donorId: donorData.donorId,
        status: 'REGISTERED',
        encryptedProfileHash: security.generateHash(JSON.stringify(donorData.encrypted)),
      };
    } catch (error) {
      console.error('[DONOR_REGISTRY] Registration failed:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get donor status and donation history
   * @param {string} donorId - Donor identifier
   * @returns {object} Donor status with verified history
   */
  getDonorStatus(donorId) {
    try {
      const donor = this.donorRegistry.find(d => d.donorId === donorId);

      if (!donor) {
        return {
          success: false,
          error: 'Donor not found',
        };
      }

      // Verify data integrity using stored signature
      const profileString = JSON.stringify({
        bloodType: donor.profile.bloodType,
        age: donor.profile.age,
        registrationDate: donor.profile.registrationDate,
      });

      const signatureValid = security.verifyDataSignature(profileString, donor.dataSignature);

      return {
        success: true,
        donorId,
        profile: {
          name: donor.profile.name,
          email: donor.profile.email,
          phone: donor.profile.phone,
          bloodType: donor.profile.bloodType,
          age: donor.profile.age,
        },
        status: donor.status,
        registeredAt: donor.profile.registrationDate,
        totalDonations: donor.totalDonations,
        lastDonationDate: donor.profile.lastDonationDate,
        dataIntegrity: {
          signatureVerified: signatureValid,
          timestamp: new Date().toISOString(),
        },
        donationHistory: donor.donationHistory.slice(-5), // Last 5 donations
      };
    } catch (error) {
      console.error('[DONOR_STATUS]', error.message);
      return {
        success: false,
        error: 'Failed to retrieve donor status',
      };
    }
  }

  // ============================================
  // FAIR PRICE & AVAILABILITY MANAGEMENT
  // ============================================

  /**
   * Submit a blood/medicine request with transparency tracking
   * @param {object} requestData - { patientId, bloodType, quantity, location, priority }
   * @returns {object} Request ticket with audit trail
   */
  submitRequest(requestData) {
    try {
      // Validate request
      const validation = this.validateRequest(requestData);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
          timestamp: new Date().toISOString(),
        };
      }

      // Create request ticket
      const requestTicket = {
        id: security.generateSessionToken(16),
        patientId: security.maskData(requestData.patientId),
        bloodType: requestData.bloodType,
        quantity: requestData.quantity,
        location: requestData.location,
        priority: requestData.priority || 'NORMAL',
        status: 'SUBMITTED',
        createdAt: new Date().toISOString(),
      };

      // Create encrypted and signed transaction
      const transaction = security.createTransactionRecord({
        type: 'BLOOD_REQUEST',
        data: {
          requestId: requestTicket.id,
          bloodType: requestData.bloodType,
          quantity: requestData.quantity,
          location: requestData.location,
        },
        userId: requestData.patientId,
      });

      // Create audit entry
      const auditEntry = security.createAuditLog({
        type: 'REQUEST_SUBMISSION',
        userId: requestData.patientId,
        action: 'SUBMIT_BLOOD_REQUEST',
        resource: `REQUEST:${requestTicket.id}`,
        status: 'SUCCESS',
        ipAddress: requestData.ipAddress || 'UNKNOWN',
      });

      // Store records
      this.requestLog.push(requestTicket);
      this.transactionLog.push(transaction);
      this.auditTrail.push(auditEntry);

      return {
        success: true,
        requestId: requestTicket.id,
        maskedPatientId: requestTicket.patientId,
        status: requestTicket.status,
        fairPriceEstimate: this.calculateFairPrice(requestData),
        availabilityCheck: this.checkAvailability(requestData),
        transactionId: transaction.id,
        auditId: auditEntry.id,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[REQUEST_SUBMISSION]', error.message);
      return {
        success: false,
        error: `Request submission failed: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Calculate Fair Price for blood/medicine
   * Transparency algorithm considering:
   * - Supply availability
   * - Demand patterns
   * - Location-based factors
   * - Emergency pricing
   * 
   * @param {object} requestData - Request parameters
   * @returns {object} Price analysis
   */
  calculateFairPrice(requestData) {
    const basePrice = {
      'O+': 2500,
      'O-': 3000,
      'A+': 2700,
      'A-': 3200,
      'B+': 2800,
      'B-': 3300,
      'AB+': 3500,
      'AB-': 4000,
    };

    const bloodType = requestData.bloodType || 'O+';
    const base = basePrice[bloodType] || 2500;
    const quantity = requestData.quantity || 1;
    const priority = requestData.priority || 'NORMAL';

    // Apply multipliers and discounts
    const priorityMultiplier = priority === 'EMERGENCY' ? 1.5 : 1.0;
    const quantityDiscount = quantity > 5 ? 0.9 : 1.0;
    
    const totalPrice = base * quantity * priorityMultiplier * quantityDiscount;

    // Create price signature for verification
    const priceData = JSON.stringify({
      bloodType,
      basePrice: base,
      quantity,
      priorityMultiplier,
      quantityDiscount,
      totalPrice: Math.round(totalPrice),
    });

    const priceSignature = security.generateDataSignature(priceData);

    return {
      bloodType,
      basePrice: base,
      quantity,
      priorityMultiplier,
      quantityDiscount,
      totalPrice: Math.round(totalPrice),
      currency: 'INR',
      priceValidUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      priceSignature,
      signatureVerified: security.verifyDataSignature(priceData, priceSignature),
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Check real-time availability of blood/medicine
   * @param {object} requestData - Request parameters
   * @returns {object} Availability status with integrity verification
   */
  checkAvailability(requestData) {
    // Mock inventory data
    const mockInventory = {
      'O+': { available: 45, reserved: 12, critical: false },
      'O-': { available: 18, reserved: 5, critical: false },
      'A+': { available: 32, reserved: 8, critical: false },
      'A-': { available: 8, reserved: 2, critical: true },
      'B+': { available: 28, reserved: 6, critical: false },
      'B-': { available: 5, reserved: 1, critical: true },
      'AB+': { available: 12, reserved: 3, critical: false },
      'AB-': { available: 3, reserved: 1, critical: true },
    };

    const bloodType = requestData.bloodType || 'O+';
    const quantity = requestData.quantity || 1;
    const inventory = mockInventory[bloodType] || { available: 0, reserved: 0, critical: true };

    const available = inventory.available >= quantity;
    const estimatedDelivery = available ? 
      new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() :
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Create inventory signature for verification
    const inventoryData = JSON.stringify({
      bloodType,
      totalAvailable: inventory.available,
      timestamp: new Date().toISOString(),
    });

    const inventorySignature = security.generateDataSignature(inventoryData);

    return {
      bloodType,
      totalAvailable: inventory.available,
      requestedQuantity: quantity,
      canFulfill: available,
      isCritical: inventory.critical,
      estimatedDelivery,
      alternativeOptions: available ? [] : this.suggestAlternatives(bloodType),
      lastInventoryUpdate: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      inventorySignature,
      verified: security.verifyDataSignature(inventoryData, inventorySignature),
    };
  }

  /**
   * Suggest alternative blood types if requested type unavailable
   * @param {string} bloodType - Original blood type
   * @returns {array} Alternative blood types
   */
  suggestAlternatives(bloodType) {
    const alternatives = {
      'O+': ['O-', 'A+', 'B+'],
      'O-': ['O+'],
      'A+': ['A-', 'O+', 'AB+'],
      'A-': ['A+', 'O-'],
      'B+': ['B-', 'O+', 'AB+'],
      'B-': ['B+', 'O-'],
      'AB+': ['AB-', 'A+', 'B+'],
      'AB-': ['AB+', 'A-', 'B-'],
    };

    return alternatives[bloodType] || [];
  }

  /**
   * Get request status with full audit trail
   * @param {string} requestId - Request identifier
   * @returns {object} Request status and audit history with integrity verification
   */
  getRequestStatus(requestId) {
    const request = this.requestLog.find(r => r.id === requestId);
    
    if (!request) {
      return {
        success: false,
        error: 'Request not found',
        timestamp: new Date().toISOString(),
      };
    }

    const auditHistory = this.auditTrail.filter(entry => 
      entry.resource.includes(requestId)
    );

    const relatedTransaction = this.transactionLog.find(t => 
      t.data.requestId === requestId
    );

    return {
      success: true,
      requestId,
      status: request.status,
      bloodType: request.bloodType,
      quantity: request.quantity,
      location: request.location,
      priority: request.priority,
      createdAt: request.createdAt,
      transactionId: relatedTransaction?.id,
      transactionVerified: relatedTransaction ? 
        security.verifyTransactionIntegrity(relatedTransaction) : null,
      auditTrail: auditHistory.map(entry => ({
        eventType: entry.eventType,
        action: entry.action,
        timestamp: entry.timestamp,
        status: entry.status,
        auditHash: entry.hash,
      })),
      lastUpdated: new Date().toISOString(),
    };
  }

  // ============================================
  // VALIDATION & REPORTING
  // ============================================

  /**
   * Validate incoming request data
   * @param {object} requestData - Request to validate
   * @returns {object} { isValid, error }
   */
  validateRequest(requestData) {
    const validBloodTypes = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
    
    if (!requestData.bloodType || !validBloodTypes.includes(requestData.bloodType)) {
      return { isValid: false, error: 'Invalid blood type' };
    }

    if (!requestData.quantity || requestData.quantity < 1) {
      return { isValid: false, error: 'Invalid quantity' };
    }

    if (!requestData.patientId) {
      return { isValid: false, error: 'Patient ID required' };
    }

    if (!requestData.location) {
      return { isValid: false, error: 'Location required' };
    }

    return { isValid: true };
  }

  /**
   * Generate comprehensive transparency report
   * @returns {object} System-wide transparency metrics
   */
  generateTransparencyReport() {
    return {
      reportId: security.generateSessionToken(16),
      reportGeneratedAt: new Date().toISOString(),
      statistics: {
        totalRequests: this.requestLog.length,
        totalDonors: this.donorRegistry.length,
        totalTransactions: this.transactionLog.length,
        totalAuditEntries: this.auditTrail.length,
      },
      requestsByStatus: this.getRequestsByStatus(),
      transactions: {
        total: this.transactionLog.length,
        lastTransactions: this.transactionLog.slice(-10).map(t => ({
          id: t.id,
          type: t.type,
          timestamp: t.timestamp,
          verified: security.verifyTransactionIntegrity(t).isValid,
        })),
      },
      recentAuditEvents: this.auditTrail.slice(-10),
      systemIntegrity: {
        transactionsVerified: this.transactionLog.filter(t => 
          security.verifyTransactionIntegrity(t).isValid
        ).length,
        totalTransactions: this.transactionLog.length,
        integrityPercentage: this.transactionLog.length > 0 ?
          Math.round((this.transactionLog.filter(t => 
            security.verifyTransactionIntegrity(t).isValid
          ).length / this.transactionLog.length) * 100) : 100,
      },
    };
  }

  /**
   * Count requests by status
   * @returns {object} Status distribution
   */
  getRequestsByStatus() {
    return this.requestLog.reduce((acc, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Get audit log entries with pagination
   * @param {number} limit - Maximum entries to return
   * @param {number} offset - Offset for pagination
   * @returns {array} Audit log entries
   */
  getAuditLog(limit = 50, offset = 0) {
    return this.auditTrail
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(offset, offset + limit)
      .map(entry => ({
        ...entry,
        hashVerified: security.verifyHash(
          JSON.stringify({
            id: entry.id,
            eventType: entry.eventType,
            timestamp: entry.timestamp,
          }),
          entry.hash
        ),
      }));
  }

  /**
   * Get total audit log count
   * @returns {number} Total audit entries
   */
  getAuditLogCount() {
    return this.auditTrail.length;
  }
}

module.exports = new TransparencyModule();
