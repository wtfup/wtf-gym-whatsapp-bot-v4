import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Slider,
  Switch,
  Button,
  TextField,
  Alert,
  Chip,
  LinearProgress,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import {
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

const AIConfidenceManagement = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [confidenceThresholds, setConfidenceThresholds] = useState([]);
  const [routingAnalytics, setRoutingAnalytics] = useState({});
  const [editingThreshold, setEditingThreshold] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [thresholdsResponse, analyticsResponse] = await Promise.all([
        fetch('/api/ai-confidence-thresholds'),
        fetch('/api/routing-analytics')
      ]);

      if (thresholdsResponse.ok) {
        const thresholds = await thresholdsResponse.json();
        setConfidenceThresholds(thresholds.data || []);
      }

      if (analyticsResponse.ok) {
        const analytics = await analyticsResponse.json();
        setRoutingAnalytics(analytics.data || {});
      }
    } catch (error) {
      console.error('Error loading AI confidence data:', error);
      setNotification({ type: 'error', message: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  const handleThresholdUpdate = async (threshold) => {
    try {
      const response = await fetch(`/api/ai-confidence-thresholds/${threshold.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(threshold)
      });

      if (response.ok) {
        setNotification({ type: 'success', message: 'Confidence threshold updated successfully' });
        loadData();
      } else {
        setNotification({ type: 'error', message: 'Failed to update confidence threshold' });
      }
    } catch (error) {
      console.error('Error updating threshold:', error);
      setNotification({ type: 'error', message: 'Failed to update confidence threshold' });
    }
  };

  const handleSliderChange = (id, value) => {
    setConfidenceThresholds(prev => 
      prev.map(t => t.id === id ? { ...t, min_confidence_threshold: value } : t)
    );
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return '#4caf50';
    if (confidence >= 60) return '#ff9800';
    if (confidence >= 40) return '#f44336';
    return '#9e9e9e';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'routed': return '#4caf50';
      case 'failed': return '#f44336';
      case 'skipped': return '#ff9800';
      case 'no_match': return '#9e9e9e';
      default: return '#9e9e9e';
    }
  };

  const TabPanel = ({ children, value, index }) => {
    return (
      <div role="tabpanel" hidden={value !== index}>
        {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
      </div>
    );
  };

  const renderThresholdManagement = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          AI Confidence Thresholds by Category
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          Messages with AI confidence below the threshold will be skipped for routing
        </Alert>
      </Grid>

      {confidenceThresholds.map((threshold) => (
        <Grid item xs={12} md={6} key={threshold.id}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">{threshold.category_name}</Typography>
                <Chip 
                  label={threshold.department} 
                  size="small"
                  sx={{ bgcolor: threshold.color_code || '#1976d2', color: 'white' }}
                />
              </Box>

              <Box mb={2}>
                <Typography gutterBottom>
                  Minimum Confidence: {threshold.min_confidence_threshold}%
                </Typography>
                <Slider
                  value={threshold.min_confidence_threshold}
                  onChange={(e, value) => handleSliderChange(threshold.id, value)}
                  onChangeCommitted={(e, value) => handleThresholdUpdate({
                    ...threshold,
                    min_confidence_threshold: value
                  })}
                  min={0}
                  max={100}
                  valueLabelDisplay="auto"
                  sx={{ color: getConfidenceColor(threshold.min_confidence_threshold) }}
                />
              </Box>

              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Switch
                  checked={threshold.is_active}
                  onChange={(e) => handleThresholdUpdate({
                    ...threshold,
                    is_active: e.target.checked
                  })}
                  color="primary"
                />
                <Typography variant="body2" color="text.secondary">
                  {threshold.is_active ? 'Active' : 'Inactive'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderAnalytics = () => (
    <Grid container spacing={3}>
      {/* Overall Performance */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <AnalyticsIcon sx={{ mr: 1 }} />
              Overall Performance
            </Typography>
            {routingAnalytics.overall && (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Success Rate</Typography>
                  <Typography variant="h4">
                    {routingAnalytics.overall.total_attempts > 0 
                      ? Math.round((routingAnalytics.overall.successful_routes / routingAnalytics.overall.total_attempts) * 100)
                      : 0}%
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Avg Confidence</Typography>
                  <Typography variant="h4">
                    {Math.round(routingAnalytics.overall.avg_confidence || 0)}%
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Total Attempts</Typography>
                  <Typography variant="h4">
                    {routingAnalytics.overall.total_attempts || 0}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Avg Processing</Typography>
                  <Typography variant="h4">
                    {Math.round(routingAnalytics.overall.avg_processing_time || 0)}ms
                  </Typography>
                </Grid>
              </Grid>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Confidence Distribution */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <TrendingUpIcon sx={{ mr: 1 }} />
              Confidence Distribution
            </Typography>
            {routingAnalytics.confidence_distribution && (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={routingAnalytics.confidence_distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {routingAnalytics.confidence_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getConfidenceColor(entry.confidence_range)} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Category Performance */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <SpeedIcon sx={{ mr: 1 }} />
              Category Performance
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell align="right">Total Attempts</TableCell>
                    <TableCell align="right">Success Rate</TableCell>
                    <TableCell align="right">Avg Confidence</TableCell>
                    <TableCell align="right">Avg Processing</TableCell>
                    <TableCell>Match Methods</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(routingAnalytics.by_category || []).map((category) => (
                    <TableRow key={category.category_name}>
                      <TableCell>{category.category_name}</TableCell>
                      <TableCell>
                        <Chip 
                          label={category.department} 
                          size="small"
                          sx={{ bgcolor: category.color_code || '#1976d2', color: 'white' }}
                        />
                      </TableCell>
                      <TableCell align="right">{category.total_attempts}</TableCell>
                      <TableCell align="right">
                        {category.total_attempts > 0 
                          ? Math.round((category.successful_routes / category.total_attempts) * 100)
                          : 0}%
                      </TableCell>
                      <TableCell align="right">
                        <Box display="flex" alignItems="center">
                          <LinearProgress 
                            variant="determinate" 
                            value={category.avg_confidence || 0} 
                            sx={{ width: 60, mr: 1 }}
                          />
                          {Math.round(category.avg_confidence || 0)}%
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        {Math.round(category.avg_processing_time || 0)}ms
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          {category.entity_matches > 0 && (
                            <Chip label={`E: ${category.entity_matches}`} size="small" />
                          )}
                          {category.intent_matches > 0 && (
                            <Chip label={`I: ${category.intent_matches}`} size="small" />
                          )}
                          {category.keyword_matches > 0 && (
                            <Chip label={`K: ${category.keyword_matches}`} size="small" />
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        <SecurityIcon sx={{ mr: 2 }} />
        AI Confidence Management
      </Typography>

      {notification && (
        <Alert 
          severity={notification.type} 
          onClose={() => setNotification(null)}
          sx={{ mb: 2 }}
        >
          {notification.message}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Confidence Thresholds" />
          <Tab label="Performance Analytics" />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        {renderThresholdManagement()}
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        {renderAnalytics()}
      </TabPanel>
    </Box>
  );
};

export default AIConfidenceManagement; 