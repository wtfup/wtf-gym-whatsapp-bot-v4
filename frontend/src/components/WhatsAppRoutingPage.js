import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  IconButton,
  Tabs,
  Tab,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Snackbar,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  WhatsApp as WhatsAppIcon,
  Settings as SettingsIcon,
  Group as GroupIcon,
  Rule as RuleIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ContentCopy as ContentCopyIcon,
  NotificationsActive as NotificationsIcon
} from '@mui/icons-material';
import axios from 'axios';

const WhatsAppRoutingPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [whatsappGroups, setWhatsappGroups] = useState([]);
  const [routingRules, setRoutingRules] = useState([]);
  const [issueCategories, setIssueCategories] = useState([]);
  const [routingLogs, setRoutingLogs] = useState([]);
  const [routingStats, setRoutingStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [serviceStarting, setServiceStarting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(''); // 'group-config' or 'routing-rule'
  const [selectedItem, setSelectedItem] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Routing logs pagination and filters
  const [logsPage, setLogsPage] = useState(1);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPagination, setLogsPagination] = useState({});

  // Form states
  const [groupConfig, setGroupConfig] = useState({
    name: '',
    description: '',
    isActive: true
  });
  const [routingRule, setRoutingRule] = useState({
    categoryId: '',
    whatsappGroupId: '',
    severityFilter: ['low', 'medium', 'high'],
    isActive: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [groupsRes, rulesRes, categoriesRes] = await Promise.all([
        axios.get('/api/whatsapp-groups'),
        axios.get('/api/whatsapp-routing-rules'),
        axios.get('/api/issue-categories')
      ]);

      setWhatsappGroups(groupsRes.data.groups || []);
      setRoutingRules(rulesRes.data.rules || []);
      setIssueCategories(categoriesRes.data.categories || []);
    } catch (error) {
      console.error('Error loading data:', error);
      
      // Provide better error messages based on error type
      if (error.response?.status === 503) {
        if (error.response?.data?.error?.includes('Database not available')) {
          setServiceStarting(true);
          showSnackbar('Database is reconnecting, please wait...', 'warning');
          setTimeout(() => {
            setServiceStarting(false);
            loadData();
          }, 8000);
        } else {
          setServiceStarting(true);
          showSnackbar('WhatsApp service is starting up, please wait...', 'warning');
          setTimeout(() => {
            setServiceStarting(false);
            loadData();
          }, 5000);
        }
      } else if (error.response?.data?.error?.includes('WhatsApp service not connected')) {
        setServiceStarting(true);
        showSnackbar('WhatsApp service is initializing, retrying...', 'info');
        setTimeout(() => {
          setServiceStarting(false);
          loadData();
        }, 3000);
      } else {
        showSnackbar('Failed to load data - check connection', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadRoutingLogs = async (page = 1) => {
    setLogsLoading(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        axios.get(`/api/routing-logs?page=${page}&limit=25`),
        axios.get('/api/routing-stats')
      ]);

      setRoutingLogs(logsRes.data.logs || []);
      setLogsPagination(logsRes.data.pagination || {});
      setRoutingStats(statsRes.data.stats || {});
    } catch (error) {
      console.error('Error loading routing logs:', error);
      showSnackbar('Failed to load routing logs', 'error');
    } finally {
      setLogsLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
    // Load routing logs when logs tab is selected
    if (newValue === 2) {
      loadRoutingLogs();
    }
  };

  const openGroupConfigDialog = (group = null) => {
    setDialogType('group-config');
    setSelectedItem(group);
    setGroupConfig({
      name: group?.name || '',
      description: group?.description || '',
      isActive: group?.isActive || true
    });
    setDialogOpen(true);
  };

  const openRoutingRuleDialog = (rule = null) => {
    setDialogType('routing-rule');
    setSelectedItem(rule);
    setRoutingRule({
      categoryId: rule?.category_id || '',
      whatsappGroupId: rule?.whatsapp_group_id || '',
      severityFilter: rule?.severity_filter || ['low', 'medium', 'high'],
      isActive: rule?.is_active !== undefined ? rule.is_active : true
    });
    setDialogOpen(true);
  };

  const handleSaveGroupConfig = async () => {
    try {
      await axios.post(`/api/whatsapp-groups/${selectedItem.id}/configure`, groupConfig);
      showSnackbar('Group configuration saved successfully');
      setDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error saving group config:', error);
      showSnackbar('Failed to save group configuration', 'error');
    }
  };

  const handleSaveRoutingRule = async () => {
    try {
      if (selectedItem) {
        await axios.put(`/api/whatsapp-routing-rules/${selectedItem.id}`, routingRule);
        showSnackbar('Routing rule updated successfully');
      } else {
        await axios.post('/api/whatsapp-routing-rules', routingRule);
        showSnackbar('Routing rule created successfully');
      }
      setDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error saving routing rule:', error);
      showSnackbar('Failed to save routing rule', 'error');
    }
  };

  const handleDeleteRoutingRule = async (id) => {
    if (window.confirm('Are you sure you want to delete this routing rule?')) {
      try {
        await axios.delete(`/api/whatsapp-routing-rules/${id}`);
        showSnackbar('Routing rule deleted successfully');
        loadData();
      } catch (error) {
        console.error('Error deleting routing rule:', error);
        showSnackbar('Failed to delete routing rule', 'error');
      }
    }
  };

  const handleCopyRule = (rule) => {
    // Pre-populate the form with the rule data (excluding ID)
    setRoutingRule({
      categoryId: rule.category_id,
      whatsappGroupId: '', // Clear group ID so user can select a new one
      severityFilter: [...rule.severity_filter],
      isActive: true
    });
    setSelectedItem(null); // Clear selected item to indicate new rule
    setDialogType('routing-rule');
    setDialogOpen(true);
    showSnackbar('Rule copied! Select a new WhatsApp group to complete.', 'info');
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress sx={{ mb: 2 }} />
        <Typography variant="h6" color="textSecondary">
          {serviceStarting ? '🚀 WhatsApp service is starting...' : 'Loading WhatsApp routing data...'}
        </Typography>
        {serviceStarting && (
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            This may take a moment during initial startup
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          <WhatsAppIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          WhatsApp Group Routing
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadData}
        >
          Refresh
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="WhatsApp Groups" icon={<GroupIcon />} />
          <Tab label="Routing Rules" icon={<RuleIcon />} />
          <Tab label="Routing Logs" icon={<NotificationsIcon />} />
        </Tabs>
      </Box>

      {/* WhatsApp Groups Tab */}
      {activeTab === 0 && (
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            Configure which WhatsApp groups can receive automated notifications. 
            Groups must be configured before they can be used in routing rules.
          </Alert>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Group Name</TableCell>
                  <TableCell>Participants</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {whatsappGroups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <GroupIcon sx={{ mr: 1, color: 'primary.main' }} />
                        {group.name}
                      </Box>
                    </TableCell>
                    <TableCell>{group.participantCount}</TableCell>
                    <TableCell>
                      <Chip
                        label={group.isConfigured ? (group.isActive ? 'Active' : 'Inactive') : 'Not Configured'}
                        color={group.isConfigured ? (group.isActive ? 'success' : 'default') : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{group.description || '-'}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        startIcon={<SettingsIcon />}
                        onClick={() => openGroupConfigDialog(group)}
                      >
                        Configure
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Routing Rules Tab */}
      {activeTab === 1 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Alert severity="info" sx={{ flexGrow: 1, mr: 2 }}>
              Create rules to automatically forward flagged messages to specific WhatsApp groups based on issue category and severity.
            </Alert>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => openRoutingRuleDialog()}
            >
              Add Rule
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Category</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>WhatsApp Group</TableCell>
                  <TableCell>Severity Filter</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {routingRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <Chip
                        label={rule.category_name}
                        style={{ backgroundColor: rule.color_code, color: 'white' }}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{rule.department}</TableCell>
                    <TableCell>
                      <Box display="flex" flexDirection="column" gap={0.5}>
                        <Box display="flex" alignItems="center">
                          <WhatsAppIcon sx={{ mr: 1, color: 'success.main' }} />
                          <Typography variant="body2" fontWeight={500}>
                            {rule.group_name}
                          </Typography>
                        </Box>
                        {rule.group_status && (
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <Box 
                              width={8} 
                              height={8} 
                              borderRadius="50%" 
                              bgcolor={rule.group_status.botInGroup ? '#4CAF50' : '#F44336'}
                            />
                            <Typography variant="caption" color={rule.group_status.botInGroup ? 'success.main' : 'error.main'}>
                              {rule.group_status.botInGroup ? 'Bot in group' : 'Bot not in group'}
                            </Typography>
                            {rule.group_status.participantCount > 0 && (
                              <Typography variant="caption" color="text.secondary">
                                ({rule.group_status.participantCount} members)
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5}>
                        {rule.severity_filter.map((severity) => (
                          <Chip
                            key={severity}
                            label={severity}
                            color={getSeverityColor(severity)}
                            size="small"
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" flexDirection="column" gap={0.5}>
                        <Chip
                          label={rule.is_active ? 'Active' : 'Inactive'}
                          color={rule.is_active ? 'success' : 'default'}
                          size="small"
                        />
                        {rule.group_status && !rule.group_status.botInGroup && rule.is_active && (
                          <Chip
                            label="DISABLED - Bot not in group"
                            color="error"
                            size="small"
                            variant="filled"
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit rule">
                        <IconButton
                          size="small"
                          onClick={() => openRoutingRuleDialog(rule)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Copy rule">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleCopyRule(rule)}
                        >
                          <ContentCopyIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete rule">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteRoutingRule(rule.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Routing Logs Tab */}
      {activeTab === 2 && (
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            View all routing activities - track which messages were routed to which groups and their success status.
          </Alert>

          {/* Routing Stats */}
          {routingStats.overview && (
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="primary">
                      {routingStats.overview.total_routed || 0}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total Routed (7 days)
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="success.main">
                      {routingStats.overview.successful_routes || 0}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Successful Routes
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="error.main">
                      {routingStats.overview.failed_routes || 0}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Failed Routes
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="warning.main">
                      {Math.round(routingStats.overview.success_rate || 0)}%
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Success Rate
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Routing Logs Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell>Message</TableCell>
                  <TableCell>Sender</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>WhatsApp Group</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>AI Analysis</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logsLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : routingLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="textSecondary">
                        No routing logs found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  routingLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(log.routed_at).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200 }}>
                          {log.message ? log.message.substring(0, 50) + '...' : 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {log.sender_name} ({log.group_name || 'DM'})
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {log.sender_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {log.category_name ? (
                          <Chip
                            label={log.category_name}
                            size="small"
                            style={{ backgroundColor: log.color_code, color: 'white' }}
                          />
                        ) : (
                          <Typography variant="body2" color="textSecondary">N/A</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <WhatsAppIcon sx={{ mr: 1, color: 'success.main' }} />
                          <Typography variant="body2">
                            {log.whatsapp_group_name || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.severity}
                          color={getSeverityColor(log.severity)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          {log.sentiment && (
                            <Chip
                              label={`${log.sentiment}`}
                              size="small"
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          )}
                          {log.intent && (
                            <Chip
                              label={`${log.intent}`}
                              size="small"
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          {log.success ? (
                            <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                          ) : (
                            <CancelIcon color="error" sx={{ mr: 1 }} />
                          )}
                          <Typography variant="body2">
                            {log.success ? 'Success' : 'Failed'}
                          </Typography>
                        </Box>
                        {log.error_message && (
                          <Typography variant="caption" color="error">
                            {log.error_message}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {logsPagination.pages > 1 && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Button
                disabled={logsPage === 1}
                onClick={() => {
                  setLogsPage(logsPage - 1);
                  loadRoutingLogs(logsPage - 1);
                }}
              >
                Previous
              </Button>
              <Typography variant="body2" sx={{ mx: 2, alignSelf: 'center' }}>
                Page {logsPage} of {logsPagination.pages}
              </Typography>
              <Button
                disabled={logsPage === logsPagination.pages}
                onClick={() => {
                  setLogsPage(logsPage + 1);
                  loadRoutingLogs(logsPage + 1);
                }}
              >
                Next
              </Button>
            </Box>
          )}
        </Box>
      )}

      {/* Group Configuration Dialog */}
      <Dialog open={dialogOpen && dialogType === 'group-config'} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Configure WhatsApp Group</DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <TextField
              fullWidth
              label="Group Name"
              value={groupConfig.name}
              onChange={(e) => setGroupConfig({ ...groupConfig, name: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Description"
              value={groupConfig.description}
              onChange={(e) => setGroupConfig({ ...groupConfig, description: e.target.value })}
              margin="normal"
              multiline
              rows={3}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={groupConfig.isActive}
                  onChange={(e) => setGroupConfig({ ...groupConfig, isActive: e.target.checked })}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveGroupConfig} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Routing Rule Dialog */}
      <Dialog open={dialogOpen && dialogType === 'routing-rule'} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedItem ? 'Edit Routing Rule' : 'Create Routing Rule'}</DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Issue Category</InputLabel>
              <Select
                value={routingRule.categoryId}
                onChange={(e) => setRoutingRule({ ...routingRule, categoryId: e.target.value })}
              >
                {issueCategories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.category_name} ({category.department})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>WhatsApp Group</InputLabel>
              <Select
                value={routingRule.whatsappGroupId}
                onChange={(e) => setRoutingRule({ ...routingRule, whatsappGroupId: e.target.value })}
              >
                {whatsappGroups.map((group) => (
                  <MenuItem key={group.id} value={group.id}>
                    {group.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Severity Filter</InputLabel>
              <Select
                multiple
                value={routingRule.severityFilter}
                onChange={(e) => setRoutingRule({ ...routingRule, severityFilter: e.target.value })}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} color={getSeverityColor(value)} size="small" />
                    ))}
                  </Box>
                )}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={routingRule.isActive}
                  onChange={(e) => setRoutingRule({ ...routingRule, isActive: e.target.checked })}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveRoutingRule} variant="contained">
            {selectedItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default WhatsAppRoutingPage; 