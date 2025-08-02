import React from 'react';
import { 
  Button, 
  styled, 
  Tooltip,
  Box 
} from '@mui/material';
import { 
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon 
} from '@mui/icons-material';

// Enhanced WTF Brand Colors
const BRAND_COLORS = {
  primary: '#E50012',
  secondary: '#2E7D32',
  accent: '#FF9800',
  darkGray: '#333333',
  mediumGray: '#6B7280',
  lightGray: '#F9FAFB',
  white: '#FFFFFF',
  shadow: 'rgba(0, 0, 0, 0.15)',
  border: 'rgba(0, 0, 0, 0.08)'
};

// Styled View Button with highlighting effects
const StyledViewButton = styled(Button)(({ theme, variant, size }) => ({
  // Base styling
  minWidth: 'auto',
  padding: size === 'small' ? '6px 12px' : '8px 16px',
  borderRadius: '8px',
  fontWeight: 600,
  fontSize: size === 'small' ? '0.75rem' : '0.875rem',
  textTransform: 'none',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  
  // Default state
  backgroundColor: BRAND_COLORS.lightGray,
  color: BRAND_COLORS.darkGray,
  border: `2px solid ${BRAND_COLORS.border}`,
  
  // Hover effects
  '&:hover': {
    backgroundColor: BRAND_COLORS.primary,
    color: BRAND_COLORS.white,
    borderColor: BRAND_COLORS.primary,
    transform: 'translateY(-2px)',
    boxShadow: `0 8px 25px ${BRAND_COLORS.shadow}`,
    
    '& .MuiButton-startIcon': {
      transform: 'scale(1.1) rotate(5deg)',
    }
  },
  
  // Active/Pressed state
  '&:active': {
    transform: 'translateY(0px)',
    boxShadow: `0 4px 12px ${BRAND_COLORS.shadow}`,
  },
  
  // Focus state
  '&:focus': {
    outline: 'none',
    boxShadow: `0 0 0 3px rgba(229, 0, 18, 0.2)`,
  },
  
  // Icon styling
  '& .MuiButton-startIcon': {
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    marginRight: '6px',
  },
  
  // Variant-specific styling
  ...(variant === 'highlighted' && {
    backgroundColor: BRAND_COLORS.primary,
    color: BRAND_COLORS.white,
    borderColor: BRAND_COLORS.primary,
    boxShadow: `0 4px 15px rgba(229, 0, 18, 0.3)`,
    
    '&:hover': {
      backgroundColor: '#D10010',
      borderColor: '#D10010',
      boxShadow: `0 8px 25px rgba(229, 0, 18, 0.4)`,
    }
  }),
  
  ...(variant === 'outlined' && {
    backgroundColor: 'transparent',
    color: BRAND_COLORS.primary,
    borderColor: BRAND_COLORS.primary,
    
    '&:hover': {
      backgroundColor: BRAND_COLORS.primary,
      color: BRAND_COLORS.white,
    }
  }),
  
  // Size variations
  ...(size === 'small' && {
    fontSize: '0.75rem',
    padding: '4px 8px',
    minHeight: '28px',
  }),
  
  ...(size === 'large' && {
    fontSize: '1rem',
    padding: '12px 20px',
    minHeight: '48px',
  }),
  
  // Disabled state
  '&:disabled': {
    backgroundColor: BRAND_COLORS.lightGray,
    color: BRAND_COLORS.mediumGray,
    borderColor: BRAND_COLORS.border,
    transform: 'none',
    boxShadow: 'none',
    cursor: 'not-allowed',
  }
}));

// Ripple effect component
const RippleEffect = styled(Box)({
  position: 'absolute',
  borderRadius: '50%',
  backgroundColor: 'rgba(255, 255, 255, 0.3)',
  transform: 'scale(0)',
  animation: 'ripple 0.6s linear',
  pointerEvents: 'none',
  
  '@keyframes ripple': {
    to: {
      transform: 'scale(4)',
      opacity: 0,
    },
  },
});

const ViewButton = ({ 
  onClick, 
  disabled = false, 
  variant = 'default',
  size = 'medium',
  tooltip = 'View Details',
  showIcon = true,
  children = 'View',
  ...props 
}) => {
  const [ripples, setRipples] = React.useState([]);
  
  const handleClick = (event) => {
    // Create ripple effect
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    const ripple = {
      id: Date.now(),
      x,
      y,
      size,
    };
    
    setRipples(prev => [...prev, ripple]);
    
    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== ripple.id));
    }, 600);
    
    // Call original onClick
    if (onClick) {
      onClick(event);
    }
  };
  
  const getIcon = () => {
    if (!showIcon) return null;
    
    switch (variant) {
      case 'highlighted':
        return <VisibilityIcon fontSize={size === 'small' ? 'small' : 'medium'} />;
      case 'outlined':
        return <VisibilityOffIcon fontSize={size === 'small' ? 'small' : 'medium'} />;
      default:
        return <VisibilityIcon fontSize={size === 'small' ? 'small' : 'medium'} />;
    }
  };
  
  return (
    <Tooltip title={tooltip} arrow placement="top">
      <StyledViewButton
        variant={variant}
        size={size}
        disabled={disabled}
        onClick={handleClick}
        startIcon={getIcon()}
        {...props}
      >
        {children}
        
        {/* Ripple effects */}
        {ripples.map(ripple => (
          <RippleEffect
            key={ripple.id}
            sx={{
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
            }}
          />
        ))}
      </StyledViewButton>
    </Tooltip>
  );
};

export default ViewButton; 