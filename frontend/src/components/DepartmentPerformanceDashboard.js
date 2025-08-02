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
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Tab,
  Tabs,
  Alert,
  AlertTitle,
  CircularProgress,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon,
  Message as MessageIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Timeline as TimelineIcon,
  Assignment as AssignmentIcon,
  Star as StarIcon,
  Engineering as EngineeringIcon,
  Build as BuildIcon,
  Support as SupportIcon,
  ManageAccounts as ManageAccountsIcon
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

// Brand colors for consistency
const BRAND_COLORS = {
  primary: '#1976d2',
  secondary: '#dc004e',
  success: '#2e7d32',
  warning: '#ed6c02',
  error: '#d32f2f',
  info: '#0288d1'
};

const DEPARTMENT_COLORS = {
  EQUIPMENT_MAINTENANCE: BRAND_COLORS.info,
  FACILITY_MANAGEMENT: BRAND_COLORS.success,
  CUSTOMER_SERVICE: BRAND_COLORS.primary,
  MANAGEMENT: BRAND_COLORS.secondary
};

const DEPARTMENT_ICONS = {
  EQUIPMENT_MAINTENANCE: <EngineeringIcon />,
  FACILITY_MANAGEMENT: <BuildIcon />,
  CUSTOMER_SERVICE: <SupportIcon />,
  MANAGEMENT: <ManageAccountsIcon />
};

const DepartmentPerformanceDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState('7');
  const [departmentMetrics, setDepartmentMetrics] = useState({});
  const [routingPerformance, setRoutingPerformance] = useState([]);
  const [responseMetrics, setResponseMetrics] = useState([]);
  const [departmentComparison, setDepartmentComparison] = useState([]);
  const [workloadDistribution, setWorkloadDistribution] = useState([]);
  const [efficiencyTrends, setEfficiencyTrends] = useState([]);

  useEffect(() => {
    loadDepartmentData();
  }, [timeframe]);

  const loadDepartmentData = async () => {
    setLoading(true);
    try {
      const [metricsRes, routingRes, responseRes] = await Promise.all([
        fetch(`/api/department-metrics?timeframe=${timeframe}`),
        fetch(`/api/routing-dashboard?timeframe=${timeframe}`),
        fetch(`/api/department-response-metrics?timeframe=${timeframe}`)
      ]);

      const [metrics, routing, response] = await Promise.all([
        metricsRes.json(),
        routingRes.json(),
        responseRes.json()
      ]);

      setDepartmentMetrics(metrics.summary || {});
      setRoutingPerformance(routing.department_performance || []);
      setResponseMetrics(response.department_response || []);
      setDepartmentComparison(metrics.comparison || []);
      setWorkloadDistribution(metrics.workload_distribution || []);
      setEfficiencyTrends(metrics.efficiency_trends || []);
    } catch (error) {
      console.error('Failed to load department data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDepartmentIcon = (department) => {
    return DEPARTMENT_ICONS[department] || <BusinessIcon />;
  };

  const getDepartmentColor = (department) => {
    return DEPARTMENT_COLORS[department] || BRAND_COLORS.info;
  };

  const calculateEfficiencyScore = (metrics) => {
    if (!metrics) return 0;
    const responseScore = Math.max(0, 100 - (metrics.avg_response_time / 60)); // Lower response time = higher score
    const resolutionScore = (metrics.resolution_rate || 0) * 100;
    const satisfactionScore = (metrics.satisfaction_score || 0) * 100;
    return Math.round((responseScore + resolutionScore + satisfactionScore) / 3);
  };

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${Math.round(seconds % 60)}s`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  // Department Overview Tab
  const DepartmentOverviewTab = () => (
    <Grid container spacing={3}>
      {/* Department Performance Cards */}
      {Object.entries(departmentMetrics).map(([department, metrics]) => (
        <Grid item xs={12} md={6} lg={3} key={department}>
          <Card 
            elevation={3}
            sx={{ 
              height: '100%',
              borderLeft: `4px solid ${getDepartmentColor(department)}`
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar 
                  sx={{ 
                    bgcolor: getDepartmentColor(department),
                    mr: 2,
                    width: 48,
                    height: 48
                  }}
                >
                  {getDepartmentIcon(department)}
                </Avatar>
                <Box>
                  <Typography variant="h6" noWrap>
                    {department.replace(/_/g, ' ')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Department Performance
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Messages
                  </Typography>
                  <Typography variant="h6">
                    {metrics.total_messages || 0}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Resolved
                  </Typography>
                  <Typography variant="h6">
                    {Math.round((metrics.resolution_rate || 0) * 100)}%
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Avg Response
                  </Typography>
                  <Typography variant="body1">
                    {formatDuration(metrics.avg_response_time || 0)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Efficiency
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CircularProgress
                      variant="determinate"
                      value={calculateEfficiencyScore(metrics)}
                      size={20}
                      thickness={4}
                      sx={{ mr: 1 }}
                    />
                    <Typography variant="body1">
                      {calculateEfficiencyScore(metrics)}%
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      ))}

      {/* Workload Distribution Chart */}
      <Grid item xs={12} md={8}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <AssignmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Workload Distribution by Category
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={workloadDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="EQUIPMENT_MAINTENANCE" fill={DEPARTMENT_COLORS.EQUIPMENT_MAINTENANCE} name="Equipment" />
                <Bar dataKey="FACILITY_MANAGEMENT" fill={DEPARTMENT_COLORS.FACILITY_MANAGEMENT} name="Facility" />
                <Bar dataKey="CUSTOMER_SERVICE" fill={DEPARTMENT_COLORS.CUSTOMER_SERVICE} name="Customer Service" />
                <Bar dataKey="MANAGEMENT" fill={DEPARTMENT_COLORS.MANAGEMENT} name="Management" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Department Ranking */}
      <Grid item xs={12} md={4}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <StarIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Performance Ranking
            </Typography>
            <List>
              {departmentComparison
                .sort((a, b) => calculateEfficiencyScore(b) - calculateEfficiencyScore(a))
                .map((dept, index) => (
                  <ListItem key={dept.department} divider={index < departmentComparison.length - 1}>
                    <ListItemAvatar>
                      <Avatar 
                        sx={{ 
                          bgcolor: index === 0 ? BRAND_COLORS.success : 
                                   index === 1 ? BRAND_COLORS.warning : 
                                   BRAND_COLORS.info,
                          width: 32, 
                          height: 32 
                        }}
                      >
                        {index + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={dept.department?.replace(/_/g, ' ') || 'Unknown'}
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            Efficiency: {calculateEfficiencyScore(dept)}%
                          </Typography>
                          <Typography variant="caption" display="block">
                            Messages: {dept.total_messages || 0}
                          </Typography>
                          {index === 0 && (
                            <Chip 
                              label="Top Performer"
                              size="small"
                              color="success"
                              sx={{ mt: 0.5 }}
                            />
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Response Metrics Tab
  const ResponseMetricsTab = () => (
    <Grid container spacing={3}>
      {/* Response Time Comparison */}
      <Grid item xs={12} md={6}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Average Response Times
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={responseMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="department" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <RechartsTooltip 
                  formatter={(value) => [formatDuration(value), 'Avg Response Time']}
                />
                <Bar 
                  dataKey="avg_response_time" 
                  fill={BRAND_COLORS.primary}
                  name="Response Time"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Resolution Rates */}
      <Grid item xs={12} md={6}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <CheckCircleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Resolution Rates
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={responseMetrics.map(dept => ({
                    name: dept.department?.replace(/_/g, ' '),
                    value: (dept.resolution_rate || 0) * 100,
                    fill: getDepartmentColor(dept.department)
                  }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: ${value.toFixed(0)}%`}
                >
                  {responseMetrics.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getDepartmentColor(entry.department)} 
                    />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Resolution Rate']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Efficiency Trends */}
      <Grid item xs={12}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <TimelineIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Department Efficiency Trends
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={efficiencyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip />
                <Line 
                  type="monotone" 
                  dataKey="EQUIPMENT_MAINTENANCE" 
                  stroke={DEPARTMENT_COLORS.EQUIPMENT_MAINTENANCE} 
                  strokeWidth={2}
                  name="Equipment"
                />
                <Line 
                  type="monotone" 
                  dataKey="FACILITY_MANAGEMENT" 
                  stroke={DEPARTMENT_COLORS.FACILITY_MANAGEMENT} 
                  strokeWidth={2}
                  name="Facility"
                />
                <Line 
                  type="monotone" 
                  dataKey="CUSTOMER_SERVICE" 
                  stroke={DEPARTMENT_COLORS.CUSTOMER_SERVICE} 
                  strokeWidth={2}
                  name="Customer Service"
                />
                <Line 
                  type="monotone" 
                  dataKey="MANAGEMENT" 
                  stroke={DEPARTMENT_COLORS.MANAGEMENT} 
                  strokeWidth={2}
                  name="Management"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Department Comparison Tab
  const DepartmentComparisonTab = () => (
    <Grid container spacing={3}>
      {/* Radar Chart for Multi-dimensional Comparison */}
      <Grid item xs={12} md={8}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <SpeedIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Multi-dimensional Performance Comparison
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={[
                {
                  metric: 'Response Speed',
                  EQUIPMENT_MAINTENANCE: Math.max(0, 100 - (departmentMetrics.EQUIPMENT_MAINTENANCE?.avg_response_time / 60 || 0)),
                  FACILITY_MANAGEMENT: Math.max(0, 100 - (departmentMetrics.FACILITY_MANAGEMENT?.avg_response_time / 60 || 0)),
                  CUSTOMER_SERVICE: Math.max(0, 100 - (departmentMetrics.CUSTOMER_SERVICE?.avg_response_time / 60 || 0)),
                  MANAGEMENT: Math.max(0, 100 - (departmentMetrics.MANAGEMENT?.avg_response_time / 60 || 0))
                },
                {
                  metric: 'Resolution Rate',
                  EQUIPMENT_MAINTENANCE: (departmentMetrics.EQUIPMENT_MAINTENANCE?.resolution_rate || 0) * 100,
                  FACILITY_MANAGEMENT: (departmentMetrics.FACILITY_MANAGEMENT?.resolution_rate || 0) * 100,
                  CUSTOMER_SERVICE: (departmentMetrics.CUSTOMER_SERVICE?.resolution_rate || 0) * 100,
                  MANAGEMENT: (departmentMetrics.MANAGEMENT?.resolution_rate || 0) * 100
                },
                {
                  metric: 'Customer Satisfaction',
                  EQUIPMENT_MAINTENANCE: (departmentMetrics.EQUIPMENT_MAINTENANCE?.satisfaction_score || 0) * 100,
                  FACILITY_MANAGEMENT: (departmentMetrics.FACILITY_MANAGEMENT?.satisfaction_score || 0) * 100,
                  CUSTOMER_SERVICE: (departmentMetrics.CUSTOMER_SERVICE?.satisfaction_score || 0) * 100,
                  MANAGEMENT: (departmentMetrics.MANAGEMENT?.satisfaction_score || 0) * 100
                },
                {
                  metric: 'Workload',
                  EQUIPMENT_MAINTENANCE: Math.min(100, (departmentMetrics.EQUIPMENT_MAINTENANCE?.total_messages || 0) / 10),
                  FACILITY_MANAGEMENT: Math.min(100, (departmentMetrics.FACILITY_MANAGEMENT?.total_messages || 0) / 10),
                  CUSTOMER_SERVICE: Math.min(100, (departmentMetrics.CUSTOMER_SERVICE?.total_messages || 0) / 10),
                  MANAGEMENT: Math.min(100, (departmentMetrics.MANAGEMENT?.total_messages || 0) / 10)
                }
              ]}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis domain={[0, 100]} />
                <Radar 
                  name="Equipment" 
                  dataKey="EQUIPMENT_MAINTENANCE" 
                  stroke={DEPARTMENT_COLORS.EQUIPMENT_MAINTENANCE} 
                  fill={DEPARTMENT_COLORS.EQUIPMENT_MAINTENANCE} 
                  fillOpacity={0.1}
                />
                <Radar 
                  name="Facility" 
                  dataKey="FACILITY_MANAGEMENT" 
                  stroke={DEPARTMENT_COLORS.FACILITY_MANAGEMENT} 
                  fill={DEPARTMENT_COLORS.FACILITY_MANAGEMENT} 
                  fillOpacity={0.1}
                />
                <Radar 
                  name="Customer Service" 
                  dataKey="CUSTOMER_SERVICE" 
                  stroke={DEPARTMENT_COLORS.CUSTOMER_SERVICE} 
                  fill={DEPARTMENT_COLORS.CUSTOMER_SERVICE} 
                  fillOpacity={0.1}
                />
                <Radar 
                  name="Management" 
                  dataKey="MANAGEMENT" 
                  stroke={DEPARTMENT_COLORS.MANAGEMENT} 
                  fill={DEPARTMENT_COLORS.MANAGEMENT} 
                  fillOpacity={0.1}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Performance Metrics Table */}
      <Grid item xs={12} md={4}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <AssignmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Detailed Metrics
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Department</TableCell>
                    <TableCell>Score</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(departmentMetrics).map(([department, metrics]) => {
                    const score = calculateEfficiencyScore(metrics);
                    return (
                      <TableRow key={department}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar 
                              sx={{ 
                                bgcolor: getDepartmentColor(department),
                                width: 24,
                                height: 24,
                                mr: 1
                              }}
                            >
                              {getDepartmentIcon(department)}
                            </Avatar>
                            <Typography variant="body2" noWrap>
                              {department.replace(/_/g, ' ').substring(0, 8)}...
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {score}%
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={
                              score >= 90 ? 'Excellent' :
                              score >= 75 ? 'Good' :
                              score >= 60 ? 'Average' : 'Needs Improvement'
                            }
                            color={
                              score >= 90 ? 'success' :
                              score >= 75 ? 'primary' :
                              score >= 60 ? 'warning' : 'error'
                            }
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Improvement Recommendations */}
      <Grid item xs={12}>
        <Alert severity="info">
          <AlertTitle>Performance Insights & Recommendations</AlertTitle>
          <Typography variant="body2">
            • Equipment Maintenance showing fastest response times - consider as best practice model
            <br />
            • Customer Service handling highest volume - may need additional resources
            <br />
            • Management escalations should maintain &lt;15 minute response target
            <br />
            • Consider cross-training between departments for load balancing
          </Typography>
        </Alert>
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          <BusinessIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Department Performance Dashboard
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
          <Tooltip title="Export Performance Report">
            <IconButton>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadDepartmentData}
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
          <Tab label="Overview" />
          <Tab label="Response Metrics" />
          <Tab label="Comparison" />
        </Tabs>
      </Box>

      {activeTab === 0 && <DepartmentOverviewTab />}
      {activeTab === 1 && <ResponseMetricsTab />}
      {activeTab === 2 && <DepartmentComparisonTab />}
    </Box>
  );
};

export default DepartmentPerformanceDashboard;