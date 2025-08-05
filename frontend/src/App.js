import React, { useState, useEffect, useCallback } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import {
  Box, CssBaseline, AppBar, Toolbar, IconButton, Typography, Drawer, List, ListItem, ListItemIcon,
  ListItemText, Divider, useTheme, useMediaQuery, Paper, Snackbar, CircularProgress, Button, 
  Tabs, Tab, FormControl, Select, MenuItem, 
  InputBase, Chip, Card, CardContent, Collapse, Switch, FormControlLabel, Pagination, Tooltip,
  Badge, Fab, Table, TableHead, TableBody, TableRow, TableCell, Grid, TextField,
  Alert, Skeleton, Dialog, DialogTitle, DialogContent, DialogActions
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  TrendingUp as TrendingUpIcon,
  Settings as SettingsIcon,
  SmartToy as AIIcon,
  Notifications as NotificationsIcon,
  Assessment as AssessmentIcon,
  SettingsInputAntenna as SettingsInputAntennaIcon,
  Security as SecurityIcon,
  AutoAwesome as AutoAwesomeIcon,
  ManageAccounts as ManageAccountsIcon,
  Reviews as ReviewsIcon,
  Key as KeyIcon,
  Analytics as AnalyticsIcon,
  MonitorHeart as MonitorHeartIcon,
  Api as ApiIcon,
  QrCode as QrCodeIcon,
  Info as InfoIcon,
  Flag as FlagIcon,
  Attachment as AttachmentIcon,
  Visibility as VisibilityIcon,
  MoreVert as MoreVertIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  GetApp as ExportIcon,
  Download as DownloadIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Menu as MenuIcon,
  Search as SearchIcon,
  Image as ImageIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  AudioFile as AudioFileIcon,
  Description as DocumentIcon,
  Description as DescriptionIcon,
  Message as MessageIcon,
  Category as CategoryIcon,
  Psychology as PsychologyIcon
} from '@mui/icons-material';
import io from "socket.io-client";
import { createTheme, ThemeProvider, styled } from "@mui/material/styles";
import axios from "axios";
import QRCode from 'qrcode';
import environment from "./config/environment";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

import ViewButton from "./components/ViewButton";
import ConfirmationModal from "./components/ConfirmationModal";
import AnalyticsModal from "./components/AnalyticsModal";
import FiltersPanel from "./components/FiltersPanel";
import MessageActions from "./components/MessageActions";
import NotificationToast from "./components/NotificationToast";
import AnalyticsPage from "./components/AnalyticsPage";
import SlackIntegrationPage from "./components/SlackIntegrationPage";
import DigestPage from "./components/DigestPage";
import KeywordAnalyticsPage from './components/KeywordAnalyticsPage';
import FlagKeywordsPage from './components/FlagKeywordsPage';
import KeywordReviewPage from './components/KeywordReviewPage';
import IssueCategoriesPage from './components/IssueCategoriesPage';
import ComprehensiveAnalyticsDashboard from './components/ComprehensiveAnalyticsDashboard';
import WhatsAppRoutingPage from './components/WhatsAppRoutingPage';
import WhatsAppRoutingPageV2 from './components/WhatsAppRoutingPageV2';
import WhatsAppGroupsV2 from './components/WhatsAppGroupsV2';
import DialogTestV3 from './components/DialogTestV3';
import AIConfidenceManagement from './components/AIConfidenceManagement';
import DynamicCategoriesPage from './components/DynamicCategoriesPage';
import AIDashboardPage from './components/AIDashboardPage';
import ManualLabelingPage from './components/ManualLabelingPage';
// AutoHealerPage removed
import UserInteractionLogger from './components/UserInteractionLogger';
import UserInteractionLogsPage from './components/UserInteractionLogsPage';
import LogViewerPage from './components/LogViewerPage';
import EndpointsPage from './components/EndpointsPage';
import DashboardHealthMonitor from './components/DashboardHealthMonitor';
import AIIntelligencePage from './components/AIIntelligencePage';
import LiveConsole from './components/LiveConsole';

// NEW: Advanced Categorization & Routing Components
import AdvancedCategorizationPage from './components/AdvancedCategorizationPage';
import EscalationMonitoringPage from './components/EscalationMonitoringPage';
import DepartmentPerformanceDashboard from './components/DepartmentPerformanceDashboard';
import ContextualAnalysisViewer from './components/ContextualAnalysisViewer';
// Global Frontend Logging System
import logFrontend, { logDebug, logInfo, logWarn, logError } from './utils/logger';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from 'recharts';

// AUTOMATIC AXIOS CONFIGURATION
axios.defaults.baseURL = environment.apiBaseUrl;
console.log('🔧 Axios configured with baseURL:', environment.apiBaseUrl);

// HELPER FUNCTION FOR FETCH CALLS
const apiUrl = (path) => `${environment.apiBaseUrl}${path}`;
console.log('🔧 API URL helper created for environment:', environment.isLocal ? 'LOCAL' : 'PRODUCTION');
// Removed date-fns imports - no longer needed for date filtering

// WTF Brand Colors
const BRAND_COLORS = {
  red: '#E50012',
  darkGray: '#374151',
  mediumGray: '#6B7280',
  lightGray: '#F9FAFB',
  white: '#FFFFFF',
  green: '#10B981',
  shadow: 'rgba(0, 0, 0, 0.1)',
  border: 'rgba(0, 0, 0, 0.08)',
  sidebarBg: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)'
};

const SIDEBAR_WIDTH = 280;
const SIDEBAR_COLLAPSED_WIDTH = 60;
const ITEMS_PER_PAGE = 100; // Increased from 25 to 100
const MAX_INFINITE_SCROLL_ITEMS = 1000; // After 1000 items, switch to pagination
// REMOVED: Infinite scroll constant - using simple pagination instead

const NAV_ITEMS = [
  { label: "Dashboard", key: "dashboard", icon: <DashboardIcon /> },
  { label: "All Messages", key: "messages", icon: <DashboardIcon /> },
  { label: "Flagged Messages", key: "flagged", icon: <FlagIcon /> },
  { label: "Analytics", key: "analytics", icon: <TrendingUpIcon /> },
  { label: "AI Dashboard", key: "ai_dashboard", icon: <AIIcon /> },
  { label: "🧠 AI Intelligence", key: "ai_intelligence", icon: <AIIcon /> },
  { label: "🧠 AI Manual Labeling", key: "ai_labeling", icon: <AIIcon /> },
  // Auto-Healer menu item removed
  { label: "Daily/Weekly Digest", key: "digest", icon: <AssessmentIcon /> },
  { label: "Slack Integration", key: "slack", icon: <NotificationsIcon /> },
  { label: "WhatsApp Routing", key: "whatsapp_routing", icon: <SettingsInputAntennaIcon /> },
  { label: "🆕 WhatsApp Groups V2", key: "whatsapp_groups_v2", icon: <SettingsInputAntennaIcon /> },
  { label: "🧪 Dialog Test V3", key: "dialog_test_v3", icon: <SettingsInputAntennaIcon /> },
  { label: "AI Confidence Management", key: "ai_confidence", icon: <SecurityIcon /> },
  { label: "Dynamic Categories", key: "dynamic_categories", icon: <AutoAwesomeIcon /> },
  { label: "Issue Management", key: "issue_management", icon: <ManageAccountsIcon /> },
  { label: "Keyword Review", key: "keyword_review", icon: <ReviewsIcon /> },
  { label: "Flag Keywords", key: "flag_keywords", icon: <KeyIcon /> },
  { label: "Keyword Analytics", key: "keyword_analytics", icon: <AnalyticsIcon /> },
  { label: "User Interaction Logs", key: "interaction_logs", icon: <AnalyticsIcon /> },
  { label: "Development Log Viewer", key: "log-viewer", icon: <AnalyticsIcon /> },
  { label: "Health Monitor", key: "health_monitor", icon: <MonitorHeartIcon /> },
  { label: "API Endpoints", key: "endpoints", icon: <ApiIcon /> },
  { label: "System Status", key: "status", icon: <SettingsInputAntennaIcon /> },
  { label: "📱 WhatsApp QR (Integrated)", key: "qr", icon: <QrCodeIcon /> },
      { label: "About", key: "about", icon: <InfoIcon /> },
    
    // NEW: Advanced Categorization & Routing Pages
    { label: "🆕 NEW Advanced Categorization", key: "advanced_categorization", icon: <CategoryIcon /> },
    { label: "🆕 NEW Escalation Monitoring", key: "escalation_monitoring", icon: <SecurityIcon /> },
    { label: "🆕 NEW Department Performance", key: "department_performance", icon: <AssessmentIcon /> },
    { label: "🆕 NEW Contextual Analysis", key: "contextual_analysis", icon: <PsychologyIcon /> },
];

// CRITICAL FIX: Force WebSocket protocol explicitly - BUILD VERSION: 2025-07-23-15-50
// AUTOMATIC ENVIRONMENT-BASED CONFIGURATION
const SOCKET_URL = environment.websocketUrl;

console.log('🔌 AUTOMATIC SOCKET_URL:', SOCKET_URL);
console.log('🔧 Environment Info:', {
  isLocal: environment.isLocal,
  apiBase: environment.apiBaseUrl,
  websocket: environment.websocketUrl
});

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: BRAND_COLORS.red },
    secondary: { main: BRAND_COLORS.green },
    background: { default: BRAND_COLORS.lightGray, paper: BRAND_COLORS.white },
    text: { primary: BRAND_COLORS.darkGray, secondary: BRAND_COLORS.mediumGray }
  },
  typography: { 
    fontFamily: "'Inter', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    h6: { fontWeight: 600, fontSize: '1.1rem' },
    h5: { fontWeight: 700, fontSize: '1.3rem' },
    h4: { fontWeight: 700, fontSize: '1.5rem' },
    body1: { fontSize: '0.95rem', lineHeight: 1.6 },
    body2: { fontSize: '0.85rem', lineHeight: 1.5 }
  },
  shape: { borderRadius: 12 },
  shadows: [
    'none',
    `0 1px 3px ${BRAND_COLORS.shadow}`,
    `0 4px 6px ${BRAND_COLORS.shadow}`,
    `0 10px 15px ${BRAND_COLORS.shadow}`,
    ...Array(21).fill(`0 10px 25px ${BRAND_COLORS.shadow}`)
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '@global': {
          '@keyframes pulse': {
            '0%': { opacity: 1 },
            '50%': { opacity: 0.5 },
            '100%': { opacity: 1 }
          },
          '@keyframes slideInLeft': {
            '0%': { transform: 'translateX(-20px)', opacity: 0 },
            '100%': { transform: 'translateX(0)', opacity: 1 }
          },
          '@keyframes fadeInUp': {
            '0%': { transform: 'translateY(10px)', opacity: 0 },
            '100%': { transform: 'translateY(0)', opacity: 1 }
          },
          '@keyframes bounce': {
            '0%, 20%, 53%, 80%, 100%': { transform: 'translateY(0)' },
            '40%, 43%': { transform: 'translateY(-8px)' },
            '70%': { transform: 'translateY(-4px)' },
            '90%': { transform: 'translateY(-2px)' }
          }
        }
      }
    }
  }
});

const StyledSidebar = styled(Box)(({ theme, open }) => ({
  width: open ? SIDEBAR_WIDTH : 0,
  height: '100vh',
  position: 'fixed',
  left: 0,
  top: 0,
  background: BRAND_COLORS.sidebarBg,
  borderRight: `1px solid ${BRAND_COLORS.border}`,
  zIndex: 1300,
  display: 'flex',
  flexDirection: 'column',
  transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  overflow: 'hidden',
  boxShadow: open ? `4px 0 12px ${BRAND_COLORS.shadow}` : 'none'
}));

const SidebarOverlay = styled(Box)(({ theme, open }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  zIndex: 1250,
  display: open ? 'block' : 'none',
  transition: 'opacity 0.3s ease'
}));

const StyledNavItem = styled(ListItem)(({ theme, active }) => ({
  margin: '2px 12px',
  borderRadius: 10,
  padding: '10px 16px',
  cursor: 'pointer',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  minHeight: 48,
  '&:hover': {
    backgroundColor: active ? BRAND_COLORS.red : 'rgba(229, 0, 18, 0.08)',
    transform: 'translateX(2px)'
  },
  ...(active && {
    backgroundColor: BRAND_COLORS.red,
    color: BRAND_COLORS.white,
    boxShadow: `0 4px 12px rgba(229, 0, 18, 0.4)`,
    '&::before': {
      content: '""',
      position: 'absolute',
      left: -12,
      top: 0,
      height: '100%',
      width: 4,
      backgroundColor: BRAND_COLORS.red,
      borderRadius: '0 4px 4px 0'
    }
  })
}));

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  boxShadow: `0 1px 3px ${BRAND_COLORS.shadow}`,
  border: `1px solid ${BRAND_COLORS.border}`,
  transition: 'all 0.3s ease',
  backgroundColor: BRAND_COLORS.white,
  '&:hover': {
    boxShadow: `0 4px 12px ${BRAND_COLORS.shadow}`,
    transform: 'translateY(-1px)'
  }
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '1.1rem',
  textTransform: 'none',
  minWidth: 180,
  padding: '16px 32px',
  color: BRAND_COLORS.darkGray,
  borderRadius: '12px 12px 0 0',
  marginRight: '4px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&.Mui-selected': {
    color: BRAND_COLORS.red,
    fontWeight: 700,
    backgroundColor: 'rgba(229, 0, 18, 0.04)'
  },
  '&:hover': {
    backgroundColor: 'rgba(229, 0, 18, 0.04)'
  }
}));

const StyledBadge = styled(Chip)(({ status }) => ({
  fontWeight: 600,
  fontSize: '0.75rem',
  height: 28,
  borderRadius: 14,
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
  ...(status === 'positive' && {
    backgroundColor: BRAND_COLORS.green,
    color: BRAND_COLORS.white
  }),
  ...(status === 'negative' && {
    backgroundColor: BRAND_COLORS.red,
    color: BRAND_COLORS.white
  })
}));

const SearchInput = styled(InputBase)(({ theme }) => ({
  backgroundColor: BRAND_COLORS.white,
  borderRadius: 10,
  padding: '10px 16px',
  fontSize: '0.9rem',
  width: '100%',
  border: `1px solid ${BRAND_COLORS.border}`,
  transition: 'all 0.2s ease',
  '&:hover': {
    borderColor: BRAND_COLORS.red,
    boxShadow: `0 0 0 2px rgba(229, 0, 18, 0.1)`
  },
  '&.Mui-focused': {
    borderColor: BRAND_COLORS.red,
    boxShadow: `0 0 0 3px rgba(229, 0, 18, 0.15)`
  }
}));

const TableContainer = styled(Box)(({ theme }) => ({
  backgroundColor: BRAND_COLORS.white,
  borderRadius: 12,
  overflow: 'hidden',
  border: `1px solid ${BRAND_COLORS.border}`,
  '& table': {
    width: '100%',
    borderCollapse: 'collapse',
    '& th': {
      backgroundColor: BRAND_COLORS.lightGray,
      padding: '16px 20px',
      fontWeight: 700,
      fontSize: '0.85rem',
      color: BRAND_COLORS.darkGray,
      borderBottom: `1px solid ${BRAND_COLORS.border}`,
      textAlign: 'left',
      whiteSpace: 'nowrap',
      position: 'sticky',
      top: 0,
      zIndex: 10
    },
    '& td': {
      padding: '16px 20px',
      fontSize: '0.85rem',
      borderBottom: `1px solid ${BRAND_COLORS.border}`,
      verticalAlign: 'top',
      lineHeight: 1.5
    },
    '& tbody tr': {
      transition: 'all 0.15s ease',
      '&:nth-of-type(even)': {
        backgroundColor: 'rgba(249, 250, 251, 0.5)'
      },
      '&:hover': {
        backgroundColor: 'rgba(229, 0, 18, 0.04)',
        transform: 'scale(1.001)',
        boxShadow: `0 2px 8px ${BRAND_COLORS.shadow}`
      },
      '&:last-child td': {
        borderBottom: 'none'
      }
    }
  }
}));

const StyledHeader = styled(Box)(({ theme, sidebarOpen }) => ({
  position: 'sticky',
  top: 0,
  zIndex: 100,
  backgroundColor: BRAND_COLORS.white,
  borderBottom: `1px solid ${BRAND_COLORS.border}`,
  marginLeft: sidebarOpen && !theme.breakpoints.down("lg") ? SIDEBAR_WIDTH : 0,
  transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: `0 1px 3px ${BRAND_COLORS.shadow}`
}));

// Media Icon Component with processing status
const MediaIcon = ({ mediaType, hasMedia, mediaSize, mediaFilename, processingStatus }) => {
  if (!hasMedia) return null;
  
  const getMediaIcon = () => {
    switch (mediaType?.toLowerCase()) {
      case 'image':
        return '📷';
      case 'video':
        return '🎥';
      case 'audio':
        return '🎵';
      case 'application':
      case 'document':
        return '📄';
      default:
        return '📎';
    }
  };

  const getStatusColor = () => {
    if (!mediaFilename || processingStatus === 'processing') {
      return 'rgba(255, 152, 0, 0.1)'; // Orange for processing
    }
    if (mediaFilename?.includes('FAILED:')) {
      return 'rgba(244, 67, 54, 0.1)'; // Red for failed
    }
    return 'rgba(25, 118, 210, 0.1)'; // Blue for ready
  };

  const getStatusText = () => {
    if (!mediaFilename || processingStatus === 'processing') {
      return 'Processing...';
    }
    if (mediaFilename?.includes('FAILED:')) {
      return 'Failed';
    }
    return 'Ready';
  };

  return (
    <Box sx={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      mr: 1,
      backgroundColor: getStatusColor(),
      borderRadius: '4px',
      px: 0.5,
      py: 0.25,
      border: !mediaFilename ? '1px dashed rgba(255, 152, 0, 0.5)' : 'none'
    }}>
      <Typography sx={{ fontSize: '14px', mr: 0.5 }}>
        {getMediaIcon()}
      </Typography>
      {!mediaFilename || processingStatus === 'processing' ? (
        <CircularProgress size={12} sx={{ color: '#ff9800' }} />
      ) : mediaFilename?.includes('FAILED:') ? (
        <ErrorIcon sx={{ fontSize: '12px', color: '#f44336' }} />
      ) : (
        <CheckCircleIcon sx={{ fontSize: '12px', color: '#4caf50' }} />
      )}
      <Typography sx={{ fontSize: '10px', ml: 0.5, color: 'text.secondary' }}>
        {getStatusText()}
      </Typography>
    </Box>
  );
};

// Expandable Message Component
const ExpandableMessage = ({ message, hasMedia, mediaType, maxLength = 50 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const formatMessage = (message, hasMedia, mediaType) => {
    if (hasMedia) {
      if (!message || message === '[No Text]') {
        const mediaTypeText = mediaType ? mediaType.toUpperCase() : 'MEDIA';
        return `📎 ${mediaTypeText} ATTACHMENT`;
      } else {
        // Message with media
        return `${message} 📎`;
      }
    }
    return message || '[No Text]';
  };

  const formattedMessage = formatMessage(message, hasMedia, mediaType);
  const shouldTruncate = formattedMessage.length > maxLength;
  const displayMessage = isExpanded || !shouldTruncate 
    ? formattedMessage 
    : `${formattedMessage.substring(0, maxLength)}...`;

  return (
    <Box>
      <Typography variant="body2" sx={{ 
        wordBreak: 'break-word',
        whiteSpace: isExpanded ? 'normal' : 'nowrap',
        overflow: isExpanded ? 'visible' : 'hidden',
        textOverflow: isExpanded ? 'clip' : 'ellipsis',
        maxWidth: isExpanded ? 'none' : 300
      }}>
        {displayMessage}
      </Typography>
      {shouldTruncate && (
        <Button
          size="small"
          variant="text"
          sx={{ 
            fontSize: '0.75rem', 
            p: 0, 
            minWidth: 'auto', 
            color: 'primary.main',
            textTransform: 'none'
          }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'View Less' : 'View More'}
        </Button>
      )}
    </Box>
  );
};

// Enhanced Message Row Component
const MessageRow = ({ row, onView, onFlag, onEscalate, onAnalyze }) => {
  console.log('🔍 MessageRow rendered for message:', row.id);
  
  const getSentimentColor = (sentiment) => {
    if (!sentiment) return 'default';
    switch (sentiment.toLowerCase()) {
      case 'positive': return 'success';
      case 'negative': return 'error';
      case 'neutral': return 'info';
      default: return 'default';
    }
  };

  const formatMessage = (message, hasMedia, mediaType) => {
    if (hasMedia) {
      if (!message || message === '[No Text]') {
        const mediaTypeText = mediaType ? mediaType.toUpperCase() : 'MEDIA';
        return `📎 ${mediaTypeText} ATTACHMENT`;
      } else {
        // Message with media
        return `${message} 📎`;
      }
    }
    return message || '[No Text]';
  };

  return (
    <TableRow hover>
      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {new Date(row.received_at).toLocaleString()}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {row.group_name || 'Direct Message'}
        </Typography>
      </TableCell>
      <TableCell>
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {row.sender_name || 'Unknown'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.number ? row.number.replace(/@.*$/, '') : 'No number'}
          </Typography>
        </Box>
      </TableCell>
      <TableCell>
        <Box display="flex" alignItems="center">
          <MediaIcon mediaType={row.media_type} hasMedia={row.has_media} mediaSize={row.media_size} mediaFilename={row.media_filename} processingStatus={row.processing_status} />
          <ExpandableMessage message={row.message} hasMedia={row.has_media} mediaType={row.media_type} />
        </Box>
      </TableCell>
      <TableCell>
        <Box display="flex" gap={0.5} flexWrap="wrap">
          {/* AI Flagging Status */}
          {row.flag_type && (
            <Chip 
              label={row.flag_type} 
              size="small" 
              color="error"
              icon={<FlagIcon />}
            />
          )}
          
          {/* AI Sentiment Analysis */}
          {(row.sentiment || row.ai_sentiment) && (
            <Chip 
              label={`😊 ${row.sentiment || row.ai_sentiment}`} 
              size="small" 
              color={getSentimentColor(row.sentiment || row.ai_sentiment)}
            />
          )}
          
          {/* AI Intent Classification */}
          {(row.intent || row.ai_intent) && (
            <Chip 
              label={`🎯 ${row.intent || row.ai_intent}`} 
              size="small" 
              color="primary"
              variant="outlined"
            />
          )}
          
          {/* NEW: Escalation Risk Indicator */}
          {row.escalation_score !== undefined && row.escalation_score > 0 && (
            <Chip 
              label={`⚡ Risk ${Math.round(row.escalation_score * 100)}%`}
              size="small" 
              color={
                row.escalation_score >= 0.8 ? 'error' :
                row.escalation_score >= 0.6 ? 'warning' :
                row.escalation_score >= 0.3 ? 'info' : 'default'
              }
              variant={row.escalation_score >= 0.7 ? 'filled' : 'outlined'}
              sx={{
                fontWeight: row.escalation_score >= 0.7 ? 'bold' : 'normal',
                animation: row.escalation_score >= 0.8 ? 'pulse 2s infinite' : 'none'
              }}
            />
          )}
          
          {/* Advanced AI Category */}
          {row.advanced_category && (
            <Chip 
              label={
                row.advanced_category === 'INSTRUCTION' ? '🔧 INSTRUCTION' :
                row.advanced_category === 'ESCALATION' ? '📢 ESCALATION' :
                row.advanced_category === 'COMPLAINT' ? '⚠️ COMPLAINT' :
                row.advanced_category === 'URGENT' ? '🚨 URGENT' :
                row.advanced_category === 'CASUAL' ? '💬 CASUAL' :
                row.advanced_category
              }
              size="small" 
              color={
                row.advanced_category === 'URGENT' ? 'error' :
                row.advanced_category === 'ESCALATION' ? 'warning' :
                row.advanced_category === 'COMPLAINT' ? 'warning' :
                row.advanced_category === 'INSTRUCTION' ? 'info' :
                'default'
              }
              variant={
                ['URGENT', 'ESCALATION'].includes(row.advanced_category) ? 'filled' : 'outlined'
              }
            />
          )}
          
          {/* NEW: Routing Trail Visualization */}
          {(row.routing_status || row.routed_groups) && (
            <Chip 
              label={
                row.routing_status === 'routed' ? `📤 → ${row.routed_groups || 'Groups'}` :
                row.routing_status === 'failed' ? '❌ Routing Failed' :
                row.routing_status === 'pending' ? '⏳ Routing...' :
                '🔄 Routing Status'
              }
              size="small" 
              color={
                row.routing_status === 'routed' ? 'success' :
                row.routing_status === 'failed' ? 'error' :
                row.routing_status === 'pending' ? 'warning' :
                'info'
              }
              variant="outlined"
              title={`Routing Strategy: ${row.routing_strategy || 'N/A'}`}
            />
          )}
          
          {/* Media Status */}
          {row.has_media && (
            <Chip 
              label={`📎 ${row.media_type?.toUpperCase() || 'MEDIA'}`} 
              size="small" 
              color="info"
              icon={<AttachmentIcon />}
            />
          )}
          
          {/* Processing Status for Media */}
          {row.has_media && row.processing_status && (
            <Chip 
              label={row.processing_status === 'processing' ? '⏳ Processing' : '✅ Processed'} 
              size="small" 
              color={row.processing_status === 'processing' ? 'warning' : 'success'}
            />
          )}
        </Box>
      </TableCell>
      <TableCell>
        <Box display="flex" gap={1}>
          <ViewButton
            size="small"
            variant="highlighted"
            onClick={() => {
              console.log("✅ VIEW button clicked for message:", row.id);
              if (onView && typeof onView === 'function') {
                console.log("✅ Calling onView function");
                onView(row);
              } else {
                console.log("❌ onView is not a function:", typeof onView);
              }
            }}
          >
            View
          </ViewButton>
          <Button
            size="small"
            variant="outlined"
            color="warning"
            onClick={() => onFlag(row)}
          >
            Flag
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() => onEscalate(row)}
          >
            Escalate
          </Button>
        </Box>
      </TableCell>
    </TableRow>
  );
};

// Enhanced Flagged Message Row Component
const FlaggedMessageRow = ({ row, onView, onUnflag, onEscalate }) => {
  console.log('🔍 FlaggedMessageRow rendered for message:', row.id);
  
  const getSeverityColor = (flagReason) => {
    if (!flagReason) return 'default';
    const reason = flagReason.toLowerCase();
    if (reason.includes('urgent') || reason.includes('angry')) return 'error';
    if (reason.includes('negative') || reason.includes('complaint')) return 'warning';
    return 'info';
  };

  const getSentimentColor = (sentiment) => {
    if (!sentiment) return 'default';
    switch (sentiment.toLowerCase()) {
      case 'positive': return 'success';
      case 'negative': return 'error';
      case 'neutral': return 'info';
      default: return 'default';
    }
  };

  const formatMessage = (message, hasMedia, mediaType) => {
    if (hasMedia && (!message || message === '[No Text]')) {
      return `📎 ${mediaType?.toUpperCase() || 'MEDIA'} ATTACHMENT`;
    }
    return message || '[No Text]';
  };

  return (
    <TableRow hover>
      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {new Date(row.received_at).toLocaleString()}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {row.group_name || 'Direct Message'}
        </Typography>
      </TableCell>
      <TableCell>
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {row.sender_name || 'Unknown'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.number ? row.number.replace(/@.*$/, '') : 'No number'}
          </Typography>
        </Box>
      </TableCell>
      <TableCell>
        <Box display="flex" alignItems="center">
          <MediaIcon mediaType={row.media_type} hasMedia={row.has_media} mediaSize={row.media_size} mediaFilename={row.media_filename} processingStatus={row.processing_status} />
          <ExpandableMessage message={row.message} hasMedia={row.has_media} mediaType={row.media_type} />
        </Box>
      </TableCell>
      <TableCell>
        <Box display="flex" gap={0.5} flexWrap="wrap">
          {/* Flag Reason */}
          {row.flag_reason && (
            <Chip 
              label={`🚨 ${row.flag_reason}`} 
              size="small" 
              color={getSeverityColor(row.flag_reason)}
              icon={<FlagIcon />}
            />
          )}
          
          {/* AI Sentiment Analysis */}
          {(row.sentiment || row.ai_sentiment) && (
            <Chip 
              label={`😊 ${row.sentiment || row.ai_sentiment}`} 
              size="small" 
              color={getSentimentColor(row.sentiment || row.ai_sentiment)}
            />
          )}
          
          {/* AI Intent Classification */}
          {(row.intent || row.ai_intent) && (
            <Chip 
              label={`🎯 ${row.intent || row.ai_intent}`} 
              size="small" 
              color="primary"
              variant="outlined"
            />
          )}
          
          {/* NEW: Escalation Risk Indicator */}
          {row.escalation_score !== undefined && row.escalation_score > 0 && (
            <Chip 
              label={`⚡ Risk ${Math.round(row.escalation_score * 100)}%`}
              size="small" 
              color={
                row.escalation_score >= 0.8 ? 'error' :
                row.escalation_score >= 0.6 ? 'warning' :
                row.escalation_score >= 0.3 ? 'info' : 'default'
              }
              variant={row.escalation_score >= 0.7 ? 'filled' : 'outlined'}
              sx={{
                fontWeight: row.escalation_score >= 0.7 ? 'bold' : 'normal',
                animation: row.escalation_score >= 0.8 ? 'pulse 2s infinite' : 'none'
              }}
            />
          )}
          
          {/* Advanced AI Category */}
          {row.advanced_category && (
            <Chip 
              label={
                row.advanced_category === 'INSTRUCTION' ? '🔧 INSTRUCTION' :
                row.advanced_category === 'ESCALATION' ? '📢 ESCALATION' :
                row.advanced_category === 'COMPLAINT' ? '⚠️ COMPLAINT' :
                row.advanced_category === 'URGENT' ? '🚨 URGENT' :
                row.advanced_category === 'CASUAL' ? '💬 CASUAL' :
                row.advanced_category
              }
              size="small" 
              color={
                row.advanced_category === 'URGENT' ? 'error' :
                row.advanced_category === 'ESCALATION' ? 'warning' :
                row.advanced_category === 'COMPLAINT' ? 'warning' :
                row.advanced_category === 'INSTRUCTION' ? 'info' :
                'default'
              }
              variant={
                ['URGENT', 'ESCALATION'].includes(row.advanced_category) ? 'filled' : 'outlined'
              }
            />
          )}
          
          {/* NEW: Routing Trail Visualization */}
          {(row.routing_status || row.routed_groups) && (
            <Chip 
              label={
                row.routing_status === 'routed' ? `📤 → ${row.routed_groups || 'Groups'}` :
                row.routing_status === 'failed' ? '❌ Routing Failed' :
                row.routing_status === 'pending' ? '⏳ Routing...' :
                '🔄 Routing Status'
              }
              size="small" 
              color={
                row.routing_status === 'routed' ? 'success' :
                row.routing_status === 'failed' ? 'error' :
                row.routing_status === 'pending' ? 'warning' :
                'info'
              }
              variant="outlined"
              title={`Routing Strategy: ${row.routing_strategy || 'N/A'}`}
            />
          )}
          
          {/* Media Status */}
          {row.has_media && (
            <Chip 
              label={`📎 ${row.media_type?.toUpperCase() || 'MEDIA'}`} 
              size="small" 
              color="info"
              icon={<AttachmentIcon />}
            />
          )}
          
          {/* Processing Status for Media */}
          {row.has_media && row.processing_status && (
            <Chip 
              label={row.processing_status === 'processing' ? '⏳ Processing' : '✅ Processed'} 
              size="small" 
              color={row.processing_status === 'processing' ? 'warning' : 'success'}
            />
          )}
        </Box>
      </TableCell>
      <TableCell>
        <Box display="flex" gap={1}>
          <ViewButton
            size="small"
            variant="highlighted"
            onClick={() => {
              console.log('🔍 BUTTON CLICKED - TEST (FlaggedMessageRow)');
              console.log('🔍 VIEW BUTTON CLICKED (FlaggedMessageRow) for message:', row.id);
              console.log('🔍 onView function:', typeof onView);
              if (onView) {
                console.log("✅ onView is defined, calling it");
                onView(row);
              } else {
                console.log("❌ onView prop is undefined");
              }
            }}
          >
            View
          </ViewButton>
          <Button
            size="small"
            variant="outlined"
            color="success"
            onClick={() => onUnflag(row)}
          >
            Unflag
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() => onEscalate(row)}
          >
            Escalate
          </Button>
        </Box>
      </TableCell>
    </TableRow>
  );
};

export default function App() {
  console.log('🔍 App component rendered');
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Global Frontend Logging Setup
  useEffect(() => {
    // TEMPORARILY DISABLED: Console hijacking was causing infinite loop
    // TODO: Fix logging system to prevent loop - use originalLog inside logFrontend
    /*
    // Proxy console methods to capture all console output
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalDebug = console.debug;

    console.log = (...args) => {
      originalLog(...args);
      logFrontend({
        level: 'info',
        source: 'console.log',
        message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')
      });
    };

    console.warn = (...args) => {
      originalWarn(...args);
      logFrontend({
        level: 'warn',
        source: 'console.warn',
        message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')
      });
    };

    console.error = (...args) => {
      originalError(...args);
      logFrontend({
        level: 'error',
        source: 'console.error',
        message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '),
        stackTrace: new Error().stack
      });
    };

    console.debug = (...args) => {
      originalDebug(...args);
      logFrontend({
        level: 'debug',
        source: 'console.debug',
        message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')
      });
    };
    */

    // Global error handlers
    window.onerror = (message, source, lineno, colno, error) => {
      logError('window.onerror', `${message} at ${source}:${lineno}`, {
        source,
        lineno,
        colno,
        error: error?.message
      });
      return false;
    };

    window.addEventListener('unhandledrejection', (event) => {
      logError('window.unhandledrejection', `Unhandled promise rejection: ${event.reason}`, {
        reason: event.reason
      });
    });

    logInfo('App', 'Frontend logging system initialized', {
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });

    return () => {
      // Restore original console methods on cleanup
      // DISABLED: No hijacking to restore
      /*
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
      console.debug = originalDebug;
      */
    };
  }, []);
  
  // Get current view from URL path
  const getCurrentView = () => {
    const path = location.pathname.slice(1) || 'messages';
    return path;
  };
  
  const [currentView, setCurrentView] = useState(getCurrentView());
  const [currentTab, setCurrentTab] = useState("logs");
  const [sidebarOpen, setSidebarOpen] = useState(false); // ALWAYS start closed
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [alert, setAlert] = useState("");
  const [aboutOpen, setAboutOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [forceUpdate, setForceUpdate] = useState(0); // Force re-renders for real-time updates

  // ENHANCED PAGINATION STATE - New optimized message loading system
  const [logs, setLogs] = useState([]);
  const [flags, setFlags] = useState([]);
  const [allLogs, setAllLogs] = useState([]);
  const [allFlags, setAllFlags] = useState([]);
  // REMOVED: Infinite scroll state variables
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [messageCursor, setMessageCursor] = useState(null);
  const [totalMessageCount, setTotalMessageCount] = useState(0);
  
  // FILTERS - Only applied when user manually sets them
  const [groupFilter, setGroupFilter] = useState("");
  const [senderFilter, setSenderFilter] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(""); // NEW: Advanced AI category filter
  const [activeFilters, setActiveFilters] = useState(false);
  
  // UI STATE
  const [realtime, setRealtime] = useState(true);
  const [loading, setLoading] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [recentMessages, setRecentMessages] = useState([]);
  const [notification, setNotification] = useState({ open: false, message: '', type: 'message', count: 0 });

  // Enhanced pagination and filtering state
  // REMOVED: Infinite scroll - using simple pagination instead
  // REMOVED: Infinite scroll data - using simple pagination instead
  const [loadingMore, setLoadingMore] = useState(false);
    const [totalMessages, setTotalMessages] = useState(0);

  // ENHANCED: WebSocket connection management
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [connectionLatency, setConnectionLatency] = useState(0);
  const [wasDisconnected, setWasDisconnected] = useState(false);
  const [pendingAICount, setPendingAICount] = useState(0);

  const [keywordReview, setKeywordReview] = useState([]);
  const [staticKeywords, setStaticKeywords] = useState([]);
  const [keywordAnalytics, setKeywordAnalytics] = useState([]);
  const [slackAlerts, setSlackAlerts] = useState([]);

  // Analytics filters
  const [analyticsDateRange, setAnalyticsDateRange] = useState('7');
  const [analyticsLocation, setAnalyticsLocation] = useState('');
  const [analyticsCategory, setAnalyticsCategory] = useState('');
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState('daily');
  
  const [waStatus, setWaStatus] = useState('Loading...');

  // Modal states
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [messageDetailOpen, setMessageDetailOpen] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState({ open: false, action: null, data: null });
  const [analyticsModal, setAnalyticsModal] = useState({ open: false, title: '', metricType: '', value: 0 });
  const [actionLoading, setActionLoading] = useState(false);
  
  // Media viewer states
  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);

  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("lg"));

  // OPTIMIZED MESSAGE LOADING SYSTEM - Define functions BEFORE they're used
  // Initial load: Get last 100 messages instantly
  const loadInitialMessages = useCallback(async () => {
    if (initialLoadComplete) return;
    
    try {
      setLoading(true);
      console.log('🚀 Loading initial 100 messages...');
      
      const response = await axios.get(apiUrl('/api/messages'), {
        params: { 
          limit: 100,
          order: 'desc' // Get latest messages first
        }
      });
      
      // FIXED: Backend returns array directly, not wrapped in .messages
      let rawMessages = Array.isArray(response.data) ? response.data : [];
      
      // FIXED: Map backend field names to frontend field names
      const messages = rawMessages.map(msg => ({
        id: msg.id,
        sender_name: msg.fromName || msg.sender_name || 'Unknown',
        group_name: msg.chatName || msg.group_name || 'Direct Message',
        message: msg.body || msg.message || '',
        received_at: msg.timestamp || msg.received_at || msg.createdAt,
        number: msg.fromNumber || msg.number || '',
        has_media: msg.hasMedia || msg.has_media || false,
        media_type: msg.mediaType || msg.media_type || null,
        // Keep all original fields as well
        ...msg
      }));
      
      const total = messages.length;
      
      console.log(`✅ Loaded ${messages.length} initial messages`);
      
      // Set both logs and allLogs with initial data
      setLogs(messages);
      setAllLogs(messages);
      setTotalMessageCount(total);
      // REMOVED: hasMoreMessages - using simple pagination instead
      setMessageCursor(messages.length > 0 ? messages[messages.length - 1].id : null);
      setInitialLoadComplete(true);
      
    } catch (error) {
      console.error('❌ Failed to load initial messages:', error);
      logError('MessageLoading', 'Failed to load initial messages', { error: error.message });
    } finally {
      setLoading(false);
    }
  }, [initialLoadComplete]);

  // REMOVED: loadMoreMessages function - using simple pagination instead

  // INITIAL LOAD: Load messages instantly on page load
  useEffect(() => {
    console.log('🚀 App initialized - Loading initial messages');
    loadInitialMessages();
    setSidebarOpen(false);
    
    // Force load 100 messages on startup
    setTimeout(() => {
      if (logs.length < 100) {
        console.log('🔄 Force loading 100 messages...');
        loadInitialMessages();
      }
    }, 1000);
  }, [loadInitialMessages]); // Add loadInitialMessages as dependency

  // REMOVED: Scroll pagination - using simple pagination buttons instead

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
    // Don't auto-open sidebar on desktop - let user control it manually
  }, [isMobile]);

  // Calculate sidebar width based on state
  const getSidebarWidth = () => {
    if (!sidebarOpen) return 0;
    if (isMobile) return 0; // Mobile sidebar is overlay
    return sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;
  };

  // Calculate main content margin
  const getMainContentMargin = () => {
    if (isMobile) return 0; // Mobile sidebar is overlay
    if (!sidebarOpen) return 0; // Sidebar closed = no margin
    return getSidebarWidth();
  };

  // Group recent messages (last 5 minutes)
  useEffect(() => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    const recent = allLogs.filter(msg => {
      const msgTime = new Date(msg.received_at);
      return msgTime > fiveMinutesAgo;
    });
    
    setRecentMessages(recent);
    if (recent.length > newMessageCount) {
      setNotification({
        open: true,
        message: `${recent.length - newMessageCount} new messages received`,
        type: 'message',
        count: recent.length - newMessageCount
      });
    }
    setNewMessageCount(recent.length);
  }, [allLogs, newMessageCount]);

  // CRITICAL FIX: Message filtering function - moved to main scope for accessibility
  const messageFilter = useCallback((row) => {
    if (groupFilter && row.group_name !== groupFilter) return false;
    if (senderFilter && row.sender_name !== senderFilter) return false;
    if (search && !row.message?.toLowerCase().includes(search.toLowerCase())) return false;
    
    // No date filtering - show all messages in real-time order
    return true;
  }, [groupFilter, senderFilter, search]);

  // OPTIMIZED DATA PROCESSING - Use pre-filtered logs for instant display
  const rows = currentTab === "logs" ? logs : flags;
  const totalPages = Math.ceil(rows.length / 100); // 100 messages per page max
  
  // Add Load History button component
  const LoadHistoryButton = () => (
    <Box display="flex" justifyContent="center" my={2}>
      <Button
        variant="outlined"
        onClick={loadInitialMessages}
        disabled={loading || initialLoadComplete}
        startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
      >
        {loading ? 'Loading...' : initialLoadComplete ? 'History Loaded' : 'Load History'}
      </Button>
    </Box>
  );

  const allGroups = [...new Set(allLogs.concat(allFlags).map(r => r.group_name).filter(Boolean))];
  const allSenders = [...new Set(allLogs.concat(allFlags).map(r => r.sender_name).filter(Boolean))];

  // Real-time socket connection - ALWAYS CONNECT for real-time updates
  useEffect(() => {
    // CRITICAL FIX: Always connect WebSocket regardless of realtime state
    // This ensures real-time updates work consistently
    
    console.log('🔌 Establishing persistent WebSocket connection...');
    console.log('🔌 SOCKET_URL:', SOCKET_URL);
    console.log('🔌 BUILD VERSION: 2025-07-23-15-50');
    console.log('🔌 Real-time state:', realtime);
    
        // AUTOMATIC ENVIRONMENT-BASED CONFIGURATION
    const wsUrl = environment.websocketUrl;
    
    console.log('🔌 HARDCODED WebSocket URL:', wsUrl);
    
    const socket = io(wsUrl, { 
      transports: ["websocket", "polling"],
      timeout: 30000,
      forceNew: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      maxReconnectionAttempts: 20,
      upgrade: true,
      // CRITICAL FIX: Allow fallback to polling if WebSocket fails
      rememberUpgrade: true,
      // Force WebSocket first, but allow polling fallback
      tryAllTransports: true
    });

    // ENHANCED: Comprehensive connection management
    socket.on('connect', () => {
      console.log('✅ WebSocket connected - Real-time updates active');
      console.log('🔌 WebSocket connection established successfully');
      console.log('📡 Ready to receive real-time messages');
      logInfo('WebSocket', 'Connected to server', { 
        url: wsUrl,
        timestamp: new Date().toISOString()
      });
      setConnectionStatus('connected');
      
      // FIXED: Fetch initial WhatsApp status on connection
      fetchInitialWhatsAppStatus();
      
      // Re-sync data after reconnection
      if (wasDisconnected) {
        console.log('🔄 Re-syncing data after reconnection...');
        logInfo('WebSocket', 'Re-syncing data after reconnection');
        fetchData();
        setWasDisconnected(false);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      logWarn('WebSocket', 'Disconnected from server', { reason });
      setConnectionStatus('disconnected');
      setWasDisconnected(true);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      logError('WebSocket', 'Connection error', { error: error.message });
      setConnectionStatus('error');
    });

    // FIXED: Listen for both 'message' and 'new_message' events (backend emits 'message')
    const handleIncomingMessage = (message) => {
      console.log('📨 NEW MESSAGE RECEIVED VIA WEBSOCKET:', message.id, 'from', message.sender_name);
      console.log('📨 Full message object:', message);
      
      // FIXED: Map socket message fields to frontend expected fields
      const enrichedMessage = {
        id: message.id || `temp_${Date.now()}_${Math.random()}`,
        sender_name: message.fromName || message.sender_name || 'Unknown Sender',
        group_name: message.chatName || message.group_name || 'Direct Message', 
        message: message.body || message.message || '[No Text]',
        received_at: message.timestamp || message.received_at || new Date().toISOString(),
        number: message.fromNumber || message.number || 'Unknown',
        has_media: message.hasMedia || message.has_media || false,
        media_type: message.mediaType || message.media_type || null,
        media_size: message.media_size || null,
        media_filename: message.media_filename || null,
        is_real_time: true,
        // Keep all original fields as well
        ...message
      };
      
      console.log('📨 Enriched message for display:', {
        id: enrichedMessage.id,
        sender: enrichedMessage.sender_name,
        message: enrichedMessage.message?.substring(0, 50)
      });
      
      // CRITICAL FIX: Force re-render by creating new array references
      setAllLogs(prev => {
        if (prev.some(msg => msg.id === enrichedMessage.id)) return prev;
        const newArray = [enrichedMessage, ...prev];
        console.log('📨 Updated allLogs:', newArray.length, 'messages');
        return newArray;
      });
      
      setLogs(prev => {
        if (prev.some(msg => msg.id === enrichedMessage.id)) return prev;
        const newArray = [enrichedMessage, ...prev];
        console.log('📨 Updated logs:', newArray.length, 'messages');
        return newArray;
      });
      
      // SIMPLE PAGINATION: No need to update infiniteScrollData anymore
      // Real-time messages are added to logs and will appear on page 1
      
      // Update count
      setTotalMessages(prev => prev + 1);
      
      // ENHANCED: Dispatch custom event for Header component
      window.dispatchEvent(new CustomEvent('websocket-message-received', {
        detail: { type: 'new_message', data: enrichedMessage }
      }));
      
      // Show notification
      setNotification({
        open: true,
        message: `📨 New message from ${enrichedMessage.sender_name || 'Unknown'}`,
        type: 'new_message',
        count: 1
      });
      
      // CRITICAL FIX: Force component re-render by updating a state variable
      setForceUpdate(prev => prev + 1);
      
      // CRITICAL FIX: Also trigger a direct state update to ensure re-render
      setTimeout(() => {
        console.log('📨 Forcing additional re-render after message addition');
        setForceUpdate(prev => prev + 1);
      }, 50);
    };

    // FIXED: Listen for both event types that backend might emit
    socket.on('message', handleIncomingMessage);
    socket.on('new_message', handleIncomingMessage);



    // Listen for AI analysis updates
    socket.on('message_ai_update', (update) => {
      console.log('🧠 AI analysis update received:', update);
      
      // Update the message with AI analysis
      setLogs(prev => prev.map(msg => 
        msg.id === update.id 
          ? { ...msg, ...update.ai_analysis }
          : msg
      ));
      
      setAllLogs(prev => prev.map(msg => 
        msg.id === update.id 
          ? { ...msg, ...update.ai_analysis }
          : msg
      ));
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 WebSocket reconnected after', attemptNumber, 'attempts');
      setConnectionStatus('connected');
      setWasDisconnected(false);
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 WebSocket reconnection attempt:', attemptNumber);
      setConnectionStatus('reconnecting');
    });

    // Add ping/pong for connection quality monitoring
    const pingInterval = setInterval(() => {
      if (socket.connected) {
        const start = Date.now();
        socket.emit('ping', start);
        socket.once('pong', (timestamp) => {
          const latency = Date.now() - timestamp;
          setConnectionLatency(latency);
        });
      }
    }, 10000);

    // REMOVED: Duplicate new_message handler - consolidated above for speed

    socket.on("flagged_message", (row) => {
      console.log('🚩 Received flagged message via WebSocket:', {
        id: row.id,
        sender: row.sender_name,
        flagType: row.flag_type
      });
      
      // CRITICAL FIX: Validate and provide fallback values for missing fields
      const validatedRow = {
        id: row.id || `temp_${Date.now()}_${Math.random()}`, // Ensure unique ID
        sender_name: row.sender_name || 'Unknown Sender',
        group_name: row.group_name || 'Direct Message',
        message: row.message || '[No Text]',
        received_at: row.received_at || new Date().toISOString(),
        number: row.number || 'Unknown',
        has_media: row.has_media || false,
        media_type: row.media_type || null,
        media_size: row.media_size || null,
        media_filename: row.media_filename || null,
        processing_status: row.processing_status || null,
        sentiment: row.sentiment || null,
        intent: row.intent || null,
        is_flagged: true, // Always true for flagged messages
        flag_type: row.flag_type || 'manual',
        flag_reason: row.flag_reason || 'Flagged via WebSocket',
        // Preserve any other fields that might exist
        ...row
      };
      
      console.log('✅ Validated flagged message with fallback values:', {
        id: validatedRow.id,
        sender: validatedRow.sender_name,
        message: validatedRow.message?.substring(0, 50)
      });
      
      // ENHANCED: Dispatch custom event for Header component
      window.dispatchEvent(new CustomEvent('websocket-message-received', {
        detail: { type: 'flagged_message', data: validatedRow }
      }));
      
      // CRITICAL FIX: Always add real-time flagged messages to UI, regardless of date filters
      console.log('✅ Adding real-time flagged message to UI (no filtering)');
      
      setAllFlags((prev) => {
        const exists = prev.some(msg => msg.id === validatedRow.id);
        if (exists) return prev;
        return [validatedRow, ...prev].slice(0, 500);
      });
      
      // Always add to current flags (real-time always active)
      setFlags((prev) => {
        const exists = prev.some(msg => msg.id === validatedRow.id);
        if (exists) return prev;
        return [validatedRow, ...prev].slice(0, ITEMS_PER_PAGE);
      });
      
      // SIMPLE PAGINATION: No infinite scroll data to update
      
      // Add visual notification for flagged messages
      setNotification({
        open: true,
        message: `🚩 Flagged message from ${validatedRow.sender_name}`,
        type: 'flagged',
        count: 1
      });
    });

      // FIXED: Function to fetch initial WhatsApp status via REST API
    const fetchInitialWhatsAppStatus = async () => {
      try {
        console.log('📱 Fetching initial WhatsApp status...');
        const response = await fetch(apiUrl('/api/whatsapp/status'));
        const statusData = await response.json();
        console.log('📱 Initial WhatsApp Status:', statusData);
        
        if (statusData.success) {
          // FIXED: Set correct status format for UI display
          setWaStatus(statusData.authenticated ? 'CONNECTED' : 'DISCONNECTED');
          
          // Update connection status based on WhatsApp status  
          if (statusData.authenticated) {
            setConnectionStatus('connected');
          } else {
            setConnectionStatus('disconnected');
          }
        }
      } catch (error) {
        console.error('❌ Error fetching initial WhatsApp status:', error);
        setWaStatus('error');
      }
    };

    // ENHANCED: Listen for WhatsApp status updates
    socket.on("whatsapp_status", (statusData) => {
      console.log('📱 WhatsApp Status Update:', statusData);
      
      // FIXED: Set correct status format for UI display
      setWaStatus(statusData.authenticated ? 'CONNECTED' : 'DISCONNECTED');
      
      // Update connection status based on WhatsApp status
      if (statusData.authenticated) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('disconnected');
      }
    });



    // ENHANCED: Listen for contextual AI analysis updates (background processing)
    socket.on("message_ai_update", (updateData) => {
      try {
        console.log('�� AI Analysis Update:', updateData?.id);
        
        // CRITICAL: Add null checks and error handling
        if (!updateData?.id || !updateData?.ai_analysis) {
          console.warn('⚠️ Invalid AI update data:', updateData);
          return;
        }

        console.log('🧠 Received contextual AI analysis update via WebSocket:', {
          id: updateData.id,
          ai_category: updateData.ai_analysis.ai_category,
          is_flagged: updateData.ai_analysis.is_flagged,
          urgency_level: updateData.ai_analysis.urgency_level,
          contextual_risk: updateData.ai_analysis.contextual_risk,
          confidence: updateData.ai_analysis.ai_confidence
        });
        
        // Update message with enhanced contextual AI analysis without component refresh
        const updateMessageWithAI = (prev) => prev.map(msg => 
          msg.id === updateData.id 
            ? {
                ...msg,
                // Legacy AI fields (sentiment/intent) with null checks
                sentiment: updateData.ai_analysis.sentiment || msg.sentiment,
                intent: updateData.ai_analysis.intent || msg.intent,
                entities: updateData.ai_analysis.entities || msg.entities,
                flag_reason: updateData.ai_analysis.ai_flag_reason || updateData.ai_analysis.flag_reason || msg.flag_reason,
                flag_type: updateData.ai_analysis.ai_category || updateData.ai_analysis.flag_type || msg.flag_type,
                confidence: updateData.ai_analysis.ai_confidence || updateData.ai_analysis.confidence || msg.confidence,
                is_flagged: updateData.ai_analysis.is_flagged !== undefined ? updateData.ai_analysis.is_flagged : msg.is_flagged,
                // NEW: Enhanced contextual AI fields with null checks
                ai_category: updateData.ai_analysis.ai_category || msg.ai_category,
                ai_flag_reason: updateData.ai_analysis.ai_flag_reason || msg.ai_flag_reason,
                ai_confidence: updateData.ai_analysis.ai_confidence || msg.ai_confidence,
                escalation_factors: updateData.ai_analysis.escalation_factors || msg.escalation_factors,
                instruction_type: updateData.ai_analysis.instruction_type || msg.instruction_type,
                urgency_level: updateData.ai_analysis.urgency_level || msg.urgency_level,
                contextual_risk: updateData.ai_analysis.contextual_risk || msg.contextual_risk,
                repetition_count: updateData.ai_analysis.repetition_count || msg.repetition_count,
                recommended_action: updateData.ai_analysis.recommended_action || msg.recommended_action,
                contextual_assessment: updateData.ai_analysis.contextual_assessment || msg.contextual_assessment,
                ai_source: updateData.ai_analysis.ai_source || msg.ai_source,
                // Mark as AI processed with timestamp
                ai_processed: true,
                ai_processed_at: new Date().toISOString()
              }
            : msg
        );
        
        // Update all message states atomically
        setAllLogs(updateMessageWithAI);
        setLogs(updateMessageWithAI);
        
        // SIMPLE PAGINATION: No infinite scroll data to update

        // Decrease pending AI count
        setPendingAICount(prev => Math.max(0, prev - 1));
        
        // Show contextual AI analysis notification for flagged messages
        if (updateData.ai_analysis.is_flagged) {
          setNotification({
            open: true,
            message: `🤖 AI flagged message: ${updateData.ai_analysis.ai_category || updateData.ai_analysis.flag_type}`,
            type: 'ai_flagged',
            count: 1
          });
        }
        
      } catch (error) {
        console.error('❌ AI update error:', error);
        // Don't let AI errors crash real-time system
        setPendingAICount(prev => Math.max(0, prev - 1));
      }
    });

    // ENHANCED: Listen for media processing completion updates
    socket.on("media_updated", (mediaData) => {
      console.log('📸 Received media update via WebSocket:', {
        id: mediaData.id,
        filename: mediaData.media_filename,
        size: mediaData.media_size,
        type: mediaData.media_type
      });
      
      // Update all message states with the new media metadata
      const updateMessage = (prev) => prev.map(msg => 
        msg.id === mediaData.id 
          ? {
              ...msg,
              media_filename: mediaData.media_filename,
              media_size: mediaData.media_size,
              media_mime_type: mediaData.media_mime_type,
              processing_status: mediaData.processing_status
            }
          : msg
      );
      
      setAllLogs(updateMessage);
      setLogs(updateMessage);
      setAllFlags(updateMessage);
      setFlags(updateMessage);
      
      // SIMPLE PAGINATION: No infinite scroll data to update
      
      // Show notification that media is ready
      setNotification({
        open: true,
        message: `📸 Media ready for message from ${mediaData.sender_name}`,
        type: 'media_ready',
        count: 1
      });
    });

    // ENHANCED: Listen for message ACK updates (delivery tracking)
    socket.on("message_ack_update", (ackData) => {
      console.log('📨 Received message ACK update:', {
        message_id: ackData.message_id,
        ack_level: ackData.ack_level,
        delivery_status: ackData.delivery_status
      });
      
      // Update message with delivery status
      const updateMessageWithAck = (prev) => prev.map(msg => 
        msg.id === ackData.message_id 
          ? {
              ...msg,
              delivery_status: ackData.delivery_status,
              ack_level: ackData.ack_level,
              last_ack_timestamp: ackData.timestamp
            }
          : msg
      );
      
      setAllLogs(updateMessageWithAck);
      setLogs(updateMessageWithAck);
      
      // Show delivery confirmation for read receipts
      if (ackData.ack_level >= 2) {
        setNotification({
          open: true,
          message: `✅ Message read by ${ackData.sender}`,
          type: 'delivery_read',
          count: 1
        });
      }
    });

    // ENHANCED: Listen for message revocation updates
    socket.on("message_revoked", (revocationData) => {
      console.log('🗑️ Received message revocation:', {
        message_id: revocationData.message_id,
        sender: revocationData.sender
      });
      
      // Update message to show it was deleted
      const updateMessageWithRevocation = (prev) => prev.map(msg => 
        msg.id === revocationData.message_id 
          ? {
              ...msg,
              is_revoked: true,
              revoked_at: revocationData.revoked_at,
              message: '[This message was deleted]'
            }
          : msg
      );
      
      setAllLogs(updateMessageWithRevocation);
      setLogs(updateMessageWithRevocation);
      setAllFlags(updateMessageWithRevocation);
      setFlags(updateMessageWithRevocation);
      
      // SIMPLE PAGINATION: No infinite scroll data to update
      
      // Show notification that message was deleted
      setNotification({
        open: true,
        message: `🗑️ Message deleted by ${revocationData.sender}`,
        type: 'message_deleted',
        count: 1
      });
    });

    // ENHANCED: Expose socket for monitoring in Header component
    window.WebSocketMonitor = { socket };

    return () => {
      console.log('🔌 Disconnecting WebSocket...');
      clearInterval(pingInterval);
      window.WebSocketMonitor = null;
      socket.disconnect();
    };
  }, []); // CRITICAL FIX: Only run once on mount - no dependencies to prevent re-runs

  // CRITICAL FIX: Monitor modal state changes
  useEffect(() => {
    console.log('🔍 Modal state changed - messageDetailOpen:', messageDetailOpen);
    console.log('🔍 Modal state changed - selectedMessage:', selectedMessage?.id);
  }, [messageDetailOpen, selectedMessage]);
  
  // CRITICAL FIX: Force cache refresh on app load
  useEffect(() => {
    console.log('🔄 App loaded - forcing cache refresh - VERSION: 2025-07-23-14-20');
    // Force browser to reload fresh content
    if (window.performance && window.performance.navigation.type === 1) {
      console.log('🔄 Hard refresh detected - clearing any cached data');
    }
  }, []);

  // Apply filters manually (only when user triggers)
  const applyFilters = useCallback(() => {
    if (!groupFilter && !senderFilter && !search) {
      setActiveFilters(false);
      setLogs(allLogs);
      return;
    }
    
    setActiveFilters(true);
    const filtered = allLogs.filter(msg => {
      if (groupFilter && msg.group_name !== groupFilter) return false;
      if (senderFilter && msg.sender_name !== senderFilter) return false;
      if (search && !msg.message?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    
    console.log(`🔍 Applied filters: ${filtered.length}/${allLogs.length} messages`);
    setLogs(filtered);
  }, [groupFilter, senderFilter, search, allLogs]);

  // Simple data fetching with offset+limit pagination (LEGACY - kept for compatibility)
  const fetchData = useCallback(async (loadMore = false, customOffset = null) => {
    logInfo('API', 'Fetching data', {
      loadMore,
      customOffset,
      currentTab,
      groupFilter,
      senderFilter,
      search
    });
    
    if (loadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    
    try {
      let endpoint = currentTab === "logs" ? "/api/messages" : "/api/flagged-messages";
      let params = [];
      
      // Add pagination parameters
      // 🔥 FIX: Use correct array length for offset calculation based on current tab
      const currentArrayLength = currentTab === "logs" ? allLogs.length : allFlags.length;
      const offset = customOffset !== null ? customOffset : (loadMore ? currentArrayLength : 0);
      params.push(`offset=${offset}`);
      params.push(`limit=${ITEMS_PER_PAGE}`);
      
      // Add filter parameters only if they exist
      if (groupFilter) params.push(`group=${encodeURIComponent(groupFilter)}`);
      if (senderFilter) params.push(`sender=${encodeURIComponent(senderFilter)}`);
      if (search) params.push(`q=${encodeURIComponent(search)}`);
      
      if (params.length) endpoint += "?" + params.join("&");
      
      const res = await fetch(apiUrl(endpoint));
      const data = await res.json();
      
      if (currentTab === "logs") {
        // For all messages, check which ones are flagged
        const flaggedRes = await fetch(apiUrl('/api/flags'));
        const flaggedData = await flaggedRes.json();
        
        // Create a map of flagged messages by message content and sender
        const flaggedMap = new Map();
        (flaggedData.messages || flaggedData).forEach(flag => {
          const key = `${flag.message}_${flag.sender_name}_${flag.group_name || ''}`;
          flaggedMap.set(key, flag);
        });
        
        // Add flagged status to all messages
        const enrichedData = (data.messages || data).map(msg => {
          const key = `${msg.message}_${msg.sender_name}_${msg.group_name || ''}`;
          const flaggedInfo = flaggedMap.get(key);
          return {
            ...msg,
            is_flagged: !!flaggedInfo,
            flag_type: flaggedInfo?.flag_type || null,
            flag_reason: flaggedInfo?.flag_reason || null
          };
        });
        
        // Set total count
        setTotalMessages(data.total || enrichedData.length);
        
        if (loadMore) {
          // Append new data to existing
          setAllLogs(prev => [...prev, ...enrichedData]);
          setLogs(prev => [...prev, ...enrichedData]);
        } else {
          // Initial load or filter change
          setAllLogs(enrichedData);
          setLogs(enrichedData);
        }
      } else {
        const enrichedFlags = data.messages || data;
        setTotalMessages(data.total || enrichedFlags.length);
        
        if (loadMore) {
          setAllFlags(prev => [...prev, ...enrichedFlags]);
          setFlags(prev => [...prev, ...enrichedFlags]);
        } else {
          setAllFlags(enrichedFlags);
          setFlags(enrichedFlags);
          }
      }
    } catch (error) {
      setAlert("Error loading data!");
      console.error('Error fetching data:', error);
      logError('API', 'Error fetching data', { 
        error: error.message,
        loadMore,
        customOffset,
        currentTab
      });
    }
    
    if (loadMore) {
      setLoadingMore(false);
    } else {
      setLoading(false);
    }
  }, [currentTab, groupFilter, senderFilter, search]);

  // SIMPLE PAGINATION: No infinite scroll needed
  // SIMPLE PAGINATION: No infinite scroll needed

  // REMOVED: Blocking initial data load - now purely WebSocket-driven for faster page load
  // OLD CODE: useEffect(() => { fetchData(); }, []); 
  // NEW: Dashboard loads instantly, shows messages via WebSocket only
  
  // ENHANCED: WebSocket-only initial load with fallback
  useEffect(() => { 
    console.log('🚀 Dashboard initializing - WebSocket-first approach (no blocking API calls)');
    
    // Only load data if specifically requested or if WebSocket fails
    const hasUserRequested = sessionStorage.getItem('user_requested_data_load');
    
    if (hasUserRequested === 'true') {
      console.log('📊 User previously requested data load - fetching...');
    fetchData(); 
      sessionStorage.removeItem('user_requested_data_load');
    } else {
      console.log('⚡ Fast load: WebSocket-only mode - page loads instantly');
      console.log('💡 Users will see messages in real-time via WebSocket');
      console.log('🔄 To load history, user can click refresh or use pagination');
      
      // Show a helpful message to user
      setNotification({
        open: true,
        message: '⚡ Dashboard loaded instantly! Real-time messages will appear automatically. Click "Load History" to see past messages.',
        type: 'info',
        count: 1
      });
    }
  }, []); // Only run once on mount - no dependencies to prevent re-runs
  
  // CRITICAL FIX: Update totalMessages when filters change to reflect filtered count
  useEffect(() => {
    const allRows = currentTab === "logs" ? allLogs : allFlags;
    const filteredRows = allRows.filter(messageFilter);
    setTotalMessages(filteredRows.length);
  }, [currentTab, allLogs, allFlags, messageFilter]);

  // WhatsApp status
  const fetchWaStatus = useCallback(async () => {
    try {
      const res = await fetch('/status');
      const html = await res.text();
      // Updated regex to handle HTML tags (both <strong> and **) and different formats
      const match = html.match(/(?:<strong>)?(?:\*\*)?WhatsApp State(?:\*\*)?(?:<\/strong>)?:\s*([^<]+)/);
      if (match) {
        const status = match[1].trim();
        setWaStatus(status);
        
        // Log status for debugging
        console.log('WhatsApp Status Update:', status);
        
        // Update connection state based on status
        if (status === 'CONNECTED') {
          // Status is connected, ensure UI reflects this
        } else if (status === 'WAITING FOR QR SCAN') {
          // QR scan required
        } else if (status === 'INITIALIZING') {
          // Service starting up
        }
      } else {
        // If regex fails, try to find the status in a different way
        console.log('Regex failed, trying alternative parsing...');
        const statusMatch = html.match(/<p><strong>WhatsApp State:<\/strong>\s*([^<]+)<\/p>/);
        if (statusMatch) {
          const status = statusMatch[1].trim();
          setWaStatus(status);
          console.log('WhatsApp Status Update (alternative):', status);
        } else {
          console.log('Could not parse WhatsApp status from HTML:', html.substring(0, 500));
          setWaStatus('Unknown');
        }
      }
    } catch (error) {
      console.error('Error fetching WhatsApp status:', error);
      setWaStatus('Unknown');
    }
  }, []);

  useEffect(() => {
    fetchWaStatus();
    const interval = setInterval(fetchWaStatus, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [fetchWaStatus]);

  // Fetch keywords and analytics
  const fetchKeywords = useCallback(async () => {
    try {
      const [reviewRes, staticRes, analyticsRes] = await Promise.all([
        axios.get("/api/flag_keywords?status=pending"),
        axios.get("/api/static_flag_keywords"),
        axios.get("/api/keyword_analytics")
      ]);
      setKeywordReview(reviewRes.data);
      setStaticKeywords(staticRes.data);
      setKeywordAnalytics(analyticsRes.data);
    } catch (e) {
      console.error("Error fetching keywords:", e);
    }
  }, []);

  useEffect(() => { fetchKeywords(); }, [fetchKeywords]);

  const handleNavigation = (key) => {
    logInfo('Navigation', 'Navigating to view', { 
      from: currentView, 
      to: key 
    });
    navigate(`/${key}`);
    setCurrentView(key);
    if (key === "messages") {
      setCurrentTab("logs");
    } else if (key === "flagged") {
      setCurrentTab("flags");
    }
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleTabChange = (_, newTab) => {
    setCurrentTab(newTab);
    setPage(1); // Reset pagination when switching tabs
  };

  const handlePageChange = (_, newPage) => {
    setPage(newPage);
    // Update displayed rows for current page
    const startIndex = (newPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    if (currentTab === "logs") {
      setLogs(allLogs.slice(startIndex, endIndex));
    } else {
      setFlags(allFlags.slice(startIndex, endIndex));
    }
  };

  const handleKeywordAction = async (id, action) => {
    try {
      await axios.post(`/api/flag_keywords/${id}/${action}`);
      fetchKeywords();
    } catch (e) {
      setAlert(`Error ${action}ing keyword`);
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return BRAND_COLORS.green;
      case 'negative': return BRAND_COLORS.red;
      default: return BRAND_COLORS.mediumGray;
    }
  };

  const getIntentColor = (intent) => {
    switch (intent?.toLowerCase()) {
      case 'complaint': return BRAND_COLORS.red;
      case 'question': return BRAND_COLORS.mediumGray;
      case 'booking': return BRAND_COLORS.green;
      default: return BRAND_COLORS.mediumGray;
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "--";
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString("en-US", { 
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } else {
      return date.toLocaleDateString("en-US", { 
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  const closeSidebar = () => {
    if (isMobile || !sidebarOpen) return;
    setSidebarOpen(false);
  };

  // Interactive handlers
  const handleMessageClick = (message) => {
    // Validate message object
    if (!message || !message.id) {
      console.error('❌ Invalid message object:', message);
      return;
    }
    
    // Set selected message and open modal
    setSelectedMessage(message);
    setMessageDetailOpen(true);
  };

  // Media view handler
  const handleMediaView = (message) => {
    if (!message || (!message.media_url && !message.mediaUrl)) {
      console.error('❌ No media URL found:', message);
      return;
    }

    const mediaUrl = message.media_url || message.mediaUrl;
    const mediaType = message.media_type || message.mediaType || 'unknown';
    
    // Full URL with backend server
    const fullMediaUrl = mediaUrl.startsWith('http') 
      ? mediaUrl 
      : `http://localhost:3010${mediaUrl}`;

    setSelectedMedia({
      url: fullMediaUrl,
      type: mediaType,
      filename: message.media_filename || message.mediaFilename || 'Unknown',
      size: message.media_size || message.mediaSize || 0
    });
    setMediaViewerOpen(true);
  };

  const handleBadgeClick = (type, value) => {
    // Apply filter based on badge click
    if (type === 'sentiment') {
      // Filter by sentiment - this would need backend support
      setAlert(`Filtering by sentiment: ${value}`);
    } else if (type === 'intent') {
      // Filter by intent
      setAlert(`Filtering by intent: ${value}`);
    } else if (type === 'flag_type') {
      // Filter by flag type
      setAlert(`Filtering by flag type: ${value}`);
    }
    // Refresh data with new filters
    fetchData();
  };

  const handleAnalyticsClick = (title, metricType, value) => {
    setAnalyticsModal({
      open: true,
      title,
      metricType,
      value
    });
  };

  const handleConfirmAction = (action, data, options = {}) => {
    setConfirmationModal({
      open: true,
      action,
      data,
      ...options
    });
  };

  const executeAction = async () => {
    setActionLoading(true);
    try {
      const { action, data } = confirmationModal;
      
      switch (action) {
        case 'approve_keyword':
          await axios.post(`/api/flag_keywords/${data.id}/approve`);
          fetchKeywords();
          setAlert('Keyword approved successfully');
          break;
        case 'reject_keyword':
          await axios.post(`/api/flag_keywords/${data.id}/reject`);
          fetchKeywords();
          setAlert('Keyword rejected successfully');
          break;
        case 'delete_keyword':
          await axios.delete(`/api/static_flag_keywords/${data.id}`);
          fetchKeywords();
          setAlert('Keyword deleted successfully');
          break;
        case 'escalate_message':
          await axios.post(`/api/messages/${data.id}/escalate`, {
            escalationReason: 'Manual escalation via dashboard',
            priority: 'high'
          });
          fetchData();
          setAlert('🚨 Message escalated successfully! Management has been notified via WhatsApp and Slack.');
          break;
        default:
          setAlert('Unknown action');
      }
      
      setConfirmationModal({ open: false, action: null, data: null });
    } catch (error) {
      console.error('Action execution error:', error);
      setAlert(`Error executing action: ${error.response?.data?.error || error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFilterChange = (filterType, value) => {
    logInfo('Filter', 'Filter changed', { 
      filterType, 
      value,
      currentTab 
    });
    
    // Dynamic filter updates with immediate effect
    switch (filterType) {
      case 'group':
        setGroupFilter(value);
        break;
      case 'sender':
        setSenderFilter(value);
        break;
      case 'search':
        setSearch(value);
        break;
    }
    setPage(1); // Reset to first page
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleFilters = () => {
    setFiltersOpen(!filtersOpen);
  };

  const clearFilters = () => {
    setGroupFilter("");
    setSenderFilter("");
    setSearch("");
    setFiltersOpen(false);
  };

  const handleFlagMessage = async (message) => {
    try {
      await axios.post(`/api/messages/${message.id}/flag`);
      setAlert('Message flagged successfully');
      fetchData();
    } catch (error) {
      setAlert('Error flagging message');
    }
  };

  const handleUnflagMessage = async (message) => {
    try {
      await axios.post(`/api/messages/${message.id}/unflag`);
      setAlert('Message unflagged successfully');
      fetchData();
    } catch (error) {
      setAlert('Error unflagging message');
    }
  };

  const handleEscalateMessage = async (message) => {
    // Enhanced escalation workflow with multiple options
    const escalationOptions = {
      title: '🚨 Escalate Message to Management',
      message: `Are you sure you want to escalate this message? This will trigger immediate alerts to management and create a high-priority issue.`,
      confirmText: 'Escalate Now',
      severity: 'warning',
      details: `Message: "${message.message}" from ${message.sender_name || 'Unknown'} in ${message.group_name || 'Direct Message'}`,
      showUndo: false,
      additionalInfo: {
        escalationLevels: [
          { level: 'medium', description: 'Standard escalation - 4 hour response time' },
          { level: 'high', description: 'Urgent escalation - 2 hour response time' },
          { level: 'critical', description: 'Emergency escalation - 30 minute response time' }
        ],
        consequences: [
          '📱 WhatsApp alerts sent to management groups',
          '📧 Slack notifications to all stakeholders', 
          '🎯 Issue marked as high priority in system',
          '⏰ Response timer starts immediately',
          '📊 Escalation tracked in analytics dashboard'
        ]
      }
    };

    handleConfirmAction('escalate_message', message, escalationOptions);
  };

  // AI Analysis function
  const handleAnalyzeMessage = async (message) => {
    try {
      const response = await axios.post(apiUrl('/api/ai/analyze'), {
        message: message.message,
        sender_name: message.sender_name,
        group_name: message.group_name
      });
      
      if (response.data.success) {
        const analysis = response.data;
        console.log('🤖 AI Analysis result:', analysis);
        
        // Update the message with AI analysis results
        setLogs(prev => prev.map(msg => 
          msg.id === message.id 
            ? { 
                ...msg, 
                sentiment: analysis.sentiment?.sentiment || 'neutral',
                intent: analysis.intent?.intent || 'general',
                flag_type: analysis.flagging?.flagType || null,
                flag_reason: analysis.flagging?.flagReasons?.join(', ') || null
              }
            : msg
        ));
        
        setAllLogs(prev => prev.map(msg => 
          msg.id === message.id 
            ? { 
                ...msg, 
                sentiment: analysis.sentiment?.sentiment || 'neutral',
                intent: analysis.intent?.intent || 'general',
                flag_type: analysis.flagging?.flagType || null,
                flag_reason: analysis.flagging?.flagReasons?.join(', ') || null
              }
            : msg
        ));
        
        setAlert('✅ Message analyzed successfully!');
      }
    } catch (error) {
      console.error('❌ AI Analysis failed:', error);
      setAlert('❌ AI Analysis failed');
    }
  };

  const handleMessageAction = async (action, message) => {
    logInfo('MessageAction', 'Performing message action', { 
      action, 
      messageId: message.id,
      sender: message.sender_name 
    });
    
    try {
      switch (action) {
        case 'flag':
          await executeAction('flag_message', message);
          break;
        case 'escalate':
          await executeAction('escalate_message', message);
          break;
        case 'unflag':
          await executeAction('unflag_message', message);
          break;
      }
      setMessageDetailOpen(false);
      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Action failed:', error);
      logError('MessageAction', 'Action failed', { 
        action, 
        messageId: message.id,
        error: error.message 
      });
    }
  };

  // Auto-save memory function
  const savePageMemory = useCallback(async (previousView, newView) => {
    try {
      const sessionId = sessionStorage.getItem('dashboard_session_id') || 
                       `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      if (!sessionStorage.getItem('dashboard_session_id')) {
        sessionStorage.setItem('dashboard_session_id', sessionId);
      }

      const memoryData = {
        session_id: sessionId,
        page_data: {
          previous_page: previousView,
          current_page: newView,
          navigation_method: 'route_change',
          url_pathname: location.pathname,
          url_search: location.search,
          timestamp: new Date().toISOString(),
          dashboard_state: {
            sidebar_open: sidebarOpen,
            sidebar_collapsed: sidebarCollapsed,
            current_tab: currentTab,
            filters: {
              group: groupFilter,
              sender: senderFilter,
              search: search
            },
            pagination: {
              current_page: page,
              total_messages: allLogs.length,
              total_flags: allFlags.length
            }
          }
        },
        user_context: {
          whatsapp_status: waStatus,
          realtime_enabled: realtime,
          message_count: allLogs.length + allFlags.length,
          is_mobile: isMobile,
          loading_state: loading,
          browser_info: {
            user_agent: navigator.userAgent,
            viewport: {
              width: window.innerWidth,
              height: window.innerHeight
            },
            url: window.location.href
          }
        },
        memory_type: 'page_visit',
        description: `Page navigation from ${previousView || 'unknown'} to ${newView}`,
        auto_generated: true
      };

      const response = await fetch(apiUrl('/api/memory/save'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(memoryData)
      });

      if (response.ok) {
        console.log(`📝 Auto-saved memory for page transition: ${previousView} → ${newView}`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to save page memory:', error);
    }
  }, [sidebarOpen, sidebarCollapsed, currentTab, groupFilter, senderFilter, search, page, allLogs.length, allFlags.length, waStatus, realtime, isMobile, loading, location.pathname, location.search]);

  // Update currentView when route changes and auto-save memory
  useEffect(() => {
    const newView = getCurrentView();
    const previousView = currentView;
    setCurrentView(newView);
    
    // Set appropriate tab based on route
    if (newView === "messages") {
      setCurrentTab("logs");
    } else if (newView === "flagged") {
      setCurrentTab("flags");
    }

      // Auto-save memory when navigating to a new page (but not on initial load)
  if (previousView && previousView !== newView) {
    savePageMemory(previousView, newView);
  }

  // FIXED: Auto-load data for specific pages  
  if (newView === "flagged" && previousView !== newView) {
    console.log('📊 Navigated to flagged page - will load data when currentTab updates');
  }
}, [location.pathname, currentView, savePageMemory, fetchData]);

  // 🔥 FIX: Load flagged data when currentTab becomes "flags"
  useEffect(() => {
    if (currentTab === "flags" && currentView === "flagged") {
      console.log('📊 currentTab is now "flags" - loading flagged messages');
      fetchData();
    }
  }, [currentTab, currentView, fetchData]);

  // REMOVED: Blocking initial data load - now purely WebSocket-driven for faster page load
  // OLD CODE: useEffect(() => { fetchData(); }, []); 
  // NEW: Dashboard loads instantly, shows messages via WebSocket only
  
  // ENHANCED: WebSocket-only initial load with fallback
  useEffect(() => { 
    console.log('🚀 Dashboard initializing - WebSocket-first approach (no blocking API calls)');
    
    // Only load data if specifically requested or if WebSocket fails
    const hasUserRequested = sessionStorage.getItem('user_requested_data_load');
    
    if (hasUserRequested === 'true') {
      console.log('📊 User previously requested data load - fetching...');
      fetchData();
      sessionStorage.removeItem('user_requested_data_load');
    } else {
      console.log('⚡ Fast load: WebSocket-only mode - page loads instantly');
      console.log('💡 Users will see messages in real-time via WebSocket');
      console.log('🔄 To load history, user can click refresh or use pagination');
      
      // Show a helpful message to user
      setNotification({
        open: true,
        message: '⚡ Dashboard loaded instantly! Real-time messages will appear automatically. Click "Load History" to see past messages.',
        type: 'info',
        count: 1
      });
    }
  }, []); // Only run once on mount - no dependencies to prevent re-runs
  
  // CRITICAL FIX: Update totalMessages when filters change to reflect filtered count
  useEffect(() => {
    const allRows = currentTab === "logs" ? allLogs : allFlags;
    const filteredRows = allRows.filter(messageFilter);
    setTotalMessages(filteredRows.length);
  }, [currentTab, allLogs, allFlags, messageFilter]);

  return (
    <UserInteractionLogger>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Collapsible Sidebar */}
        <Sidebar
          open={sidebarOpen}
          collapsed={sidebarCollapsed}
          onClose={() => setSidebarOpen(false)}
          onToggleCollapse={toggleSidebarCollapse}
          navItems={NAV_ITEMS}
          currentView={currentView}
          onNavigation={handleNavigation}
          isMobile={isMobile}
        />

        {/* Top Header */}
        <Header
          sidebarOpen={sidebarOpen}
          onSidebarToggle={toggleSidebar}
          currentView={currentView}
          navItems={NAV_ITEMS}
          waStatus={waStatus}
          realtime={realtime}
          onRealtimeToggle={setRealtime}
          messageCount={allLogs.length + allFlags.length}
          isMobile={isMobile}
          isLoading={loading}
        />

        {/* Main Content with Routes */}
        <Box
          sx={{
            flex: 1,
            minHeight: '100vh',
            ml: getMainContentMargin(),
            transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            background: BRAND_COLORS.lightGray,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            width: `calc(100vw - ${getMainContentMargin()}px)`
          }}
        >
          <Routes>
            <Route path="/" element={<MessagesView />} />
            <Route path="/messages" element={<MessagesView />} />
            <Route path="/flagged" element={<FlaggedView />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/ai_dashboard" element={<AIDashboardPage />} />
            <Route path="/ai_intelligence" element={<AIIntelligencePage />} />
            <Route path="/ai_labeling" element={<ManualLabelingPage />} />
            {/* Auto-Healer route removed */}
            <Route path="/slack" element={<SlackIntegrationPage />} />
            <Route path="/digest" element={<DigestPage />} />
            <Route path="/keyword_analytics" element={<KeywordAnalyticsPage />} />
            <Route path="/flag_keywords" element={<FlagKeywordsPage />} />
            <Route path="/keyword_review" element={<KeywordReviewPage />} />
            <Route path="/issue_management" element={<IssueCategoriesPage />} />
            <Route path="/interaction_logs" element={<UserInteractionLogsPage />} />
            <Route path="/log-viewer" element={<LogViewerPage />} />
            <Route path="/health_monitor" element={<DashboardHealthMonitor />} />
            <Route path="/dashboard" element={<DashboardView />} />
            <Route path="/status" element={<StatusView />} />
            <Route path="/qr" element={<QRView />} />
            <Route path="/about" element={<AboutView />} />
            <Route path="/whatsapp_routing" element={<WhatsAppRoutingPageV2 />} />
            <Route path="/whatsapp_groups_v2" element={<WhatsAppGroupsV2 />} />
            <Route path="/dialog_test_v3" element={<DialogTestV3 />} />
            <Route path="/ai_confidence" element={<AIConfidenceManagement />} />
            <Route path="/dynamic_categories" element={<DynamicCategoriesPage />} />
            <Route path="/endpoints" element={<EndpointsPage />} />
                      <Route path="/comprehensive_analytics" element={<ComprehensiveAnalyticsDashboard />} />
            
            {/* NEW: Advanced Categorization & Routing Routes */}
            <Route path="/advanced_categorization" element={<AdvancedCategorizationPage />} />
            <Route path="/escalation_monitoring" element={<EscalationMonitoringPage />} />
            <Route path="/department_performance" element={<DepartmentPerformanceDashboard />} />
            <Route path="/contextual_analysis" element={<ContextualAnalysisViewer />} />
</Routes>
        </Box>

        {/* Filters Panel */}
        <FiltersPanel
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          groupFilter={groupFilter}
          senderFilter={senderFilter}
          search={search}
          onGroupFilterChange={setGroupFilter}
          onSenderFilterChange={setSenderFilter}
          onSearchChange={setSearch}
          onClearFilters={() => {
            setGroupFilter("");
            setSenderFilter("");
            setSearch("");
            setCategoryFilter(""); // NEW: Clear category filter too
            setFiltersOpen(false);
          }}
          allGroups={[...new Set(allLogs.concat(allFlags).map(msg => msg.group_name).filter(Boolean))]}
          allSenders={[...new Set(allLogs.concat(allFlags).map(msg => msg.sender_name).filter(Boolean))]}
          loading={loading}
        />

        {/* Notification Toast */}
        <NotificationToast
          open={notification.open}
          onClose={() => setNotification({ ...notification, open: false })}
          message={notification.message}
          type={notification.type}
          count={notification.count}
          severity="info"
        />

        {/* Professional Message Detail Modal */}
        {messageDetailOpen && (
          <Box sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backdropFilter: 'blur(4px)'
          }}>
            <Box sx={{
              backgroundColor: 'white',
              borderRadius: 3,
              maxWidth: '90vw',
              maxHeight: '90vh',
              minWidth: { xs: '90vw', sm: '600px', md: '800px' },
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Header */}
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #FF6B35 0%, #D10010 100%)',
                color: 'white',
                p: 3
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <MessageIcon sx={{ fontSize: 28 }} />
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    Message Details
                  </Typography>
                </Box>
                <IconButton 
                  onClick={() => setMessageDetailOpen(false)}
                  sx={{ color: 'white' }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
              
              {/* Content */}
              <Box sx={{ p: 3, overflow: 'auto', flex: 1 }}>
                <Grid container spacing={3}>
                  {/* Basic Info */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ mb: 2, color: '#FF6B35' }}>
                      📋 Message Information
                    </Typography>
                    <Box sx={{ space: 2 }}>
                      <Typography sx={{ mb: 1 }}>
                        <strong>ID:</strong> {selectedMessage?.id || 'N/A'}
                      </Typography>
                      <Typography sx={{ mb: 1 }}>
                        <strong>Sender:</strong> {selectedMessage?.sender_name || selectedMessage?.fromName || 'Unknown'}
                      </Typography>
                      <Typography sx={{ mb: 1 }}>
                        <strong>Group:</strong> {selectedMessage?.group_name || selectedMessage?.chatName || 'Private'}
                      </Typography>
                      <Typography sx={{ mb: 1 }}>
                        <strong>Time:</strong> {selectedMessage?.received_at ? new Date(selectedMessage.received_at).toLocaleString() : 'Unknown'}
                      </Typography>
                      <Typography sx={{ mb: 1 }}>
                        <strong>Phone:</strong> {selectedMessage?.number || selectedMessage?.fromNumber || 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  {/* Media Info */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ mb: 2, color: '#FF6B35' }}>
                      📎 Media & Flags
                    </Typography>
                    <Box sx={{ space: 2 }}>
                      <Typography sx={{ mb: 1 }}>
                        <strong>Has Media:</strong> {selectedMessage?.has_media || selectedMessage?.hasMedia ? '✅ Yes' : '❌ No'}
                      </Typography>
                      {(selectedMessage?.has_media || selectedMessage?.hasMedia) && (
                        <>
                          <Typography sx={{ mb: 1 }}>
                            <strong>Media Type:</strong> {selectedMessage?.media_type || selectedMessage?.mediaType || 'Unknown'}
                          </Typography>
                          <Typography sx={{ mb: 1 }}>
                            <strong>File Size:</strong> {selectedMessage?.media_size || selectedMessage?.mediaSize ? `${selectedMessage.media_size || selectedMessage.mediaSize} bytes` : 'Unknown'}
                          </Typography>
                          {/* Media Preview/View Button */}
                          <Box sx={{ mt: 2 }}>
                            <Button
                              variant="contained"
                              startIcon={<ImageIcon />}
                              onClick={() => handleMediaView(selectedMessage)}
                              sx={{
                                backgroundColor: '#FF6B35',
                                '&:hover': { backgroundColor: '#D10010' },
                                mb: 1
                              }}
                            >
                              View {selectedMessage?.media_type || 'Media'}
                            </Button>
                            <br />
                            <Typography variant="caption" color="textSecondary">
                              URL: {selectedMessage?.media_url || selectedMessage?.mediaUrl || 'Not available'}
                            </Typography>
                          </Box>
                        </>
                      )}
                      <Typography sx={{ mb: 1 }}>
                        <strong>AI Sentiment:</strong> {selectedMessage?.ai_sentiment || 'Not analyzed'}
                      </Typography>
                      <Typography sx={{ mb: 1 }}>
                        <strong>AI Intent:</strong> {selectedMessage?.ai_intent || 'Not classified'}
                      </Typography>
                      <Typography sx={{ mb: 1 }}>
                        <strong>Flagged:</strong> {selectedMessage?.flagged ? '🚨 Yes' : '✅ No'}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  {/* Message Content */}
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mb: 2, color: '#FF6B35' }}>
                      💬 Message Content
                    </Typography>
                    <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {selectedMessage?.message || selectedMessage?.body || 'No content available'}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
              
              {/* Footer Actions */}
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 3,
                backgroundColor: '#f8f9fa',
                borderTop: '1px solid #e0e0e0'
              }}>
                <Box>
                  <Chip 
                    label={selectedMessage?.ai_sentiment || 'neutral'} 
                    color={selectedMessage?.ai_sentiment === 'positive' ? 'success' : selectedMessage?.ai_sentiment === 'negative' ? 'error' : 'default'}
                    sx={{ mr: 1 }}
                  />
                  <Chip 
                    label={selectedMessage?.ai_intent || 'general'} 
                    variant="outlined"
                    sx={{ mr: 1 }}
                  />
                  {selectedMessage?.flagged && (
                    <Chip label="Flagged" color="error" />
                  )}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {selectedMessage?.flagged ? (
                    <Button 
                      variant="outlined" 
                      color="success"
                      onClick={() => handleMessageAction('unflag', selectedMessage)}
                    >
                      Unflag
                    </Button>
                  ) : (
                    <Button 
                      variant="outlined" 
                      color="warning"
                      onClick={() => handleMessageAction('flag', selectedMessage)}
                    >
                      Flag
                    </Button>
                  )}
                  <Button 
                    variant="outlined" 
                    color="info"
                    onClick={() => handleMessageAction('escalate', selectedMessage)}
                  >
                    Escalate
                  </Button>
                  <Button 
                    variant="contained" 
                    onClick={() => setMessageDetailOpen(false)}
                    sx={{ 
                      backgroundColor: '#FF6B35',
                      '&:hover': { backgroundColor: '#D10010' }
                    }}
                  >
                    Close
                  </Button>
                </Box>
              </Box>
            </Box>
          </Box>
        )}


        <ConfirmationModal
          open={confirmationModal.open}
          onClose={() => setConfirmationModal({ open: false, action: null, data: null })}
          onConfirm={executeAction}
          title={confirmationModal.title || 'Confirm Action'}
          message={confirmationModal.message || 'Are you sure you want to proceed?'}
          confirmText={confirmationModal.confirmText || 'Confirm'}
          cancelText={confirmationModal.cancelText || 'Cancel'}
          severity={confirmationModal.severity || 'info'}
          loading={actionLoading}
          details={confirmationModal.details}
          showUndo={confirmationModal.showUndo}
        />

        <AnalyticsModal
          open={analyticsModal.open}
          onClose={() => setAnalyticsModal({ open: false, title: '', metricType: '', value: 0 })}
          title={analyticsModal.title}
          metricType={analyticsModal.metricType}
          initialValue={analyticsModal.value}
          onMessageClick={handleMessageClick}
          loading={loading}
        />

        {/* Media Viewer Modal */}
        {mediaViewerOpen && selectedMedia && (
          <Box sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 10000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backdropFilter: 'blur(4px)'
          }}>
            <Box sx={{
              maxWidth: '95vw',
              maxHeight: '95vh',
              p: 2,
              position: 'relative',
              backgroundColor: 'black',
              borderRadius: 2,
              overflow: 'hidden'
            }}>
              {/* Close Button */}
              <IconButton
                onClick={() => setMediaViewerOpen(false)}
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  zIndex: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.9)'
                  }
                }}
              >
                <CloseIcon />
              </IconButton>

              {/* Media Content */}
              {selectedMedia.type?.toLowerCase() === 'image' ? (
                <Box sx={{ textAlign: 'center' }}>
                  <img 
                    src={selectedMedia.url} 
                    alt="Media content" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '85vh', 
                      objectFit: 'contain',
                      borderRadius: '8px'
                    }} 
                    onError={(e) => {
                      console.error('Image failed to load:', selectedMedia.url);
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <Box sx={{ display: 'none', color: 'white', p: 4 }}>
                    <Typography variant="h6">Failed to load image</Typography>
                    <Typography variant="body2">{selectedMedia.url}</Typography>
                  </Box>
                </Box>
              ) : selectedMedia.type?.toLowerCase() === 'video' ? (
                <Box sx={{ textAlign: 'center' }}>
                  <video 
                    controls 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '85vh',
                      borderRadius: '8px'
                    }}
                  >
                    <source src={selectedMedia.url} type="video/mp4" />
                    <source src={selectedMedia.url} type="video/webm" />
                    Your browser does not support the video tag.
                  </video>
                </Box>
              ) : selectedMedia.type?.toLowerCase() === 'audio' ? (
                <Box sx={{ textAlign: 'center', p: 4, color: 'white' }}>
                  <AudioFileIcon sx={{ fontSize: 64, mb: 2 }} />
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    {selectedMedia.filename}
                  </Typography>
                  <audio 
                    controls 
                    style={{ width: '100%', maxWidth: '400px' }}
                  >
                    <source src={selectedMedia.url} type="audio/mpeg" />
                    <source src={selectedMedia.url} type="audio/wav" />
                    Your browser does not support the audio tag.
                  </audio>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', p: 4, color: 'white' }}>
                  <DescriptionIcon sx={{ fontSize: 64, mb: 2 }} />
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    {selectedMedia.filename}
                  </Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<DownloadIcon />}
                    onClick={() => window.open(selectedMedia.url, '_blank')}
                    sx={{ 
                      backgroundColor: '#FF6B35',
                      '&:hover': { backgroundColor: '#D10010' }
                    }}
                  >
                    Download File
                  </Button>
                </Box>
              )}

              {/* Media Info */}
              <Box sx={{
                position: 'absolute',
                bottom: 16,
                left: 16,
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'white',
                p: 2,
                borderRadius: 1
              }}>
                <Typography variant="caption" display="block">
                  {selectedMedia.filename}
                </Typography>
                <Typography variant="caption" display="block">
                  Type: {selectedMedia.type} | Size: {Math.round(selectedMedia.size / 1024)}KB
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* Real-time Status Indicator */}
        <Box sx={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 1500,
          backgroundColor: connectionStatus === 'connected' ? '#10B981' : 
                          connectionStatus === 'reconnecting' ? '#F59E0B' : '#EF4444',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          transition: 'all 0.3s ease'
        }}>
          <Box sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: 'white',
            animation: connectionStatus === 'connected' 
              ? 'pulse 2s infinite' 
              : connectionStatus === 'reconnecting'
              ? 'bounce 1.5s infinite'
              : 'none'
          }} />
          {connectionStatus === 'connected' ? 'Live' : 
           connectionStatus === 'reconnecting' ? 'Reconnecting...' : 
           connectionStatus === 'error' ? 'Error' : 'Disconnected'}
          {connectionStatus === 'connected' && connectionLatency > 0 && (
            <Typography sx={{ fontSize: '10px', opacity: 0.8 }}>
              {connectionLatency}ms
            </Typography>
          )}
          {pendingAICount > 0 && (
            <Chip 
              label={`🧠 ${pendingAICount}`}
              size="small"
              sx={{ 
                ml: 1, 
                backgroundColor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                fontSize: '10px',
                height: '20px'
              }}
            />
          )}
        </Box>

        {/* Alerts */}
        <Snackbar
          open={!!alert}
          autoHideDuration={3500}
          onClose={() => setAlert("")}
          message={alert}
        />
        
        {/* Live Console for Development */}
        <LiveConsole />
      </Box>
    </ThemeProvider>
    </UserInteractionLogger>
  );

  // Component definitions for each route
  function MessagesView() {
    console.log('🔍 MessagesView function called');
    
    const [currentPage, setCurrentPage] = useState(1);
    
    // CRITICAL FIX: Force re-render when forceUpdate changes
    useEffect(() => {
      console.log('🔄 MessagesView re-rendering due to forceUpdate:', forceUpdate);
    }, [forceUpdate]);
    
    // CRITICAL FIX: Reset to page 1 when new messages arrive
    useEffect(() => {
      if (logs.length > 0 && currentPage !== 1) {
        console.log('🔄 New messages detected, resetting to page 1');
        setCurrentPage(1);
      }
    }, [logs.length, currentPage]);
    
    // SIMPLE PAGINATION: Use logs directly with pagination
    const ITEMS_PER_PAGE = 200;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    
    // Get current page data from logs
    let displayData = logs.slice(startIndex, endIndex);
    let totalDisplayed = displayData.length;
    let totalPages = Math.ceil(logs.length / ITEMS_PER_PAGE);
    
    // Fallback to allLogs if logs is empty
    if (displayData.length === 0 && allLogs.length > 0) {
      console.log('🔄 Fallback: Using allLogs instead of empty logs');
      displayData = allLogs.slice(startIndex, endIndex);
      totalDisplayed = displayData.length;
      totalPages = Math.ceil(allLogs.length / ITEMS_PER_PAGE);
    }
    
    // DEBUG: Log the data being rendered
    console.log(`🔍 MessagesView render (forceUpdate: ${forceUpdate}):`, {
      displayDataLength: displayData.length,
      totalDisplayed,
      totalMessages: logs.length,
      currentPage: page,
      totalPages,
      logsLength: logs.length,
      allLogsLength: allLogs.length,
      currentTab,
      displayDataFirstItem: displayData[0] ? { id: displayData[0].id, sender: displayData[0].sender_name, message: displayData[0].message?.substring(0, 50), isRealTime: displayData[0].is_real_time, timestamp: displayData[0].received_at } : null,
      displayDataLastItem: displayData[displayData.length - 1] ? { id: displayData[displayData.length - 1].id, sender: displayData[displayData.length - 1].sender_name, message: displayData[displayData.length - 1].message?.substring(0, 50), isRealTime: displayData[displayData.length - 1].is_real_time, timestamp: displayData[displayData.length - 1].received_at } : null
    });
    

    
    // Real-time is always active - no date restrictions
    const isRealTimeActive = realtime;
    
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header with filters */}
        <Box sx={{ 
          p: 3, 
          backgroundColor: BRAND_COLORS.white, 
          borderBottom: `1px solid ${BRAND_COLORS.border}`,
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: BRAND_COLORS.darkGray }}>
                All Messages
              </Typography>
              <Typography variant="body2" sx={{ color: BRAND_COLORS.mediumGray, mt: 0.5 }}>
                Showing {totalDisplayed} of {logs.length} messages (Page {currentPage} of {totalPages})
                {displayData.some(msg => msg.is_real_time) && (
                  <span style={{ color: BRAND_COLORS.green, fontWeight: 'bold', marginLeft: '8px' }}>
                    • Live Messages Active
                  </span>
                )}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {/* Pagination Controls */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                  variant="outlined"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  sx={{ color: BRAND_COLORS.darkGray, borderColor: BRAND_COLORS.border, minWidth: '80px' }}
                >
                  Previous
                </Button>
                <Typography variant="body2" sx={{ color: BRAND_COLORS.mediumGray, px: 2 }}>
                  {currentPage} / {totalPages}
                </Typography>
                <Button
                  variant="outlined"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  sx={{ color: BRAND_COLORS.darkGray, borderColor: BRAND_COLORS.border, minWidth: '80px' }}
                >
                  Next
                </Button>
              </Box>
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={toggleFilters}
                sx={{ color: BRAND_COLORS.darkGray, borderColor: BRAND_COLORS.border }}
              >
                Filters
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => {
                  console.log('📊 User requested data load - setting preference');
                  sessionStorage.setItem('user_requested_data_load', 'true');
                  fetchData();
                }}
                disabled={loading}
                sx={{ color: BRAND_COLORS.darkGray, borderColor: BRAND_COLORS.border }}
              >
                Load History
              </Button>
            </Box>
          </Box>

          {/* Real-time Status Indicator */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, backgroundColor: BRAND_COLORS.green, borderRadius: 1 }}>
              {isRealTimeActive && (
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: BRAND_COLORS.white,
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                      '0%': { opacity: 1 },
                      '50%': { opacity: 0.5 },
                      '100%': { opacity: 1 }
                    }
                  }}
                />
              )}
              <Typography variant="body2" sx={{ color: BRAND_COLORS.white, fontWeight: 'bold' }}>
                Real-time Stream {isRealTimeActive && '• Live'}
              </Typography>
            </Box>
            
            {/* Moved Live indicator to separate line to prevent overlap */}
            {isRealTimeActive && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                mt: 1,
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: 1,
                px: 2,
                py: 1
              }}>
                <Box sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#4caf50',
                  animation: 'pulse 2s infinite'
                }} />
                <Typography variant="caption" sx={{ color: BRAND_COLORS.white, fontWeight: 'bold' }}>
                  Live • {connectionStatus === 'connected' ? 'Connected' : 'Reconnecting...'}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Filter Bar */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                displayEmpty
                sx={{ backgroundColor: BRAND_COLORS.white }}
              >
                <MenuItem value="">All Groups</MenuItem>
                {allGroups.map(group => (
                  <MenuItem key={group} value={group}>{group}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={senderFilter}
                onChange={(e) => setSenderFilter(e.target.value)}
                displayEmpty
                sx={{ backgroundColor: BRAND_COLORS.white }}
              >
                <MenuItem value="">All Senders</MenuItem>
                {allSenders.map(sender => (
                  <MenuItem key={sender} value={sender}>{sender}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* NEW: Advanced AI Category Filter */}
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                value={categoryFilter || ''}
                onChange={(e) => setCategoryFilter(e.target.value)}
                displayEmpty
                sx={{ backgroundColor: BRAND_COLORS.white }}
              >
                <MenuItem value="">All Categories</MenuItem>
                <MenuItem value="INSTRUCTION">🔧 INSTRUCTION</MenuItem>
                <MenuItem value="ESCALATION">📢 ESCALATION</MenuItem>
                <MenuItem value="COMPLAINT">⚠️ COMPLAINT</MenuItem>
                <MenuItem value="URGENT">🚨 URGENT</MenuItem>
                <MenuItem value="CASUAL">💬 CASUAL</MenuItem>
              </Select>
            </FormControl>
            
            <Box sx={{ display: 'flex', alignItems: 'center', backgroundColor: BRAND_COLORS.white, borderRadius: 1, px: 2, py: 1, border: `1px solid ${BRAND_COLORS.border}` }}>
              <SearchIcon sx={{ color: BRAND_COLORS.mediumGray, mr: 1 }} />
              <InputBase
                placeholder="Search messages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ flex: 1, fontSize: '0.9rem' }}
              />
            </Box>
            
            {/* Quick Filters */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip 
                label="📅 Booking" 
                size="small" 
                variant={search.includes('booking') ? 'filled' : 'outlined'}
                onClick={() => setSearch(search.includes('booking') ? '' : 'booking')}
                color="primary"
              />
              <Chip 
                label="🚨 Urgent" 
                size="small" 
                variant={search.includes('urgent') ? 'filled' : 'outlined'}
                onClick={() => setSearch(search.includes('urgent') ? '' : 'urgent')}
                color="error"
              />
              <Chip 
                label="⚠️ Complaint" 
                size="small" 
                variant={search.includes('complaint') ? 'filled' : 'outlined'}
                onClick={() => setSearch(search.includes('complaint') ? '' : 'complaint')}
                color="warning"
              />
            </Box>
            
            {/* NEW: Advanced Configuration Panel */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<SettingsIcon />}
                onClick={() => window.open('/api/whatsapp-groups', '_blank')}
                sx={{ color: BRAND_COLORS.darkGray, borderColor: BRAND_COLORS.border }}
              >
                Groups
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<SettingsIcon />}
                onClick={() => window.open('/api/routing-rules', '_blank')}
                sx={{ color: BRAND_COLORS.darkGray, borderColor: BRAND_COLORS.border }}
              >
                Rules
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<AnalyticsIcon />}
                onClick={() => window.open('/api/advanced-analytics', '_blank')}
                sx={{ color: BRAND_COLORS.darkGray, borderColor: BRAND_COLORS.border }}
              >
                Analytics
              </Button>
            </Box>
            
            {/* Clear Filters Button */}
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setGroupFilter('');
                setSenderFilter('');
                setSearch('');
                // No date range to reset - removed date functionality
              }}
              sx={{ color: BRAND_COLORS.mediumGray, borderColor: BRAND_COLORS.border }}
            >
              Clear All
            </Button>
          </Box>
        </Box>

        {/* Messages Table */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          <StyledCard>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: BRAND_COLORS.darkGray, backgroundColor: BRAND_COLORS.lightGray, width: '120px' }}>Time</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: BRAND_COLORS.darkGray, backgroundColor: BRAND_COLORS.lightGray, width: '150px' }}>Group</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: BRAND_COLORS.darkGray, backgroundColor: BRAND_COLORS.lightGray, width: '150px' }}>Sender</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: BRAND_COLORS.darkGray, backgroundColor: BRAND_COLORS.lightGray }}>Message</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: BRAND_COLORS.darkGray, backgroundColor: BRAND_COLORS.lightGray, width: '100px' }}>Flagged</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: BRAND_COLORS.darkGray, backgroundColor: BRAND_COLORS.lightGray, width: '120px' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, index) => (
                    <TableRow key={index}>
                      {Array.from({ length: 6 }).map((_, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <Box sx={{ width: '100%', height: 20, backgroundColor: BRAND_COLORS.lightGray, borderRadius: 1, animation: 'pulse 1.5s ease-in-out infinite' }} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : displayData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: "center", py: 8, color: BRAND_COLORS.mediumGray }}>
                      No messages found for the selected date range and filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  displayData.map((row, index) => (
                    <MessageRow
                      key={`${row.id || index}-${row.received_at}`}
                      row={row}
                      onView={handleMessageClick}
                      onFlag={(msg) => handleMessageAction('flag', msg)}
                      onEscalate={(msg) => handleMessageAction('escalate', msg)}
                      onAnalyze={handleAnalyzeMessage}
                    />
                  ))
                )}
                
                {/* SIMPLE PAGINATION: No infinite scroll indicators needed */}
              </TableBody>
            </Table>
          </StyledCard>

          {/* Simple Pagination */}
          {totalMessages > ITEMS_PER_PAGE && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Showing {((page - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(page * ITEMS_PER_PAGE, totalMessages)} of {totalMessages} messages
              </Typography>
              <Pagination
                count={Math.ceil(totalMessages / ITEMS_PER_PAGE)}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
          
          {/* SIMPLE PAGINATION: No infinite scroll instructions needed */}
        </Box>
      </Box>
    );
  }

  function FlaggedView() {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header with filters */}
        <Box sx={{ 
          p: 3, 
          backgroundColor: BRAND_COLORS.white, 
          borderBottom: `1px solid ${BRAND_COLORS.border}`,
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: BRAND_COLORS.darkGray }}>
              Flagged Messages
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={toggleFilters}
                sx={{ color: BRAND_COLORS.darkGray, borderColor: BRAND_COLORS.border }}
              >
                Filters
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchData}
                disabled={loading}
                sx={{ color: BRAND_COLORS.darkGray, borderColor: BRAND_COLORS.border }}
              >
                Refresh
              </Button>
            </Box>
          </Box>

          {/* Filter Bar */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                displayEmpty
                sx={{ backgroundColor: BRAND_COLORS.white }}
              >
                <MenuItem value="">All Groups</MenuItem>
                {allGroups.map(group => (
                  <MenuItem key={group} value={group}>{group}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={senderFilter}
                onChange={(e) => setSenderFilter(e.target.value)}
                displayEmpty
                sx={{ backgroundColor: BRAND_COLORS.white }}
              >
                <MenuItem value="">All Senders</MenuItem>
                {allSenders.map(sender => (
                  <MenuItem key={sender} value={sender}>{sender}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Box sx={{ display: 'flex', alignItems: 'center', backgroundColor: BRAND_COLORS.white, borderRadius: 1, px: 2, py: 1, border: `1px solid ${BRAND_COLORS.border}` }}>
              <SearchIcon sx={{ color: BRAND_COLORS.mediumGray, mr: 1 }} />
              <InputBase
                placeholder="Search flagged messages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ flex: 1, fontSize: '0.9rem' }}
              />
            </Box>
          </Box>
        </Box>

        {/* Flagged Messages Table */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          <StyledCard>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: BRAND_COLORS.darkGray, backgroundColor: BRAND_COLORS.lightGray, width: '140px' }}>Time</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: BRAND_COLORS.darkGray, backgroundColor: BRAND_COLORS.lightGray, width: '150px' }}>Group</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: BRAND_COLORS.darkGray, backgroundColor: BRAND_COLORS.lightGray, width: '150px' }}>Sender</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: BRAND_COLORS.darkGray, backgroundColor: BRAND_COLORS.lightGray, minWidth: '300px' }}>Message</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: BRAND_COLORS.darkGray, backgroundColor: BRAND_COLORS.lightGray, width: '200px' }}>Sentiment</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: BRAND_COLORS.darkGray, backgroundColor: BRAND_COLORS.lightGray, width: '200px' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, index) => (
                    <TableRow key={index}>
                      {Array.from({ length: 6 }).map((_, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <Box sx={{ width: '100%', height: 20, backgroundColor: BRAND_COLORS.lightGray, borderRadius: 1, animation: 'pulse 1.5s ease-in-out infinite' }} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : flags.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: "center", py: 8, color: BRAND_COLORS.mediumGray }}>
                      No flagged messages found.
                    </TableCell>
                  </TableRow>
                ) : (
                  flags.map((row, index) => (
                    <FlaggedMessageRow
                      key={index}
                      row={row}
                      onView={handleMessageClick}
                      onUnflag={(msg) => handleMessageAction('unflag', msg)}
                      onEscalate={(msg) => handleMessageAction('escalate', msg)}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </StyledCard>

          {/* Pagination */}
          {flags.length > ITEMS_PER_PAGE && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </Box>
      </Box>
    );
  }

  function DashboardView() {
    return (
      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="h4" sx={{ mb: 2, color: BRAND_COLORS.darkGray }}>
            Welcome to WTF Intelligence Dashboard
          </Typography>
          <Typography variant="body1" sx={{ color: BRAND_COLORS.mediumGray, mb: 3 }}>
            Your comprehensive WhatsApp monitoring and analytics platform
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={() => navigate('/messages')}
              sx={{ backgroundColor: BRAND_COLORS.red }}
            >
              View Messages
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/analytics')}
              sx={{ color: BRAND_COLORS.darkGray, borderColor: BRAND_COLORS.border }}
            >
              View Analytics
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  function StatusView() {
    const [statusData, setStatusData] = useState(null);
    const [healthData, setHealthData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [clearingAuth, setClearingAuth] = useState(false);

    useEffect(() => {
      fetchStatusData();
      const interval = setInterval(fetchStatusData, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }, []);

    const fetchStatusData = async () => {
      try {
        const [statusRes, healthRes] = await Promise.all([
          fetch('/status'),
          fetch(apiUrl('/api/health'))
        ]);
        
        const statusText = await statusRes.text();
        const healthJson = await healthRes.json();
        
        setStatusData({ html: statusText, raw: statusText });
        setHealthData(healthJson);
      } catch (error) {
        console.error('Error fetching status:', error);
      } finally {
        setLoading(false);
      }
    };

    const handleClearAuth = async () => {
      setClearingAuth(true);
      try {
        const response = await fetch(apiUrl('/api/clear-whatsapp-auth'), { method: 'POST' });
        const result = await response.json();
        
        if (result.success) {
          setAlert('WhatsApp authentication cleared successfully. Check /qr for new QR code.');
          setTimeout(fetchStatusData, 2000); // Refresh status after clearing
        } else {
          setAlert('Failed to clear authentication: ' + result.error);
        }
      } catch (error) {
        setAlert('Error clearing authentication: ' + error.message);
      } finally {
        setClearingAuth(false);
      }
    };

    if (loading) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography>Loading system status...</Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3, color: BRAND_COLORS.darkGray }}>
          System Status & Controls
        </Typography>
        
        <Grid container spacing={3}>
          {/* WhatsApp Status Card */}
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, color: BRAND_COLORS.darkGray }}>
                WhatsApp Service Status
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Chip
                  label={waStatus}
                  color={waStatus === 'CONNECTED' ? 'success' : 'error'}
                  sx={{ fontSize: '1rem', px: 2, py: 1 }}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={fetchStatusData}
                  disabled={loading}
                  sx={{ color: BRAND_COLORS.darkGray }}
                >
                  Refresh Status
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={handleClearAuth}
                  disabled={clearingAuth}
                  sx={{ color: BRAND_COLORS.red }}
                >
                  {clearingAuth ? 'Clearing...' : 'Clear WhatsApp Auth'}
                </Button>
              </Box>
            </Card>
          </Grid>

          {/* System Health Card */}
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, color: BRAND_COLORS.darkGray }}>
                System Health
              </Typography>
              {healthData && (
                <Box>
                  <Box sx={{ mb: 1 }}>
                    <Chip
                      label={healthData.status?.toUpperCase() || 'UNKNOWN'}
                      color={healthData.status === 'ok' ? 'success' : 'error'}
                    />
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    Database: {healthData.database_status || 'Unknown'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    WhatsApp Service: {healthData.whatsapp_service || 'Unknown'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Uptime: {Math.floor((healthData.uptime || 0) / 60)} minutes
                  </Typography>
                </Box>
              )}
            </Card>
          </Grid>

          {/* Detailed Status */}
          <Grid item xs={12}>
            <Card sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, color: BRAND_COLORS.darkGray }}>
                Detailed System Information
              </Typography>
              {statusData && (
                <Box
                  sx={{
                    backgroundColor: BRAND_COLORS.lightGray,
                    p: 2,
                    borderRadius: 1,
                    fontFamily: 'monospace',
                    fontSize: '0.9rem'
                  }}
                  dangerouslySetInnerHTML={{ __html: statusData.html }}
                />
              )}
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  }

  function QRView() {
    const [qrContent, setQrContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [forceLogoutLoading, setForceLogoutLoading] = useState(false);
    const [confirmationOpen, setConfirmationOpen] = useState(false);
    const [confirmationInput, setConfirmationInput] = useState('');
    const [status, setStatus] = useState('');

    useEffect(() => {
      // Set initial loading state for QR code
      setQrContent(`
        <div style="padding: 20px; background: #f5f5f5; border-radius: 8px; margin: 10px 0; text-align: center;">
          <p>🔄 <strong>Initializing WhatsApp QR Code...</strong></p>
          <p style="color: #666; font-size: 14px;">Please wait, connecting to WhatsApp service...</p>
        </div>
      `);

      // Only fetch initial status, let Socket.IO handle QR codes
      fetchStatus();
      const interval = setInterval(() => {
        fetchStatus(); // Only refresh status, not QR code
      }, 5000); // Refresh every 5 seconds

      // FIXED: Add Socket.IO listeners for real-time QR code updates
      const wsUrl = environment.websocketUrl;
      console.log('🔌 QR View: Connecting to WebSocket:', wsUrl);
      const qrSocket = io(wsUrl, { 
        transports: ["websocket", "polling"],
        timeout: 30000,
        forceNew: false
      });

      // Socket.IO connection handlers
      qrSocket.on("connect", () => {
        console.log('🔌 QR View: Socket.IO connected successfully');
        setQrContent(`
          <div style="padding: 20px; background: #e8f5e8; border-radius: 8px; margin: 10px 0; text-align: center;">
            <p>✅ <strong>Connected to WhatsApp Service</strong></p>
            <p style="color: #666; font-size: 14px;">Waiting for QR code generation...</p>
          </div>
        `);
      });

      qrSocket.on("disconnect", () => {
        console.log('🔌 QR View: Socket.IO disconnected');
      });

      // Listen for QR code updates from backend in real-time
      qrSocket.on("qr", (qrData) => {
        console.log('📱 QR Code received via Socket.IO:', qrData);
        
        if (qrData && qrData.qr) {
          // Generate QR code image from the string
          QRCode.toDataURL(qrData.qr, {
            width: 300,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          })
          .then(qrImageUrl => {
            // Display QR code as image
            setQrContent(`
              <div style="padding: 20px; background: #f5f5f5; border-radius: 8px; margin: 10px 0; text-align: center;">
                <p style="margin-bottom: 15px;"><strong>📱 Scan this QR code with WhatsApp:</strong></p>
                <img src="${qrImageUrl}" alt="WhatsApp QR Code" style="max-width: 300px; height: auto; border: 2px solid #25D366; border-radius: 8px;" />
                <p style="margin-top: 15px; color: #666; font-size: 14px;">Open WhatsApp → Menu → Linked Devices → Link a Device</p>
                <p style="color: #999; font-size: 12px;">QR code refreshes automatically every 20 seconds</p>
              </div>
            `);
            setLoading(false);
            console.log('✅ QR Code image generated and displayed');
          })
          .catch(error => {
            console.error('❌ Error generating QR code image:', error);
            // Fallback to text display
            setQrContent(`
              <div style="padding: 20px; background: #f5f5f5; border-radius: 8px; margin: 10px 0;">
                <p style="margin-bottom: 15px;"><strong>📱 Scan this QR code with WhatsApp:</strong></p>
                <div style="font-family: monospace; font-size: 12px; line-height: 1.2; background: white; padding: 15px; border-radius: 4px; overflow-wrap: break-word;">
                  ${qrData.qr}
                </div>
                <p style="margin-top: 15px; color: #666; font-size: 14px;">Open WhatsApp → Menu → Linked Devices → Link a Device</p>
              </div>
            `);
            setLoading(false);
          });
        }
      });

      // FIXED: Listen for WhatsApp status updates (main status event)
      qrSocket.on("whatsapp_status", (statusData) => {
        console.log('📱 QR View: WhatsApp Status Update:', statusData);
        
        if (statusData.authenticated) {
          // WhatsApp is already authenticated
          setQrContent(`
            <div style="padding: 20px; background: #e8f5e8; border-radius: 8px; margin: 10px 0; text-align: center;">
              <p style="font-size: 18px; margin-bottom: 10px;">✅ <strong>WhatsApp is Connected!</strong></p>
              <p style="color: #666;">Logged in as: <strong>${statusData.clientInfo?.pushname || 'User'}</strong></p>
              <p style="color: #666; font-size: 14px;">Real-time message monitoring is active</p>
              <p style="color: #999; font-size: 12px;">No QR scan needed - already authenticated</p>
            </div>
          `);
          setLoading(false);
        } else if (statusData.status === 'qr_available') {
          // QR code is available for scanning
          setQrContent(`
            <div style="padding: 20px; background: #fff3cd; border-radius: 8px; margin: 10px 0; text-align: center;">
              <p style="font-size: 16px; margin-bottom: 10px;">📱 <strong>WhatsApp Not Connected</strong></p>
              <p style="color: #666; font-size: 14px;">Waiting for QR code...</p>
            </div>
          `);
        }
      });

      // Listen for WhatsApp authentication success (backup event)
      qrSocket.on("authenticated", (authData) => {
        console.log('✅ WhatsApp authenticated via Socket.IO:', authData);
        setQrContent(`
          <div style="padding: 20px; background: #e8f5e8; border-radius: 8px; margin: 10px 0; text-align: center;">
            <p style="font-size: 18px; margin-bottom: 10px;">✅ <strong>WhatsApp is Connected!</strong></p>
            <p style="color: #666;">Logged in as: <strong>${authData.pushname || 'User'}</strong></p>
            <p style="color: #666; font-size: 14px;">Real-time message monitoring is active</p>
          </div>
        `);
        setLoading(false);
      });

      // Listen for WhatsApp ready status
      qrSocket.on("ready", (readyData) => {
        console.log('🚀 WhatsApp ready via Socket.IO:', readyData);
        setQrContent(`
          <div style="padding: 20px; background: #e8f5e8; border-radius: 8px; margin: 10px 0; text-align: center;">
            <p style="font-size: 18px; margin-bottom: 10px;">✅ <strong>WhatsApp is Connected & Ready!</strong></p>
            <p style="color: #666;">Logged in as: <strong>${readyData.pushname || 'User'}</strong> (${readyData.number || 'Unknown'})</p>
            <p style="color: #666; font-size: 14px;">Real-time message monitoring is active</p>
            <p style="color: #666; font-size: 12px;">Platform: ${readyData.platform || 'Unknown'}</p>
          </div>
        `);
        setLoading(false);
      });

      return () => {
        clearInterval(interval);
        qrSocket.disconnect();
      };
    }, []);

    // Force Logout Handler with Double Confirmation
    const handleForceLogout = () => {
      setConfirmationOpen(true);
      setConfirmationInput('');
    };

    const handleConfirmForceLogout = async () => {
      if (confirmationInput !== 'CONFIRM') {
        alert('Please type "CONFIRM" to proceed with force logout');
        return;
      }

      setConfirmationOpen(false);
      setForceLogoutLoading(true);
      
      try {
        console.log('🚨 Starting force logout process...');
        
        const response = await fetch(apiUrl('/api/whatsapp/force-logout'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            confirmationToken: 'FORCE_LOGOUT_CONFIRMED'
          })
        });

        const result = await response.json();

        if (result.success) {
          setQrContent(`
            <div style="padding: 20px; background: #e8f5e8; border-radius: 8px; margin: 10px 0; text-align: center;">
              <p style="font-size: 18px; margin-bottom: 10px;">✅ <strong>Force Logout Successful!</strong></p>
              <p style="color: #666; font-size: 14px;">All session data has been cleared</p>
              <p style="color: #666; font-size: 14px;">System is reinitializing... New QR code will appear shortly</p>
            </div>
          `);
          
          // Auto-refresh QR code after 3 seconds
          setTimeout(() => {
            fetchQRCode();
          }, 3000);
          
        } else {
          throw new Error(result.error || 'Force logout failed');
        }

      } catch (error) {
        console.error('❌ Force logout error:', error);
        setQrContent(`
          <div style="padding: 20px; background: #ffebee; border-radius: 8px; margin: 10px 0; text-align: center;">
            <p style="font-size: 16px; margin-bottom: 10px;">❌ <strong>Force Logout Failed</strong></p>
            <p style="color: #c62828; font-size: 14px;">${error.message}</p>
            <p style="color: #666; font-size: 12px;">Please try again or contact support</p>
          </div>
        `);
      } finally {
        setForceLogoutLoading(false);
      }
    };

    const handleCancelForceLogout = () => {
      setConfirmationOpen(false);
      setConfirmationInput('');
    };

    const fetchQRCode = async () => {
      try {
        const response = await fetch(apiUrl('/api/whatsapp/qr'));
        const data = await response.json();
        
        if (data.success && data.qrCode) {
          // Display the QR code text for scanning
          setQrContent(`
            <div style="padding: 20px; background: #f5f5f5; border-radius: 8px; margin: 10px 0;">
              <p style="margin-bottom: 15px;"><strong>📱 Scan this QR code with WhatsApp:</strong></p>
              <div style="font-family: monospace; font-size: 12px; line-height: 1.2; background: white; padding: 15px; border-radius: 4px; overflow-wrap: break-word;">
                ${data.qrCode}
              </div>
              <p style="margin-top: 15px; color: #666; font-size: 14px;">Open WhatsApp → Menu → Linked Devices → Link a Device</p>
            </div>
          `);
        } else if (data.status === 'initializing') {
          setQrContent('<p>🔄 WhatsApp service is initializing...<br>Please wait a few seconds and refresh.</p>');
        } else if (data.authenticated) {
          setQrContent(`
            <div style="padding: 20px; background: #e8f5e8; border-radius: 8px; margin: 10px 0; text-align: center;">
              <p style="font-size: 18px; margin-bottom: 10px;">✅ <strong>WhatsApp is Connected!</strong></p>
              <p style="color: #666;">Logged in as: <strong>${data.clientInfo?.pushname || 'User'}</strong></p>
              <p style="color: #666; font-size: 14px;">Real-time message monitoring is active</p>
            </div>
          `);
        } else {
          setQrContent('<p>QR Code not available</p>');
        }
      } catch (error) {
        console.error('Error fetching QR code:', error);
        setQrContent('<p>Error loading QR code</p>');
      } finally {
        setLoading(false);
      }
    };

    const fetchStatus = async () => {
      try {
        const response = await fetch(apiUrl('/api/whatsapp/status'));
        const data = await response.json();
        setStatus(data);
      } catch (error) {
        console.error('Error fetching status:', error);
      }
    };

    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 2, color: BRAND_COLORS.darkGray }}>
          📱 WhatsApp QR Code - Integrated Environment
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, color: BRAND_COLORS.mediumGray }}>
          Scan this QR code with your WhatsApp mobile app to connect to the integrated WhatsApp service
        </Typography>
        
        {/* Environment Info */}
        <Card sx={{ p: 3, mb: 3, backgroundColor: BRAND_COLORS.lightGray, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, color: BRAND_COLORS.darkGray }}>
            🔧 Integrated Environment Status
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip 
              label="Hybrid Architecture" 
              color="primary" 
              variant="outlined"
              sx={{ fontWeight: 'bold' }}
            />
            <Chip 
              label="Real-time Processing" 
              color="success" 
              variant="outlined"
              sx={{ fontWeight: 'bold' }}
            />
            <Chip 
              label="AI-Powered Analysis" 
              color="secondary" 
              variant="outlined"
              sx={{ fontWeight: 'bold' }}
            />
            <Chip 
              label="Integrated Service" 
              color="info" 
              variant="outlined"
              sx={{ fontWeight: 'bold' }}
            />
          </Box>
        </Card>

        {/* QR Code Display */}
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          {loading ? (
            <Box>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography>Loading QR code...</Typography>
            </Box>
          ) : (
            <Box>
              <div dangerouslySetInnerHTML={{ __html: qrContent }} />
              <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  onClick={fetchQRCode}
                  sx={{ color: BRAND_COLORS.darkGray }}
                >
                  🔄 Refresh QR Code
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => window.open(apiUrl('/api/whatsapp/qr'), '_blank')}
                  sx={{ color: BRAND_COLORS.darkGray }}
                >
                  🔗 Open in New Tab
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => window.open(apiUrl('/api/whatsapp/status'), '_blank')}
                  sx={{ color: BRAND_COLORS.darkGray }}
                >
                  📊 View Status
                </Button>
                
                {/* ENHANCED: Force Logout Button */}
                <Button
                  variant="outlined"
                  onClick={handleForceLogout}
                  sx={{ 
                    color: BRAND_COLORS.red,
                    borderColor: BRAND_COLORS.red,
                    '&:hover': {
                      backgroundColor: 'rgba(244, 67, 54, 0.04)',
                      borderColor: BRAND_COLORS.red,
                    }
                  }}
                  disabled={forceLogoutLoading}
                >
                  {forceLogoutLoading ? (
                    <>
                      <CircularProgress size={16} sx={{ mr: 1 }} />
                      Logging Out...
                    </>
                  ) : (
                    '🚨 Force Logout'
                  )}
                </Button>
              </Box>
            </Box>
          )}
        </Card>

        {/* Quick Links */}
        <Card sx={{ p: 3, mt: 3, backgroundColor: BRAND_COLORS.lightGray, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, color: BRAND_COLORS.darkGray }}>
            🔗 Quick Access Links
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="text"
              onClick={() => navigate('/messages')}
              sx={{ color: BRAND_COLORS.red, fontWeight: 'bold' }}
            >
              📱 All Messages
            </Button>
            <Button
              variant="text"
              onClick={() => navigate('/whatsapp_routing')}
              sx={{ color: BRAND_COLORS.red, fontWeight: 'bold' }}
            >
              ⚙️ WhatsApp Routing
            </Button>
            <Button
              variant="text"
              onClick={() => navigate('/analytics')}
              sx={{ color: BRAND_COLORS.red, fontWeight: 'bold' }}
            >
              📊 Analytics
            </Button>
            <Button
              variant="text"
              onClick={() => navigate('/status')}
              sx={{ color: BRAND_COLORS.red, fontWeight: 'bold' }}
            >
              🔍 System Status
            </Button>
          </Box>
        </Card>

        {/* ENHANCED: Force Logout Confirmation Dialog */}
        <Dialog
          open={confirmationOpen}
          onClose={handleCancelForceLogout}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ 
            backgroundColor: BRAND_COLORS.red, 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            🚨 Force Logout Confirmation
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              <strong>⚠️ WARNING:</strong> This will completely clear all WhatsApp session data 
              and force a complete logout. You will need to scan a new QR code to reconnect.
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: 'gray' }}>
              This action cannot be undone and will:
            </Typography>
            <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
              <li>Destroy the current WhatsApp connection</li>
              <li>Clear all saved session files</li>
              <li>Require a fresh QR code scan</li>
              <li>Interrupt any ongoing message processing</li>
            </ul>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Type <strong>"CONFIRM"</strong> below to proceed:
            </Typography>
            <TextField
              fullWidth
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value.toUpperCase())}
              placeholder="Type CONFIRM here"
              variant="outlined"
              autoFocus
            />
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleCancelForceLogout} sx={{ color: BRAND_COLORS.darkGray }}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmForceLogout}
              variant="contained"
              sx={{ 
                backgroundColor: BRAND_COLORS.red,
                '&:hover': { backgroundColor: '#c62828' }
              }}
              disabled={confirmationInput !== 'CONFIRM'}
            >
              Force Logout
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  function AboutView() {
    return (
      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="h4" sx={{ mb: 2, color: BRAND_COLORS.darkGray }}>
            About WTF Intelligence
          </Typography>
          <Typography variant="body1" sx={{ color: BRAND_COLORS.mediumGray }}>
            About WTF Intelligence Platform v2.1
          </Typography>
        </Paper>
      </Box>
    );
  }

  // MAIN RENDER FUNCTION - This was missing!
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Sidebar */}
        <Sidebar
          open={sidebarOpen}
          collapsed={sidebarCollapsed}
          onClose={() => setSidebarOpen(false)}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          navItems={NAV_ITEMS}
          currentView={currentView}
          onNavigation={(key) => {
            logInfo('Navigation', 'Navigating to view', { from: currentView, to: key });
            navigate(`/${key}`);
            setCurrentView(key);
            if (key === 'messages') setCurrentTab("logs");
            if (key === 'flagged') setCurrentTab("flags");
            if (isMobile) setSidebarOpen(false);
          }}
          isMobile={isMobile}
        />

        {/* Header */}
        <Header
          sidebarOpen={sidebarOpen}
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          currentView={currentView}
          navItems={NAV_ITEMS}
          waStatus={waStatus}
          realtime={realtime}
          onRealtimeToggle={setRealtime}
          messageCount={logs.length + flags.length}
          isMobile={isMobile}
          isLoading={loading}
        />

        {/* Main Content */}
        <Box
          sx={{
            flex: 1,
            minHeight: '100vh',
            marginLeft: getMainContentMargin(),
            transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            background: BRAND_COLORS.lightGray,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            width: `calc(100vw - ${getMainContentMargin()}px)`
          }}
        >
          <Routes>
            <Route path="/" element={<MessagesView />} />
            <Route path="/messages" element={<MessagesView />} />
            <Route path="/flagged" element={<FlaggedView />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/ai_dashboard" element={<AIDashboardPage />} />
            <Route path="/ai_intelligence" element={<AIIntelligencePage />} />
            <Route path="/ai_labeling" element={<ManualLabelingPage />} />
            <Route path="/slack" element={<SlackIntegrationPage />} />
            <Route path="/digest" element={<DigestPage />} />
            <Route path="/keyword_analytics" element={<KeywordAnalyticsPage />} />
            <Route path="/flag_keywords" element={<FlagKeywordsPage />} />
            <Route path="/keyword_review" element={<KeywordReviewPage />} />
            <Route path="/issue_management" element={<IssueCategoriesPage />} />
            <Route path="/interaction_logs" element={<UserInteractionLogsPage />} />
            <Route path="/log-viewer" element={<LogViewerPage />} />
            <Route path="/health_monitor" element={<DashboardHealthMonitor />} />
            <Route path="/dashboard" element={<DashboardView />} />
            <Route path="/status" element={<StatusView />} />
            <Route path="/qr" element={<QRView />} />
            <Route path="/about" element={<AboutView />} />
            <Route path="/whatsapp_routing" element={<WhatsAppRoutingPageV2 />} />
            <Route path="/whatsapp_groups_v2" element={<WhatsAppGroupsV2 />} />
            <Route path="/dialog_test_v3" element={<DialogTestV3 />} />
            <Route path="/ai_confidence" element={<AIConfidenceManagement />} />
            <Route path="/dynamic_categories" element={<DynamicCategoriesPage />} />
            <Route path="/endpoints" element={<EndpointsPage />} />
            <Route path="/comprehensive_analytics" element={<ComprehensiveAnalyticsDashboard />} />
            
            {/* NEW: Advanced Categorization & Routing Routes */}
            <Route path="/advanced_categorization" element={<AdvancedCategorizationPage />} />
            <Route path="/escalation_monitoring" element={<EscalationMonitoringPage />} />
            <Route path="/department_performance" element={<DepartmentPerformanceDashboard />} />
            <Route path="/contextual_analysis" element={<ContextualAnalysisViewer />} />
          </Routes>
        </Box>

        {/* Filters Panel */}
        <FiltersPanel
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          groupFilter={groupFilter}
          senderFilter={senderFilter}
          search={search}
          onGroupFilterChange={setGroupFilter}
          onSenderFilterChange={setSenderFilter}
          onSearchChange={setSearch}
          onClearFilters={() => {
            setGroupFilter("");
            setSenderFilter("");
            setSearch("");
            setCategoryFilter(""); // NEW: Clear category filter too
            setFiltersOpen(false);
          }}
          allGroups={[...new Set(allLogs.concat(allFlags).map(msg => msg.group_name).filter(Boolean))]}
          allSenders={[...new Set(allLogs.concat(allFlags).map(msg => msg.sender_name).filter(Boolean))]}
          loading={loading}
        />

        {/* Notification Toast */}
        <NotificationToast
          open={notification.open}
          onClose={() => setNotification({ ...notification, open: false })}
          message={notification.message}
          type={notification.type}
          count={notification.count}
          severity="info"
        />



        {/* Confirmation Modal */}
        <ConfirmationModal
          open={confirmationModal.open}
          onClose={() => setConfirmationModal({ open: false, action: null, data: null })}
          onConfirm={executeAction}
          title={confirmationModal.title || "Confirm Action"}
          message={confirmationModal.message || "Are you sure you want to proceed?"}
          confirmText={confirmationModal.confirmText || "Confirm"}
          cancelText={confirmationModal.cancelText || "Cancel"}
          severity={confirmationModal.severity || "info"}
          loading={actionLoading}
          details={confirmationModal.details}
          showUndo={confirmationModal.showUndo}
        />

        {/* Analytics Modal */}
        <AnalyticsModal
          open={analyticsModal.open}
          onClose={() => setAnalyticsModal({ open: false, title: '', metricType: '', value: 0 })}
          title={analyticsModal.title}
          metricType={analyticsModal.metricType}
          initialValue={analyticsModal.value}
          onMessageClick={handleMessageClick}
          loading={loading}
        />

        {/* Real-time Connection Status */}
        <Box
          sx={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999,
            backgroundColor: connectionStatus === 'connected' ? '#10B981' : 
                           connectionStatus === 'reconnecting' ? '#F59E0B' : '#EF4444',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transition: 'all 0.3s ease'
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'white',
              animation: connectionStatus === 'connected' ? 'pulse 2s infinite' :
                        connectionStatus === 'reconnecting' ? 'bounce 1.5s infinite' : 'none'
            }}
          />
          {connectionStatus === 'connected' ? 'Live' :
           connectionStatus === 'reconnecting' ? 'Reconnecting...' :
           connectionStatus === 'error' ? 'Error' : 'Disconnected'}
          {connectionStatus === 'connected' && connectionLatency > 0 && (
            <Typography sx={{ fontSize: '10px', opacity: 0.8 }}>
              {connectionLatency}ms
            </Typography>
          )}
          {pendingAICount > 0 && (
            <Chip
              label={`🤖 ${pendingAICount}`}
              size="small"
              sx={{
                ml: 1,
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontSize: '10px',
                height: '20px'
              }}
            />
          )}
        </Box>

        {/* Alert Snackbar */}
        <Snackbar
          open={!!alert}
          autoHideDuration={3500}
          onClose={() => setAlert("")}
          message={alert}
        />

        {/* Live Console */}
        <LiveConsole />
      </Box>
    </ThemeProvider>
  );
}
