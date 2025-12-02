import { Component } from 'react';

/**
 * BaseComponent - Base class for React components
 * Follows Open/Closed Principle - can be extended without modification
 * Provides common functionality for all components
 */
class BaseComponent extends Component {
  /**
   * Handle API errors consistently
   * @param {Error} error - Error object
   * @param {Function} onError - Error callback
   */
  handleError(error, onError) {
    const message = error.message || 'An error occurred';
    console.error('Component error:', error);
    
    if (onError && typeof onError === 'function') {
      onError(message);
    }
  }

  /**
   * Check if user has required role
   * @param {string} requiredRole - Required role
   * @returns {boolean} True if user has role
   */
  hasRole(requiredRole) {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    return user && user.role === requiredRole;
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} True if authenticated
   */
  isAuthenticated() {
    return !!sessionStorage.getItem('token');
  }
}

export default BaseComponent;

