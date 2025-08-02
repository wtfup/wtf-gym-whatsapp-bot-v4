const axios = require('axios');
const logger = require('./logger');

/**
 * Advanced AI Categorizer for WTF Gym WhatsApp Bot
 * 
 * Implements advanced business categorization:
 * - INSTRUCTION: Normal operational directives
 * - ESCALATION: Frustrated or repeated ignored instructions
 * - COMPLAINT: Direct service/facility grievances
 * - URGENT: Safety/emergency concerns
 * - CASUAL: Normal conversations
 */
class AdvancedAICategorizer {
  constructor() {
    this.togetherApiKey = process.env.TOGETHER_API_KEY;
    this.modelName = 'meta-llama/Llama-3-70b-chat-hf';
    
    // Business Category Definitions
    this.BUSINESS_CATEGORIES = {
      INSTRUCTION: {
        description: 'Normal operational directives and task assignments',
        keywords: ['check', 'clean', 'fix', 'update', 'report', 'verify', 'ensure', 'maintain'],
        hindi_keywords: ['जांच', 'साफ', 'ठीक', 'अपडेट', 'रिपोर्ट'],
        flagging_criteria: 'Only flag if repeated 3+ times or shows frustration',
        priority: 'MEDIUM',
        escalation_threshold: 3
      },
      ESCALATION: {
        description: 'Frustrated or repeated ignored instructions with escalation language',
        keywords: ['never respond', 'how many times', 'always ignore', 'frustrated', 'angry', 'fed up'],
        hindi_keywords: ['कई बार', 'कभी नहीं', 'परेशान', 'गुस्सा'],
        flagging_criteria: 'ALWAYS flag for immediate attention',
        priority: 'HIGH',
        escalation_threshold: 1
      },
      COMPLAINT: {
        description: 'Direct service/facility grievances and dissatisfaction',
        keywords: ['complaint', 'problem', 'issue', 'broken', 'dirty', 'rude', 'bad service'],
        hindi_keywords: ['शिकायत', 'समस्या', 'खराब', 'गंदा', 'बुरी सेवा'],
        flagging_criteria: 'Flag for management review',
        priority: 'HIGH',
        escalation_threshold: 2
      },
      URGENT: {
        description: 'Safety/emergency concerns requiring immediate action',
        keywords: ['emergency', 'danger', 'injury', 'fire', 'accident', 'help', 'urgent'],
        hindi_keywords: ['आपातकाल', 'खतरा', 'चोट', 'आग', 'दुर्घटना', 'मदद'],
        flagging_criteria: 'IMMEDIATE flagging with highest priority',
        priority: 'CRITICAL',
        escalation_threshold: 1
      },
      CASUAL: {
        description: 'Normal conversations, greetings, questions',
        keywords: ['hello', 'thank you', 'what time', 'how are you', 'good morning'],
        hindi_keywords: ['नमस्ते', 'धन्यवाद', 'कैसे हैं', 'सुप्रभात'],
        flagging_criteria: 'No flagging unless specific issues detected',
        priority: 'LOW',
        escalation_threshold: 5
      }
    };

    // Gym-specific context patterns
    this.GYM_CONTEXT_PATTERNS = {
      EQUIPMENT: ['treadmill', 'weights', 'machine', 'dumbbells', 'equipment', 'bike'],
      FACILITY: ['AC', 'temperature', 'bathroom', 'locker', 'shower', 'cleanliness'],
      STAFF: ['trainer', 'staff', 'employee', 'manager', 'reception'],
      MEMBERSHIP: ['membership', 'billing', 'payment', 'fee', 'subscription'],
      SAFETY: ['injury', 'hurt', 'danger', 'accident', 'emergency', 'fire']
    };

    // Escalation indicators
    this.ESCALATION_INDICATORS = [
      // English
      'never respond', 'always ignore', 'how many times', 'told you before',
      'fed up', 'frustrated', 'angry', 'sick of', 'tired of', 'enough',
      'last time', 'final warning', 'complained before', 'repeatedly',
      
      // Hindi/Hinglish
      'कई बार कहा', 'बार बार', 'फिर से', 'परेशान हूं', 'गुस्सा',
      'हमेशा ignore', 'कभी नहीं सुनते', 'बहुत बार'
    ];

    // Frustration patterns
    this.FRUSTRATION_PATTERNS = [
      '!!!', 'WHY', 'NEVER', 'ALWAYS', 'WORST', 'TERRIBLE',
      'बहुत गुस्सा', 'बहुत खराब', 'क्यों नहीं'
    ];
  }

  /**
   * Analyze message for advanced business categorization
   */
  async analyzeMessage(messageText, messageHistory = [], senderInfo = {}) {
    try {
      const startTime = Date.now();
      logger.info(`🧠 ADVANCED AI: Starting categorization for: "${messageText.substring(0, 50)}..."`);

      // Quick pattern-based pre-analysis
      const quickAnalysis = this.performQuickPatternAnalysis(messageText);
      
      // Historical context analysis
      const historicalContext = this.analyzeHistoricalContext(messageHistory, messageText);
      
      // Primary AI analysis
      const primaryAnalysis = await this.performPrimaryAIAnalysis(messageText, quickAnalysis, historicalContext);
      
      // Business logic decision
      const finalDecision = this.applyBusinessLogic(primaryAnalysis, quickAnalysis, historicalContext);
      
      const processingTime = Date.now() - startTime;
      
      logger.info(`✅ ADVANCED AI: Analysis completed in ${processingTime}ms - Category: ${finalDecision.advanced_category}`);
      
      return {
        ...finalDecision,
        processing_time: processingTime,
        quick_analysis: quickAnalysis,
        historical_context: historicalContext,
        primary_analysis: primaryAnalysis
      };

    } catch (error) {
      logger.error('❌ ADVANCED AI: Analysis failed:', error);
      
      // Fallback analysis
      const fallbackResult = this.performFallbackAnalysis(messageText);
      
      return {
        advanced_category: fallbackResult.category,
        business_context: fallbackResult.context,
        confidence_score: 0.3,
        flagging_decision: fallbackResult.shouldFlag,
        escalation_score: fallbackResult.escalationScore,
        error: error.message,
        fallback_used: true
      };
    }
  }

  /**
   * Quick pattern-based analysis for immediate classification
   */
  performQuickPatternAnalysis(messageText) {
    const text = messageText.toLowerCase();
    const analysis = {
      detected_patterns: [],
      gym_context: [],
      escalation_indicators: 0,
      frustration_level: 0,
      likely_category: null
    };

    // Check for escalation indicators
    this.ESCALATION_INDICATORS.forEach(indicator => {
      if (text.includes(indicator.toLowerCase())) {
        analysis.escalation_indicators++;
        analysis.detected_patterns.push(`escalation: ${indicator}`);
      }
    });

    // Check for frustration patterns
    this.FRUSTRATION_PATTERNS.forEach(pattern => {
      if (text.includes(pattern.toLowerCase()) || messageText.includes(pattern)) {
        analysis.frustration_level++;
        analysis.detected_patterns.push(`frustration: ${pattern}`);
      }
    });

    // Detect gym context
    Object.entries(this.GYM_CONTEXT_PATTERNS).forEach(([context, keywords]) => {
      keywords.forEach(keyword => {
        if (text.includes(keyword.toLowerCase())) {
          analysis.gym_context.push(context);
        }
      });
    });

    // Quick category determination
    if (analysis.escalation_indicators >= 2 || analysis.frustration_level >= 2) {
      analysis.likely_category = 'ESCALATION';
    } else if (analysis.gym_context.includes('SAFETY')) {
      analysis.likely_category = 'URGENT';
    } else if (analysis.gym_context.length > 0) {
      analysis.likely_category = 'COMPLAINT';
    } else {
      analysis.likely_category = 'CASUAL';
    }

    return analysis;
  }

  /**
   * Analyze historical context for repetition and escalation patterns
   */
  analyzeHistoricalContext(messageHistory, currentMessage) {
    const context = {
      repetition_count: 0,
      sentiment_trend: [],
      escalation_pattern: false,
      similar_messages: [],
      time_pattern: null
    };

    if (!messageHistory || messageHistory.length === 0) {
      return context;
    }

    // Analyze last 10 messages for patterns
    const recentMessages = messageHistory.slice(-10);
    const currentWords = currentMessage.toLowerCase().split(' ');

    recentMessages.forEach(historyMsg => {
      if (historyMsg.body && historyMsg.sentiment) {
        context.sentiment_trend.push(historyMsg.sentiment);
        
        // Check for similar content (word overlap > 50%)
        const historyWords = historyMsg.body.toLowerCase().split(' ');
        const commonWords = currentWords.filter(word => 
          historyWords.includes(word) && word.length > 3
        );
        
        if (commonWords.length / currentWords.length > 0.5) {
          context.repetition_count++;
          context.similar_messages.push({
            text: historyMsg.body,
            timestamp: historyMsg.timestamp,
            sentiment: historyMsg.sentiment
          });
        }
      }
    });

    // Detect escalation pattern (sentiment getting worse)
    if (context.sentiment_trend.length >= 3) {
      const recent = context.sentiment_trend.slice(-3);
      const negativeCount = recent.filter(s => s === 'negative').length;
      context.escalation_pattern = negativeCount >= 2;
    }

    return context;
  }

  /**
   * Primary AI analysis using Together AI
   */
  async performPrimaryAIAnalysis(messageText, quickAnalysis, historicalContext) {
    const prompt = this.buildAnalysisPrompt(messageText, quickAnalysis, historicalContext);
    
    try {
      const response = await axios.post('https://api.together.xyz/v1/chat/completions', {
        model: this.modelName,
        messages: [
          {
            role: 'system',
            content: 'You are an expert AI categorizer for a gym management system. Analyze WhatsApp messages and provide structured categorization.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.1,
        stop: ["</analysis>"]
      }, {
        headers: {
          'Authorization': `Bearer ${this.togetherApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000
      });

      const aiResponse = response.data.choices[0].message.content;
      return this.parseAIResponse(aiResponse);

    } catch (error) {
      logger.error('❌ PRIMARY AI: API call failed:', error.message);
      throw error;
    }
  }

  /**
   * Build comprehensive analysis prompt
   */
  buildAnalysisPrompt(messageText, quickAnalysis, historicalContext) {
    return `
BUSINESS CATEGORIZATION ANALYSIS

MESSAGE TO ANALYZE: "${messageText}"

QUICK PATTERN ANALYSIS:
- Detected patterns: ${quickAnalysis.detected_patterns.join(', ')}
- Gym context: ${quickAnalysis.gym_context.join(', ')}
- Escalation indicators: ${quickAnalysis.escalation_indicators}
- Frustration level: ${quickAnalysis.frustration_level}
- Likely category: ${quickAnalysis.likely_category}

HISTORICAL CONTEXT:
- Repetition count: ${historicalContext.repetition_count}
- Recent sentiment trend: ${historicalContext.sentiment_trend.join(' → ')}
- Escalation pattern detected: ${historicalContext.escalation_pattern}

CATEGORIZATION RULES:
1. INSTRUCTION: Normal directives (flag only if repeated 3+ times)
2. ESCALATION: Frustrated/repeated messages (ALWAYS flag)
3. COMPLAINT: Service/facility issues (flag for review)
4. URGENT: Safety/emergency (IMMEDIATE flag)
5. CASUAL: Normal conversation (rarely flag)

PROVIDE ANALYSIS IN THIS EXACT FORMAT:

CATEGORY: [INSTRUCTION|ESCALATION|COMPLAINT|URGENT|CASUAL]
CONFIDENCE: [0.0-1.0]
FLAGGING: [true|false]
ESCALATION_SCORE: [0.0-1.0]
SENTIMENT: [positive|negative|neutral]
INTENT: [complaint|instruction|question|emergency|general]
BUSINESS_CONTEXT: {
  "gym_areas": ["equipment", "facility", "staff", "membership"],
  "urgency_level": "low|medium|high|critical",
  "repetition_factor": 0.0-1.0,
  "frustration_detected": true|false
}
REASONING: [Brief explanation of categorization decision]

<analysis>
`;
  }

  /**
   * Parse AI response into structured format
   */
  parseAIResponse(aiResponse) {
    try {
      const lines = aiResponse.split('\n');
      const result = {};

      lines.forEach(line => {
        if (line.includes('CATEGORY:')) {
          result.advanced_category = line.split(':')[1].trim();
        } else if (line.includes('CONFIDENCE:')) {
          result.confidence_score = parseFloat(line.split(':')[1].trim());
        } else if (line.includes('FLAGGING:')) {
          result.flagging_decision = line.split(':')[1].trim() === 'true';
        } else if (line.includes('ESCALATION_SCORE:')) {
          result.escalation_score = parseFloat(line.split(':')[1].trim());
        } else if (line.includes('SENTIMENT:')) {
          result.sentiment = line.split(':')[1].trim();
        } else if (line.includes('INTENT:')) {
          result.intent = line.split(':')[1].trim();
        } else if (line.includes('BUSINESS_CONTEXT:')) {
          try {
            const contextStart = aiResponse.indexOf('BUSINESS_CONTEXT:') + 'BUSINESS_CONTEXT:'.length;
            const contextEnd = aiResponse.indexOf('REASONING:', contextStart);
            const contextText = aiResponse.substring(contextStart, contextEnd).trim();
            result.business_context = JSON.parse(contextText);
          } catch (e) {
            result.business_context = { parsing_error: true };
          }
        } else if (line.includes('REASONING:')) {
          result.reasoning = line.split(':')[1].trim();
        }
      });

      return result;

    } catch (error) {
      logger.error('❌ AI RESPONSE: Parsing failed:', error);
      return {
        advanced_category: 'CASUAL',
        confidence_score: 0.3,
        flagging_decision: false,
        escalation_score: 0.0,
        sentiment: 'neutral',
        intent: 'general',
        business_context: { parsing_error: true },
        reasoning: 'Response parsing failed'
      };
    }
  }

  /**
   * Apply final business logic and consistency checks
   */
  applyBusinessLogic(primaryAnalysis, quickAnalysis, historicalContext) {
    const decision = { ...primaryAnalysis };

    // Override decisions based on business rules
    
    // Rule 1: High repetition = escalation
    if (historicalContext.repetition_count >= 3) {
      decision.advanced_category = 'ESCALATION';
      decision.flagging_decision = true;
      decision.escalation_score = Math.max(decision.escalation_score, 0.8);
      logger.info(`🔄 BUSINESS LOGIC: Upgraded to ESCALATION due to repetition (${historicalContext.repetition_count}x)`);
    }

    // Rule 2: Safety keywords = urgent
    if (quickAnalysis.gym_context.includes('SAFETY')) {
      decision.advanced_category = 'URGENT';
      decision.flagging_decision = true;
      decision.escalation_score = 1.0;
      logger.info('🚨 BUSINESS LOGIC: Upgraded to URGENT due to safety context');
    }

    // Rule 3: High frustration = escalation
    if (quickAnalysis.frustration_level >= 2 || quickAnalysis.escalation_indicators >= 2) {
      if (decision.advanced_category !== 'URGENT') {
        decision.advanced_category = 'ESCALATION';
        decision.flagging_decision = true;
        decision.escalation_score = Math.max(decision.escalation_score, 0.7);
        logger.info('😤 BUSINESS LOGIC: Upgraded to ESCALATION due to frustration patterns');
      }
    }

    // Rule 4: Escalation pattern in history
    if (historicalContext.escalation_pattern) {
      decision.escalation_score = Math.max(decision.escalation_score, 0.6);
      decision.flagging_decision = true;
      logger.info('📈 BUSINESS LOGIC: Increased escalation score due to historical pattern');
    }

    // Rule 5: Consistency with sentiment
    if (decision.advanced_category === 'COMPLAINT' && decision.sentiment === 'positive') {
      decision.sentiment = 'negative';
      decision.confidence_score = Math.max(decision.confidence_score, 0.7);
      logger.info('🔧 BUSINESS LOGIC: Adjusted sentiment for complaint consistency');
    }

    // Rule 6: Instruction flagging threshold
    if (decision.advanced_category === 'INSTRUCTION') {
      decision.flagging_decision = historicalContext.repetition_count >= 3;
    }

    // Calculate final confidence
    decision.confidence_score = this.calculateFinalConfidence(decision, quickAnalysis, historicalContext);

    return decision;
  }

  /**
   * Calculate final confidence score based on multiple factors
   */
  calculateFinalConfidence(decision, quickAnalysis, historicalContext) {
    let confidence = decision.confidence_score || 0.5;

    // Boost confidence for pattern matches
    if (quickAnalysis.detected_patterns.length > 0) {
      confidence += 0.1 * quickAnalysis.detected_patterns.length;
    }

    // Boost confidence for gym context
    if (quickAnalysis.gym_context.length > 0) {
      confidence += 0.05 * quickAnalysis.gym_context.length;
    }

    // Boost confidence for historical consistency
    if (historicalContext.repetition_count > 0) {
      confidence += 0.1;
    }

    // Cap at 1.0
    return Math.min(confidence, 1.0);
  }

  /**
   * Fallback analysis when primary AI fails
   */
  performFallbackAnalysis(messageText) {
    const text = messageText.toLowerCase();
    let category = 'CASUAL';
    let shouldFlag = false;
    let escalationScore = 0.0;
    let context = { fallback: true };

    // Simple keyword matching
    if (this.ESCALATION_INDICATORS.some(indicator => 
      text.includes(indicator.toLowerCase()))) {
      category = 'ESCALATION';
      shouldFlag = true;
      escalationScore = 0.8;
    } else if (['emergency', 'danger', 'injury', 'fire'].some(keyword => 
      text.includes(keyword))) {
      category = 'URGENT';
      shouldFlag = true;
      escalationScore = 1.0;
    } else if (['complaint', 'problem', 'issue', 'broken'].some(keyword => 
      text.includes(keyword))) {
      category = 'COMPLAINT';
      shouldFlag = true;
      escalationScore = 0.5;
    } else if (['check', 'clean', 'fix', 'update'].some(keyword => 
      text.includes(keyword))) {
      category = 'INSTRUCTION';
      shouldFlag = false;
      escalationScore = 0.2;
    }

    return { category, shouldFlag, escalationScore, context };
  }

  /**
   * Get category configuration
   */
  getCategoryConfig(category) {
    return this.BUSINESS_CATEGORIES[category] || this.BUSINESS_CATEGORIES.CASUAL;
  }

  /**
   * Validate analysis result
   */
  validateAnalysis(analysis) {
    const validCategories = Object.keys(this.BUSINESS_CATEGORIES);
    
    if (!validCategories.includes(analysis.advanced_category)) {
      analysis.advanced_category = 'CASUAL';
    }

    if (typeof analysis.confidence_score !== 'number' || 
        analysis.confidence_score < 0 || analysis.confidence_score > 1) {
      analysis.confidence_score = 0.5;
    }

    if (typeof analysis.escalation_score !== 'number' || 
        analysis.escalation_score < 0 || analysis.escalation_score > 1) {
      analysis.escalation_score = 0.0;
    }

    return analysis;
  }
}

module.exports = AdvancedAICategorizer;