import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, 
  IconButton, Alert, Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';

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
    maxWidth: '500px',
    width: '90vw',
    boxShadow: `0 24px 48px ${BRAND_COLORS.shadow}`,
    overflow: 'hidden'
  }
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme, severity }) => ({
  background: severity === 'error' 
    ? `linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)` 
    : severity === 'warning'
    ? `linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)`
    : severity === 'success'
    ? `linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)`
    : `linear-gradient(135deg, ${BRAND_COLORS.white} 0%, ${BRAND_COLORS.lightGray} 100%)`,
  borderBottom: `1px solid ${BRAND_COLORS.border}`,
  padding: '24px 32px 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}));

const ActionButton = styled(Button)(({ variant, severity }) => ({
  fontWeight: 600,
  borderRadius: 8,
  padding: '12px 24px',
  textTransform: 'none',
  fontSize: '0.9rem',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: `0 4px 12px ${BRAND_COLORS.shadow}`
  },
  ...(variant === 'contained' && severity === 'error' && {
    backgroundColor: BRAND_COLORS.red,
    color: BRAND_COLORS.white,
    '&:hover': {
      backgroundColor: BRAND_COLORS.red,
      opacity: 0.9
    }
  }),
  ...(variant === 'contained' && severity === 'success' && {
    backgroundColor: BRAND_COLORS.green,
    color: BRAND_COLORS.white,
    '&:hover': {
      backgroundColor: BRAND_COLORS.green,
      opacity: 0.9
    }
  }),
  ...(variant === 'outlined' && {
    color: BRAND_COLORS.mediumGray,
    borderColor: BRAND_COLORS.border,
    '&:hover': {
      borderColor: BRAND_COLORS.red,
      color: BRAND_COLORS.red,
      backgroundColor: 'transparent'
    }
  })
}));

const ConfirmationModal = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  severity = "info", // info, warning, error, success
  loading = false,
  details = null,
  showUndo = false,
  onUndo = null
}) => {
  const getIcon = () => {
    switch (severity) {
      case 'error':
        return <ErrorIcon sx={{ color: BRAND_COLORS.red, fontSize: 28 }} />;
      case 'warning':
        return <WarningIcon sx={{ color: '#F59E0B', fontSize: 28 }} />;
      case 'success':
        return <CheckCircleIcon sx={{ color: BRAND_COLORS.green, fontSize: 28 }} />;
      default:
        return <InfoIcon sx={{ color: BRAND_COLORS.mediumGray, fontSize: 28 }} />;
    }
  };

  const getAlertSeverity = () => {
    switch (severity) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'success':
        return 'success';
      default:
        return 'info';
    }
  };

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <StyledDialogTitle severity={severity}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {getIcon()}
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: BRAND_COLORS.darkGray }}>
              {title}
            </Typography>
          </Box>
        </Box>
        <IconButton 
          onClick={onClose}
          disabled={loading}
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

      <DialogContent sx={{ p: 4 }}>
        <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
          {message}
        </Typography>

        {details && (
          <Alert 
            severity={getAlertSeverity()} 
            sx={{ 
              mb: 3,
              borderRadius: 2,
              '& .MuiAlert-message': {
                padding: '8px 0'
              }
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {details}
            </Typography>
          </Alert>
        )}

        {showUndo && (
          <Box sx={{ 
            p: 2, 
            backgroundColor: BRAND_COLORS.lightGray, 
            borderRadius: 2,
            border: `1px solid ${BRAND_COLORS.border}`
          }}>
            <Typography variant="body2" sx={{ color: BRAND_COLORS.mediumGray, mb: 1 }}>
              💡 Don't worry! You can undo this action within 30 seconds after confirming.
            </Typography>
            <Chip 
              label="Undo Available" 
              size="small" 
              sx={{ 
                backgroundColor: BRAND_COLORS.green,
                color: BRAND_COLORS.white,
                fontWeight: 600
              }} 
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: `1px solid ${BRAND_COLORS.border}`, gap: 2 }}>
        <ActionButton 
          onClick={onClose} 
          variant="outlined"
          disabled={loading}
          sx={{ minWidth: 100 }}
        >
          {cancelText}
        </ActionButton>
        <ActionButton 
          onClick={onConfirm}
          variant="contained"
          severity={severity === 'error' ? 'error' : 'success'}
          disabled={loading}
          sx={{ minWidth: 120 }}
        >
          {loading ? 'Processing...' : confirmText}
        </ActionButton>
      </DialogActions>
    </StyledDialog>
  );
};

export default ConfirmationModal; 