const axios = require('axios');
const logger = require('./logger');

class AIAnalysisEngine {
  constructor() {
    this.TOGETHER_AI_CONFIG = {
      apiUrl: 'https://api.together.xyz/v1/chat/completions',
      model: 'Qwen/Qwen2.5-7B-Instruct-Turbo',
      apiKey: process.env.TOGETHER_API_KEY || 'c2fe4720b83bb3e72fe385373b31be849ac64f09737ef446159f73dd5d5c23af'
    };
    
    this.FLAGGING_KEYWORDS = {
      complaint: ['problem', 'issue', 'broken', 'not working', 'complaint', 'समस्या', 'टूटा', 'काम नहीं', 'शिकायत'],
      urgent: ['urgent', 'emergency', 'immediately', 'asap', 'help', 'तुरंत', 'जल्दी', 'मदद', 'आपातकाल'],
      equipment: ['treadmill', 'gym', 'machine', 'equipment', 'AC', 'air conditioner', 'ट्रेडमिल', 'जिम', 'मशीन', 'एसी'],
      staff: ['trainer', 'staff', 'employee', 'manager', 'reception', 'ट्रेनर', 'स्टाफ', 'कर्मचारी', 'मैनेजर']
    };
  }

  createAnalysisPrompt(messageText, context = {}) {
    return `
Analyze this WhatsApp message for a gym/fitness center. The message can be in Hindi, English, or Hinglish (mixed).

Message: "${messageText}"
Context: Group="${context.chatName || 'Unknown'}", Sender="${context.fromName || 'Unknown'}"

Please analyze and return a JSON response with:

1. SENTIMENT ANALYSIS:
   - Determine: positive, negative, or neutral
   - Consider cultural context of Hindi/English mixed usage

2. INTENT CLASSIFICATION:
   - complaint: Customer complaints about facilities, equipment, staff
   - question: Questions about gym services, timings, fees
   - booking: Booking/reservation related messages
   - general: Casual conversation, greetings, general chat

3. ENTITY EXTRACTION:
   - equipment: Any gym equipment mentioned (treadmill, weights, AC, etc.)
   - facilities: Gym areas/facilities (pool, steam room, parking, etc.)
   - staff: Staff members or roles mentioned (trainer, manager, etc.)

4. FLAGGING DECISION:
   - shouldFlag: true/false (flag if complaint, urgent issue, or negative feedback)
   - flagReasons: Array of reasons why this should be flagged
   - category: complaint|urgent|equipment|staff|general
   - priority: low|medium|high|critical

Return only valid JSON format:
{
  "sentiment": {
    "sentiment": "positive|negative|neutral",
    "confidence": 0.85
  },
  "intent": {
    "intent": "complaint|question|booking|general",
    "confidence": 0.90
  },
  "entities": {
    "equipment": ["treadmill", "AC"],
    "facilities": ["gym", "parking"],
    "staff": ["trainer"]
  },
  "flagging": {
    "shouldFlag": true,
    "flagReasons": ["customer complaint", "equipment issue"],
    "category": "complaint",
    "priority": "high"
  },
  "confidence": 0.85
}`;
  }

  async analyzeMessage(messageText, context = {}) {
    try {
      logger.info(`🤖 Starting AI analysis for message: "${messageText.substring(0, 50)}..."`);

      // Skip analysis for very short messages or empty messages
      if (!messageText || messageText.trim().length < 3) {
        return this.getDefaultAnalysis();
      }

      // Quick keyword-based pre-filtering
      const quickFlag = this.quickFlagCheck(messageText);
      
      const prompt = this.createAnalysisPrompt(messageText, context);
      
      const response = await axios.post(this.TOGETHER_AI_CONFIG.apiUrl, {
        model: this.TOGETHER_AI_CONFIG.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,  // Low temperature for consistent results
        max_tokens: 500
      }, {
        headers: {
          'Authorization': `Bearer ${this.TOGETHER_AI_CONFIG.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000  // 10 second timeout
      });

      const aiResponse = response.data.choices[0].message.content;
      logger.success(`🤖 AI analysis completed. Response length: ${aiResponse.length}`);

      // Parse AI response
      let analysis;
      try {
        // Clean the response to extract JSON
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in AI response');
        }
      } catch (parseError) {
        logger.warning(`🤖 Failed to parse AI response, using fallback analysis`);
        analysis = this.getFallbackAnalysis(messageText, quickFlag);
      }

      // Enhance with quick flag check
      if (quickFlag.shouldFlag && !analysis.flagging.shouldFlag) {
        analysis.flagging = quickFlag;
      }

      // Validate and sanitize analysis
      analysis = this.validateAnalysis(analysis);
      
      logger.success(`🤖 Final analysis: Sentiment=${analysis.sentiment.sentiment}, Intent=${analysis.intent.intent}, Flagged=${analysis.flagging.shouldFlag}`);
      
      return analysis;

    } catch (error) {
      logger.error(`🤖 AI analysis failed for message: "${messageText.substring(0, 30)}..."`, error);
      
      // Return fallback analysis
      return this.getFallbackAnalysis(messageText, this.quickFlagCheck(messageText));
    }
  }

  quickFlagCheck(messageText) {
    const text = messageText.toLowerCase();
    let shouldFlag = false;
    let flagReasons = [];
    let category = 'general';
    let priority = 'low';

    // Check for complaint keywords
    for (const [cat, keywords] of Object.entries(this.FLAGGING_KEYWORDS)) {
      for (const keyword of keywords) {
        if (text.includes(keyword.toLowerCase())) {
          shouldFlag = true;
          flagReasons.push(`Contains ${cat} keyword: ${keyword}`);
          category = cat;
          if (cat === 'urgent') priority = 'high';
          else if (cat === 'complaint') priority = 'medium';
        }
      }
    }

    return {
      shouldFlag,
      flagReasons,
      category,
      priority
    };
  }

  getFallbackAnalysis(messageText, quickFlag) {
    const text = messageText.toLowerCase();
    
    // Basic sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'thanks', 'अच्छा', 'बहुत', 'धन्यवाद'];
    const negativeWords = ['bad', 'terrible', 'problem', 'issue', 'खराब', 'समस्या', 'गलत'];
    
    let sentiment = 'neutral';
    if (positiveWords.some(word => text.includes(word))) sentiment = 'positive';
    if (negativeWords.some(word => text.includes(word))) sentiment = 'negative';

    // Basic intent classification
    let intent = 'general';
    if (text.includes('?') || text.includes('कब') || text.includes('क्या')) intent = 'question';
    if (quickFlag.category === 'complaint') intent = 'complaint';

    return {
      sentiment: { sentiment, confidence: 0.6 },
      intent: { intent, confidence: 0.6 },
      entities: { equipment: [], facilities: [], staff: [] },
      flagging: quickFlag,
      confidence: 0.6
    };
  }

  getDefaultAnalysis() {
    return {
      sentiment: { sentiment: 'neutral', confidence: 0.5 },
      intent: { intent: 'general', confidence: 0.5 },
      entities: { equipment: [], facilities: [], staff: [] },
      flagging: { shouldFlag: false, flagReasons: [], category: 'general', priority: 'low' },
      confidence: 0.5
    };
  }

  validateAnalysis(analysis) {
    // Ensure all required fields exist with defaults
    const validated = {
      sentiment: {
        sentiment: analysis.sentiment?.sentiment || 'neutral',
        confidence: Math.min(Math.max(analysis.sentiment?.confidence || 0.5, 0), 1)
      },
      intent: {
        intent: analysis.intent?.intent || 'general',
        confidence: Math.min(Math.max(analysis.intent?.confidence || 0.5, 0), 1)
      },
      entities: {
        equipment: Array.isArray(analysis.entities?.equipment) ? analysis.entities.equipment : [],
        facilities: Array.isArray(analysis.entities?.facilities) ? analysis.entities.facilities : [],
        staff: Array.isArray(analysis.entities?.staff) ? analysis.entities.staff : []
      },
      flagging: {
        shouldFlag: Boolean(analysis.flagging?.shouldFlag),
        flagReasons: Array.isArray(analysis.flagging?.flagReasons) ? analysis.flagging.flagReasons : [],
        category: analysis.flagging?.category || 'general',
        priority: analysis.flagging?.priority || 'low'
      },
      confidence: Math.min(Math.max(analysis.confidence || 0.5, 0), 1)
    };

    // CONSISTENCY FIX: Ensure logical consistency between flagging and sentiment
    if (validated.flagging.shouldFlag) {
      const flagReasons = validated.flagging.flagReasons.join(' ').toLowerCase();
      const category = validated.flagging.category.toLowerCase();
      
      // If flagged for complaint/issue/problem, sentiment should be negative
      if (category === 'complaint' || 
          flagReasons.includes('complaint') || 
          flagReasons.includes('issue') || 
          flagReasons.includes('problem') ||
          flagReasons.includes('समस्या') ||
          flagReasons.includes('शिकायत')) {
        
        // Override sentiment to negative for consistency
        if (validated.sentiment.sentiment === 'neutral' || validated.sentiment.sentiment === 'positive') {
          logger.info(`🔧 CONSISTENCY FIX: Changing sentiment from ${validated.sentiment.sentiment} to negative due to complaint/issue flagging`);
          validated.sentiment.sentiment = 'negative';
          validated.sentiment.confidence = Math.max(validated.sentiment.confidence, 0.8); // High confidence for keyword-based detection
        }
        
        // Set intent to complaint if not already set
        if (validated.intent.intent === 'general') {
          validated.intent.intent = 'complaint';
          validated.intent.confidence = Math.max(validated.intent.confidence, 0.8);
        }
      }
    }

    return validated;
  }

  // Get AI analysis statistics
  getAnalysisStats() {
    return {
      totalAnalyzed: this.totalAnalyzed || 0,
      averageConfidence: this.averageConfidence || 0,
      flaggedPercentage: this.flaggedPercentage || 0
    };
  }
}

module.exports = new AIAnalysisEngine(); 