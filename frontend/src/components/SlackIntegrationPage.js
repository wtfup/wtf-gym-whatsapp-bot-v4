import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Switch, FormControlLabel, Button,
  TextField, Select, MenuItem, FormControl, InputLabel, Chip, Alert, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  List, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import TestIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import SlackIcon from '@mui/icons-material/Chat';

const BRAND_COLORS = {
  red: '#E50012',
  green: '#2E7D32',
  darkGray: '#333333',
  mediumGray: '#6B7280',
  lightGray: '#F9FAFB',
  white: '#FFFFFF',
  shadow: 'rgba(0, 0, 0, 0.1)',
  border: 'rgba(0, 0, 0, 0.08)'
};

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  boxShadow: `0 4px 20px ${BRAND_COLORS.shadow}`,
  border: `1px solid ${BRAND_COLORS.border}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 8px 30px ${BRAND_COLORS.shadow}`
  }
}));

const StatusCard = styled(Card)(({ theme, status }) => ({
  borderRadius: 16,
  boxShadow: `0 2px 12px ${BRAND_COLORS.shadow}`,
  border: `2px solid ${status === 'connected' ? BRAND_COLORS.green : BRAND_COLORS.red}`,
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: status === 'connected' ? BRAND_COLORS.green : BRAND_COLORS.red
  }
}));

const SlackIntegrationPage = () => {
  const [slackConnected, setSlackConnected] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState('#general');
  const [alertThreshold, setAlertThreshold] = useState('medium');
  const [testMessage, setTestMessage] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [loading, setLoading] = useState(false);

  const channels = [
    { id: 'C1234567', name: '#general', members: 45 },
    { id: 'C1234568', name: '#alerts', members: 12 },
    { id: 'C1234569', name: '#wtf-gym', members: 23 },
    { id: 'C1234570', name: '#incidents', members: 8 }
  ];

  const alertRules = [
    {
      id: 1,
      name: 'High Priority Issues',
      trigger: 'Flagged message with high severity',
      channel: '#alerts',
      enabled: true,
      frequency: 'immediate',
      conditions: ['severity = high', 'flagged = true']
    },
    {
      id: 2,
      name: 'Equipment Failures',
      trigger: 'Messages containing equipment keywords',
      channel: '#incidents',
      enabled: true,
      frequency: 'immediate',
      conditions: ['keywords = equipment, broken, repair']
    },
    {
      id: 3,
      name: 'Daily Summary',
      trigger: 'Daily digest of all activities',
      channel: '#general',
      enabled: true,
      frequency: 'daily',
      conditions: ['time = 09:00', 'summary = daily']
    }
  ];

  const recentAlerts = [
    {
      id: 1,
      timestamp: '2024-01-15 14:30:00',
      type: 'Equipment Issue',
      message: 'Treadmill #3 reported broken in WTF GYM Indirapuram',
      channel: '#incidents',
      status: 'sent'
    },
    {
      id: 2,
      timestamp: '2024-01-15 13:45:00',
      type: 'High Priority Flag',
      message: 'Complaint about billing issue escalated',
      channel: '#alerts',
      status: 'sent'
    },
    {
      id: 3,
      timestamp: '2024-01-15 12:15:00',
      type: 'Daily Summary',
      message: 'Daily digest: 156 messages, 23 flagged, 21 resolved',
      channel: '#general',
      status: 'sent'
    }
  ];

  const handleTestAlert = async () => {
    if (!testMessage.trim()) return;
    
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert(`Test message sent to ${selectedChannel}: "${testMessage}"`);
      setTestMessage('');
    } catch (error) {
      alert('Failed to send test message');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRule = () => {
    // Save rule logic here
    setModalOpen(false);
    setEditingRule(null);
  };

  const handleDeleteRule = (id) => {
    if (window.confirm('Are you sure you want to delete this alert rule?')) {
      // Delete rule logic here
      console.log('Deleting rule:', id);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return BRAND_COLORS.green;
      case 'failed': return BRAND_COLORS.red;
      case 'pending': return '#FF9800';
      default: return BRAND_COLORS.mediumGray;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: BRAND_COLORS.darkGray, mb: 1 }}>
            Slack Integration
          </Typography>
          <Typography variant="body1" sx={{ color: BRAND_COLORS.mediumGray }}>
            Configure Slack alerts and notifications for WhatsApp monitoring
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => window.location.reload()}
            sx={{ color: BRAND_COLORS.darkGray, borderColor: BRAND_COLORS.border }}
          >
            Refresh
          </Button>
          
          <Button
            variant="contained"
            startIcon={<SettingsIcon />}
            sx={{ backgroundColor: BRAND_COLORS.red }}
          >
            Settings
          </Button>
        </Box>
      </Box>

      {/* Connection Status */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <StatusCard status={slackConnected ? 'connected' : 'disconnected'}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <SlackIcon sx={{ 
                  fontSize: 40, 
                  color: slackConnected ? BRAND_COLORS.green : BRAND_COLORS.red 
                }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: BRAND_COLORS.darkGray }}>
                    Slack Connection
                  </Typography>
                  <Typography variant="body2" sx={{ color: BRAND_COLORS.mediumGray }}>
                    {slackConnected ? 'Connected to WTF Gym Workspace' : 'Disconnected'}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {slackConnected ? (
                  <CheckCircleIcon sx={{ color: BRAND_COLORS.green }} />
                ) : (
                  <ErrorIcon sx={{ color: BRAND_COLORS.red }} />
                )}
                <Typography variant="body2" sx={{ 
                  color: slackConnected ? BRAND_COLORS.green : BRAND_COLORS.red,
                  fontWeight: 600
                }}>
                  {slackConnected ? 'Active & Monitoring' : 'Connection Failed'}
                </Typography>
              </Box>
            </CardContent>
          </StatusCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <StyledCard>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <NotificationsIcon sx={{ fontSize: 40, color: BRAND_COLORS.red }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: BRAND_COLORS.darkGray }}>
                    Alert Status
                  </Typography>
                  <Typography variant="body2" sx={{ color: BRAND_COLORS.mediumGray }}>
                    Real-time notifications enabled
                  </Typography>
                </Box>
              </Box>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={alertsEnabled}
                    onChange={(e) => setAlertsEnabled(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: BRAND_COLORS.green,
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: BRAND_COLORS.green,
                      }
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {alertsEnabled ? 'Alerts Enabled' : 'Alerts Disabled'}
                  </Typography>
                }
              />
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <StyledCard>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: BRAND_COLORS.darkGray }}>
                Test Alert
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel>Channel</InputLabel>
                  <Select
                    value={selectedChannel}
                    onChange={(e) => setSelectedChannel(e.target.value)}
                    label="Channel"
                  >
                    {channels.map(channel => (
                      <MenuItem key={channel.id} value={channel.name}>
                        {channel.name} ({channel.members} members)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <TextField
                  label="Test Message"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Enter test message..."
                  sx={{ flex: 1 }}
                />
                
                <Button
                  variant="contained"
                  startIcon={<TestIcon />}
                  onClick={handleTestAlert}
                  disabled={!testMessage.trim() || loading}
                  sx={{ backgroundColor: BRAND_COLORS.red }}
                >
                  {loading ? 'Sending...' : 'Send Test'}
                </Button>
              </Box>
            </CardContent>
          </StyledCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <StyledCard>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: BRAND_COLORS.darkGray }}>
                Alert Threshold
              </Typography>
              
              <FormControl fullWidth>
                <InputLabel>Severity Level</InputLabel>
                <Select
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(e.target.value)}
                  label="Severity Level"
                >
                  <MenuItem value="low">Low - All messages</MenuItem>
                  <MenuItem value="medium">Medium - Flagged only</MenuItem>
                  <MenuItem value="high">High - Critical only</MenuItem>
                </Select>
              </FormControl>
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>

      {/* Alert Rules */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <StyledCard>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: BRAND_COLORS.darkGray }}>
                  Alert Rules
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setModalOpen(true)}
                  sx={{ backgroundColor: BRAND_COLORS.red }}
                >
                  Add Rule
                </Button>
              </Box>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Rule Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Trigger</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Channel</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Frequency</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {alertRules.map((rule) => (
                      <TableRow key={rule.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {rule.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: BRAND_COLORS.mediumGray }}>
                            {rule.trigger}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={rule.channel}
                            size="small"
                            sx={{ backgroundColor: BRAND_COLORS.lightGray }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {rule.frequency}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={rule.enabled ? 'Enabled' : 'Disabled'}
                            size="small"
                            sx={{
                              backgroundColor: rule.enabled ? BRAND_COLORS.green : BRAND_COLORS.mediumGray,
                              color: BRAND_COLORS.white
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Edit Rule">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setEditingRule(rule);
                                  setModalOpen(true);
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Rule">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteRule(rule.id)}
                                sx={{ color: BRAND_COLORS.red }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>

      {/* Recent Alerts */}
      <StyledCard>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: BRAND_COLORS.darkGray }}>
            Recent Alerts
          </Typography>
          
          <List>
            {recentAlerts.map((alert, index) => (
              <ListItem key={alert.id} divider={index < recentAlerts.length - 1}>
                <ListItemIcon>
                  <Box sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: getStatusColor(alert.status)
                  }} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {alert.type}
                      </Typography>
                      <Chip
                        label={alert.channel}
                        size="small"
                        sx={{ backgroundColor: BRAND_COLORS.lightGray, fontSize: '0.7rem' }}
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" sx={{ color: BRAND_COLORS.mediumGray, mb: 0.5 }}>
                        {alert.message}
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', color: BRAND_COLORS.mediumGray }}>
                        {alert.timestamp}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Chip
                    label={alert.status.toUpperCase()}
                    size="small"
                    sx={{
                      backgroundColor: getStatusColor(alert.status),
                      color: BRAND_COLORS.white,
                      fontSize: '0.7rem'
                    }}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </StyledCard>

      {/* Add/Edit Rule Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingRule ? 'Edit Alert Rule' : 'Add New Alert Rule'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Rule Name"
              defaultValue={editingRule?.name || ''}
              fullWidth
            />
            <TextField
              label="Trigger Description"
              defaultValue={editingRule?.trigger || ''}
              fullWidth
              multiline
              rows={2}
            />
            <FormControl fullWidth>
              <InputLabel>Channel</InputLabel>
              <Select defaultValue={editingRule?.channel || '#general'}>
                {channels.map(channel => (
                  <MenuItem key={channel.id} value={channel.name}>
                    {channel.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Frequency</InputLabel>
              <Select defaultValue={editingRule?.frequency || 'immediate'}>
                <MenuItem value="immediate">Immediate</MenuItem>
                <MenuItem value="hourly">Hourly</MenuItem>
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveRule}
            sx={{ backgroundColor: BRAND_COLORS.red }}
          >
            {editingRule ? 'Update' : 'Create'} Rule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SlackIntegrationPage; 