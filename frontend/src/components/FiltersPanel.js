import React from 'react';
import {
  Box, Paper, Typography, IconButton, FormControl, Select, MenuItem, 
  InputBase, Button, Divider, Chip, Slide, Backdrop
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';

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

const FiltersPanelContainer = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  right: 0,
  height: '100vh',
  width: '400px',
  zIndex: 1300,
  backgroundColor: BRAND_COLORS.white,
  boxShadow: `-8px 0 24px ${BRAND_COLORS.shadow}`,
  borderRadius: '16px 0 0 16px',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden'
}));

const FiltersPanelHeader = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${BRAND_COLORS.white} 0%, ${BRAND_COLORS.lightGray} 100%)`,
  borderBottom: `1px solid ${BRAND_COLORS.border}`,
  padding: '24px 32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}));

const SearchInput = styled(InputBase)(({ theme }) => ({
  backgroundColor: BRAND_COLORS.white,
  border: `1px solid ${BRAND_COLORS.border}`,
  borderRadius: 12,
  padding: '12px 16px',
  fontSize: '0.9rem',
  fontWeight: 500,
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: BRAND_COLORS.red,
    boxShadow: `0 2px 8px ${BRAND_COLORS.shadow}`
  },
  '&.Mui-focused': {
    borderColor: BRAND_COLORS.red,
    boxShadow: `0 0 0 2px ${BRAND_COLORS.red}40`
  }
}));

const FilterChip = styled(Chip)(({ theme }) => ({
  margin: '2px 4px',
  backgroundColor: BRAND_COLORS.red,
  color: BRAND_COLORS.white,
  fontWeight: 600,
  '&:hover': {
    backgroundColor: BRAND_COLORS.red,
    opacity: 0.9
  },
  '& .MuiChip-deleteIcon': {
    color: BRAND_COLORS.white,
    '&:hover': {
      color: BRAND_COLORS.white
    }
  }
}));

const FiltersPanel = ({
  open,
  onClose,
  groupFilter,
  senderFilter,
  search,
  onGroupFilterChange,
  onSenderFilterChange,
  onSearchChange,
  onClearFilters,
  allGroups,
  allSenders,
  loading = false
}) => {
  const activeFiltersCount = [groupFilter, senderFilter, search].filter(Boolean).length;

  return (
    <>
      <Backdrop
        open={open}
        onClick={onClose}
        sx={{
          zIndex: 1250,
          backgroundColor: 'rgba(0, 0, 0, 0.3)'
        }}
      />
      
      <Slide direction="left" in={open} mountOnEnter unmountOnExit>
        <FiltersPanelContainer>
          <FiltersPanelHeader>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FilterListIcon sx={{ color: BRAND_COLORS.red, fontSize: 24 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: BRAND_COLORS.darkGray }}>
                  Filters
                </Typography>
                {activeFiltersCount > 0 && (
                  <Typography variant="body2" sx={{ color: BRAND_COLORS.mediumGray }}>
                    {activeFiltersCount} active filter{activeFiltersCount > 1 ? 's' : ''}
                  </Typography>
                )}
              </Box>
            </Box>
            <IconButton 
              onClick={onClose}
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
          </FiltersPanelHeader>

          <Box sx={{ flex: 1, p: 3, overflowY: 'auto' }}>
            {/* Active Filters */}
            {activeFiltersCount > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                  Active Filters
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {groupFilter && (
                    <FilterChip
                      label={`Group: ${groupFilter}`}
                      onDelete={() => onGroupFilterChange('')}
                      size="small"
                    />
                  )}
                  {senderFilter && (
                    <FilterChip
                      label={`Sender: ${senderFilter}`}
                      onDelete={() => onSenderFilterChange('')}
                      size="small"
                    />
                  )}
                  {search && (
                    <FilterChip
                      label={`Search: ${search}`}
                      onDelete={() => onSearchChange('')}
                      size="small"
                    />
                  )}
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={onClearFilters}
                  startIcon={<ClearIcon />}
                  sx={{
                    color: BRAND_COLORS.mediumGray,
                    borderColor: BRAND_COLORS.border,
                    '&:hover': {
                      borderColor: BRAND_COLORS.red,
                      color: BRAND_COLORS.red
                    }
                  }}
                >
                  Clear All
                </Button>
                <Divider sx={{ my: 3 }} />
              </Box>
            )}

            {/* Search Filter */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Search Messages
              </Typography>
              <SearchInput
                placeholder="Search in message content..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                startAdornment={
                  <SearchIcon sx={{ 
                    color: BRAND_COLORS.mediumGray, 
                    mr: 1,
                    fontSize: 20
                  }} />
                }
                fullWidth
              />
            </Box>

            {/* Group Filter */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Filter by Group
              </Typography>
              <FormControl fullWidth>
                <Select
                  value={groupFilter}
                  onChange={(e) => onGroupFilterChange(e.target.value)}
                  displayEmpty
                  input={<SearchInput />}
                  sx={{
                    '& .MuiSelect-select': {
                      padding: '12px 16px'
                    }
                  }}
                >
                  <MenuItem value="">All Groups</MenuItem>
                  {allGroups.map((group) => (
                    <MenuItem key={group} value={group}>
                      {group}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Sender Filter */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Filter by Sender
              </Typography>
              <FormControl fullWidth>
                <Select
                  value={senderFilter}
                  onChange={(e) => onSenderFilterChange(e.target.value)}
                  displayEmpty
                  input={<SearchInput />}
                  sx={{
                    '& .MuiSelect-select': {
                      padding: '12px 16px'
                    }
                  }}
                >
                  <MenuItem value="">All Senders</MenuItem>
                  {allSenders.map((sender) => (
                    <MenuItem key={sender} value={sender}>
                      {sender}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Quick Filters */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Quick Filters
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => onSearchChange('complaint')}
                  sx={{
                    justifyContent: 'flex-start',
                    color: BRAND_COLORS.darkGray,
                    borderColor: BRAND_COLORS.border,
                    '&:hover': {
                      borderColor: BRAND_COLORS.red,
                      color: BRAND_COLORS.red
                    }
                  }}
                >
                  Messages with complaints
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => onSearchChange('booking')}
                  sx={{
                    justifyContent: 'flex-start',
                    color: BRAND_COLORS.darkGray,
                    borderColor: BRAND_COLORS.border,
                    '&:hover': {
                      borderColor: BRAND_COLORS.red,
                      color: BRAND_COLORS.red
                    }
                  }}
                >
                  Booking related messages
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => onSearchChange('urgent')}
                  sx={{
                    justifyContent: 'flex-start',
                    color: BRAND_COLORS.darkGray,
                    borderColor: BRAND_COLORS.border,
                    '&:hover': {
                      borderColor: BRAND_COLORS.red,
                      color: BRAND_COLORS.red
                    }
                  }}
                >
                  Urgent messages
                </Button>
              </Box>
            </Box>
          </Box>

          {/* Footer */}
          <Box sx={{ 
            p: 3, 
            borderTop: `1px solid ${BRAND_COLORS.border}`,
            backgroundColor: BRAND_COLORS.lightGray
          }}>
            <Typography variant="body2" sx={{ color: BRAND_COLORS.mediumGray, textAlign: 'center' }}>
              {loading ? 'Applying filters...' : 'Filters applied in real-time'}
            </Typography>
          </Box>
        </FiltersPanelContainer>
      </Slide>
    </>
  );
};

export default FiltersPanel; 