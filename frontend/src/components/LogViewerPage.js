import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Chip, 
  IconButton, 
  Tooltip,
  Switch,
  FormControlLabel,
  Alert,
  Tabs,
  Tab,
  Card,
  CardContent,
  Stack,
  Divider,
  Grid
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Clear as ClearIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  FilterList as FilterIcon,
  ContentCopy as CopyIcon,
  Search as SearchIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon
} from '@mui/icons-material';
import io from 'socket.io-client';

const LogViewerPage = () => {
  // State for logs
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [userInteractionLogs, setUserInteractionLogs] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [whatsappLogs, setWhatsappLogs] = useState([]);
  
  // Filter state
  const [logLevel, setLogLevel] = useState('all');
  const [logSource, setLogSource] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState('1h');
  
  // UI State
  const [activeTab, setActiveTab] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [newLogCount, setNewLogCount] = useState(0);
  const [maxLogs, setMaxLogs] = useState(1000);
  
  // Refs
  const logContainerRef = useRef(null);
  const socketRef = useRef(null);
  const autoScrollRef = useRef(true);
  
  // Console capture
  const [consoleLogs, setConsoleLogs] = useState([]);
  const originalConsole = useRef({});
  
  // Log levels and colors
  const logLevels = {
    error: { color: '#f44336', icon: <ErrorIcon />, priority: 4 },
    warn: { color: '#ff9800', icon: <WarningIcon />, priority: 3 },
    info: { color: '#2196f3', icon: <InfoIcon />, priority: 2 },
    log: { color: '#4caf50', icon: <SuccessIcon />, priority: 1 },
    debug: { color: '#9e9e9e', icon: <InfoIcon />, priority: 0 }
  };

  // Initialize socket connection for real-time logs
  useEffect(() => {
    const socket = io(window.location.origin, {
      transports: ['websocket']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('🔗 Connected to log stream');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('🔌 Disconnected from log stream');
    });

    // Listen for various log types
    socket.on('server_log', (logData) => {
      addSystemLog(logData);
    });

    socket.on('whatsapp_log', (logData) => {
      addWhatsappLog(logData);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Capture browser console logs
  useEffect(() => {
    const captureConsole = () => {
      ['log', 'warn', 'error', 'info', 'debug'].forEach(method => {
        originalConsole.current[method] = console[method];
        console[method] = (...args) => {
          // Call original method
          originalConsole.current[method](...args);
          
          // Capture for our log viewer
          const logEntry = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            level: method,
            source: 'browser',
            message: args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '),
            stack: method === 'error' ? new Error().stack : null,
            url: window.location.href
          };
          
          setConsoleLogs(prev => [logEntry, ...prev.slice(0, maxLogs - 1)]);
        };
      });
    };

    captureConsole();

    return () => {
      // Restore original console methods
      Object.keys(originalConsole.current).forEach(method => {
        console[method] = originalConsole.current[method];
      });
    };
  }, [maxLogs]);

  // Fetch logs from various sources
  const fetchLogs = async () => {
    try {
      // Fetch user interaction logs
      const userLogsRes = await fetch('/api/user-interactions/logs?limit=500');
      if (userLogsRes.ok) {
        const userData = await userLogsRes.json();
        setUserInteractionLogs(userData.logs || []);
      }

      // Fetch WhatsApp logs
      const whatsappRes = await fetch('/api/messages?limit=500');
      if (whatsappRes.ok) {
        const whatsappData = await whatsappRes.json();
        setWhatsappLogs(whatsappData || []);
      }

      // You could add more log sources here
      console.log('📊 Logs refreshed from all sources');
    } catch (error) {
      console.error('❌ Error fetching logs:', error);
    }
  };

  // Add system log
  const addSystemLog = (logData) => {
    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp: logData.timestamp || new Date().toISOString(),
      level: logData.level || 'info',
      source: 'system',
      message: logData.message,
      data: logData.data,
      component: logData.component
    };
    
    setSystemLogs(prev => [logEntry, ...prev.slice(0, maxLogs - 1)]);
    setNewLogCount(prev => prev + 1);
  };

  // Add WhatsApp log
  const addWhatsappLog = (logData) => {
    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp: logData.timestamp || new Date().toISOString(),
      level: logData.level || 'info',
      source: 'whatsapp',
      message: logData.message,
      data: logData.data,
      sender: logData.sender,
      group: logData.group
    };
    
    setWhatsappLogs(prev => [logEntry, ...prev.slice(0, maxLogs - 1)]);
    setNewLogCount(prev => prev + 1);
  };

  // Filter logs
  useEffect(() => {
    let allLogs = [];
    
    // Combine all log sources based on active tab
    switch (activeTab) {
      case 0: // All logs
        allLogs = [
          ...consoleLogs.map(log => ({ ...log, source: 'browser' })),
          ...systemLogs,
          ...userInteractionLogs.map(log => ({
            ...log,
            id: log.id,
            timestamp: log.timestamp,
            level: log.severity === 'critical' ? 'error' : log.severity === 'high' ? 'warn' : 'info',
            source: 'user_interaction',
            message: `${log.action_type}: ${log.page_url}`,
            data: log
          })),
          ...whatsappLogs.map(log => ({
            ...log,
            id: log.id,
            timestamp: log.received_at || log.timestamp,
            level: 'info',
            source: 'whatsapp',
            message: `${log.sender_name}: ${log.message}`,
            data: log
          }))
        ];
        break;
      case 1: // Browser logs
        allLogs = consoleLogs;
        break;
      case 2: // System logs
        allLogs = systemLogs;
        break;
      case 3: // User interaction logs
        allLogs = userInteractionLogs.map(log => ({
          ...log,
          timestamp: log.timestamp,
          level: log.severity === 'critical' ? 'error' : log.severity === 'high' ? 'warn' : 'info',
          source: 'user_interaction',
          message: `${log.action_type}: ${log.page_url}`,
          data: log
        }));
        break;
      case 4: // WhatsApp logs
        allLogs = whatsappLogs.map(log => ({
          ...log,
          timestamp: log.received_at || log.timestamp,
          level: 'info',
          source: 'whatsapp',
          message: `${log.sender_name}: ${log.message}`,
          data: log
        }));
        break;
      default:
        allLogs = [];
    }

    // Sort by timestamp (newest first)
    allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply filters
    let filtered = allLogs;

    // Level filter
    if (logLevel !== 'all') {
      filtered = filtered.filter(log => log.level === logLevel);
    }

    // Source filter
    if (logSource !== 'all') {
      filtered = filtered.filter(log => log.source === logSource);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(term) ||
        (log.data && JSON.stringify(log.data).toLowerCase().includes(term))
      );
    }

    // Time filter
    const now = new Date();
    const timeFilterMs = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      'all': Infinity
    };

    if (timeFilter !== 'all') {
      const cutoff = new Date(now.getTime() - timeFilterMs[timeFilter]);
      filtered = filtered.filter(log => new Date(log.timestamp) > cutoff);
    }

    setFilteredLogs(filtered);
  }, [consoleLogs, systemLogs, userInteractionLogs, whatsappLogs, logLevel, logSource, searchTerm, timeFilter, activeTab]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchLogs();
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Auto-scroll
  useEffect(() => {
    if (autoScrollRef.current && logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [filteredLogs]);

  // Reset new log count when user scrolls or interacts
  useEffect(() => {
    const timer = setTimeout(() => {
      if (newLogCount > 0) {
        setNewLogCount(0);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [newLogCount, filteredLogs]);

  // Export logs
  const exportLogs = () => {
    const exportData = {
      exported_at: new Date().toISOString(),
      total_logs: filteredLogs.length,
      filters: {
        level: logLevel,
        source: logSource,
        search: searchTerm,
        time: timeFilter
      },
      logs: filteredLogs
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whatsapp-bot-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('📥 Logs exported successfully');
  };

  // Copy logs to clipboard
  const copyLogsToClipboard = async () => {
    const logText = filteredLogs.map(log => 
      `[${log.timestamp}] ${log.level.toUpperCase()} [${log.source}] ${log.message}`
    ).join('\n');

    try {
      await navigator.clipboard.writeText(logText);
      console.log('📋 Logs copied to clipboard');
    } catch (error) {
      console.error('❌ Failed to copy logs:', error);
    }
  };

  // Clear logs
  const clearLogs = () => {
    setConsoleLogs([]);
    setSystemLogs([]);
    setNewLogCount(0);
    console.log('🧹 Browser and system logs cleared');
  };

  // Format log entry
  const formatLogEntry = (log) => {
    const logStyle = logLevels[log.level] || logLevels.info;
    const timestamp = new Date(log.timestamp).toLocaleTimeString();

    return (
      <Paper 
        key={log.id} 
        sx={{ 
          p: 1, 
          mb: 0.5, 
          backgroundColor: log.level === 'error' ? '#ffebee' : 
                          log.level === 'warn' ? '#fff3e0' :
                          'background.paper',
          borderLeft: `4px solid ${logStyle.color}`,
          fontFamily: 'monospace',
          fontSize: '0.85rem'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Box sx={{ color: logStyle.color, mt: 0.2 }}>
            {logStyle.icon}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {timestamp}
              </Typography>
              <Chip 
                label={log.level.toUpperCase()} 
                size="small" 
                sx={{ 
                  height: 16, 
                  fontSize: '0.7rem',
                  backgroundColor: logStyle.color,
                  color: 'white'
                }} 
              />
              <Chip 
                label={log.source} 
                size="small" 
                variant="outlined"
                sx={{ height: 16, fontSize: '0.7rem' }} 
              />
            </Box>
            <Typography 
              sx={{ 
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
                fontSize: '0.85rem'
              }}
            >
              {log.message}
            </Typography>
            {log.data && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Additional Data:
                </Typography>
                <pre style={{ 
                  fontSize: '0.75rem', 
                  backgroundColor: '#f5f5f5', 
                  padding: '8px', 
                  borderRadius: '4px',
                  overflow: 'auto',
                  maxHeight: '200px'
                }}>
                  {JSON.stringify(log.data, null, 2)}
                </pre>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🔍 Development Log Viewer
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        This page captures logs from multiple sources: browser console, server events, user interactions, and WhatsApp messages. 
        Use this for debugging and share exported logs with developers for troubleshooting.
        <br /><br />
        📖 <strong>Need help?</strong> Check the <a href="/LOGGING_GUIDE.md" target="_blank" style={{ color: '#2196f3' }}>Logging & Debugging Guide</a> for detailed instructions.
      </Alert>

      {/* Connection Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: 12, 
                  height: 12, 
                  borderRadius: '50%', 
                  backgroundColor: isConnected ? '#4caf50' : '#f44336' 
                }} />
                <Typography variant="body2">
                  Real-time: {isConnected ? 'Connected' : 'Disconnected'}
                </Typography>
              </Box>
            </Grid>
            <Grid item>
              <Typography variant="body2">
                Total Logs: {filteredLogs.length}
              </Typography>
            </Grid>
            {newLogCount > 0 && (
              <Grid item>
                <Chip 
                  label={`${newLogCount} new`} 
                  color="primary" 
                  size="small" 
                />
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Controls */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Level</InputLabel>
              <Select
                value={logLevel}
                label="Level"
                onChange={(e) => setLogLevel(e.target.value)}
              >
                <MenuItem value="all">All Levels</MenuItem>
                <MenuItem value="error">Error</MenuItem>
                <MenuItem value="warn">Warning</MenuItem>
                <MenuItem value="info">Info</MenuItem>
                <MenuItem value="log">Log</MenuItem>
                <MenuItem value="debug">Debug</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Time</InputLabel>
              <Select
                value={timeFilter}
                label="Time"
                onChange={(e) => setTimeFilter(e.target.value)}
              >
                <MenuItem value="1h">Last Hour</MenuItem>
                <MenuItem value="6h">Last 6 Hours</MenuItem>
                <MenuItem value="24h">Last 24 Hours</MenuItem>
                <MenuItem value="7d">Last 7 Days</MenuItem>
                <MenuItem value="all">All Time</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={5}>
            <Stack direction="row" spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    size="small"
                  />
                }
                label="Auto-refresh"
              />
              
              <Tooltip title="Refresh logs">
                <IconButton onClick={fetchLogs} size="small">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Export logs">
                <IconButton onClick={exportLogs} size="small">
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Copy to clipboard">
                <IconButton onClick={copyLogsToClipboard} size="small">
                  <CopyIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Clear browser logs">
                <IconButton onClick={clearLogs} size="small" color="error">
                  <ClearIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Log Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label={`All Logs (${filteredLogs.length})`} />
          <Tab label={`Browser (${consoleLogs.length})`} />
          <Tab label={`System (${systemLogs.length})`} />
          <Tab label={`User Interactions (${userInteractionLogs.length})`} />
          <Tab label={`WhatsApp (${whatsappLogs.length})`} />
        </Tabs>
      </Paper>

      {/* Log Display */}
      <Paper sx={{ height: '600px', overflow: 'auto' }} ref={logContainerRef}>
        <Box sx={{ p: 2 }}>
          {filteredLogs.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              <Typography>No logs found matching current filters</Typography>
            </Box>
          ) : (
            filteredLogs.map(formatLogEntry)
          )}
        </Box>
      </Paper>

      {/* Instructions */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📋 How to Use This Log Viewer
          </Typography>
          <Stack spacing={1}>
            <Typography variant="body2">
              • <strong>Real-time monitoring:</strong> Logs update automatically when auto-refresh is enabled
            </Typography>
            <Typography variant="body2">
              • <strong>Filter logs:</strong> Use level, time, and search filters to find specific issues
            </Typography>
            <Typography variant="body2">
              • <strong>Export for sharing:</strong> Click the download button to export logs as JSON
            </Typography>
            <Typography variant="body2">
              • <strong>Copy to clipboard:</strong> Use the copy button to quickly share log snippets
            </Typography>
            <Typography variant="body2">
              • <strong>Tab navigation:</strong> Switch between different log sources using tabs
            </Typography>
            <Typography variant="body2">
              • <strong>For troubleshooting:</strong> Export logs and share the JSON file with developers
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LogViewerPage; 