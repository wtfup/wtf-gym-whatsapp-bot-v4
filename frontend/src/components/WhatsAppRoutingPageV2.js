import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  Grid,
  Divider,
  LinearProgress,
  Badge
} from '@mui/material';

import {
  WhatsApp as WhatsAppIcon,
  Settings as SettingsIcon,
  Rule as RuleIcon,
  Group as GroupIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Close as CloseIcon
} from '@mui/icons-material';

import axios from 'axios';
import { useWhatsAppData } from '../hooks/useWhatsAppData';

// 🎨 Modern styling constants
const COLORS = {
  primary: '#1976d2',
  success: '#2e7d32',
  warning: '#ed6c02',
  error: '#d32f2f',
  info: '#0288d1',
  background: '#f5f5f5',
  surface: '#ffffff',
  text: '#333333'
};

const WhatsAppRoutingPageV2 = () => {
  // 🌐 WhatsApp Data Hook
  const { 
    groups: whatsappGroups, 
    isLoading: dataLoading, 
    isConnected, 
    lastUpdate,
    forceRefresh: refreshWhatsAppData,
    stats,
    error: dataError
  } = useWhatsAppData();

  // 📊 State Management
  const [activeTab, setActiveTab] = useState(0);
  const [routingRules, setRoutingRules] = useState([]);
  const [issueCategories, setIssueCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // 🎛️ Dialog States
  const [groupDialog, setGroupDialog] = useState({
    open: false,
    group: null,
    data: { name: '', department: 'UNASSIGNED', isActive: false, priority: 5 }
  });

  const [ruleDialog, setRuleDialog] = useState({
    open: false,
    rule: null,
    data: { categoryId: '', groupId: '', severityFilter: ['low', 'medium', 'high'], isActive: true }
  });

  // 🚀 Initial Data Loading
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      console.log('🔄 V2: Loading routing rules and categories...');
      const [rulesRes, categoriesRes] = await Promise.all([
        axios.get('/api/whatsapp-routing-rules'),
        axios.get('/api/issue-categories')
      ]);

      const rules = rulesRes.data.rules || [];
      const categories = Array.isArray(categoriesRes.data) ? categoriesRes.data : categoriesRes.data.categories || [];
      
      console.log('📊 V2: Loaded data:', {
        rules: rules.length,
        categories: categories.length,
        rulesData: rules
      });
      
      setRoutingRules(rules);
      setIssueCategories(categories);
      
      console.log('✅ V2: Data loaded successfully');
    } catch (error) {
      console.error('❌ V2: Failed to load data:', error);
      showSnackbar('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 🎯 Utility Functions
  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const getStatusColor = (isActive) => isActive ? 'success' : 'default';
  const getStatusIcon = (isActive) => isActive ? <CheckCircleIcon /> : <WarningIcon />;

  // 🏢 Group Management Functions
  const openGroupDialog = (group = null) => {
    setGroupDialog({
      open: true,
      group,
      data: group ? {
        name: group.name || group.group_name || '',
        department: group.department || 'UNASSIGNED',
        isActive: group.is_active || false,
        priority: group.priority_level || 5
      } : { name: '', department: 'UNASSIGNED', isActive: false, priority: 5 }
    });
  };

  const closeGroupDialog = () => {
    setGroupDialog({ open: false, group: null, data: { name: '', department: 'UNASSIGNED', isActive: false, priority: 5 } });
  };

  const saveGroupConfiguration = async () => {
    try {
      const { group, data } = groupDialog;
      const groupId = group?.id || group?.group_id;
      
      if (!groupId) {
        showSnackbar('Invalid group data', 'error');
        return;
      }

      const payload = {
        name: data.name,
        department: data.department,
        isActive: data.isActive,
        priority_level: data.priority
      };

      const response = await axios.put(`/api/whatsapp-groups/${groupId}`, payload);
      
      if (response.data.success || response.data.id) {
        showSnackbar('Group configuration saved successfully', 'success');
        closeGroupDialog();
        await refreshWhatsAppData();
      } else {
        showSnackbar('Failed to save group configuration', 'error');
      }
    } catch (error) {
      console.error('❌ V2: Save group error:', error);
      showSnackbar(`Save failed: ${error.response?.data?.message || error.message}`, 'error');
    }
  };

  // 📝 Routing Rules Management
  const openRuleDialog = (rule = null) => {
    // Find the correct group ID for existing rules
    let groupId = '';
    if (rule?.whatsapp_group_id) {
      const group = whatsappGroups.find(g => 
        g.id === rule.whatsapp_group_id || 
        g.group_id === rule.whatsapp_group_id
      );
      groupId = group ? (group.id || group.group_id) : '';
    }

    setRuleDialog({
      open: true,
      rule,
      data: rule ? {
        categoryId: rule.category_id || '',
        groupId: groupId,
        severityFilter: rule.severity_filter || ['low', 'medium', 'high'],
        isActive: rule.is_active !== undefined ? rule.is_active : true
      } : { categoryId: '', groupId: '', severityFilter: ['low', 'medium', 'high'], isActive: true }
    });
  };

  const closeRuleDialog = () => {
    setRuleDialog({ open: false, rule: null, data: { categoryId: '', groupId: '', severityFilter: ['low', 'medium', 'high'], isActive: true } });
  };

  const saveRoutingRule = async () => {
    try {
      const { rule, data } = ruleDialog;
      
      if (!data.categoryId || !data.groupId) {
        showSnackbar('Please select both category and group', 'error');
        return;
      }

      const payload = {
        category_id: data.categoryId,
        whatsapp_group_id: data.groupId,
        severity_filter: data.severityFilter,
        is_active: data.isActive
      };

      let response;
      if (rule?.id) {
        // Update existing rule
        response = await axios.put(`/api/whatsapp-routing-rules/${rule.id}`, payload);
      } else {
        // Create new rule
        response = await axios.post('/api/whatsapp-routing-rules', payload);
      }

      if (response.data.success || response.data.id) {
        console.log('✅ V2: Routing rule saved successfully:', response.data);
        showSnackbar(rule ? 'Routing rule updated successfully' : 'Routing rule created successfully', 'success');
        closeRuleDialog();
        
        console.log('🔄 V2: Reloading routing rules data...');
        await loadInitialData(); // Reload rules
        console.log('✅ V2: Data reloaded successfully');
      } else {
        console.error('❌ V2: Save failed - invalid response:', response.data);
        showSnackbar('Failed to save routing rule', 'error');
      }
    } catch (error) {
      console.error('❌ V2: Save rule error:', error);
      showSnackbar(`Save failed: ${error.response?.data?.message || error.message}`, 'error');
    }
  };

  const deleteRoutingRule = async (ruleId) => {
    if (!window.confirm('Are you sure you want to delete this routing rule?')) {
      return;
    }

    try {
      await axios.delete(`/api/whatsapp-routing-rules/${ruleId}`);
      showSnackbar('Routing rule deleted successfully', 'success');
      await loadInitialData();
    } catch (error) {
      console.error('❌ V2: Delete rule error:', error);
      showSnackbar('Failed to delete routing rule', 'error');
    }
  };

  // 🎨 Tab Panels
  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`routing-tabpanel-${index}`}
      aria-labelledby={`routing-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );

  // 🏢 Groups Tab Content
  const GroupsTab = () => (
    <Card elevation={2}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GroupIcon color="primary" />
            WhatsApp Groups ({whatsappGroups.length})
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={refreshWhatsAppData}
            disabled={dataLoading}
          >
            Refresh
          </Button>
        </Box>

        {dataLoading && <LinearProgress sx={{ mb: 2 }} />}

        <TableContainer component={Paper} elevation={1}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: COLORS.background }}>
                <TableCell><strong>Group Name</strong></TableCell>
                <TableCell><strong>Department</strong></TableCell>
                <TableCell><strong>Members</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Priority</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {whatsappGroups.map((group) => (
                <TableRow key={group.id || group.group_id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {group.name || group.group_name || 'Unknown Group'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={group.department || 'UNASSIGNED'} 
                      size="small"
                      color={group.department && group.department !== 'UNASSIGNED' ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge badgeContent={group.participantCount || 0} color="primary">
                      <GroupIcon />
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(group.is_active)}
                      label={group.is_active ? 'Active' : 'Inactive'}
                      color={getStatusColor(group.is_active)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={`P${group.priority_level || 5}`} 
                      size="small"
                      color={(group.priority_level || 5) <= 3 ? 'error' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<SettingsIcon />}
                      onClick={() => openGroupDialog(group)}
                    >
                      Configure
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  // 📝 Rules Tab Content
  const RulesTab = () => (
    <Card elevation={2}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <RuleIcon color="primary" />
            Routing Rules ({routingRules.length})
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => openRuleDialog()}
            color="primary"
          >
            Create Rule
          </Button>
        </Box>

        <TableContainer component={Paper} elevation={1}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: COLORS.background }}>
                <TableCell><strong>Category</strong></TableCell>
                <TableCell><strong>Target Group</strong></TableCell>
                <TableCell><strong>Severity Filter</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {routingRules.map((rule) => {
                const category = issueCategories.find(c => c.id === rule.category_id);
                const group = whatsappGroups.find(g => 
                  g.id === rule.whatsapp_group_id || g.group_id === rule.whatsapp_group_id
                );
                
                return (
                  <TableRow key={rule.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {category?.category_name || 'Unknown Category'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {category?.department || ''}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {group?.name || group?.group_name || 'Unknown Group'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5} flexWrap="wrap">
                        {(rule.severity_filter || []).map((severity) => (
                          <Chip
                            key={severity}
                            label={severity}
                            size="small"
                            color={severity === 'high' ? 'error' : severity === 'medium' ? 'warning' : 'default'}
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(rule.is_active)}
                        label={rule.is_active ? 'Active' : 'Inactive'}
                        color={getStatusColor(rule.is_active)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <IconButton
                          size="small"
                          onClick={() => openRuleDialog(rule)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => deleteRoutingRule(rule.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3, backgroundColor: COLORS.background, minHeight: '100vh' }}>
      {/* 🎯 Header */}
      <Box mb={3}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <WhatsAppIcon color="success" sx={{ fontSize: 40 }} />
          WhatsApp Routing System V2
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Advanced WhatsApp message routing and group management
        </Typography>
      </Box>

      {/* 📊 Status Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Connected Groups</Typography>
              <Typography variant="h4" color="primary">{whatsappGroups.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Active Rules</Typography>
              <Typography variant="h4" color="success.main">
                {routingRules.filter(r => r.is_active).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Categories</Typography>
              <Typography variant="h4" color="info.main">{issueCategories.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Connection Status</Typography>
              <Chip
                icon={isConnected ? <CheckCircleIcon /> : <ErrorIcon />}
                label={isConnected ? 'Connected' : 'Disconnected'}
                color={isConnected ? 'success' : 'error'}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 🗂️ Main Tabs */}
      <Card elevation={3}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="WhatsApp Groups" icon={<GroupIcon />} />
            <Tab label="Routing Rules" icon={<RuleIcon />} />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <GroupsTab />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <RulesTab />
        </TabPanel>
      </Card>

      {/* 🏢 Group Configuration Dialog */}
      <Dialog
        open={groupDialog.open}
        onClose={closeGroupDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle>
          {groupDialog.group ? 'Edit Group Configuration' : 'Configure Group'}
        </DialogTitle>
        <DialogContent>
          <Box mt={2} display="flex" flexDirection="column" gap={3}>
            <TextField
              label="Group Name"
              fullWidth
              value={groupDialog.data.name}
              onChange={(e) => setGroupDialog(prev => ({
                ...prev,
                data: { ...prev.data, name: e.target.value }
              }))}
            />
            
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={groupDialog.data.department}
                onChange={(e) => setGroupDialog(prev => ({
                  ...prev,
                  data: { ...prev.data, department: e.target.value }
                }))}
              >
                <MenuItem value="UNASSIGNED">Unassigned</MenuItem>
                <MenuItem value="TECHNICAL_SUPPORT">Technical Support</MenuItem>
                <MenuItem value="MEMBERSHIP">Membership</MenuItem>
                <MenuItem value="STAFF_MANAGEMENT">Staff Management</MenuItem>
                <MenuItem value="GENERAL_INQUIRIES">General Inquiries</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Priority Level</InputLabel>
              <Select
                value={groupDialog.data.priority}
                onChange={(e) => setGroupDialog(prev => ({
                  ...prev,
                  data: { ...prev.data, priority: e.target.value }
                }))}
              >
                <MenuItem value={1}>Priority 1 (Highest)</MenuItem>
                <MenuItem value={2}>Priority 2 (High)</MenuItem>
                <MenuItem value={3}>Priority 3 (Medium)</MenuItem>
                <MenuItem value={4}>Priority 4 (Low)</MenuItem>
                <MenuItem value={5}>Priority 5 (Lowest)</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={groupDialog.data.isActive}
                  onChange={(e) => setGroupDialog(prev => ({
                    ...prev,
                    data: { ...prev.data, isActive: e.target.checked }
                  }))}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeGroupDialog}>Cancel</Button>
          <Button onClick={saveGroupConfiguration} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* 📝 Routing Rule Dialog */}
      <Dialog
        open={ruleDialog.open}
        onClose={closeRuleDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle>
          {ruleDialog.rule ? 'Edit Routing Rule' : 'Create Routing Rule'}
        </DialogTitle>
        <DialogContent>
          <Box mt={2} display="flex" flexDirection="column" gap={3}>
            <FormControl fullWidth>
              <InputLabel>Issue Category</InputLabel>
              <Select
                value={ruleDialog.data.categoryId}
                onChange={(e) => setRuleDialog(prev => ({
                  ...prev,
                  data: { ...prev.data, categoryId: e.target.value }
                }))}
              >
                {issueCategories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.category_name} ({category.department})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Target WhatsApp Group</InputLabel>
              <Select
                value={ruleDialog.data.groupId}
                onChange={(e) => setRuleDialog(prev => ({
                  ...prev,
                  data: { ...prev.data, groupId: e.target.value }
                }))}
              >
                {whatsappGroups
                  .filter(g => g.is_active) // Only show active groups
                  .map((group) => (
                    <MenuItem key={group.id || group.group_id} value={group.id || group.group_id}>
                      {group.name || group.group_name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Severity Filter</InputLabel>
              <Select
                multiple
                value={ruleDialog.data.severityFilter}
                onChange={(e) => setRuleDialog(prev => ({
                  ...prev,
                  data: { ...prev.data, severityFilter: e.target.value }
                }))}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip
                        key={value}
                        label={value}
                        size="small"
                        color={value === 'high' ? 'error' : value === 'medium' ? 'warning' : 'default'}
                      />
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
                  checked={ruleDialog.data.isActive}
                  onChange={(e) => setRuleDialog(prev => ({
                    ...prev,
                    data: { ...prev.data, isActive: e.target.checked }
                  }))}
                />
              }
              label="Active Rule"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRuleDialog}>Cancel</Button>
          <Button onClick={saveRoutingRule} variant="contained">
            {ruleDialog.rule ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 🎯 Snackbar Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default WhatsAppRoutingPageV2;