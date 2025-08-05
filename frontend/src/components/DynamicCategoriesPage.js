import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Button, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, IconButton, Grid, Card, CardContent, LinearProgress,
  Tabs, Tab, Alert, Tooltip
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  MergeType as MergeIcon,
  TrendingUp as TrendIcon,
  Visibility as ViewIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';

const DynamicCategoriesPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [dynamicCategories, setDynamicCategories] = useState([]);
  const [categoryTrends, setCategoryTrends] = useState([]);
  const [existingCategories, setExistingCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dialog states
  const [actionDialog, setActionDialog] = useState({ open: false, category: null, action: '' });
  const [viewDialog, setViewDialog] = useState({ open: false, category: null });
  const [mergeToCategory, setMergeToCategory] = useState('');
  const [approverName, setApproverName] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 🔥 FIX: Use correct issue categories API
      const categoriesResponse = await fetch('/api/issue-categories');
      const categoriesData = await categoriesResponse.json();
      
      // Backend returns array directly, not wrapped in success object
      if (Array.isArray(categoriesData)) {
        setDynamicCategories(categoriesData);
        setExistingCategories(categoriesData); // Same data for merge options
      } else if (categoriesData.success) {
        setDynamicCategories(categoriesData.categories || []);
        setExistingCategories(categoriesData.categories || []);
      }

      // Fetch category trends (optional - set empty if API doesn't exist)
      try {
        const trendsResponse = await fetch('/api/category-trends');
        const trendsData = await trendsResponse.json();
        
        if (trendsData.success) {
          setCategoryTrends(trendsData.trends);
        }
      } catch (error) {
        console.log('Category trends API not available, skipping...');
        setCategoryTrends([]);
      }

    } catch (error) {
      console.error('Error fetching dynamic categories:', error);
      setError('Failed to load dynamic categories');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (category, action) => {
    try {
      const requestBody = {
        approved_by: approverName || 'System Admin'
      };

      if (action === 'merge') {
        requestBody.merge_to_category_id = mergeToCategory;
      }

      const response = await fetch(`/api/dynamic-categories/${category.id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();
      
      if (result.success) {
        setActionDialog({ open: false, category: null, action: '' });
        setMergeToCategory('');
        setApproverName('');
        fetchData(); // Refresh data
      } else {
        setError(`Failed to ${action} category: ${result.error}`);
      }
    } catch (error) {
      console.error(`Error ${action}ing category:`, error);
      setError(`Failed to ${action} category`);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  const getTrendColor = (trendScore) => {
    if (trendScore >= 70) return 'error';
    if (trendScore >= 40) return 'warning';
    return 'info';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Dynamic Categories</Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🤖 Dynamic Category Detection
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        AI-powered system that automatically detects new issue categories from message patterns and trends
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label={`Pending Categories (${dynamicCategories.length})`} />
        <Tab label="Category Trends" />
        <Tab label="Analytics" />
      </Tabs>

      {/* Pending Categories Tab */}
      {activeTab === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Category Name</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Confidence</TableCell>
                <TableCell>Trend Score</TableCell>
                <TableCell>Messages</TableCell>
                <TableCell>First Detected</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dynamicCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <Typography variant="subtitle2">{category.category_name}</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      {JSON.parse(category.keywords || '[]').slice(0, 3).map((keyword, idx) => (
                        <Chip
                          key={idx}
                          label={keyword}
                          size="small"
                          variant="outlined"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={category.suggested_department || 'General'} 
                      size="small"
                      color="primary"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${Math.round(category.confidence_score * 100)}%`}
                      size="small"
                      color={getConfidenceColor(category.confidence_score)}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={Math.round(category.trend_score || 0)}
                      size="small"
                      color={getTrendColor(category.trend_score)}
                      icon={<TrendIcon />}
                    />
                  </TableCell>
                  <TableCell>{category.message_count}</TableCell>
                  <TableCell>{formatDate(category.first_detected)}</TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => setViewDialog({ open: true, category })}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Approve">
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => setActionDialog({ open: true, category, action: 'approve' })}
                      >
                        <ApproveIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Merge with Existing">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => setActionDialog({ open: true, category, action: 'merge' })}
                      >
                        <MergeIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Reject">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setActionDialog({ open: true, category, action: 'reject' })}
                      >
                        <RejectIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {dynamicCategories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No pending categories found. The AI will detect new patterns automatically.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Category Trends Tab */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          {(categoryTrends || []).length > 0 ? (categoryTrends || []).map((trend, idx) => (
            <Grid item xs={12} md={6} lg={4} key={idx}>
              <Card>
                <CardContent>
                  <Typography variant="h6">
                    {trend.category_name || trend.dynamic_category_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {trend.department}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Trend: <Chip 
                        label={trend.trend_direction} 
                        size="small"
                        color={trend.trend_direction === 'increasing' ? 'error' : 'info'}
                      />
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Change: {trend.trend_percentage?.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Messages: {trend.message_count}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )) : (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <AnalyticsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No trend data available yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Trends will appear as the system processes more messages
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* Analytics Tab */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Detection Summary</Typography>
                <Typography variant="h3" color="primary">
                  {dynamicCategories.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending Categories
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">High Confidence</Typography>
                <Typography variant="h3" color="success.main">
                  {dynamicCategories.filter(c => c.confidence_score >= 0.8).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ready for Approval
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Trending Issues</Typography>
                <Typography variant="h3" color="warning.main">
                  {dynamicCategories.filter(c => c.trend_score >= 50).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Emerging Patterns
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onClose={() => setActionDialog({ open: false, category: null, action: '' })}>
        <DialogTitle>
          {actionDialog.action === 'approve' && 'Approve Category'}
          {actionDialog.action === 'reject' && 'Reject Category'}
          {actionDialog.action === 'merge' && 'Merge Category'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Approver Name"
            fullWidth
            variant="outlined"
            value={approverName}
            onChange={(e) => setApproverName(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          {actionDialog.action === 'merge' && (
            <FormControl fullWidth>
              <InputLabel>Merge with Category</InputLabel>
              <Select
                value={mergeToCategory}
                onChange={(e) => setMergeToCategory(e.target.value)}
                label="Merge with Category"
              >
                {existingCategories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.category_name} ({category.department})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          
          <Typography variant="body2" sx={{ mt: 2 }}>
            Are you sure you want to {actionDialog.action} "{actionDialog.category?.category_name}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog({ open: false, category: null, action: '' })}>
            Cancel
          </Button>
          <Button 
            onClick={() => handleAction(actionDialog.category, actionDialog.action)}
            variant="contained"
            disabled={!approverName || (actionDialog.action === 'merge' && !mergeToCategory)}
          >
            {actionDialog.action === 'approve' && 'Approve'}
            {actionDialog.action === 'reject' && 'Reject'}
            {actionDialog.action === 'merge' && 'Merge'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={viewDialog.open} onClose={() => setViewDialog({ open: false, category: null })} maxWidth="md" fullWidth>
        <DialogTitle>Category Details</DialogTitle>
        <DialogContent>
          {viewDialog.category && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {viewDialog.category.category_name}
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Department:</Typography>
                  <Typography variant="body1">{viewDialog.category.suggested_department}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Confidence:</Typography>
                  <Typography variant="body1">{Math.round(viewDialog.category.confidence_score * 100)}%</Typography>
                </Grid>
              </Grid>

              <Typography variant="body2" color="text.secondary" gutterBottom>Keywords:</Typography>
              <Box sx={{ mb: 3 }}>
                {JSON.parse(viewDialog.category.keywords || '[]').map((keyword, idx) => (
                  <Chip key={idx} label={keyword} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                ))}
              </Box>

              <Typography variant="body2" color="text.secondary" gutterBottom>Sample Messages:</Typography>
              <Box>
                {JSON.parse(viewDialog.category.sample_messages || '[]').map((sample, idx) => (
                  <Paper key={idx} sx={{ p: 2, mb: 1, bgcolor: 'grey.50' }}>
                    <Typography variant="body2">"{sample.message}"</Typography>
                    <Typography variant="caption" color="text.secondary">
                      - {sample.sender} ({formatDate(sample.timestamp)})
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog({ open: false, category: null })}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DynamicCategoriesPage; 