import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, 
  IconButton, Tabs, Tab, Paper, Skeleton, Card, CardContent, List, ListItem,
  ListItemText, Chip, FormControl, Select, MenuItem, InputLabel, Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BarChartIcon from '@mui/icons-material/BarChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import ListIcon from '@mui/icons-material/List';
import FilterListIcon from '@mui/icons-material/FilterList';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

// Updated WTF Brand Colors
const BRAND_COLORS = {
  red: '#E50012',
  green: '#2E7D32',
  darkGray: '#333333',
  mediumGray: '#6B7280',
  lightGray: '#F9FAFB',
  white: '#FFFFFF',
  shadow: 'rgba(0, 0, 0, 0.1)',
  border: 'rgba(0, 0, 0, 0.08)'
};

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 16,
    maxWidth: '1200px',
    width: '95vw',
    maxHeight: '90vh',
    boxShadow: `0 24px 48px ${BRAND_COLORS.shadow}`,
    overflow: 'hidden'
  }
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  background: `linear-gradient(135deg, ${BRAND_COLORS.white} 0%, ${BRAND_COLORS.lightGray} 100%)`,
  borderBottom: `1px solid ${BRAND_COLORS.border}`,
  padding: '24px 32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  position: 'sticky',
  top: 0,
  zIndex: 1
}));

const MetricCard = styled(Paper)(({ theme }) => ({
  padding: '20px',
  borderRadius: 12,
  border: `1px solid ${BRAND_COLORS.border}`,
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 8px 24px ${BRAND_COLORS.shadow}`,
    borderColor: BRAND_COLORS.red
  }
}));

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`analytics-tabpanel-${index}`}
    aria-labelledby={`analytics-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const AnalyticsModal = ({
  open,
  onClose,
  title,
  metricType,
  initialValue,
  onMessageClick,
  loading = false
}) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [timeRange, setTimeRange] = useState('7d');
  const [chartData, setChartData] = useState([]);
  const [relatedMessages, setRelatedMessages] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [distributionData, setDistributionData] = useState([]);
  const [loadingChart, setLoadingChart] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    if (open && metricType) {
      fetchAnalyticsData();
    }
  }, [open, metricType, timeRange]);

  const fetchAnalyticsData = async () => {
    setLoadingChart(true);
    setLoadingMessages(true);

    try {
      // Fetch chart data
      const chartResponse = await fetch(`/api/analytics/${metricType}?range=${timeRange}`);
      const chartData = await chartResponse.json();
      setChartData(chartData.timeline || []);
      setTrendData(chartData.trend || []);
      setDistributionData(chartData.distribution || []);

      // Fetch related messages
      const messagesResponse = await fetch(`/api/analytics/${metricType}/messages?range=${timeRange}&limit=20`);
      const messagesData = await messagesResponse.json();
      setRelatedMessages(messagesData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoadingChart(false);
      setLoadingMessages(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "--";
    const date = new Date(timestamp);
    return format(date, 'MMM dd, yyyy HH:mm');
  };

  const getChartColor = (index) => {
    const colors = [BRAND_COLORS.red, BRAND_COLORS.green, '#F59E0B', '#8B5CF6', '#06B6D4'];
    return colors[index % colors.length];
  };

  const renderOverviewTab = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Key Metrics */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
        <MetricCard>
          <Typography variant="h6" sx={{ color: BRAND_COLORS.red, fontWeight: 600 }}>
            Current Value
          </Typography>
          <Typography variant="h3" sx={{ color: BRAND_COLORS.darkGray, fontWeight: 700 }}>
            {initialValue}
          </Typography>
          <Typography variant="body2" sx={{ color: BRAND_COLORS.mediumGray }}>
            Total count
          </Typography>
        </MetricCard>
        
        <MetricCard>
          <Typography variant="h6" sx={{ color: BRAND_COLORS.green, fontWeight: 600 }}>
            Trend
          </Typography>
          <Typography variant="h3" sx={{ color: BRAND_COLORS.darkGray, fontWeight: 700 }}>
            {trendData.length > 0 ? `${trendData[trendData.length - 1]?.change || 0}%` : '0%'}
          </Typography>
          <Typography variant="body2" sx={{ color: BRAND_COLORS.mediumGray }}>
            vs last period
          </Typography>
        </MetricCard>
        
        <MetricCard>
          <Typography variant="h6" sx={{ color: '#F59E0B', fontWeight: 600 }}>
            Peak Day
          </Typography>
          <Typography variant="h3" sx={{ color: BRAND_COLORS.darkGray, fontWeight: 700 }}>
            {chartData.length > 0 ? Math.max(...chartData.map(d => d.value)) : 0}
          </Typography>
          <Typography variant="body2" sx={{ color: BRAND_COLORS.mediumGray }}>
            Highest single day
          </Typography>
        </MetricCard>
      </Box>

      {/* Time Range Selector */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Timeline Analysis
        </Typography>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            onChange={handleTimeRangeChange}
            label="Time Range"
            size="small"
          >
            <MenuItem value="7d">Last 7 days</MenuItem>
            <MenuItem value="30d">Last 30 days</MenuItem>
            <MenuItem value="90d">Last 90 days</MenuItem>
            <MenuItem value="1y">Last year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Timeline Chart */}
      <Paper sx={{ p: 3, borderRadius: 2, border: `1px solid ${BRAND_COLORS.border}`, height: 400 }}>
        {loadingChart ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Skeleton variant="rectangular" width="100%" height="100%" />
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={BRAND_COLORS.border} />
              <XAxis 
                dataKey="date" 
                stroke={BRAND_COLORS.mediumGray}
                fontSize={12}
                tickFormatter={(date) => format(new Date(date), 'MMM dd')}
              />
              <YAxis stroke={BRAND_COLORS.mediumGray} fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: BRAND_COLORS.white,
                  border: `1px solid ${BRAND_COLORS.border}`,
                  borderRadius: 8,
                  boxShadow: `0 4px 12px ${BRAND_COLORS.shadow}`
                }}
                labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={BRAND_COLORS.red} 
                strokeWidth={3}
                dot={{ fill: BRAND_COLORS.red, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: BRAND_COLORS.red, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Paper>
    </Box>
  );

  const renderDistributionTab = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        Distribution Analysis
      </Typography>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 3 }}>
        {/* Pie Chart */}
        <Paper sx={{ p: 3, borderRadius: 2, border: `1px solid ${BRAND_COLORS.border}`, height: 400 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Category Breakdown</Typography>
          {loadingChart ? (
            <Skeleton variant="circular" width={300} height={300} />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getChartColor(index)} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Paper>

        {/* Bar Chart */}
        <Paper sx={{ p: 3, borderRadius: 2, border: `1px solid ${BRAND_COLORS.border}`, height: 400 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Volume by Category</Typography>
          {loadingChart ? (
            <Skeleton variant="rectangular" width="100%" height={300} />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke={BRAND_COLORS.border} />
                <XAxis dataKey="name" stroke={BRAND_COLORS.mediumGray} fontSize={12} />
                <YAxis stroke={BRAND_COLORS.mediumGray} fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" fill={BRAND_COLORS.red} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Paper>
      </Box>
    </Box>
  );

  const renderMessagesTab = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Related Messages
        </Typography>
        <Chip 
          icon={<ListIcon />}
          label={`${relatedMessages.length} messages`}
          sx={{ backgroundColor: BRAND_COLORS.lightGray }}
        />
      </Box>

      {loadingMessages ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="rectangular" height={100} />
          ))}
        </Box>
      ) : (
        <List sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
          {relatedMessages.map((message, index) => (
            <React.Fragment key={message.id || index}>
              <ListItem
                sx={{
                  cursor: 'pointer',
                  borderRadius: 1,
                  mb: 1,
                  '&:hover': {
                    backgroundColor: BRAND_COLORS.lightGray,
                    transform: 'translateX(4px)'
                  },
                  transition: 'all 0.2s ease'
                }}
                onClick={() => onMessageClick?.(message)}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {message.sender_name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: BRAND_COLORS.mediumGray }}>
                        {formatTime(message.received_at)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1, color: BRAND_COLORS.darkGray }}>
                        {message.message?.substring(0, 150)}
                        {message.message?.length > 150 && '...'}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {message.group_name && (
                          <Chip label={message.group_name} size="small" />
                        )}
                        {message.sentiment && (
                          <Chip 
                            label={message.sentiment} 
                            size="small" 
                            sx={{ 
                              backgroundColor: message.sentiment === 'positive' ? BRAND_COLORS.green : 
                                             message.sentiment === 'negative' ? BRAND_COLORS.red : 
                                             BRAND_COLORS.mediumGray,
                              color: BRAND_COLORS.white
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
              {index < relatedMessages.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Box>
  );

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <StyledDialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TrendingUpIcon sx={{ color: BRAND_COLORS.red, fontSize: 28 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: BRAND_COLORS.darkGray }}>
              {title} Analytics
            </Typography>
            <Typography variant="body2" sx={{ color: BRAND_COLORS.mediumGray, mt: 0.5 }}>
              Detailed analysis and insights
            </Typography>
          </Box>
        </Box>
        <IconButton 
          onClick={onClose}
          sx={{ 
            color: BRAND_COLORS.mediumGray,
            '&:hover': { 
              color: BRAND_COLORS.red,
              backgroundColor: 'rgba(229, 0, 18, 0.1)'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </StyledDialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          sx={{
            borderBottom: `1px solid ${BRAND_COLORS.border}`,
            '& .MuiTabs-indicator': {
              backgroundColor: BRAND_COLORS.red,
              height: 3
            }
          }}
        >
          <Tab 
            icon={<TimelineIcon />} 
            label="Overview" 
            iconPosition="start"
            sx={{ fontWeight: 600 }}
          />
          <Tab 
            icon={<BarChartIcon />} 
            label="Distribution" 
            iconPosition="start"
            sx={{ fontWeight: 600 }}
          />
          <Tab 
            icon={<ListIcon />} 
            label="Messages" 
            iconPosition="start"
            sx={{ fontWeight: 600 }}
          />
        </Tabs>

        <TabPanel value={currentTab} index={0}>
          {renderOverviewTab()}
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          {renderDistributionTab()}
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          {renderMessagesTab()}
        </TabPanel>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: `1px solid ${BRAND_COLORS.border}` }}>
        <Button 
          onClick={onClose} 
          variant="outlined"
          sx={{ 
            color: BRAND_COLORS.mediumGray,
            borderColor: BRAND_COLORS.border,
            '&:hover': {
              borderColor: BRAND_COLORS.red,
              color: BRAND_COLORS.red
            }
          }}
        >
          Close
        </Button>
        <Button 
          variant="contained"
          sx={{ 
            backgroundColor: BRAND_COLORS.red,
            '&:hover': {
              backgroundColor: BRAND_COLORS.red,
              opacity: 0.9
            }
          }}
          onClick={() => window.open(`/analytics/${metricType}`, '_blank')}
        >
          View Full Report
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default AnalyticsModal; 