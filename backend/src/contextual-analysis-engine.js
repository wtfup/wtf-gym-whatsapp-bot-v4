const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

const prisma = new PrismaClient();

/**
 * Contextual Analysis Engine for WTF Gym WhatsApp Bot
 * 
 * Performs deep historical analysis to detect:
 * - Message repetition patterns (3+ times = escalation)
 * - Sentiment trend analysis for escalation risk
 * - User behavior patterns and escalation tendencies
 * - Temporal patterns in message behavior
 */
class ContextualAnalysisEngine {
  constructor() {
    // Analysis configuration
    this.config = {
      HISTORICAL_WINDOW_DAYS: 30,
      MIN_MESSAGES_FOR_ANALYSIS: 3,
      REPETITION_THRESHOLD: 3,
      ESCALATION_SENTIMENT_THRESHOLD: 0.7,
      SIMILARITY_THRESHOLD: 0.6,
      TIME_DECAY_FACTOR: 0.8
    };

    // Pattern detection weights
    this.PATTERN_WEIGHTS = {
      REPETITION: 0.4,
      SENTIMENT_DECLINE: 0.3,
      TEMPORAL_CLUSTERING: 0.2,
      ESCALATION_KEYWORDS: 0.1
    };

    // Escalation risk factors
    this.ESCALATION_INDICATORS = {
      HIGH_FREQUENCY: 0.8,      // Multiple messages in short time
      SENTIMENT_DECLINE: 0.9,   // Positive → Negative trend
      KEYWORD_ESCALATION: 0.7,  // Frustration language increasing
      REPETITION_PATTERN: 0.85, // Same issue repeated
      IGNORED_MESSAGES: 0.9     // No responses to previous messages
    };

    // Text similarity algorithms
    this.textSimilarity = new TextSimilarityCalculator();
  }

  /**
   * Perform comprehensive contextual analysis
   */
  async analyzeContext(currentMessage, senderInfo, chatId) {
    try {
      const startTime = Date.now();
      logger.info(`🔍 CONTEXTUAL: Starting analysis for sender ${senderInfo.number}`);

      // Fetch historical message data
      const historicalData = await this.fetchHistoricalData(senderInfo.number, chatId);
      
      // Perform pattern analysis
      const patternAnalysis = await this.analyzePatterns(currentMessage, historicalData);
      
      // Calculate risk scores
      const riskAssessment = this.calculateRiskScores(patternAnalysis, historicalData);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(riskAssessment, patternAnalysis);
      
      // Store analysis results
      const analysisRecord = await this.storeAnalysisResults(
        currentMessage.id,
        senderInfo.number,
        chatId,
        patternAnalysis,
        riskAssessment,
        recommendations
      );

      const processingTime = Date.now() - startTime;
      
      logger.info(`✅ CONTEXTUAL: Analysis completed in ${processingTime}ms - Risk: ${riskAssessment.overall_risk.toFixed(2)}`);

      return {
        patterns: patternAnalysis,
        risk_assessment: riskAssessment,
        recommendations: recommendations,
        processing_time: processingTime,
        analysis_id: analysisRecord.id
      };

    } catch (error) {
      logger.error('❌ CONTEXTUAL: Analysis failed:', error);
      return this.generateFallbackAnalysis(currentMessage);
    }
  }

  /**
   * Fetch historical message data for analysis
   */
  async fetchHistoricalData(senderNumber, chatId) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.HISTORICAL_WINDOW_DAYS);

    try {
      // Get recent messages from this sender
      const senderMessages = await prisma.message.findMany({
        where: {
          fromNumber: senderNumber,
          timestamp: {
            gte: cutoffDate
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 100
      });

      // Get recent messages from this chat/group
      const chatMessages = await prisma.message.findMany({
        where: {
          chatId: chatId,
          timestamp: {
            gte: cutoffDate
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 50
      });

      // Get any existing contextual analyses
      const previousAnalyses = await prisma.contextualAnalysis.findMany({
        where: {
          sender_number: senderNumber,
          created_at: {
            gte: cutoffDate
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        take: 10
      });

      return {
        sender_messages: senderMessages,
        chat_messages: chatMessages,
        previous_analyses: previousAnalyses,
        analysis_window: this.config.HISTORICAL_WINDOW_DAYS
      };

    } catch (error) {
      logger.error('❌ HISTORICAL DATA: Fetch failed:', error);
      return { sender_messages: [], chat_messages: [], previous_analyses: [] };
    }
  }

  /**
   * Analyze message patterns for escalation indicators
   */
  async analyzePatterns(currentMessage, historicalData) {
    const patterns = {
      repetition: await this.analyzeRepetitionPatterns(currentMessage, historicalData.sender_messages),
      sentiment_trend: this.analyzeSentimentTrend(historicalData.sender_messages),
      temporal_clustering: this.analyzeTemporalPatterns(historicalData.sender_messages),
      escalation_keywords: this.analyzeEscalationKeywords(currentMessage, historicalData.sender_messages),
      response_patterns: this.analyzeResponsePatterns(historicalData.chat_messages, currentMessage.fromNumber),
      frequency_analysis: this.analyzeMessageFrequency(historicalData.sender_messages)
    };

    return patterns;
  }

  /**
   * Analyze repetition patterns (3+ similar messages = escalation)
   */
  async analyzeRepetitionPatterns(currentMessage, senderMessages) {
    const currentText = currentMessage.body.toLowerCase();
    const repetitionData = {
      similar_messages: [],
      repetition_count: 0,
      similarity_scores: [],
      exact_matches: 0,
      semantic_matches: 0,
      escalation_detected: false
    };

    for (const histMsg of senderMessages) {
      if (!histMsg.body || histMsg.id === currentMessage.id) continue;

      // Calculate similarity
      const similarity = this.textSimilarity.calculateSimilarity(
        currentText, 
        histMsg.body.toLowerCase()
      );

      if (similarity >= this.config.SIMILARITY_THRESHOLD) {
        repetitionData.similar_messages.push({
          id: histMsg.id,
          text: histMsg.body,
          timestamp: histMsg.timestamp,
          similarity: similarity,
          sentiment: histMsg.sentiment
        });
        
        repetitionData.similarity_scores.push(similarity);

        if (similarity >= 0.9) {
          repetitionData.exact_matches++;
        } else {
          repetitionData.semantic_matches++;
        }
      }
    }

    repetitionData.repetition_count = repetitionData.similar_messages.length;
    repetitionData.escalation_detected = repetitionData.repetition_count >= this.config.REPETITION_THRESHOLD;

    if (repetitionData.escalation_detected) {
      logger.warning(`🔄 REPETITION: Escalation detected - ${repetitionData.repetition_count} similar messages`);
    }

    return repetitionData;
  }

  /**
   * Analyze sentiment trend for escalation risk
   */
  analyzeSentimentTrend(senderMessages) {
    const trendData = {
      sentiment_sequence: [],
      trend_direction: 'stable',
      decline_detected: false,
      sentiment_volatility: 0,
      risk_score: 0
    };

    if (senderMessages.length < 3) {
      return trendData;
    }

    // Extract sentiment sequence (most recent first)
    const sentiments = senderMessages
      .filter(msg => msg.sentiment)
      .slice(0, 10)
      .map(msg => ({
        sentiment: msg.sentiment,
        timestamp: msg.timestamp,
        confidence: msg.confidence || 0.5
      }));

    trendData.sentiment_sequence = sentiments;

    if (sentiments.length < 3) {
      return trendData;
    }

    // Analyze trend direction
    const recent = sentiments.slice(0, 3);
    const negativeCount = recent.filter(s => s.sentiment === 'negative').length;
    const positiveCount = recent.filter(s => s.sentiment === 'positive').length;

    if (negativeCount >= 2) {
      trendData.trend_direction = 'declining';
      trendData.decline_detected = true;
      trendData.risk_score = 0.8;
    } else if (positiveCount >= 2) {
      trendData.trend_direction = 'improving';
      trendData.risk_score = 0.2;
    } else {
      trendData.trend_direction = 'stable';
      trendData.risk_score = 0.4;
    }

    // Calculate sentiment volatility
    const sentimentValues = sentiments.map(s => {
      switch(s.sentiment) {
        case 'positive': return 1;
        case 'negative': return -1;
        default: return 0;
      }
    });

    if (sentimentValues.length > 1) {
      const variance = this.calculateVariance(sentimentValues);
      trendData.sentiment_volatility = Math.min(variance, 1.0);
    }

    return trendData;
  }

  /**
   * Analyze temporal message patterns
   */
  analyzeTemporalPatterns(senderMessages) {
    const temporalData = {
      message_frequency: 0,
      burst_detected: false,
      time_gaps: [],
      clustering_score: 0,
      peak_hours: [],
      urgency_indicators: []
    };

    if (senderMessages.length < 2) {
      return temporalData;
    }

    // Calculate time gaps between messages
    const sortedMessages = senderMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    for (let i = 0; i < sortedMessages.length - 1; i++) {
      const gap = new Date(sortedMessages[i].timestamp) - new Date(sortedMessages[i + 1].timestamp);
      const gapMinutes = gap / (1000 * 60);
      temporalData.time_gaps.push(gapMinutes);
    }

    // Detect message bursts (multiple messages in short time)
    const shortGaps = temporalData.time_gaps.filter(gap => gap <= 15); // 15 minutes
    temporalData.burst_detected = shortGaps.length >= 3;
    
    if (temporalData.burst_detected) {
      temporalData.urgency_indicators.push('rapid_succession');
      logger.warning('⚡ TEMPORAL: Message burst detected - rapid succession');
    }

    // Calculate message frequency (messages per day)
    if (senderMessages.length > 0) {
      const timeSpan = new Date() - new Date(senderMessages[senderMessages.length - 1].timestamp);
      const days = timeSpan / (1000 * 60 * 60 * 24);
      temporalData.message_frequency = senderMessages.length / Math.max(days, 1);
    }

    return temporalData;
  }

  /**
   * Analyze escalation keywords and frustration language
   */
  analyzeEscalationKeywords(currentMessage, senderMessages) {
    const escalationData = {
      current_keywords: [],
      historical_progression: [],
      intensity_increase: false,
      frustration_level: 0,
      escalation_score: 0
    };

    // Escalation keyword patterns
    const ESCALATION_KEYWORDS = {
      MILD: ['again', 'still', 'yet', 'please', 'फिर से', 'अभी भी'],
      MODERATE: ['frustrated', 'annoyed', 'disappointed', 'परेशान', 'नाराज़'],
      SEVERE: ['angry', 'furious', 'fed up', 'terrible', 'worst', 'गुस्सा', 'बहुत खराब'],
      CRITICAL: ['never respond', 'always ignore', 'last time', 'complain', 'कभी नहीं सुनते', 'शिकायत']
    };

    // Analyze current message
    const currentText = currentMessage.body.toLowerCase();
    Object.entries(ESCALATION_KEYWORDS).forEach(([level, keywords]) => {
      keywords.forEach(keyword => {
        if (currentText.includes(keyword.toLowerCase())) {
          escalationData.current_keywords.push({ keyword, level });
        }
      });
    });

    // Analyze historical progression
    const recentMessages = senderMessages.slice(0, 10);
    recentMessages.forEach((msg, index) => {
      if (!msg.body) return;
      
      const msgText = msg.body.toLowerCase();
      const msgKeywords = [];
      
      Object.entries(ESCALATION_KEYWORDS).forEach(([level, keywords]) => {
        keywords.forEach(keyword => {
          if (msgText.includes(keyword.toLowerCase())) {
            msgKeywords.push({ keyword, level });
          }
        });
      });

      if (msgKeywords.length > 0) {
        escalationData.historical_progression.push({
          timestamp: msg.timestamp,
          keywords: msgKeywords,
          message_index: index
        });
      }
    });

    // Calculate escalation intensity
    const levelValues = { MILD: 1, MODERATE: 2, SEVERE: 3, CRITICAL: 4 };
    const currentIntensity = Math.max(...escalationData.current_keywords.map(k => levelValues[k.level] || 0), 0);
    
    if (escalationData.historical_progression.length > 0) {
      const pastIntensity = Math.max(...escalationData.historical_progression[0].keywords.map(k => levelValues[k.level] || 0), 0);
      escalationData.intensity_increase = currentIntensity > pastIntensity;
    }

    escalationData.frustration_level = currentIntensity / 4; // Normalize to 0-1
    escalationData.escalation_score = escalationData.intensity_increase ? 0.8 : escalationData.frustration_level * 0.6;

    return escalationData;
  }

  /**
   * Analyze response patterns to detect ignored messages
   */
  analyzeResponsePatterns(chatMessages, senderNumber) {
    const responseData = {
      sender_messages: 0,
      responses_received: 0,
      response_rate: 0,
      ignored_messages: [],
      average_response_time: 0,
      no_response_pattern: false
    };

    // Filter messages from sender and responses
    const senderMsgs = chatMessages.filter(msg => msg.fromNumber === senderNumber);
    const otherMsgs = chatMessages.filter(msg => msg.fromNumber !== senderNumber);

    responseData.sender_messages = senderMsgs.length;

    // Simple heuristic: if there's a message from someone else within 2 hours after sender's message
    senderMsgs.forEach(senderMsg => {
      const responseWindow = 2 * 60 * 60 * 1000; // 2 hours
      const msgTime = new Date(senderMsg.timestamp);
      
      const hasResponse = otherMsgs.some(otherMsg => {
        const otherTime = new Date(otherMsg.timestamp);
        return otherTime > msgTime && (otherTime - msgTime) <= responseWindow;
      });

      if (hasResponse) {
        responseData.responses_received++;
      } else {
        responseData.ignored_messages.push(senderMsg.id);
      }
    });

    responseData.response_rate = senderMsgs.length > 0 ? 
      responseData.responses_received / senderMsgs.length : 0;

    responseData.no_response_pattern = responseData.response_rate < 0.3 && senderMsgs.length >= 3;

    return responseData;
  }

  /**
   * Analyze message frequency patterns
   */
  analyzeMessageFrequency(senderMessages) {
    const frequencyData = {
      messages_last_hour: 0,
      messages_last_day: 0,
      messages_last_week: 0,
      frequency_increase: false,
      spam_detected: false
    };

    const now = new Date();
    const oneHour = new Date(now - 60 * 60 * 1000);
    const oneDay = new Date(now - 24 * 60 * 60 * 1000);
    const oneWeek = new Date(now - 7 * 24 * 60 * 60 * 1000);

    frequencyData.messages_last_hour = senderMessages.filter(msg => 
      new Date(msg.timestamp) >= oneHour).length;
    
    frequencyData.messages_last_day = senderMessages.filter(msg => 
      new Date(msg.timestamp) >= oneDay).length;
      
    frequencyData.messages_last_week = senderMessages.filter(msg => 
      new Date(msg.timestamp) >= oneWeek).length;

    // Detect unusual frequency patterns
    frequencyData.spam_detected = frequencyData.messages_last_hour >= 10;
    frequencyData.frequency_increase = frequencyData.messages_last_day > (frequencyData.messages_last_week / 7) * 2;

    return frequencyData;
  }

  /**
   * Calculate overall risk scores based on patterns
   */
  calculateRiskScores(patterns, historicalData) {
    const riskFactors = {
      repetition_risk: 0,
      sentiment_risk: 0,
      temporal_risk: 0,
      escalation_risk: 0,
      response_risk: 0,
      overall_risk: 0
    };

    // Repetition risk
    if (patterns.repetition.escalation_detected) {
      riskFactors.repetition_risk = 0.9;
    } else {
      riskFactors.repetition_risk = Math.min(patterns.repetition.repetition_count / this.config.REPETITION_THRESHOLD, 1.0) * 0.6;
    }

    // Sentiment risk
    riskFactors.sentiment_risk = patterns.sentiment_trend.risk_score;

    // Temporal risk
    riskFactors.temporal_risk = patterns.temporal_clustering.burst_detected ? 0.7 : 
      Math.min(patterns.frequency_analysis.messages_last_hour / 5, 1.0) * 0.5;

    // Escalation keyword risk
    riskFactors.escalation_risk = patterns.escalation_keywords.escalation_score;

    // Response pattern risk
    riskFactors.response_risk = patterns.response_patterns.no_response_pattern ? 0.8 : 
      (1 - patterns.response_patterns.response_rate) * 0.6;

    // Calculate weighted overall risk
    riskFactors.overall_risk = (
      riskFactors.repetition_risk * this.PATTERN_WEIGHTS.REPETITION +
      riskFactors.sentiment_risk * this.PATTERN_WEIGHTS.SENTIMENT_DECLINE +
      riskFactors.temporal_risk * this.PATTERN_WEIGHTS.TEMPORAL_CLUSTERING +
      riskFactors.escalation_risk * this.PATTERN_WEIGHTS.ESCALATION_KEYWORDS
    );

    return riskFactors;
  }

  /**
   * Generate actionable recommendations
   */
  generateRecommendations(riskAssessment, patterns) {
    const recommendations = {
      priority_level: 'LOW',
      recommended_actions: [],
      escalation_needed: false,
      routing_priority: 'NORMAL',
      response_urgency: 'NORMAL'
    };

    const overallRisk = riskAssessment.overall_risk;

    // Determine priority and actions based on risk level
    if (overallRisk >= 0.8) {
      recommendations.priority_level = 'CRITICAL';
      recommendations.escalation_needed = true;
      recommendations.routing_priority = 'IMMEDIATE';
      recommendations.response_urgency = 'URGENT';
      recommendations.recommended_actions.push(
        'IMMEDIATE_ESCALATION',
        'MANAGER_NOTIFICATION',
        'PRIORITY_ROUTING',
        'RESPONSE_REQUIRED_15MIN'
      );
    } else if (overallRisk >= 0.6) {
      recommendations.priority_level = 'HIGH';
      recommendations.escalation_needed = true;
      recommendations.routing_priority = 'HIGH';
      recommendations.response_urgency = 'HIGH';
      recommendations.recommended_actions.push(
        'ESCALATE_TO_SUPERVISOR',
        'PRIORITY_HANDLING',
        'RESPONSE_REQUIRED_1HR'
      );
    } else if (overallRisk >= 0.4) {
      recommendations.priority_level = 'MEDIUM';
      recommendations.routing_priority = 'MEDIUM';
      recommendations.response_urgency = 'MEDIUM';
      recommendations.recommended_actions.push(
        'MONITOR_CLOSELY',
        'STANDARD_ROUTING',
        'RESPONSE_REQUIRED_4HR'
      );
    }

    // Specific pattern-based recommendations
    if (patterns.repetition.escalation_detected) {
      recommendations.recommended_actions.push('ADDRESS_REPETITION_ISSUE');
    }

    if (patterns.sentiment_trend.decline_detected) {
      recommendations.recommended_actions.push('SENTIMENT_RECOVERY_PROTOCOL');
    }

    if (patterns.temporal_clustering.burst_detected) {
      recommendations.recommended_actions.push('URGENT_ATTENTION_NEEDED');
    }

    if (patterns.response_patterns.no_response_pattern) {
      recommendations.recommended_actions.push('IMPROVE_RESPONSE_TIME');
    }

    return recommendations;
  }

  /**
   * Store analysis results in database
   */
  async storeAnalysisResults(messageId, senderNumber, chatId, patterns, riskAssessment, recommendations) {
    try {
      const analysisRecord = await prisma.contextualAnalysis.create({
        data: {
          sender_number: senderNumber,
          chat_id: chatId,
          message_id: messageId,
          repetition_pattern: JSON.stringify(patterns.repetition),
          sentiment_trend: JSON.stringify(patterns.sentiment_trend),
          escalation_indicators: JSON.stringify(patterns.escalation_keywords),
          business_context: JSON.stringify({
            temporal_patterns: patterns.temporal_clustering,
            frequency_analysis: patterns.frequency_analysis,
            response_patterns: patterns.response_patterns
          }),
          analysis_confidence: Math.min(riskAssessment.overall_risk + 0.3, 1.0),
          pattern_type: this.determinePatternType(patterns, riskAssessment),
          risk_score: riskAssessment.overall_risk,
          recommended_action: recommendations.recommended_actions[0] || 'MONITOR',
          historical_context: JSON.stringify({
            analysis_window: this.config.HISTORICAL_WINDOW_DAYS,
            message_count: patterns.frequency_analysis.messages_last_week,
            risk_breakdown: riskAssessment
          })
        }
      });

      return analysisRecord;

    } catch (error) {
      logger.error('❌ CONTEXTUAL: Failed to store analysis:', error);
      return { id: null };
    }
  }

  /**
   * Determine primary pattern type
   */
  determinePatternType(patterns, riskAssessment) {
    if (patterns.repetition.escalation_detected) {
      return 'instruction_repetition';
    } else if (patterns.sentiment_trend.decline_detected) {
      return 'sentiment_decline';
    } else if (riskAssessment.escalation_risk >= 0.7) {
      return 'escalation_pattern';
    } else {
      return 'normal_pattern';
    }
  }

  /**
   * Generate fallback analysis when main analysis fails
   */
  generateFallbackAnalysis(currentMessage) {
    return {
      patterns: {
        repetition: { escalation_detected: false, repetition_count: 0 },
        sentiment_trend: { decline_detected: false, risk_score: 0.3 },
        escalation_keywords: { escalation_score: 0.2 }
      },
      risk_assessment: {
        overall_risk: 0.3,
        repetition_risk: 0.1,
        sentiment_risk: 0.3,
        escalation_risk: 0.2
      },
      recommendations: {
        priority_level: 'LOW',
        recommended_actions: ['MONITOR'],
        escalation_needed: false
      },
      fallback_used: true
    };
  }

  /**
   * Utility: Calculate variance for sentiment volatility
   */
  calculateVariance(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }
}

/**
 * Text Similarity Calculator for repetition detection
 */
class TextSimilarityCalculator {
  /**
   * Calculate similarity between two texts using multiple algorithms
   */
  calculateSimilarity(text1, text2) {
    // Jaccard similarity for word overlap
    const jaccardSim = this.jaccardSimilarity(text1, text2);
    
    // Levenshtein similarity for character-level comparison
    const levenshteinSim = this.levenshteinSimilarity(text1, text2);
    
    // Weighted combination
    return (jaccardSim * 0.7) + (levenshteinSim * 0.3);
  }

  /**
   * Jaccard similarity for word-level comparison
   */
  jaccardSimilarity(text1, text2) {
    const words1 = new Set(text1.split(/\s+/).filter(w => w.length > 2));
    const words2 = new Set(text2.split(/\s+/).filter(w => w.length > 2));
    
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    
    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  /**
   * Normalized Levenshtein similarity
   */
  levenshteinSimilarity(text1, text2) {
    const distance = this.levenshteinDistance(text1, text2);
    const maxLength = Math.max(text1.length, text2.length);
    
    return maxLength === 0 ? 1 : 1 - (distance / maxLength);
  }

  /**
   * Calculate Levenshtein distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}

module.exports = ContextualAnalysisEngine;