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
  Tabs,
  Tab,
  LinearProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Analytics as AnalyticsIcon,
  Category as CategoryIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

// Brand colors for consistency
const BRAND_COLORS = {
  primary: '#1976d2',
  secondary: '#dc004e',
  success: '#2e7d32',
  warning: '#ed6c02',
  error: '#d32f2f',
  info: '#0288d1'
};

const CATEGORY_COLORS = {
  INSTRUCTION: BRAND_COLORS.info,
  ESCALATION: BRAND_COLORS.warning,
  COMPLAINT: BRAND_COLORS.error,
  URGENT: BRAND_COLORS.secondary,
  CASUAL: BRAND_COLORS.success
};

const AdvancedCategorizationPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [categorySummary, setCategorySummary] = useState({});
  const [categoryRules, setCategoryRules] = useState([]);
  const [keywordLibrary, setKeywordLibrary] = useState({});
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  const [configDialog, setConfigDialog] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [newRule, setNewRule] = useState({
    category: '',
    name: '',
    keywords: '',
    confidence_threshold: 0.7,
    is_active: true,
    priority: 'medium'
  });

  useEffect(() => {
    loadCategorizationData();
  }, []);

  const loadCategorizationData = async () => {
    setLoading(true);
    try {
      const [summaryRes, rulesRes, keywordsRes, metricsRes] = await Promise.all([
        fetch('/api/categorization/summary'),
        fetch('/api/categorization/rules'),
        fetch('/api/categorization/keywords'),
        fetch('/api/categorization/performance')
      ]);

      const [summary, rules, keywords, metrics] = await Promise.all([
        summaryRes.json(),
        rulesRes.json(), 
        keywordsRes.json(),
        metricsRes.json()
      ]);

      setCategorySummary(summary);
      setCategoryRules(rules);
      setKeywordLibrary(keywords);
      setPerformanceMetrics(metrics);
    } catch (error) {
      console.error('Failed to load categorization data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRule = async () => {
    try {
      const method = selectedRule ? 'PUT' : 'POST';
      const url = selectedRule ? 
        `/api/categorization/rules/${selectedRule.id}` : 
        '/api/categorization/rules';

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule)
      });

      setConfigDialog(false);
      setSelectedRule(null);
      setNewRule({
        category: '',
        name: '',
        keywords: '',
        confidence_threshold: 0.7,
        is_active: true,
        priority: 'medium'
      });
      loadCategorizationData();
    } catch (error) {
      console.error('Failed to save rule:', error);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (window.confirm('Are you sure you want to delete this rule?')) {
      try {
        await fetch(`/api/categorization/rules/${ruleId}`, {
          method: 'DELETE'
        });
        loadCategorizationData();
      } catch (error) {
        console.error('Failed to delete rule:', error);
      }
    }
  };

  const exportConfiguration = () => {
    const config = {
      category_rules: categoryRules,
      keyword_library: keywordLibrary,
      export_timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `categorization-config-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  // Category Summary Tab
  const CategorySummaryTab = () => (
    <Grid container spacing={3}>
      {/* Category Distribution Chart */}
      <Grid item xs={12} md={6}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <CategoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Category Distribution (Last 30 Days)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categorySummary.distribution || []}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ category, percentage }) => `${category}: ${percentage}%`}
                >
                  {(categorySummary.distribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.category] || BRAND_COLORS.info} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Performance Metrics */}
      <Grid item xs={12} md={6}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <AnalyticsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Categorization Performance
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Overall Accuracy
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(performanceMetrics.overall_accuracy || 0) * 100} 
                sx={{ height: 8, borderRadius: 4, mb: 2 }}
              />
              <Typography variant="h6">
                {((performanceMetrics.overall_accuracy || 0) * 100).toFixed(1)}%
              </Typography>
            </Box>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Confidence Score Average
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(performanceMetrics.avg_confidence || 0) * 100} 
                color="secondary"
                sx={{ height: 8, borderRadius: 4, mb: 2 }}
              />
              <Typography variant="h6">
                {((performanceMetrics.avg_confidence || 0) * 100).toFixed(1)}%
              </Typography>
            </Box>

            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Total Messages
                </Typography>
                <Typography variant="h6">
                  {(performanceMetrics.total_messages || 0).toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Auto-Categorized
                </Typography>
                <Typography variant="h6">
                  {(performanceMetrics.auto_categorized || 0).toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Recent Trends */}
      <Grid item xs={12}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Categorization Trends (Last 7 Days)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceMetrics.daily_trends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip />
                <Line 
                  type="monotone" 
                  dataKey="INSTRUCTION" 
                  stroke={CATEGORY_COLORS.INSTRUCTION} 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="COMPLAINT" 
                  stroke={CATEGORY_COLORS.COMPLAINT} 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="ESCALATION" 
                  stroke={CATEGORY_COLORS.ESCALATION} 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="URGENT" 
                  stroke={CATEGORY_COLORS.URGENT} 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="CASUAL" 
                  stroke={CATEGORY_COLORS.CASUAL} 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Category Rules Management Tab
  const CategoryRulesTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6">
          Category Rules Management
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportConfiguration}
            sx={{ mr: 2 }}
          >
            Export Config
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedRule(null);
              setConfigDialog(true);
            }}
          >
            Add Rule
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Category</TableCell>
              <TableCell>Rule Name</TableCell>
              <TableCell>Keywords</TableCell>
              <TableCell>Confidence</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categoryRules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell>
                  <Chip 
                    label={rule.category}
                    color={rule.category === 'URGENT' ? 'error' : 
                           rule.category === 'ESCALATION' ? 'warning' :
                           rule.category === 'COMPLAINT' ? 'warning' :
                           rule.category === 'INSTRUCTION' ? 'info' : 'success'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{rule.name}</TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                    {rule.keywords?.substring(0, 50)}...
                  </Typography>
                </TableCell>
                <TableCell>{(rule.confidence_threshold * 100).toFixed(0)}%</TableCell>
                <TableCell>
                  <Chip 
                    label={rule.priority}
                    color={rule.priority === 'high' ? 'error' : 
                           rule.priority === 'medium' ? 'warning' : 'default'}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={rule.is_active ? 'Active' : 'Inactive'}
                    color={rule.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title="Edit Rule">
                    <IconButton 
                      size="small"
                      onClick={() => {
                        setSelectedRule(rule);
                        setNewRule({...rule, keywords: rule.keywords || ''});
                        setConfigDialog(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Rule">
                    <IconButton 
                      size="small"
                      color="error"
                      onClick={() => handleDeleteRule(rule.id)}
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
  );

  // Keyword Library Tab
  const KeywordLibraryTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Multilingual Keyword Library
      </Typography>
      <Alert severity="info" sx={{ mb: 3 }}>
        Comprehensive keyword dictionary supporting English, Hindi, and Hinglish patterns for gym-specific categorization.
      </Alert>
      
      {Object.keys(keywordLibrary).map((category) => (
        <Accordion key={category} sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">
              <Chip 
                label={category.toUpperCase()}
                color={CATEGORY_COLORS[category.toUpperCase()] ? 'primary' : 'default'}
                sx={{ mr: 2 }}
              />
              {category} Keywords ({keywordLibrary[category]?.total || 0} total)
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom>
                  English Keywords
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(keywordLibrary[category]?.english || []).map((keyword, index) => (
                    <Chip key={index} label={keyword} size="small" variant="outlined" />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom>
                  Hindi Keywords
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(keywordLibrary[category]?.hindi || []).map((keyword, index) => (
                    <Chip key={index} label={keyword} size="small" variant="outlined" color="secondary" />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom>
                  Hinglish Patterns
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(keywordLibrary[category]?.hinglish || []).map((keyword, index) => (
                    <Chip key={index} label={keyword} size="small" variant="outlined" color="warning" />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          <CategoryIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Advanced Categorization Management
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadCategorizationData}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Loading */}
      {loading && <LinearProgress sx={{ mb: 3 }} />}

      {/* Main Content */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Category Summary" />
          <Tab label="Category Rules" />
          <Tab label="Keyword Library" />
        </Tabs>
      </Box>

      {activeTab === 0 && <CategorySummaryTab />}
      {activeTab === 1 && <CategoryRulesTab />}
      {activeTab === 2 && <KeywordLibraryTab />}

      {/* Rule Configuration Dialog */}
      <Dialog open={configDialog} onClose={() => setConfigDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedRule ? 'Edit Category Rule' : 'Add New Category Rule'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={newRule.category}
                  onChange={(e) => setNewRule({...newRule, category: e.target.value})}
                >
                  <MenuItem value="INSTRUCTION">🔧 INSTRUCTION</MenuItem>
                  <MenuItem value="ESCALATION">📢 ESCALATION</MenuItem>
                  <MenuItem value="COMPLAINT">⚠️ COMPLAINT</MenuItem>
                  <MenuItem value="URGENT">🚨 URGENT</MenuItem>
                  <MenuItem value="CASUAL">💬 CASUAL</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Rule Name"
                value={newRule.name}
                onChange={(e) => setNewRule({...newRule, name: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Keywords (comma-separated)"
                value={newRule.keywords}
                onChange={(e) => setNewRule({...newRule, keywords: e.target.value})}
                helperText="Enter keywords separated by commas. Supports English, Hindi, and Hinglish."
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Confidence Threshold"
                value={newRule.confidence_threshold}
                onChange={(e) => setNewRule({...newRule, confidence_threshold: parseFloat(e.target.value)})}
                inputProps={{ min: 0, max: 1, step: 0.1 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={newRule.priority}
                  onChange={(e) => setNewRule({...newRule, priority: e.target.value})}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newRule.is_active}
                    onChange={(e) => setNewRule({...newRule, is_active: e.target.checked})}
                  />
                }
                label="Active Rule"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveRule} variant="contained">
            {selectedRule ? 'Update' : 'Create'} Rule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdvancedCategorizationPage;