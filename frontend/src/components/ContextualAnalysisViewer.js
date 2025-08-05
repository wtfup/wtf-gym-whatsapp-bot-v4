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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Tab,
  Tabs,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  Pattern as PatternIcon,
  TrendingUp as TrendingUpIcon,
  Psychology as PsychologyIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Person as PersonIcon,
  Message as MessageIcon,
  Analytics as AnalyticsIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, ScatterPlot, Scatter } from 'recharts';
import environment from '../config/environment';

// API URL helper
const apiUrl = (endpoint) => `${environment.apiBaseUrl}${endpoint}`;

// Brand colors for consistency
const BRAND_COLORS = {
  primary: '#1976d2',
  secondary: '#dc004e',
  success: '#2e7d32',
  warning: '#ed6c02',
  error: '#d32f2f',
  info: '#0288d1'
};

const PATTERN_COLORS = {
  repetition: BRAND_COLORS.warning,
  escalation: BRAND_COLORS.error,
  sentiment_shift: BRAND_COLORS.info,
  temporal: BRAND_COLORS.primary,
  behavioral: BRAND_COLORS.success
};

const ContextualAnalysisViewer = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState('7');
  const [analysisData, setAnalysisData] = useState({});
  const [patternInsights, setPatternInsights] = useState([]);
  const [senderAnalysis, setSenderAnalysis] = useState([]);
  const [temporalPatterns, setTemporalPatterns] = useState([]);
  const [riskAssessment, setRiskAssessment] = useState({});

  useEffect(() => {
    loadContextualAnalysis();
  }, [timeframe]);

  const loadContextualAnalysis = async () => {
    setLoading(true);
    try {
      const [analysisRes, patternsRes, senderRes, temporalRes] = await Promise.all([
        fetch(apiUrl(`/api/contextual-analysis?timeframe=${timeframe}`)),
        fetch(apiUrl(`/api/contextual-analysis/patterns?timeframe=${timeframe}`)),
        fetch(apiUrl(`/api/contextual-analysis/senders?timeframe=${timeframe}`)),
        fetch(apiUrl(`/api/contextual-analysis/temporal?timeframe=${timeframe}`))
      ]);

      const [analysis, patterns, senders, temporal] = await Promise.all([
        analysisRes.json(),
        patternsRes.json(),
        senderRes.json(),
        temporalRes.json()
      ]);

      console.log('Contextual Analysis Data Loaded:', { analysis, patterns, senders, temporal });

      setAnalysisData(analysis.data || analysis);
      setPatternInsights(patterns.insights || []);
      setSenderAnalysis(senders.sender_patterns || []);
      setTemporalPatterns(temporal.temporal_analysis || []);
      setRiskAssessment(analysis.data?.risk_assessment || analysis.risk_assessment || {});
    } catch (error) {
      console.error('Failed to load contextual analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPatternSeverity = (pattern) => {
    if (pattern.risk_score >= 0.8) return 'error';
    if (pattern.risk_score >= 0.6) return 'warning';
    if (pattern.risk_score >= 0.4) return 'info';
    return 'success';
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  // Pattern Analysis Tab
  const PatternAnalysisTab = () => (
    <Grid container spacing={3}>
      {/* Pattern Summary Cards */}
      <Grid item xs={12} md={3}>
        <Card elevation={3} sx={{ bgcolor: BRAND_COLORS.info, color: 'white' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <PatternIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Total Patterns
            </Typography>
            <Typography variant="h3" fontWeight="bold">
              {patternInsights.length}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Identified patterns
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card elevation={3} sx={{ bgcolor: BRAND_COLORS.warning, color: 'white' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              High Risk Patterns
            </Typography>
            <Typography variant="h3" fontWeight="bold">
              {patternInsights.filter(p => p.risk_score >= 0.7).length}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Require attention
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card elevation={3} sx={{ bgcolor: BRAND_COLORS.success, color: 'white' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Trend Patterns
            </Typography>
            <Typography variant="h3" fontWeight="bold">
              {patternInsights.filter(p => p.pattern_type === 'trend').length}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Trending behaviors
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card elevation={3} sx={{ bgcolor: BRAND_COLORS.error, color: 'white' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <PsychologyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Behavioral Insights
            </Typography>
            <Typography variant="h3" fontWeight="bold">
              {patternInsights.filter(p => p.pattern_type === 'behavioral').length}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Customer behaviors
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Pattern Details Table */}
      <Grid item xs={12}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <AnalyticsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Detailed Pattern Analysis
            </Typography>
            
            {patternInsights.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Pattern Type</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Risk Score</TableCell>
                      <TableCell>Confidence</TableCell>
                      <TableCell>Frequency</TableCell>
                      <TableCell>Recommendation</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {patternInsights.map((pattern, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Chip 
                            label={pattern.pattern_type}
                            color={getPatternSeverity(pattern)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {pattern.description || 'Pattern detected in customer communication'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={(pattern.risk_score || 0) * 100}
                              color={getPatternSeverity(pattern)}
                              sx={{ width: 60, mr: 1 }}
                            />
                            <Typography variant="body2">
                              {((pattern.risk_score || 0) * 100).toFixed(0)}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {((pattern.confidence || 0) * 100).toFixed(0)}%
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {pattern.frequency || 1}x
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {pattern.recommended_action || 'Monitor closely'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton size="small">
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">
                <AlertTitle>No Patterns Detected</AlertTitle>
                No significant patterns have been identified in the selected timeframe.
              </Alert>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Sender Analysis Tab
  const SenderAnalysisTab = () => (
    <Grid container spacing={3}>
      {/* Sender Behavior Chart */}
      <Grid item xs={12} md={8}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Sender Behavior Patterns
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={senderAnalysis.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="sender_id" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="pattern_frequency" fill={BRAND_COLORS.primary} name="Pattern Frequency" />
                <Bar dataKey="risk_score" fill={BRAND_COLORS.warning} name="Risk Score" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* High Risk Senders */}
      <Grid item xs={12} md={4}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              High Risk Senders
            </Typography>
            <List>
              {senderAnalysis
                .filter(sender => (sender.risk_score || 0) > 0.6)
                .slice(0, 8)
                .map((sender, index) => (
                  <ListItem key={index} divider={index < 7}>
                    <ListItemAvatar>
                      <Avatar 
                        sx={{ 
                          bgcolor: sender.risk_score >= 0.8 ? BRAND_COLORS.error : BRAND_COLORS.warning,
                          width: 32, 
                          height: 32 
                        }}
                      >
                        <PersonIcon fontSize="small" />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={sender.sender_id || 'Unknown'}
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            Risk: {((sender.risk_score || 0) * 100).toFixed(0)}%
                          </Typography>
                          <Typography variant="caption" display="block">
                            Patterns: {sender.pattern_frequency || 0}
                          </Typography>
                          <Chip 
                            label={sender.behavior_type || 'Normal'}
                            size="small"
                            color={sender.risk_score >= 0.8 ? 'error' : 'warning'}
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
            </List>
            
            {senderAnalysis.filter(s => (s.risk_score || 0) > 0.6).length === 0 && (
              <Alert severity="success">
                <AlertTitle>All Clear</AlertTitle>
                No high-risk sender patterns detected.
              </Alert>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Temporal Analysis Tab
  const TemporalAnalysisTab = () => (
    <Grid container spacing={3}>
      {/* Timeline Chart */}
      <Grid item xs={12}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <TimelineIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Pattern Timeline Analysis
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={temporalPatterns}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <RechartsTooltip />
                <Line 
                  type="monotone" 
                  dataKey="pattern_intensity" 
                  stroke={BRAND_COLORS.primary} 
                  strokeWidth={2}
                  name="Pattern Intensity"
                />
                <Line 
                  type="monotone" 
                  dataKey="risk_level" 
                  stroke={BRAND_COLORS.error} 
                  strokeWidth={2}
                  name="Risk Level"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Pattern Distribution */}
      <Grid item xs={12} md={6}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Pattern Type Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(PATTERN_COLORS).map(([type, color]) => ({
                    name: type.replace('_', ' ').toUpperCase(),
                    value: patternInsights.filter(p => p.pattern_type === type).length,
                    fill: color
                  }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                >
                  {Object.values(PATTERN_COLORS).map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Risk Assessment Summary */}
      <Grid item xs={12} md={6}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Overall Risk Assessment
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Overall Risk Level
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(riskAssessment.overall_risk || 0) * 100}
                color={
                  (riskAssessment.overall_risk || 0) >= 0.7 ? 'error' :
                  (riskAssessment.overall_risk || 0) >= 0.4 ? 'warning' : 'success'
                }
                sx={{ height: 8, borderRadius: 4, mb: 2 }}
              />
              <Typography variant="h6">
                {((riskAssessment.overall_risk || 0) * 100).toFixed(1)}%
              </Typography>
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Pattern Complexity
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(riskAssessment.complexity_score || 0) * 100}
                color="info"
                sx={{ height: 8, borderRadius: 4, mb: 2 }}
              />
              <Typography variant="h6">
                {((riskAssessment.complexity_score || 0) * 100).toFixed(1)}%
              </Typography>
            </Box>

            <Alert 
              severity={
                (riskAssessment.overall_risk || 0) >= 0.7 ? 'error' :
                (riskAssessment.overall_risk || 0) >= 0.4 ? 'warning' : 'success'
              }
              sx={{ mt: 2 }}
            >
              <AlertTitle>Assessment Summary</AlertTitle>
              {(riskAssessment.overall_risk || 0) >= 0.7 ? 
                'High risk patterns detected. Immediate attention recommended.' :
                (riskAssessment.overall_risk || 0) >= 0.4 ?
                'Moderate risk patterns identified. Monitor closely.' :
                'Low risk environment. Patterns within normal parameters.'
              }
            </Alert>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          <PsychologyIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Contextual Analysis Viewer
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small">
            <InputLabel>Timeframe</InputLabel>
            <Select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              label="Timeframe"
            >
              <MenuItem value="1">Last 24 Hours</MenuItem>
              <MenuItem value="3">Last 3 Days</MenuItem>
              <MenuItem value="7">Last Week</MenuItem>
              <MenuItem value="14">Last 2 Weeks</MenuItem>
              <MenuItem value="30">Last Month</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Export Analysis">
            <IconButton>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadContextualAnalysis}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Loading */}
      {loading && <LinearProgress sx={{ mb: 3 }} />}

      {/* Main Content */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Pattern Analysis" />
          <Tab label="Sender Analysis" />
          <Tab label="Temporal Analysis" />
        </Tabs>
      </Box>

      {activeTab === 0 && <PatternAnalysisTab />}
      {activeTab === 1 && <SenderAnalysisTab />}
      {activeTab === 2 && <TemporalAnalysisTab />}
    </Box>
  );
};

export default ContextualAnalysisViewer;