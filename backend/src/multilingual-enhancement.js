const logger = require('./logger');

/**
 * Enhanced Multilingual Support Engine for Gym WhatsApp Bot
 * Supports: English, Hindi, Hinglish (English-Hindi mix)
 * 
 * Key Features:
 * - Comprehensive keyword dictionaries for gym context
 * - Regional language patterns and cultural nuances
 * - Hinglish detection and processing
 * - Context-aware categorization
 */
class MultilingualEnhancementEngine {
  constructor() {
    // Enhanced multilingual keyword dictionaries
    this.ENHANCED_KEYWORDS = {
      // INSTRUCTION Category - English
      instruction_english: [
        'how to', 'please help', 'can you', 'show me', 'explain', 'guide', 'tutorial',
        'steps', 'process', 'procedure', 'method', 'way to', 'instructions',
        'timing', 'schedule', 'rules', 'policy', 'fees', 'charges', 'membership',
        'registration', 'booking', 'reserve', 'cancel', 'modify', 'change'
      ],
      
      // INSTRUCTION Category - Hindi
      instruction_hindi: [
        'कैसे करें', 'कृपया मदद', 'बताएं', 'समझाएं', 'सिखाएं', 'जानकारी',
        'तरीका', 'विधि', 'नियम', 'समय', 'शुल्क', 'फीस', 'सदस्यता',
        'रजिस्ट्रेशन', 'बुकिंग', 'आरक्षण', 'रद्द', 'बदलाव', 'परिवर्तन'
      ],

      // COMPLAINT Category - English  
      complaint_english: [
        'broken', 'not working', 'problem', 'issue', 'complaint', 'dirty', 'smelly',
        'damaged', 'faulty', 'malfunctioning', 'poor', 'bad', 'terrible', 'horrible',
        'disgusting', 'filthy', 'unclean', 'unhygienic', 'maintenance', 'repair',
        'fix', 'replace', 'dissatisfied', 'disappointed', 'frustrated', 'angry'
      ],
      
      // COMPLAINT Category - Hindi
      complaint_hindi: [
        'शिकायत', 'समस्या', 'खराब', 'गंदा', 'बुरी सेवा', 'टूटा', 'काम नहीं',
        'बदबू', 'गलत', 'परेशानी', 'दिक्कत', 'ठीक करो', 'बदलो', 'सफाई',
        'मरम्मत', 'निराश', 'गुस्सा', 'नाराज', 'असंतुष्ट'
      ],

      // ESCALATION Category - English
      escalation_english: [
        'manager', 'supervisor', 'escalate', 'complaint', 'repeatedly', 'many times',
        'again and again', 'frustrated', 'angry', 'furious', 'unacceptable',
        'terrible service', 'waste of money', 'cancel membership', 'refund'
      ],
      
      // ESCALATION Category - Hindi  
      escalation_hindi: [
        'मैनेजर', 'प्रबंधक', 'अधिकारी', 'कई बार', 'बार बार', 'परेशान', 'गुस्सा',
        'नाराज', 'असंतुष्ट', 'गलत सेवा', 'पैसे बर्बाद', 'सदस्यता रद्द', 'वापसी'
      ],

      // URGENT Category - English
      urgent_english: [
        'emergency', 'urgent', 'help', 'immediately', 'asap', 'danger', 'injury',
        'accident', 'fire', 'safety', 'medical', 'ambulance', 'police', 'security'
      ],
      
      // URGENT Category - Hindi
      urgent_hindi: [
        'आपातकाल', 'खतरा', 'चोट', 'आग', 'दुर्घटना', 'मदद', 'तुरंत', 'जल्दी',
        'सुरक्षा', 'डॉक्टर', 'एम्बुलेंस', 'पुलिस', 'सिक्यूरिटी'
      ],

      // CASUAL Category - English
      casual_english: [
        'hello', 'hi', 'good morning', 'good evening', 'thanks', 'thank you',
        'welcome', 'great', 'awesome', 'nice', 'good', 'excellent', 'perfect'
      ],
      
      // CASUAL Category - Hindi
      casual_hindi: [
        'नमस्ते', 'धन्यवाद', 'कैसे हैं', 'सुप्रभात', 'शुभ संध्या', 'बहुत अच्छा',
        'शानदार', 'बेहतरीन', 'परफेक्ट', 'सही', 'ठीक है'
      ],

      // Equipment Terms - English
      equipment_english: [
        'treadmill', 'dumbbell', 'barbell', 'machine', 'weights', 'cardio', 'elliptical',
        'bench', 'rack', 'bike', 'stepper', 'rowing', 'cable', 'smith machine', 
        'leg press', 'lat pulldown', 'chest press', 'shoulder press', 'squat rack'
      ],
      
      // Equipment Terms - Hindi
      equipment_hindi: [
        'ट्रेडमिल', 'डम्बल', 'बारबेल', 'मशीन', 'वजन', 'कार्डियो', 'साइकिल',
        'बेंच', 'रैक', 'उपकरण', 'यंत्र', 'व्यायाम मशीन'
      ],

      // Hinglish Patterns (Mixed English-Hindi)
      hinglish_patterns: [
        'gym ka equipment', 'machine nahi chal raha', 'fee kitni hai',
        'membership kaise le', 'timing kya hai', 'problem hai yar',
        'very dirty hai', 'AC nahi chal raha', 'staff bahut rude',
        'trainer achha nahi', 'paisa waste ho gaya'
      ]
    };

    // Cultural context patterns
    this.CULTURAL_PATTERNS = {
      // Politeness indicators in Hindi
      politeness_hindi: ['कृपया', 'जी हाँ', 'आपका धन्यवाद', 'माफ करना'],
      
      // Frustration escalators in Hinglish
      frustration_hinglish: ['yar', 'bhai', 'seriously', 'bas karo', 'enough hai'],
      
      // Urgency indicators
      urgency_mixed: ['turant', 'abhi', 'right now', 'immediately chahiye']
    };

    // Enhanced scoring weights for multilingual context
    this.MULTILINGUAL_WEIGHTS = {
      pure_english: 1.0,
      pure_hindi: 1.0, 
      hinglish_mixed: 0.9, // Slightly lower confidence for mixed
      cultural_context: 0.1 // Bonus for cultural understanding
    };
  }

  /**
   * Enhanced multilingual text analysis
   */
  analyzeMultilingualContent(text) {
    const analysis = {
      language_detection: this.detectLanguage(text),
      keyword_matches: this.findMultilingualKeywords(text),
      cultural_context: this.analyzeCulturalContext(text),
      confidence_adjustments: {}
    };

    // Calculate confidence adjustments based on multilingual factors
    analysis.confidence_adjustments = this.calculateMultilingualConfidence(analysis);

    return analysis;
  }

  /**
   * Detect primary language and mixing patterns
   */
  detectLanguage(text) {
    const hindiRegex = /[\u0900-\u097F]/g; // Devanagari script
    const englishRegex = /[a-zA-Z]/g;
    
    const hindiMatches = (text.match(hindiRegex) || []).length;
    const englishMatches = (text.match(englishRegex) || []).length;
    const totalChars = text.length;

    let primaryLanguage = 'unknown';
    let mixingPattern = 'none';

    if (hindiMatches > englishMatches) {
      primaryLanguage = 'hindi';
    } else if (englishMatches > hindiMatches) {
      primaryLanguage = 'english';
    }

    // Detect Hinglish mixing
    if (hindiMatches > 0 && englishMatches > 0) {
      mixingPattern = 'hinglish';
      primaryLanguage = 'hinglish';
    }

    return {
      primary_language: primaryLanguage,
      mixing_pattern: mixingPattern,
      hindi_ratio: hindiMatches / totalChars,
      english_ratio: englishMatches / totalChars,
      is_mixed: mixingPattern === 'hinglish'
    };
  }

  /**
   * Find multilingual keyword matches across categories
   */
  findMultilingualKeywords(text) {
    const matches = {
      instruction: { english: [], hindi: [] },
      complaint: { english: [], hindi: [] },
      escalation: { english: [], hindi: [] },
      urgent: { english: [], hindi: [] },
      casual: { english: [], hindi: [] },
      equipment: { english: [], hindi: [] },
      hinglish_patterns: []
    };

    const lowerText = text.toLowerCase();

    // Check each category
    Object.keys(this.ENHANCED_KEYWORDS).forEach(category => {
      if (category.includes('_english')) {
        const baseCategory = category.replace('_english', '');
        this.ENHANCED_KEYWORDS[category].forEach(keyword => {
          if (lowerText.includes(keyword.toLowerCase())) {
            matches[baseCategory].english.push(keyword);
          }
        });
      } else if (category.includes('_hindi')) {
        const baseCategory = category.replace('_hindi', '');
        this.ENHANCED_KEYWORDS[category].forEach(keyword => {
          if (lowerText.includes(keyword)) {
            matches[baseCategory].hindi.push(keyword);
          }
        });
      } else if (category === 'hinglish_patterns') {
        this.ENHANCED_KEYWORDS[category].forEach(pattern => {
          if (lowerText.includes(pattern.toLowerCase())) {
            matches.hinglish_patterns.push(pattern);
          }
        });
      }
    });

    return matches;
  }

  /**
   * Analyze cultural context and communication patterns
   */
  analyzeCulturalContext(text) {
    const context = {
      politeness_level: 0,
      frustration_indicators: [],
      urgency_cultural: [],
      regional_expressions: []
    };

    const lowerText = text.toLowerCase();

    // Check politeness indicators
    this.CULTURAL_PATTERNS.politeness_hindi.forEach(indicator => {
      if (lowerText.includes(indicator)) {
        context.politeness_level += 0.25;
      }
    });

    // Check frustration escalators
    this.CULTURAL_PATTERNS.frustration_hinglish.forEach(indicator => {
      if (lowerText.includes(indicator)) {
        context.frustration_indicators.push(indicator);
      }
    });

    // Check urgency patterns
    this.CULTURAL_PATTERNS.urgency_mixed.forEach(indicator => {
      if (lowerText.includes(indicator)) {
        context.urgency_cultural.push(indicator);
      }
    });

    return context;
  }

  /**
   * Calculate confidence adjustments based on multilingual factors
   */
  calculateMultilingualConfidence(analysis) {
    const adjustments = {
      base_confidence: 1.0,
      language_bonus: 0,
      cultural_bonus: 0,
      mixing_penalty: 0
    };

    // Language detection bonus
    if (analysis.language_detection.primary_language !== 'unknown') {
      adjustments.language_bonus = 0.1;
    }

    // Cultural context bonus
    if (analysis.cultural_context.politeness_level > 0) {
      adjustments.cultural_bonus = 0.05;
    }

    // Hinglish mixing penalty (slight reduction in confidence)
    if (analysis.language_detection.is_mixed) {
      adjustments.mixing_penalty = -0.05;
    }

    // Calculate final adjustment
    adjustments.final_adjustment = adjustments.language_bonus + 
                                  adjustments.cultural_bonus + 
                                  adjustments.mixing_penalty;

    return adjustments;
  }

  /**
   * Get enhanced categorization with multilingual support
   */
  getEnhancedCategorization(text, baseAnalysis) {
    const multilingualAnalysis = this.analyzeMultilingualContent(text);
    const keywordMatches = multilingualAnalysis.keyword_matches;

    // Enhanced category scoring with multilingual weights
    const categoryScores = {
      INSTRUCTION: 0,
      COMPLAINT: 0,
      ESCALATION: 0,
      URGENT: 0,
      CASUAL: 0
    };

    // Score based on keyword matches
    categoryScores.INSTRUCTION += (keywordMatches.instruction.english.length * 0.2) + 
                                 (keywordMatches.instruction.hindi.length * 0.2);
    
    categoryScores.COMPLAINT += (keywordMatches.complaint.english.length * 0.3) + 
                               (keywordMatches.complaint.hindi.length * 0.3);
    
    categoryScores.ESCALATION += (keywordMatches.escalation.english.length * 0.4) + 
                                (keywordMatches.escalation.hindi.length * 0.4);
    
    categoryScores.URGENT += (keywordMatches.urgent.english.length * 0.5) + 
                            (keywordMatches.urgent.hindi.length * 0.5);
    
    categoryScores.CASUAL += (keywordMatches.casual.english.length * 0.15) + 
                            (keywordMatches.casual.hindi.length * 0.15);

    // Hinglish pattern bonus
    if (keywordMatches.hinglish_patterns.length > 0) {
      categoryScores.COMPLAINT += 0.2; // Hinglish often used for complaints
      categoryScores.ESCALATION += 0.1;
    }

    // Cultural context adjustments
    if (multilingualAnalysis.cultural_context.frustration_indicators.length > 0) {
      categoryScores.ESCALATION += 0.3;
      categoryScores.COMPLAINT += 0.2;
    }

    if (multilingualAnalysis.cultural_context.urgency_cultural.length > 0) {
      categoryScores.URGENT += 0.4;
    }

    // Find highest scoring category
    const maxScore = Math.max(...Object.values(categoryScores));
    const enhancedCategory = Object.keys(categoryScores).find(cat => categoryScores[cat] === maxScore);

    // Adjust confidence based on multilingual factors
    const confidenceAdjustment = multilingualAnalysis.confidence_adjustments.final_adjustment;
    const enhancedConfidence = Math.min(1.0, Math.max(0.1, 
      (baseAnalysis.confidence || 0.5) + confidenceAdjustment
    ));

    return {
      enhanced_category: enhancedCategory,
      enhanced_confidence: enhancedConfidence,
      category_scores: categoryScores,
      multilingual_analysis: multilingualAnalysis,
      language_context: {
        detected_language: multilingualAnalysis.language_detection.primary_language,
        is_mixed: multilingualAnalysis.language_detection.is_mixed,
        cultural_markers: multilingualAnalysis.cultural_context
      }
    };
  }
}

module.exports = MultilingualEnhancementEngine;