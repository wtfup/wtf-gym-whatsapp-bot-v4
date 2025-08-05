import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';

const DialogTestV3 = () => {
  const [open, setOpen] = useState(false);
  const [testData, setTestData] = useState({
    name: 'Test Group Name',
    description: 'Test Description'
  });

  const handleOpen = () => {
    console.log('🧪 TEST: Opening super basic dialog...');
    setOpen(true);
    console.log('🧪 TEST: Dialog state set to true');
  };

  const handleClose = () => {
    console.log('🧪 TEST: Closing dialog...');
    setOpen(false);
  };

  const handleSave = () => {
    console.log('🧪 TEST: Save clicked with data:', testData);
    alert('Save clicked! Check console for data');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🧪 Dialog Test V3 - Super Basic
      </Typography>
      
      <Button 
        variant="contained" 
        color="primary"
        size="large"
        onClick={handleOpen}
        sx={{ mb: 2 }}
      >
        🔧 OPEN TEST DIALOG
      </Button>

      <Typography variant="body2" sx={{ mb: 2 }}>
        This is a minimal dialog test to isolate rendering issues.
      </Typography>

      {/* SUPER BASIC DIALOG */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        style={{ zIndex: 9999 }}  // Highest possible z-index
      >
        <div style={{
          backgroundColor: 'white',
          border: '5px solid red', // Very obvious border
          padding: '20px',
          minHeight: '300px'
        }}>
          <h1 style={{ color: 'red', fontSize: '24px' }}>
            🧪 TEST DIALOG - RED HEADER
          </h1>
          
          <div style={{
            backgroundColor: 'yellow',
            padding: '10px',
            margin: '10px 0'
          }}>
            <p style={{ color: 'black', fontSize: '16px' }}>
              ✅ If you can see this YELLOW box, the dialog is rendering!
            </p>
          </div>

          <input 
            type="text"
            value={testData.name}
            onChange={(e) => setTestData({...testData, name: e.target.value})}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
              border: '2px solid blue',
              marginBottom: '10px'
            }}
            placeholder="Enter group name..."
          />

          <textarea
            value={testData.description}
            onChange={(e) => setTestData({...testData, description: e.target.value})}
            style={{
              width: '100%',
              height: '60px',
              padding: '10px',
              fontSize: '16px',
              border: '2px solid green',
              marginBottom: '10px'
            }}
            placeholder="Enter description..."
          />

          <div style={{ textAlign: 'right' }}>
            <button 
              onClick={handleClose}
              style={{
                padding: '10px 20px',
                marginRight: '10px',
                backgroundColor: 'gray',
                color: 'white',
                border: 'none',
                fontSize: '16px'
              }}
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              style={{
                padding: '10px 20px',
                backgroundColor: 'blue',
                color: 'white',
                border: 'none',
                fontSize: '16px'
              }}
            >
              Save Test
            </button>
          </div>
        </div>
      </Dialog>

      {/* MATERIAL-UI VERSION */}
      <Dialog
        open={false} // Disabled for now
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          style: {
            backgroundColor: 'lime',
            border: '5px solid purple'
          }
        }}
      >
        <DialogTitle style={{ backgroundColor: 'orange' }}>
          Material-UI Dialog Test
        </DialogTitle>
        <DialogContent style={{ backgroundColor: 'cyan' }}>
          <TextField
            fullWidth
            label="Group Name"
            value={testData.name}
            onChange={(e) => setTestData({...testData, name: e.target.value})}
            margin="normal"
          />
        </DialogContent>
        <DialogActions style={{ backgroundColor: 'pink' }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DialogTestV3;