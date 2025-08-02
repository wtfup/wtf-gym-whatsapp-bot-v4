const AdvancedAICategorizer = require('./advanced-ai-categorizer');
const MultilingualEnhancementEngine = require('./multilingual-enhancement');
const ContextualAnalysisEngine = require('./contextual-analysis-engine');
const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

const prisma = new PrismaClient();

/**
 * Multi-Engine AI Pipeline for WTF Gym WhatsApp Bot
 * 
 * Orchestrates multiple AI engines for comprehensive message analysis:
 * 1. Primary AI: Advanced categorization with Together AI
 * 2. Contextual Engine: Historical pattern analysis
 * 3. Fallback Engine: Rule-based analysis when AI fails
 * 4. Business Logic: Final decision engine with consistency checks
 * 5. Performance Tracking: AI analysis performance monitoring
 */
class MultiEngineAIPipeline {
  constructor() {
    // Initialize AI engines
    this.advancedCategorizer = new AdvancedAICategorizer();
    this.contextualEngine = new ContextualAnalysisEngine();
    
    // Pipeline configuration
    this.config = {
      PRIMARY_AI_TIMEOUT: 15000,      // 15 seconds timeout for primary AI
      CONTEXTUAL_TIMEOUT: 5000,       // 5 seconds for contextual analysis
      MIN_CONFIDENCE_THRESHOLD: 0.3,  // Minimum confidence to trust AI result
      FALLBACK_ON_LOW_CONFIDENCE: true,
      PERFORMANCE_TRACKING: true,
      CONSISTENCY_CHECKS: true
    };

    // Engine weights for final decision
    this.ENGINE_WEIGHTS = {
      PRIMARY_AI: 0.5,
      CONTEXTUAL_ANALYSIS: 0.3,
      FALLBACK_LOGIC: 0.1,
      BUSINESS_RULES: 0.1
    };

    // Performance metrics
    this.performanceMetrics = {
      total_analyses: 0,
      successful_analyses: 0,
      fallback_uses: 0,
      average_processing_time: 0
    };
  }

  /**
   * Master analysis method - orchestrates all AI engines
   */
  async analyzeMessage(messageData, senderInfo = {}, chatContext = {}) {
    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    logger.info(`🎯 PIPELINE [${analysisId}]: Starting multi-engine analysis for: "${messageData.body.substring(0, 50)}..."`);

    try {
      // Track analysis attempt
      this.performanceMetrics.total_analyses++;

      // Phase 1: Parallel execution of primary engines
      const engineResults = await this.executeParallelEngines(messageData, senderInfo, chatContext);
      
      // Phase 2: Business logic integration and consistency checks
      const finalDecision = await this.integrateEngineResults(engineResults, messageData);
      
      // Phase 3: Performance tracking and storage
      if (this.config.PERFORMANCE_TRACKING) {
        await this.trackPerformance(analysisId, engineResults, finalDecision, startTime);
      }

      const totalTime = Date.now() - startTime;
      this.performanceMetrics.successful_analyses++;
      this.updateAverageProcessingTime(totalTime);

      logger.info(`✅ PIPELINE [${analysisId}]: Analysis completed in ${totalTime}ms - Final Category: ${finalDecision.advanced_category}`);

      return {
        analysis_id: analysisId,
        final_decision: finalDecision,
        engine_results: engineResults,
        processing_time: totalTime,
        pipeline_version: '2.0',
        success: true
      };

    } catch (error) {
      logger.error(`❌ PIPELINE [${analysisId}]: Analysis failed:`, error);
      
      // Emergency fallback
      const emergencyResult = await this.emergencyFallback(messageData);
      
      return {
        analysis_id: analysisId,
        final_decision: emergencyResult,
        error: error.message,
        fallback_used: true,
        processing_time: Date.now() - startTime,
        success: false
      };
    }
  }

  /**
   * Execute primary AI engines in parallel for speed
   */
  async executeParallelEngines(messageData, senderInfo, chatContext) {
    const engines = {
      primary_ai: null,
      contextual_analysis: null,
      fallback_analysis: null
    };

    // Prepare historical data for contextual analysis
    const historicalMessages = await this.fetchMessageHistory(senderInfo.number, chatContext.chatId);

    try {
      // Execute engines in parallel
      const [primaryResult, contextualResult] = await Promise.allSettled([
        // Primary AI Analysis
        this.executeWithTimeout(
          () => this.advancedCategorizer.analyzeMessage(messageData.body, historicalMessages, senderInfo),
          this.config.PRIMARY_AI_TIMEOUT,
          'Primary AI'
        ),
        
        // Contextual Analysis
        this.executeWithTimeout(
          () => this.contextualEngine.analyzeContext(messageData, senderInfo, chatContext.chatId),
          this.config.CONTEXTUAL_TIMEOUT,
          'Contextual Analysis'
        )
      ]);

      // Process primary AI result
      if (primaryResult.status === 'fulfilled') {
        engines.primary_ai = {
          result: primaryResult.value,
          success: true,
          confidence: primaryResult.value.confidence_score || 0.5
        };
        logger.info(`✅ PRIMARY AI: Completed successfully - Confidence: ${engines.primary_ai.confidence.toFixed(2)}`);
      } else {
        engines.primary_ai = {
          error: primaryResult.reason,
          success: false,
          confidence: 0
        };
        logger.warning(`⚠️ PRIMARY AI: Failed - ${primaryResult.reason.message}`);
      }

      // Process contextual analysis result
      if (contextualResult.status === 'fulfilled') {
        engines.contextual_analysis = {
          result: contextualResult.value,
          success: true,
          confidence: contextualResult.value.risk_assessment?.overall_risk || 0.3
        };
        logger.info(`✅ CONTEXTUAL: Completed successfully - Risk Score: ${engines.contextual_analysis.confidence.toFixed(2)}`);
      } else {
        engines.contextual_analysis = {
          error: contextualResult.reason,
          success: false,
          confidence: 0
        };
        logger.warning(`⚠️ CONTEXTUAL: Failed - ${contextualResult.reason.message}`);
      }

      // Always generate fallback analysis as backup
      engines.fallback_analysis = {
        result: this.generateFallbackAnalysis(messageData, historicalMessages),
        success: true,
        confidence: 0.4
      };

    } catch (error) {
      logger.error('❌ PARALLEL ENGINES: Critical failure:', error);
      throw error;
    }

    return engines;
  }

  /**
   * Integrate results from all engines using weighted decision making
   */
  async integrateEngineResults(engineResults, messageData) {
    logger.info('🔀 INTEGRATION: Combining engine results...');

    let decision = {
      // Default values
      advanced_category: 'CASUAL',
      confidence_score: 0.3,
      escalation_score: 0.0,
      flagging_decision: false,
      sentiment: 'neutral',
      intent: 'general',
      business_context: {},
      
      // Engine contributions
      primary_ai_contribution: 0,
      contextual_contribution: 0,
      fallback_contribution: 0,
      business_rules_applied: [],
      
      // Final metadata
      final_confidence: 0,
      integration_method: 'weighted_voting',
      consistency_score: 0
    };

    // Extract primary AI decision
    if (engineResults.primary_ai?.success && engineResults.primary_ai.confidence >= this.config.MIN_CONFIDENCE_THRESHOLD) {
      const primaryResult = engineResults.primary_ai.result;
      decision.advanced_category = primaryResult.advanced_category || 'CASUAL';
      decision.confidence_score = primaryResult.confidence_score || 0.5;
      decision.sentiment = primaryResult.sentiment || 'neutral';
      decision.intent = primaryResult.intent || 'general';
      decision.business_context = primaryResult.business_context || {};
      decision.primary_ai_contribution = this.ENGINE_WEIGHTS.PRIMARY_AI;
      
      logger.info(`🧠 PRIMARY AI: Contributing ${decision.primary_ai_contribution} - Category: ${decision.advanced_category}`);
    }

    // Integrate contextual analysis
    if (engineResults.contextual_analysis?.success) {
      const contextualResult = engineResults.contextual_analysis.result;
      const riskAssessment = contextualResult.risk_assessment;
      
      // Override category if high risk detected
      if (riskAssessment?.overall_risk >= 0.8) {
        decision.advanced_category = 'ESCALATION';
        decision.flagging_decision = true;
        decision.business_rules_applied.push('HIGH_RISK_OVERRIDE');
        logger.info('🚨 CONTEXTUAL: High risk detected - Upgraded to ESCALATION');
      }
      
      // Set escalation score from contextual analysis
      decision.escalation_score = riskAssessment?.overall_risk || 0.0;
      decision.contextual_contribution = this.ENGINE_WEIGHTS.CONTEXTUAL_ANALYSIS;
      
      // Apply specific pattern-based rules
      if (contextualResult.patterns?.repetition?.escalation_detected) {
        decision.advanced_category = 'ESCALATION';
        decision.flagging_decision = true;
        decision.business_rules_applied.push('REPETITION_ESCALATION');
        logger.info('🔄 CONTEXTUAL: Repetition escalation detected');
      }
      
      if (contextualResult.patterns?.sentiment_trend?.decline_detected) {
        decision.escalation_score = Math.max(decision.escalation_score, 0.7);
        decision.business_rules_applied.push('SENTIMENT_DECLINE');
        logger.info('📉 CONTEXTUAL: Sentiment decline detected');
      }
    }

    // Apply business logic overrides
    decision = this.applyBusinessLogicOverrides(decision, engineResults, messageData);
    
    // Calculate final confidence
    decision.final_confidence = this.calculateFinalConfidence(decision, engineResults);
    
    // Consistency scoring
    decision.consistency_score = this.calculateConsistencyScore(engineResults);

    // Final validation
    decision = this.validateFinalDecision(decision);

    logger.info(`🎯 INTEGRATION: Final decision - Category: ${decision.advanced_category}, Confidence: ${decision.final_confidence.toFixed(2)}, Escalation: ${decision.escalation_score.toFixed(2)}`);

    return decision;
  }

  /**
   * Apply business logic overrides and consistency rules
   */
  applyBusinessLogicOverrides(decision, engineResults, messageData) {
    const messageText = messageData.body.toLowerCase();
    
    // Safety keywords = immediate URGENT classification
    const safetyKeywords = ['emergency', 'danger', 'injury', 'fire', 'accident', 'help urgently', 'आपातकाल', 'खतरा', 'चोट'];
    if (safetyKeywords.some(keyword => messageText.includes(keyword))) {
      decision.advanced_category = 'URGENT';
      decision.flagging_decision = true;
      decision.escalation_score = 1.0;
      decision.business_rules_applied.push('SAFETY_OVERRIDE');
      logger.info('🚨 BUSINESS LOGIC: Safety override - Classified as URGENT');
    }

    // Escalation language = ESCALATION category
    const escalationPhrases = ['never respond', 'always ignore', 'fed up', 'frustrated', 'angry', 'कभी नहीं सुनते', 'बहुत परेशान'];
    const escalationCount = escalationPhrases.filter(phrase => messageText.includes(phrase)).length;
    if (escalationCount >= 2) {
      decision.advanced_category = 'ESCALATION';
      decision.flagging_decision = true;
      decision.escalation_score = Math.max(decision.escalation_score, 0.8);
      decision.business_rules_applied.push('ESCALATION_LANGUAGE');
      logger.info('😤 BUSINESS LOGIC: Escalation language detected');
    }

    // Complaint + positive sentiment = fix sentiment
    if (decision.advanced_category === 'COMPLAINT' && decision.sentiment === 'positive') {
      decision.sentiment = 'negative';
      decision.business_rules_applied.push('SENTIMENT_CONSISTENCY');
      logger.info('🔧 BUSINESS LOGIC: Fixed sentiment for complaint consistency');
    }

    // INSTRUCTION with high repetition = ESCALATION
    if (decision.advanced_category === 'INSTRUCTION' && decision.escalation_score >= 0.6) {
      decision.advanced_category = 'ESCALATION';
      decision.flagging_decision = true;
      decision.business_rules_applied.push('INSTRUCTION_ESCALATION');
      logger.info('📈 BUSINESS LOGIC: Instruction escalated due to repetition');
    }

    return decision;
  }

  /**
   * Calculate final confidence based on engine agreement
   */
  calculateFinalConfidence(decision, engineResults) {
    let confidence = decision.confidence_score || 0.3;
    
    // Boost confidence if multiple engines agree
    const engineAgreement = this.checkEngineAgreement(engineResults, decision.advanced_category);
    confidence += engineAgreement * 0.2;
    
    // Boost confidence for business rule applications
    confidence += decision.business_rules_applied.length * 0.1;
    
    // Reduce confidence if fallback was used
    if (!engineResults.primary_ai?.success) {
      confidence *= 0.7;
    }
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Check agreement between engines
   */
  checkEngineAgreement(engineResults, finalCategory) {
    let agreementScore = 0;
    let totalEngines = 0;
    
    // Check primary AI agreement
    if (engineResults.primary_ai?.success && engineResults.primary_ai.result?.advanced_category === finalCategory) {
      agreementScore += 1;
    }
    totalEngines++;
    
    // Check contextual analysis agreement (inferred from risk level)
    if (engineResults.contextual_analysis?.success) {
      const risk = engineResults.contextual_analysis.result?.risk_assessment?.overall_risk || 0;
      const expectedCategory = risk >= 0.8 ? 'ESCALATION' : risk >= 0.6 ? 'COMPLAINT' : 'CASUAL';
      if (expectedCategory === finalCategory) {
        agreementScore += 1;
      }
      totalEngines++;
    }
    
    return totalEngines > 0 ? agreementScore / totalEngines : 0;
  }

  /**
   * Calculate consistency score across engines
   */
  calculateConsistencyScore(engineResults) {
    let consistencyFactors = [];
    
    // Primary AI internal consistency
    if (engineResults.primary_ai?.success) {
      const result = engineResults.primary_ai.result;
      if (result.confidence_score >= 0.7) {
        consistencyFactors.push(0.8);
      } else {
        consistencyFactors.push(0.4);
      }
    }
    
    // Contextual analysis consistency
    if (engineResults.contextual_analysis?.success) {
      const patterns = engineResults.contextual_analysis.result?.patterns;
      if (patterns?.repetition?.escalation_detected && patterns?.sentiment_trend?.decline_detected) {
        consistencyFactors.push(0.9); // High consistency - both patterns align
      } else {
        consistencyFactors.push(0.6);
      }
    }
    
    return consistencyFactors.length > 0 ? 
      consistencyFactors.reduce((sum, factor) => sum + factor, 0) / consistencyFactors.length : 0.5;
  }

  /**
   * Validate and sanitize final decision
   */
  validateFinalDecision(decision) {
    // Ensure valid category
    const validCategories = ['INSTRUCTION', 'ESCALATION', 'COMPLAINT', 'URGENT', 'CASUAL'];
    if (!validCategories.includes(decision.advanced_category)) {
      decision.advanced_category = 'CASUAL';
      decision.business_rules_applied.push('CATEGORY_VALIDATION');
    }
    
    // Ensure valid confidence range
    if (decision.final_confidence < 0 || decision.final_confidence > 1) {
      decision.final_confidence = Math.max(0, Math.min(1, decision.final_confidence));
    }
    
    // Ensure valid escalation score
    if (decision.escalation_score < 0 || decision.escalation_score > 1) {
      decision.escalation_score = Math.max(0, Math.min(1, decision.escalation_score));
    }
    
    // Ensure flagging consistency
    if (decision.advanced_category === 'URGENT' || decision.advanced_category === 'ESCALATION') {
      decision.flagging_decision = true;
    }
    
    return decision;
  }

  /**
   * Execute function with timeout
   */
  async executeWithTimeout(func, timeout, engineName) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`${engineName} timeout after ${timeout}ms`));
      }, timeout);
      
      func()
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Fetch message history for contextual analysis
   */
  async fetchMessageHistory(senderNumber, chatId) {
    try {
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { fromNumber: senderNumber },
            { chatId: chatId }
          ],
          timestamp: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 50
      });
      
      return messages;
    } catch (error) {
      logger.error('❌ HISTORY FETCH: Failed to fetch message history:', error);
      return [];
    }
  }

  /**
   * Generate fallback analysis when primary engines fail
   */
  generateFallbackAnalysis(messageData, historicalMessages = []) {
    const text = messageData.body.toLowerCase();
    let category = 'CASUAL';
    let confidence = 0.4;
    let escalationScore = 0.0;
    let shouldFlag = false;

    // Simple keyword-based classification
    if (text.includes('emergency') || text.includes('danger') || text.includes('urgent')) {
      category = 'URGENT';
      confidence = 0.8;
      escalationScore = 1.0;
      shouldFlag = true;
    } else if (text.includes('complaint') || text.includes('problem') || text.includes('issue')) {
      category = 'COMPLAINT';
      confidence = 0.6;
      escalationScore = 0.5;
      shouldFlag = true;
    } else if (text.includes('frustrated') || text.includes('angry') || text.includes('never respond')) {
      category = 'ESCALATION';
      confidence = 0.7;
      escalationScore = 0.8;
      shouldFlag = true;
    } else if (text.includes('check') || text.includes('fix') || text.includes('clean')) {
      category = 'INSTRUCTION';
      confidence = 0.5;
      escalationScore = 0.2;
    }

    return {
      advanced_category: category,
      confidence_score: confidence,
      escalation_score: escalationScore,
      flagging_decision: shouldFlag,
      sentiment: shouldFlag ? 'negative' : 'neutral',
      intent: shouldFlag ? 'complaint' : 'general',
      business_context: { fallback_analysis: true },
      fallback_used: true
    };
  }

  /**
   * Emergency fallback when entire pipeline fails
   */
  async emergencyFallback(messageData) {
    this.performanceMetrics.fallback_uses++;
    
    return {
      advanced_category: 'CASUAL',
      confidence_score: 0.2,
      escalation_score: 0.0,
      flagging_decision: false,
      sentiment: 'neutral',
      intent: 'general',
      business_context: { emergency_fallback: true },
      emergency_fallback: true,
      final_confidence: 0.2
    };
  }

  /**
   * Track AI analysis performance for continuous improvement
   */
  async trackPerformance(analysisId, engineResults, finalDecision, startTime) {
    try {
      const performanceData = {
        message_id: finalDecision.message_id || analysisId,
        primary_ai_result: engineResults.primary_ai?.success ? 
          JSON.stringify(engineResults.primary_ai.result) : null,
        contextual_result: engineResults.contextual_analysis?.success ? 
          JSON.stringify(engineResults.contextual_analysis.result) : null,
        fallback_result: JSON.stringify(engineResults.fallback_analysis?.result || {}),
        final_decision: JSON.stringify(finalDecision),
        processing_time: Date.now() - startTime,
        confidence_score: finalDecision.final_confidence,
        model_version: 'pipeline_v2.0',
        prompt_version: 'categorization_v1.0'
      };

      await prisma.aIAnalysisPerformance.create({
        data: performanceData
      });

    } catch (error) {
      logger.error('❌ PERFORMANCE TRACKING: Failed to store performance data:', error);
    }
  }

  /**
   * Update average processing time metric
   */
  updateAverageProcessingTime(newTime) {
    const totalAnalyses = this.performanceMetrics.total_analyses;
    const currentAverage = this.performanceMetrics.average_processing_time;
    
    this.performanceMetrics.average_processing_time = 
      (currentAverage * (totalAnalyses - 1) + newTime) / totalAnalyses;
  }

  /**
   * Get pipeline performance metrics
   */
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      success_rate: this.performanceMetrics.total_analyses > 0 ? 
        this.performanceMetrics.successful_analyses / this.performanceMetrics.total_analyses : 0,
      fallback_rate: this.performanceMetrics.total_analyses > 0 ? 
        this.performanceMetrics.fallback_uses / this.performanceMetrics.total_analyses : 0
    };
  }

  /**
   * Reset performance metrics
   */
  resetPerformanceMetrics() {
    this.performanceMetrics = {
      total_analyses: 0,
      successful_analyses: 0,
      fallback_uses: 0,
      average_processing_time: 0
    };
  }
}

module.exports = MultiEngineAIPipeline;