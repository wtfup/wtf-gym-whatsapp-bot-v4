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
  Snackbar,
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
  NotificationsActive as NotificationsIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useWhatsAppData } from '../hooks/useWhatsAppData';
import ModalPortal from './ModalPortal';

const WhatsAppRoutingPage = () => {
  // 🌐 USE CENTRALIZED WHATSAPP DATA
  const { 
    groups: whatsappGroups, 
    senders, 
    isLoading: dataLoading, 
    isConnected, 
    lastUpdate,
    forceRefresh: refreshWhatsAppData,
    stats,
    error: dataError
  } = useWhatsAppData();

  const [activeTab, setActiveTab] = useState(0);
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
  
  // V2 Enhanced Configuration Dialog
  const [v2ConfigDialog, setV2ConfigDialog] = useState({
    open: false,
    group: null,
    data: {
      name: '',
      description: '',
      isActive: true
    }
  });
  
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
    
    // 🌐 WhatsApp data now comes from useWhatsAppData hook automatically
    // Socket listeners are handled in the hook
  }, []);

  // 🔧 FIX: Log data when hook actually loads it
  useEffect(() => {
    if (whatsappGroups.length > 0) {
      console.log('✅ WHATSAPP DATA HOOK UPDATE:');
      console.log('   WhatsApp Groups:', whatsappGroups.length);
      console.log('   Data Status:', isConnected ? 'Live' : 'Cached');
      console.log('   Last Update:', lastUpdate);
    }
  }, [whatsappGroups, isConnected, lastUpdate]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 🌐 GROUPS NOW COME FROM CENTRALIZED DATA MANAGER (no manual API call needed!)
      // whatsappGroups automatically updates via useWhatsAppData hook
      
      // Only fetch routing rules and categories manually
      const [rulesRes, categoriesRes] = await Promise.all([
        axios.get('/api/whatsapp-routing-rules'),
        axios.get('/api/issue-categories')
      ]);

      setRoutingRules(rulesRes.data.rules || []);
      
      // 🔧 FIX: Categories API returns array directly, not object.categories
      const categories = Array.isArray(categoriesRes.data) ? categoriesRes.data : categoriesRes.data.categories || [];
      setIssueCategories(categories);

      console.log('✅ ROUTING DATA LOADED SUCCESSFULLY:');
      console.log('   Issue Categories:', categories.length);
      console.log('   Routing Rules:', rulesRes.data.rules?.length || 0);
      console.log('   Note: WhatsApp Groups loaded separately via useWhatsAppData hook');
    } catch (error) {
      console.error('Error loading data:', error);
      
      // Handle data errors
      if (dataError) {
        showSnackbar(`Data Manager Error: ${dataError}`, 'error');
        return;
      }
      
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

  // 🔄 FORCE REFRESH WHATSAPP DATA
  const handleForceRefresh = async () => {
    try {
      showSnackbar('🔄 Refreshing WhatsApp data...', 'info');
      const stats = await refreshWhatsAppData();
      showSnackbar(
        `✅ Data refreshed: ${stats.groups} groups, ${stats.senders} senders`, 
        'success'
      );
    } catch (error) {
      showSnackbar(`❌ Refresh failed: ${error.message}`, 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
    // Load routing logs when logs tab is selected
    if (newValue === 3) {
      loadRoutingLogs();
    }
  };

  // ==================== V2 ENHANCED CONFIG FUNCTIONS ====================
  const openV2ConfigDialog = (group) => {
    console.log('🔧 V2: Opening config for group:', group?.name);
    
    if (!group) {
      showSnackbar('Error: No group selected', 'error');
      return;
    }

    // Extract group data
    const groupName = group.name || group.group_name || 'Unknown';
    const groupId = group.id || group.group_id;
    const description = group.description || '';
    const isActive = group.is_active || false;

    setV2ConfigDialog({
      open: true,
      group: {
        ...group,
        id: groupId,
        name: groupName
      },
      data: {
        name: groupName,
        description: description,
        isActive: isActive
      }
    });
  };

  const closeV2ConfigDialog = () => {
    setV2ConfigDialog({
      open: false,
      group: null,
      data: {
        name: '',
        description: '',
        isActive: true
      }
    });
  };

  const saveV2GroupConfiguration = async () => {
    try {
      if (!v2ConfigDialog.group) {
        showSnackbar('Error: No group selected', 'error');
        return;
      }

      if (!v2ConfigDialog.data.name?.trim()) {
        showSnackbar('Error: Group name is required', 'error');
        return;
      }

      const groupId = v2ConfigDialog.group.id;
      const saveData = {
        name: v2ConfigDialog.data.name.trim(),
        description: v2ConfigDialog.data.description.trim(),
        isActive: v2ConfigDialog.data.isActive
      };

      console.log('💾 V2: Saving config:', saveData);
      console.log('💾 V2: Group ID:', groupId);
      console.log('💾 V2: API URL:', `http://localhost:3010/api/whatsapp-groups/${groupId}`);
      
      // Also log current groups data before save
      console.log('📊 V2: Current groups data before save:', whatsappGroups.find(g => g.id === groupId || g.group_id === groupId));

      const response = await axios.put(`http://localhost:3010/api/whatsapp-groups/${groupId}`, saveData);
      console.log('✅ V2: Save response:', response.data);
      
      // Verify the update by fetching the specific group
      const verifyResponse = await axios.get(`http://localhost:3010/api/whatsapp-groups/${groupId}`);
      console.log('🔍 V2: Verification - Group after update:', verifyResponse.data);

      // Show success message and close dialog
      showSnackbar('Group configuration saved successfully! Refreshing data...', 'success');
      closeV2ConfigDialog();
      
      // First check if save was actually successful in database
      console.log('🔄 V2: Checking database after save...');
      
      try {
        // Fetch the specific group again to verify save
        const postSaveCheck = await axios.get(`http://localhost:3010/api/whatsapp-groups/${groupId}`);
        console.log('✅ V2: Database verification after save:', postSaveCheck.data);
        
        if (postSaveCheck.data.is_active === saveData.isActive) {
          console.log('✅ V2: Database save confirmed! Updating UI...');
          
          // Update the UI directly without page reload
          showSnackbar('✅ Group configuration saved successfully!', 'success');
          
          // Force refresh the WhatsApp data to update the UI
          try {
            console.log('🔄 V2: Refreshing WhatsApp data...');
            await refreshWhatsAppData();
            console.log('✅ V2: UI updated successfully!');
          } catch (refreshError) {
            console.error('❌ V2: Failed to refresh data:', refreshError);
            showSnackbar('⚠️ Saved but UI may need manual refresh', 'warning');
          }
          
        } else {
          console.error('❌ V2: Database save failed');
          showSnackbar('❌ Failed to save group configuration', 'error');
        }
        
      } catch (error) {
        console.error('❌ V2: Post-save verification failed:', error);
        showSnackbar('❌ Error verifying save operation', 'error');
      }
      
    } catch (error) {
      console.error('❌ V2: Save error:', error);
      
      let errorMessage = 'Failed to save group configuration';
      if (error.response?.status === 500) {
        errorMessage = `Server Error: ${error.response?.data?.details || 'Internal server error'}`;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      showSnackbar(errorMessage, 'error');
    }
  };

  const openGroupConfigDialog = (group = null) => {
    console.log('🔧 CONFIGURE BUTTON CLICKED:', group?.name);
    console.log('🔧 BULLETPROOF DIALOG OPENING STARTED...');
    
    // ===== COMPREHENSIVE VALIDATION =====
    if (!group) {
      console.error('❌ CRITICAL: NO GROUP DATA PASSED!');
      showSnackbar('Error: No group data provided', 'error');
      return;
    }
    
    // Extract all possible name variations
    const possibleNames = [
      group.name,
      group.group_name, 
      group.groupName,
      group.Name,
      group.GROUP_NAME
    ].filter(Boolean);
    
    const groupName = possibleNames[0] || 'Unknown Group';
    
    // Extract all possible ID variations  
    const possibleIds = [
      group.id,
      group.group_id,
      group.groupId,
      group.ID,
      group.GROUP_ID,
      group.whatsappId,
      group.chatId
    ].filter(Boolean);
    
    const groupId = possibleIds[0];
    
    console.log('🔍 EXTRACTED DATA:');
    console.log(`   📛 Name: "${groupName}" (from: ${possibleNames})`);
    console.log(`   🆔 ID: "${groupId}" (from: ${possibleIds})`);
    
    if (!groupId) {
      console.error('❌ CRITICAL: NO VALID GROUP ID FOUND!');
      console.error('   Available fields:', Object.keys(group));
      showSnackbar(`Error: Group "${groupName}" missing ID`, 'error');
      return;
    }
    
    // ===== ROBUST STATE MANAGEMENT =====
    console.log('🔄 RESETTING DIALOG STATE...');
    
    // Force close any existing dialog
    setDialogOpen(false);
    setDialogType('');
    setSelectedItem(null);
    setGroupConfig({ name: '', description: '', isActive: true });
    
    // Use longer timeout for problematic groups
    setTimeout(() => {
      console.log('⏰ TIMEOUT EXECUTED - Setting up dialog...');
      
      // ===== BULLETPROOF CONFIG SETUP =====
      const configData = {
        name: groupName,
        description: group.description || group.Description || '',
        isActive: 
          group.isActive !== undefined ? group.isActive :
          group.is_active !== undefined ? group.is_active :
          group.active !== undefined ? group.active :
          group.Active !== undefined ? group.Active :
          true
      };
      
      // Create a sanitized group object
      const sanitizedGroup = {
        ...group,
        id: groupId,
        name: groupName,
        group_id: groupId,
        group_name: groupName
      };
      
      console.log('📋 FINAL CONFIG DATA:', configData);
      console.log('📋 SANITIZED GROUP:', sanitizedGroup);
      
      // Set all state in sequence
      setSelectedItem(sanitizedGroup);
      setGroupConfig(configData);
      setDialogType('group-config');
      
      // Final state set
      setTimeout(() => {
        setDialogOpen(true);
        console.log('✅ DIALOG OPENED - Final state check:');
        console.log(`   dialogOpen: true`);
        console.log(`   dialogType: "group-config"`);
        console.log(`   groupName: "${groupName}"`);
        console.log(`   groupId: "${groupId}"`);
      }, 50);
      
    }, 150); // Longer timeout for problematic groups
  };

  const openRoutingRuleDialog = (rule = null) => {
    console.log('🔧 OPENING ROUTING RULE DIALOG');
    console.log('   WhatsApp Groups Available:', whatsappGroups.length);
    console.log('   Issue Categories Available:', issueCategories.length);
    console.log('   Rule to Edit:', rule);
    
    setDialogType('routing-rule');
    setSelectedItem(rule);
    
    // 🔧 Fix: Convert database whatsapp_group_id to actual group ID if editing
    let whatsappGroupId = '';
    if (rule?.whatsapp_group_id) {
      console.log('   Looking for group with ID:', rule.whatsapp_group_id);
      // Find the actual WhatsApp group ID from the database ID
      const group = whatsappGroups.find(g => g.id === rule.whatsapp_group_id || g.group_id === rule.whatsapp_group_id);
      whatsappGroupId = group ? (group.id || group.group_id) : '';
      console.log('   Found Group:', group?.name || group?.group_name || 'NOT FOUND');
      console.log('   Using WhatsApp Group ID:', whatsappGroupId);
    }
    
    const finalRoutingRule = {
      categoryId: rule?.category_id || '',
      whatsappGroupId: whatsappGroupId,
      severityFilter: rule?.severity_filter || ['low', 'medium', 'high'],
      isActive: rule?.is_active !== undefined ? rule.is_active : true
    };
    
    console.log('   Final Routing Rule State:', finalRoutingRule);
    setRoutingRule(finalRoutingRule);
    
    // ✅ Data should now be available from the fixed loading logic
    
    setDialogOpen(true);
  };

  const handleSaveGroupConfig = async () => {
    try {
      console.log('💾 SAVING GROUP CONFIG:', groupConfig);
      console.log('   Selected Item:', selectedItem);
      
      // Validation
      if (!selectedItem) {
        showSnackbar('Error: No group selected', 'error');
        return;
      }
      
      if (!groupConfig.name || groupConfig.name.trim() === '') {
        showSnackbar('Error: Group name is required', 'error');
        return;
      }
      
      // Use the WhatsApp group ID (which is the string ID like "123@g.us")
      const groupId = selectedItem.id || selectedItem.group_id;
      
      if (!groupId) {
        showSnackbar('Error: Group ID is missing', 'error');
        return;
      }
      
      console.log('📤 SENDING UPDATE REQUEST:', {
        url: `/api/whatsapp-groups/${groupId}`,
        data: groupConfig
      });
      
      const response = await axios.put(`/api/whatsapp-groups/${groupId}`, groupConfig);
      console.log('✅ SAVE RESPONSE:', response.data);
      
      showSnackbar('Group configuration saved successfully', 'success');
      setDialogOpen(false);
      setDialogType('');
      
      // Refresh data to show updated information
      loadData();
      
    } catch (error) {
      console.error('❌ Error saving group config:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      // More specific error messages
      if (error.response?.status === 500) {
        showSnackbar(`Server Error: ${error.response?.data?.details || 'Internal server error'}`, 'error');
      } else if (error.response?.status === 404) {
        showSnackbar('Error: Group not found', 'error');
      } else if (error.response?.status === 400) {
        showSnackbar(`Validation Error: ${error.response?.data?.message || 'Invalid data'}`, 'error');
      } else if (error.request) {
        showSnackbar('Error: Unable to connect to server', 'error');
      } else {
        showSnackbar(`Error: ${error.message}`, 'error');
      }
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
      setDialogType('');
      loadData();
    } catch (error) {
      console.error('Error saving routing rule:', error);
      showSnackbar('Failed to save routing rule', 'error');
    }
  };

  const handleDeleteRoutingRule = async (id) => {
    if (window.confirm('Are you sure you want to delete this routing rule?')) {
      try {
        await axios.delete(`/api/routing-rules/${id}`);
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
        
        {/* 📊 REAL-TIME DATA STATUS INDICATORS */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip 
            icon={isConnected ? <CheckCircleIcon /> : <CancelIcon />}
            label={isConnected ? 'Live Data' : 'Cached Data'}
            color={isConnected ? 'success' : 'warning'}
            size="small"
          />
          <Chip 
            label={`${whatsappGroups.length} Groups`}
            color="primary"
            size="small"
          />
          {lastUpdate && (
            <Typography variant="caption" sx={{ color: 'text.secondary', mr: 2 }}>
              Updated: {new Date(lastUpdate).toLocaleTimeString()}
            </Typography>
          )}
          
          {/* 🔄 ENHANCED REFRESH BUTTON */}
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={handleForceRefresh}
            disabled={dataLoading}
            sx={{ minWidth: 120 }}
          >
            {dataLoading ? 'Syncing...' : 'Refresh Data'}
          </Button>
        </Box>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="WhatsApp Groups" icon={<GroupIcon />} />
          <Tab label="Groups V2 (Enhanced)" icon={<SettingsIcon />} />
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
                        onClick={() => {
                          console.log('🔴 BUTTON CLICKED - Group:', group?.name);
                          console.log('🔴 COMPREHENSIVE GROUP ANALYSIS:');
                          console.log('   📋 FULL GROUP OBJECT:', JSON.stringify(group, null, 4));
                          console.log('   🔑 OBJECT KEYS:', Object.keys(group || {}));
                          console.log('   📊 DATA TYPES:');
                          Object.keys(group || {}).forEach(key => {
                            console.log(`      ${key}: ${typeof group[key]} = ${group[key]}`);
                          });
                          console.log('   🆔 ID ANALYSIS:');
                          console.log(`      group.id: ${group?.id} (${typeof group?.id})`);
                          console.log(`      group.group_id: ${group?.group_id} (${typeof group?.group_id})`);
                          console.log('   📛 NAME ANALYSIS:');
                          console.log(`      group.name: "${group?.name}" (${typeof group?.name})`);
                          console.log(`      group.group_name: "${group?.group_name}" (${typeof group?.group_name})`);
                          console.log('   ⚙️ STATUS ANALYSIS:');
                          console.log(`      group.isActive: ${group?.isActive} (${typeof group?.isActive})`);
                          console.log(`      group.is_active: ${group?.is_active} (${typeof group?.is_active})`);
                          console.log(`      group.isConfigured: ${group?.isConfigured} (${typeof group?.isConfigured})`);
                          console.log('   🎯 VALIDATION RESULTS:');
                          const hasId = !!(group?.id || group?.group_id);
                          const hasName = !!(group?.name || group?.group_name);
                          console.log(`      Has ID: ${hasId}`);
                          console.log(`      Has Name: ${hasName}`);
                          console.log(`      Should Work: ${hasId && hasName}`);
                          console.log('');
                          
                          openGroupConfigDialog(group);
                        }}
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

      {/* Groups V2 Enhanced Tab */}
      {activeTab === 1 && (
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            Enhanced WhatsApp Groups configuration with improved dialog and management features.
          </Alert>
          
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SettingsIcon color="primary" />
                WhatsApp Groups V2 (35 groups available)
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={() => window.location.reload()}
                  sx={{ ml: 'auto' }}
                >
                  Refresh Data
                </Button>
              </Typography>

              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Group Name</strong></TableCell>
                      <TableCell><strong>Participants</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell><strong>Description</strong></TableCell>
                      <TableCell align="right"><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {whatsappGroups.map((group) => (
                      <TableRow key={group.id || group.group_id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <GroupIcon fontSize="small" />
                            {group.name || group.group_name || 'Unnamed Group'}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={group.participantCount || group.participant_count || 0} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={group.is_active ? "✅ Active" : "❌ Not Configured"} 
                            color={group.is_active ? "success" : "warning"}
                            size="small"
                            sx={{ fontWeight: 'bold' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                            {group.description || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton 
                            color="primary" 
                            onClick={() => openV2ConfigDialog(group)}
                            size="small"
                          >
                            <SettingsIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Routing Rules Tab */}
      {activeTab === 2 && (
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
      {activeTab === 3 && (
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
      {console.log('🔍 DIALOG RENDER STATE:', { 
        dialogOpen, 
        dialogType, 
        shouldOpen: dialogOpen && dialogType === 'group-config',
        groupConfig,
        selectedItem: selectedItem?.name || selectedItem?.group_name,
        timestamp: new Date().toISOString()
      })}
      <Dialog 
        open={dialogOpen && dialogType === 'group-config'}
        onClose={() => {
          console.log('🚪 DIALOG CLOSE TRIGGERED');
          setDialogOpen(false);
          setDialogType('');
        }} 
        maxWidth="md" 
        fullWidth
        sx={{
          zIndex: 1300, // Ensure it's above everything
          '& .MuiDialog-paper': {
            backgroundColor: 'white !important',
            border: '2px solid #1976d2', // Blue border for visibility
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }
        }}
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent backdrop
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <GroupIcon color="primary" />
            Configure WhatsApp Group: {groupConfig?.name || selectedItem?.name || selectedItem?.group_name || 'Unknown Group'}
          </Box>
          {console.log('🔍 DIALOG TITLE RENDER:', { 
            groupConfigName: groupConfig?.name,
            selectedItemName: selectedItem?.name,
            selectedItemGroupName: selectedItem?.group_name 
          })}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Group Name"
                value={groupConfig?.name || selectedItem?.name || selectedItem?.group_name || ''}
                onChange={(e) => setGroupConfig({...groupConfig, name: e.target.value})}
                variant="outlined"
                helperText={`Original: ${selectedItem?.name || selectedItem?.group_name || 'N/A'}`}
              />
              {console.log('🔍 NAME FIELD RENDER:', { 
                configName: groupConfig?.name,
                selectedName: selectedItem?.name,
                selectedGroupName: selectedItem?.group_name 
              })}
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={groupConfig?.description || selectedItem?.description || ''}
                onChange={(e) => setGroupConfig({...groupConfig, description: e.target.value})}
                variant="outlined"
                multiline
                rows={3}
                placeholder="Enter a description for this group..."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={groupConfig?.isActive || false}
                    onChange={(e) => setGroupConfig({...groupConfig, isActive: e.target.checked})}
                    color="primary"
                  />
                }
                label="Group Active"
              />
            </Grid>

            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Group Info:</strong><br/>
                  • Participants: {selectedItem?.participantCount || 0}<br/>
                  • WhatsApp ID: {selectedItem?.id || selectedItem?.group_id || 'N/A'}<br/>
                  • Status: {selectedItem?.isConfigured ? 'Configured' : 'Not Configured'}<br/>
                  • Department: {selectedItem?.department || 'UNASSIGNED'}<br/>
                  • Active: {selectedItem?.isActive || selectedItem?.is_active ? 'Yes' : 'No'}
                </Typography>
              </Alert>
            </Grid>
            <Grid item xs={12}>
              <Alert severity="warning" sx={{ fontSize: '12px' }}>
                <Typography variant="caption">
                  <strong>🔍 DEBUG INFO:</strong><br/>
                  • Config Name: "{groupConfig?.name}"<br/>
                  • Selected Name: "{selectedItem?.name}"<br/>
                  • Selected Group Name: "{selectedItem?.group_name}"<br/>
                  • Dialog Open: {dialogOpen ? 'YES' : 'NO'}<br/>
                  • Dialog Type: "{dialogType}"<br/>
                  • Available Keys: {selectedItem ? Object.keys(selectedItem).join(', ') : 'None'}
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setDialogOpen(false);
              setDialogType('');
            }}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveGroupConfig}
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
          >
            Save Configuration
          </Button>
        </DialogActions>
      </Dialog>

      {/* Routing Rule Dialog */}
      <Dialog 
        open={dialogOpen && dialogType === 'routing-rule'} 
        onClose={() => {
          setDialogOpen(false);
          setDialogType('');
        }} 
        maxWidth="sm" 
        fullWidth
        disableEnforceFocus={true}
        disableAutoFocus={true}
        disableRestoreFocus={true}
        aria-hidden={false}
        sx={{ 
          zIndex: 9999,
          '& .MuiDialog-paper': {
            zIndex: 9999,
            maxHeight: '90vh',
            borderRadius: 3,
            overflow: 'hidden'
          },
          '& .MuiDialog-root': {
            pointerEvents: 'auto'
          }
        }}
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 9998,
            backdropFilter: 'blur(4px)'
          }
        }}
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '90vh',
            zIndex: 9999,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }
        }}
        slotProps={{
          root: {
            'aria-hidden': false
          }
        }}
      >
        <DialogTitle>{selectedItem ? 'Edit Routing Rule' : 'Create Routing Rule'}</DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Issue Category</InputLabel>
              <Select
                value={routingRule.categoryId}
                onChange={(e) => setRoutingRule({ ...routingRule, categoryId: e.target.value })}
                MenuProps={{
                  disablePortal: false,
                  container: document.body,
                  anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'left'
                  },
                  transformOrigin: {
                    vertical: 'top',
                    horizontal: 'left'
                  },
                  PaperProps: {
                    sx: {
                      zIndex: 999999, // Ultra high z-index
                      maxHeight: 300,
                      position: 'fixed !important',
                      top: '50% !important',
                      left: '50% !important',
                      transform: 'translate(-50%, -50%) !important',
                      width: 'auto',
                      minWidth: '200px'
                    }
                  },
                  slotProps: {
                    paper: {
                      sx: {
                        zIndex: 999999
                      }
                    }
                  }
                }}
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
                disabled={whatsappGroups.length === 0}
                MenuProps={{
                  disablePortal: false,
                  container: document.body,
                  anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'left'
                  },
                  transformOrigin: {
                    vertical: 'top',
                    horizontal: 'left'
                  },
                  PaperProps: {
                    sx: {
                      zIndex: 999999, // Ultra high z-index
                      maxHeight: 300,
                      position: 'fixed !important',
                      top: '50% !important',
                      left: '50% !important',
                      transform: 'translate(-50%, -50%) !important',
                      width: 'auto',
                      minWidth: '200px'
                    }
                  },
                  slotProps: {
                    paper: {
                      sx: {
                        zIndex: 999999
                      }
                    }
                  }
                }}
              >
                {whatsappGroups.length === 0 ? (
                  <MenuItem disabled>Loading groups...</MenuItem>
                ) : (
                  whatsappGroups.map((group, index) => {
                    console.log(`🔍 GROUP ${index}:`, {
                      id: group.id || group.group_id,
                      name: group.name || group.group_name,
                      originalGroup: group
                    });
                    return (
                      <MenuItem key={group.id || group.group_id} value={group.id || group.group_id}>
                        {group.name || group.group_name}
                      </MenuItem>
                    );
                  })
                )}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Severity Filter</InputLabel>
              <Select
                multiple
                value={routingRule.severityFilter}
                onChange={(e) => setRoutingRule({ ...routingRule, severityFilter: e.target.value })}
                MenuProps={{
                  disablePortal: false,
                  container: document.body,
                  anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'left'
                  },
                  transformOrigin: {
                    vertical: 'top',
                    horizontal: 'left'
                  },
                  PaperProps: {
                    sx: {
                      zIndex: 999999, // Ultra high z-index
                      maxHeight: 300,
                      position: 'fixed !important',
                      top: '50% !important',
                      left: '50% !important',
                      transform: 'translate(-50%, -50%) !important',
                      width: 'auto',
                      minWidth: '200px'
                    }
                  },
                  slotProps: {
                    paper: {
                      sx: {
                        zIndex: 999999
                      }
                    }
                  }
                }}
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
          <Button onClick={() => {
            setDialogOpen(false);
            setDialogType('');
          }}>Cancel</Button>
          <Button onClick={handleSaveRoutingRule} variant="contained">
            {selectedItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* V2 Enhanced Configuration Dialog - Using Portal for Fixed Positioning */}
      {v2ConfigDialog.open && (
        <ModalPortal>
          <div style={{
            position: 'fixed',
            top: '0px',
            left: '0px',
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.8)',
            zIndex: 99999999,
            display: 'table',
            tableLayout: 'fixed'
          }}>
            <div style={{
              display: 'table-cell',
              verticalAlign: 'middle',
              textAlign: 'center',
              padding: '20px'
            }}>
              <div style={{
                backgroundColor: 'white',
                border: '4px solid #1976d2',
                borderRadius: '8px',
                width: '600px',
                maxWidth: '90vw',
                minWidth: '400px',
                padding: '30px',
                boxSizing: 'border-box',
                maxHeight: '80vh',
                overflowY: 'auto',
                position: 'relative',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                margin: '0 auto',
                textAlign: 'left',
                display: 'inline-block'
              }}>
              {/* Close Button */}
              <button 
                onClick={closeV2ConfigDialog}
                style={{
                  position: 'absolute',
                  top: '15px',
                  right: '15px',
                  background: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                ✕
              </button>

              {/* Header */}
              <h2 style={{ 
                color: '#1976d2', 
                margin: '0 0 25px 0',
                fontSize: '24px',
                borderBottom: '3px solid #1976d2',
                paddingBottom: '15px',
                textAlign: 'center'
              }}>
                ⚙️ Configure Group: {v2ConfigDialog.group?.name || 'Unknown'}
              </h2>

              {/* Group Name */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  fontWeight: 'bold', 
                  marginBottom: '8px',
                  color: '#333',
                  fontSize: '16px'
                }}>
                  Group Name:
                </label>
                <input
                  type="text"
                  value={v2ConfigDialog.data.name}
                  onChange={(e) => setV2ConfigDialog(prev => ({ 
                    ...prev, 
                    data: { ...prev.data, name: e.target.value } 
                  }))}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    marginBottom: '8px', 
                    border: '2px solid #1976d2', 
                    borderRadius: '6px',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter group name..."
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  fontWeight: 'bold', 
                  marginBottom: '8px',
                  color: '#333',
                  fontSize: '16px'
                }}>
                  Description:
                </label>
                <textarea
                  value={v2ConfigDialog.data.description}
                  onChange={(e) => setV2ConfigDialog(prev => ({ 
                    ...prev, 
                    data: { ...prev.data, description: e.target.value } 
                  }))}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    height: '90px', 
                    marginBottom: '8px', 
                    border: '2px solid #1976d2', 
                    borderRadius: '6px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                  placeholder="Enter group description..."
                />
              </div>

              {/* Active Toggle */}
              <div style={{ marginBottom: '25px' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}>
                  <input
                    type="checkbox"
                    checked={v2ConfigDialog.data.isActive}
                    onChange={(e) => setV2ConfigDialog(prev => ({ 
                      ...prev, 
                      data: { ...prev.data, isActive: e.target.checked } 
                    }))}
                    style={{ 
                      marginRight: '12px', 
                      transform: 'scale(1.5)' 
                    }}
                  />
                  Group Active
                </label>
                <small style={{ color: '#666', display: 'block', marginTop: '5px', marginLeft: '30px' }}>
                  When active, this group can receive automated messages and notifications
                </small>
              </div>

              {/* Group Information */}
              <div style={{
                backgroundColor: '#e3f2fd',
                border: '2px solid #1976d2',
                borderRadius: '6px',
                padding: '15px',
                marginBottom: '25px'
              }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#1976d2', fontSize: '16px' }}>📊 Group Information:</h4>
                <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  <strong>WhatsApp ID:</strong> {v2ConfigDialog.group?.id}<br/>
                  <strong>Participants:</strong> {v2ConfigDialog.group?.participantCount || 0}<br/>
                  <strong>Status:</strong> <span style={{ 
                    color: v2ConfigDialog.data.isActive ? '#4caf50' : '#ff5722',
                    fontWeight: 'bold'
                  }}>
                    {v2ConfigDialog.data.isActive ? '✅ Active' : '❌ Inactive'}
                  </span><br/>
                  <strong>Last Updated:</strong> {new Date().toLocaleTimeString()}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ 
                textAlign: 'right', 
                borderTop: '2px solid #ddd', 
                paddingTop: '20px',
                display: 'flex',
                gap: '15px',
                justifyContent: 'flex-end'
              }}>
                <button 
                  onClick={closeV2ConfigDialog}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#f5f5f5',
                    color: '#333',
                    border: '2px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={saveV2GroupConfiguration}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#1976d2',
                    color: 'white',
                    border: '2px solid #1976d2',
                    borderRadius: '6px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  💾 Save Configuration
                </button>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

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