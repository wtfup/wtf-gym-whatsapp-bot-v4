import React, { useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Enhanced User Interaction Logger for Production Monitoring
const UserInteractionLogger = ({ children }) => {
  const sessionId = useRef(null);
  const interactionQueue = useRef([]);
  const isLogging = useRef(false);
  const lastFlush = useRef(Date.now());
  
  // Constants
  const BATCH_SIZE = 10;
  const FLUSH_INTERVAL = 5000; // 5 seconds
  const MAX_QUEUE_SIZE = 100;
  const ERROR_BATCH_SIZE = 5; // Smaller batch for errors to send immediately
  const CRITICAL_ERROR_IMMEDIATE_SEND = true; // Send critical errors immediately
  
  // Error severity levels
  const ERROR_LEVELS = {
    LOW: 'low',
    MEDIUM: 'medium', 
    HIGH: 'high',
    CRITICAL: 'critical'
  };
  
  // Initialize session ID - ENABLED FOR ALL ENVIRONMENTS
  useEffect(() => {
    sessionId.current = uuidv4();
    isLogging.current = true;
    
    const envLabel = process.env.NODE_ENV === 'production' ? 'PROD' : 'DEV';
    console.log(`🔍 [${envLabel}] User Interaction Logger initialized`, sessionId.current);
    
    // Log page load with enhanced performance data
    logInteraction('page_load', {
      page_url: window.location.href,
      referrer: document.referrer,
      user_agent: navigator.userAgent,
      viewport_size: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      performance_data: {
        load_time: performance.now(),
        connection: navigator.connection?.effectiveType || 'unknown',
        memory: performance.memory ? {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        } : null,
        navigation_timing: {
          dns_lookup: performance.timing?.domainLookupEnd - performance.timing?.domainLookupStart,
          tcp_connect: performance.timing?.connectEnd - performance.timing?.connectStart,
          request_response: performance.timing?.responseEnd - performance.timing?.requestStart,
          dom_processing: performance.timing?.domComplete - performance.timing?.responseEnd
        }
      },
      environment: process.env.NODE_ENV || 'unknown',
      url_hostname: window.location.hostname
    });
    
    return () => {
      flushQueue();
      isLogging.current = false;
    };
  }, []);
  
  // Enhanced function to log interactions with error severity
  const logInteraction = useCallback((actionType, data = {}, severity = ERROR_LEVELS.LOW) => {
    if (!isLogging.current) return;
    
    const interaction = {
      session_id: sessionId.current,
      user_agent: navigator.userAgent,
      page_url: window.location.href,
      action_type: actionType,
      severity: severity,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      url_pathname: window.location.pathname,
      url_search: window.location.search,
      ...data
    };
    
    interactionQueue.current.push(interaction);
    
    // Immediate send for critical errors
    if (severity === ERROR_LEVELS.CRITICAL || actionType === 'error') {
      if (CRITICAL_ERROR_IMMEDIATE_SEND) {
        setTimeout(() => flushQueue(), 100); // Send immediately but don't block
      }
    }
    
    // Auto-flush based on severity and queue size
    const shouldFlush = 
      (severity === ERROR_LEVELS.HIGH && interactionQueue.current.length >= ERROR_BATCH_SIZE) ||
      (interactionQueue.current.length >= BATCH_SIZE) || 
      (Date.now() - lastFlush.current > FLUSH_INTERVAL);
      
    if (shouldFlush) {
      flushQueue();
    }
    
    // Prevent memory leaks
    if (interactionQueue.current.length > MAX_QUEUE_SIZE) {
      interactionQueue.current = interactionQueue.current.slice(-MAX_QUEUE_SIZE);
    }
  }, []);
  
  // Enhanced function to flush interaction queue to backend with retry logic
  const flushQueue = useCallback(async () => {
    if (interactionQueue.current.length === 0) return;
    
    const interactions = [...interactionQueue.current];
    interactionQueue.current = [];
    lastFlush.current = Date.now();
    
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        const response = await fetch('/api/user-interactions/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ interactions }),
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        const envLabel = process.env.NODE_ENV === 'production' ? 'PROD' : 'DEV';
        console.log(`✅ [${envLabel}] Logged ${result.successful}/${interactions.length} interactions`);
        return; // Success, exit retry loop
        
      } catch (error) {
        retryCount++;
        const isLastRetry = retryCount >= maxRetries;
        
        if (isLastRetry) {
          console.warn(`🚨 Failed to log ${interactions.length} interactions after ${maxRetries} attempts:`, error.message);
          
          // Store in localStorage as backup for critical errors
          const criticalInteractions = interactions.filter(i => 
            i.severity === ERROR_LEVELS.CRITICAL || i.action_type === 'error'
          );
          
          if (criticalInteractions.length > 0) {
            try {
              const stored = JSON.parse(localStorage.getItem('failed_interactions') || '[]');
              stored.push(...criticalInteractions.slice(-10)); // Keep only recent critical ones
              localStorage.setItem('failed_interactions', JSON.stringify(stored.slice(-50))); // Max 50 stored
              console.log(`💾 Stored ${criticalInteractions.length} critical interactions in localStorage`);
            } catch (storageError) {
              console.warn('Failed to store interactions in localStorage:', storageError);
            }
          }
        } else {
          console.warn(`⚠️ Interaction logging attempt ${retryCount}/${maxRetries} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
        }
      }
    }
  }, []);
  
  // Enhanced event listeners with better error tracking
  useEffect(() => {
    // Click tracking with enhanced context
    const handleClick = (event) => {
      try {
        const element = event.target;
        const rect = element.getBoundingClientRect();
        
        logInteraction('click', {
          element_selector: getElementSelector(element),
          element_text: getElementText(element),
          element_attributes: getElementAttributes(element),
          mouse_position: {
            x: event.clientX,
            y: event.clientY,
            relative_x: event.clientX - rect.left,
            relative_y: event.clientY - rect.top
          },
          viewport_size: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          element_visible: isElementVisible(element),
          element_in_viewport: isElementInViewport(element),
          click_timestamp: event.timeStamp
        });
      } catch (error) {
        logInteraction('error', {
          error_details: {
            message: 'Click tracking failed: ' + error.message,
            stack: error.stack,
            event_type: 'click_tracking_error'
          }
        }, ERROR_LEVELS.MEDIUM);
      }
    };
    
    // Navigation tracking with performance data
    const handleNavigation = () => {
      logInteraction('navigation', {
        page_url: window.location.href,
        previous_url: document.referrer,
        navigation_type: performance.navigation?.type || 'unknown',
        timing_data: {
          navigation_start: performance.timing?.navigationStart,
          load_complete: performance.timing?.loadEventEnd
        }
      });
    };
    
    // Enhanced error tracking with categorization
    const handleError = (event) => {
      const errorDetails = {
        message: event.error?.message || event.message || 'Unknown error',
        filename: event.filename || 'unknown',
        line: event.lineno || 0,
        column: event.colno || 0,
        stack: event.error?.stack || 'No stack trace',
        error_type: event.error?.name || 'Error',
        timestamp: event.timeStamp || Date.now()
      };
      
      // Categorize error severity
      let severity = ERROR_LEVELS.MEDIUM;
      if (errorDetails.message.includes('ChunkLoadError') || 
          errorDetails.message.includes('Loading chunk') ||
          errorDetails.message.includes('Network Error')) {
        severity = ERROR_LEVELS.HIGH;
      }
      if (errorDetails.message.includes('Cannot read properties') || 
          errorDetails.message.includes('is not a function')) {
        severity = ERROR_LEVELS.CRITICAL;
      }
      
      logInteraction('error', {
        error_details: errorDetails,
        page_state: {
          url: window.location.href,
          visible: document.visibilityState === 'visible',
          focused: document.hasFocus(),
          online: navigator.onLine
        }
      }, severity);
    };
    
    // Promise rejection tracking
    const handleUnhandledRejection = (event) => {
      logInteraction('error', {
        error_details: {
          message: 'Unhandled Promise Rejection: ' + (event.reason?.message || event.reason),
          stack: event.reason?.stack || 'No stack trace',
          error_type: 'UnhandledPromiseRejection',
          reason: event.reason
        }
      }, ERROR_LEVELS.HIGH);
    };
    
    // API call monitoring
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
      const startTime = performance.now();
      const url = args[0];
      
      try {
        const response = await originalFetch.apply(this, args);
        const duration = performance.now() - startTime;
        
        // Log slow API calls
        if (duration > 5000) { // 5 seconds
          logInteraction('api_slow', {
            url: url,
            duration: duration,
            status: response.status
          }, ERROR_LEVELS.MEDIUM);
        }
        
        // Log API errors
        if (!response.ok) {
          logInteraction('api_error', {
            url: url,
            status: response.status,
            statusText: response.statusText,
            duration: duration
          }, response.status >= 500 ? ERROR_LEVELS.HIGH : ERROR_LEVELS.MEDIUM);
        }
        
        return response;
      } catch (error) {
        const duration = performance.now() - startTime;
        logInteraction('api_error', {
          url: url,
          error_message: error.message,
          duration: duration
        }, ERROR_LEVELS.HIGH);
        throw error;
      }
    };
    
    // Form submission tracking
    const handleFormSubmit = (event) => {
      const form = event.target;
      logInteraction('form_submit', {
        element_selector: getElementSelector(form),
        form_data: {
          action: form.action,
          method: form.method,
          field_count: form.elements.length
        }
      });
    };
    
    // Scroll tracking (throttled)
    let scrollTimeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        logInteraction('scroll', {
          scroll_position: {
            x: window.scrollX,
            y: window.scrollY,
            max_x: document.documentElement.scrollWidth - window.innerWidth,
            max_y: document.documentElement.scrollHeight - window.innerHeight,
            percentage: Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100)
          },
          viewport_size: {
            width: window.innerWidth,
            height: window.innerHeight
          }
        });
      }, 500);
    };
    
    // Resize tracking
    const handleResize = () => {
      logInteraction('resize', {
        viewport_size: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        screen_size: {
          width: window.screen.width,
          height: window.screen.height
        }
      });
    };
    
    // Focus tracking for form elements
    const handleFocus = (event) => {
      const element = event.target;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName)) {
        logInteraction('focus', {
          element_selector: getElementSelector(element),
          element_attributes: getElementAttributes(element)
        });
      }
    };
    
    // Page visibility change tracking
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushQueue(); // Flush before page becomes hidden
        logInteraction('page_hidden', {
          time_visible: Date.now() - lastFlush.current
        });
      } else {
        logInteraction('page_visible');
      }
    };
    
    // Add event listeners
    document.addEventListener('click', handleClick);
    window.addEventListener('popstate', handleNavigation);
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    document.addEventListener('submit', handleFormSubmit);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    document.addEventListener('focus', handleFocus, true);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Periodic flush
    const flushInterval = setInterval(flushQueue, FLUSH_INTERVAL);
    
    // Cleanup
    return () => {
      document.removeEventListener('click', handleClick);
      window.removeEventListener('popstate', handleNavigation);
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      document.removeEventListener('submit', handleFormSubmit);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('focus', handleFocus, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(flushInterval);
      clearTimeout(scrollTimeout);
      
      // Restore original fetch
      window.fetch = originalFetch;
    };
  }, [logInteraction, flushQueue]);
  
  // Enhanced utility functions
  const getElementSelector = (element) => {
    try {
      // Try to get a meaningful selector
      if (element.id) {
        return `#${element.id}`;
      }
      
      if (element.className && typeof element.className === 'string') {
        const classes = element.className.split(' ').filter(c => c.length > 0);
        if (classes.length > 0) {
          return `.${classes.join('.')}`;
        }
      }
      
      // Check for data attributes
      if (element.getAttribute('data-testid')) {
        return `[data-testid="${element.getAttribute('data-testid')}"]`;
      }
      
      // Fallback to tag name with position
      let selector = element.tagName.toLowerCase();
      const parent = element.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(child => 
          child.tagName === element.tagName
        );
        if (siblings.length > 1) {
          const index = siblings.indexOf(element);
          selector += `:nth-of-type(${index + 1})`;
        }
      }
      
      return selector;
    } catch (error) {
      return 'unknown';
    }
  };
  
  const getElementText = (element) => {
    try {
      return element.textContent?.slice(0, 100) || element.value?.slice(0, 100) || '';
    } catch (error) {
      return '';
    }
  };
  
  const getElementAttributes = (element) => {
    try {
      const attrs = {};
      const importantAttrs = ['type', 'name', 'role', 'aria-label', 'data-testid', 'href', 'disabled', 'required'];
      
      importantAttrs.forEach(attr => {
        if (element.hasAttribute(attr)) {
          attrs[attr] = element.getAttribute(attr);
        }
      });
      
      return attrs;
    } catch (error) {
      return {};
    }
  };
  
  const isElementVisible = (element) => {
    try {
      const style = window.getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    } catch (error) {
      return false;
    }
  };
  
  const isElementInViewport = (element) => {
    try {
      const rect = element.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
    } catch (error) {
      return false;
    }
  };
  
  // Expose enhanced logging function for manual logging
  useEffect(() => {
    window.__logUserInteraction = logInteraction;
    window.__flushInteractionLogs = flushQueue;
    
    const envLabel = process.env.NODE_ENV === 'production' ? 'PROD' : 'DEV';
    console.log(`🔍 [${envLabel}] Manual logging available: window.__logUserInteraction(type, data, severity)`);
    
    return () => {
      if (window.__logUserInteraction) {
        delete window.__logUserInteraction;
      }
      if (window.__flushInteractionLogs) {
        delete window.__flushInteractionLogs;
      }
    };
  }, [logInteraction, flushQueue]);
  
  // This component doesn't render anything visible
  return children || null;
};

export default UserInteractionLogger; 