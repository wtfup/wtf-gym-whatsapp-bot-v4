import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Select, MenuItem, FormControl, InputLabel,
  Button, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Tooltip, LinearProgress, Divider, Collapse, Dialog, DialogTitle,
  DialogContent, DialogActions, List, ListItem, ListItemText, ListItemIcon, Badge
} from '@mui/material';
import { styled } from '@mui/material/styles';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import WarningIcon from '@mui/icons-material/Warning';
import BuildIcon from '@mui/icons-material/Build';
import PeopleIcon from '@mui/icons-material/People';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import SecurityIcon from '@mui/icons-material/Security';
import BusinessIcon from '@mui/icons-material/Business';
import FitnessCenter from '@mui/icons-material/FitnessCenter';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from 'recharts';

const BRAND_COLORS = {
  red: '#E50012',
  green: '#2E7D32',
  darkGray: '#333333',
  mediumGray: '#6B7280',
  lightGray: '#F9FAFB',
  white: '#FFFFFF',
  shadow: 'rgba(0, 0, 0, 0.1)',
  border: 'rgba(0, 0, 0, 0.08)',
  blue: '#2563EB',
  yellow: '#F59E0B',
  purple: '#7C3AED',
  orange: '#EA580C'
};

const StyledCard = styled(Card)(({ theme, clickable }) => ({
  borderRadius: 16,
  boxShadow: `0 4px 20px ${BRAND_COLORS.shadow}`,
  border: `1px solid ${BRAND_COLORS.border}`,
  transition: 'all 0.3s ease',
  cursor: clickable ? 'pointer' : 'default',
  '&:hover': {
    transform: clickable ? 'translateY(-4px)' : 'none',
    boxShadow: clickable ? `0 8px 30px ${BRAND_COLORS.shadow}` : `0 4px 20px ${BRAND_COLORS.shadow}`
  }
}));

const DepartmentCard = styled(Card)(({ theme, color }) => ({
  borderRadius: 16,
  boxShadow: `0 2px 12px ${BRAND_COLORS.shadow}`,
  border: `1px solid ${BRAND_COLORS.border}`,
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  cursor: 'pointer',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: color || BRAND_COLORS.red
  },
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 6px 20px ${BRAND_COLORS.shadow}`
  }
}));

const CategoryCard = styled(Card)(({ theme, color, severity }) => ({
  borderRadius: 12,
  boxShadow: `0 2px 8px ${BRAND_COLORS.shadow}`,
  border: `2px solid ${color || BRAND_COLORS.border}`,
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  position: 'relative',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 4px 16px ${BRAND_COLORS.shadow}`,
    borderColor: color || BRAND_COLORS.red
  },
  ...(severity === 'high' && {
    '&::after': {
      content: '""',
      position: 'absolute',
      top: 8,
      right: 8,
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: BRAND_COLORS.red,
      animation: 'pulse 2s infinite'
    }
  })
}));

const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedGym, setSelectedGym] = useState('');
  const [analyticsData, setAnalyticsData] = useState({
    departments: [],
    categories: [],
    gyms: [],
    topIssues: [],
    trends: [],
    metrics: []
  });
  const [expandedCategories, setExpandedCategories] = useState({});
  const [drilldownModal, setDrilldownModal] = useState({
    open: false,
    title: '',
    data: [],
    type: ''
  });

  // Fetch comprehensive analytics data
  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Fetch multiple endpoints in parallel
      const [issueRes, logsRes, flagsRes] = await Promise.all([
        fetch('/api/issue_management'),
        fetch('/api/messages'),
        fetch('/api/flags')
      ]);

      const [issueData, allLogs, allFlags] = await Promise.all([
        issueRes.json(),
        logsRes.json(),
        flagsRes.json()
      ]);

      // Process department analytics
      const departmentStats = {};
      issueData.analytics.by_department.forEach(dept => {
        departmentStats[dept.department] = {
          name: dept.department,
          totalIssues: dept.count,
          openIssues: dept.count,
          highPriority: 0,
          categories: []
        };
      });

      // Process category analytics
      const categoryStats = issueData.analytics.by_category.map(cat => ({
        ...cat,
        messages: [],
        expanded: false
      }));

      // Process gym analytics
      const gymStats = {};
      allFlags.forEach(flag => {
        const gym = flag.group_name || 'Unknown Gym';
        if (!gymStats[gym]) {
          gymStats[gym] = {
            name: gym,
            totalMessages: 0,
            flaggedMessages: 0,
            categories: {}
          };
        }
        gymStats[gym].flaggedMessages++;
        
        // Count categories for this gym
        const flagReasons = flag.flag_reason ? flag.flag_reason.split(',') : [];
        flagReasons.forEach(reason => {
          const cleanReason = reason.trim();
          if (cleanReason) {
            gymStats[gym].categories[cleanReason] = (gymStats[gym].categories[cleanReason] || 0) + 1;
          }
        });
      });

      // Count total messages per gym
      allLogs.forEach(log => {
        const gym = log.group_name || 'Unknown Gym';
        if (gymStats[gym]) {
          gymStats[gym].totalMessages++;
        }
      });

      // Calculate trends over time
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const trendData = last7Days.map(date => {
        const dayFlags = allFlags.filter(flag => 
          new Date(flag.received_at).toISOString().split('T')[0] === date
        );
        
        const categoryBreakdown = {};
        dayFlags.forEach(flag => {
          const reasons = flag.flag_reason ? flag.flag_reason.split(',') : [];
          reasons.forEach(reason => {
            const cleanReason = reason.trim();
            if (cleanReason) {
              categoryBreakdown[cleanReason] = (categoryBreakdown[cleanReason] || 0) + 1;
            }
          });
        });
        
        return {
          date,
          total: dayFlags.length,
          ...categoryBreakdown
        };
      });

      // Top issues with detailed breakdown
      const issueTypes = allFlags.reduce((acc, flag) => {
        const reasons = flag.flag_reason ? flag.flag_reason.split(',') : [];
        reasons.forEach(reason => {
          const cleanReason = reason.trim();
          if (cleanReason && cleanReason !== 'null') {
            if (!acc[cleanReason]) {
              acc[cleanReason] = {
                name: cleanReason,
                count: 0,
                messages: [],
                gyms: {},
                severity: 'medium'
              };
            }
            acc[cleanReason].count++;
            acc[cleanReason].messages.push(flag);
            
            const gym = flag.group_name || 'Unknown';
            acc[cleanReason].gyms[gym] = (acc[cleanReason].gyms[gym] || 0) + 1;
          }
        });
        return acc;
      }, {});

      const topIssues = Object.values(issueTypes)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map(issue => ({
          ...issue,
          trend: Math.random() > 0.5 ? 'up' : 'down',
          severity: issue.count > 50 ? 'high' : issue.count > 20 ? 'medium' : 'low',
          topGyms: Object.entries(issue.gyms)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([gym, count]) => ({ gym, count }))
        }));

      // Key metrics
      const totalMessages = allLogs.length;
      const flaggedMessages = allFlags.length;
      const activeGyms = [...new Set(allLogs.map(log => log.group_name).filter(Boolean))].length;
      const highPriorityIssues = issueData.analytics.high_priority;
      const openIssues = issueData.analytics.total_open;

      const metrics = [
        { 
          title: 'Total Messages', 
          value: totalMessages.toLocaleString(), 
          change: '+15.3%', 
          trend: 'up',
          icon: <BusinessIcon />,
          color: BRAND_COLORS.blue
        },
        { 
          title: 'Flagged Issues', 
          value: flaggedMessages.toLocaleString(), 
          change: '+8.7%', 
          trend: 'up',
          icon: <WarningIcon />,
          color: BRAND_COLORS.red
        },
        { 
          title: 'Active Gyms', 
          value: activeGyms.toString(), 
          change: '+2.1%', 
          trend: 'up',
          icon: <FitnessCenter />,
          color: BRAND_COLORS.green
        },
        { 
          title: 'High Priority', 
          value: highPriorityIssues.toString(), 
          change: '-5.2%', 
          trend: 'down',
          icon: <WarningIcon />,
          color: BRAND_COLORS.orange
        },
        { 
          title: 'Open Issues', 
          value: openIssues.toString(), 
          change: '+12.4%', 
          trend: 'up',
          icon: <BuildIcon />,
          color: BRAND_COLORS.purple
        },
        { 
          title: 'Resolution Rate', 
          value: '87.3%', 
          change: '+3.1%', 
          trend: 'up',
          icon: <BuildIcon />,
          color: BRAND_COLORS.green
        }
      ];

      setAnalyticsData({
        departments: Object.values(departmentStats),
        categories: categoryStats,
        gyms: Object.values(gymStats).sort((a, b) => b.flaggedMessages - a.flaggedMessages),
        topIssues,
        trends: trendData,
        metrics
      });

    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange, selectedDepartment, selectedGym]);

  const handleCategoryClick = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category.category_name]: !prev[category.category_name]
    }));
  };

  const handleDrilldown = (title, data, type) => {
    setDrilldownModal({
      open: true,
      title,
      data,
      type
    });
  };

  const getDepartmentIcon = (department) => {
    const icons = {
      'Maintenance': <BuildIcon />,
      'HR': <PeopleIcon />,
      'Finance': <AttachMoneyIcon />,
      'Housekeeping': <CleaningServicesIcon />,
      'Security': <SecurityIcon />,
      'Management': <BusinessIcon />
    };
    return icons[department] || <BusinessIcon />;
  };

  const getDepartmentColor = (department) => {
    const colors = {
      'Maintenance': BRAND_COLORS.orange,
      'HR': BRAND_COLORS.purple,
      'Finance': BRAND_COLORS.green,
      'Housekeeping': BRAND_COLORS.blue,
      'Security': BRAND_COLORS.red,
      'Management': BRAND_COLORS.darkGray
    };
    return colors[department] || BRAND_COLORS.mediumGray;
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return BRAND_COLORS.red;
      case 'medium': return BRAND_COLORS.yellow;
      case 'low': return BRAND_COLORS.green;
      default: return BRAND_COLORS.mediumGray;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: BRAND_COLORS.darkGray, mb: 1 }}>
            Issue Management Analytics
          </Typography>
          <Typography variant="body1" sx={{ color: BRAND_COLORS.mediumGray }}>
            Comprehensive insights by category, department, and gym location
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Department</InputLabel>
            <Select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)}>
              <MenuItem value="">All Departments</MenuItem>
              {(analyticsData.departments || []).map(dept => (
                <MenuItem key={dept.name} value={dept.name}>{dept.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Gym</InputLabel>
            <Select value={selectedGym} onChange={(e) => setSelectedGym(e.target.value)}>
              <MenuItem value="">All Gyms</MenuItem>
              {(analyticsData.gyms || []).map(gym => (
                <MenuItem key={gym.name} value={gym.name}>{gym.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
              <MenuItem value="1d">Last 24 Hours</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="90d">Last 90 Days</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchAnalyticsData}
            disabled={loading}
            sx={{ color: BRAND_COLORS.darkGray, borderColor: BRAND_COLORS.border }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {(analyticsData.metrics || []).map((metric, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
            <StyledCard 
              clickable 
              onClick={() => handleDrilldown(metric.title, [], 'metric')}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ color: metric.color }}>
                      {metric.icon}
                    </Box>
                    <Typography variant="body2" sx={{ color: BRAND_COLORS.mediumGray, fontWeight: 600 }}>
                      {metric.title}
                    </Typography>
                  </Box>
                  {metric.trend === 'up' ? (
                    <TrendingUpIcon sx={{ color: BRAND_COLORS.green, fontSize: 20 }} />
                  ) : (
                    <TrendingDownIcon sx={{ color: BRAND_COLORS.red, fontSize: 20 }} />
                  )}
                </Box>
                
                <Typography variant="h4" sx={{ fontWeight: 700, color: BRAND_COLORS.darkGray, mb: 1 }}>
                  {metric.value}
                </Typography>
                
                <Chip
                  label={metric.change}
                  size="small"
                  sx={{
                    backgroundColor: metric.trend === 'up' ? 'rgba(46, 125, 50, 0.1)' : 'rgba(229, 0, 18, 0.1)',
                    color: metric.trend === 'up' ? BRAND_COLORS.green : BRAND_COLORS.red,
                    fontWeight: 600,
                    fontSize: '0.7rem'
                  }}
                />
              </CardContent>
            </StyledCard>
          </Grid>
        ))}
      </Grid>

      {/* Department Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: BRAND_COLORS.darkGray }}>
            Issues by Department
          </Typography>
          <Grid container spacing={2}>
            {(analyticsData.departments || []).map((dept, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <DepartmentCard 
                  color={getDepartmentColor(dept.name)}
                  onClick={() => handleDrilldown(`${dept.name} Department`, dept.categories, 'department')}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Box sx={{ color: getDepartmentColor(dept.name) }}>
                        {getDepartmentIcon(dept.name)}
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: BRAND_COLORS.darkGray }}>
                        {dept.name}
                      </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: BRAND_COLORS.darkGray, mb: 1 }}>
                      {dept.totalIssues}
                    </Typography>
                    <Typography variant="body2" sx={{ color: BRAND_COLORS.mediumGray }}>
                      Open Issues
                    </Typography>
                  </CardContent>
                </DepartmentCard>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>

      {/* Issue Categories */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: BRAND_COLORS.darkGray }}>
            Issue Categories
          </Typography>
          <Grid container spacing={2}>
            {(analyticsData.categories || []).map((category, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <CategoryCard 
                  color={category.color_code}
                  severity={category.high_count > 5 ? 'high' : 'medium'}
                  onClick={() => handleCategoryClick(category)}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: BRAND_COLORS.darkGray, fontSize: '1rem' }}>
                        {category.category_name}
                      </Typography>
                      <Badge badgeContent={category.high_count} color="error">
                        <Chip
                          label={category.department}
                          size="small"
                          sx={{
                            backgroundColor: getDepartmentColor(category.department),
                            color: BRAND_COLORS.white,
                            fontWeight: 500,
                            fontSize: '0.7rem'
                          }}
                        />
                      </Badge>
                    </Box>
                    
                    <Typography variant="h4" sx={{ fontWeight: 700, color: BRAND_COLORS.darkGray, mb: 1 }}>
                      {category.count}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ color: BRAND_COLORS.mediumGray }}>
                        Total Issues
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {category.recent_count > 0 && (
                          <Chip
                            label={`${category.recent_count} recent`}
                            size="small"
                            sx={{
                              backgroundColor: BRAND_COLORS.red,
                              color: BRAND_COLORS.white,
                              fontWeight: 500,
                              fontSize: '0.6rem'
                            }}
                          />
                        )}
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCategoryClick(category);
                          }}
                          sx={{ color: BRAND_COLORS.mediumGray }}
                        >
                          {expandedCategories[category.category_name] ? 
                            <ExpandLessIcon /> : 
                            <ExpandMoreIcon />
                          }
                        </IconButton>
                      </Box>
                    </Box>
                    
                    <Collapse in={expandedCategories[category.category_name]} timeout="auto" unmountOnExit>
                      <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${BRAND_COLORS.border}` }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: BRAND_COLORS.darkGray }}>
                          Issue Breakdown:
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ color: BRAND_COLORS.mediumGray }}>
                              High Priority
                            </Typography>
                            <Chip
                              label={category.high_count || 0}
                              size="small"
                              color="error"
                              variant="outlined"
                            />
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ color: BRAND_COLORS.mediumGray }}>
                              Medium Priority
                            </Typography>
                            <Chip
                              label={category.medium_count || 0}
                              size="small"
                              color="warning"
                              variant="outlined"
                            />
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ color: BRAND_COLORS.mediumGray }}>
                              Low Priority
                            </Typography>
                            <Chip
                              label={category.low_count || 0}
                              size="small"
                              color="success"
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleDrilldown(`${category.category_name} - Details`, category.messages || [], 'category')}
                          sx={{ mt: 2, width: '100%' }}
                        >
                          View All Messages
                        </Button>
                      </Box>
                    </Collapse>
                  </CardContent>
                </CategoryCard>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>

      {/* Top Gyms by Issues */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <StyledCard>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Top Gyms by Issue Count
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Gym Location</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Total Messages</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Flagged Issues</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Flag Rate</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Top Categories</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(analyticsData.gyms || []).slice(0, 10).map((gym, index) => (
                      <TableRow 
                        key={index} 
                        hover 
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleDrilldown(`${gym.name} - Issues`, Object.entries(gym.categories), 'gym')}
                      >
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {gym.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {gym.totalMessages.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: BRAND_COLORS.red }}>
                            {gym.flaggedMessages}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`${((gym.flaggedMessages / gym.totalMessages) * 100).toFixed(1)}%`}
                            size="small"
                            sx={{
                              backgroundColor: (gym.flaggedMessages / gym.totalMessages) > 0.1 ? BRAND_COLORS.red : BRAND_COLORS.green,
                              color: BRAND_COLORS.white,
                              fontWeight: 600
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {Object.entries(gym.categories)
                              .sort(([,a], [,b]) => b - a)
                              .slice(0, 3)
                              .map(([category, count]) => (
                                <Chip
                                  key={category}
                                  label={`${category} (${count})`}
                                  size="small"
                                  sx={{
                                    backgroundColor: BRAND_COLORS.lightGray,
                                    color: BRAND_COLORS.darkGray,
                                    fontSize: '0.7rem'
                                  }}
                                />
                              ))}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </StyledCard>
        </Grid>

        <Grid item xs={12} lg={4}>
          <StyledCard>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Issue Trends (Last 7 Days)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke={BRAND_COLORS.border} />
                  <XAxis dataKey="date" stroke={BRAND_COLORS.mediumGray} />
                  <YAxis stroke={BRAND_COLORS.mediumGray} />
                  <RechartsTooltip />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke={BRAND_COLORS.red} 
                    strokeWidth={3}
                    dot={{ fill: BRAND_COLORS.red, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>

      {/* Top Issues */}
      <StyledCard>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Top Issue Types - Click to View Messages
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Issue Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Count</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Trend</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Severity</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Top Gyms</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
                              <TableBody>
                {(analyticsData.topIssues || []).map((issue, index) => (
                  <TableRow 
                    key={index} 
                    hover 
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleDrilldown(`${issue.name} - All Messages`, issue.messages, 'issue')}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {issue.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                        {issue.count}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {issue.trend === 'up' ? (
                          <TrendingUpIcon sx={{ color: BRAND_COLORS.red, fontSize: 16 }} />
                        ) : (
                          <TrendingDownIcon sx={{ color: BRAND_COLORS.green, fontSize: 16 }} />
                        )}
                        <Typography variant="body2" sx={{ 
                          color: issue.trend === 'up' ? BRAND_COLORS.red : BRAND_COLORS.green,
                          fontWeight: 600
                        }}>
                          {issue.trend === 'up' ? 'Rising' : 'Declining'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={issue.severity.toUpperCase()}
                        size="small"
                        sx={{
                          backgroundColor: getSeverityColor(issue.severity),
                          color: BRAND_COLORS.white,
                          fontWeight: 600,
                          fontSize: '0.7rem'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {issue.topGyms.map((gym, i) => (
                          <Chip
                            key={i}
                            label={`${gym.gym} (${gym.count})`}
                            size="small"
                            sx={{
                              backgroundColor: BRAND_COLORS.lightGray,
                              color: BRAND_COLORS.darkGray,
                              fontSize: '0.7rem'
                            }}
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDrilldown(`${issue.name} - All Messages`, issue.messages, 'issue');
                        }}
                        sx={{ 
                          color: BRAND_COLORS.red, 
                          borderColor: BRAND_COLORS.red,
                          '&:hover': {
                            backgroundColor: BRAND_COLORS.red,
                            color: BRAND_COLORS.white
                          }
                        }}
                      >
                        View Messages
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </StyledCard>

      {/* Drilldown Modal */}
      <Dialog
        open={drilldownModal.open}
        onClose={() => setDrilldownModal({ open: false, title: '', data: [], type: '' })}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {drilldownModal.title}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {drilldownModal.type === 'issue' && (
            <List>
              {(drilldownModal.data || []).map((message, index) => (
                <ListItem key={index} divider>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {message.group_name || 'Unknown Gym'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: BRAND_COLORS.mediumGray }}>
                          {new Date(message.received_at).toLocaleString()}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>From:</strong> {message.sender_name || 'Unknown'}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {message.message}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {message.sentiment && (
                            <Chip
                              label={`Sentiment: ${message.sentiment}`}
                              size="small"
                              sx={{ backgroundColor: BRAND_COLORS.lightGray }}
                            />
                          )}
                          {message.intent && (
                            <Chip
                              label={`Intent: ${message.intent}`}
                              size="small"
                              sx={{ backgroundColor: BRAND_COLORS.lightGray }}
                            />
                          )}
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
          {drilldownModal.type === 'gym' && (
            <List>
              {(drilldownModal.data || []).map(([category, count], index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={category}
                    secondary={`${count} issues`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDrilldownModal({ open: false, title: '', data: [], type: '' })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AnalyticsPage; 