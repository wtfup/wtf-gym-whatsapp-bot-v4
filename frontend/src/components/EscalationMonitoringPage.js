import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  AlertTitle,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Badge,
  Tab,
  Tabs
} from '@mui/material';
import {
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Message as MessageIcon,
  Timeline as TimelineIcon,
  Security as SecurityIcon,
  NotificationImportant as NotificationIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';

// Brand colors for consistency
const BRAND_COLORS = {
  primary: '#1976d2',
  secondary: '#dc004e',
  success: '#2e7d32',
  warning: '#ed6c02',
  error: '#d32f2f',
  info: '#0288d1'
};

const ESCALATION_COLORS = {
  CRITICAL: BRAND_COLORS.error,
  HIGH: BRAND_COLORS.secondary,
  MEDIUM: BRAND_COLORS.warning,
  LOW: BRAND_COLORS.info
};

const EscalationMonitoringPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [escalationData, setEscalationData] = useState({});
  const [criticalAlerts, setCriticalAlerts] = useState([]);
  const [senderTrends, setSenderTrends] = useState([]);
  const [departmentBreakdown, setDepartmentBreakdown] = useState([]);
  const [timeframe, setTimeframe] = useState('7');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [alertDialog, setAlertDialog] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadEscalationData();
    
    // Auto-refresh every 30 seconds
    let interval;
    if (autoRefresh) {
      interval = setInterval(loadEscalationData, 30000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timeframe, autoRefresh]);

  const loadEscalationData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/escalation-monitor?timeframe=${timeframe}`);
      const data = await response.json();
      
      setEscalationData(data.escalation_overview || {});
      setCriticalAlerts(data.critical_escalations || []);
      setSenderTrends(data.sender_escalation_trends || []);
      setDepartmentBreakdown(data.department_escalations || []);
    } catch (error) {
      console.error('Failed to load escalation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'CRITICAL': return BRAND_COLORS.error;
      case 'HIGH': return BRAND_COLORS.secondary;
      case 'MEDIUM': return BRAND_COLORS.warning;
      case 'LOW': return BRAND_COLORS.info;
      default: return BRAND_COLORS.info;
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const handleAlertClick = (alert) => {
    setSelectedAlert(alert);
    setAlertDialog(true);
  };

  // Escalation Overview Tab
  const EscalationOverviewTab = () => (
    <Grid container spacing={3}>
      {/* Key Metrics Cards */}
      <Grid item xs={12} md={3}>
        <Card elevation={3} sx={{ bgcolor: BRAND_COLORS.error, color: 'white' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Critical Escalations
            </Typography>
            <Typography variant="h3" fontWeight="bold">
              {escalationData.critical_escalations || 0}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Requiring immediate attention
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card elevation={3} sx={{ bgcolor: BRAND_COLORS.warning, color: 'white' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Escalation Rate
            </Typography>
            <Typography variant="h3" fontWeight="bold">
              {escalationData.escalation_rate?.toFixed(1) || '0.0'}%
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Of total messages
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card elevation={3} sx={{ bgcolor: BRAND_COLORS.secondary, color: 'white' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <PeopleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Affected Customers
            </Typography>
            <Typography variant="h3" fontWeight="bold">
              {escalationData.unique_senders || 0}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Escalated messages
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card elevation={3} sx={{ bgcolor: BRAND_COLORS.info, color: 'white' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <MessageIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Total Messages
            </Typography>
            <Typography variant="h3" fontWeight="bold">
              {escalationData.total_messages || 0}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              In {timeframe} days
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Escalation Trends Chart */}
      <Grid item xs={12} md={8}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <TimelineIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Escalation Trends Over Time
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={escalationData.daily_trends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip />
                <Area 
                  type="monotone" 
                  dataKey="escalations" 
                  stroke={BRAND_COLORS.error} 
                  fill={BRAND_COLORS.error}
                  fillOpacity={0.3}
                />
                <Area 
                  type="monotone" 
                  dataKey="total_messages" 
                  stroke={BRAND_COLORS.info} 
                  fill={BRAND_COLORS.info}
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Department Breakdown */}
      <Grid item xs={12} md={4}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Department Breakdown
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={departmentBreakdown}
                  dataKey="_count.advanced_category"
                  nameKey="advanced_category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ advanced_category, value }) => `${advanced_category}: ${value}`}
                >
                  {departmentBreakdown.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={Object.values(ESCALATION_COLORS)[index % Object.values(ESCALATION_COLORS).length]} 
                    />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Critical Alerts Tab
  const CriticalAlertsTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Critical Escalation Alerts
        </Typography>
        <Badge badgeContent={criticalAlerts.length} color="error">
          <NotificationIcon />
        </Badge>
      </Box>

      {criticalAlerts.length > 0 ? (
        <TableContainer component={Paper} elevation={3}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Message Preview</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Risk Score</TableCell>
                <TableCell>Repetitions</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {criticalAlerts.map((alert) => (
                <TableRow 
                  key={alert.id}
                  sx={{ 
                    bgcolor: alert.escalation_score >= 0.9 ? 'error.light' : 
                             alert.escalation_score >= 0.8 ? 'warning.light' : 'transparent',
                    opacity: alert.escalation_score >= 0.8 ? 0.9 : 1
                  }}
                >
                  <TableCell>
                    <Typography variant="body2">
                      {formatTimestamp(alert.timestamp)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 1, width: 32, height: 32 }}>
                        <PersonIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {alert.fromName || 'Unknown'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {alert.fromNumber}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        maxWidth: 200, 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {alert.body}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={alert.advanced_category}
                      color={
                        alert.advanced_category === 'URGENT' ? 'error' :
                        alert.advanced_category === 'ESCALATION' ? 'warning' :
                        alert.advanced_category === 'COMPLAINT' ? 'warning' : 'default'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={alert.escalation_score * 100}
                        color={
                          alert.escalation_score >= 0.9 ? 'error' :
                          alert.escalation_score >= 0.7 ? 'warning' : 'info'
                        }
                        sx={{ width: 50, mr: 1 }}
                      />
                      <Typography variant="body2" fontWeight="bold">
                        {(alert.escalation_score * 100).toFixed(0)}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {alert.repetition_count > 0 && (
                      <Chip 
                        label={`${alert.repetition_count}x`}
                        color="error"
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton 
                        size="small"
                        onClick={() => handleAlertClick(alert)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Alert severity="success">
          <AlertTitle>No Critical Escalations</AlertTitle>
          All customer interactions are within normal parameters. Great job!
        </Alert>
      )}
    </Box>
  );

  // Sender Risk Analysis Tab
  const SenderRiskAnalysisTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        <PeopleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        High-Risk Customer Analysis
      </Typography>
      
      {senderTrends.length > 0 ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Customer Risk Scores
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={senderTrends.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="sender_name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <RechartsTooltip 
                      formatter={(value) => [`${(value * 100).toFixed(1)}%`, 'Avg Risk Score']}
                    />
                    <Bar 
                      dataKey="_avg.escalation_score" 
                      fill={BRAND_COLORS.warning}
                      name="Average Risk Score"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top Risk Customers
                </Typography>
                <List>
                  {senderTrends.slice(0, 8).map((sender, index) => (
                    <ListItem key={sender.fromNumber} divider={index < 7}>
                      <ListItemAvatar>
                        <Avatar 
                          sx={{ 
                            bgcolor: getRiskColor(sender.risk_level),
                            width: 32, 
                            height: 32 
                          }}
                        >
                          {index + 1}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={sender.sender_name || 'Unknown'}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              Risk: {(sender._avg.escalation_score * 100).toFixed(1)}%
                            </Typography>
                            <Typography variant="caption" display="block">
                              Messages: {sender._count.fromNumber}
                            </Typography>
                            <Chip 
                              label={sender.risk_level}
                              size="small"
                              color={
                                sender.risk_level === 'CRITICAL' ? 'error' :
                                sender.risk_level === 'HIGH' ? 'warning' : 'default'
                              }
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        <Alert severity="info">
          <AlertTitle>No High-Risk Patterns</AlertTitle>
          No customers showing concerning escalation patterns in the selected timeframe.
        </Alert>
      )}
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          <SecurityIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Escalation Monitoring Dashboard
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small">
            <InputLabel>Timeframe</InputLabel>
            <Select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              label="Timeframe"
            >
              <MenuItem value="1">Last 24 Hours</MenuItem>
              <MenuItem value="3">Last 3 Days</MenuItem>
              <MenuItem value="7">Last Week</MenuItem>
              <MenuItem value="14">Last 2 Weeks</MenuItem>
              <MenuItem value="30">Last Month</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadEscalationData}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Real-time Status */}
      <Alert 
        severity={criticalAlerts.length > 5 ? 'error' : criticalAlerts.length > 0 ? 'warning' : 'success'}
        sx={{ mb: 3 }}
      >
        <AlertTitle>
          <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Real-time Status
        </AlertTitle>
        {criticalAlerts.length > 5 ? 
          `🚨 HIGH ALERT: ${criticalAlerts.length} critical escalations require immediate attention!` :
          criticalAlerts.length > 0 ?
          `⚠️ ${criticalAlerts.length} escalation(s) detected. Monitor closely.` :
          '✅ All systems normal. No critical escalations detected.'
        }
        {autoRefresh && (
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Auto-refreshing every 30 seconds
          </Typography>
        )}
      </Alert>

      {/* Loading */}
      {loading && <LinearProgress sx={{ mb: 3 }} />}

      {/* Main Content */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Overview" />
          <Tab 
            label={
              <Badge badgeContent={criticalAlerts.length} color="error">
                Critical Alerts
              </Badge>
            } 
          />
          <Tab label="Risk Analysis" />
        </Tabs>
      </Box>

      {activeTab === 0 && <EscalationOverviewTab />}
      {activeTab === 1 && <CriticalAlertsTab />}
      {activeTab === 2 && <SenderRiskAnalysisTab />}

      {/* Alert Detail Dialog */}
      <Dialog open={alertDialog} onClose={() => setAlertDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Critical Escalation Details
        </DialogTitle>
        <DialogContent>
          {selectedAlert && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Customer Information</Typography>
                <Typography variant="body1">{selectedAlert.fromName || 'Unknown'}</Typography>
                <Typography variant="body2" color="text.secondary">{selectedAlert.fromNumber}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Risk Assessment</Typography>
                <Chip 
                  label={`${(selectedAlert.escalation_score * 100).toFixed(0)}% Risk Score`}
                  color="error"
                  variant="filled"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>Message Content</Typography>
                <Paper elevation={1} sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body1">{selectedAlert.body}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Category</Typography>
                <Chip label={selectedAlert.advanced_category} color="warning" />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Timestamp</Typography>
                <Typography variant="body1">{formatTimestamp(selectedAlert.timestamp)}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlertDialog(false)}>Close</Button>
          <Button variant="contained" color="primary">
            Take Action
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EscalationMonitoringPage;