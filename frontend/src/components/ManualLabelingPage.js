import React, { useState, useEffect } from 'react';
import {
  Grid, Typography, Card, CardContent, CardHeader, Box, Chip, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, FormControl, InputLabel, Select, MenuItem, Pagination,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Rating, Alert, CircularProgress, Tabs, Tab, LinearProgress
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  EditNote as EditNoteIcon,
  Analytics as AnalyticsIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  transition: 'box-shadow 0.3s ease',
  '&:hover': {
    boxShadow: '0 8px 16px rgba(0,0,0,0.15)'
  }
}));

const ConfidenceBar = styled(LinearProgress)(({ theme, value }) => ({
  height: 8,
  borderRadius: 4,
  '& .MuiLinearProgress-bar': {
    backgroundColor: value < 50 ? theme.palette.error.main : 
                     value < 70 ? theme.palette.warning.main : 
                     theme.palette.success.main
  },
  '& .MuiLinearProgress-root': {
    backgroundColor: theme.palette.grey[200]
  }
}));

const ManualLabelingPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [accuracyMetrics, setAccuracyMetrics] = useState({});
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });
  const [confidenceRange, setConfidenceRange] = useState('medium');
  const [labelDialog, setLabelDialog] = useState({ open: false, message: null });
  const [labelForm, setLabelForm] = useState({
    correct_sentiment: '',
    correct_intent: '',
    correct_category_id: '',
    feedback_notes: '',
    ai_accuracy_rating: 3
  });
  const [categories, setCategories] = useState([]);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadData();
    loadCategories();
  }, [pagination.page, confidenceRange]);

  useEffect(() => {
    if (activeTab === 1) {
      loadAccuracyMetrics();
    }
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/ai-labeling/pending?page=${pagination.page}&limit=50&confidence_range=${confidenceRange}`
      );
      if (response.ok) {
        const data = await response.json();
        setMessages(data.data || []);
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total || 0,
          pages: data.pagination?.pages || 0
        }));
      }
    } catch (error) {
      console.error('Error loading messages for labeling:', error);
      setNotification({ type: 'error', message: 'Failed to load messages' });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/issue-categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadAccuracyMetrics = async () => {
    try {
      const response = await fetch('/api/ai-labeling/accuracy?days=30');
      if (response.ok) {
        const data = await response.json();
        setAccuracyMetrics(data.data || {});
      }
    } catch (error) {
      console.error('Error loading accuracy metrics:', error);
    }
  };

  const handleOpenLabelDialog = (message) => {
    setLabelDialog({ open: true, message });
    setLabelForm({
      correct_sentiment: message.sentiment || '',
      correct_intent: message.intent || '',
      correct_category_id: message.routed_category ? 
        categories.find(c => c.category_name === message.routed_category)?.id || '' : '',
      feedback_notes: '',
      ai_accuracy_rating: 3
    });
  };

  const handleSubmitLabel = async () => {
    try {
      const response = await fetch('/api/ai-labeling/label', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message_id: labelDialog.message.id,
          ...labelForm,
          labeled_by: 'Admin' // In real app, use logged-in user
        })
      });

      if (response.ok) {
        setNotification({ type: 'success', message: 'Label saved successfully!' });
        setLabelDialog({ open: false, message: null });
        loadData(); // Refresh the list
      } else {
        setNotification({ type: 'error', message: 'Failed to save label' });
      }
    } catch (error) {
      console.error('Error saving label:', error);
      setNotification({ type: 'error', message: 'Failed to save label' });
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return '#4caf50';
      case 'negative': return '#f44336';
      case 'neutral': return '#9e9e9e';
      default: return '#9e9e9e';
    }
  };

  const getIntentColor = (intent) => {
    switch (intent?.toLowerCase()) {
      case 'complaint': return '#f44336';
      case 'question': return '#2196f3';
      case 'booking': return '#ff9800';
      case 'general': return '#9e9e9e';
      default: return '#9e9e9e';
    }
  };

  const TabPanel = ({ children, value, index }) => {
    return (
      <div role="tabpanel" hidden={value !== index}>
        {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
      </div>
    );
  };

  const renderLabelingInterface = () => (
    <Grid container spacing={3}>
      {/* Controls */}
      <Grid item xs={12}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Messages for Manual Labeling ({pagination.total} total)
          </Typography>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Confidence Range</InputLabel>
            <Select
              value={confidenceRange}
              label="Confidence Range"
              onChange={(e) => {
                setConfidenceRange(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
            >
              <MenuItem value="low">Low Confidence (0-50%)</MenuItem>
              <MenuItem value="medium">Medium Confidence (50-80%)</MenuItem>
              <MenuItem value="high">High Confidence (80%+)</MenuItem>
              <MenuItem value="all">All Messages</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Alert severity="info" sx={{ mb: 2 }}>
          Review AI classifications and provide correct labels to improve routing accuracy. 
          Focus on lower confidence messages first for maximum impact.
        </Alert>
      </Grid>

      {/* Messages Table */}
      <Grid item xs={12}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Message</TableCell>
                <TableCell>AI Analysis</TableCell>
                <TableCell>Confidence</TableCell>
                <TableCell>Routing Result</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : (
                messages.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell sx={{ maxWidth: 300 }}>
                      <Typography variant="body2" noWrap>
                        {message.message}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        From: {message.sender_name} • {message.group_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" flexDirection="column" gap={1}>
                        <Chip 
                          label={`Sentiment: ${message.sentiment}`}
                          size="small"
                          sx={{ 
                            bgcolor: getSentimentColor(message.sentiment),
                            color: 'white',
                            fontSize: '0.7rem'
                          }}
                        />
                        <Chip 
                          label={`Intent: ${message.intent}`}
                          size="small"
                          sx={{ 
                            bgcolor: getIntentColor(message.intent),
                            color: 'white',
                            fontSize: '0.7rem'
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ width: 80 }}>
                        <ConfidenceBar 
                          variant="determinate" 
                          value={(message.confidence || 0) * 100}
                        />
                        <Typography variant="caption">
                          {((message.confidence || 0) * 100).toFixed(0)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {message.routed_category ? (
                        <Chip 
                          label={message.routed_category}
                          size="small"
                          color="primary"
                        />
                      ) : (
                        <Chip 
                          label="Not Routed"
                          size="small"
                          color="default"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {message.label_id ? (
                        <Chip 
                          label="Labeled"
                          size="small"
                          color="success"
                          icon={<ThumbUpIcon />}
                        />
                      ) : (
                        <Chip 
                          label="Pending"
                          size="small"
                          color="warning"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<EditNoteIcon />}
                        onClick={() => handleOpenLabelDialog(message)}
                      >
                        {message.label_id ? 'Edit Label' : 'Add Label'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={pagination.pages}
            page={pagination.page}
            onChange={(e, page) => setPagination(prev => ({ ...prev, page }))}
            color="primary"
          />
        </Box>
      </Grid>
    </Grid>
  );

  const renderAccuracyMetrics = () => (
    <Grid container spacing={3}>
      {/* Overall Metrics */}
      <Grid item xs={12} md={6}>
        <StyledCard>
          <CardHeader
            title="Overall AI Accuracy"
            avatar={<AnalyticsIcon color="primary" />}
          />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="h4" color="primary">
                  {accuracyMetrics.overall?.avg_accuracy_rating?.toFixed(1) || 0}/5
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Average Human Rating
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h4" color="primary">
                  {accuracyMetrics.overall?.total_labels || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Labels
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h6" color="success.main">
                  {accuracyMetrics.overall?.sentiment_accuracy || 0}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Sentiment Accuracy
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h6" color="success.main">
                  {accuracyMetrics.overall?.intent_accuracy || 0}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Intent Accuracy
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </StyledCard>
      </Grid>

      {/* Quality Distribution */}
      <Grid item xs={12} md={6}>
        <StyledCard>
          <CardHeader
            title="Quality Distribution"
            avatar={<SchoolIcon color="primary" />}
          />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="h4" color="success.main">
                  {accuracyMetrics.overall?.high_accuracy_count || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  High Quality (4-5★)
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h4" color="error.main">
                  {accuracyMetrics.overall?.low_accuracy_count || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Low Quality (1-2★)
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </StyledCard>
      </Grid>

      {/* Category Performance */}
      <Grid item xs={12}>
        <StyledCard>
          <CardHeader title="Accuracy by Category" />
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Labels</TableCell>
                    <TableCell>Avg Rating</TableCell>
                    <TableCell>Routing Accuracy</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {accuracyMetrics.by_category?.map((cat) => (
                    <TableRow key={cat.category_name}>
                      <TableCell>{cat.category_name}</TableCell>
                      <TableCell>{cat.department}</TableCell>
                      <TableCell>{cat.labeled_count}</TableCell>
                      <TableCell>
                        <Rating 
                          value={cat.avg_accuracy || 0} 
                          readOnly 
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {cat.correct_routing > 0 ? (
                          <Typography color="success.main">
                            {((cat.correct_routing / (cat.correct_routing + cat.incorrect_routing)) * 100).toFixed(0)}%
                          </Typography>
                        ) : (
                          <Typography color="textSecondary">No data</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </StyledCard>
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        AI Manual Labeling
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Review and correct AI classifications to improve routing accuracy and system performance.
      </Typography>

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Labeling Interface" icon={<PsychologyIcon />} />
        <Tab label="Accuracy Metrics" icon={<AnalyticsIcon />} />
      </Tabs>

      <TabPanel value={activeTab} index={0}>
        {renderLabelingInterface()}
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        {renderAccuracyMetrics()}
      </TabPanel>

      {/* Label Dialog */}
      <Dialog open={labelDialog.open} onClose={() => setLabelDialog({ open: false, message: null })} maxWidth="md" fullWidth>
        <DialogTitle>
          {labelDialog.message?.label_id ? 'Edit Label' : 'Add Manual Label'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="body2" gutterBottom>
              <strong>Message:</strong> {labelDialog.message?.message}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              From: {labelDialog.message?.sender_name} • Confidence: {((labelDialog.message?.confidence || 0) * 100).toFixed(0)}%
            </Typography>
          </Box>

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Correct Sentiment</InputLabel>
                <Select
                  value={labelForm.correct_sentiment}
                  label="Correct Sentiment"
                  onChange={(e) => setLabelForm(prev => ({ ...prev, correct_sentiment: e.target.value }))}
                >
                  <MenuItem value="positive">Positive</MenuItem>
                  <MenuItem value="negative">Negative</MenuItem>
                  <MenuItem value="neutral">Neutral</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Correct Intent</InputLabel>
                <Select
                  value={labelForm.correct_intent}
                  label="Correct Intent"
                  onChange={(e) => setLabelForm(prev => ({ ...prev, correct_intent: e.target.value }))}
                >
                  <MenuItem value="complaint">Complaint</MenuItem>
                  <MenuItem value="question">Question</MenuItem>
                  <MenuItem value="booking">Booking</MenuItem>
                  <MenuItem value="general">General</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Correct Category</InputLabel>
                <Select
                  value={labelForm.correct_category_id}
                  label="Correct Category"
                  onChange={(e) => setLabelForm(prev => ({ ...prev, correct_category_id: e.target.value }))}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.category_name} ({cat.department})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Feedback Notes"
                value={labelForm.feedback_notes}
                onChange={(e) => setLabelForm(prev => ({ ...prev, feedback_notes: e.target.value }))}
                placeholder="Optional feedback about AI accuracy or improvements..."
              />
            </Grid>
            <Grid item xs={12}>
              <Typography gutterBottom>AI Accuracy Rating</Typography>
              <Rating
                value={labelForm.ai_accuracy_rating}
                onChange={(e, value) => setLabelForm(prev => ({ ...prev, ai_accuracy_rating: value }))}
                size="large"
              />
              <Typography variant="caption" color="textSecondary" display="block">
                Rate how accurate the AI analysis was (1=Very Poor, 5=Excellent)
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLabelDialog({ open: false, message: null })}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitLabel}
            variant="contained"
            disabled={!labelForm.correct_sentiment || !labelForm.correct_intent}
          >
            Save Label
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification */}
      {notification && (
        <Alert 
          severity={notification.type} 
          onClose={() => setNotification(null)}
          sx={{ position: 'fixed', top: 16, right: 16, zIndex: 9999 }}
        >
          {notification.message}
        </Alert>
      )}
    </Box>
  );
};

export default ManualLabelingPage; 