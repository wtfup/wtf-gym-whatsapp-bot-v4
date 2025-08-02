import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Alert, Chip, 
  List, ListItem, ListItemText, ListItemIcon, IconButton, 
  Tooltip, Divider, LinearProgress, Accordion, AccordionSummary,
  AccordionDetails, Table, TableHead, TableBody, TableRow, TableCell,
  Switch, FormControlLabel, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  CheckCircle as HealthyIcon,
  Speed as PerformanceIcon,
  NetworkCheck as NetworkIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Timeline as TimelineIcon,
  BugReport as BugIcon,
  Api as ApiIcon,
  Dashboard as DashboardIcon,
  Notifications as AlertIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// Brand colors
const BRAND_COLORS = {
  red: '#E50012',
  darkGray: '#374151',
  mediumGray: '#6B7280',
  lightGray: '#F9FAFB',
  white: '#FFFFFF',
  green: '#10B981',
  blue: '#3B82F6',
  purple: '#8B5CF6',
  orange: '#F59E0B'
};

const DashboardHealthMonitor = () => {
  const [healthData, setHealthData] = useState(null);
  const [realtimeErrors, setRealtimeErrors] = useState([]);
  const [apiMetrics, setApiMetrics] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [expandedPanels, setExpandedPanels] = useState({
    errors: true,
    performance: false,
    api: false
  });
  const [lastUpdate, setLastUpdate] = useState(null);
  const [criticalAlertOpen, setCriticalAlertOpen] = useState(false);
  const [criticalAlert, setCriticalAlert] = useState(null);

  // Fetch comprehensive health data
  const fetchHealthData = useCallback(async () => {
    try {
      const [healthRes, analyticsRes, logsRes] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/user-interactions/analytics?days=1'),
        fetch('/api/user-interactions/logs?action_type=error&limit=20')
      ]);

      const [health, analytics, errorLogs] = await Promise.all([
        healthRes.json(),
        analyticsRes.json(),
        logsRes.json()
      ]);

      setHealthData(health);
      setRealtimeErrors(errorLogs.logs || []);
      setApiMetrics(analytics.api_analytics || []);
      setPerformanceData(analytics.performance_metrics || []);
      setLastUpdate(new Date());

      // Check for critical issues
      const criticalErrors = errorLogs.logs?.filter(log => 
        log.severity === 'critical' && 
        new Date(log.timestamp) > new Date(Date.now() - 300000) // Last 5 minutes
      ) || [];

      if (criticalErrors.length > 0 && alertsEnabled) {
        setCriticalAlert({
          count: criticalErrors.length,
          latest: criticalErrors[0],
          timestamp: new Date()
        });
        setCriticalAlertOpen(true);
      }

    } catch (error) {
      console.error('Failed to fetch health data:', error);
    } finally {
      setLoading(false);
    }
  }, [alertsEnabled]);

  // Auto-refresh setup
  useEffect(() => {
    fetchHealthData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchHealthData, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchHealthData]);

  // Real-time error monitoring
  useEffect(() => {
    if (!window.__logUserInteraction) return;

    const originalLogger = window.__logUserInteraction;
    window.__logUserInteraction = (actionType, data, severity) => {
      // Call original logger
      originalLogger(actionType, data, severity);
      
      // Real-time error handling
      if (actionType === 'error' && alertsEnabled) {
        const errorData = {
          action_type: actionType,
          severity: severity || 'medium',
          error_details: data.error_details,
          page_url: window.location.href,
          timestamp: new Date().toISOString(),
          id: Date.now() // Temporary ID
        };
        
        setRealtimeErrors(prev => [errorData, ...prev.slice(0, 19)]);
        
        if (severity === 'critical') {
          setCriticalAlert({
            count: 1,
            latest: errorData,
            timestamp: new Date()
          });
          setCriticalAlertOpen(true);
        }
      }
    };

    return () => {
      window.__logUserInteraction = originalLogger;
    };
  }, [alertsEnabled]);

  const getHealthIcon = (status) => {
    switch (status) {
      case 'ok': 
      case 'healthy': 
      case 'connected': return <HealthyIcon sx={{ color: BRAND_COLORS.green }} />;
      case 'degraded': 
      case 'warning': return <WarningIcon sx={{ color: BRAND_COLORS.orange }} />;
      case 'critical': 
      case 'error': 
      case 'disconnected': return <ErrorIcon sx={{ color: BRAND_COLORS.red }} />;
      default: return <WarningIcon sx={{ color: BRAND_COLORS.mediumGray }} />;
    }
  };

  const getHealthColor = (status) => {
    switch (status) {
      case 'ok': 
      case 'healthy': 
      case 'connected': return BRAND_COLORS.green;
      case 'degraded': 
      case 'warning': return BRAND_COLORS.orange;
      case 'critical': 
      case 'error': 
      case 'disconnected': return BRAND_COLORS.red;
      default: return BRAND_COLORS.mediumGray;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'low': return BRAND_COLORS.mediumGray;
      case 'medium': return BRAND_COLORS.orange;
      case 'high': return BRAND_COLORS.red;
      case 'critical': return '#8B0000';
      default: return BRAND_COLORS.mediumGray;
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return time.toLocaleDateString();
  };

  const handlePanelChange = (panel) => (event, isExpanded) => {
    setExpandedPanels(prev => ({
      ...prev,
      [panel]: isExpanded
    }));
  };

  const clearOldErrors = async () => {
    try {
      await fetch('/api/user-interactions/clear?older_than_days=1', {
        method: 'DELETE'
      });
      await fetchHealthData();
    } catch (error) {
      console.error('Failed to clear old errors:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography>Loading dashboard health monitor...</Typography>
      </Box>
    );
  }

  const overallHealth = healthData?.status || 'unknown';
  const errorCount = realtimeErrors.filter(e => e.action_type === 'error').length;
  const criticalCount = realtimeErrors.filter(e => e.severity === 'critical').length;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: BRAND_COLORS.darkGray }}>
          🏥 Dashboard Health Monitor
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={alertsEnabled}
                onChange={(e) => setAlertsEnabled(e.target.checked)}
                color="primary"
              />
            }
            label="Alerts"
          />
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                color="primary"
              />
            }
            label="Auto-refresh"
          />
          <Tooltip title="Refresh now">
            <IconButton onClick={fetchHealthData}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Clear old errors">
            <IconButton onClick={clearOldErrors} color="error">
              <ClearIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Overall Status */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: getHealthColor(overallHealth) + '0D' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {getHealthIcon(overallHealth)}
          <Typography variant="h5" sx={{ ml: 1, fontWeight: 600 }}>
            System Status: {overallHealth.toUpperCase()}
          </Typography>
          {lastUpdate && (
            <Typography variant="body2" sx={{ ml: 'auto', color: BRAND_COLORS.mediumGray }}>
              Last updated: {formatTimeAgo(lastUpdate)}
            </Typography>
          )}
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <DashboardIcon sx={{ color: BRAND_COLORS.blue, fontSize: 40, mb: 1 }} />
              <Typography variant="h6">{healthData?.whatsapp_status || 'Unknown'}</Typography>
              <Typography variant="body2" color="textSecondary">WhatsApp Service</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <StorageIcon sx={{ color: BRAND_COLORS.green, fontSize: 40, mb: 1 }} />
              <Typography variant="h6">{healthData?.database_status || 'Unknown'}</Typography>
              <Typography variant="body2" color="textSecondary">Database</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <BugIcon sx={{ color: errorCount > 0 ? BRAND_COLORS.red : BRAND_COLORS.green, fontSize: 40, mb: 1 }} />
              <Typography variant="h6">{errorCount}</Typography>
              <Typography variant="body2" color="textSecondary">Recent Errors</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <AlertIcon sx={{ color: criticalCount > 0 ? BRAND_COLORS.red : BRAND_COLORS.green, fontSize: 40, mb: 1 }} />
              <Typography variant="h6">{criticalCount}</Typography>
              <Typography variant="body2" color="textSecondary">Critical Issues</Typography>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Real-time Errors */}
      <Accordion expanded={expandedPanels.errors} onChange={handlePanelChange('errors')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <ErrorIcon sx={{ mr: 1, color: BRAND_COLORS.red }} />
          <Typography variant="h6">
            Real-time Errors ({realtimeErrors.length})
          </Typography>
          {criticalCount > 0 && (
            <Chip 
              label={`${criticalCount} Critical`} 
              color="error" 
              size="small" 
              sx={{ ml: 2 }}
            />
          )}
        </AccordionSummary>
        <AccordionDetails>
          {realtimeErrors.length > 0 ? (
            <List dense>
              {realtimeErrors.slice(0, 10).map((error, index) => (
                <ListItem key={error.id || index} divider>
                  <ListItemIcon>
                    <Chip 
                      label={error.severity || 'medium'} 
                      size="small"
                      sx={{ 
                        backgroundColor: getSeverityColor(error.severity),
                        color: 'white',
                        minWidth: 80
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={error.error_details?.message || 'Unknown error'}
                    secondary={
                      <Box>
                        <Typography variant="caption" component="div">
                          {error.page_url || error.url_pathname} • {formatTimeAgo(error.timestamp)}
                        </Typography>
                        {error.error_details?.error_type && (
                          <Typography variant="caption" color="textSecondary">
                            Type: {error.error_details.error_type}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Alert severity="success">
              No errors detected in the last 24 hours
            </Alert>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Performance Metrics */}
      <Accordion expanded={expandedPanels.performance} onChange={handlePanelChange('performance')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <PerformanceIcon sx={{ mr: 1, color: BRAND_COLORS.orange }} />
          <Typography variant="h6">
            Performance Metrics
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {performanceData.length > 0 ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Page</TableCell>
                  <TableCell align="right">Avg Load Time</TableCell>
                  <TableCell align="right">Avg Viewport</TableCell>
                  <TableCell align="right">Issues</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {performanceData.slice(0, 10).map((page, index) => (
                  <TableRow key={index}>
                    <TableCell>{page.page_path}</TableCell>
                    <TableCell align="right">
                      {page.avg_load_time ? `${Math.round(page.avg_load_time)}ms` : 'N/A'}
                    </TableCell>
                    <TableCell align="right">
                      {page.avg_viewport_width ? `${page.avg_viewport_width}px` : 'N/A'}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {page.invisible_elements > 0 && (
                          <Chip label={`${page.invisible_elements} invisible`} size="small" color="warning" />
                        )}
                        {page.out_of_viewport_elements > 0 && (
                          <Chip label={`${page.out_of_viewport_elements} off-screen`} size="small" color="info" />
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Alert severity="info">
              No performance data available
            </Alert>
          )}
        </AccordionDetails>
      </Accordion>

      {/* API Metrics */}
      <Accordion expanded={expandedPanels.api} onChange={handlePanelChange('api')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <ApiIcon sx={{ mr: 1, color: BRAND_COLORS.blue }} />
          <Typography variant="h6">
            API Performance
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {apiMetrics.length > 0 ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Endpoint</TableCell>
                  <TableCell align="right">Calls</TableCell>
                  <TableCell align="right">Avg Duration</TableCell>
                  <TableCell align="right">Errors</TableCell>
                  <TableCell align="right">Slow Calls</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {apiMetrics.slice(0, 10).map((api, index) => (
                  <TableRow key={index}>
                    <TableCell>{api.api_endpoint}</TableCell>
                    <TableCell align="right">{api.call_count}</TableCell>
                    <TableCell align="right">
                      {api.avg_duration ? `${Math.round(api.avg_duration)}ms` : 'N/A'}
                    </TableCell>
                    <TableCell align="right">
                      {api.error_count > 0 ? (
                        <Chip label={api.error_count} size="small" color="error" />
                      ) : (
                        '0'
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {api.slow_count > 0 ? (
                        <Chip label={api.slow_count} size="small" color="warning" />
                      ) : (
                        '0'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Alert severity="info">
              No API metrics available
            </Alert>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Critical Alert Dialog */}
      <Dialog open={criticalAlertOpen} onClose={() => setCriticalAlertOpen(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', color: BRAND_COLORS.red }}>
          <ErrorIcon sx={{ mr: 1 }} />
          Critical Error Detected!
        </DialogTitle>
        <DialogContent>
          {criticalAlert && (
            <Box>
              <Alert severity="error" sx={{ mb: 2 }}>
                {criticalAlert.count} critical error{criticalAlert.count > 1 ? 's' : ''} detected
              </Alert>
              <Typography variant="subtitle2" gutterBottom>
                Latest Error:
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>
                {criticalAlert.latest?.error_details?.message}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Page: {criticalAlert.latest?.page_url}
              </Typography>
              <br />
              <Typography variant="caption" color="textSecondary">
                Time: {formatTimeAgo(criticalAlert.timestamp)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCriticalAlertOpen(false)}>
            Acknowledge
          </Button>
          <Button 
            onClick={() => {
              setCriticalAlertOpen(false);
              fetchHealthData();
            }}
            variant="contained"
            color="primary"
          >
            Refresh Data
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DashboardHealthMonitor; 