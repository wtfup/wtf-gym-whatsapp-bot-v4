import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Chip,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Timeline,
  TrendingUp,
  Speed,
  Assessment,
  Refresh,
  Download,
  Fullscreen
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const BRAND_COLORS = {
  primary: '#1976d2',
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3',
  background: '#121212',
  paper: '#1e1e1e'
};

const TIME_RANGES = [
  { value: '1h', label: '1 Hour' },
  { value: '24h', label: '24 Hours' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' }
];

const CHART_COLORS = [
  BRAND_COLORS.primary,
  BRAND_COLORS.success,
  BRAND_COLORS.warning,
  BRAND_COLORS.error,
  BRAND_COLORS.info
];

// === METRIC CARD COMPONENT ===
const MetricCard = memo(({ title, value, subtitle, icon: Icon, color = BRAND_COLORS.primary, trend }) => (
  <Card 
    sx={{ 
      height: '100%', 
      background: `linear-gradient(135deg, ${color}15, ${BRAND_COLORS.paper})`,
      border: `1px solid ${color}30`
    }}
  >
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" sx={{ color, fontWeight: 'bold' }}>
            {value}
          </Typography>
          <Typography variant="h6" color="text.primary">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
          {trend && (
            <Chip 
              label={`${trend > 0 ? '+' : ''}${trend}%`}
              size="small"
              color={trend > 0 ? 'success' : 'error'}
              sx={{ mt: 1 }}
            />
          )}
        </Box>
        {Icon && (
          <Icon 
            sx={{ 
              fontSize: 48, 
              color: `${color}60`,
              background: `${color}10`,
              borderRadius: 2,
              p: 1
            }} 
          />
        )}
      </Box>
    </CardContent>
  </Card>
));

// === CHART CONTAINER COMPONENT ===
const ChartContainer = memo(({ title, children, loading = false, error = null, onRefresh, onFullscreen }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
        <Typography variant="h6" color="text.primary">
          {title}
        </Typography>
        <Box>
          {onRefresh && (
            <Tooltip title="Refresh">
              <IconButton onClick={onRefresh} size="small">
                <Refresh />
              </IconButton>
            </Tooltip>
          )}
          {onFullscreen && (
            <Tooltip title="Fullscreen">
              <IconButton onClick={onFullscreen} size="small">
                <Fullscreen />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
      
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height={300}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : (
        <Box height={300}>
          {children}
        </Box>
      )}
    </CardContent>
  </Card>
));

// === MAIN ANALYTICS DASHBOARD COMPONENT ===
const ComprehensiveAnalyticsDashboard = () => {
  // === STATE MANAGEMENT ===
  const [timeRange, setTimeRange] = useState('24h');
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    realTimeMetrics: {},
    messageVolume: [],
    aiAccuracy: {},
    performance: {},
    routing: {},
    groups: [],
    sentiment: {}
  });

  // === DATA FETCHING ===
  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const endpoints = [
        `/api/analytics/realtime-metrics`,
        `/api/analytics/message-volume?range=${timeRange}&interval=hour`,
        `/api/analytics/ai-accuracy?range=${timeRange}`,
        `/api/analytics/performance?range=${timeRange}`,
        `/api/analytics/routing?range=${timeRange}`,
        `/api/analytics/groups?range=${timeRange}&limit=10`,
        `/api/analytics/sentiment?range=${timeRange}`
      ];

      const responses = await Promise.all(
        endpoints.map(url => 
          fetch(url)
            .then(r => r.json())
            .catch(err => ({ success: false, error: err.message }))
        )
      );

      const [realTime, volume, accuracy, performance, routing, groups, sentiment] = responses;

      setData({
        realTimeMetrics: realTime.success ? realTime.data : {},
        messageVolume: volume.success ? volume.data : [],
        aiAccuracy: accuracy.success ? accuracy.data : {},
        performance: performance.success ? performance.data : {},
        routing: routing.success ? routing.data : {},
        groups: groups.success ? groups.data : [],
        sentiment: sentiment.success ? sentiment.data : {}
      });

    } catch (err) {
      setError(`Failed to fetch analytics: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  // === REAL-TIME UPDATES ===
  useEffect(() => {
    fetchAnalyticsData();

    let interval;
    if (realTimeEnabled) {
      interval = setInterval(fetchAnalyticsData, 30000); // Update every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchAnalyticsData, realTimeEnabled]);

  // === CHART DATA PROCESSING ===
  const formatMessageVolumeData = (volumeData) => {
    return volumeData.map(item => ({
      time: new Date(item.time_bucket).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      messages: parseInt(item.message_count),
      flagged: parseInt(item.flagged_count),
      confidence: parseFloat(item.avg_confidence || 0) * 100
    }));
  };

  const formatAccuracyData = (accuracyData) => {
    if (!accuracyData.daily_accuracy) return [];
    
    return accuracyData.daily_accuracy.map(item => ({
      date: new Date(item.date).toLocaleDateString(),
      accuracy: (parseFloat(item.avg_confidence || 0) * 100).toFixed(1),
      total: parseInt(item.total_analyzed),
      high_confidence: parseInt(item.high_confidence)
    }));
  };

  const formatSentimentData = (sentimentData) => {
    if (!sentimentData.breakdown) return [];
    
    const sentimentCounts = sentimentData.breakdown.reduce((acc, item) => {
      acc[item.sentiment] = (acc[item.sentiment] || 0) + parseInt(item.count);
      return acc;
    }, {});

    return Object.entries(sentimentCounts).map(([sentiment, count]) => ({
      name: sentiment.charAt(0).toUpperCase() + sentiment.slice(1),
      value: count
    }));
  };

  const formatGroupsData = (groupsData) => {
    return groupsData.slice(0, 10).map(item => ({
      name: item.group_name.length > 20 ? 
        item.group_name.substring(0, 20) + '...' : 
        item.group_name,
      messages: parseInt(item.message_count),
      flagged: parseInt(item.flagged_count),
      rate: ((parseInt(item.flagged_count) / parseInt(item.message_count)) * 100).toFixed(1)
    }));
  };

  // === REAL-TIME METRICS CALCULATIONS ===
  const {
    messages_last_hour = 0,
    flags_last_hour = 0,
    whatsapp_connection_status = {},
    memory_usage = {},
    uptime = 0
  } = data.realTimeMetrics;

  const flagRate = messages_last_hour > 0 ? 
    ((flags_last_hour / messages_last_hour) * 100).toFixed(1) : 0;

  const uptimeHours = Math.floor(uptime / 3600);
  const memoryUsageMB = Math.round((memory_usage.heapUsed || 0) / 1024 / 1024);

  return (
    <Box sx={{ p: 3, maxWidth: '100%', overflow: 'hidden' }}>
      {/* === HEADER CONTROLS === */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" color="text.primary" sx={{ fontWeight: 'bold' }}>
          📊 Comprehensive Analytics Dashboard
        </Typography>
        
        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              {TIME_RANGES.map(range => (
                <MenuItem key={range.value} value={range.value}>
                  {range.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControlLabel
            control={
              <Switch
                checked={realTimeEnabled}
                onChange={(e) => setRealTimeEnabled(e.target.checked)}
                color="primary"
              />
            }
            label="Real-time"
          />
          
          <Tooltip title="Refresh Data">
            <IconButton onClick={fetchAnalyticsData} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* === REAL-TIME METRICS ROW === */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Messages/Hour"
            value={messages_last_hour}
            subtitle="Last 60 minutes"
            icon={Timeline}
            color={BRAND_COLORS.primary}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Flags/Hour"
            value={flags_last_hour}
            subtitle={`${flagRate}% flag rate`}
            icon={Assessment}
            color={BRAND_COLORS.warning}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="System Uptime"
            value={`${uptimeHours}h`}
            subtitle={whatsapp_connection_status.connected ? "WhatsApp Connected" : "WhatsApp Disconnected"}
            icon={Speed}
            color={whatsapp_connection_status.connected ? BRAND_COLORS.success : BRAND_COLORS.error}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Memory Usage"
            value={`${memoryUsageMB}MB`}
            subtitle="Heap memory"
            icon={TrendingUp}
            color={BRAND_COLORS.info}
          />
        </Grid>
      </Grid>

      {/* === CHARTS ROW 1 === */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <ChartContainer 
            title="Message Volume Over Time" 
            loading={loading}
            onRefresh={fetchAnalyticsData}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formatMessageVolumeData(data.messageVolume)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="time" stroke="#666" />
                <YAxis stroke="#666" />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: BRAND_COLORS.paper,
                    border: `1px solid ${BRAND_COLORS.primary}`,
                    borderRadius: 8
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="messages"
                  stackId="1"
                  stroke={BRAND_COLORS.primary}
                  fill={`${BRAND_COLORS.primary}40`}
                  name="Total Messages"
                />
                <Area
                  type="monotone"
                  dataKey="flagged"
                  stackId="2"
                  stroke={BRAND_COLORS.warning}
                  fill={`${BRAND_COLORS.warning}40`}
                  name="Flagged Messages"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <ChartContainer title="Sentiment Distribution" loading={loading}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={formatSentimentData(data.sentiment)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {formatSentimentData(data.sentiment).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Grid>
      </Grid>

      {/* === CHARTS ROW 2 === */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <ChartContainer title="AI Accuracy Trends" loading={loading}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formatAccuracyData(data.aiAccuracy)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#666" />
                <YAxis stroke="#666" />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: BRAND_COLORS.paper,
                    border: `1px solid ${BRAND_COLORS.success}`,
                    borderRadius: 8
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke={BRAND_COLORS.success}
                  strokeWidth={3}
                  name="Accuracy %"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <ChartContainer title="Top Groups by Activity" loading={loading}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formatGroupsData(data.groups)} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis type="number" stroke="#666" />
                <YAxis type="category" dataKey="name" stroke="#666" width={100} />
                <RechartsTooltip />
                <Bar dataKey="messages" fill={BRAND_COLORS.primary} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Grid>
      </Grid>

      {/* === STATUS INDICATORS === */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            System Status
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: whatsapp_connection_status.connected ? 
                      BRAND_COLORS.success : BRAND_COLORS.error
                  }}
                />
                <Typography variant="body2">
                  WhatsApp: {whatsapp_connection_status.connected ? 'Connected' : 'Disconnected'}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: data.aiAccuracy.summary?.avg_confidence > 0.7 ? 
                      BRAND_COLORS.success : BRAND_COLORS.warning
                  }}
                />
                <Typography variant="body2">
                  AI Analysis: {data.aiAccuracy.summary?.avg_confidence > 0.7 ? 'Good' : 'Needs Attention'}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Last Updated: {new Date().toLocaleTimeString()}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Auto-refresh: {realTimeEnabled ? 'ON' : 'OFF'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ComprehensiveAnalyticsDashboard; 