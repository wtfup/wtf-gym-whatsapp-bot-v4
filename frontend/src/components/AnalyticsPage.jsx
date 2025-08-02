import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  ButtonGroup,
  CircularProgress,
  Alert,
  Chip,
  Paper,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  Assessment,
  Speed,
  Group,
  Flag,
  ThumbUp,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

const AnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [analytics, setAnalytics] = useState({
    overview: {},
    messageVolume: [],
    aiAccuracy: [],
    performance: [],
    routing: [],
    realTimeMetrics: {},
    groupStats: [],
    sentimentDistribution: []
  });

  // Fetch analytics data
  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all analytics endpoints in parallel
      const [
        messageVolumeRes,
        aiAccuracyRes,
        performanceRes,
        routingRes,
        realTimeRes,
        groupsRes,
        sentimentRes
      ] = await Promise.all([
        fetch(`/api/analytics/message-volume?timeRange=${timeRange}`),
        fetch(`/api/analytics/ai-accuracy?timeRange=${timeRange}`),
        fetch(`/api/analytics/performance?timeRange=${timeRange}`),
        fetch(`/api/analytics/routing?timeRange=${timeRange}`),
        fetch('/api/analytics/real-time'),
        fetch(`/api/analytics/groups?timeRange=${timeRange}`),
        fetch(`/api/analytics/sentiment?timeRange=${timeRange}`)
      ]);

      const [
        messageVolume,
        aiAccuracy,
        performance,
        routing,
        realTime,
        groups,
        sentiment
      ] = await Promise.all([
        messageVolumeRes.json(),
        aiAccuracyRes.json(),
        performanceRes.json(),
        routingRes.json(),
        realTimeRes.json(),
        groupsRes.json(),
        sentimentRes.json()
      ]);

      setAnalytics({
        messageVolume: messageVolume.data || [],
        aiAccuracy: aiAccuracy.data || [],
        performance: performance.data || [],
        routing: routing.data || [],
        realTimeMetrics: realTime.data || {},
        groupStats: groups.data || [],
        sentimentDistribution: sentiment.data || []
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  // Auto-refresh real-time metrics every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/analytics/real-time')
        .then(res => res.json())
        .then(data => {
          setAnalytics(prev => ({
            ...prev,
            realTimeMetrics: data.data || {}
          }));
        })
        .catch(console.error);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  const formatPercentage = (num) => {
    return `${(num * 100).toFixed(1)}%`;
  };

  // Colors for charts
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" color="text.primary" sx={{ fontWeight: 'bold' }}>
          📊 Analytics Dashboard
        </Typography>
        
        <ButtonGroup variant="outlined" size="small">
          {[
            { value: '24h', label: '24 Hours' },
            { value: '7d', label: '7 Days' },
            { value: '30d', label: '30 Days' },
            { value: '90d', label: '90 Days' }
          ].map(({ value, label }) => (
            <Button
              key={value}
              variant={timeRange === value ? 'contained' : 'outlined'}
              onClick={() => setTimeRange(value)}
            >
              {label}
            </Button>
          ))}
        </ButtonGroup>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load analytics: {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress size={60} />
        </Box>
      ) : (
        <>
          {/* Real-time Metrics Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <TrendingUp color="primary" />
                    <Box>
                      <Typography variant="h4" color="primary">
                        {formatNumber(analytics.realTimeMetrics.totalMessages)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Messages
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
                    <Assessment color="success" />
                    <Box>
                      <Typography variant="h4" color="success.main">
                        {formatPercentage(analytics.realTimeMetrics.aiAccuracy || 0)}
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
                    <Speed color="info" />
                    <Box>
                      <Typography variant="h4" color="info.main">
                        {analytics.realTimeMetrics.avgResponseTime || 0}ms
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Avg Response Time
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
                    <Flag color="warning" />
                    <Box>
                      <Typography variant="h4" color="warning.main">
                        {formatPercentage(analytics.realTimeMetrics.flagRate || 0)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Flag Rate
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Message Volume Chart */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} lg={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    📈 Message Volume Over Time
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analytics.messageVolume}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="messages"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.3}
                        name="Messages"
                      />
                      <Area
                        type="monotone"
                        dataKey="flagged"
                        stroke="#ff7c7c"
                        fill="#ff7c7c"
                        fillOpacity={0.3}
                        name="Flagged"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} lg={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    🎯 Sentiment Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.sentimentDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analytics.sentimentDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* AI Accuracy and Performance */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} lg={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    🧠 AI Accuracy Trends
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.aiAccuracy}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 1]} tickFormatter={formatPercentage} />
                      <Tooltip formatter={(value) => formatPercentage(value)} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="accuracy"
                        stroke="#82ca9d"
                        strokeWidth={3}
                        name="Accuracy"
                      />
                      <Line
                        type="monotone"
                        dataKey="precision"
                        stroke="#8884d8"
                        strokeWidth={2}
                        name="Precision"
                      />
                      <Line
                        type="monotone"
                        dataKey="recall"
                        stroke="#ffc658"
                        strokeWidth={2}
                        name="Recall"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} lg={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    ⚡ Performance Metrics
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.performance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="avgResponseTime" fill="#8884d8" name="Response Time (ms)" />
                      <Bar dataKey="throughput" fill="#82ca9d" name="Throughput" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Group Statistics */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    👥 Group Statistics
                  </Typography>
                  <Grid container spacing={2}>
                    {analytics.groupStats.slice(0, 6).map((group, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h6" color="primary" gutterBottom>
                            {group.groupName}
                          </Typography>
                          <Box display="flex" justifyContent="space-around" mt={2}>
                            <Box>
                              <Typography variant="h5" color="text.primary">
                                {formatNumber(group.messageCount)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Messages
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="h5" color="warning.main">
                                {formatPercentage(group.flagRate)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Flag Rate
                              </Typography>
                            </Box>
                          </Box>
                          <Box mt={2}>
                            <Chip
                              icon={group.sentiment === 'positive' ? <ThumbUp /> : 
                                    group.sentiment === 'negative' ? <Warning /> : <CheckCircle />}
                              label={group.sentiment}
                              color={group.sentiment === 'positive' ? 'success' : 
                                     group.sentiment === 'negative' ? 'error' : 'default'}
                              size="small"
                            />
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Routing Performance */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    🎯 Routing Performance
                  </Typography>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={analytics.routing}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="correct" fill="#82ca9d" name="Correct Routing" />
                      <Bar dataKey="incorrect" fill="#ff7c7c" name="Incorrect Routing" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default AnalyticsPage; 