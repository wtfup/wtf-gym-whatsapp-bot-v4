import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import axios from 'axios';

const BRAND_COLORS = {
  red: '#E50012',
  green: '#2E7D32',
  darkGray: '#333333',
  mediumGray: '#6B7280',
  lightGray: '#F9FAFB',
  white: '#FFFFFF',
  blue: '#2563EB',
  yellow: '#F59E42',
  border: 'rgba(0, 0, 0, 0.08)'
};

const ChartContainer = styled(Paper)(({ theme }) => ({
  padding: 24,
  borderRadius: 16,
  marginBottom: 32,
  boxShadow: `0 2px 8px ${BRAND_COLORS.border}`,
  background: BRAND_COLORS.white
}));

const COLORS = [BRAND_COLORS.red, BRAND_COLORS.green, BRAND_COLORS.blue, BRAND_COLORS.yellow, BRAND_COLORS.darkGray];

const KeywordAnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      const res = await axios.get('/api/keyword_analytics');
      setAnalytics(res.data);
      setLoading(false);
    }
    fetchAnalytics();
  }, []);

  if (loading || !analytics) return <Box sx={{ p: 6, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 800, color: BRAND_COLORS.red }}>
        Keyword Analytics
      </Typography>
      <ChartContainer>
        <Typography variant="h6" sx={{ mb: 2 }}>Flagged Keyword Counts</Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analytics.flagCounts}>
            <XAxis dataKey="keyword" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill={BRAND_COLORS.red} onClick={(data) => alert(`Drilldown: ${data.keyword}`)} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
      <ChartContainer>
        <Typography variant="h6" sx={{ mb: 2 }}>Sentiment Distribution</Typography>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={analytics.sentimentDist} dataKey="value" nameKey="sentiment" cx="50%" cy="50%" outerRadius={80} label>
              {analytics.sentimentDist.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Legend />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
      <ChartContainer>
        <Typography variant="h6" sx={{ mb: 2 }}>Intent Distribution</Typography>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={analytics.intentDist} dataKey="value" nameKey="intent" cx="50%" cy="50%" outerRadius={80} label>
              {analytics.intentDist.map((entry, idx) => (
                <Cell key={`cell-intent-${idx}`} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Legend />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
    </Box>
  );
};

export default KeywordAnalyticsPage; 