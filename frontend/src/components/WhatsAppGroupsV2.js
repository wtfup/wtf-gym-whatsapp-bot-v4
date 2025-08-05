import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  CircularProgress,
  Divider,
  Badge
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Group as GroupIcon,
  Refresh as RefreshIcon,
  WhatsApp as WhatsAppIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useWhatsAppData } from '../hooks/useWhatsAppData';
import ModalPortal from './ModalPortal';

const WhatsAppGroupsV2 = () => {
  // ==================== STATE MANAGEMENT ====================
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [configDialog, setConfigDialog] = useState({
    open: false,
    group: null,
    data: {
      name: '',
      description: '',
      isActive: true
    }
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // ==================== HOOKS ====================
  const { 
    groups: whatsappGroups, 
    isLoading: dataLoading, 
    isConnected,
    refreshWhatsAppData 
  } = useWhatsAppData();

  // ==================== UTILITY FUNCTIONS ====================
  const showSnackbar = useCallback((message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  }, []);

  const closeSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  // ==================== DATA LOADING ====================
  const loadGroups = useCallback(async () => {
    try {
      console.log('🔄 V2: Loading WhatsApp groups...');
      setLoading(true);
      
      // Use the cached groups from WhatsApp Data Manager
      if (whatsappGroups && whatsappGroups.length > 0) {
        console.log(`✅ V2: Loaded ${whatsappGroups.length} groups from cache`);
        setGroups(whatsappGroups);
      } else {
        console.log('📡 V2: Fetching groups from API...');
        const response = await axios.get('/api/whatsapp-groups');
        const groupsData = response.data?.groups || response.data || [];
        console.log(`✅ V2: Loaded ${groupsData.length} groups from API`);
        setGroups(groupsData);
      }
    } catch (error) {
      console.error('❌ V2: Error loading groups:', error);
      showSnackbar('Failed to load WhatsApp groups', 'error');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [whatsappGroups, showSnackbar]);

  // ==================== DIALOG MANAGEMENT ====================
  const openConfigureDialog = useCallback((group) => {
    console.log('🔧 V2: Opening configure dialog for:', group?.name);
    
    if (!group) {
      showSnackbar('Error: No group data provided', 'error');
      return;
    }

    // Extract group information with multiple fallbacks
    const groupName = group.name || group.group_name || group.groupName || 'Unknown Group';
    const groupId = group.id || group.group_id || group.groupId;
    const description = group.description || group.Description || '';
    const isActive = group.isActive !== undefined ? group.isActive : 
                    group.is_active !== undefined ? group.is_active : 
                    group.active !== undefined ? group.active : true;

    if (!groupId) {
      showSnackbar(`Error: Group "${groupName}" missing ID`, 'error');
      return;
    }

    console.log('✅ V2: Group data extracted:', {
      name: groupName,
      id: groupId,
      description,
      isActive
    });

    // Set dialog state
    setConfigDialog({
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
  }, [showSnackbar]);

  const closeConfigureDialog = useCallback(() => {
    console.log('🚪 V2: Closing configure dialog');
    setConfigDialog({
      open: false,
      group: null,
      data: {
        name: '',
        description: '',
        isActive: true
      }
    });
  }, []);

  // ==================== SAVE FUNCTIONALITY ====================
  const saveGroupConfiguration = useCallback(async () => {
    try {
      console.log('💾 V2: Saving group configuration...');
      
      if (!configDialog.group) {
        showSnackbar('Error: No group selected', 'error');
        return;
      }

      if (!configDialog.data.name?.trim()) {
        showSnackbar('Error: Group name is required', 'error');
        return;
      }

      const groupId = configDialog.group.id;
      const saveData = {
        name: configDialog.data.name.trim(),
        description: configDialog.data.description.trim(),
        isActive: configDialog.data.isActive
      };

      console.log('📤 V2: Sending save request:', {
        url: `/api/whatsapp-groups/${groupId}`,
        data: saveData
      });

      console.log('💾 V2: Saving config:', saveData);
      console.log('💾 V2: Group ID:', groupId);
      console.log('💾 V2: API URL:', `http://localhost:3010/api/whatsapp-groups/${groupId}`);

      const response = await axios.put(`http://localhost:3010/api/whatsapp-groups/${groupId}`, saveData);
      console.log('✅ V2: Save successful:', response.data);

      showSnackbar('Group configuration saved successfully!', 'success');
      closeConfigureDialog();
      
      // Refresh data
      await loadGroups();
      
    } catch (error) {
      console.error('❌ V2: Save error:', error);
      
      let errorMessage = 'Failed to save group configuration';
      if (error.response?.status === 500) {
        errorMessage = `Server Error: ${error.response?.data?.details || 'Internal server error'}`;
      } else if (error.response?.status === 404) {
        errorMessage = 'Error: Group not found';
      } else if (error.response?.status === 400) {
        errorMessage = `Validation Error: ${error.response?.data?.message || 'Invalid data'}`;
      } else if (error.request) {
        errorMessage = 'Error: Unable to connect to server';
      }
      
      showSnackbar(errorMessage, 'error');
    }
  }, [configDialog, showSnackbar, closeConfigureDialog, loadGroups]);

  // ==================== EFFECTS ====================
  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  // ==================== RENDER HELPERS ====================
  const getStatusChip = (group) => {
    const isConfigured = group.isConfigured || group.is_configured;
    const isActive = group.isActive !== undefined ? group.isActive : group.is_active;
    
    if (isConfigured && isActive) {
      return <Chip icon={<CheckCircleIcon />} label="Active" color="success" size="small" />;
    } else if (isConfigured && !isActive) {
      return <Chip icon={<CancelIcon />} label="Inactive" color="warning" size="small" />;
    } else {
      return <Chip icon={<WarningIcon />} label="Not Configured" color="error" size="small" />;
    }
  };

  const handleRefreshData = useCallback(async () => {
    showSnackbar('Refreshing WhatsApp data...', 'info');
    await refreshWhatsAppData();
    await loadGroups();
    showSnackbar('Data refreshed successfully!', 'success');
  }, [refreshWhatsAppData, loadGroups, showSnackbar]);

  // ==================== MAIN RENDER ====================
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <WhatsAppIcon sx={{ fontSize: 32, color: '#25D366' }} />
            <Typography variant="h4" component="h1" fontWeight="bold">
              WhatsApp Groups V2
            </Typography>
            <Chip 
              label="NEW VERSION" 
              color="primary" 
              size="small" 
              sx={{ fontWeight: 'bold' }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefreshData}
              disabled={dataLoading}
            >
              Refresh Data
            </Button>
          </Box>
        </Box>

        {/* Connection Status */}
        <Alert 
          severity={isConnected ? "success" : "warning"}
          sx={{ mb: 2 }}
        >
          WhatsApp Status: {isConnected ? "Connected & Ready" : "Disconnected or Loading"}
          {isConnected && ` • ${groups.length} groups available`}
        </Alert>
      </Box>

      {/* Loading State */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading WhatsApp groups...</Typography>
        </Box>
      ) : (
        <>
          {/* Groups Table */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                WhatsApp Groups ({groups.length})
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {groups.length === 0 ? (
                <Alert severity="info">
                  No WhatsApp groups found. Make sure your WhatsApp is connected and has groups.
                </Alert>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Group Name</strong></TableCell>
                        <TableCell align="center"><strong>Participants</strong></TableCell>
                        <TableCell align="center"><strong>Status</strong></TableCell>
                        <TableCell><strong>Description</strong></TableCell>
                        <TableCell align="center"><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {groups.map((group, index) => (
                        <TableRow key={group.id || group.group_id || index} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <GroupIcon color="action" />
                              <Typography variant="body2" fontWeight="medium">
                                {group.name || group.group_name || 'Unknown Group'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Badge 
                              badgeContent={group.participantCount || group.participant_count || 0} 
                              color="primary"
                              max={999}
                            >
                              <GroupIcon />
                            </Badge>
                          </TableCell>
                          <TableCell align="center">
                            {getStatusChip(group)}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="textSecondary">
                              {group.description || group.Description || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Configure Group">
                              <IconButton
                                color="primary"
                                onClick={() => openConfigureDialog(group)}
                                size="small"
                              >
                                <SettingsIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Old Material-UI Dialog removed - using Portal Modal below */}


      {/* Custom Modal Overlay - Using Portal to escape table DOM */}
      {configDialog.open && (
        <ModalPortal>
          <div style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundColor: 'rgba(0,0,0,0.8)',
            zIndex: 9999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'auto'
          }}>
            <div style={{
              backgroundColor: 'white',
              border: '4px solid #1976d2',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '600px',
              minWidth: '400px',
              padding: '30px',
              boxSizing: 'border-box',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              margin: '20px auto'
            }}>
              {/* Close Button */}
              <button 
                onClick={closeConfigureDialog}
                style={{
                  position: 'absolute',
                  top: '15px',
                  right: '15px',
                  background: 'transparent',
                  border: 'none',
                  fontSize: '20px',
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

              {/* Modal Content (reuse existing HTML) */}
              <h2 style={{ 
                color: '#1976d2', 
                margin: '0 0 20px 0',
                fontSize: '22px',
                borderBottom: '2px solid #1976d2',
                paddingBottom: '10px'
              }}>
                ⚙️ Configure Group: {configDialog.group?.name || 'Unknown'}
              </h2>
              {/* Group Name */}
              <label style={{ fontWeight: 'bold' }}>Group Name:</label>
              <input
                type="text"
                value={configDialog.data.name}
                onChange={(e) => setConfigDialog(prev => ({ ...prev, data: { ...prev.data, name: e.target.value } }))}
                style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '2px solid #1976d2', borderRadius: '4px' }}
              />
              {/* Description */}
              <label style={{ fontWeight: 'bold' }}>Description:</label>
              <textarea
                value={configDialog.data.description}
                onChange={(e) => setConfigDialog(prev => ({ ...prev, data: { ...prev.data, description: e.target.value } }))}
                style={{ width: '100%', padding: '10px', height: '80px', marginBottom: '15px', border: '2px solid #1976d2', borderRadius: '4px' }}
              />
              {/* Active Toggle */}
              <label style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={configDialog.data.isActive}
                  onChange={(e) => setConfigDialog(prev => ({ ...prev, data: { ...prev.data, isActive: e.target.checked } }))}
                  style={{ marginRight: '10px', transform: 'scale(1.3)' }}
                />
                Group Active
              </label>
              {/* Info */}
              <div style={{ backgroundColor: '#e3f2fd', padding: '10px', border: '1px solid #1976d2', borderRadius: '4px', marginBottom: '15px', fontSize: '14px' }}>
                <strong>WhatsApp ID:</strong> {configDialog.group?.id}<br/>
                <strong>Participants:</strong> {configDialog.group?.participantCount || 0}
              </div>
              {/* Buttons */}
              <div style={{ textAlign: 'right' }}>
                <button onClick={closeConfigureDialog} style={{ padding: '8px 16px', marginRight: '10px' }}>Cancel</button>
                <button onClick={saveGroupConfiguration} style={{ padding: '8px 16px', backgroundColor: '#1976d2', color: 'white' }}>Save</button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={closeSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default WhatsAppGroupsV2;