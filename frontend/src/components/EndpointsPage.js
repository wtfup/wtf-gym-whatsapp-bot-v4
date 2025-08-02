import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Button, Chip, 
  Alert, CircularProgress, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, IconButton, Tooltip, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, FormControl, Select, MenuItem,
  InputLabel, Accordion, AccordionSummary, AccordionDetails, Divider,
  List, ListItem, ListItemText, ListItemIcon, Badge, Switch, FormControlLabel,
  Collapse, Tab, Tabs
} from '@mui/material';
import {
  Api as ApiIcon, Computer as ComputerIcon, Cloud as CloudIcon,
  ContentCopy as CopyIcon, OpenInNew as OpenIcon, Refresh as RefreshIcon,
  CheckCircle as CheckIcon, Error as ErrorIcon, Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon, Code as CodeIcon, Settings as SettingsIcon,
  Storage as StorageIcon, Analytics as AnalyticsIcon, Group as GroupIcon,
  Security as SecurityIcon, Message as MessageIcon, Notifications as NotificationIcon,
  Info as InfoIcon, PlayArrow as PlayIcon, Description as DescriptionIcon,
  Help as HelpIcon, Timeline as TimelineIcon
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
  error: '#ef4444',
  blue: '#2563eb',
  green: '#059669'
};

const EndpointsPage = () => {
  const [endpointData, setEndpointData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testingEndpoint, setTestingEndpoint] = useState(null);
  const [testResults, setTestResults] = useState({});
  const [selectedEnvironment, setSelectedEnvironment] = useState('current');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchEndpointsData();
  }, []);

  const fetchEndpointsData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/endpoints');
      setEndpointData(response.data);
      
      // Auto-expand all categories by default
      const categories = Object.keys(response.data.endpoints || {});
      const expanded = {};
      categories.forEach(cat => expanded[cat] = true);
      setExpandedCategories(expanded);
    } catch (error) {
      console.error('Failed to fetch endpoints data:', error);
    } finally {
      setLoading(false);
    }
  };

  const testEndpoint = async (endpoint, method = 'GET') => {
    const endpointKey = `${method} ${endpoint.path}`;
    setTestingEndpoint(endpointKey);
    
    try {
      let response;
      if (method === 'GET') {
        response = await axios.get(endpoint.path, { timeout: 10000 });
      } else if (method === 'POST') {
        response = await axios.post(endpoint.path, {}, { timeout: 10000 });
      }
      
      setTestResults(prev => ({
        ...prev,
        [endpointKey]: {
          status: 'success',
          statusCode: response.status,
          message: 'Endpoint working correctly',
          timestamp: new Date().toISOString()
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [endpointKey]: {
          status: 'error',
          statusCode: error.response?.status || 0,
          message: error.message,
          timestamp: new Date().toISOString()
        }
      }));
    } finally {
      setTestingEndpoint(null);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getBaseUrl = () => {
    if (selectedEnvironment === 'production') {
      return endpointData?.production || 'https://wtf-whatsapp-bot.fly.dev';
    } else if (selectedEnvironment === 'development') {
      return endpointData?.development || 'https://wtf-whatsapp-bot-dev.fly.dev';
    }
    return window.location.origin; // Current environment
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Health & Status': <SettingsIcon />,
      'Messages & Logs': <MessageIcon />,
      'WhatsApp Integration': <GroupIcon />,
      'AI & Machine Learning': <AnalyticsIcon />,
      'Analytics & Reporting': <TimelineIcon />,
      'Digest & Notifications': <NotificationIcon />,
      'Issue Categories & Keywords': <CodeIcon />,
      'Slack Integration': <NotificationIcon />,
      'User Interaction Tracking': <AnalyticsIcon />,
      'System Utilities': <StorageIcon />
    };
    return icons[category] || <ApiIcon />;
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Health & Status': BRAND_COLORS.green,
      'Messages & Logs': BRAND_COLORS.blue,
      'WhatsApp Integration': BRAND_COLORS.success,
      'AI & Machine Learning': BRAND_COLORS.red,
      'Analytics & Reporting': BRAND_COLORS.warning,
      'Digest & Notifications': BRAND_COLORS.warning,
      'Issue Categories & Keywords': BRAND_COLORS.darkGray,
      'Slack Integration': BRAND_COLORS.green,
      'User Interaction Tracking': BRAND_COLORS.blue,
      'System Utilities': BRAND_COLORS.mediumGray
    };
    return colors[category] || BRAND_COLORS.blue;
  };

  const getStatusIcon = (endpointKey) => {
    const result = testResults[endpointKey];
    if (!result) return null;
    
    if (result.status === 'success') {
      return <CheckIcon sx={{ color: BRAND_COLORS.success, fontSize: 20 }} />;
    } else {
      return <ErrorIcon sx={{ color: BRAND_COLORS.error, fontSize: 20 }} />;
    }
  };

  const handleEndpointDetails = (endpoint) => {
    setSelectedEndpoint(endpoint);
    setDetailsOpen(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={40} sx={{ color: BRAND_COLORS.red }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: BRAND_COLORS.darkGray, mb: 1 }}>
            API Endpoints Documentation
          </Typography>
          <Typography variant="body1" sx={{ color: BRAND_COLORS.mediumGray }}>
            Complete list of available API endpoints with detailed descriptions, parameters, and usage examples.
            Click on any endpoint to view detailed information about how to use it effectively.
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Environment</InputLabel>
            <Select 
              value={selectedEnvironment} 
              onChange={(e) => setSelectedEnvironment(e.target.value)}
            >
              <MenuItem value="current">Current ({window.location.origin})</MenuItem>
              <MenuItem value="development">Development</MenuItem>
              <MenuItem value="production">Production</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchEndpointsData}
            sx={{ color: BRAND_COLORS.darkGray, borderColor: BRAND_COLORS.border }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Environment Info */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, border: `1px solid ${BRAND_COLORS.border}` }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <ComputerIcon sx={{ color: BRAND_COLORS.blue }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Development
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: BRAND_COLORS.mediumGray, mb: 2 }}>
                {endpointData?.development}
              </Typography>
              <Button 
                size="small" 
                startIcon={<OpenIcon />}
                onClick={() => window.open(endpointData?.development, '_blank')}
              >
                Open
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, border: `1px solid ${BRAND_COLORS.border}` }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <CloudIcon sx={{ color: BRAND_COLORS.green }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Production
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: BRAND_COLORS.mediumGray, mb: 2 }}>
                {endpointData?.production}
              </Typography>
              <Button 
                size="small" 
                startIcon={<OpenIcon />}
                onClick={() => window.open(endpointData?.production, '_blank')}
              >
                Open
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, border: `1px solid ${BRAND_COLORS.border}` }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <ApiIcon sx={{ color: BRAND_COLORS.red }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Current Environment
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: BRAND_COLORS.mediumGray, mb: 2 }}>
                {window.location.origin}
              </Typography>
              <Chip 
                label={window.location.hostname.includes('dev') ? 'Development' : 'Production'}
                size="small"
                sx={{ 
                  backgroundColor: window.location.hostname.includes('dev') ? BRAND_COLORS.blue : BRAND_COLORS.green,
                  color: 'white'
                }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Endpoints by Category */}
      <Box>
        {endpointData?.endpoints && Object.entries(endpointData.endpoints).map(([category, endpoints]) => (
          <Accordion
            key={category}
            expanded={expandedCategories[category] || false}
            onChange={() => setExpandedCategories(prev => ({
              ...prev,
              [category]: !prev[category]
            }))}
            sx={{ 
              mb: 2, 
              borderRadius: 2, 
              border: `1px solid ${BRAND_COLORS.border}`,
              '&:before': { display: 'none' }
            }}
          >
            <AccordionSummary 
              expandIcon={<ExpandMoreIcon />}
              sx={{ 
                backgroundColor: BRAND_COLORS.lightGray,
                borderRadius: '8px 8px 0 0'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ color: getCategoryColor(category) }}>
                  {getCategoryIcon(category)}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {category}
                </Typography>
                <Badge 
                  badgeContent={endpoints.length} 
                  color="primary"
                  sx={{ ml: 1 }}
                />
              </Box>
            </AccordionSummary>
            
            <AccordionDetails sx={{ p: 0 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Method</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Endpoint</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {endpoints.map((endpoint, index) => {
                      const fullUrl = `${getBaseUrl()}${endpoint.path}`;
                      const endpointKey = `${endpoint.method} ${endpoint.path}`;
                      
                      return (
                        <TableRow key={index} hover>
                          <TableCell>
                            <Chip 
                              label={endpoint.method}
                              size="small"
                              sx={{
                                backgroundColor: endpoint.method === 'GET' ? BRAND_COLORS.success : 
                                               endpoint.method === 'POST' ? BRAND_COLORS.warning : 
                                               endpoint.method === 'PUT' ? BRAND_COLORS.blue : BRAND_COLORS.error,
                                color: 'white',
                                minWidth: 50
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                              {endpoint.path}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {endpoint.title}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ maxWidth: 300 }}>
                            <Typography variant="body2" sx={{ color: BRAND_COLORS.mediumGray }}>
                              {endpoint.description.length > 100 
                                ? `${endpoint.description.substring(0, 100)}...` 
                                : endpoint.description}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="View Details">
                                <IconButton 
                                  size="small"
                                  onClick={() => handleEndpointDetails(endpoint)}
                                >
                                  <InfoIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Copy URL">
                                <IconButton 
                                  size="small"
                                  onClick={() => copyToClipboard(fullUrl)}
                                >
                                  <CopyIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Test Endpoint">
                                <IconButton 
                                  size="small"
                                  onClick={() => testEndpoint(endpoint, endpoint.method)}
                                  disabled={testingEndpoint === endpointKey}
                                >
                                  {testingEndpoint === endpointKey ? (
                                    <CircularProgress size={16} />
                                  ) : (
                                    <PlayIcon fontSize="small" />
                                  )}
                                </IconButton>
                              </Tooltip>
                              
                              {endpoint.method === 'GET' && (
                                <Tooltip title="Open in New Tab">
                                  <IconButton 
                                    size="small"
                                    onClick={() => window.open(fullUrl, '_blank')}
                                  >
                                    <OpenIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            {getStatusIcon(endpointKey)}
                            {testResults[endpointKey] && (
                              <Typography variant="caption" sx={{ ml: 1, color: BRAND_COLORS.mediumGray }}>
                                {testResults[endpointKey].statusCode}
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      {/* Quick Test All Button */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button 
          variant="contained"
          size="large"
          startIcon={<ApiIcon />}
          onClick={() => {
            // Test all GET endpoints
            Object.entries(endpointData?.endpoints || {}).forEach(([category, endpoints]) => {
              endpoints.forEach(endpoint => {
                if (endpoint.method === 'GET') {
                  setTimeout(() => testEndpoint(endpoint, endpoint.method), Math.random() * 2000);
                }
              });
            });
          }}
          sx={{ 
            backgroundColor: BRAND_COLORS.red,
            '&:hover': { backgroundColor: BRAND_COLORS.darkRed }
          }}
        >
          Test All GET Endpoints
        </Button>
      </Box>

      {/* Endpoint Details Dialog */}
      <Dialog 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip 
              label={selectedEndpoint?.method}
              size="small"
              sx={{
                backgroundColor: selectedEndpoint?.method === 'GET' ? BRAND_COLORS.success : 
                               selectedEndpoint?.method === 'POST' ? BRAND_COLORS.warning : 
                               selectedEndpoint?.method === 'PUT' ? BRAND_COLORS.blue : BRAND_COLORS.error,
                color: 'white'
              }}
            />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {selectedEndpoint?.title}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedEndpoint && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500, mb: 3, p: 2, backgroundColor: BRAND_COLORS.lightGray, borderRadius: 1 }}>
                {selectedEndpoint.method} {selectedEndpoint.path}
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: BRAND_COLORS.darkGray }}>
                  Description
                </Typography>
                <Typography variant="body2" sx={{ color: BRAND_COLORS.mediumGray, lineHeight: 1.6 }}>
                  {selectedEndpoint.description}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: BRAND_COLORS.darkGray }}>
                  Parameters
                </Typography>
                <Typography variant="body2" sx={{ color: BRAND_COLORS.mediumGray, fontFamily: 'monospace' }}>
                  {selectedEndpoint.parameters}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: BRAND_COLORS.darkGray }}>
                  Returns
                </Typography>
                <Typography variant="body2" sx={{ color: BRAND_COLORS.mediumGray }}>
                  {selectedEndpoint.returns}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: BRAND_COLORS.darkGray }}>
                  Usage & Applications
                </Typography>
                <Typography variant="body2" sx={{ color: BRAND_COLORS.mediumGray, lineHeight: 1.6 }}>
                  {selectedEndpoint.usage}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: BRAND_COLORS.darkGray }}>
                  Example Usage
                </Typography>
                <Box sx={{ p: 2, backgroundColor: BRAND_COLORS.lightGray, borderRadius: 1, fontFamily: 'monospace' }}>
                  {selectedEndpoint.method === 'GET' ? (
                    <>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        cURL Example:
                      </Typography>
                      <Typography variant="body2" sx={{ color: BRAND_COLORS.darkGray, mb: 2 }}>
                        curl -X GET "{getBaseUrl()}{selectedEndpoint.path}"
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        JavaScript (fetch):
                      </Typography>
                      <Typography variant="body2" sx={{ color: BRAND_COLORS.darkGray }}>
                        {`const response = await fetch('${selectedEndpoint.path}');\nconst data = await response.json();`}
                      </Typography>
                    </>
                  ) : selectedEndpoint.method === 'POST' ? (
                    <>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        cURL Example:
                      </Typography>
                      <Typography variant="body2" sx={{ color: BRAND_COLORS.darkGray, mb: 2 }}>
                        {`curl -X POST "${getBaseUrl()}${selectedEndpoint.path}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"key": "value"}'`}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        JavaScript (axios):
                      </Typography>
                      <Typography variant="body2" sx={{ color: BRAND_COLORS.darkGray }}>
                        {`const response = await axios.post('${selectedEndpoint.path}', {\n  // request body data\n});`}
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        cURL Example:
                      </Typography>
                      <Typography variant="body2" sx={{ color: BRAND_COLORS.darkGray }}>
                        curl -X {selectedEndpoint.method} "{getBaseUrl()}{selectedEndpoint.path}"
                      </Typography>
                    </>
                  )}
                </Box>
              </Box>

              <Box sx={{ p: 2, backgroundColor: BRAND_COLORS.lightGray, borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Full URL:
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', color: BRAND_COLORS.blue }}>
                  {getBaseUrl()}{selectedEndpoint.path}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>
            Close
          </Button>
          {selectedEndpoint && (
            <Button
              variant="contained"
              startIcon={<CopyIcon />}
              onClick={() => copyToClipboard(`${getBaseUrl()}${selectedEndpoint.path}`)}
              sx={{ 
                backgroundColor: BRAND_COLORS.red,
                '&:hover': { backgroundColor: BRAND_COLORS.darkRed }
              }}
            >
              Copy URL
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EndpointsPage; 