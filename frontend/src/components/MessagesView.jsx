import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Pagination,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Search,
  Refresh,
  FilterList,
  Flag,
  AccessTime,
  Person,
  Group,
  TrendingUp
} from '@mui/icons-material';

const MessagesView = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    flagType: 'all',
    sentiment: 'all',
    groupName: 'all',
    page: 1,
    limit: 50
  });
  const [stats, setStats] = useState({
    total: 0,
    flagged: 0,
    pending: 0
  });

  // Fetch messages data
  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: filters.page,
        limit: filters.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.flagType !== 'all' && { flag_type: filters.flagType }),
        ...(filters.sentiment !== 'all' && { sentiment: filters.sentiment }),
        ...(filters.groupName !== 'all' && { group_name: filters.groupName })
      });

      const response = await fetch(`/api/logs?${params}`);
      const data = await response.json();

      if (data.success) {
        setMessages(data.messages || []);
        setStats({
          total: data.total || 0,
          flagged: data.flagged || 0,
          pending: data.pending || 0
        });
      } else {
        throw new Error(data.error || 'Failed to fetch messages');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchMessages, 30000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return 'success';
      case 'negative': return 'error';
      case 'neutral': return 'default';
      default: return 'secondary';
    }
  };

  const getFlagTypeColor = (flagType) => {
    switch (flagType) {
      case 'complaint': return 'error';
      case 'urgent': return 'warning';
      case 'question': return 'info';
      case 'feedback': return 'success';
      default: return 'default';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" color="text.primary" sx={{ fontWeight: 'bold' }}>
          📨 Messages View
        </Typography>
        
        <Box display="flex" gap={2} alignItems="center">
          <Tooltip title="Refresh Messages">
            <IconButton onClick={fetchMessages} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <TrendingUp color="primary" />
                <Box>
                  <Typography variant="h5" color="primary">
                    {stats.total.toLocaleString()}
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
                <Flag color="error" />
                <Box>
                  <Typography variant="h5" color="error">
                    {stats.flagged.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Flagged Messages
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
                <AccessTime color="warning" />
                <Box>
                  <Typography variant="h5" color="warning">
                    {stats.pending.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Review
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
                <Person color="info" />
                <Box>
                  <Typography variant="h5" color="info">
                    {Math.round((stats.flagged / stats.total) * 100) || 0}%
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

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <FilterList />
            <Typography variant="h6">Filters</Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Search Messages"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Flag Type</InputLabel>
                <Select
                  value={filters.flagType}
                  label="Flag Type"
                  onChange={(e) => handleFilterChange('flagType', e.target.value)}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="complaint">Complaints</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                  <MenuItem value="question">Questions</MenuItem>
                  <MenuItem value="feedback">Feedback</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Sentiment</InputLabel>
                <Select
                  value={filters.sentiment}
                  label="Sentiment"
                  onChange={(e) => handleFilterChange('sentiment', e.target.value)}
                >
                  <MenuItem value="all">All Sentiments</MenuItem>
                  <MenuItem value="positive">Positive</MenuItem>
                  <MenuItem value="neutral">Neutral</MenuItem>
                  <MenuItem value="negative">Negative</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Items per Page</InputLabel>
                <Select
                  value={filters.limit}
                  label="Items per Page"
                  onChange={(e) => handleFilterChange('limit', e.target.value)}
                >
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                  <MenuItem value={100}>100</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setFilters({
                  search: '',
                  flagType: 'all',
                  sentiment: 'all',
                  groupName: 'all',
                  page: 1,
                  limit: 50
                })}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Messages List */}
      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={2}>
            {messages.map((message, index) => (
              <Grid item xs={12} key={message.id || index}>
                <Card sx={{ 
                  border: message.flag_type ? '1px solid' : 'none',
                  borderColor: message.flag_type ? 'error.main' : 'transparent'
                }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="h6" color="text.primary">
                          {message.sender_name || 'Unknown Sender'}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1} mt={1}>
                          <Group fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {message.group_name || 'Direct Message'}
                          </Typography>
                          <AccessTime fontSize="small" color="action" sx={{ ml: 2 }} />
                          <Typography variant="body2" color="text.secondary">
                            {formatTimestamp(message.received_at)}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box display="flex" gap={1}>
                        {message.sentiment && (
                          <Chip
                            label={message.sentiment}
                            color={getSentimentColor(message.sentiment)}
                            size="small"
                          />
                        )}
                        {message.flag_type && (
                          <Chip
                            label={message.flag_type}
                            color={getFlagTypeColor(message.flag_type)}
                            size="small"
                            icon={<Flag />}
                          />
                        )}
                        {message.confidence && (
                          <Chip
                            label={`${Math.round(message.confidence * 100)}%`}
                            variant="outlined"
                            size="small"
                          />
                        )}
                      </Box>
                    </Box>
                    
                    <Typography variant="body1" color="text.primary" sx={{ mb: 2 }}>
                      {message.message}
                    </Typography>
                    
                    {message.intent && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>Intent:</strong> {message.intent}
                      </Typography>
                    )}
                    
                    {message.flag_reason && (
                      <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                        <strong>Flag Reason:</strong> {message.flag_reason}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {messages.length > 0 && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination
                count={Math.ceil(stats.total / filters.limit)}
                page={filters.page}
                onChange={(event, value) => handleFilterChange('page', value)}
                color="primary"
                size="large"
              />
            </Box>
          )}

          {messages.length === 0 && !loading && (
            <Card>
              <CardContent>
                <Box textAlign="center" py={4}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No messages found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Try adjusting your filters or check back later
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Box>
  );
};

export default MessagesView; 