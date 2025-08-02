import React, { useState } from 'react';
import {
  Box, IconButton, Button, Menu, MenuItem, Tooltip, CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FlagIcon from '@mui/icons-material/Flag';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import WarningIcon from '@mui/icons-material/Warning';
import MoreVertIcon from '@mui/icons-material/MoreVert';

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

const ActionButton = styled(IconButton)(({ theme, variant }) => ({
  width: 32,
  height: 32,
  borderRadius: 8,
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'scale(1.1)',
    boxShadow: `0 4px 12px ${BRAND_COLORS.shadow}`
  },
  ...(variant === 'view' && {
    backgroundColor: BRAND_COLORS.lightGray,
    color: BRAND_COLORS.darkGray,
    '&:hover': {
      backgroundColor: BRAND_COLORS.mediumGray,
      color: BRAND_COLORS.white
    }
  }),
  ...(variant === 'flag' && {
    backgroundColor: BRAND_COLORS.red,
    color: BRAND_COLORS.white,
    '&:hover': {
      backgroundColor: BRAND_COLORS.red,
      opacity: 0.9
    }
  }),
  ...(variant === 'unflag' && {
    backgroundColor: BRAND_COLORS.green,
    color: BRAND_COLORS.white,
    '&:hover': {
      backgroundColor: BRAND_COLORS.green,
      opacity: 0.9
    }
  }),
  ...(variant === 'escalate' && {
    backgroundColor: '#FF9800',
    color: BRAND_COLORS.white,
    '&:hover': {
      backgroundColor: '#FF9800',
      opacity: 0.9
    }
  })
}));

const MessageActions = ({
  message,
  onView,
  onFlag,
  onUnflag,
  onEscalate,
  loading = false,
  compact = false
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAction = async (action, callback) => {
    setActionLoading(action);
    try {
      await callback();
    } finally {
      setActionLoading(null);
      handleMenuClose();
    }
  };

  const isFlagged = message.flag_type || message.flagged;

  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Tooltip title="View Details">
          <ActionButton
            variant="view"
            onClick={(e) => {
              e.stopPropagation();
              onView(message);
            }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={16} /> : <VisibilityIcon fontSize="small" />}
          </ActionButton>
        </Tooltip>

        <Tooltip title="More Actions">
          <ActionButton
            variant="view"
            onClick={handleMenuOpen}
            disabled={loading}
          >
            <MoreVertIcon fontSize="small" />
          </ActionButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          onClick={(e) => e.stopPropagation()}
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: `0 8px 24px ${BRAND_COLORS.shadow}`,
              border: `1px solid ${BRAND_COLORS.border}`,
              minWidth: 180
            }
          }}
        >
          <MenuItem
            onClick={() => handleAction('flag', () => isFlagged ? onUnflag(message) : onFlag(message))}
            disabled={actionLoading === 'flag'}
            sx={{
              color: isFlagged ? BRAND_COLORS.green : BRAND_COLORS.red,
              '&:hover': {
                backgroundColor: isFlagged ? 'rgba(46, 125, 50, 0.1)' : 'rgba(229, 0, 18, 0.1)'
              }
            }}
          >
            {actionLoading === 'flag' ? (
              <CircularProgress size={16} sx={{ mr: 1 }} />
            ) : (
              <>
                {isFlagged ? <FlagOutlinedIcon sx={{ mr: 1, fontSize: 16 }} /> : <FlagIcon sx={{ mr: 1, fontSize: 16 }} />}
                {isFlagged ? 'Unflag Message' : 'Flag Message'}
              </>
            )}
          </MenuItem>
          
          <MenuItem
            onClick={() => handleAction('escalate', () => onEscalate(message))}
            disabled={actionLoading === 'escalate'}
            sx={{
              color: '#FF9800',
              '&:hover': {
                backgroundColor: 'rgba(255, 152, 0, 0.1)'
              }
            }}
          >
            {actionLoading === 'escalate' ? (
              <CircularProgress size={16} sx={{ mr: 1 }} />
            ) : (
              <>
                <WarningIcon sx={{ mr: 1, fontSize: 16 }} />
                Escalate
              </>
            )}
          </MenuItem>
        </Menu>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Tooltip title="View Details">
        <ActionButton
          variant="view"
          onClick={(e) => {
            e.stopPropagation();
            onView(message);
          }}
          disabled={loading}
        >
          {loading ? <CircularProgress size={16} /> : <VisibilityIcon fontSize="small" />}
        </ActionButton>
      </Tooltip>

      <Tooltip title={isFlagged ? 'Unflag Message' : 'Flag Message'}>
        <ActionButton
          variant={isFlagged ? 'unflag' : 'flag'}
          onClick={(e) => {
            e.stopPropagation();
            isFlagged ? onUnflag(message) : onFlag(message);
          }}
          disabled={actionLoading === 'flag'}
        >
          {actionLoading === 'flag' ? (
            <CircularProgress size={16} />
          ) : isFlagged ? (
            <FlagOutlinedIcon fontSize="small" />
          ) : (
            <FlagIcon fontSize="small" />
          )}
        </ActionButton>
      </Tooltip>

      <Tooltip title="Escalate">
        <ActionButton
          variant="escalate"
          onClick={(e) => {
            e.stopPropagation();
            onEscalate(message);
          }}
          disabled={actionLoading === 'escalate'}
        >
          {actionLoading === 'escalate' ? (
            <CircularProgress size={16} />
          ) : (
            <WarningIcon fontSize="small" />
          )}
        </ActionButton>
      </Tooltip>
    </Box>
  );
};

export default MessageActions; 