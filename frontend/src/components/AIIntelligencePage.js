import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Chip, Button, Table, TableHead, TableBody,
  TableRow, TableCell, Switch, FormControlLabel, Slider, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Alert, CircularProgress,
  Tabs, Tab, Paper, Avatar, Badge, IconButton, Tooltip, LinearProgress, Accordion,
  AccordionSummary, AccordionDetails, List, ListItem, ListItemText, ListItemIcon
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Psychology as PsychologyIcon,
  Groups as GroupsIcon,
  Assignment as AssignmentIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayArrowIcon,
  School as SchoolIcon,
  Analytics as AnalyticsIcon,
  AutoFixHigh as AutoFixHighIcon
} from '@mui/icons-material';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from 'recharts';

// Brand colors
const BRAND_COLORS = {
  red: '#E50012',
  darkGray: '#374151',
  mediumGray: '#6B7280',
  lightGray: '#F9FAFB',
  white: '#FFFFFF',
  green: '#10B981',
  orange: '#F59E0B',
  blue: '#3B82F6'
};

const AIIntelligencePage = () => {
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [aiStats, setAIStats] = useState(null);
  const [dailyPerformance, setDailyPerformance] = useState([]);
  const [userProfiles, setUserProfiles] = useState([]);
  const [groupProfiles, setGroupProfiles] = useState([]);
  const [instructionLogs, setInstructionLogs] = useState([]);
  const [trainingHistory, setTrainingHistory] = useState([]);
  const [aiConfig, setAIConfig] = useState({});
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [learningStatus, setLearningStatus] = useState(null);
  const [alert, setAlert] = useState(null);

  // Fetch AI intelligence data
  const fetchAIData = async () => {
    try {
      setLoading(true);
      
      const [statsRes, performanceRes, usersRes, groupsRes, instructionsRes, trainingRes, statusRes] = await Promise.all([
        fetch('/api/ai/intelligence/stats'),
        fetch('/api/ai/intelligence/daily-performance'),
        fetch('/api/ai/intelligence/user-profiles'),
        fetch('/api/ai/intelligence/group-profiles'),
        fetch('/api/ai/intelligence/instruction-logs'),
        fetch('/api/ai/intelligence/training-history'),
        fetch('/api/ai/intelligence/learning-status')
      ]);
      
      const [stats, performance, users, groups, instructions, training, status] = await Promise.all([
        statsRes.json(),
        performanceRes.json(),
        usersRes.json(),
        groupsRes.json(),
        instructionsRes.json(),
        trainingRes.json(),
        statusRes.json()
      ]);
      
      setAIStats(stats);
      setDailyPerformance(performance);
      setUserProfiles(users);
      setGroupProfiles(groups);
      setInstructionLogs(instructions);
      setTrainingHistory(training);
      setLearningStatus(status);
      setAIConfig(stats.config || {});
      
    } catch (error) {
      console.error('Failed to fetch AI data:', error);
      setAlert('Failed to load AI intelligence data');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchAIData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchAIData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle manual learning trigger
  const triggerManualLearning = async () => {
    try {
      setAlert({ type: 'info', message: 'Starting manual learning cycle...' });
      
      const response = await fetch('/api/ai/intelligence/trigger-learning', { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        setAlert({ type: 'success', message: `Learning cycle completed in ${result.duration_minutes} minutes` });
        await fetchAIData(); // Refresh data
      } else {
        setAlert({ type: 'error', message: `Learning failed: ${result.error}` });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to trigger learning cycle' });
    }
  };

  // Handle configuration updates
  const updateAIConfig = async (newConfig) => {
    try {
      const response = await fetch('/api/ai/intelligence/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      
      if (response.ok) {
        setAlert({ type: 'success', message: 'AI configuration updated successfully' });
        setAIConfig({ ...aiConfig, ...newConfig });
        setConfigDialogOpen(false);
      } else {
        setAlert({ type: 'error', message: 'Failed to update configuration' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to update configuration' });
    }
  };

  // Export AI data
  const exportAIData = async (dataType) => {
    try {
      const response = await fetch(`/api/ai/intelligence/export/${dataType}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai_${dataType}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setAlert({ type: 'error', message: `Failed to export ${dataType} data` });
    }
  };

  // Get risk level color
  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'HIGH': return BRAND_COLORS.red;
      case 'MEDIUM': return BRAND_COLORS.orange;
      case 'LOW': return BRAND_COLORS.green;
      default: return BRAND_COLORS.mediumGray;
    }
  };

  // Get mood color
  const getMoodColor = (mood) => {
    switch (mood) {
      case 'HIGH_TENSION': return BRAND_COLORS.red;
      case 'MODERATE_TENSION': return BRAND_COLORS.orange;
      case 'STABLE': return BRAND_COLORS.green;
      default: return BRAND_COLORS.mediumGray;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading AI Intelligence Data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: BRAND_COLORS.darkGray, fontWeight: 700 }}>
          🧠 AI Intelligence Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchAIData}
            sx={{ color: BRAND_COLORS.darkGray }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<SchoolIcon />}
            onClick={triggerManualLearning}
            sx={{ backgroundColor: BRAND_COLORS.blue }}
          >
            Trigger Learning
          </Button>
        </Box>
      </Box>

      {/* Alert */}
      {alert && (
        <Alert 
          severity={alert.type} 
          onClose={() => setAlert(null)}
          sx={{ mb: 3 }}
        >
          {alert.message}
        </Alert>
      )}

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AnalyticsIcon sx={{ color: BRAND_COLORS.blue, mr: 1 }} />
                <Typography variant="h6">Daily Analysis</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: BRAND_COLORS.darkGray, mb: 1 }}>
                {aiStats?.daily_performance?.[0]?.total_analyzed || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Messages analyzed today
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, (aiStats?.daily_performance?.[0]?.total_analyzed || 0) / 100 * 100)}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PsychologyIcon sx={{ color: BRAND_COLORS.green, mr: 1 }} />
                <Typography variant="h6">AI Accuracy</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: BRAND_COLORS.darkGray, mb: 1 }}>
                {aiStats?.daily_performance?.[0]?.accuracy ? 
                  `${(aiStats.daily_performance[0].accuracy * 100).toFixed(1)}%` : 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Based on human feedback
              </Typography>
              <Chip 
                label={aiStats?.daily_performance?.[0]?.accuracy > 0.85 ? 'Excellent' : 'Needs Improvement'}
                color={aiStats?.daily_performance?.[0]?.accuracy > 0.85 ? 'success' : 'warning'}
                size="small"
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <GroupsIcon sx={{ color: BRAND_COLORS.orange, mr: 1 }} />
                <Typography variant="h6">Active Users</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: BRAND_COLORS.darkGray, mb: 1 }}>
                {aiStats?.total_users || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                User profiles tracked
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                {userProfiles.filter(u => u.risk_level === 'HIGH').length} high-risk users
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SchoolIcon sx={{ color: BRAND_COLORS.red, mr: 1 }} />
                <Typography variant="h6">Learning Status</Typography>
              </Box>
              <Typography variant="h6" sx={{ color: BRAND_COLORS.darkGray, mb: 1 }}>
                {learningStatus?.last_training?.success ? 'Active' : 'Error'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last training: {learningStatus?.last_training?.training_date || 'Never'}
              </Typography>
              <Chip 
                label={learningStatus?.enabled ? 'Enabled' : 'Disabled'}
                color={learningStatus?.enabled ? 'success' : 'error'}
                size="small"
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Paper sx={{ borderRadius: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="📊 Performance" />
          <Tab label="👥 User Behavior" />
          <Tab label="🏢 Group Analytics" />
          <Tab label="📋 Instruction Logs" />
          <Tab label="🛠️ Admin Controls" />
        </Tabs>

        {/* Tab 1: Performance Analytics */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 3, color: BRAND_COLORS.darkGray }}>
              AI Performance Analytics
            </Typography>

            {/* Performance Chart */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Daily AI Performance Trend</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="analysis_date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="total_analyzed" stroke={BRAND_COLORS.blue} name="Messages Analyzed" />
                    <Line type="monotone" dataKey="total_flagged" stroke={BRAND_COLORS.red} name="Messages Flagged" />
                    <Line type="monotone" dataKey="false_positives" stroke={BRAND_COLORS.orange} name="False Positives" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Category Distribution</Typography>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Instructions', value: dailyPerformance[0]?.instructions || 0, fill: BRAND_COLORS.blue },
                            { name: 'Escalations', value: dailyPerformance[0]?.escalations || 0, fill: BRAND_COLORS.red },
                            { name: 'Complaints', value: dailyPerformance[0]?.complaints || 0, fill: BRAND_COLORS.orange },
                            { name: 'Urgent', value: dailyPerformance[0]?.urgent || 0, fill: BRAND_COLORS.red },
                            { name: 'Casual', value: dailyPerformance[0]?.casual || 0, fill: BRAND_COLORS.green }
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label
                        />
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Training History</Typography>
                    <List>
                      {trainingHistory.slice(0, 5).map((training, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            {training.success ? 
                              <CheckCircleIcon sx={{ color: BRAND_COLORS.green }} /> :
                              <ErrorIcon sx={{ color: BRAND_COLORS.red }} />
                            }
                          </ListItemIcon>
                          <ListItemText
                            primary={`${training.training_date} - ${training.training_type}`}
                            secondary={`${training.messages_processed} messages, ${training.training_duration_minutes}min`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Tab 2: User Behavior Analysis */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 3, color: BRAND_COLORS.darkGray }}>
              User Behavior Analytics
            </Typography>

            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">User Risk Profiles</Typography>
                  <Button
                    startIcon={<DownloadIcon />}
                    onClick={() => exportAIData('user-profiles')}
                    size="small"
                  >
                    Export CSV
                  </Button>
                </Box>

                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Sender</TableCell>
                      <TableCell>Total Messages</TableCell>
                      <TableCell>Flags</TableCell>
                      <TableCell>False Positive Rate</TableCell>
                      <TableCell>Risk Level</TableCell>
                      <TableCell>Escalation Tendency</TableCell>
                      <TableCell>Communication Style</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {userProfiles.slice(0, 20).map((user, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ mr: 2, bgcolor: getRiskColor(user.risk_level), width: 32, height: 32 }}>
                              {user.sender_name?.charAt(0) || 'U'}
                            </Avatar>
                            <Typography variant="body2">{user.sender_name || user.sender_id}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{user.total_messages}</TableCell>
                        <TableCell>
                          <Badge badgeContent={user.recent_flags} color="error">
                            <Typography>{user.total_flags}</Typography>
                          </Badge>
                        </TableCell>
                        <TableCell>{(user.false_positive_rate * 100).toFixed(1)}%</TableCell>
                        <TableCell>
                          <Chip 
                            label={user.risk_level} 
                            size="small"
                            sx={{ 
                              backgroundColor: getRiskColor(user.risk_level),
                              color: 'white'
                            }}
                          />
                        </TableCell>
                        <TableCell>{(user.escalation_tendency * 100).toFixed(0)}%</TableCell>
                        <TableCell>{user.communication_style || 'Unknown'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Tab 3: Group Analytics */}
        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 3, color: BRAND_COLORS.darkGray }}>
              Group Dynamics & Intelligence
            </Typography>

            <Grid container spacing={3}>
              {groupProfiles.map((group, index) => (
                <Grid item xs={12} md={6} lg={4} key={index}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" noWrap>
                          {group.group_name}
                        </Typography>
                        <Chip 
                          label={group.group_mood}
                          size="small"
                          sx={{ 
                            backgroundColor: getMoodColor(group.group_mood),
                            color: 'white'
                          }}
                        />
                      </Box>

                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Daily Volume
                          </Typography>
                          <Typography variant="h6">
                            {group.daily_message_volume}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Escalation Rate
                          </Typography>
                          <Typography variant="h6" sx={{ color: getRiskColor(group.escalation_rate > 0.3 ? 'HIGH' : 'LOW') }}>
                            {(group.escalation_rate * 100).toFixed(1)}%
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Instructions
                          </Typography>
                          <Typography variant="body1">
                            {group.instructions_today} today
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Flags
                          </Typography>
                          <Typography variant="body1">
                            {group.flags_today} today
                          </Typography>
                        </Grid>
                      </Grid>

                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Management Responsiveness
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={group.management_responsiveness_score * 100}
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Tab 4: Instruction Logs */}
        {activeTab === 3 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 3, color: BRAND_COLORS.darkGray }}>
              Instruction Log Viewer
            </Typography>

            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Auto-Classified Instructions (Not Flagged)</Typography>
                  <Button
                    startIcon={<DownloadIcon />}
                    onClick={() => exportAIData('instructions')}
                    size="small"
                  >
                    Export CSV
                  </Button>
                </Box>

                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Time</TableCell>
                      <TableCell>Group</TableCell>
                      <TableCell>Sender</TableCell>
                      <TableCell>Instruction</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Urgency</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {instructionLogs.slice(0, 50).map((instruction, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {new Date(instruction.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>{instruction.group_id}</TableCell>
                        <TableCell>{instruction.sender_id}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 300 }}>
                            {instruction.message_text}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={instruction.instruction_type} size="small" />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={instruction.urgency_detected}
                            size="small"
                            color={instruction.urgency_detected === 'high' ? 'error' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={instruction.completion_status}
                            size="small"
                            color={instruction.completion_status === 'completed' ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Override Classification">
                            <IconButton size="small">
                              <AutoFixHighIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Tab 5: Admin Controls */}
        {activeTab === 4 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 3, color: BRAND_COLORS.darkGray }}>
              AI System Administration
            </Typography>

            <Grid container spacing={3}>
              {/* AI Configuration Panel */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>AI Configuration</Typography>
                    
                    <Box sx={{ mb: 3 }}>
                      <FormControlLabel
                        control={
                          <Switch 
                            checked={aiConfig.ai_enabled || false}
                            onChange={(e) => updateAIConfig({ ai_enabled: e.target.checked })}
                          />
                        }
                        label="Enable AI Analysis"
                      />
                    </Box>

                    <Box sx={{ mb: 3 }}>
                      <FormControlLabel
                        control={
                          <Switch 
                            checked={aiConfig.instruction_auto_skip || false}
                            onChange={(e) => updateAIConfig({ instruction_auto_skip: e.target.checked })}
                          />
                        }
                        label="Auto-Skip Instructions"
                      />
                    </Box>

                    <Box sx={{ mb: 3 }}>
                      <Typography gutterBottom>
                        Confidence Threshold: {(aiConfig.ai_confidence_threshold || 0.75) * 100}%
                      </Typography>
                      <Slider
                        value={(aiConfig.ai_confidence_threshold || 0.75) * 100}
                        onChange={(e, value) => updateAIConfig({ ai_confidence_threshold: value / 100 })}
                        min={50}
                        max={95}
                        step={5}
                        marks
                        valueLabelDisplay="auto"
                      />
                    </Box>

                    <Button
                      variant="outlined"
                      onClick={() => setConfigDialogOpen(true)}
                      sx={{ mr: 2 }}
                    >
                      Advanced Settings
                    </Button>

                    <Button
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      onClick={() => exportAIData('judgments')}
                    >
                      Export All Data
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              {/* Learning Pipeline Control */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Learning Pipeline</Typography>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Status: {learningStatus?.enabled ? 'Active' : 'Disabled'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Schedule: {learningStatus?.schedule || 'Not configured'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Last Training: {learningStatus?.last_training?.training_date || 'Never'}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                      <Button
                        variant="contained"
                        startIcon={<PlayArrowIcon />}
                        onClick={triggerManualLearning}
                        color="primary"
                      >
                        Run Learning Cycle
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={fetchAIData}
                      >
                        Refresh Status
                      </Button>
                    </Box>

                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>Recent Training Logs</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List dense>
                          {trainingHistory.slice(0, 10).map((log, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                {log.success ? 
                                  <CheckCircleIcon sx={{ color: BRAND_COLORS.green }} /> :
                                  <ErrorIcon sx={{ color: BRAND_COLORS.red }} />
                                }
                              </ListItemIcon>
                              <ListItemText
                                primary={`${log.training_date} - ${log.training_type}`}
                                secondary={log.notes || 'No notes'}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Advanced Configuration Dialog */}
      <Dialog open={configDialogOpen} onClose={() => setConfigDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Advanced AI Configuration</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Max Context Messages"
                type="number"
                value={aiConfig.max_context_messages || 100}
                onChange={(e) => setAIConfig({ ...aiConfig, max_context_messages: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Response Timeout (seconds)"
                type="number"
                value={aiConfig.ai_response_timeout_seconds || 30}
                onChange={(e) => setAIConfig({ ...aiConfig, ai_response_timeout_seconds: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Feedback Weight"
                type="number"
                step="0.1"
                value={aiConfig.feedback_weight || 2.0}
                onChange={(e) => setAIConfig({ ...aiConfig, feedback_weight: parseFloat(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="False Positive Penalty"
                type="number"
                step="0.1"
                value={aiConfig.false_positive_penalty || 1.5}
                onChange={(e) => setAIConfig({ ...aiConfig, false_positive_penalty: parseFloat(e.target.value) })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => updateAIConfig(aiConfig)} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AIIntelligencePage; 