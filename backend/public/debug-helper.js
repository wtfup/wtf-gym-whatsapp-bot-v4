// WTF WhatsApp Bot - Browser Debug Helper
// Add this script to your browser console for enhanced debugging

(function() {
  'use strict';
  
  // Create global debug namespace
  window.WTFDebug = {
    version: '1.0.0',
    initialized: new Date().toISOString()
  };
  
  // Enhanced logging with automatic export capability
  const DebugLogger = {
    logs: [],
    maxLogs: 1000,
    
    log: function(message, data = null, level = 'info') {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: level,
        message: message,
        data: data,
        url: window.location.href,
        userAgent: navigator.userAgent.substring(0, 100),
        stack: level === 'error' ? new Error().stack : null
      };
      
      this.logs.unshift(logEntry);
      if (this.logs.length > this.maxLogs) {
        this.logs = this.logs.slice(0, this.maxLogs);
      }
      
      // Console output with styling
      const styles = {
        info: 'color: #2196f3; font-weight: bold;',
        warn: 'color: #ff9800; font-weight: bold;',
        error: 'color: #f44336; font-weight: bold;',
        success: 'color: #4caf50; font-weight: bold;'
      };
      
      console.log(
        `%c[WTF-DEBUG] ${message}`, 
        styles[level] || styles.info, 
        data || ''
      );
      
      return logEntry;
    },
    
    info: function(message, data) { return this.log(message, data, 'info'); },
    warn: function(message, data) { return this.log(message, data, 'warn'); },
    error: function(message, data) { return this.log(message, data, 'error'); },
    success: function(message, data) { return this.log(message, data, 'success'); },
    
    export: function() {
      const exportData = {
        exported_at: new Date().toISOString(),
        browser: {
          url: window.location.href,
          userAgent: navigator.userAgent,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          local_storage_keys: Object.keys(localStorage),
          session_storage_keys: Object.keys(sessionStorage)
        },
        logs: this.logs
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wtf-debug-logs-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.success(`Exported ${this.logs.length} debug logs`);
      return exportData;
    },
    
    clear: function() {
      const count = this.logs.length;
      this.logs = [];
      this.success(`Cleared ${count} debug logs`);
    },
    
    search: function(term) {
      const results = this.logs.filter(log => 
        log.message.toLowerCase().includes(term.toLowerCase()) ||
        (log.data && JSON.stringify(log.data).toLowerCase().includes(term.toLowerCase()))
      );
      console.table(results);
      return results;
    },
    
    recent: function(count = 10) {
      const recent = this.logs.slice(0, count);
      console.table(recent);
      return recent;
    }
  };
  
  // API Helper for testing endpoints
  const APIHelper = {
    baseUrl: window.location.origin,
    
    get: async function(endpoint, params = {}) {
      const url = new URL(endpoint, this.baseUrl);
      Object.keys(params).forEach(key => {
        url.searchParams.append(key, params[key]);
      });
      
      DebugLogger.info(`API GET: ${url.pathname}`, params);
      
      try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (response.ok) {
          DebugLogger.success(`API GET Success: ${url.pathname}`, data);
        } else {
          DebugLogger.error(`API GET Error: ${url.pathname}`, data);
        }
        
        return { response, data };
      } catch (error) {
        DebugLogger.error(`API GET Failed: ${url.pathname}`, error.message);
        throw error;
      }
    },
    
    post: async function(endpoint, body = {}) {
      const url = new URL(endpoint, this.baseUrl);
      
      DebugLogger.info(`API POST: ${url.pathname}`, body);
      
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });
        const data = await response.json();
        
        if (response.ok) {
          DebugLogger.success(`API POST Success: ${url.pathname}`, data);
        } else {
          DebugLogger.error(`API POST Error: ${url.pathname}`, data);
        }
        
        return { response, data };
      } catch (error) {
        DebugLogger.error(`API POST Failed: ${url.pathname}`, error.message);
        throw error;
      }
    }
  };
  
  // Browser State Inspector
  const StateInspector = {
    getAppState: function() {
      const state = {
        url: window.location.href,
        timestamp: new Date().toISOString(),
        localStorage: {},
        sessionStorage: {},
        cookies: document.cookie,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        connection: navigator.connection ? {
          effectiveType: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink,
          rtt: navigator.connection.rtt
        } : null,
        memory: performance.memory ? {
          used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + ' MB',
          total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + ' MB',
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + ' MB'
        } : null
      };
      
      // Safely get localStorage
      try {
        Object.keys(localStorage).forEach(key => {
          state.localStorage[key] = localStorage.getItem(key);
        });
      } catch (e) {
        state.localStorage_error = e.message;
      }
      
      // Safely get sessionStorage
      try {
        Object.keys(sessionStorage).forEach(key => {
          state.sessionStorage[key] = sessionStorage.getItem(key);
        });
      } catch (e) {
        state.sessionStorage_error = e.message;
      }
      
      console.log('📊 Current App State:', state);
      return state;
    },
    
    checkPerformance: function() {
      const perf = {
        timing: performance.timing,
        navigation: performance.navigation,
        memory: performance.memory,
        resources: performance.getEntriesByType('resource').slice(-10), // Last 10 resources
        marks: performance.getEntriesByType('mark'),
        measures: performance.getEntriesByType('measure')
      };
      
      console.log('⚡ Performance Data:', perf);
      return perf;
    },
    
    exportState: function() {
      const state = this.getAppState();
      const blob = new Blob([JSON.stringify(state, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wtf-app-state-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      DebugLogger.success('App state exported');
      return state;
    }
  };
  
  // Quick Testing Functions
  const QuickTests = {
    testAPI: async function() {
      DebugLogger.info('🧪 Running API tests...');
      
      const tests = [
        { name: 'Health Check', endpoint: '/api/health' },
        { name: 'Messages', endpoint: '/api/logs', params: { limit: 5 } },
        { name: 'User Interactions', endpoint: '/api/user-interactions/logs', params: { limit: 5 } },
        { name: 'Server Logs', endpoint: '/api/server-logs', params: { limit: 5 } }
      ];
      
      const results = [];
      
      for (const test of tests) {
        try {
          const { response, data } = await APIHelper.get(test.endpoint, test.params || {});
          results.push({
            name: test.name,
            endpoint: test.endpoint,
            status: response.status,
            success: response.ok,
            data: data
          });
        } catch (error) {
          results.push({
            name: test.name,
            endpoint: test.endpoint,
            status: 'ERROR',
            success: false,
            error: error.message
          });
        }
      }
      
      console.table(results);
      DebugLogger.success(`API tests completed: ${results.filter(r => r.success).length}/${results.length} passed`);
      return results;
    },
    
    simulateError: function() {
      try {
        throw new Error('Simulated error for testing');
      } catch (error) {
        DebugLogger.error('Simulated error caught', error);
        return error;
      }
    },
    
    logInteraction: function(action = 'debug_test') {
      if (window.__logUserInteraction) {
        window.__logUserInteraction(action, {
          test: true,
          timestamp: new Date().toISOString(),
          debug_helper: true
        }, 'info');
        DebugLogger.success('User interaction logged');
      } else {
        DebugLogger.warn('User interaction logger not available');
      }
    }
  };
  
  // Assign to global namespace
  window.WTFDebug = {
    ...window.WTFDebug,
    log: DebugLogger,
    api: APIHelper,
    state: StateInspector,
    test: QuickTests,
    
    help: function() {
      console.log(`
🔍 WTF WhatsApp Bot Debug Helper v${this.version}

Available Commands:
  WTFDebug.log.info('message', data)     - Log info message
  WTFDebug.log.warn('message', data)     - Log warning
  WTFDebug.log.error('message', data)    - Log error
  WTFDebug.log.export()                  - Export all logs
  WTFDebug.log.clear()                   - Clear logs
  WTFDebug.log.search('term')            - Search logs
  WTFDebug.log.recent(10)                - Show recent logs
  
  WTFDebug.api.get('/api/endpoint')      - Test GET endpoint
  WTFDebug.api.post('/api/endpoint', {}) - Test POST endpoint
  
  WTFDebug.state.getAppState()           - Get current app state
  WTFDebug.state.checkPerformance()      - Check performance
  WTFDebug.state.exportState()           - Export app state
  
  WTFDebug.test.testAPI()                - Run API tests
  WTFDebug.test.simulateError()          - Simulate error
  WTFDebug.test.logInteraction()         - Log test interaction
  
  WTFDebug.help()                        - Show this help
      `);
    }
  };
  
  // Auto-initialize
  DebugLogger.success('WTF Debug Helper loaded! Type WTFDebug.help() for commands');
  
})(); 