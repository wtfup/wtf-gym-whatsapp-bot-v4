import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Grid,
  Divider,
  IconButton,
  Modal,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  CardMedia,
  Link,
  Alert,
  Skeleton
} from '@mui/material';
import {
  Close as CloseIcon,
  Image as ImageIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  Description as DocumentIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon,
  Download as DownloadIcon,
  Fullscreen as FullscreenIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  VolumeUp as VolumeIcon,
  FileCopy as FileIcon,
  Phone as PhoneIcon,
  Message as MessageIcon,
  Flag as FlagIcon,
  SentimentSatisfied as SentimentIcon,
  Psychology as IntentIcon
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
  border: 'rgba(0, 0, 0, 0.08)',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3'
};

const MessageDetailModal = ({ open, onClose, message }) => {
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  console.log('🖼️ MessageDetailModal opened:', { 
    open, 
    messageId: message?.id, 
    hasMedia: message?.has_media,
    mediaType: message?.media_type 
  });

  const handleMediaClick = (mediaUrl, mediaType) => {
    console.log('🖼️ Media clicked:', { mediaUrl, mediaType });
    setSelectedMedia({ url: mediaUrl, type: mediaType });
    setMediaModalOpen(true);
  };

  const handleCloseMediaModal = () => {
    setMediaModalOpen(false);
    setSelectedMedia(null);
    setIsPlaying(false);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getMediaIcon = (mediaType) => {
    switch (mediaType?.toLowerCase()) {
      case 'image': return <ImageIcon />;
      case 'video': return <VideoIcon />;
      case 'audio': return <AudioIcon />;
      default: return <DocumentIcon />;
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return BRAND_COLORS.success;
      case 'negative': return BRAND_COLORS.error;
      case 'neutral': return BRAND_COLORS.mediumGray;
      default: return BRAND_COLORS.mediumGray;
    }
  };

  const getIntentColor = (intent) => {
    switch (intent?.toLowerCase()) {
      case 'complaint': return BRAND_COLORS.error;
      case 'question': return BRAND_COLORS.info;
      case 'booking': return BRAND_COLORS.success;
      default: return BRAND_COLORS.mediumGray;
    }
  };

  const renderMediaContent = () => {
    if (!selectedMedia) return null;

    const { url, type } = selectedMedia;

    switch (type?.toLowerCase()) {
      case 'image':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <img 
              src={url} 
              alt="Media content" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '80vh', 
                objectFit: 'contain',
                borderRadius: '8px'
              }} 
            />
          </Box>
        );
      case 'video':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <video 
              controls 
              autoPlay={isPlaying}
              style={{ 
                maxWidth: '100%', 
                maxHeight: '80vh',
                borderRadius: '8px'
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              <source src={url} type="video/mp4" />
              <source src={url} type="video/webm" />
              Your browser does not support the video tag.
            </video>
          </Box>
        );
      case 'audio':
        return (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <AudioIcon sx={{ fontSize: 64, color: BRAND_COLORS.primary, mb: 2 }} />
            <audio 
              controls 
              style={{ width: '100%', maxWidth: '400px' }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              <source src={url} type="audio/mpeg" />
              <source src={url} type="audio/wav" />
              Your browser does not support the audio tag.
            </audio>
          </Box>
        );
      default:
        return (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <DocumentIcon sx={{ fontSize: 64, color: BRAND_COLORS.mediumGray, mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 2 }}>
              Document: {url.split('/').pop()}
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<DownloadIcon />}
              onClick={() => window.open(url, '_blank')}
              sx={{ 
                backgroundColor: BRAND_COLORS.primary,
                '&:hover': { backgroundColor: '#D10010' }
              }}
            >
              Download File
            </Button>
          </Box>
        );
    }
  };

  if (!message) return null;

  return (
    <>
      {/* Main Message Detail Modal */}
      <Dialog 
        open={open} 
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        sx={{ 
          zIndex: 9999,
          '& .MuiDialog-paper': {
            zIndex: 9999,
            maxHeight: '90vh',
            borderRadius: 3,
            overflow: 'hidden'
          }
        }}
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 9998,
            backdropFilter: 'blur(4px)'
          }
        }}
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '90vh',
            zIndex: 9999,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }
        }}
      >
        {/* Enhanced Header */}
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: `linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, #D10010 100%)`,
          color: 'white',
          py: 3,
          px: 4
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <MessageIcon sx={{ fontSize: 28 }} />
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              Message Details
            </Typography>
          </Box>
          <IconButton 
            onClick={onClose} 
            sx={{ 
              color: 'white',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', height: '100%' }}>
            {/* Left Panel - Message Content */}
            <Box sx={{ flex: 1, p: 4, overflowY: 'auto' }}>
              {/* Message Content Card */}
              <Card sx={{ mb: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: BRAND_COLORS.darkGray }}>
                    Message Content
                  </Typography>
                  <Paper sx={{ 
                    p: 3, 
                    backgroundColor: BRAND_COLORS.lightGray,
                    borderRadius: 2,
                    border: `1px solid ${BRAND_COLORS.border}`
                  }}>
                    <Typography variant="body1" sx={{ 
                      whiteSpace: 'pre-wrap', 
                      wordBreak: 'break-word',
                      lineHeight: 1.6,
                      fontSize: '1rem'
                    }}>
                      {message.message || '[No text content]'}
                    </Typography>
                  </Paper>
                </CardContent>
              </Card>

              {/* Media Section */}
              {message.has_media && (
                <Card sx={{ mb: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: BRAND_COLORS.darkGray }}>
                      Media Attachment
                    </Typography>
                    <Paper sx={{ 
                      p: 3, 
                      backgroundColor: BRAND_COLORS.lightGray,
                      borderRadius: 2,
                      border: `1px solid ${BRAND_COLORS.border}`,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: '#f0f0f0',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                      }
                    }}
                    onClick={() => handleMediaClick(
                      message.media_url || `/media/${message.id}`,
                      message.media_type
                    )}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ 
                          backgroundColor: BRAND_COLORS.primary,
                          width: 56,
                          height: 56
                        }}>
                          {getMediaIcon(message.media_type)}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                            {message.media_filename || `${message.media_type} file`}
                          </Typography>
                          {message.media_size && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              Size: {formatFileSize(message.media_size)}
                            </Typography>
                          )}
                          <Typography variant="body2" color="text.secondary">
                            Type: {message.media_type}
                          </Typography>
                        </Box>
                        <IconButton sx={{ 
                          backgroundColor: BRAND_COLORS.primary,
                          color: 'white',
                          '&:hover': { backgroundColor: '#D10010' }
                        }}>
                          <FullscreenIcon />
                        </IconButton>
                      </Box>
                    </Paper>
                  </CardContent>
                </Card>
              )}

              {/* AI Analysis Section */}
              {(message.sentiment || message.intent || message.flag_reason) && (
                <Card sx={{ mb: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: BRAND_COLORS.darkGray }}>
                      AI Analysis
                    </Typography>
                    <Grid container spacing={2}>
                      {message.sentiment && (
                        <Grid item xs={12} sm={6}>
                          <Chip 
                            icon={<SentimentIcon />}
                            label={`Sentiment: ${message.sentiment}`}
                            sx={{ 
                              backgroundColor: getSentimentColor(message.sentiment),
                              color: 'white',
                              fontWeight: 'bold'
                            }}
                          />
                        </Grid>
                      )}
                      {message.intent && (
                        <Grid item xs={12} sm={6}>
                          <Chip 
                            icon={<IntentIcon />}
                            label={`Intent: ${message.intent}`}
                            sx={{ 
                              backgroundColor: getIntentColor(message.intent),
                              color: 'white',
                              fontWeight: 'bold'
                            }}
                          />
                        </Grid>
                      )}
                      {message.flag_reason && (
                        <Grid item xs={12}>
                          <Chip 
                            icon={<FlagIcon />}
                            label={`Flagged: ${message.flag_reason}`}
                            sx={{ 
                              backgroundColor: BRAND_COLORS.warning,
                              color: 'white',
                              fontWeight: 'bold'
                            }}
                          />
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              )}
            </Box>

            {/* Right Panel - Metadata */}
            <Box sx={{ 
              width: 350, 
              backgroundColor: BRAND_COLORS.lightGray,
              borderLeft: `1px solid ${BRAND_COLORS.border}`,
              p: 3,
              overflowY: 'auto'
            }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: BRAND_COLORS.darkGray }}>
                Message Metadata
              </Typography>

              <List sx={{ p: 0 }}>
                {/* Sender Info */}
                <ListItem sx={{ px: 0, py: 1 }}>
                  <ListItemIcon>
                    <PersonIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Sender"
                    secondary={
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          {message.sender_name || 'Unknown'}
                        </Typography>
                        {message.number && (
                          <Typography variant="body2" color="text.secondary">
                            {message.number.replace(/@.*$/, '')}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>

                <Divider sx={{ my: 1 }} />

                {/* Group Info */}
                <ListItem sx={{ px: 0, py: 1 }}>
                  <ListItemIcon>
                    <GroupIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Group"
                    secondary={
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {message.group_name || 'Direct Message'}
                      </Typography>
                    }
                  />
                </ListItem>

                <Divider sx={{ my: 1 }} />

                {/* Timestamp */}
                <ListItem sx={{ px: 0, py: 1 }}>
                  <ListItemIcon>
                    <ScheduleIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Received"
                    secondary={
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {formatTime(message.received_at)}
                      </Typography>
                    }
                  />
                </ListItem>

                <Divider sx={{ my: 1 }} />

                {/* Message ID */}
                <ListItem sx={{ px: 0, py: 1 }}>
                  <ListItemIcon>
                    <FileIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Message ID"
                    secondary={
                      <Typography variant="body1" sx={{ 
                        fontWeight: 'bold',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem'
                      }}>
                        {message.id}
                      </Typography>
                    }
                  />
                </ListItem>

                {/* Additional metadata */}
                {message.has_media && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <ListItem sx={{ px: 0, py: 1 }}>
                      <ListItemIcon>
                        {getMediaIcon(message.media_type)}
                      </ListItemIcon>
                      <ListItemText 
                        primary="Media Info"
                        secondary={
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              Type: {message.media_type}
                            </Typography>
                            {message.media_size && (
                              <Typography variant="body2" color="text.secondary">
                                Size: {formatFileSize(message.media_size)}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  </>
                )}
              </List>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ 
          p: 3, 
          borderTop: `1px solid ${BRAND_COLORS.border}`,
          backgroundColor: BRAND_COLORS.lightGray
        }}>
          <Button 
            onClick={onClose} 
            variant="outlined"
            sx={{ 
              borderColor: BRAND_COLORS.primary,
              color: BRAND_COLORS.primary,
              '&:hover': {
                borderColor: '#D10010',
                backgroundColor: 'rgba(229, 0, 18, 0.04)'
              }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Media Viewer Modal */}
      <Modal
        open={mediaModalOpen}
        onClose={handleCloseMediaModal}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          zIndex: 10000
        }}
      >
        <Paper sx={{
          maxWidth: '95vw',
          maxHeight: '95vh',
          p: 2,
          position: 'relative',
          backgroundColor: 'black',
          zIndex: 10000,
          borderRadius: 2,
          overflow: 'hidden'
        }}>
          <IconButton
            onClick={handleCloseMediaModal}
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
          {renderMediaContent()}
        </Paper>
      </Modal>
    </>
  );
};

export default MessageDetailModal; 