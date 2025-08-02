import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  Collapse,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Divider
} from '@mui/material';
import {
  BugReport as BugIcon,
  Close as CloseIcon,
  Clear as ClearIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';

// In-memory log storage for the console
let logEntries = [];
let logSubscribers = [];

const addLogEntry = (entry) => {
  const timestamp = new Date();
  const newEntry = {
    id: `${timestamp.getTime()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp,
    ...entry
  };
  
  logEntries.unshift(newEntry); // Add to beginning
  
  // Keep only last 100 entries
  if (logEntries.length > 100) {
    logEntries = logEntries.slice(0, 100);
  }
  
  // Notify subscribers
  logSubscribers.forEach(callback => callback(logEntries));
};

const subscribeToLogs = (callback) => {
  logSubscribers.push(callback);
  return () => {
    logSubscribers = logSubscribers.filter(cb => cb !== callback);
  };
};

// Export for use in logger
export { addLogEntry };

const LiveConsole = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [logs, setLogs] = useState([]);
  const [settings, setSettings] = useState({
    showDebug: true,
    showInfo: true,
    showWarn: true,
    showError: true,
    autoScroll: true,
    maxEntries: 50
  });
  const [filterText, setFilterText] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const logsEndRef = useRef(null);

  useEffect(() => {
    // Subscribe to log updates
    const unsubscribe = subscribeToLogs((newLogs) => {
      setLogs(newLogs);
    });

    // Set initial logs
    setLogs(logEntries);

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new logs arrive
    if (settings.autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, settings.autoScroll]);

  // Keyboard shortcut: Shift+L to toggle
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.shiftKey && event.key === 'L') {
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const getLevelColor = (level) => {
    switch (level) {
      case 'error': return '#f44336';
      case 'warn': return '#ff9800';
      case 'info': return '#2196f3';
      case 'debug': return '#9e9e9e';
      default: return '#757575';
    }
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'error': return '❌';
      case 'warn': return '⚠️';
      case 'info': return 'ℹ️';
      case 'debug': return '🔍';
      default: return '📝';
    }
  };

  const formatTimestamp = (timestamp) => {
    return timestamp.toLocaleTimeString();
  };

  const clearLogs = () => {
    logEntries = [];
    setLogs([]);
  };

  const filteredLogs = logs.filter(log => {
    // Level filter
    if (!settings[`show${log.level.charAt(0).toUpperCase() + log.level.slice(1)}`]) {
      return false;
    }
    
    // Text filter
    if (filterText) {
      const searchText = filterText.toLowerCase();
      return (
        log.message.toLowerCase().includes(searchText) ||
        log.source.toLowerCase().includes(searchText) ||
        (log.data && JSON.stringify(log.data).toLowerCase().includes(searchText))
      );
    }
    
    return true;
  }).slice(0, settings.maxEntries);

  const ConsoleContent = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ 
        p: 1, 
        backgroundColor: '#1e1e1e', 
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #333'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BugIcon sx={{ fontSize: 20 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            Live Console
          </Typography>
          <Chip 
            label={`${filteredLogs.length} logs`} 
            size="small" 
            sx={{ 
              backgroundColor: 'rgba(255,255,255,0.1)', 
              color: 'white',
              fontSize: '0.7rem'
            }} 
          />
        </Box>
        
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton 
            size="small" 
            onClick={() => setShowSettings(true)}
            sx={{ color: 'white' }}
          >
            <SettingsIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={clearLogs}
            sx={{ color: 'white' }}
          >
            <ClearIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => setIsMinimized(!isMinimized)}
            sx={{ color: 'white' }}
          >
            {isMinimized ? <ExpandIcon sx={{ fontSize: 16 }} /> : <CollapseIcon sx={{ fontSize: 16 }} />}
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => setIsOpen(false)}
            sx={{ color: 'white' }}
          >
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      </Box>

      {/* Filter Bar */}
      <Box sx={{ p: 1, backgroundColor: '#2d2d2d', borderBottom: '1px solid #333' }}>
        <TextField
          size="small"
          placeholder="Filter logs..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          sx={{
            width: '100%',
            '& .MuiOutlinedInput-root': {
              color: 'white',
              backgroundColor: '#1e1e1e',
              '& fieldset': {
                borderColor: '#555',
              },
              '&:hover fieldset': {
                borderColor: '#777',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#2196f3',
              },
            },
            '& .MuiInputBase-input': {
              color: 'white',
              fontSize: '0.8rem',
            },
            '& .MuiInputBase-input::placeholder': {
              color: '#aaa',
              opacity: 1,
            },
          }}
        />
      </Box>

      {/* Logs List */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto', 
        backgroundColor: '#1e1e1e',
        fontFamily: 'monospace',
        fontSize: '0.8rem'
      }}>
        <List dense sx={{ p: 0 }}>
          {filteredLogs.length === 0 ? (
            <ListItem>
              <ListItemText 
                primary="No logs to display" 
                sx={{ color: '#888', textAlign: 'center' }}
              />
            </ListItem>
          ) : (
            filteredLogs.map((log) => (
              <ListItem 
                key={log.id} 
                sx={{ 
                  borderBottom: '1px solid #333',
                  '&:hover': { backgroundColor: '#2d2d2d' }
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span style={{ color: '#888', fontSize: '0.7rem' }}>
                        {formatTimestamp(log.timestamp)}
                      </span>
                      <span style={{ color: getLevelColor(log.level) }}>
                        {getLevelIcon(log.level)}
                      </span>
                      <Chip 
                        label={log.source} 
                        size="small" 
                        sx={{ 
                          backgroundColor: 'rgba(255,255,255,0.1)', 
                          color: 'white',
                          fontSize: '0.6rem',
                          height: '16px'
                        }} 
                      />
                      <span style={{ color: 'white' }}>
                        {log.message}
                      </span>
                    </Box>
                  }
                  secondary={
                    log.data && Object.keys(log.data).length > 0 && (
                      <Box sx={{ mt: 0.5 }}>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: '#aaa',
                            fontFamily: 'monospace',
                            fontSize: '0.7rem',
                            wordBreak: 'break-all'
                          }}
                        >
                          {JSON.stringify(log.data, null, 2)}
                        </Typography>
                      </Box>
                    )
                  }
                />
              </ListItem>
            ))
          )}
          <div ref={logsEndRef} />
        </List>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Floating Action Button */}
      <Fab
        color="primary"
        size="small"
        onClick={() => setIsOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000,
          backgroundColor: '#1e1e1e',
          '&:hover': { backgroundColor: '#2d2d2d' }
        }}
      >
        <BugIcon />
      </Fab>

      {/* Console Dialog */}
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: isMinimized ? 'auto' : '70vh',
            minHeight: isMinimized ? 'auto' : '400px',
            backgroundColor: '#1e1e1e',
            color: 'white'
          }
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: '#1e1e1e', 
          color: 'white',
          p: 0,
          m: 0
        }}>
          {!isMinimized && <ConsoleContent />}
        </DialogTitle>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Console Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography variant="h6">Log Levels</Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.showDebug}
                  onChange={(e) => setSettings(prev => ({ ...prev, showDebug: e.target.checked }))}
                />
              }
              label="Show Debug"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.showInfo}
                  onChange={(e) => setSettings(prev => ({ ...prev, showInfo: e.target.checked }))}
                />
              }
              label="Show Info"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.showWarn}
                  onChange={(e) => setSettings(prev => ({ ...prev, showWarn: e.target.checked }))}
                />
              }
              label="Show Warnings"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.showError}
                  onChange={(e) => setSettings(prev => ({ ...prev, showError: e.target.checked }))}
                />
              }
              label="Show Errors"
            />
            
            <Divider />
            
            <Typography variant="h6">Display Options</Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.autoScroll}
                  onChange={(e) => setSettings(prev => ({ ...prev, autoScroll: e.target.checked }))}
                />
              }
              label="Auto-scroll to bottom"
            />
            
            <TextField
              label="Max entries to display"
              type="number"
              value={settings.maxEntries}
              onChange={(e) => setSettings(prev => ({ ...prev, maxEntries: parseInt(e.target.value) || 50 }))}
              inputProps={{ min: 10, max: 200 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettings(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default LiveConsole; 