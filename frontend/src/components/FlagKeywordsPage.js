import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, TextField, Chip, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress } from '@mui/material';
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

const FlagKeywordsPage = () => {
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addDialog, setAddDialog] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [undoKeyword, setUndoKeyword] = useState(null);

  useEffect(() => {
    fetchKeywords();
  }, []);

  const fetchKeywords = async () => {
    setLoading(true);
    const res = await axios.get('/api/static_flag_keywords');
    setKeywords(res.data);
    setLoading(false);
  };

  const handleAdd = async () => {
    await axios.post('/api/static_flag_keywords', { keyword: newKeyword });
    setAddDialog(false);
    setNewKeyword('');
    fetchKeywords();
  };

  const handleDelete = async (id) => {
    await axios.delete(`/api/static_flag_keywords/${id}`);
    setUndoKeyword(keywords.find(k => k.id === id));
    setConfirmDelete(null);
    fetchKeywords();
  };

  const handleUndo = async () => {
    if (undoKeyword) {
      await axios.post('/api/static_flag_keywords', { keyword: undoKeyword.keyword });
      setUndoKeyword(null);
      fetchKeywords();
    }
  };

  if (loading) return <Box sx={{ p: 6, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <PageContainer>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 800, color: BRAND_COLORS.red }}>
        Flag Keywords
      </Typography>
      <Button variant="contained" color="primary" sx={{ mb: 3 }} onClick={() => setAddDialog(true)}>
        Add Keyword
      </Button>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {keywords.map(k => (
          <Chip
            key={k.id}
            label={k.keyword}
            onDelete={() => setConfirmDelete(k.id)}
            sx={{ fontWeight: 600, fontSize: '1rem', background: BRAND_COLORS.lightGray }}
          />
        ))}
      </Box>
      {/* Add Keyword Dialog */}
      <Dialog open={addDialog} onClose={() => setAddDialog(false)}>
        <DialogTitle>Add Keyword</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Keyword"
            fullWidth
            value={newKeyword}
            onChange={e => setNewKeyword(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialog(false)}>Cancel</Button>
          <Button onClick={handleAdd} disabled={!newKeyword}>Add</Button>
        </DialogActions>
      </Dialog>
      {/* Confirm Delete Dialog */}
      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}>
        <DialogTitle>Delete Keyword?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this keyword?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button onClick={() => handleDelete(confirmDelete)} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
      {/* Undo Snackbar */}
      {undoKeyword && (
        <Box sx={{ mt: 3 }}>
          <Button variant="outlined" onClick={handleUndo} color="primary">Undo Delete</Button>
        </Box>
      )}
    </PageContainer>
  );
};

export default FlagKeywordsPage; 