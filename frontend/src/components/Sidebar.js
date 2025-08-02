import React, { useRef, useEffect } from 'react';
import {
  Box, List, ListItem, ListItemIcon, ListItemText, Typography, IconButton, Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

// Updated WTF Brand Colors
const BRAND_COLORS = {
  red: '#E50012',
  green: '#2E7D32',
  darkGray: '#333333',
  mediumGray: '#6B7280',
  lightGray: '#F9FAFB',
  white: '#FFFFFF',
  shadow: 'rgba(0, 0, 0, 0.1)',
  border: 'rgba(0, 0, 0, 0.08)',
  sidebarBg: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)'
};

const SIDEBAR_WIDTH = 280;
const SIDEBAR_COLLAPSED_WIDTH = 60;

const StyledSidebar = styled(Box)(({ theme, open, collapsed }) => ({
  width: open ? (collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH) : 0,
  height: '100vh',
  position: 'fixed',
  left: 0,
  top: 0,
  background: BRAND_COLORS.sidebarBg,
  borderRight: `1px solid ${BRAND_COLORS.border}`,
  zIndex: 1300,
  display: open ? 'flex' : 'none', // Force hide when closed
  flexDirection: 'column',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  overflow: 'hidden',
  boxShadow: open ? `4px 0 20px ${BRAND_COLORS.shadow}` : 'none',
  transform: open ? 'translateX(0)' : 'translateX(-100%)',
  visibility: open ? 'visible' : 'hidden', // Extra safety
  opacity: open ? 1 : 0, // Extra safety
  [theme.breakpoints.down('lg')]: {
    width: open ? SIDEBAR_WIDTH : 0,
    transform: open ? 'translateX(0)' : 'translateX(-100%)',
    display: open ? 'flex' : 'none', // Force hide on mobile too
  }
}));

const SidebarOverlay = styled(Box)(({ theme, open }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  zIndex: 1250,
  opacity: open ? 1 : 0,
  visibility: open ? 'visible' : 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  backdropFilter: 'blur(4px)'
}));

const StyledNavItem = styled(ListItem)(({ theme, active, collapsed }) => ({
  margin: '4px 12px',
  borderRadius: 12,
  padding: collapsed ? '12px 8px' : '12px 16px',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  minHeight: 52,
  justifyContent: collapsed ? 'center' : 'flex-start',
  '&:focus': {
    outline: `2px solid ${BRAND_COLORS.red}`,
    outlineOffset: 2,
  },
  '&:hover': {
    backgroundColor: active ? BRAND_COLORS.red : 'rgba(229, 0, 18, 0.08)',
    transform: collapsed ? 'scale(1.05)' : 'translateX(4px) scale(1.02)',
    boxShadow: `0 4px 12px ${BRAND_COLORS.shadow}`
  },
  '&:active': {
    transform: collapsed ? 'scale(0.95)' : 'translateX(2px) scale(0.98)',
  },
  ...(active && {
    backgroundColor: BRAND_COLORS.red,
    color: BRAND_COLORS.white,
    boxShadow: `0 6px 20px rgba(229, 0, 18, 0.4)`,
    '&::before': {
      content: '""',
      position: 'absolute',
      left: -12,
      top: 0,
      height: '100%',
      width: 4,
      backgroundColor: BRAND_COLORS.red,
      borderRadius: '0 4px 4px 0',
      boxShadow: `2px 0 8px rgba(229, 0, 18, 0.3)`
    }
  })
}));

const LogoSection = styled(Box)(({ theme, collapsed }) => ({
  padding: collapsed ? '24px 8px' : '24px',
  borderBottom: `1px solid ${BRAND_COLORS.border}`,
  transition: 'all 0.3s ease',
  textAlign: collapsed ? 'center' : 'left',
  '&:hover': {
    backgroundColor: 'rgba(229, 0, 18, 0.02)'
  }
}));

const CollapseButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  right: -20,
  top: '50%',
  transform: 'translateY(-50%)',
  width: 40,
  height: 40,
  backgroundColor: BRAND_COLORS.white,
  border: `2px solid ${BRAND_COLORS.border}`,
  boxShadow: `0 4px 12px ${BRAND_COLORS.shadow}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  zIndex: 1301,
  '&:hover': {
    backgroundColor: BRAND_COLORS.red,
    color: BRAND_COLORS.white,
    transform: 'translateY(-50%) scale(1.1)',
    boxShadow: `0 6px 20px rgba(229, 0, 18, 0.4)`
  },
  '&:active': {
    transform: 'translateY(-50%) scale(0.95)'
  },
  [theme.breakpoints.down('lg')]: {
    display: 'none'
  }
}));

const Sidebar = ({ 
  open, 
  collapsed, 
  onClose, 
  onToggleCollapse,
  navItems, 
  currentView, 
  onNavigation, 
  isMobile 
}) => {
  const sidebarRef = useRef();

  // Debug log to track sidebar state
  useEffect(() => {
    console.log('🔍 Sidebar state:', { open, collapsed, isMobile, currentView });
  }, [open, collapsed, isMobile, currentView]);

  // Close sidebar on outside click (all screen sizes)
  useEffect(() => {
    if (!open) return;
    function handleClick(event) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  const handleKeyDown = (event, key) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onNavigation(key);
    }
  };

  return (
    <>
      <SidebarOverlay open={open} onClick={onClose} />
      
      <StyledSidebar ref={sidebarRef} open={open} collapsed={collapsed && !isMobile}>
        {/* Collapse Button */}
        {open && !isMobile && (
          <CollapseButton 
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </CollapseButton>
        )}

        {/* Logo Section */}
        <LogoSection collapsed={collapsed && !isMobile}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ overflow: 'hidden' }}>
              {collapsed && !isMobile ? (
                <Typography variant="h4" sx={{ 
                  color: BRAND_COLORS.red, 
                  fontWeight: 800,
                  letterSpacing: '-0.5px',
                  lineHeight: 1,
                  transition: 'all 0.3s ease'
                }}>
                  W
                </Typography>
              ) : (
                <>
                  <Typography variant="h5" sx={{ 
                    color: BRAND_COLORS.red, 
                    fontWeight: 800,
                    letterSpacing: '-0.5px',
                    lineHeight: 1.2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.02)'
                    }
                  }}>
                    WTF Intelligence
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: BRAND_COLORS.mediumGray, 
                    mt: 0.5,
                    fontSize: '0.8rem',
                    opacity: 0.8,
                    transition: 'opacity 0.3s ease'
                  }}>
                    WhatsApp Monitoring
                  </Typography>
                </>
              )}
            </Box>
            {isMobile && (
              <IconButton 
                onClick={onClose} 
                size="small"
                sx={{
                  color: BRAND_COLORS.mediumGray,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    color: BRAND_COLORS.red,
                    backgroundColor: 'rgba(229, 0, 18, 0.1)',
                    transform: 'rotate(90deg)'
                  }
                }}
              >
                <CloseIcon />
              </IconButton>
            )}
          </Box>
        </LogoSection>

        {/* Navigation Menu */}
        <Box sx={{ 
          flex: 1, 
          py: 2, 
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: BRAND_COLORS.border,
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: BRAND_COLORS.mediumGray,
          }
        }}>
          <List sx={{ px: 0 }}>
            {navItems.map((item, index) => (
              <Tooltip 
                key={item.key}
                title={collapsed && !isMobile ? item.label : ''}
                placement="right"
                arrow
              >
                <StyledNavItem
                  active={currentView === item.key}
                  collapsed={collapsed && !isMobile}
                  onClick={() => onNavigation(item.key)}
                  onKeyDown={(e) => handleKeyDown(e, item.key)}
                  tabIndex={0}
                  role="button"
                  aria-label={`Navigate to ${item.label}`}
                  style={{ 
                    animationDelay: `${index * 50}ms`,
                    animation: 'slideInLeft 0.4s ease forwards'
                  }}
                >
                  <ListItemIcon sx={{ 
                    minWidth: collapsed && !isMobile ? 0 : 40,
                    color: 'inherit',
                    transition: 'all 0.3s ease',
                    transform: collapsed && !isMobile ? 'scale(1.2)' : 'scale(1)'
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  {(!collapsed || isMobile) && (
                    <ListItemText 
                      primary={item.label}
                      primaryTypographyProps={{
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        color: 'inherit',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  )}
                </StyledNavItem>
              </Tooltip>
            ))}
          </List>
        </Box>

        {/* Footer */}
        <Box sx={{ 
          p: collapsed && !isMobile ? 1 : 2, 
          borderTop: `1px solid ${BRAND_COLORS.border}`,
          textAlign: 'center'
        }}>
          {(!collapsed || isMobile) && (
            <Typography variant="body2" sx={{ 
              color: BRAND_COLORS.mediumGray,
              fontSize: '0.75rem',
              opacity: 0.7,
              transition: 'opacity 0.3s ease'
            }}>
              © 2024 WTF Tech • v2.1
            </Typography>
          )}
        </Box>
      </StyledSidebar>

      <style jsx global>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
};

export default Sidebar; 