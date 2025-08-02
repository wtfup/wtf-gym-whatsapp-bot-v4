import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Chip, Button, TextField, FormControl, Select, MenuItem, InputLabel,
  Card, CardContent, Grid, CircularProgress, Alert, Pagination,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  Switch, FormControlLabel, Tabs, Tab
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Analytics as AnalyticsIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

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

const UserInteractionLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  
  // Filters
  const [sessionId, setSessionId] = useState('');
  const [actionType, setActionType] = useState('');
  const [pageUrl, setPageUrl] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [limit, setLimit] = useState(50);
  
  // Modals
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  
  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(false);
  
  // Available in all environments for production monitoring
  const isProduction = process.env.NODE_ENV === 'production';
  
  useEffect(() => {
    
    fetchLogs();
    fetchAnalytics();
    
    // Auto-refresh setup
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchLogs();
        fetchAnalytics();
      }, 10000); // Refresh every 10 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionId, actionType, pageUrl, fromDate, toDate, page, limit, autoRefresh]);
  
  const fetchLogs = async () => {
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (sessionId) params.append('session_id', sessionId);
      if (actionType) params.append('action_type', actionType);
      if (pageUrl) params.append('page_url', pageUrl);
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);
      params.append('limit', limit);
      params.append('offset', (page - 1) * limit);
      
      const response = await fetch(`/api/user-interactions/logs?${params}`);
      const data = await response.json();
      
      setLogs(data.logs || []);
      setTotalPages(Math.ceil((data.pagination?.total || 0) / limit));
    } catch (error) {
      console.error('Error fetching interaction logs:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAnalytics = async () => {
    
    setAnalyticsLoading(true);
    try {
      const params = new URLSearchParams();
      if (sessionId) params.append('session_id', sessionId);
      params.append('days', 7);
      
      const response = await fetch(`/api/user-interactions/analytics?${params}`);
      const data = await response.json();
      
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching interaction analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };
  
  const clearLogs = async (olderThanDays = 7) => {
    
    try {
      const params = new URLSearchParams();
      params.append('older_than_days', olderThanDays);
      if (sessionId) params.append('session_id', sessionId);
      
      const response = await fetch(`/api/user-interactions/clear?${params}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      alert(`Cleared ${data.deleted_count} interaction logs`);
      
      fetchLogs();
      fetchAnalytics();
    } catch (error) {
      console.error('Error clearing logs:', error);
      alert('Error clearing logs');
    }
  };
  
  const exportLogs = () => {
    
    const csvData = logs.map(log => ({
      timestamp: log.timestamp,
      session_id: log.session_id,
      action_type: log.action_type,
      page_url: log.page_url,
      element_selector: log.element_selector,
      element_text: log.element_text,
      mouse_x: log.mouse_position?.x || '',
      mouse_y: log.mouse_position?.y || '',
      viewport_width: log.viewport_size?.width || '',
      viewport_height: log.viewport_size?.height || ''
    }));
    
    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-interactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const getActionTypeColor = (actionType) => {
    switch (actionType) {
      case 'click': return BRAND_COLORS.blue;
      case 'navigation': return BRAND_COLORS.green;
      case 'error': return BRAND_COLORS.red;
      case 'api_error': return BRAND_COLORS.red;
      case 'api_slow': return BRAND_COLORS.orange;
      case 'form_submit': return BRAND_COLORS.purple;
      case 'scroll': return BRAND_COLORS.mediumGray;
      case 'focus': return BRAND_COLORS.orange;
      case 'page_load': return BRAND_COLORS.green;
      default: return BRAND_COLORS.darkGray;
    }
  };
  
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'low': return BRAND_COLORS.mediumGray;
      case 'medium': return BRAND_COLORS.orange;
      case 'high': return BRAND_COLORS.red;
      case 'critical': return '#8B0000'; // Dark red
      default: return BRAND_COLORS.mediumGray;
    }
  };
  
  const resetFilters = () => {
    setSessionId('');
    setActionType('');
    setPageUrl('');
    setFromDate('');
    setToDate('');
    setPage(1);
  };
  

  
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: BRAND_COLORS.darkGray }}>
          🔍 Real-time Dashboard Monitoring
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
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
          <Tooltip title="Refresh data">
            <IconButton onClick={() => { fetchLogs(); fetchAnalytics(); }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export logs as CSV">
            <IconButton onClick={exportLogs} disabled={logs.length === 0}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Clear old logs">
            <IconButton onClick={() => setClearModalOpen(true)} color="error">
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Environment info */}
      <Alert severity={isProduction ? "info" : "warning"} sx={{ mb: 3 }}>
        {isProduction ? 
          "📊 Production Monitoring - Real-time dashboard health and error tracking" :
          "🧪 Development Environment - Enhanced debugging and interaction tracking"
        }
      </Alert>
      
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="📊 Analytics" />
          <Tab label="📋 Raw Logs" />
        </Tabs>
      </Box>
      
      {/* Analytics Tab */}
      {activeTab === 0 && (
        <Box>
          {analyticsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : analytics ? (
            <Grid container spacing={3}>
              {/* Action Types Chart */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Action Types Distribution</Typography>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={analytics.action_types}
                          dataKey="count"
                          nameKey="action_type"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ action_type, count }) => `${action_type}: ${count}`}
                        >
                          {analytics.action_types.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getActionTypeColor(entry.action_type)} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Hourly Activity */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Hourly Activity</Typography>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={analytics.hourly_activity}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="count" fill={BRAND_COLORS.blue} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Popular Pages */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Popular Pages</Typography>
                    <Box sx={{ maxHeight: 250, overflow: 'auto' }}>
                      {analytics.popular_pages.map((page, index) => (
                        <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                          <Typography variant="body2" noWrap sx={{ flex: 1, mr: 2 }}>
                            {page.page_url.replace(window.location.origin, '')}
                          </Typography>
                          <Chip label={page.count} size="small" />
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Session Activity */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Active Sessions</Typography>
                    <Box sx={{ maxHeight: 250, overflow: 'auto' }}>
                      {analytics.session_activity.slice(0, 10).map((session, index) => (
                        <Box key={index} sx={{ mb: 2, p: 2, bgcolor: BRAND_COLORS.lightGray, borderRadius: 1 }}>
                          <Typography variant="body2" fontWeight="bold">
                            Session: {session.session_id.slice(0, 8)}...
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {session.total_interactions} interactions | {session.pages_visited} pages | {session.errors} errors
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Errors Summary */}
              {analytics.errors.length > 0 && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="error">
                        🚨 Errors Detected
                      </Typography>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Page</TableCell>
                            <TableCell>Element</TableCell>
                            <TableCell>Count</TableCell>
                            <TableCell>Last Error</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {analytics.errors.map((error, index) => (
                            <TableRow key={index}>
                              <TableCell>{error.page_url}</TableCell>
                              <TableCell>{error.element_selector}</TableCell>
                              <TableCell>
                                <Chip label={error.error_count} color="error" size="small" />
                              </TableCell>
                              <TableCell>{new Date(error.last_error).toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          ) : (
            <Alert severity="info">No analytics data available</Alert>
          )}
        </Box>
      )}
      
      {/* Raw Logs Tab */}
      {activeTab === 1 && (
        <Box>
          {/* Filters */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Filters</Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Session ID"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  placeholder="Filter by session..."
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Action Type</InputLabel>
                  <Select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    label="Action Type"
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="click">Click</MenuItem>
                    <MenuItem value="navigation">Navigation</MenuItem>
                    <MenuItem value="error">Error</MenuItem>
                    <MenuItem value="form_submit">Form Submit</MenuItem>
                    <MenuItem value="scroll">Scroll</MenuItem>
                    <MenuItem value="focus">Focus</MenuItem>
                    <MenuItem value="page_load">Page Load</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Page URL"
                  value={pageUrl}
                  onChange={(e) => setPageUrl(e.target.value)}
                  placeholder="Filter by page..."
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Limit</InputLabel>
                  <Select
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    label="Limit"
                  >
                    <MenuItem value={25}>25</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                    <MenuItem value={100}>100</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  type="datetime-local"
                  label="From Date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  type="datetime-local"
                  label="To Date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={resetFilters}
                >
                  Clear Filters
                </Button>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Logs Table */}
          <Paper>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Page</TableCell>
                      <TableCell>Element</TableCell>
                      <TableCell>Session</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id} hover>
                        <TableCell>
                          <Typography variant="caption">
                            {new Date(log.timestamp).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.action_type}
                            size="small"
                            sx={{
                              backgroundColor: getActionTypeColor(log.action_type),
                              color: 'white'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {log.page_url.replace(window.location.origin, '')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                            {log.element_selector || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {log.session_id.slice(0, 8)}...
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedLog(log);
                              setDetailModalOpen(true);
                            }}
                          >
                            <ViewIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <Pagination
                      count={totalPages}
                      page={page}
                      onChange={(e, newPage) => setPage(newPage)}
                      color="primary"
                    />
                  </Box>
                )}
                
                {logs.length === 0 && (
                  <Box sx={{ textAlign: 'center', p: 4 }}>
                    <Typography color="text.secondary">
                      No interaction logs found
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </Paper>
        </Box>
      )}
      
      {/* Detail Modal */}
      <Dialog
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Interaction Log Details</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Timestamp:</Typography>
                  <Typography variant="body2">{new Date(selectedLog.timestamp).toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Action Type:</Typography>
                  <Chip
                    label={selectedLog.action_type}
                    size="small"
                    sx={{ backgroundColor: getActionTypeColor(selectedLog.action_type), color: 'white' }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Page URL:</Typography>
                  <Typography variant="body2">{selectedLog.page_url}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Element Selector:</Typography>
                  <Typography variant="body2">{selectedLog.element_selector || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Element Text:</Typography>
                  <Typography variant="body2">{selectedLog.element_text || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Mouse Position:</Typography>
                  <Typography variant="body2">
                    {selectedLog.mouse_position ? 
                      `x: ${selectedLog.mouse_position.x}, y: ${selectedLog.mouse_position.y}` : 
                      'N/A'
                    }
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Viewport Size:</Typography>
                  <Typography variant="body2">
                    {selectedLog.viewport_size ? 
                      `${selectedLog.viewport_size.width} x ${selectedLog.viewport_size.height}` : 
                      'N/A'
                    }
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Session ID:</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {selectedLog.session_id}
                  </Typography>
                </Grid>
                {selectedLog.error_details && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="error">Error Details:</Typography>
                    <Paper sx={{ p: 2, bgcolor: '#ffebee' }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {JSON.stringify(selectedLog.error_details, null, 2)}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
                {selectedLog.additional_data && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Additional Data:</Typography>
                    <Paper sx={{ p: 2, bgcolor: BRAND_COLORS.lightGray }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {JSON.stringify(selectedLog.additional_data, null, 2)}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Clear Logs Modal */}
      <Dialog
        open={clearModalOpen}
        onClose={() => setClearModalOpen(false)}
      >
        <DialogTitle>Clear Interaction Logs</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            This will permanently delete old interaction logs. How many days of logs would you like to keep?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action cannot be undone!
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearModalOpen(false)}>Cancel</Button>
          <Button onClick={() => { clearLogs(30); setClearModalOpen(false); }} color="warning">
            Keep 30 days
          </Button>
          <Button onClick={() => { clearLogs(7); setClearModalOpen(false); }} color="warning">
            Keep 7 days
          </Button>
          <Button onClick={() => { clearLogs(1); setClearModalOpen(false); }} color="error">
            Keep 1 day
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserInteractionLogsPage; 