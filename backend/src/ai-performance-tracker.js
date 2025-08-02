const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

const prisma = new PrismaClient();

/**
 * AI Performance Accuracy Tracking Engine
 * 
 * Tracks and analyzes the accuracy and performance of AI categorization
 * decisions across multiple engines and provides detailed analytics.
 */
class AIPerformanceTracker {
  constructor() {
    this.performanceMetrics = {
      accuracy: 0,
      precision: {},
      recall: {},
      f1_score: {},
      confidence_distribution: [],
      engine_performance: {},
      categorization_confusion_matrix: {},
      temporal_accuracy_trends: []
    };

    // Performance thresholds for alerts
    this.PERFORMANCE_THRESHOLDS = {
      accuracy_critical: 0.7,  // Below 70% accuracy triggers alert
      accuracy_warning: 0.85,  // Below 85% accuracy shows warning
      confidence_low: 0.6,     // Low confidence threshold
      false_positive_rate: 0.15 // Maximum acceptable false positive rate
    };

    // Categories for performance tracking
    this.CATEGORIES = ['INSTRUCTION', 'ESCALATION', 'COMPLAINT', 'URGENT', 'CASUAL'];
  }

  /**
   * Track AI decision and store performance data
   */
  async trackAIDecision(messageId, aiResult, actualResult = null, feedback = null) {
    try {
      const performanceRecord = {
        message_id: messageId,
        ai_category: aiResult.advanced_category || aiResult.category,
        ai_confidence: aiResult.confidence || aiResult.final_confidence || 0,
        ai_engines_used: JSON.stringify(aiResult.engines_used || []),
        processing_time: aiResult.processing_time || 0,
        actual_category: actualResult?.category || null,
        is_correct: actualResult ? (aiResult.advanced_category === actualResult.category) : null,
        human_feedback: feedback,
        feedback_timestamp: feedback ? new Date() : null,
        created_at: new Date()
      };

      // Store in database
      await prisma.aiAnalysisPerformance.create({
        data: performanceRecord
      });

      // Update real-time metrics
      await this.updatePerformanceMetrics();

      logger.success(`✅ AI PERFORMANCE: Tracked decision for message ${messageId}`);
      
      return performanceRecord;
    } catch (error) {
      logger.error('❌ AI PERFORMANCE: Failed to track AI decision', error);
      throw error;
    }
  }

  /**
   * Calculate comprehensive performance metrics
   */
  async calculatePerformanceMetrics(timeframe = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - timeframe);

      // Get all performance records with human feedback
      const records = await prisma.aiAnalysisPerformance.findMany({
        where: {
          created_at: { gte: cutoffDate },
          is_correct: { not: null } // Only records with human validation
        },
        orderBy: { created_at: 'desc' }
      });

      if (records.length === 0) {
        return this.getDefaultMetrics();
      }

      // Calculate overall accuracy
      const correctPredictions = records.filter(r => r.is_correct).length;
      const totalPredictions = records.length;
      const overallAccuracy = correctPredictions / totalPredictions;

      // Calculate per-category metrics
      const categoryMetrics = {};
      
      for (const category of this.CATEGORIES) {
        const categoryRecords = records.filter(r => r.ai_category === category);
        const truePositives = categoryRecords.filter(r => r.is_correct).length;
        const falsePositives = categoryRecords.filter(r => !r.is_correct).length;
        const falseNegatives = records.filter(r => r.actual_category === category && r.ai_category !== category).length;
        const trueNegatives = records.filter(r => r.actual_category !== category && r.ai_category !== category).length;

        const precision = truePositives / (truePositives + falsePositives) || 0;
        const recall = truePositives / (truePositives + falseNegatives) || 0;
        const f1Score = 2 * (precision * recall) / (precision + recall) || 0;

        categoryMetrics[category] = {
          precision,
          recall,
          f1_score: f1Score,
          true_positives: truePositives,
          false_positives: falsePositives,
          false_negatives: falseNegatives,
          true_negatives: trueNegatives,
          accuracy: (truePositives + trueNegatives) / records.length || 0
        };
      }

      // Calculate confidence distribution
      const confidenceRanges = {
        'Very High (90-100%)': records.filter(r => r.ai_confidence >= 0.9).length,
        'High (80-89%)': records.filter(r => r.ai_confidence >= 0.8 && r.ai_confidence < 0.9).length,
        'Medium (70-79%)': records.filter(r => r.ai_confidence >= 0.7 && r.ai_confidence < 0.8).length,
        'Low (60-69%)': records.filter(r => r.ai_confidence >= 0.6 && r.ai_confidence < 0.7).length,
        'Very Low (<60%)': records.filter(r => r.ai_confidence < 0.6).length
      };

      const confidenceDistribution = Object.entries(confidenceRanges).map(([range, count]) => ({
        range,
        count,
        percentage: (count / records.length * 100).toFixed(1),
        accuracy: this.calculateAccuracyForConfidenceRange(records, range)
      }));

      // Calculate daily accuracy trends
      const dailyTrends = this.calculateDailyTrends(records, timeframe);

      // Calculate engine-specific performance
      const enginePerformance = this.calculateEnginePerformance(records);

      // Create confusion matrix
      const confusionMatrix = this.createConfusionMatrix(records);

      const metrics = {
        timeframe,
        total_predictions: totalPredictions,
        overall_accuracy: overallAccuracy,
        category_metrics: categoryMetrics,
        confidence_distribution: confidenceDistribution,
        daily_trends: dailyTrends,
        engine_performance: enginePerformance,
        confusion_matrix: confusionMatrix,
        performance_alerts: this.generatePerformanceAlerts(overallAccuracy, categoryMetrics),
        last_updated: new Date()
      };

      // Store metrics for historical tracking
      await this.storeMetricsSnapshot(metrics);

      return metrics;
    } catch (error) {
      logger.error('❌ AI PERFORMANCE: Failed to calculate performance metrics', error);
      throw error;
    }
  }

  /**
   * Calculate accuracy for specific confidence ranges
   */
  calculateAccuracyForConfidenceRange(records, range) {
    let filtered;
    
    switch (range) {
      case 'Very High (90-100%)':
        filtered = records.filter(r => r.ai_confidence >= 0.9);
        break;
      case 'High (80-89%)':
        filtered = records.filter(r => r.ai_confidence >= 0.8 && r.ai_confidence < 0.9);
        break;
      case 'Medium (70-79%)':
        filtered = records.filter(r => r.ai_confidence >= 0.7 && r.ai_confidence < 0.8);
        break;
      case 'Low (60-69%)':
        filtered = records.filter(r => r.ai_confidence >= 0.6 && r.ai_confidence < 0.7);
        break;
      case 'Very Low (<60%)':
        filtered = records.filter(r => r.ai_confidence < 0.6);
        break;
      default:
        return 0;
    }

    if (filtered.length === 0) return 0;
    return (filtered.filter(r => r.is_correct).length / filtered.length * 100).toFixed(1);
  }

  /**
   * Calculate daily accuracy trends
   */
  calculateDailyTrends(records, timeframe) {
    const dailyData = {};
    
    // Group records by date
    records.forEach(record => {
      const date = new Date(record.created_at).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { total: 0, correct: 0 };
      }
      dailyData[date].total++;
      if (record.is_correct) {
        dailyData[date].correct++;
      }
    });

    // Create trend array
    const trends = [];
    for (let i = timeframe - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayData = dailyData[dateStr] || { total: 0, correct: 0 };
      trends.push({
        date: dateStr,
        accuracy: dayData.total > 0 ? (dayData.correct / dayData.total) : 0,
        total_predictions: dayData.total,
        correct_predictions: dayData.correct
      });
    }

    return trends;
  }

  /**
   * Calculate engine-specific performance
   */
  calculateEnginePerformance(records) {
    const engineStats = {};

    records.forEach(record => {
      try {
        const engines = JSON.parse(record.ai_engines_used || '[]');
        engines.forEach(engine => {
          if (!engineStats[engine]) {
            engineStats[engine] = { total: 0, correct: 0, avg_confidence: 0, total_confidence: 0 };
          }
          engineStats[engine].total++;
          engineStats[engine].total_confidence += record.ai_confidence;
          if (record.is_correct) {
            engineStats[engine].correct++;
          }
        });
      } catch (error) {
        // Skip invalid JSON
      }
    });

    // Calculate averages
    Object.keys(engineStats).forEach(engine => {
      const stats = engineStats[engine];
      stats.accuracy = stats.total > 0 ? stats.correct / stats.total : 0;
      stats.avg_confidence = stats.total > 0 ? stats.total_confidence / stats.total : 0;
      delete stats.total_confidence; // Remove temporary field
    });

    return engineStats;
  }

  /**
   * Create confusion matrix for categorization
   */
  createConfusionMatrix(records) {
    const matrix = {};
    
    // Initialize matrix
    this.CATEGORIES.forEach(predicted => {
      matrix[predicted] = {};
      this.CATEGORIES.forEach(actual => {
        matrix[predicted][actual] = 0;
      });
    });

    // Populate matrix
    records.forEach(record => {
      if (record.ai_category && record.actual_category) {
        matrix[record.ai_category][record.actual_category]++;
      }
    });

    return matrix;
  }

  /**
   * Generate performance alerts based on thresholds
   */
  generatePerformanceAlerts(overallAccuracy, categoryMetrics) {
    const alerts = [];

    // Overall accuracy alerts
    if (overallAccuracy < this.PERFORMANCE_THRESHOLDS.accuracy_critical) {
      alerts.push({
        type: 'critical',
        category: 'overall',
        message: `Critical: Overall accuracy is ${(overallAccuracy * 100).toFixed(1)}% (below ${(this.PERFORMANCE_THRESHOLDS.accuracy_critical * 100)}% threshold)`,
        value: overallAccuracy,
        threshold: this.PERFORMANCE_THRESHOLDS.accuracy_critical
      });
    } else if (overallAccuracy < this.PERFORMANCE_THRESHOLDS.accuracy_warning) {
      alerts.push({
        type: 'warning',
        category: 'overall',
        message: `Warning: Overall accuracy is ${(overallAccuracy * 100).toFixed(1)}% (below ${(this.PERFORMANCE_THRESHOLDS.accuracy_warning * 100)}% threshold)`,
        value: overallAccuracy,
        threshold: this.PERFORMANCE_THRESHOLDS.accuracy_warning
      });
    }

    // Category-specific alerts
    Object.entries(categoryMetrics).forEach(([category, metrics]) => {
      if (metrics.accuracy < this.PERFORMANCE_THRESHOLDS.accuracy_critical) {
        alerts.push({
          type: 'critical',
          category,
          message: `Critical: ${category} accuracy is ${(metrics.accuracy * 100).toFixed(1)}%`,
          value: metrics.accuracy,
          threshold: this.PERFORMANCE_THRESHOLDS.accuracy_critical
        });
      }

      // False positive rate alerts
      const falsePositiveRate = metrics.false_positives / (metrics.false_positives + metrics.true_negatives) || 0;
      if (falsePositiveRate > this.PERFORMANCE_THRESHOLDS.false_positive_rate) {
        alerts.push({
          type: 'warning',
          category,
          message: `High false positive rate for ${category}: ${(falsePositiveRate * 100).toFixed(1)}%`,
          value: falsePositiveRate,
          threshold: this.PERFORMANCE_THRESHOLDS.false_positive_rate
        });
      }
    });

    return alerts;
  }

  /**
   * Store metrics snapshot for historical tracking
   */
  async storeMetricsSnapshot(metrics) {
    try {
      await prisma.performanceSnapshot.create({
        data: {
          timeframe: metrics.timeframe,
          overall_accuracy: metrics.overall_accuracy,
          category_metrics: JSON.stringify(metrics.category_metrics),
          confidence_distribution: JSON.stringify(metrics.confidence_distribution),
          performance_alerts: JSON.stringify(metrics.performance_alerts),
          snapshot_date: new Date()
        }
      });
    } catch (error) {
      logger.warning('⚠️ AI PERFORMANCE: Failed to store metrics snapshot', error);
    }
  }

  /**
   * Update real-time performance metrics
   */
  async updatePerformanceMetrics() {
    try {
      // Calculate latest metrics for dashboard
      const latestMetrics = await this.calculatePerformanceMetrics(7); // Last 7 days
      this.performanceMetrics = latestMetrics;
      
      // Emit metrics update to frontend via WebSocket if available
      if (global.io) {
        global.io.emit('ai-performance-update', {
          accuracy: latestMetrics.overall_accuracy,
          alerts: latestMetrics.performance_alerts,
          timestamp: new Date()
        });
      }
    } catch (error) {
      logger.error('❌ AI PERFORMANCE: Failed to update real-time metrics', error);
    }
  }

  /**
   * Get default metrics structure
   */
  getDefaultMetrics() {
    return {
      timeframe: 30,
      total_predictions: 0,
      overall_accuracy: 0,
      category_metrics: {},
      confidence_distribution: [],
      daily_trends: [],
      engine_performance: {},
      confusion_matrix: {},
      performance_alerts: [],
      last_updated: new Date()
    };
  }

  /**
   * Process human feedback for AI decision
   */
  async processFeedback(messageId, humanCategory, feedback) {
    try {
      // Find the AI performance record
      const record = await prisma.aiAnalysisPerformance.findFirst({
        where: { message_id: messageId }
      });

      if (!record) {
        logger.warning(`⚠️ AI PERFORMANCE: No record found for message ${messageId}`);
        return null;
      }

      // Update with human feedback
      const updatedRecord = await prisma.aiAnalysisPerformance.update({
        where: { id: record.id },
        data: {
          actual_category: humanCategory,
          is_correct: record.ai_category === humanCategory,
          human_feedback: feedback,
          feedback_timestamp: new Date()
        }
      });

      // Update metrics
      await this.updatePerformanceMetrics();

      logger.success(`✅ AI PERFORMANCE: Processed feedback for message ${messageId}`);
      
      return updatedRecord;
    } catch (error) {
      logger.error('❌ AI PERFORMANCE: Failed to process feedback', error);
      throw error;
    }
  }

  /**
   * Get performance summary for dashboard
   */
  async getPerformanceSummary(timeframe = 7) {
    try {
      const metrics = await this.calculatePerformanceMetrics(timeframe);
      
      return {
        overall_accuracy: metrics.overall_accuracy,
        total_predictions: metrics.total_predictions,
        performance_grade: this.calculatePerformanceGrade(metrics.overall_accuracy),
        top_performing_category: this.getTopPerformingCategory(metrics.category_metrics),
        areas_for_improvement: this.getImprovementAreas(metrics.category_metrics),
        confidence_reliability: this.assessConfidenceReliability(metrics.confidence_distribution),
        recent_trends: {
          accuracy_trend: this.calculateAccuracyTrend(metrics.daily_trends),
          prediction_volume_trend: this.calculateVolumeTrend(metrics.daily_trends)
        }
      };
    } catch (error) {
      logger.error('❌ AI PERFORMANCE: Failed to get performance summary', error);
      throw error;
    }
  }

  /**
   * Calculate performance grade
   */
  calculatePerformanceGrade(accuracy) {
    if (accuracy >= 0.95) return 'A+';
    if (accuracy >= 0.90) return 'A';
    if (accuracy >= 0.85) return 'B+';
    if (accuracy >= 0.80) return 'B';
    if (accuracy >= 0.75) return 'C+';
    if (accuracy >= 0.70) return 'C';
    return 'D';
  }

  /**
   * Get top performing category
   */
  getTopPerformingCategory(categoryMetrics) {
    const categories = Object.entries(categoryMetrics);
    if (categories.length === 0) return null;
    
    return categories.reduce((best, [category, metrics]) => {
      return metrics.f1_score > (best?.f1_score || 0) ? 
        { category, ...metrics } : best;
    }, null);
  }

  /**
   * Get areas for improvement
   */
  getImprovementAreas(categoryMetrics) {
    return Object.entries(categoryMetrics)
      .filter(([_, metrics]) => metrics.accuracy < 0.8)
      .map(([category, metrics]) => ({
        category,
        accuracy: metrics.accuracy,
        issue: metrics.precision < metrics.recall ? 'High false positives' : 'Missing true positives'
      }))
      .sort((a, b) => a.accuracy - b.accuracy);
  }

  /**
   * Assess confidence reliability
   */
  assessConfidenceReliability(confidenceDistribution) {
    const highConfidenceAccuracy = parseFloat(
      confidenceDistribution.find(d => d.range === 'Very High (90-100%)')?.accuracy || 0
    );
    const lowConfidenceAccuracy = parseFloat(
      confidenceDistribution.find(d => d.range === 'Very Low (<60%)')?.accuracy || 0
    );
    
    return {
      high_confidence_accuracy: highConfidenceAccuracy,
      low_confidence_accuracy: lowConfidenceAccuracy,
      reliability_score: highConfidenceAccuracy - lowConfidenceAccuracy,
      assessment: highConfidenceAccuracy - lowConfidenceAccuracy > 30 ? 
        'Good confidence calibration' : 'Poor confidence calibration'
    };
  }

  /**
   * Calculate accuracy trend
   */
  calculateAccuracyTrend(dailyTrends) {
    if (dailyTrends.length < 2) return 'insufficient_data';
    
    const recent = dailyTrends.slice(-3).map(d => d.accuracy);
    const older = dailyTrends.slice(-7, -3).map(d => d.accuracy);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    const change = recentAvg - olderAvg;
    
    if (change > 0.05) return 'improving';
    if (change < -0.05) return 'declining';
    return 'stable';
  }

  /**
   * Calculate volume trend
   */
  calculateVolumeTrend(dailyTrends) {
    if (dailyTrends.length < 2) return 'insufficient_data';
    
    const recent = dailyTrends.slice(-3).map(d => d.total_predictions);
    const older = dailyTrends.slice(-7, -3).map(d => d.total_predictions);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    const change = (recentAvg - olderAvg) / olderAvg;
    
    if (change > 0.2) return 'increasing';
    if (change < -0.2) return 'decreasing';
    return 'stable';
  }
}

module.exports = AIPerformanceTracker;