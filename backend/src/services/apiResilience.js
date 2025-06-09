const logger = require('../utils/logger');

/**
 * API Resilience Service
 * Implements industry-standard patterns for handling API limitations:
 * - Circuit Breaker Pattern
 * - Exponential Backoff
 * - Request Queuing
 * - Intelligent Retry Logic
 * - Fallback Mechanisms
 */
class ApiResilienceService {
  constructor() {
    // Circuit breaker states
    this.states = {
      CLOSED: 'CLOSED',     // Normal operation
      OPEN: 'OPEN',         // Failing, reject requests
      HALF_OPEN: 'HALF_OPEN' // Testing if service recovered
    };

    // Circuit breaker configuration
    this.circuitBreaker = {
      state: this.states.CLOSED,
      failureCount: 0,
      successCount: 0,
      lastFailureTime: null,
      nextAttemptTime: null,
      
      // Thresholds
      failureThreshold: 5,        // Open circuit after 5 failures
      successThreshold: 3,        // Close circuit after 3 successes
      timeout: 60000,             // 60 seconds before trying again
      halfOpenRequests: 3         // Number of test requests in half-open state
    };

    // Retry configuration
    this.retryConfig = {
      maxRetries: 3,
      initialDelay: 1000,         // 1 second
      maxDelay: 30000,            // 30 seconds
      backoffMultiplier: 2,
      jitterMax: 1000             // Random jitter up to 1 second
    };

    // Request queue for rate limiting
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.queueConfig = {
      maxSize: 100,
      processInterval: 1100,      // Process every 1.1 seconds (for 1 req/sec limit)
      timeout: 30000              // Request timeout
    };

    // Metrics for monitoring
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      retriedRequests: 0,
      queuedRequests: 0,
      circuitBreakerTrips: 0
    };
  }

  /**
   * Execute API request with resilience patterns
   */
  async executeRequest(requestFn, options = {}) {
    const {
      maxRetries = this.retryConfig.maxRetries,
      timeout = this.queueConfig.timeout,
      fallbackFn = null,
      priority = 0
    } = options;

    this.metrics.totalRequests++;

    // Check circuit breaker
    if (!this.canMakeRequest()) {
      this.metrics.failedRequests++;
      
      if (fallbackFn) {
        logger.info('[RESILIENCE] Circuit breaker OPEN, using fallback');
        return await fallbackFn();
      }
      
      throw new Error('Service temporarily unavailable. Please try again later.');
    }

    // Add to queue if rate limiting needed
    if (this.shouldQueueRequest()) {
      return this.queueRequest(requestFn, options);
    }

    // Execute with retry logic
    return this.executeWithRetry(requestFn, maxRetries, timeout);
  }

  /**
   * Check if circuit breaker allows requests
   */
  canMakeRequest() {
    const now = Date.now();

    switch (this.circuitBreaker.state) {
      case this.states.CLOSED:
        return true;

      case this.states.OPEN:
        if (now >= this.circuitBreaker.nextAttemptTime) {
          logger.info('[RESILIENCE] Circuit breaker transitioning to HALF_OPEN');
          this.circuitBreaker.state = this.states.HALF_OPEN;
          this.circuitBreaker.successCount = 0;
          return true;
        }
        return false;

      case this.states.HALF_OPEN:
        return this.circuitBreaker.successCount < this.circuitBreaker.halfOpenRequests;

      default:
        return false;
    }
  }

  /**
   * Execute request with retry logic
   */
  async executeWithRetry(requestFn, retriesLeft, timeout) {
    const attemptNumber = this.retryConfig.maxRetries - retriesLeft + 1;

    try {
      // Set timeout for request
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeout);
      });

      const result = await Promise.race([
        requestFn(),
        timeoutPromise
      ]);

      // Success - update circuit breaker
      this.onRequestSuccess();
      this.metrics.successfulRequests++;
      
      return result;

    } catch (error) {
      logger.error(`[RESILIENCE] Request failed (attempt ${attemptNumber}):`, error.message);
      
      // Check if error is retryable
      if (!this.isRetryableError(error) || retriesLeft === 0) {
        this.onRequestFailure();
        this.metrics.failedRequests++;
        throw error;
      }

      // Calculate backoff delay
      const delay = this.calculateBackoffDelay(attemptNumber);
      logger.info(`[RESILIENCE] Retrying in ${delay}ms (${retriesLeft} retries left)`);
      
      this.metrics.retriedRequests++;
      
      // Wait before retry
      await this.sleep(delay);
      
      // Recursive retry
      return this.executeWithRetry(requestFn, retriesLeft - 1, timeout);
    }
  }

  /**
   * Update circuit breaker on success
   */
  onRequestSuccess() {
    this.circuitBreaker.failureCount = 0;

    if (this.circuitBreaker.state === this.states.HALF_OPEN) {
      this.circuitBreaker.successCount++;
      
      if (this.circuitBreaker.successCount >= this.circuitBreaker.successThreshold) {
        logger.info('[RESILIENCE] Circuit breaker closing - service recovered');
        this.circuitBreaker.state = this.states.CLOSED;
        this.circuitBreaker.successCount = 0;
      }
    }
  }

  /**
   * Update circuit breaker on failure
   */
  onRequestFailure() {
    this.circuitBreaker.failureCount++;
    this.circuitBreaker.lastFailureTime = Date.now();

    if (this.circuitBreaker.state === this.states.HALF_OPEN) {
      logger.warn('[RESILIENCE] Circuit breaker reopening - service still failing');
      this.openCircuit();
    } else if (this.circuitBreaker.failureCount >= this.circuitBreaker.failureThreshold) {
      logger.warn('[RESILIENCE] Circuit breaker opening - failure threshold reached');
      this.openCircuit();
    }
  }

  /**
   * Open the circuit breaker
   */
  openCircuit() {
    this.circuitBreaker.state = this.states.OPEN;
    this.circuitBreaker.nextAttemptTime = Date.now() + this.circuitBreaker.timeout;
    this.circuitBreaker.failureCount = 0;
    this.metrics.circuitBreakerTrips++;
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(error) {
    // Rate limit errors
    if (error.response?.status === 429) return true;
    
    // Temporary server errors
    if (error.response?.status >= 500) return true;
    
    // Network errors
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') return true;
    
    // Timeout errors
    if (error.message?.includes('timeout')) return true;
    
    // Don't retry client errors (4xx except 429)
    if (error.response?.status >= 400 && error.response?.status < 500) return false;
    
    return true;
  }

  /**
   * Calculate exponential backoff delay with jitter
   */
  calculateBackoffDelay(attemptNumber) {
    const exponentialDelay = Math.min(
      this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffMultiplier, attemptNumber - 1),
      this.retryConfig.maxDelay
    );
    
    // Add random jitter to prevent thundering herd
    const jitter = Math.random() * this.retryConfig.jitterMax;
    
    return Math.floor(exponentialDelay + jitter);
  }

  /**
   * Check if request should be queued
   */
  shouldQueueRequest() {
    // Queue if we're already processing queue or if rate limiting is needed
    return this.isProcessingQueue || this.requestQueue.length > 0;
  }

  /**
   * Queue request for rate-limited processing
   */
  async queueRequest(requestFn, options) {
    return new Promise((resolve, reject) => {
      if (this.requestQueue.length >= this.queueConfig.maxSize) {
        reject(new Error('Request queue is full. Please try again later.'));
        return;
      }

      this.metrics.queuedRequests++;
      
      this.requestQueue.push({
        requestFn,
        options,
        resolve,
        reject,
        timestamp: Date.now(),
        priority: options.priority || 0
      });

      // Sort by priority (higher priority first)
      this.requestQueue.sort((a, b) => b.priority - a.priority);

      // Start processing if not already running
      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    });
  }

  /**
   * Process queued requests with rate limiting
   */
  async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) return;

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      
      // Check if request has timed out
      if (Date.now() - request.timestamp > this.queueConfig.timeout) {
        request.reject(new Error('Request timed out in queue'));
        continue;
      }

      try {
        const result = await this.executeWithRetry(
          request.requestFn,
          request.options.maxRetries || this.retryConfig.maxRetries,
          request.options.timeout || this.queueConfig.timeout
        );
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      }

      // Wait before processing next request (rate limiting)
      if (this.requestQueue.length > 0) {
        await this.sleep(this.queueConfig.processInterval);
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Get current service status
   */
  getStatus() {
    return {
      circuitBreaker: {
        state: this.circuitBreaker.state,
        failureCount: this.circuitBreaker.failureCount,
        successCount: this.circuitBreaker.successCount,
        nextAttemptTime: this.circuitBreaker.nextAttemptTime
      },
      queue: {
        size: this.requestQueue.length,
        isProcessing: this.isProcessingQueue
      },
      metrics: this.metrics
    };
  }

  /**
   * Reset circuit breaker (for testing or manual intervention)
   */
  reset() {
    this.circuitBreaker.state = this.states.CLOSED;
    this.circuitBreaker.failureCount = 0;
    this.circuitBreaker.successCount = 0;
    this.circuitBreaker.lastFailureTime = null;
    this.circuitBreaker.nextAttemptTime = null;
    logger.info('[RESILIENCE] Circuit breaker reset');
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new ApiResilienceService(); 