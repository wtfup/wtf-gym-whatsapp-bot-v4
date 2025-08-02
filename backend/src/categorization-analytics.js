const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

const prisma = new PrismaClient();

/**
 * Advanced Categorization Distribution Analytics Engine
 * 
 * Provides comprehensive analytics on message categorization patterns,
 * distribution trends, and business insights for gym operations.
 */
class CategorizationAnalytics {
  constructor() {
    this.CATEGORIES = ['INSTRUCTION', 'ESCALATION', 'COMPLAINT', 'URGENT', 'CASUAL'];
    this.TIME_PERIODS = ['hourly', 'daily', 'weekly', 'monthly'];
    
    // Business insights thresholds
    this.INSIGHTS_THRESHOLDS = {
      high_escalation_rate: 0.15,
      high_complaint_rate: 0.25,
      low_instruction_engagement: 0.10,
      urgent_spike_threshold: 5, // messages
      unusual_pattern_deviation: 0.3
    };
  }

  /**
   * Get comprehensive categorization distribution analytics
   */
  async getCategorization Analytics(timeframe = 30, period = 'daily') {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - timeframe);

      // Get all messages within timeframe
      const messages = await prisma.message.findMany({
        where: {
          timestamp: { gte: cutoffDate },
          advanced_category: { not: null }
        },
        select: {
          id: true,
          advanced_category: true,
          escalation_score: true,
          timestamp: true,
          chatName: true,
          fromNumber: true,
          confidence: true,
          business_context: true,
          repetition_count: true
        },
        orderBy: { timestamp: 'asc' }
      });

      const analytics = {
        overview: await this.calculateOverviewMetrics(messages),
        distribution: await this.calculateDistribution(messages),
        temporal_trends: await this.calculateTemporalTrends(messages, period),
        category_insights: await this.calculateCategoryInsights(messages),
        business_patterns: await this.identifyBusinessPatterns(messages),
        escalation_analysis: await this.analyzeEscalationPatterns(messages),
        comparative_analysis: await this.getComparativeAnalysis(messages, timeframe),
        recommendations: await this.generateBusinessRecommendations(messages),
        timeframe,
        period,
        generated_at: new Date()
      };

      return analytics;
    } catch (error) {
      logger.error('❌ CATEGORIZATION ANALYTICS: Failed to generate analytics', error);
      throw error;
    }
  }

  /**
   * Calculate overview metrics
   */
  async calculateOverviewMetrics(messages) {
    const totalMessages = messages.length;
    const categorizedMessages = messages.filter(m => m.advanced_category).length;
    const avgConfidence = messages.reduce((sum, m) => sum + (m.confidence || 0), 0) / totalMessages;
    const avgEscalationScore = messages.reduce((sum, m) => sum + (m.escalation_score || 0), 0) / totalMessages;

    // Category counts
    const categoryCounts = {};
    this.CATEGORIES.forEach(cat => {
      categoryCounts[cat] = messages.filter(m => m.advanced_category === cat).length;
    });

    return {
      total_messages: totalMessages,
      categorized_messages: categorizedMessages,
      categorization_rate: totalMessages > 0 ? categorizedMessages / totalMessages : 0,
      avg_confidence: avgConfidence,
      avg_escalation_score: avgEscalationScore,
      category_counts: categoryCounts,
      most_common_category: Object.entries(categoryCounts).reduce((max, [cat, count]) => 
        count > (categoryCounts[max] || 0) ? cat : max, 'CASUAL'
      ),
      unique_senders: new Set(messages.map(m => m.fromNumber)).size,
      unique_groups: new Set(messages.map(m => m.chatName)).size
    };
  }

  /**
   * Calculate category distribution with percentages
   */
  async calculateDistribution(messages) {
    const totalMessages = messages.length;
    
    const distribution = this.CATEGORIES.map(category => {
      const categoryMessages = messages.filter(m => m.advanced_category === category);
      const count = categoryMessages.length;
      const percentage = totalMessages > 0 ? (count / totalMessages) * 100 : 0;
      
      // Calculate sub-metrics for each category
      const avgConfidence = categoryMessages.length > 0 ? 
        categoryMessages.reduce((sum, m) => sum + (m.confidence || 0), 0) / categoryMessages.length : 0;
      
      const avgEscalationScore = categoryMessages.length > 0 ?
        categoryMessages.reduce((sum, m) => sum + (m.escalation_score || 0), 0) / categoryMessages.length : 0;

      const repeatedMessages = categoryMessages.filter(m => (m.repetition_count || 0) > 1).length;

      return {
        category,
        count,
        percentage: parseFloat(percentage.toFixed(2)),
        avg_confidence: parseFloat(avgConfidence.toFixed(3)),
        avg_escalation_score: parseFloat(avgEscalationScore.toFixed(3)),
        repeated_messages: repeatedMessages,
        repeat_rate: count > 0 ? (repeatedMessages / count) * 100 : 0,
        unique_senders: new Set(categoryMessages.map(m => m.fromNumber)).size
      };
    });

    return distribution.sort((a, b) => b.count - a.count);
  }

  /**
   * Calculate temporal trends
   */
  async calculateTemporalTrends(messages, period) {
    const trends = {};
    
    // Group messages by time period
    const groupedData = this.groupMessagesByPeriod(messages, period);
    
    // Calculate trends for each category
    this.CATEGORIES.forEach(category => {
      trends[category] = Object.entries(groupedData).map(([timePeriod, periodMessages]) => {
        const categoryCount = periodMessages.filter(m => m.advanced_category === category).length;
        const totalInPeriod = periodMessages.length;
        
        return {
          period: timePeriod,
          count: categoryCount,
          percentage: totalInPeriod > 0 ? (categoryCount / totalInPeriod) * 100 : 0,
          total_messages: totalInPeriod
        };
      }).sort((a, b) => new Date(a.period) - new Date(b.period));
    });

    // Calculate overall trend direction for each category
    const trendAnalysis = {};
    this.CATEGORIES.forEach(category => {
      const categoryTrend = trends[category];
      if (categoryTrend.length >= 2) {
        const recent = categoryTrend.slice(-3);
        const older = categoryTrend.slice(0, 3);
        
        const recentAvg = recent.reduce((sum, t) => sum + t.percentage, 0) / recent.length;
        const olderAvg = older.reduce((sum, t) => sum + t.percentage, 0) / older.length;
        
        const change = recentAvg - olderAvg;
        trendAnalysis[category] = {
          direction: change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable',
          change_percentage: parseFloat(change.toFixed(2)),
          trend_strength: Math.abs(change) > 10 ? 'strong' : Math.abs(change) > 5 ? 'moderate' : 'weak'
        };
      } else {
        trendAnalysis[category] = { direction: 'insufficient_data', change_percentage: 0, trend_strength: 'none' };
      }
    });

    return {
      temporal_data: trends,
      trend_analysis: trendAnalysis
    };
  }

  /**
   * Group messages by time period
   */
  groupMessagesByPeriod(messages, period) {
    const grouped = {};
    
    messages.forEach(message => {
      const date = new Date(message.timestamp);
      let key;
      
      switch (period) {
        case 'hourly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
          break;
        case 'daily':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(message);
    });
    
    return grouped;
  }

  /**
   * Calculate detailed insights for each category
   */
  async calculateCategoryInsights(messages) {
    const insights = {};
    
    for (const category of this.CATEGORIES) {
      const categoryMessages = messages.filter(m => m.advanced_category === category);
      
      if (categoryMessages.length === 0) {
        insights[category] = {
          message_count: 0,
          insights: ['No messages in this category'],
          key_metrics: {},
          patterns: []
        };
        continue;
      }

      // Peak time analysis
      const hourlyDistribution = {};
      categoryMessages.forEach(msg => {
        const hour = new Date(msg.timestamp).getHours();
        hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
      });
      
      const peakHour = Object.entries(hourlyDistribution).reduce((max, [hour, count]) => 
        count > (hourlyDistribution[max] || 0) ? hour : max, '0'
      );

      // Confidence analysis
      const confidenceScores = categoryMessages.map(m => m.confidence || 0).filter(c => c > 0);
      const avgConfidence = confidenceScores.reduce((sum, c) => sum + c, 0) / confidenceScores.length || 0;
      const lowConfidenceCount = confidenceScores.filter(c => c < 0.7).length;

      // Escalation analysis
      const escalationScores = categoryMessages.map(m => m.escalation_score || 0);
      const avgEscalation = escalationScores.reduce((sum, s) => sum + s, 0) / escalationScores.length;
      const highRiskCount = escalationScores.filter(s => s > 0.7).length;

      // Generate insights
      const categoryInsights = [];
      
      if (category === 'COMPLAINT' && categoryMessages.length > messages.length * 0.2) {
        categoryInsights.push('High complaint volume detected - consider proactive customer service measures');
      }
      
      if (category === 'URGENT' && categoryMessages.length > 5) {
        categoryInsights.push('Multiple urgent messages - review emergency response protocols');
      }
      
      if (category === 'ESCALATION' && avgEscalation > 0.6) {
        categoryInsights.push('High escalation risk - implement immediate intervention strategies');
      }
      
      if (lowConfidenceCount > categoryMessages.length * 0.3) {
        categoryInsights.push('Low AI confidence in categorization - may need manual review');
      }
      
      if (peakHour >= 9 && peakHour <= 17) {
        categoryInsights.push(`Peak activity during business hours (${peakHour}:00) - ensure adequate staffing`);
      } else {
        categoryInsights.push(`Peak activity outside business hours (${peakHour}:00) - consider extended support`);
      }

      insights[category] = {
        message_count: categoryMessages.length,
        key_metrics: {
          avg_confidence: parseFloat(avgConfidence.toFixed(3)),
          low_confidence_percentage: (lowConfidenceCount / confidenceScores.length * 100).toFixed(1),
          avg_escalation_score: parseFloat(avgEscalation.toFixed(3)),
          high_risk_percentage: (highRiskCount / categoryMessages.length * 100).toFixed(1),
          peak_hour: parseInt(peakHour),
          unique_senders: new Set(categoryMessages.map(m => m.fromNumber)).size,
          repeat_messages: categoryMessages.filter(m => (m.repetition_count || 0) > 1).length
        },
        insights: categoryInsights.length > 0 ? categoryInsights : ['No specific insights identified'],
        patterns: this.identifyPatternsInCategory(categoryMessages)
      };
    }
    
    return insights;
  }

  /**
   * Identify patterns within a category
   */
  identifyPatternsInCategory(messages) {
    const patterns = [];
    
    // Identify frequent senders
    const senderCounts = {};
    messages.forEach(msg => {
      senderCounts[msg.fromNumber] = (senderCounts[msg.fromNumber] || 0) + 1;
    });
    
    const frequentSenders = Object.entries(senderCounts).filter(([_, count]) => count > 2);
    if (frequentSenders.length > 0) {
      patterns.push(`${frequentSenders.length} senders with multiple messages`);
    }
    
    // Identify time clustering
    const timestamps = messages.map(m => new Date(m.timestamp).getTime()).sort();
    const clusters = this.findTimeClusters(timestamps, 3600000); // 1 hour clusters
    if (clusters.length > 1) {
      patterns.push(`Messages clustered in ${clusters.length} time periods`);
    }
    
    // Identify high escalation periods
    const highEscalationMessages = messages.filter(m => (m.escalation_score || 0) > 0.7);
    if (highEscalationMessages.length > messages.length * 0.3) {
      patterns.push('High concentration of escalation-risk messages');
    }
    
    return patterns;
  }

  /**
   * Find time clusters in timestamps
   */
  findTimeClusters(timestamps, threshold) {
    if (timestamps.length === 0) return [];
    
    const clusters = [];
    let currentCluster = [timestamps[0]];
    
    for (let i = 1; i < timestamps.length; i++) {
      if (timestamps[i] - timestamps[i-1] <= threshold) {
        currentCluster.push(timestamps[i]);
      } else {
        clusters.push(currentCluster);
        currentCluster = [timestamps[i]];
      }
    }
    clusters.push(currentCluster);
    
    return clusters.filter(cluster => cluster.length > 1);
  }

  /**
   * Identify business patterns
   */
  async identifyBusinessPatterns(messages) {
    const patterns = {
      operational_insights: [],
      customer_behavior: [],
      system_performance: [],
      risk_indicators: []
    };

    // Operational insights
    const totalMessages = messages.length;
    const complaintRate = messages.filter(m => m.advanced_category === 'COMPLAINT').length / totalMessages;
    const urgentRate = messages.filter(m => m.advanced_category === 'URGENT').length / totalMessages;
    const escalationRate = messages.filter(m => m.advanced_category === 'ESCALATION').length / totalMessages;

    if (complaintRate > this.INSIGHTS_THRESHOLDS.high_complaint_rate) {
      patterns.operational_insights.push({
        type: 'high_complaint_rate',
        severity: 'warning',
        description: `High complaint rate (${(complaintRate * 100).toFixed(1)}%) indicates service quality issues`,
        recommendation: 'Review facility maintenance and staff training programs'
      });
    }

    if (urgentRate > 0.05) {
      patterns.operational_insights.push({
        type: 'high_urgent_rate',
        severity: 'critical',
        description: `Elevated urgent message rate (${(urgentRate * 100).toFixed(1)}%) suggests safety concerns`,
        recommendation: 'Implement immediate safety protocol review'
      });
    }

    // Customer behavior patterns
    const uniqueSenders = new Set(messages.map(m => m.fromNumber)).size;
    const avgMessagesPerSender = totalMessages / uniqueSenders;
    
    if (avgMessagesPerSender > 3) {
      patterns.customer_behavior.push({
        type: 'high_interaction_rate',
        description: `High average messages per customer (${avgMessagesPerSender.toFixed(1)})`,
        implication: 'Customers may need additional support or information'
      });
    }

    // System performance patterns
    const lowConfidenceMessages = messages.filter(m => (m.confidence || 0) < 0.7).length;
    const lowConfidenceRate = lowConfidenceMessages / totalMessages;
    
    if (lowConfidenceRate > 0.3) {
      patterns.system_performance.push({
        type: 'low_ai_confidence',
        severity: 'warning',
        description: `High rate of low-confidence categorizations (${(lowConfidenceRate * 100).toFixed(1)}%)`,
        recommendation: 'Consider AI model retraining or rule refinement'
      });
    }

    // Risk indicators
    const highRiskMessages = messages.filter(m => (m.escalation_score || 0) > 0.8).length;
    if (highRiskMessages > 5) {
      patterns.risk_indicators.push({
        type: 'escalation_risk',
        severity: 'critical',
        count: highRiskMessages,
        description: 'Multiple high-risk escalation messages detected',
        action_required: 'Immediate management intervention recommended'
      });
    }

    return patterns;
  }

  /**
   * Analyze escalation patterns
   */
  async analyzeEscalationPatterns(messages) {
    const escalationMessages = messages.filter(m => (m.escalation_score || 0) > 0.3);
    
    if (escalationMessages.length === 0) {
      return {
        total_escalations: 0,
        escalation_rate: 0,
        severity_distribution: {},
        temporal_patterns: [],
        risk_assessment: 'low'
      };
    }

    // Severity distribution
    const severityDistribution = {
      critical: escalationMessages.filter(m => m.escalation_score >= 0.8).length,
      high: escalationMessages.filter(m => m.escalation_score >= 0.6 && m.escalation_score < 0.8).length,
      medium: escalationMessages.filter(m => m.escalation_score >= 0.3 && m.escalation_score < 0.6).length
    };

    // Temporal patterns
    const hourlyEscalations = {};
    escalationMessages.forEach(msg => {
      const hour = new Date(msg.timestamp).getHours();
      hourlyEscalations[hour] = (hourlyEscalations[hour] || 0) + 1;
    });

    const temporalPatterns = Object.entries(hourlyEscalations)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count);

    // Risk assessment
    const criticalRate = severityDistribution.critical / messages.length;
    const riskAssessment = 
      criticalRate > 0.05 ? 'critical' :
      criticalRate > 0.02 ? 'high' :
      escalationMessages.length / messages.length > 0.15 ? 'medium' : 'low';

    return {
      total_escalations: escalationMessages.length,
      escalation_rate: (escalationMessages.length / messages.length * 100).toFixed(2),
      severity_distribution: severityDistribution,
      temporal_patterns: temporalPatterns.slice(0, 5), // Top 5 hours
      risk_assessment: riskAssessment,
      avg_escalation_score: (escalationMessages.reduce((sum, m) => sum + m.escalation_score, 0) / escalationMessages.length).toFixed(3)
    };
  }

  /**
   * Get comparative analysis
   */
  async getComparativeAnalysis(currentMessages, timeframe) {
    try {
      // Get previous period data for comparison
      const previousCutoff = new Date();
      previousCutoff.setDate(previousCutoff.getDate() - (timeframe * 2));
      const currentCutoff = new Date();
      currentCutoff.setDate(currentCutoff.getDate() - timeframe);

      const previousMessages = await prisma.message.findMany({
        where: {
          timestamp: { 
            gte: previousCutoff, 
            lt: currentCutoff 
          },
          advanced_category: { not: null }
        },
        select: {
          advanced_category: true,
          escalation_score: true,
          confidence: true
        }
      });

      // Compare metrics
      const currentDistribution = this.getDistributionPercentages(currentMessages);
      const previousDistribution = this.getDistributionPercentages(previousMessages);

      const comparison = {};
      this.CATEGORIES.forEach(category => {
        const currentPct = currentDistribution[category] || 0;
        const previousPct = previousDistribution[category] || 0;
        const change = currentPct - previousPct;
        
        comparison[category] = {
          current_percentage: parseFloat(currentPct.toFixed(2)),
          previous_percentage: parseFloat(previousPct.toFixed(2)),
          change_percentage: parseFloat(change.toFixed(2)),
          trend: change > 2 ? 'increasing' : change < -2 ? 'decreasing' : 'stable',
          significance: Math.abs(change) > 5 ? 'significant' : Math.abs(change) > 2 ? 'moderate' : 'minimal'
        };
      });

      return comparison;
    } catch (error) {
      logger.warning('⚠️ CATEGORIZATION ANALYTICS: Could not generate comparative analysis', error);
      return {};
    }
  }

  /**
   * Get distribution percentages
   */
  getDistributionPercentages(messages) {
    const total = messages.length;
    const distribution = {};
    
    this.CATEGORIES.forEach(category => {
      const count = messages.filter(m => m.advanced_category === category).length;
      distribution[category] = total > 0 ? (count / total) * 100 : 0;
    });
    
    return distribution;
  }

  /**
   * Generate business recommendations
   */
  async generateBusinessRecommendations(messages) {
    const recommendations = [];
    
    const totalMessages = messages.length;
    const distribution = this.getDistributionPercentages(messages);
    
    // High complaint rate recommendations
    if (distribution.COMPLAINT > 25) {
      recommendations.push({
        priority: 'high',
        category: 'customer_service',
        issue: 'High complaint volume',
        recommendation: 'Implement proactive customer communication and facility maintenance checks',
        expected_impact: 'Reduce complaint rate by 15-20%'
      });
    }
    
    // High escalation recommendations
    if (distribution.ESCALATION > 10) {
      recommendations.push({
        priority: 'critical',
        category: 'management',
        issue: 'Elevated escalation patterns',
        recommendation: 'Deploy additional customer service staff and escalation response protocols',
        expected_impact: 'Faster resolution times and improved customer satisfaction'
      });
    }
    
    // Low instruction engagement
    if (distribution.INSTRUCTION < 10 && totalMessages > 50) {
      recommendations.push({
        priority: 'medium',
        category: 'engagement',
        issue: 'Low instructional message volume',
        recommendation: 'Increase proactive customer education and equipment guidance',
        expected_impact: 'Improved customer experience and reduced confusion'
      });
    }
    
    // High urgent message rate
    if (distribution.URGENT > 5) {
      recommendations.push({
        priority: 'critical',
        category: 'safety',
        issue: 'High urgent message rate',
        recommendation: 'Review safety protocols and implement preventive maintenance schedule',
        expected_impact: 'Enhanced safety and reduced emergency situations'
      });
    }
    
    // AI performance recommendations
    const lowConfidenceMessages = messages.filter(m => (m.confidence || 0) < 0.7).length;
    if (lowConfidenceMessages > totalMessages * 0.3) {
      recommendations.push({
        priority: 'medium',
        category: 'system_optimization',
        issue: 'Low AI categorization confidence',
        recommendation: 'Retrain AI models with recent data and refine categorization rules',
        expected_impact: 'Improved automated categorization accuracy'
      });
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Export analytics to various formats
   */
  async exportAnalytics(analytics, format = 'json') {
    try {
      switch (format) {
        case 'json':
          return JSON.stringify(analytics, null, 2);
        
        case 'csv':
          return this.convertToCSV(analytics);
        
        case 'summary':
          return this.generateExecutiveSummary(analytics);
        
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      logger.error('❌ CATEGORIZATION ANALYTICS: Failed to export analytics', error);
      throw error;
    }
  }

  /**
   * Convert analytics to CSV format
   */
  convertToCSV(analytics) {
    const csvData = [];
    
    // Header
    csvData.push('Category,Count,Percentage,Avg_Confidence,Avg_Escalation_Score,Unique_Senders');
    
    // Distribution data
    analytics.distribution.forEach(item => {
      csvData.push([
        item.category,
        item.count,
        item.percentage,
        item.avg_confidence,
        item.avg_escalation_score,
        item.unique_senders
      ].join(','));
    });
    
    return csvData.join('\n');
  }

  /**
   * Generate executive summary
   */
  generateExecutiveSummary(analytics) {
    const summary = [];
    
    summary.push('=== CATEGORIZATION ANALYTICS EXECUTIVE SUMMARY ===\n');
    
    summary.push(`Analysis Period: Last ${analytics.timeframe} days`);
    summary.push(`Total Messages Analyzed: ${analytics.overview.total_messages}`);
    summary.push(`Categorization Rate: ${(analytics.overview.categorization_rate * 100).toFixed(1)}%\n`);
    
    summary.push('KEY FINDINGS:');
    summary.push(`• Most Common Category: ${analytics.overview.most_common_category}`);
    summary.push(`• Average AI Confidence: ${(analytics.overview.avg_confidence * 100).toFixed(1)}%`);
    summary.push(`• Average Escalation Risk: ${(analytics.overview.avg_escalation_score * 100).toFixed(1)}%\n`);
    
    summary.push('DISTRIBUTION BREAKDOWN:');
    analytics.distribution.forEach(item => {
      summary.push(`• ${item.category}: ${item.count} messages (${item.percentage}%)`);
    });
    
    summary.push('\nRECOMMENDations:');
    analytics.recommendations.slice(0, 3).forEach((rec, index) => {
      summary.push(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.recommendation}`);
    });
    
    summary.push(`\nGenerated: ${new Date().toLocaleString()}`);
    
    return summary.join('\n');
  }
}

module.exports = CategorizationAnalytics;