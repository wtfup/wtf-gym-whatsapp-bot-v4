/**
 * 🎣 useWhatsAppData Hook
 * 
 * Global React hook for accessing centralized WhatsApp data
 * Automatically syncs with backend Data Manager via Socket.IO
 * 
 * Usage:
 * const { groups, senders, messages, isLoading, forceRefresh } = useWhatsAppData();
 */

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3010';

export const useWhatsAppData = () => {
  const [data, setData] = useState({
    groups: [],
    senders: [],
    messages: [],
    contacts: [],
    isLoading: true,
    lastUpdate: null,
    isConnected: false,
    error: null
  });

  const [stats, setStats] = useState({
    groups: 0,
    senders: 0,
    messages: 0,
    contacts: 0,
    lastSync: null
  });

  // 📡 Setup Socket.IO listeners for real-time updates
  useEffect(() => {
    const socket = window.socket;
    
    if (!socket) {
      console.warn('⚠️ Socket.IO not available - real-time updates disabled');
      return;
    }

    // Listen for complete data updates
    const handleDataUpdate = (update) => {
      console.log('🔄 WhatsApp data update received:', update);
      
      setData(prev => ({
        ...prev,
        groups: update.data.groups || [],
        senders: update.data.senders || [],
        messages: update.data.messages || [],
        groupCount: update.data.groupCount,
        senderCount: update.data.senderCount,
        messageCount: update.data.messageCount,
        lastUpdate: update.data.lastUpdate,
        isConnected: update.data.isConnected,
        isLoading: false,
        error: null
      }));

      setStats({
        groups: update.data.groupCount || 0,
        senders: update.data.senderCount || 0,
        messages: update.data.messageCount || 0,
        contacts: update.data.contactCount || 0,
        lastSync: update.timestamp
      });
    };

    // Listen for new messages
    const handleNewMessage = (messageUpdate) => {
      console.log('📨 New message received:', messageUpdate);
      
      setData(prev => ({
        ...prev,
        messages: [messageUpdate.message, ...prev.messages.slice(0, 99)] // Keep only 100 latest
      }));
    };

    // Listen for status updates
    const handleStatusUpdate = (statusUpdate) => {
      console.log('📱 WhatsApp status update:', statusUpdate);
      
      setData(prev => ({
        ...prev,
        isConnected: statusUpdate.isConnected
      }));

      setStats(prev => ({
        ...prev,
        groups: statusUpdate.dataStats?.groups || prev.groups,
        senders: statusUpdate.dataStats?.senders || prev.senders,
        messages: statusUpdate.dataStats?.messages || prev.messages
      }));
    };

    // Listen for old data cleared (force logout)
    const handleOldDataCleared = (clearUpdate) => {
      console.log('🗑️ Old account data cleared:', clearUpdate);
      
      // Clear all local data
      setData({
        groups: [],
        senders: [],
        messages: [],
        contacts: [],
        isLoading: false,
        lastUpdate: null,
        isConnected: false,
        error: null
      });

      setStats({
        groups: 0,
        senders: 0,
        messages: 0,
        contacts: 0,
        lastSync: clearUpdate.timestamp
      });
    };

    // Listen for groups synced (new account)
    const handleGroupsSynced = (syncUpdate) => {
      console.log('🔄 Groups synced from new account:', syncUpdate);
      
      // Trigger data reload
      setTimeout(() => {
        loadInitialData();
      }, 1000);
    };

    // Add socket listeners
    socket.on('whatsapp_data_update', handleDataUpdate);
    socket.on('new_message', handleNewMessage);
    socket.on('whatsapp_status_update', handleStatusUpdate);
    socket.on('old_account_data_cleared', handleOldDataCleared);
    socket.on('groups_synced', handleGroupsSynced);

    // Cleanup listeners
    return () => {
      socket.off('whatsapp_data_update', handleDataUpdate);
      socket.off('new_message', handleNewMessage);
      socket.off('whatsapp_status_update', handleStatusUpdate);
      socket.off('old_account_data_cleared', handleOldDataCleared);
      socket.off('groups_synced', handleGroupsSynced);
    };
  }, []);

  // 📊 Load initial data from API
  const loadInitialData = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));

      // Load groups, senders, and stats in parallel
      const [groupsRes, sendersRes, statsRes] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/api/whatsapp-groups`), // Use cached data instead of fresh
        axios.get(`${API_BASE_URL}/api/whatsapp/senders`),
        axios.get(`${API_BASE_URL}/api/whatsapp/data-stats`)
      ]);

      const groups = groupsRes.status === 'fulfilled' ? groupsRes.value.data.groups || [] : [];
      const senders = sendersRes.status === 'fulfilled' ? sendersRes.value.data.senders || [] : [];
      const statsData = statsRes.status === 'fulfilled' ? statsRes.value.data.stats || {} : {};

      setData(prev => ({
        ...prev,
        groups: groups,
        senders: senders,
        lastUpdate: statsData.lastUpdate,
        isConnected: statsData.isConnected || false,
        isLoading: false,
        error: null
      }));

      setStats({
        groups: groups.length,
        senders: senders.length,
        messages: statsData.messages || 0,
        contacts: statsData.contacts || 0,
        lastSync: new Date().toISOString()
      });

      console.log(`✅ Initial data loaded: ${groups.length} groups, ${senders.length} senders`);

    } catch (error) {
      console.error('❌ Error loading initial WhatsApp data:', error);
      
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));
    }
  }, []);

  // 🔄 Force refresh data manually
  const forceRefresh = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await axios.post(`${API_BASE_URL}/api/whatsapp/force-refresh`);
      
      if (response.data.success) {
        console.log('✅ Force refresh completed:', response.data.stats);
        
        // Reload data after refresh
        setTimeout(() => {
          loadInitialData();
        }, 1000);
        
        return response.data.stats;
      } else {
        throw new Error(response.data.error || 'Force refresh failed');
      }

    } catch (error) {
      console.error('❌ Error during force refresh:', error);
      
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));
      
      throw error;
    }
  }, [loadInitialData]);

  // 📊 Get specific group by ID
  const getGroupById = useCallback((groupId) => {
    return data.groups.find(group => group.id === groupId) || null;
  }, [data.groups]);

  // 📧 Get specific sender by number
  const getSenderByNumber = useCallback((number) => {
    return data.senders.find(sender => sender.number === number) || null;
  }, [data.senders]);

  // 🔍 Filter groups by name
  const filterGroups = useCallback((searchTerm) => {
    if (!searchTerm) return data.groups;
    
    return data.groups.filter(group => 
      group.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data.groups]);

  // 🔍 Filter senders by name
  const filterSenders = useCallback((searchTerm) => {
    if (!searchTerm) return data.senders;
    
    return data.senders.filter(sender => 
      sender.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sender.number.includes(searchTerm)
    );
  }, [data.senders]);

  // Load initial data on mount
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  return {
    // Data
    groups: data.groups,
    senders: data.senders,
    messages: data.messages,
    contacts: data.contacts,
    
    // State
    isLoading: data.isLoading,
    isConnected: data.isConnected,
    lastUpdate: data.lastUpdate,
    error: data.error,
    
    // Stats
    stats,
    
    // Actions
    forceRefresh,
    reload: loadInitialData,
    
    // Utilities
    getGroupById,
    getSenderByNumber,
    filterGroups,
    filterSenders,
    
    // Counts (for easy access)
    groupCount: data.groups.length,
    senderCount: data.senders.length,
    messageCount: data.messages.length
  };
};

export default useWhatsAppData;