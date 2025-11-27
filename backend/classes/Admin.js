const User = require('./User');
const { getAdminPermissionsByLevel } = require('./utils/RolePermissions');

class Admin extends User {
  constructor(userData) {
    super(userData);
    this.assignedRegion = userData.assignedRegion || '';
    this.adminLevel = userData.adminLevel || 'basic';
    this.actionsPerformed = userData.actionsPerformed || [];
    this.lastLoginAt = userData.lastLoginAt || null;
    this.managedUsers = userData.managedUsers || [];
    this.reportsGenerated = userData.reportsGenerated || [];
    // Initialize permissions after adminLevel is set
    this.permissions = userData.permissions || getAdminPermissionsByLevel(this.adminLevel);
  }

  // Method to get default permissions based on admin level
  getDefaultPermissions() {
    return getAdminPermissionsByLevel(this.adminLevel);
  }

  // Inheritance: Override parent method
  getSpecificCapabilities() {
    if (!this.permissions) {
      this.permissions = this.getDefaultPermissions();
    }
    return this.permissions;
  }

  // Polymorphism: Override hasPermission method
  hasPermission(permission) {
    if (!this.permissions) {
      this.permissions = this.getDefaultPermissions();
    }
    return this.permissions.includes(permission) || super.hasPermission(permission);
  }

  // Method to suspend a user
  suspendUser(userId, reason) {
    if (!this.hasPermission('suspend_users')) {
      throw new Error('Insufficient permissions to suspend users');
    }

    this.logAction('suspend_user', { userId, reason });
    if (!this.managedUsers) {
      this.managedUsers = [];
    }
    this.managedUsers.push(userId);
    this.updatedAt = new Date();
    return true;
  }

  // Method to verify a user
  verifyUser(userId) {
    if (!this.hasPermission('verify_users')) {
      throw new Error('Insufficient permissions to verify users');
    }

    this.logAction('verify_user', { userId });
    this.updatedAt = new Date();
    return true;
  }

  // Method to approve a hotel
  approveHotel(hotelId) {
    if (!this.hasPermission('approve_hotels')) {
      throw new Error('Insufficient permissions to approve hotels');
    }

    this.logAction('approve_hotel', { hotelId });
    this.updatedAt = new Date();
    return true;
  }

  // Method to suspend a hotel
  suspendHotel(hotelId, reason) {
    if (!this.hasPermission('suspend_hotels')) {
      throw new Error('Insufficient permissions to suspend hotels');
    }

    this.logAction('suspend_hotel', { hotelId, reason });
    this.updatedAt = new Date();
    return true;
  }

  // Method to cancel a booking
  cancelBooking(bookingId, reason) {
    if (!this.hasPermission('cancel_bookings')) {
      throw new Error('Insufficient permissions to cancel bookings');
    }

    this.logAction('cancel_booking', { bookingId, reason });
    this.updatedAt = new Date();
    return true;
  }

  // Method to process refund
  processRefund(bookingId, amount, reason) {
    if (!this.hasPermission('refund_bookings')) {
      throw new Error('Insufficient permissions to process refunds');
    }

    this.logAction('process_refund', { bookingId, amount, reason });
    this.updatedAt = new Date();
    return true;
  }

  // Method to generate report
  generateReport(reportType, parameters) {
    if (!this.hasPermission('generate_reports')) {
      throw new Error('Insufficient permissions to generate reports');
    }

    const reportId = `report_${Date.now()}`;
    const report = {
      id: reportId,
      type: reportType,
      parameters,
      generatedBy: this.id,
      generatedAt: new Date()
    };

    if (!this.reportsGenerated) {
      this.reportsGenerated = [];
    }
    this.reportsGenerated.push(reportId);
    this.logAction('generate_report', { reportId, reportType });
    this.updatedAt = new Date();
    
    return report;
  }

  // Method to log admin actions
  logAction(action, details) {
    if (!this.actionsPerformed) {
      this.actionsPerformed = [];
    }
    const actionLog = {
      action,
      details,
      timestamp: new Date(),
      adminId: this.id
    };
    
    this.actionsPerformed.push(actionLog);
  }

  // Method to update admin level
  updateAdminLevel(newLevel) {
    if (!this.hasPermission('manage_admins')) {
      throw new Error('Insufficient permissions to update admin level');
    }

    this.adminLevel = newLevel;
    this.permissions = this.getDefaultPermissions();
    this.logAction('update_admin_level', { newLevel });
    this.updatedAt = new Date();
  }

  // Method to add custom permission
  addPermission(permission) {
    if (!this.hasPermission('manage_permissions')) {
      throw new Error('Insufficient permissions to manage permissions');
    }

    if (!this.permissions) {
      this.permissions = this.getDefaultPermissions();
    }
    if (!this.permissions.includes(permission)) {
      this.permissions.push(permission);
      this.logAction('add_permission', { permission });
      this.updatedAt = new Date();
    }
  }

  // Method to remove permission
  removePermission(permission) {
    if (!this.hasPermission('manage_permissions')) {
      throw new Error('Insufficient permissions to manage permissions');
    }

    if (!this.permissions) {
      this.permissions = this.getDefaultPermissions();
    }
    const index = this.permissions.indexOf(permission);
    if (index > -1) {
      this.permissions.splice(index, 1);
      this.logAction('remove_permission', { permission });
      this.updatedAt = new Date();
    }
  }

  // Method to get admin statistics
  getAdminStats() {
    return {
      adminLevel: this.adminLevel || 'basic',
      totalActions: (this.actionsPerformed && this.actionsPerformed.length) || 0,
      usersManaged: (this.managedUsers && this.managedUsers.length) || 0,
      reportsGenerated: (this.reportsGenerated && this.reportsGenerated.length) || 0,
      lastLoginAt: this.lastLoginAt,
      permissions: (this.permissions && this.permissions.length) || 0
    };
  }

  // Method to get recent actions
  getRecentActions(limit = 10) {
    if (!this.actionsPerformed) {
      this.actionsPerformed = [];
    }
    return this.actionsPerformed
      .slice(-limit)
      .reverse();
  }

  // Method to update last login
  updateLastLogin() {
    this.lastLoginAt = new Date();
    this.updatedAt = new Date();
  }

  // Method to check if admin can perform bulk operations
  canPerformBulkOperations() {
    return this.adminLevel === 'senior' || this.adminLevel === 'super';
  }

  // Method to get system overview (super admin only)
  getSystemOverview() {
    if (this.adminLevel !== 'super') {
      throw new Error('Only super admins can access system overview');
    }

    return {
      totalUsers: 0, // Would be populated from database
      totalHotels: 0,
      totalBookings: 0,
      totalRevenue: 0,
      systemHealth: 'good',
      lastBackup: new Date()
    };
  }

  // Override getPublicInfo to include admin-specific data
  getPublicInfo() {
    const baseInfo = super.getPublicInfo();
    return {
      ...baseInfo,
      adminLevel: this.adminLevel || 'basic',
      totalActions: (this.actionsPerformed && this.actionsPerformed.length) || 0,
      lastLoginAt: this.lastLoginAt
    };
  }
}

module.exports = Admin;
