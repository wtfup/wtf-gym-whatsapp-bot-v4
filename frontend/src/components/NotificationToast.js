import React, { useState, useEffect } from 'react';
import {
  Snackbar, Alert, Box, Typography, IconButton, Chip, Slide, Fade
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import MessageIcon from '@mui/icons-material/Message';
import FlagIcon from '@mui/icons-material/Flag';
import NotificationsIcon from '@mui/icons-material/Notifications';

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

const StyledAlert = styled(Alert)(({ theme, severity }) => ({
  borderRadius: 12,
  boxShadow: `0 8px 24px ${BRAND_COLORS.shadow}`,
  border: `1px solid ${BRAND_COLORS.border}`,
  minWidth: 300,
  maxWidth: 400,
  '& .MuiAlert-icon': {
    fontSize: 24
  },
  '& .MuiAlert-message': {
    padding: '8px 0',
    flex: 1
  },
  ...(severity === 'success' && {
    backgroundColor: BRAND_COLORS.white,
    color: BRAND_COLORS.darkGray,
    '& .MuiAlert-icon': {
      color: BRAND_COLORS.green
    }
  }),
  ...(severity === 'info' && {
    backgroundColor: BRAND_COLORS.white,
    color: BRAND_COLORS.darkGray,
    '& .MuiAlert-icon': {
      color: BRAND_COLORS.red
    }
  }),
  ...(severity === 'warning' && {
    backgroundColor: BRAND_COLORS.white,
    color: BRAND_COLORS.darkGray,
    '& .MuiAlert-icon': {
      color: '#FF9800'
    }
  })
}));

const NotificationChip = styled(Chip)(({ theme }) => ({
  backgroundColor: BRAND_COLORS.red,
  color: BRAND_COLORS.white,
  fontWeight: 600,
  fontSize: '0.75rem',
  height: 24,
  '&:hover': {
    backgroundColor: BRAND_COLORS.red,
    opacity: 0.9
  }
}));

const NotificationToast = ({
  open,
  onClose,
  message,
  severity = 'info',
  duration = 6000,
  action = null,
  count = 0,
  type = 'message' // 'message', 'flag', 'system'
}) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (open) {
      setShow(true);
    }
  }, [open]);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setShow(false);
    setTimeout(() => onClose(), 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'flag':
        return <FlagIcon />;
      case 'system':
        return <NotificationsIcon />;
      default:
        return <MessageIcon />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'flag':
        return 'New Flagged Message';
      case 'system':
        return 'System Notification';
      default:
        return 'New Message';
    }
  };

  return (
    <Snackbar
      open={show}
      autoHideDuration={1500}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      TransitionComponent={Slide}
      TransitionProps={{ direction: 'left' }}
      sx={{
        '& .MuiSnackbar-root': {
          position: 'fixed',
          top: 24,
            left: '50%',
            transform: 'translateX(-50%)',
          zIndex: 2000
        }
      }}
    >
      <StyledAlert
        severity={severity}
        icon={getIcon()}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {count > 1 && (
              <NotificationChip
                label={`+${count - 1} more`}
                size="small"
              />
            )}
            {action}
            <IconButton
              size="small"
              onClick={handleClose}
              sx={{
                color: BRAND_COLORS.mediumGray,
                '&:hover': {
                  color: BRAND_COLORS.red
                }
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        }
      >
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
            {getTitle()}
          </Typography>
          <Typography variant="body2" sx={{ color: BRAND_COLORS.mediumGray }}>
            {message}
          </Typography>
        </Box>
      </StyledAlert>
    </Snackbar>
  );
};

export default NotificationToast; 