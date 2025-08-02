import React, { useState, useRef, useEffect } from 'react';
import {
  Box, Typography, IconButton, Switch, FormControlLabel, Chip, Skeleton, 
  TextField, InputAdornment, Autocomplete, Paper, ListItem, ListItemIcon, 
  ListItemText, Popper, ClickAwayListener, Fade, Tooltip, CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import MessageIcon from '@mui/icons-material/Message';
import { useNavigate } from 'react-router-dom';

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

const SIDEBAR_WIDTH = 280;

const StyledHeader = styled(Box)(({ theme, sidebarOpen }) => ({
  position: 'sticky',
  top: 0,
  zIndex: 1200,
  backgroundColor: BRAND_COLORS.white,
  borderBottom: `1px solid ${BRAND_COLORS.border}`,
  marginLeft: sidebarOpen && !theme.breakpoints.down("lg") ? SIDEBAR_WIDTH : 0,
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: `0 1px 3px ${BRAND_COLORS.border}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: 72,
  px: 4,
  backdropFilter: 'blur(8px)'
}));

const LeftSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 16
}));

const MiddleSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  flex: 1,
  maxWidth: 400,
  mx: 3,
  position: 'relative'
}));

const HamburgerButton = styled(IconButton)(({ theme }) => ({
  color: BRAND_COLORS.darkGray,
  padding: 8,
  borderRadius: 8,
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: BRAND_COLORS.lightGray,
    color: BRAND_COLORS.red
  }
}));

const Logo = styled(Typography)(({ theme }) => ({
  fontWeight: 900,
  fontSize: '2rem',
  color: BRAND_COLORS.red,
  letterSpacing: '-1px',
  userSelect: 'none',
  display: 'flex',
  alignItems: 'center',
}));

const StatusGroup = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 16
}));

const StatusChip = styled(Chip)(({ status }) => ({
  fontWeight: 700,
  fontSize: '0.9rem',
  height: 32,
  borderRadius: 16,
  ...(status === 'connected' && {
    backgroundColor: BRAND_COLORS.green,
    color: BRAND_COLORS.white
  }),
  ...(status === 'disconnected' && {
    backgroundColor: BRAND_COLORS.red,
    color: BRAND_COLORS.white
  }),
  ...(status === 'neutral' && {
    backgroundColor: BRAND_COLORS.mediumGray,
    color: BRAND_COLORS.white
  }),
  ...(status === 'loading' && {
    backgroundColor: BRAND_COLORS.mediumGray,
    color: BRAND_COLORS.white
  })
}));

const AnimatedSwitch = styled(Switch)(({ theme }) => ({
  '& .MuiSwitch-switchBase': {
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&.Mui-checked': {
      color: BRAND_COLORS.green,
      transform: 'translateX(20px)',
      '& + .MuiSwitch-track': {
        backgroundColor: BRAND_COLORS.green,
        opacity: 1,
      },
    },
  },
  '& .MuiSwitch-thumb': {
    transition: 'all 0.2s ease',
    boxShadow: `0 2px 4px ${BRAND_COLORS.shadow}`
  },
  '& .MuiSwitch-track': {
    borderRadius: 12,
    backgroundColor: BRAND_COLORS.mediumGray,
    opacity: 1,
    transition: 'all 0.3s ease',
  },
}));

const SearchField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: BRAND_COLORS.lightGray,
    borderRadius: 24,
    height: 40,
    fontSize: '0.9rem',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: BRAND_COLORS.white,
      boxShadow: `0 2px 8px ${BRAND_COLORS.shadow}`
    },
    '&.Mui-focused': {
      backgroundColor: BRAND_COLORS.white,
      boxShadow: `0 4px 12px ${BRAND_COLORS.shadow}`,
      '& fieldset': {
        borderColor: BRAND_COLORS.red,
        borderWidth: 2
      }
    },
    '& fieldset': {
      borderColor: 'transparent',
      transition: 'all 0.3s ease'
    }
  },
  '& .MuiInputBase-input': {
    padding: '8px 16px',
    '&::placeholder': {
      color: BRAND_COLORS.mediumGray,
      opacity: 0.8
    }
  }
}));

const SearchResults = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  zIndex: 1300,
  marginTop: 8,
  borderRadius: 12,
  boxShadow: `0 8px 24px ${BRAND_COLORS.shadow}`,
  border: `1px solid ${BRAND_COLORS.border}`,
  maxHeight: 300,
  overflow: 'auto'
}));

const SearchResultItem = styled(ListItem)(({ theme }) => ({
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  borderRadius: 8,
  margin: '4px 8px',
  '&:hover': {
    backgroundColor: BRAND_COLORS.lightGray,
    transform: 'translateX(4px)'
  },
  '&:active': {
    backgroundColor: BRAND_COLORS.red,
    color: BRAND_COLORS.white,
    '& .MuiListItemIcon-root': {
      color: BRAND_COLORS.white
    }
  }
}));

const Header = ({ 
  sidebarOpen, 
  onSidebarToggle, 
  currentView, 
  navItems, 
  waStatus, 
  realtime, 
  onRealtimeToggle, 
  messageCount,
  isMobile,
  isLoading 
}) => {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  const searchRef = useRef(null);

  // ENHANCED: Add WebSocket connection monitoring
  const [websocketConnected, setWebsocketConnected] = useState(false);
  const [lastMessageReceived, setLastMessageReceived] = useState(null);
  const websocketRef = useRef(null);

  // Enhanced state for real-time indicators
  const [realtimeStats, setRealtimeStats] = useState({
    messagesReceived: 0,
    lastActivity: null,
    connectionQuality: 'good' // good, poor, disconnected
  });

  // Keyboard shortcuts for search
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Cmd/Ctrl + K to focus search
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
      
      // Escape to clear search
      if (event.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
        setSearchTerm('');
        searchRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  // ENHANCED: Monitor WebSocket connection status
  useEffect(() => {
    if (!realtime) {
      setWebsocketConnected(false);
      return;
    }

    // Monitor WebSocket connection
    const checkWebSocket = () => {
      const socket = window.WebSocketMonitor?.socket;
      if (socket) {
        setWebsocketConnected(socket.connected);
        setRealtimeStats(prev => ({
          ...prev,
          connectionQuality: socket.connected ? 'good' : 'disconnected'
        }));
      }
    };

    const interval = setInterval(checkWebSocket, 2000); // Check every 2 seconds
    return () => clearInterval(interval);
  }, [realtime]);

  // ENHANCED: Listen for real-time message notifications
  useEffect(() => {
    // Listen for custom events from App.js when messages are received
    const handleNewMessage = (event) => {
      setLastMessageReceived(new Date());
      setRealtimeStats(prev => ({
        ...prev,
        messagesReceived: prev.messagesReceived + 1,
        lastActivity: new Date(),
        connectionQuality: 'good'
      }));

      // Show brief notification
      setTimeout(() => {
        setLastMessageReceived(null);
      }, 3000);
    };

    window.addEventListener('websocket-message-received', handleNewMessage);
    return () => window.removeEventListener('websocket-message-received', handleNewMessage);
  }, []);

  // Enhanced search with descriptions and categories
  const getSearchDescription = (key) => {
    const descriptions = {
      'analytics': 'View message analytics, department insights, and issue tracking',
      'ai_dashboard': 'Configure AI analysis, test sentiment detection, and view AI metrics',
      'ai_intelligence': 'Advanced AI intelligence system and learning pipeline',
      'ai_labeling': 'Manual AI labeling and training data management',
      'auto_healer': 'Monitor system health and view automated fixes',
      'messages': 'Browse all WhatsApp messages and flagged content',
      'flagged': 'Review flagged messages requiring attention',
      'interaction_logs': 'Monitor user interactions and system events',
      'whatsapp_routing': 'Manage WhatsApp groups and routing rules',
      'ai_confidence': 'Configure AI confidence thresholds and view routing performance analytics',
      'dynamic_categories': 'AI-powered detection of new issue categories and trend analysis',
      'digest': 'Configure automated reports and digest settings',
      'slack_integration': 'Setup Slack notifications and alerts',
      'endpoints': 'Test API endpoints and view system documentation',
      'issue_management': 'Manage issue categories and severity levels',
      'flag_keywords': 'Configure keyword-based flagging rules',
      'keyword_review': 'Review and manage custom keywords',
      'keyword_analytics': 'Analytics for keyword performance and trends',
      'log-viewer': 'View system logs and debugging information',
      'health_monitor': 'Monitor system health and performance metrics',
      'status': 'View system status and WhatsApp connection information',
      'qr': 'WhatsApp QR Code - Scan to connect your phone (Integrated Environment)',
      'about': 'System information and version details',
      'dashboard': 'Main dashboard overview and system status',
      'whatsapp': 'WhatsApp integration and management tools',
      'whatsapp_status': 'Check WhatsApp connection status and health',
      'whatsapp_qr': 'Generate and display WhatsApp QR code for scanning',
      'whatsapp_groups': 'Manage WhatsApp groups and routing configuration',
      'whatsapp_messages': 'View and manage incoming WhatsApp messages',
      'whatsapp_analytics': 'WhatsApp message analytics and insights',
      'whatsapp_flags': 'Review flagged WhatsApp messages',
      'whatsapp_routing': 'Configure WhatsApp message routing rules',
      'integrated_environment': 'Integrated WhatsApp service environment',
      'hybrid_architecture': 'Hybrid architecture WhatsApp system',
      'real_time': 'Real-time WhatsApp message processing',
      'live_stream': 'Live WhatsApp message stream',
      'message_monitoring': 'Monitor WhatsApp messages in real-time',
      'ai_analysis': 'AI-powered WhatsApp message analysis',
      'sentiment_detection': 'Sentiment analysis for WhatsApp messages',
      'flagging_system': 'Automated flagging system for WhatsApp messages',
      'escalation': 'Message escalation and alert system',
      'notification_system': 'WhatsApp notification and alert system'
    };
    return descriptions[key] || `Navigate to ${key} section`;
  };

  // Filter navigation items based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredItems([]);
      return;
    }

    const filtered = navItems.filter(item => 
      item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getSearchDescription(item.key).toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 8); // Limit to 8 results

    setFilteredItems(filtered);
  }, [searchTerm, navItems]);

  const getCurrentPageTitle = () => {
    const currentItem = navItems.find(item => item.key === currentView);
    return currentView === "messages" ? "Messages" : currentItem?.label || 'Dashboard';
  };

  const getWaStatusInfo = () => {
    if (isLoading) return { status: 'loading', text: 'Loading...' };
    
    if (waStatus === 'CONNECTED') return { status: 'connected', text: 'WhatsApp Connected' };
    if (waStatus === 'NOT CONNECTED') return { status: 'disconnected', text: 'WhatsApp Disconnected' };
    return { status: 'neutral', text: `WhatsApp: ${waStatus}` };
  };

  const handleSearchFocus = () => {
    setSearchOpen(true);
  };

  const handleSearchBlur = () => {
    // Delay closing to allow clicking on results
    setTimeout(() => setSearchOpen(false), 200);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSearchSelect = (item) => {
    navigate(`/${item.key}`);
    setSearchTerm('');
    setSearchOpen(false);
    
    // Auto-save memory when navigating to new page
    if (item.key !== currentView) {
      savePageMemory(item);
    }
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === 'Enter' && filteredItems.length > 0) {
      handleSearchSelect(filteredItems[0]);
    } else if (event.key === 'Escape') {
      setSearchOpen(false);
      setSearchTerm('');
      searchRef.current?.blur();
    }
  };

  // Auto-save memory function
  const savePageMemory = async (targetPage) => {
    try {
      const sessionId = sessionStorage.getItem('dashboard_session_id') || 
                       `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      if (!sessionStorage.getItem('dashboard_session_id')) {
        sessionStorage.setItem('dashboard_session_id', sessionId);
      }

      const memoryData = {
        session_id: sessionId,
        page_data: {
          current_page: currentView,
          target_page: targetPage.key,
          navigation_method: 'search',
          page_title: getCurrentPageTitle(),
          target_title: targetPage.label,
          timestamp: new Date().toISOString()
        },
        user_context: {
          search_term: searchTerm,
          search_results_count: filteredItems.length,
          whatsapp_status: waStatus,
          realtime_enabled: realtime,
          message_count: messageCount,
          sidebar_open: sidebarOpen,
          is_mobile: isMobile
        },
        memory_type: 'page_navigation',
        description: `Navigation from ${getCurrentPageTitle()} to ${targetPage.label} via search`,
        auto_generated: true
      };

      const response = await fetch('/api/memory/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(memoryData)
      });

      if (response.ok) {
        console.log('📝 Page memory saved successfully');
      }
    } catch (error) {
      console.warn('⚠️ Failed to save page memory:', error);
    }
  };

  const waStatusInfo = getWaStatusInfo();

  return (
    <StyledHeader sidebarOpen={sidebarOpen && !isMobile}>
      <LeftSection>
        <HamburgerButton
          onClick={onSidebarToggle}
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
        >
          <MenuIcon />
        </HamburgerButton>
        <Logo>
          WTF Gym
        </Logo>
      </LeftSection>

      {/* Search Section */}
      <MiddleSection>
        <Box sx={{ position: 'relative', width: '100%' }}>
          <SearchField
            ref={searchRef}
            fullWidth
            placeholder="🔍 Search dashboard features... (Try: analytics, AI, auto-healer, messages)"
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            onKeyDown={handleSearchKeyDown}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: BRAND_COLORS.mediumGray }} />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <Typography variant="caption" sx={{ color: BRAND_COLORS.mediumGray, fontSize: '0.7rem' }}>
                    ⌘K
                  </Typography>
                </InputAdornment>
              )
            }}
            size="small"
          />
          
          {/* Search Results Dropdown */}
          {searchOpen && filteredItems.length > 0 && (
            <SearchResults>
              {filteredItems.map((item, index) => (
                <SearchResultItem
                  key={item.key}
                  onClick={() => handleSearchSelect(item)}
                  selected={index === 0}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: BRAND_COLORS.red }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.label}
                    secondary={getSearchDescription(item.key)}
                    primaryTypographyProps={{
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}
                    secondaryTypographyProps={{
                      fontSize: '0.8rem',
                      color: BRAND_COLORS.mediumGray
                    }}
                  />
                </SearchResultItem>
              ))}
              
              {searchTerm && filteredItems.length === 0 && (
                <ListItem>
                  <ListItemText 
                    primary="No features found"
                    secondary={`No results for "${searchTerm}"`}
                    primaryTypographyProps={{
                      color: BRAND_COLORS.mediumGray,
                      fontStyle: 'italic'
                    }}
                  />
                </ListItem>
              )}
            </SearchResults>
          )}
        </Box>
      </MiddleSection>

      {/* Enhanced Status Indicators */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 2 }}>
        {/* WhatsApp Status with enhanced connection info */}
        <Tooltip title={`WhatsApp: ${waStatusInfo.text}${waStatusInfo.status === 'connected' ? ' ✓' : ''}`}>
          <Chip
            icon={waStatusInfo.status === 'loading' ? <CircularProgress size={16} /> : undefined}
            label={waStatusInfo.status === 'connected' ? 'WhatsApp Connected' : 'WhatsApp'}
            color={waStatusInfo.status === 'connected' ? 'success' : waStatusInfo.status === 'disconnected' ? 'error' : 'default'}
            variant={waStatusInfo.status === 'connected' ? 'filled' : 'outlined'}
            size="small"
            sx={{ fontSize: '0.75rem' }}
          />
        </Tooltip>

        {/* ENHANCED: Real-time Status Indicator with WebSocket monitoring */}
        <Tooltip title={`Real-time Updates: ${realtime ? 'ON' : 'OFF'}${websocketConnected ? ' (Connected)' : ' (Disconnected)'}\nMessages received: ${realtimeStats.messagesReceived}\nLast activity: ${realtimeStats.lastActivity ? realtimeStats.lastActivity.toLocaleTimeString() : 'None'}`}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Connection Status Dot */}
            <Box sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: realtime ? (websocketConnected ? '#4caf50' : '#ff9800') : '#9e9e9e',
              transition: 'background-color 0.3s ease',
              boxShadow: realtime && websocketConnected ? '0 0 8px rgba(76, 175, 80, 0.6)' : 'none'
            }} />
            
            <Chip
              label={realtime ? 'Real-time ON' : 'Real-time OFF'}
              color={realtime ? (websocketConnected ? 'success' : 'warning') : 'default'}
              variant={realtime ? 'filled' : 'outlined'}
              size="small"
              sx={{ 
                fontSize: '0.75rem',
                '& .MuiChip-label': {
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }
              }}
              onClick={() => onRealtimeToggle(!realtime)}
              clickable
            />

            {/* New Message Pulse Effect */}
            {lastMessageReceived && (
              <Box sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: '#2196f3',
                animation: 'pulse 1s infinite',
                '@keyframes pulse': {
                  '0%': { transform: 'scale(1)', opacity: 1 },
                  '50%': { transform: 'scale(1.2)', opacity: 0.7 },
                  '100%': { transform: 'scale(1)', opacity: 1 }
                }
              }} />
            )}
          </Box>
        </Tooltip>

        {/* Message Count with enhanced info */}
        <Tooltip title={`Total Messages: ${messageCount} loaded\nReal-time messages received: ${realtimeStats.messagesReceived}`}>
          <Chip
            icon={<MessageIcon />}
            label={`Messages: ${messageCount}`}
            variant="outlined"
            size="small"
            sx={{ fontSize: '0.75rem' }}
          />
        </Tooltip>
      </Box>
    </StyledHeader>
  );
};

export default Header; 