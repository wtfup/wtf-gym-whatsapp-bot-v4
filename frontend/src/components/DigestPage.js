import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Button, Switch, FormControl, 
  Select, MenuItem, TextField, Chip, Alert, CircularProgress, Dialog, DialogTitle, 
  DialogContent, DialogActions, List, ListItem, ListItemText, ListItemIcon, 
  Divider, IconButton, Tooltip, Badge, LinearProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, FormControlLabel, Accordion,
  AccordionSummary, AccordionDetails, Tab, Tabs
} from '@mui/material';
import {
  Schedule as ScheduleIcon, Send as SendIcon, Preview as PreviewIcon, 
  Group as GroupIcon, Analytics as AnalyticsIcon, CheckCircle as CheckCircleIcon,
  Error as ErrorIcon, Info as InfoIcon, WhatsApp as WhatsAppIcon, 
  Email as EmailIcon, Refresh as RefreshIcon, Settings as SettingsIcon,
  TrendingUp as TrendingUpIcon, Flag as FlagIcon, ReportProblem as ReportIcon,
  AccessTime as TimeIcon, CalendarToday as CalendarIcon, History as HistoryIcon,
  ExpandMore as ExpandMoreIcon, Visibility as VisibilityIcon, Close as CloseIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import axios from 'axios';

const BRAND_COLORS = {
  red: '#dc2626',
  darkRed: '#b91c1c',
  lightRed: '#fef2f2',
  white: '#ffffff',
  lightGray: '#f8fafc',
  mediumGray: '#64748b',
  darkGray: '#334155',
  border: '#e2e8f0',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444'
};

const DigestPage = () => {
  // Core state
  const [digestSettings, setDigestSettings] = useState([]);
  const [digestHistory, setDigestHistory] = useState([]);
  const [digestStats, setDigestStats] = useState({});
  const [groups, setGroups] = useState([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewType, setPreviewType] = useState('daily');
  const [sendDialog, setSendDialog] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [sendResults, setSendResults] = useState(null);
  
  // History state
  const [historyFilters, setHistoryFilters] = useState({
    digest_type: '',
    target_group: '',
    status: '',
    date_from: '',
    date_to: ''
  });
  const [historyPage, setHistoryPage] = useState(0);
  const [historyRowsPerPage, setHistoryRowsPerPage] = useState(10);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [viewMessageDialog, setViewMessageDialog] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  
  // Feedback state
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    loadDigestHistory();
  }, [historyFilters, historyPage, historyRowsPerPage]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadDigestSettings(),
        loadGroups(),
        loadDigestStats(),
        loadDigestHistory()
      ]);
    } catch (error) {
      showFeedback('Failed to load data: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadDigestSettings = async () => {
    try {
      const response = await axios.get('/api/digest/settings');
      setDigestSettings(response.data);
    } catch (error) {
      console.error('Failed to load digest settings:', error);
      throw error;
    }
  };

  const loadGroups = async () => {
    try {
      const response = await axios.get('/api/groups');
      setGroups(response.data);
    } catch (error) {
      console.error('Failed to load groups:', error);
      throw error;
    }
  };

  const loadDigestStats = async () => {
    try {
      const response = await axios.get('/api/digest/stats');
      setDigestStats(response.data);
    } catch (error) {
      console.error('Failed to load digest stats:', error);
      throw error;
    }
  };

  const loadDigestHistory = async () => {
    try {
      const params = {
        ...historyFilters,
        limit: historyRowsPerPage,
        offset: historyPage * historyRowsPerPage
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });
      
      const response = await axios.get('/api/digest/history', { params });
      setDigestHistory(response.data.history);
      setHistoryTotal(response.data.pagination.total);
    } catch (error) {
      console.error('Failed to load digest history:', error);
    }
  };

  const showFeedback = (message, severity = 'info') => {
    setFeedback({ message, severity });
    setTimeout(() => setFeedback(null), 5000);
  };

  const updateDigestSetting = async (type, updates) => {
    try {
      setLoading(true);
      const response = await axios.put(`/api/digest/settings/${type}`, updates);
      
      // Update local state
      setDigestSettings(prev => 
        prev.map(setting => 
          setting.digest_type === type 
            ? { ...setting, ...response.data }
            : setting
        )
      );
      
      showFeedback(`${type} digest settings updated successfully!`, 'success');
    } catch (error) {
      showFeedback(`Failed to update ${type} settings: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (type) => {
    setLoading(true);
    setPreviewType(type);
    
    try {
      const response = await axios.get(`/api/digest/preview/${type}`);
      setPreviewData(response.data);
      setPreviewDialog(true);
    } catch (error) {
      showFeedback('Failed to generate preview: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendDigest = async () => {
    setLoading(true);
    
    try {
      const response = await axios.post('/api/digest/send', {
        type: previewType,
        groups: selectedGroups.length > 0 ? selectedGroups : undefined
      });
      
      setSendResults(response.data);
      setSendDialog(false);
      setPreviewDialog(false);
      setSelectedGroups([]);
      
      // Reload stats and history
      loadDigestStats();
      loadDigestHistory();
      
      showFeedback('Digest sent successfully!', 'success');
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      setSendResults({ error: errorMsg });
      showFeedback('Failed to send digest: ' + errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return BRAND_COLORS.success;
      case 'failed': return BRAND_COLORS.error;
      case 'skipped': return BRAND_COLORS.warning;
      default: return BRAND_COLORS.mediumGray;
    }
  };

  const getDigestSetting = (type) => {
    return digestSettings.find(s => s.digest_type === type) || {
      digest_type: type,
      is_enabled: false,
      send_time: '20:00',
      target_groups: []
    };
  };

  const DigestCard = ({ title, icon, type, description }) => {
    const setting = getDigestSetting(type);
    
    return (
      <Card sx={{ 
        height: '100%', 
        border: setting.is_enabled ? `2px solid ${BRAND_COLORS.success}` : `1px solid ${BRAND_COLORS.border}`,
        transition: 'all 0.3s ease',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{ 
              p: 1.5, 
              borderRadius: 2, 
              backgroundColor: setting.is_enabled ? BRAND_COLORS.success : BRAND_COLORS.lightGray,
              color: setting.is_enabled ? BRAND_COLORS.white : BRAND_COLORS.mediumGray,
              mr: 2
            }}>
              {icon}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                {title}
              </Typography>
              <Typography variant="body2" sx={{ color: BRAND_COLORS.mediumGray }}>
                {description}
              </Typography>
            </Box>
            <Switch
              checked={setting.is_enabled}
              onChange={(e) => updateDigestSetting(type, { is_enabled: e.target.checked })}
              color="success"
              disabled={loading}
            />
          </Box>

          {setting.is_enabled && (
            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  label="Time"
                  type="time"
                  value={setting.send_time}
                  onChange={(e) => updateDigestSetting(type, { send_time: e.target.value })}
                  size="small"
                  sx={{ flex: 1 }}
                  disabled={loading}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<PreviewIcon />}
                  onClick={() => handlePreview(type)}
                  disabled={loading}
                  size="small"
                  sx={{ flex: 1 }}
                >
                  Preview
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={() => {
                    setPreviewType(type);
                    setSendDialog(true);
                  }}
                  disabled={loading}
                  size="small"
                  sx={{ flex: 1, backgroundColor: BRAND_COLORS.red }}
                >
                  Send Now
                </Button>
              </Box>

              {digestStats.recentActivity && (
                <Box sx={{ fontSize: '0.8rem', color: BRAND_COLORS.mediumGray }}>
                  {(() => {
                    const lastSent = digestStats.recentActivity.find(
                      activity => activity.digest_type === type && activity.status === 'success'
                    );
                    return lastSent 
                      ? `Last sent: ${formatTime(lastSent.sent_at)}`
                      : 'Never sent';
                  })()}
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  // Calculate stats from history
  const calculateStats = () => {
    const totalSent = digestHistory.filter(h => h.status === 'success').length;
    const totalAttempts = digestHistory.length;
    const successRate = totalAttempts > 0 ? ((totalSent / totalAttempts) * 100).toFixed(1) : 0;
    
    return {
      totalSent,
      successRate,
      totalGroups: groups.length,
      recentFailures: digestHistory.filter(h => h.status === 'failed').length
    };
  };

  const stats = calculateStats();

  return (
    <Box sx={{ p: 3 }}>
      {/* Feedback Alert */}
      {feedback && (
        <Alert severity={feedback.severity} sx={{ mb: 3 }} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: BRAND_COLORS.darkGray, mb: 1 }}>
          Digest Management
        </Typography>
        <Typography variant="body1" sx={{ color: BRAND_COLORS.mediumGray, mb: 3 }}>
          Automated reporting and digest management with real-time tracking
        </Typography>
        
        {/* Quick Actions */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadAllData}
            disabled={loading}
            sx={{ borderColor: BRAND_COLORS.red, color: BRAND_COLORS.red }}
          >
            {loading ? 'Refreshing...' : 'Refresh All'}
          </Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={() => setSendDialog(true)}
            disabled={loading}
            sx={{ backgroundColor: BRAND_COLORS.red }}
          >
            Send Test Digest
          </Button>
        </Box>
      </Box>

      {/* Navigation Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Digest Settings" />
          <Tab label="History & Analytics" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && (
        <>
          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: BRAND_COLORS.success, mb: 1 }}>
                  {stats.totalSent}
                </Typography>
                <Typography variant="body2" sx={{ color: BRAND_COLORS.mediumGray }}>
                  Total Sent
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: BRAND_COLORS.success, mb: 1 }}>
                  {stats.successRate}%
                </Typography>
                <Typography variant="body2" sx={{ color: BRAND_COLORS.mediumGray }}>
                  Success Rate
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: BRAND_COLORS.warning, mb: 1 }}>
                  {stats.totalGroups}
                </Typography>
                <Typography variant="body2" sx={{ color: BRAND_COLORS.mediumGray }}>
                  WhatsApp Groups
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: BRAND_COLORS.error, mb: 1 }}>
                  {stats.recentFailures}
                </Typography>
                <Typography variant="body2" sx={{ color: BRAND_COLORS.mediumGray }}>
                  Recent Failures
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Digest Configuration */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <DigestCard
                title="Daily Digest"
                icon={<CalendarIcon />}
                type="daily"
                description="Daily summary of messages, flags, and key insights"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <DigestCard
                title="Weekly Report"
                icon={<TrendingUpIcon />}
                type="weekly"
                description="Comprehensive weekly analysis and trends"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <DigestCard
                title="Monthly Overview"
                icon={<AnalyticsIcon />}
                type="monthly"
                description="Monthly performance metrics and insights"
              />
            </Grid>
          </Grid>
        </>
      )}

      {activeTab === 1 && (
        <>
          {/* History Filters */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <FilterIcon sx={{ mr: 1 }} />
              Filter Digest History
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <Select
                    value={historyFilters.digest_type}
                    onChange={(e) => setHistoryFilters(prev => ({ ...prev, digest_type: e.target.value }))}
                    displayEmpty
                  >
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <Select
                    value={historyFilters.status}
                    onChange={(e) => setHistoryFilters(prev => ({ ...prev, status: e.target.value }))}
                    displayEmpty
                  >
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="success">Success</MenuItem>
                    <MenuItem value="failed">Failed</MenuItem>
                    <MenuItem value="skipped">Skipped</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <Select
                    value={historyFilters.target_group}
                    onChange={(e) => setHistoryFilters(prev => ({ ...prev, target_group: e.target.value }))}
                    displayEmpty
                  >
                    <MenuItem value="">All Groups</MenuItem>
                    {groups.map(group => (
                      <MenuItem key={group.id} value={group.name}>{group.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  type="datetime-local"
                  label="From Date"
                  value={historyFilters.date_from}
                  onChange={(e) => setHistoryFilters(prev => ({ ...prev, date_from: e.target.value }))}
                  size="small"
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  type="datetime-local"
                  label="To Date"
                  value={historyFilters.date_to}
                  onChange={(e) => setHistoryFilters(prev => ({ ...prev, date_to: e.target.value }))}
                  size="small"
                  fullWidth
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                onClick={() => {
                  setHistoryFilters({
                    digest_type: '',
                    target_group: '',
                    status: '',
                    date_from: '',
                    date_to: ''
                  });
                  setHistoryPage(0);
                }}
                size="small"
              >
                Clear Filters
              </Button>
            </Box>
          </Paper>

          {/* Digest History Table */}
          <Paper sx={{ mb: 3 }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <HistoryIcon sx={{ mr: 1 }} />
                Digest History
              </Typography>
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date/Time</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Target Group</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Details</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {digestHistory.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{formatTime(entry.sent_at)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={entry.digest_type.toUpperCase()} 
                          size="small"
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>{entry.target_group || 'All Groups'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={entry.status.toUpperCase()} 
                          size="small"
                          sx={{ 
                            backgroundColor: getStatusColor(entry.status),
                            color: 'white'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {entry.error_message ? (
                          <Typography variant="body2" color="error">
                            {entry.error_message}
                          </Typography>
                        ) : entry.metadata ? (
                          <Typography variant="body2">
                            {(() => {
                              const metadata = typeof entry.metadata === 'string' ? JSON.parse(entry.metadata) : entry.metadata;
                              return metadata.totalMessages && `${metadata.totalMessages} messages`;
                            })()}
                          </Typography>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {entry.message_content && (
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedMessage(entry);
                              setViewMessageDialog(true);
                            }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              component="div"
              count={historyTotal}
              page={historyPage}
              onPageChange={(e, newPage) => setHistoryPage(newPage)}
              rowsPerPage={historyRowsPerPage}
              onRowsPerPageChange={(e) => {
                setHistoryRowsPerPage(parseInt(e.target.value, 10));
                setHistoryPage(0);
              }}
            />
          </Paper>
        </>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewDialog} onClose={() => setPreviewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              {previewType.charAt(0).toUpperCase() + previewType.slice(1)} Digest Preview
            </Typography>
            <IconButton onClick={() => setPreviewDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : previewData ? (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                This is how the digest will appear in WhatsApp
              </Alert>
              <Paper sx={{ p: 2, backgroundColor: '#e8f5e8', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                {previewData.formattedMessage}
              </Paper>
              
              {previewData.digest && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Digest Data Summary</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ color: BRAND_COLORS.success }}>
                          {previewData.digest.metrics.totalMessages}
                        </Typography>
                        <Typography variant="body2">Total Messages</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ color: BRAND_COLORS.error }}>
                          {previewData.digest.metrics.flaggedMessages}
                        </Typography>
                        <Typography variant="body2">Flagged Issues</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
          ) : (
            <Typography>No preview data available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(false)}>Close</Button>
          <Button 
            variant="contained" 
            onClick={() => setSendDialog(true)}
            startIcon={<SendIcon />}
            sx={{ backgroundColor: BRAND_COLORS.red }}
          >
            Send This Digest
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send Dialog */}
      <Dialog open={sendDialog} onClose={() => setSendDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Digest</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Select WhatsApp groups to send the digest to:
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <Select
              multiple
              value={selectedGroups}
              onChange={(e) => setSelectedGroups(e.target.value)}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              {groups.map((group) => (
                <MenuItem key={group.id} value={group.name}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <GroupIcon sx={{ mr: 1 }} />
                    <Box>
                      <Typography variant="body2">{group.name}</Typography>
                      <Typography variant="caption" sx={{ color: BRAND_COLORS.mediumGray }}>
                        {group.participantCount} members
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {selectedGroups.length === 0 && (
            <Alert severity="info">
              If no groups are selected, the digest will be sent to all WhatsApp groups.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSendDigest}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <WhatsAppIcon />}
            sx={{ backgroundColor: BRAND_COLORS.success }}
          >
            {loading ? 'Sending...' : 'Send via WhatsApp'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Message Dialog */}
      <Dialog open={viewMessageDialog} onClose={() => setViewMessageDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Digest Message</Typography>
            <IconButton onClick={() => setViewMessageDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedMessage && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Sent: {formatTime(selectedMessage.sent_at)}
              </Typography>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Type: {selectedMessage.digest_type} | Group: {selectedMessage.target_group || 'All'}
              </Typography>
              <Paper sx={{ p: 2, backgroundColor: '#e8f5e8', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                {selectedMessage.message_content}
              </Paper>
              {selectedMessage.metadata && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Metadata:</Typography>
                  <Paper sx={{ p: 1, backgroundColor: '#f5f5f5' }}>
                    <pre style={{ fontSize: '0.8rem', margin: 0 }}>
                      {JSON.stringify(
                        typeof selectedMessage.metadata === 'string' 
                          ? JSON.parse(selectedMessage.metadata) 
                          : selectedMessage.metadata, 
                        null, 2
                      )}
                    </pre>
                  </Paper>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewMessageDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Results Dialog */}
      {sendResults && (
        <Dialog open={!!sendResults} onClose={() => setSendResults(null)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {sendResults.error ? <ErrorIcon sx={{ color: BRAND_COLORS.error, mr: 1 }} /> : <CheckCircleIcon sx={{ color: BRAND_COLORS.success, mr: 1 }} />}
              Send Results
            </Box>
          </DialogTitle>
          <DialogContent>
            {sendResults.error ? (
              <Alert severity="error">
                Failed to send digest: {sendResults.error}
              </Alert>
            ) : (
              <Box>
                <Alert severity="success" sx={{ mb: 2 }}>
                  Digest sent successfully!
                </Alert>
                {sendResults.results && (
                  <List>
                    {sendResults.results.map((result, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          {result.status === 'success' ? 
                            <CheckCircleIcon sx={{ color: BRAND_COLORS.success }} /> : 
                            <ErrorIcon sx={{ color: BRAND_COLORS.error }} />}
                        </ListItemIcon>
                        <ListItemText 
                          primary={result.group === 'all' ? 'All Groups' : result.group}
                          secondary={result.status === 'success' ? 'Sent successfully' : result.error}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSendResults(null)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default DigestPage; 