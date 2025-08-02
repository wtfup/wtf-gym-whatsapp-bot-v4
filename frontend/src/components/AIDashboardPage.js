import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, CardHeader, Button, Switch,
  TextField, Chip, Alert, CircularProgress, Tabs, Tab, FormControl,
  InputLabel, Select, MenuItem, Table, TableBody, TableCell, TableHead,
  TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Slider, FormControlLabel, Divider, Paper, List, ListItem, ListItemText,
  ListItemSecondaryAction, Badge, Tooltip
} from '@mui/material';
import {
  SmartToy as AIIcon,
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon,
  PlayArrow as TestIcon,
  Flag as FlagIcon,
  Tune as TuneIcon,
  Memory as MemoryIcon,
  Speed as SpeedIcon,
  Psychology as PsychologyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Info as InfoIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import axios from 'axios';

const BRAND_COLORS = {
  red: '#E50012',
  green: '#2E7D32',
  orange: '#FF9800',
  blue: '#1976D2',
  darkGray: '#333333',
  mediumGray: '#6B7280',
  lightGray: '#F9FAFB',
  white: '#FFFFFF',
  border: 'rgba(0, 0, 0, 0.08)',
  shadow: 'rgba(0, 0, 0, 0.1)'
};

const PageContainer = styled(Box)(({ theme }) => ({
  padding: '32px',
  maxWidth: '1600px',
  margin: '0 auto'
}));

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: '16px',
  boxShadow: `0 4px 20px ${BRAND_COLORS.shadow}`,
  border: `1px solid ${BRAND_COLORS.border}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 8px 30px ${BRAND_COLORS.shadow}`
  }
}));

const MetricCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  borderRadius: '16px',
  padding: '24px'
}));

const TestCard = styled(Card)(({ theme }) => ({
  border: `2px solid ${BRAND_COLORS.blue}`,
  borderRadius: '16px',
  background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)'
}));

const AIDashboardPage = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiConfig, setAiConfig] = useState({});
  const [aiAnalytics, setAiAnalytics] = useState({});
  const [testMessage, setTestMessage] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [customKeywords, setCustomKeywords] = useState([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [keywordCategory, setKeywordCategory] = useState('complaints');
  const [bulkAnalyzeDialog, setBulkAnalyzeDialog] = useState(false);
  const [bulkAnalyzeResults, setBulkAnalyzeResults] = useState(null);

  useEffect(() => {
    fetchAIData();
  }, []);

  const fetchAIData = async () => {
    setLoading(true);
    try {
      const [configRes, analyticsRes] = await Promise.all([
        axios.get('/api/ai/config'),
        axios.get('/api/ai/analytics')
      ]);
      
      setAiConfig(configRes.data);
      setAiAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Error fetching AI data:', error);
      setAlert({ type: 'error', message: 'Failed to load AI data' });
    } finally {
      setLoading(false);
    }
  };

  const saveAIConfig = async (newConfig) => {
    setSaving(true);
    try {
      await axios.post('/api/ai/config', newConfig);
      setAiConfig(prev => ({ ...prev, config: { ...prev.config, ...newConfig } }));
      setAlert({ type: 'success', message: 'AI configuration saved successfully!' });
    } catch (error) {
      console.error('Error saving AI config:', error);
      setAlert({ type: 'error', message: 'Failed to save AI configuration' });
    } finally {
      setSaving(false);
    }
  };

  const testAIAnalysis = async () => {
    if (!testMessage.trim()) {
      setAlert({ type: 'warning', message: 'Please enter a message to analyze' });
      return;
    }

    setTestLoading(true);
    try {
      const response = await axios.post('/api/ai/analyze', {
        message: testMessage,
        messageData: { test: true }
      });
      setTestResult(response.data);
      setAlert({ type: 'success', message: 'AI analysis completed!' });
    } catch (error) {
      console.error('Error testing AI analysis:', error);
      setAlert({ type: 'error', message: 'Failed to analyze message' });
    } finally {
      setTestLoading(false);
    }
  };

  const bulkAnalyzeMessages = async () => {
    try {
      // Get recent unanalyzed messages
      const messagesRes = await axios.get('/api/messages?limit=100');
      const unanalyzedMessages = messagesRes.data.filter(msg => !msg.sentiment);
      
      if (unanalyzedMessages.length === 0) {
        setAlert({ type: 'info', message: 'No unanalyzed messages found' });
        return;
      }

      const messageIds = unanalyzedMessages.map(msg => msg.id);
      const response = await axios.post('/api/ai/analyze-bulk', { messageIds });
      
      setBulkAnalyzeResults(response.data);
      setAlert({ type: 'success', message: `Bulk analysis completed: ${response.data.analyzed} messages analyzed, ${response.data.flagged} flagged` });
    } catch (error) {
      console.error('Error bulk analyzing messages:', error);
      setAlert({ type: 'error', message: 'Failed to bulk analyze messages' });
    }
  };

  const addCustomKeyword = () => {
    if (!newKeyword.trim()) return;
    
    const keyword = {
      id: Date.now(),
      word: newKeyword.trim(),
      category: keywordCategory,
      weight: 1.0,
      active: true
    };
    
    setCustomKeywords(prev => [...prev, keyword]);
    setNewKeyword('');
    setAlert({ type: 'success', message: 'Keyword added successfully!' });
  };

  const removeCustomKeyword = (keywordId) => {
    setCustomKeywords(prev => prev.filter(k => k.id !== keywordId));
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return BRAND_COLORS.green;
      case 'negative': return BRAND_COLORS.red;
      case 'neutral': return BRAND_COLORS.mediumGray;
      default: return BRAND_COLORS.mediumGray;
    }
  };

  const getIntentColor = (intent) => {
    switch (intent?.toLowerCase()) {
      case 'complaint': return BRAND_COLORS.red;
      case 'question': return BRAND_COLORS.blue;
      case 'booking': return BRAND_COLORS.green;
      case 'general': return BRAND_COLORS.mediumGray;
      default: return BRAND_COLORS.mediumGray;
    }
  };

  const getFlagTypeColor = (flagType) => {
    switch (flagType?.toLowerCase()) {
      case 'high': return BRAND_COLORS.red;
      case 'medium': return BRAND_COLORS.orange;
      case 'low': return BRAND_COLORS.green;
      default: return BRAND_COLORS.mediumGray;
    }
  };

  const renderConfigurationTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <StyledCard>
          <CardHeader
            title="AI Analysis Settings"
            avatar={<SettingsIcon color="primary" />}
          />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={aiConfig.config?.enableSentimentAnalysis || false}
                      onChange={(e) => saveAIConfig({ enableSentimentAnalysis: e.target.checked })}
                    />
                  }
                  label="Enable Sentiment Analysis"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={aiConfig.config?.enableIntentDetection || false}
                      onChange={(e) => saveAIConfig({ enableIntentDetection: e.target.checked })}
                    />
                  }
                  label="Enable Intent Detection"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={aiConfig.config?.enableEntityExtraction || false}
                      onChange={(e) => saveAIConfig({ enableEntityExtraction: e.target.checked })}
                    />
                  }
                  label="Enable Entity Extraction"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={aiConfig.config?.debugMode || false}
                      onChange={(e) => saveAIConfig({ debugMode: e.target.checked })}
                    />
                  }
                  label="Debug Mode"
                />
              </Grid>
            </Grid>
          </CardContent>
        </StyledCard>
      </Grid>

      <Grid item xs={12} md={6}>
        <StyledCard>
          <CardHeader
            title="Flagging Thresholds"
            avatar={<TuneIcon color="primary" />}
          />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography gutterBottom>Sentiment Threshold</Typography>
                <Slider
                  value={aiConfig.config?.sentimentThreshold || 0.6}
                  onChange={(e, value) => saveAIConfig({ sentimentThreshold: value })}
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  marks
                  valueLabelDisplay="auto"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography gutterBottom>Confidence Threshold</Typography>
                <Slider
                  value={aiConfig.config?.confidenceThreshold || 0.7}
                  onChange={(e, value) => saveAIConfig({ confidenceThreshold: value })}
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  marks
                  valueLabelDisplay="auto"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography gutterBottom>Flagging Threshold</Typography>
                <Slider
                  value={aiConfig.config?.flaggingThreshold || 0.8}
                  onChange={(e, value) => saveAIConfig({ flaggingThreshold: value })}
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  marks
                  valueLabelDisplay="auto"
                />
              </Grid>
            </Grid>
          </CardContent>
        </StyledCard>
      </Grid>

      <Grid item xs={12}>
        <StyledCard>
          <CardHeader
            title="Custom Keywords"
            avatar={<PsychologyIcon color="primary" />}
            action={
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setBulkAnalyzeDialog(true)}
              >
                Bulk Analyze
              </Button>
            }
          />
          <CardContent>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="New Keyword"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCustomKeyword()}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={keywordCategory}
                    onChange={(e) => setKeywordCategory(e.target.value)}
                  >
                    <MenuItem value="complaints">Complaints</MenuItem>
                    <MenuItem value="equipment">Equipment</MenuItem>
                    <MenuItem value="facilities">Facilities</MenuItem>
                    <MenuItem value="staff">Staff</MenuItem>
                    <MenuItem value="membership">Membership</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={addCustomKeyword}
                  sx={{ height: '56px' }}
                >
                  Add
                </Button>
              </Grid>
            </Grid>

            <List>
              {customKeywords.map((keyword) => (
                <ListItem key={keyword.id}>
                  <ListItemText
                    primary={keyword.word}
                    secondary={`Category: ${keyword.category}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => removeCustomKeyword(keyword.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </StyledCard>
      </Grid>
    </Grid>
  );

  const renderAnalyticsTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <MetricCard>
          <Box display="flex" alignItems="center" mb={2}>
            <PsychologyIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Total Analyzed</Typography>
          </Box>
          <Typography variant="h3">{aiAnalytics.confidence?.total_analyzed || 0}</Typography>
          <Typography variant="body2">Messages processed</Typography>
        </MetricCard>
      </Grid>

      <Grid item xs={12} md={3}>
        <MetricCard>
          <Box display="flex" alignItems="center" mb={2}>
            <SpeedIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Avg Confidence</Typography>
          </Box>
          <Typography variant="h3">
            {Math.round((aiAnalytics.confidence?.avg_confidence || 0) * 100)}%
          </Typography>
          <Typography variant="body2">Analysis accuracy</Typography>
        </MetricCard>
      </Grid>

      <Grid item xs={12} md={3}>
        <MetricCard>
          <Box display="flex" alignItems="center" mb={2}>
            <FlagIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Flagged Messages</Typography>
          </Box>
          <Typography variant="h3">
            {aiAnalytics.flagging?.reduce((sum, item) => sum + parseInt(item.count), 0) || 0}
          </Typography>
          <Typography variant="body2">Requiring attention</Typography>
        </MetricCard>
      </Grid>

      <Grid item xs={12} md={3}>
        <MetricCard>
          <Box display="flex" alignItems="center" mb={2}>
            <TrendingUpIcon sx={{ mr: 1 }} />
            <Typography variant="h6">System Health</Typography>
          </Box>
          <Typography variant="h3">98%</Typography>
          <Typography variant="body2">Overall performance</Typography>
        </MetricCard>
      </Grid>

      <Grid item xs={12} md={6}>
        <StyledCard>
          <CardHeader title="Sentiment Distribution" />
          <CardContent>
            {aiAnalytics.sentiment?.map((item) => (
              <Box key={item.sentiment} display="flex" alignItems="center" mb={2}>
                <Chip
                  label={item.sentiment}
                  sx={{
                    backgroundColor: getSentimentColor(item.sentiment),
                    color: 'white',
                    mr: 2,
                    minWidth: 80
                  }}
                />
                <Typography variant="body1" sx={{ flexGrow: 1 }}>
                  {item.count} messages
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {Math.round((item.count / (aiAnalytics.confidence?.total_analyzed || 1)) * 100)}%
                </Typography>
              </Box>
            ))}
          </CardContent>
        </StyledCard>
      </Grid>

      <Grid item xs={12} md={6}>
        <StyledCard>
          <CardHeader title="Intent Distribution" />
          <CardContent>
            {aiAnalytics.intent?.map((item) => (
              <Box key={item.intent} display="flex" alignItems="center" mb={2}>
                <Chip
                  label={item.intent}
                  sx={{
                    backgroundColor: getIntentColor(item.intent),
                    color: 'white',
                    mr: 2,
                    minWidth: 80
                  }}
                />
                <Typography variant="body1" sx={{ flexGrow: 1 }}>
                  {item.count} messages
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {Math.round((item.count / (aiAnalytics.confidence?.total_analyzed || 1)) * 100)}%
                </Typography>
              </Box>
            ))}
          </CardContent>
        </StyledCard>
      </Grid>

      <Grid item xs={12}>
        <StyledCard>
          <CardHeader title="Flagging Analysis" />
          <CardContent>
            <Grid container spacing={2}>
              {aiAnalytics.flagging?.map((item) => (
                <Grid item xs={12} md={4} key={item.flag_type}>
                  <Box
                    sx={{
                      p: 2,
                      border: `2px solid ${getFlagTypeColor(item.flag_type)}`,
                      borderRadius: 2,
                      textAlign: 'center'
                    }}
                  >
                    <Typography variant="h4" color={getFlagTypeColor(item.flag_type)}>
                      {item.count}
                    </Typography>
                    <Typography variant="h6" textTransform="capitalize">
                      {item.flag_type} Priority
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </StyledCard>
      </Grid>
    </Grid>
  );

  const renderTestingTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <TestCard>
          <CardHeader
            title="AI Analysis Testing"
            avatar={<TestIcon color="primary" />}
          />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Enter message to analyze"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="e.g., The treadmill is broken and the gym is very dirty today"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Box display="flex" flexDirection="column" height="100%">
                  <Button
                    variant="contained"
                    size="large"
                    onClick={testAIAnalysis}
                    disabled={testLoading}
                    startIcon={testLoading ? <CircularProgress size={20} /> : <TestIcon />}
                    sx={{ mb: 2 }}
                  >
                    {testLoading ? 'Analyzing...' : 'Analyze Message'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setTestMessage('');
                      setTestResult(null);
                    }}
                  >
                    Clear
                  </Button>
                </Box>
              </Grid>
            </Grid>

            {testResult && (
              <Box mt={3}>
                <Divider sx={{ mb: 3 }} />
                <Typography variant="h6" gutterBottom>
                  Analysis Results
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Sentiment Analysis
                      </Typography>
                      <Chip
                        label={`${testResult.sentiment?.sentiment} (${Math.round(testResult.sentiment?.confidence * 100)}%)`}
                        sx={{
                          backgroundColor: getSentimentColor(testResult.sentiment?.sentiment),
                          color: 'white'
                        }}
                      />
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Intent Detection
                      </Typography>
                      <Chip
                        label={`${testResult.intent?.intent} (${Math.round(testResult.intent?.confidence * 100)}%)`}
                        sx={{
                          backgroundColor: getIntentColor(testResult.intent?.intent),
                          color: 'white'
                        }}
                      />
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Flagging Decision
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        {testResult.flagging?.shouldFlag ? (
                          <Chip
                            label={`FLAGGED (${testResult.flagging.flagType})`}
                            sx={{ backgroundColor: BRAND_COLORS.red, color: 'white' }}
                            icon={<FlagIcon />}
                          />
                        ) : (
                          <Chip
                            label="NOT FLAGGED"
                            sx={{ backgroundColor: BRAND_COLORS.green, color: 'white' }}
                            icon={<CheckCircleIcon />}
                          />
                        )}
                      </Box>
                      {testResult.flagging?.flagReasons && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          Reasons: {testResult.flagging.flagReasons.join(', ')}
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Extracted Entities
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {testResult.entities?.map((entity, index) => (
                          <Chip
                            key={index}
                            label={`${entity.entity} (${entity.category})`}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                        {(!testResult.entities || testResult.entities.length === 0) && (
                          <Typography variant="body2" color="textSecondary">
                            No entities detected
                          </Typography>
                        )}
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}
          </CardContent>
        </TestCard>
      </Grid>
    </Grid>
  );

  if (loading) {
    return (
      <PageContainer>
        <Box display="flex" justifyContent="center" alignItems="center" height="400px">
          <CircularProgress size={60} />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          <AIIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          AI Control Dashboard
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Configure and monitor your AI analysis system
        </Typography>
      </Box>

      {alert && (
        <Alert 
          severity={alert.type} 
          onClose={() => setAlert(null)}
          sx={{ mb: 3 }}
        >
          {alert.message}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
          <Tab icon={<SettingsIcon />} label="Configuration" />
          <Tab icon={<AnalyticsIcon />} label="Analytics" />
          <Tab icon={<TestIcon />} label="Testing" />
        </Tabs>
      </Box>

      {currentTab === 0 && renderConfigurationTab()}
      {currentTab === 1 && renderAnalyticsTab()}
      {currentTab === 2 && renderTestingTab()}

      {/* Bulk Analyze Dialog */}
      <Dialog open={bulkAnalyzeDialog} onClose={() => setBulkAnalyzeDialog(false)}>
        <DialogTitle>Bulk Analyze Messages</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            This will analyze all recent messages that haven't been processed by AI yet.
            This may take a few minutes.
          </Typography>
          {bulkAnalyzeResults && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Analysis complete: {bulkAnalyzeResults.analyzed} messages analyzed, {bulkAnalyzeResults.flagged} flagged
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkAnalyzeDialog(false)}>Cancel</Button>
          <Button onClick={bulkAnalyzeMessages} variant="contained">
            Start Analysis
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default AIDashboardPage; 