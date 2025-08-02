import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import axios from 'axios';

const BRAND_COLORS = {
  red: '#E50012',
  green: '#2E7D32',
  darkGray: '#333333',
  mediumGray: '#6B7280',
  lightGray: '#F9FAFB',
  white: '#FFFFFF',
  border: 'rgba(0, 0, 0, 0.08)'
};

const PageContainer = styled(Box)(({ theme }) => ({
  padding: 32,
}));

const KeywordReviewPage = () => {
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    fetchKeywords();
  }, []);

  const fetchKeywords = async () => {
    setLoading(true);
    const res = await axios.get('/api/flag_keywords?status=pending');
    setKeywords(res.data);
    setLoading(false);
  };

  const handleApprove = async (ids) => {
    await Promise.all(ids.map(id => axios.post(`/api/flag_keywords/${id}/approve`)));
    setConfirmAction(null);
    setSelected([]);
    fetchKeywords();
  };

  const handleReject = async (ids) => {
    await Promise.all(ids.map(id => axios.post(`/api/flag_keywords/${id}/reject`)));
    setConfirmAction(null);
    setSelected([]);
    fetchKeywords();
  };

  if (loading) return <Box sx={{ p: 6, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <PageContainer>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 800, color: BRAND_COLORS.red }}>
        Keyword Review
      </Typography>
      <Button variant="contained" color="primary" sx={{ mb: 3 }} onClick={() => setBulkMode(!bulkMode)}>
        {bulkMode ? 'Cancel Bulk' : 'Bulk Approve/Reject'}
      </Button>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {keywords.map(k => (
          <Chip
            key={k.id}
            label={k.keyword}
            color={selected.includes(k.id) ? 'primary' : 'default'}
            onClick={() => {
              if (bulkMode) {
                setSelected(selected.includes(k.id) ? selected.filter(id => id !== k.id) : [...selected, k.id]);
              }
            }}
            onDelete={() => setConfirmAction({ type: 'reject', ids: [k.id] })}
            sx={{ fontWeight: 600, fontSize: '1rem', background: BRAND_COLORS.lightGray }}
          />
        ))}
      </Box>
      {bulkMode && selected.length > 0 && (
        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button variant="contained" color="success" onClick={() => setConfirmAction({ type: 'approve', ids: selected })}>Approve Selected</Button>
          <Button variant="contained" color="error" onClick={() => setConfirmAction({ type: 'reject', ids: selected })}>Reject Selected</Button>
        </Box>
      )}
      {/* Confirm Action Dialog */}
      <Dialog open={!!confirmAction} onClose={() => setConfirmAction(null)}>
        <DialogTitle>{confirmAction?.type === 'approve' ? 'Approve' : 'Reject'} Keyword{confirmAction?.ids?.length > 1 ? 's' : ''}?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to {confirmAction?.type} {confirmAction?.ids?.length} keyword{confirmAction?.ids?.length > 1 ? 's' : ''}?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmAction(null)}>Cancel</Button>
          <Button onClick={() => confirmAction?.type === 'approve' ? handleApprove(confirmAction.ids) : handleReject(confirmAction.ids)} color={confirmAction?.type === 'approve' ? 'success' : 'error'}>
            {confirmAction?.type === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default KeywordReviewPage; 