import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  Slider,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Psychology,
  TrendingUp,
  Settings,
  School,
  Assessment,
  Refresh,
  Save,
  RestartAlt,
  Speed,
  CheckCircle,
  Warning,
  Error
} from '@mui/icons-material';

const AIIntelligencePage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [config, setConfig] = useState({
    enabled: true,
    confidenceThreshold: 0.8,
    learningEnabled: true,
    autoRetraining: true,
    models: {
      classifier: 'llama-3.2-11b-vision-instruct',
      sentiment: 'qwen2.5-7b-instruct'
    }
  });
  const [stats, setStats] = useState({
    accuracy: 0,
    totalAnalyzed: 0,
    learningProgress: 0,
    lastTraining: null
  });
  const [dailyPerformance, setDailyPerformance] = useState([]);
  const [userProfiles, setUserProfiles] = useState([]);
  const [groupProfiles, setGroupProfiles] = useState([]);
  const [trainingHistory, setTrainingHistory] = useState([]);

  // Fetch AI intelligence data
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [configRes, statsRes, dailyRes, usersRes, groupsRes, trainingRes] = await Promise.all([
        fetch('/api/ai/intelligence/config'),
        fetch('/api/ai/intelligence/stats'),
        fetch('/api/ai/intelligence/daily-performance'),
        fetch('/api/ai/intelligence/user-profiles'),
        fetch('/api/ai/intelligence/group-profiles'),
        fetch('/api/ai/intelligence/training-history')
      ]);

      const [configData, statsData, dailyData, usersData, groupsData, trainingData] = await Promise.all([
        configRes.json(),
        statsRes.json(),
        dailyRes.json(),
        usersRes.json(),
        groupsRes.json(),
        trainingRes.json()
      ]);

      if (configData.success) setConfig(configData.data);
      if (statsData.success) setStats(statsData.data);
      if (dailyData.success) setDailyPerformance(dailyData.data);
      if (usersData.success) setUserProfiles(usersData.data);
      if (groupsData.success) setGroupProfiles(groupsData.data);
      if (trainingData.success) setTrainingHistory(trainingData.data);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConfigChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleModelChange = (type, model) => {
    setConfig(prev => ({
      ...prev,
      models: {
        ...prev.models,
        [type]: model
      }
    }));
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/ai/intelligence/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });

      const result = await response.json();
      if (result.success) {
        // Success handled silently
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const triggerLearning = async () => {
    try {
      const response = await fetch('/api/ai/intelligence/trigger-learning', {
        method: 'POST'
      });

      const result = await response.json();
      if (result.success) {
        fetchData(); // Refresh data
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return 'success';
      case 'good': return 'info';
      case 'poor': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-IN');
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" color="text.primary" sx={{ fontWeight: 'bold' }}>
          🧠 AI Intelligence System
        </Typography>
        
        <Box display="flex" gap={2}>
          <Tooltip title="Refresh Data">
            <IconButton onClick={fetchData} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<School />}
            onClick={triggerLearning}
            disabled={loading}
          >
            Trigger Learning
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Assessment color="primary" />
                <Box>
                  <Typography variant="h4" color="primary">
                    {(stats.accuracy * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    AI Accuracy
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Psychology color="success" />
                <Box>
                  <Typography variant="h4" color="success.main">
                    {stats.totalAnalyzed.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Messages Analyzed
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <TrendingUp color="info" />
                <Box>
                  <Typography variant="h4" color="info.main">
                    {(stats.learningProgress * 100).toFixed(0)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Learning Progress
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Speed color="warning" />
                <Box>
                  <Typography variant="h4" color="warning.main">
                    {stats.lastTraining ? Math.round((Date.now() - new Date(stats.lastTraining)) / (1000 * 60 * 60 * 24)) : 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Days Since Training
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="Configuration" />
            <Tab label="Daily Performance" />
            <Tab label="User Profiles" />
            <Tab label="Group Intelligence" />
            <Tab label="Training History" />
          </Tabs>
        </Box>

        {/* Configuration Tab */}
        <TabPanel value={activeTab} index={0}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  System Settings
                </Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.enabled}
                      onChange={(e) => handleConfigChange('enabled', e.target.checked)}
                    />
                  }
                  label="AI Intelligence Enabled"
                  sx={{ mb: 2 }}
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.learningEnabled}
                      onChange={(e) => handleConfigChange('learningEnabled', e.target.checked)}
                    />
                  }
                  label="Learning Enabled"
                  sx={{ mb: 2 }}
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.autoRetraining}
                      onChange={(e) => handleConfigChange('autoRetraining', e.target.checked)}
                    />
                  }
                  label="Auto Retraining"
                  sx={{ mb: 3 }}
                />

                <Typography gutterBottom>
                  Confidence Threshold: {config.confidenceThreshold}
                </Typography>
                <Slider
                  value={config.confidenceThreshold}
                  onChange={(e, value) => handleConfigChange('confidenceThreshold', value)}
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  valueLabelDisplay="auto"
                  sx={{ mb: 3 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  AI Models
                </Typography>
                
                <TextField
                  fullWidth
                  label="Classification Model"
                  value={config.models?.classifier || ''}
                  onChange={(e) => handleModelChange('classifier', e.target.value)}
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  fullWidth
                  label="Sentiment Model"
                  value={config.models?.sentiment || ''}
                  onChange={(e) => handleModelChange('sentiment', e.target.value)}
                  sx={{ mb: 3 }}
                />

                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={saveConfig}
                  disabled={saving}
                  fullWidth
                >
                  {saving ? 'Saving...' : 'Save Configuration'}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </TabPanel>

        {/* Daily Performance Tab */}
        <TabPanel value={activeTab} index={1}>
          <CardContent>
            {loading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell align="center">Messages</TableCell>
                      <TableCell align="center">Analyzed</TableCell>
                      <TableCell align="center">Accuracy</TableCell>
                      <TableCell align="center">Avg Confidence</TableCell>
                      <TableCell align="center">Processing Time</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dailyPerformance.map((day, index) => (
                      <TableRow key={index}>
                        <TableCell>{new Date(day.date).toLocaleDateString()}</TableCell>
                        <TableCell align="center">{day.totalMessages}</TableCell>
                        <TableCell align="center">{day.analyzedMessages}</TableCell>
                        <TableCell align="center">{(day.accuracyRate * 100).toFixed(1)}%</TableCell>
                        <TableCell align="center">{(day.avgConfidence * 100).toFixed(1)}%</TableCell>
                        <TableCell align="center">{day.processingTimeAvg}ms</TableCell>
                        <TableCell align="center">
                          <Chip
                            icon={day.accuracyRate > 0.85 ? <CheckCircle /> : 
                                  day.accuracyRate > 0.7 ? <Warning /> : <Error />}
                            label={day.accuracyRate > 0.85 ? 'Excellent' : 
                                   day.accuracyRate > 0.7 ? 'Good' : 'Poor'}
                            color={getStatusColor(
                              day.accuracyRate > 0.85 ? 'excellent' : 
                              day.accuracyRate > 0.7 ? 'good' : 'poor'
                            )}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </TabPanel>

        {/* User Profiles Tab */}
        <TabPanel value={activeTab} index={2}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              User Risk Profiles
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell align="center">Messages</TableCell>
                    <TableCell align="center">Risk Score</TableCell>
                    <TableCell align="center">Flagged</TableCell>
                    <TableCell align="center">Last Activity</TableCell>
                    <TableCell align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {userProfiles.map((user, index) => (
                    <TableRow key={index}>
                      <TableCell>{user.userName || user.userPhone}</TableCell>
                      <TableCell align="center">{user.totalMessages}</TableCell>
                      <TableCell align="center">{(user.riskScore * 100).toFixed(0)}%</TableCell>
                      <TableCell align="center">{user.flaggedMessages}</TableCell>
                      <TableCell align="center">
                        {user.lastIssueDate ? formatTimestamp(user.lastIssueDate) : 'None'}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={user.riskScore > 0.7 ? 'High Risk' : 
                                 user.riskScore > 0.3 ? 'Medium Risk' : 'Low Risk'}
                          color={user.riskScore > 0.7 ? 'error' : 
                                 user.riskScore > 0.3 ? 'warning' : 'success'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </TabPanel>

        {/* Group Intelligence Tab */}
        <TabPanel value={activeTab} index={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Group Intelligence Profiles
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Group Name</TableCell>
                    <TableCell align="center">Messages</TableCell>
                    <TableCell align="center">Flag Rate</TableCell>
                    <TableCell align="center">Intelligence Score</TableCell>
                    <TableCell align="center">Members</TableCell>
                    <TableCell align="center">Last Activity</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {groupProfiles.map((group, index) => (
                    <TableRow key={index}>
                      <TableCell>{group.groupName}</TableCell>
                      <TableCell align="center">{group.totalMessages}</TableCell>
                      <TableCell align="center">{(group.flagRate * 100).toFixed(1)}%</TableCell>
                      <TableCell align="center">{(group.intelligenceScore * 100).toFixed(0)}%</TableCell>
                      <TableCell align="center">{group.memberCount}</TableCell>
                      <TableCell align="center">
                        {group.lastActivity ? formatTimestamp(group.lastActivity) : 'Unknown'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </TabPanel>

        {/* Training History Tab */}
        <TabPanel value={activeTab} index={4}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              AI Training History
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="center">Dataset Size</TableCell>
                    <TableCell align="center">Duration</TableCell>
                    <TableCell align="center">Accuracy Before</TableCell>
                    <TableCell align="center">Accuracy After</TableCell>
                    <TableCell align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {trainingHistory.map((training, index) => (
                    <TableRow key={index}>
                      <TableCell>{formatTimestamp(training.createdAt)}</TableCell>
                      <TableCell>{training.trainingType}</TableCell>
                      <TableCell align="center">{training.datasetSize}</TableCell>
                      <TableCell align="center">{training.trainingDuration}s</TableCell>
                      <TableCell align="center">
                        {training.accuracyBefore ? (training.accuracyBefore * 100).toFixed(1) + '%' : 'N/A'}
                      </TableCell>
                      <TableCell align="center">
                        {training.accuracyAfter ? (training.accuracyAfter * 100).toFixed(1) + '%' : 'N/A'}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={training.success ? <CheckCircle /> : <Error />}
                          label={training.success ? 'Success' : 'Failed'}
                          color={training.success ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </TabPanel>
      </Card>
    </Box>
  );
};

export default AIIntelligencePage; 