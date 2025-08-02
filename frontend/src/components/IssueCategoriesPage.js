import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress, 
  Button, 
  Chip, 
  Select, 
  MenuItem, 
  Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  WhatsApp as WhatsAppIcon,
  Link as LinkIcon,
  Settings as SettingsIcon,
  Group as GroupIcon,
  NotificationsActive as NotificationsIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const BRAND_COLORS = {
  red: '#E50012',
  green: '#2E7D32',
  darkGray: '#333333',
  mediumGray: '#6B7280',
  lightGray: '#F9FAFB',
  white: '#FFFFFF',
  blue: '#2563EB',
  yellow: '#F59E42',
  border: 'rgba(0, 0, 0, 0.08)'
};

const ChartContainer = styled(Paper)(({ theme }) => ({
  padding: 24,
  borderRadius: 16,
  marginBottom: 32,
  boxShadow: `0 2px 8px ${BRAND_COLORS.border}`,
  background: BRAND_COLORS.white
}));

const CategoryCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  boxShadow: `0 2px 8px ${BRAND_COLORS.border}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: `0 4px 16px ${BRAND_COLORS.border}`,
    transform: 'translateY(-2px)'
  }
}));

const IssueCategoriesPage = () => {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [whatsappGroups, setWhatsappGroups] = useState([]);
  const [routingRules, setRoutingRules] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [trendData, setTrendData] = useState([]);
  
  // Modal state
  const [mappingDialogOpen, setMappingDialogOpen] = useState(false);
  const [selectedCategoryForMapping, setSelectedCategoryForMapping] = useState(null);
  const [selectedWhatsAppGroup, setSelectedWhatsAppGroup] = useState('');
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [categoriesRes, groupsRes, rulesRes] = await Promise.all([
        axios.get('/api/issue-categories'),
        axios.get('/api/whatsapp-groups'),
        axios.get('/api/whatsapp-routing-rules')
      ]);
      
      setCategories(categoriesRes.data);
      setWhatsappGroups(groupsRes.data.groups || []);
      setRoutingRules(rulesRes.data.rules || []);
      
      // Prepare trend data for chart
      setTrendData(categoriesRes.data.map(c => ({ 
        category: c.name, 
        count: c.count,
        open_count: c.open_count,
        high_count: c.high_count
      })));
    } catch (error) {
      console.error('Error fetching data:', error);
      showSnackbar('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenMappingDialog = (category) => {
    setSelectedCategoryForMapping(category);
    const existingRule = routingRules.find(rule => rule.category_id === category.id);
    setSelectedWhatsAppGroup(existingRule?.whatsapp_group_id || '');
    setMappingDialogOpen(true);
  };

  const handleSaveMapping = async () => {
    if (!selectedCategoryForMapping || !selectedWhatsAppGroup) {
      showSnackbar('Please select a WhatsApp group', 'error');
      return;
    }

    try {
      const existingRule = routingRules.find(rule => rule.category_id === selectedCategoryForMapping.id);
      
      if (existingRule) {
        // Update existing rule
        await axios.put(`/api/whatsapp-routing-rules/${existingRule.id}`, {
          categoryId: selectedCategoryForMapping.id,
          whatsappGroupId: selectedWhatsAppGroup,
          severityFilter: ['low', 'medium', 'high'],
          isActive: true
        });
        showSnackbar('WhatsApp group mapping updated successfully');
      } else {
        // Create new rule
        await axios.post('/api/whatsapp-routing-rules', {
          categoryId: selectedCategoryForMapping.id,
          whatsappGroupId: selectedWhatsAppGroup,
          severityFilter: ['low', 'medium', 'high'],
          isActive: true
        });
        showSnackbar('WhatsApp group mapping created successfully');
      }
      
      setMappingDialogOpen(false);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error saving mapping:', error);
      showSnackbar('Failed to save mapping', 'error');
    }
  };

  const getMappedGroup = (categoryId) => {
    const rule = routingRules.find(rule => rule.category_id === categoryId);
    if (rule) {
      const group = whatsappGroups.find(g => g.id === rule.group_id);
      return group ? { name: group.name, id: group.id } : null;
    }
    return null;
  };

  const handleRemoveMapping = async (categoryId) => {
    const rule = routingRules.find(rule => rule.category_id === categoryId);
    if (rule) {
      try {
        await axios.delete(`/api/whatsapp-routing-rules/${rule.id}`);
        showSnackbar('WhatsApp group mapping removed successfully');
        fetchData(); // Refresh data
      } catch (error) {
        console.error('Error removing mapping:', error);
        showSnackbar('Failed to remove mapping', 'error');
      }
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return BRAND_COLORS.red;
      case 'medium': return BRAND_COLORS.yellow;
      case 'low': return BRAND_COLORS.green;
      default: return BRAND_COLORS.mediumGray;
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 6, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 800, color: BRAND_COLORS.red }}>
        Issue Categories & WhatsApp Mapping
      </Typography>

      {/* Filter Section */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Typography variant="h6">Filter by Category:</Typography>
        <Select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} displayEmpty>
          <MenuItem value="">All Categories</MenuItem>
          {(categories || []).map(c => <MenuItem key={c.id} value={c.name}>{c.name}</MenuItem>)}
        </Select>
      </Box>

      {/* Category Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {(categories || [])
          .filter(category => !selectedCategory || category.name === selectedCategory)
          .map((category) => {
            const mappedGroup = getMappedGroup(category.id);
            
            return (
              <Grid item xs={12} md={6} lg={4} key={category.id}>
                <CategoryCard>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {category.name}
                      </Typography>
                      <Chip 
                        label={category.department} 
                        size="small" 
                        sx={{ backgroundColor: category.color_code, color: 'white' }}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      <Chip label={`${category.count} Total`} size="small" variant="outlined" />
                      <Chip 
                        label={`${category.open_count} Open`} 
                        size="small" 
                        color="warning"
                        variant="outlined"
                      />
                      <Chip 
                        label={`${category.high_count} High Priority`} 
                        size="small" 
                        color="error"
                        variant="outlined"
                      />
                    </Box>

                    {mappedGroup && (
                      <Alert 
                        severity="success" 
                        sx={{ mb: 2 }}
                        action={
                          <IconButton
                            aria-label="remove"
                            color="inherit"
                            size="small"
                            onClick={() => handleRemoveMapping(category.id)}
                          >
                            <CloseIcon fontSize="inherit" />
                          </IconButton>
                        }
                      >
                        <Typography variant="body2">
                          <strong>Mapped to:</strong> {mappedGroup.name}
                        </Typography>
                      </Alert>
                    )}
                  </CardContent>
                  
                  <CardActions sx={{ justifyContent: 'space-between' }}>
                    <Button
                      startIcon={<WhatsAppIcon />}
                      variant={mappedGroup ? "outlined" : "contained"}
                      color={mappedGroup ? "secondary" : "primary"}
                      onClick={() => handleOpenMappingDialog(category)}
                    >
                      {mappedGroup ? 'Update Mapping' : 'Map to WhatsApp'}
                    </Button>
                    
                    {mappedGroup && (
                      <Tooltip title="Notifications will be sent to this group">
                        <NotificationsIcon color="success" />
                      </Tooltip>
                    )}
                  </CardActions>
                </CategoryCard>
              </Grid>
            );
          })}
      </Grid>

      {/* Chart Section */}
      <ChartContainer>
        <Typography variant="h6" sx={{ mb: 2 }}>Issue Counts by Category</Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={trendData.filter(d => !selectedCategory || d.category === selectedCategory)}>
            <XAxis dataKey="category" />
            <YAxis />
            <ChartTooltip />
            <Bar dataKey="count" fill={BRAND_COLORS.red} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Mapping Dialog */}
      <Dialog open={mappingDialogOpen} onClose={() => setMappingDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WhatsAppIcon />
          Map Category to WhatsApp Group
        </DialogTitle>
        <DialogContent>
          {selectedCategoryForMapping && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Category:</strong> {selectedCategoryForMapping.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Department:</strong> {selectedCategoryForMapping.department}
              </Typography>
            </Box>
          )}
          
          <FormControl fullWidth>
            <InputLabel>WhatsApp Group</InputLabel>
            <Select
              value={selectedWhatsAppGroup}
              onChange={(e) => setSelectedWhatsAppGroup(e.target.value)}
              label="WhatsApp Group"
            >
              <MenuItem value="">
                <em>Select a WhatsApp group</em>
              </MenuItem>
              {whatsappGroups.map((group) => (
                <MenuItem key={group.id} value={group.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GroupIcon fontSize="small" />
                    {group.name}
                    {group.description && (
                      <Typography variant="body2" color="text.secondary">
                        - {group.description}
                      </Typography>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            When issues are flagged for this category, notifications will be sent to the selected WhatsApp group.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMappingDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveMapping} variant="contained" startIcon={<LinkIcon />}>
            Save Mapping
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default IssueCategoriesPage; 