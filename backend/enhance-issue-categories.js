#!/usr/bin/env node

/**
 * 🧱 ENHANCE ISSUE CATEGORIES FOR WTF GYM ROUTING SYSTEM
 * 
 * This script enhances the existing IssueCategory table with detailed
 * gym-specific categories for better AI routing and categorization.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 🏋️ DETAILED GYM-SPECIFIC ISSUE CATEGORIES
const detailedGymCategories = [
  // 👨‍🏫 TRAINER ISSUES (Priority 1-2)
  {
    name: "Trainer Absence",
    description: "Trainer not present during session time",
    department: "STAFF_MANAGEMENT",
    keywords: ["trainer absent", "trainer not here", "trainer missing", "no trainer", "trainer नहीं आया", "ट्रेनर नहीं है"],
    priority_weight: 1,
    escalation_threshold: 1,
    color_code: "#E53E3E",
    icon_name: "PersonOff"
  },
  {
    name: "Trainer Misbehavior / Rudeness", 
    description: "Trainer rude or disrespectful",
    department: "MANAGEMENT",
    keywords: ["trainer rude", "trainer misbehavior", "trainer attitude", "trainer problem", "ट्रेनर बदतमीज", "ट्रेनर गंदा व्यवहार"],
    priority_weight: 1,
    escalation_threshold: 1,
    color_code: "#E53E3E", 
    icon_name: "ReportProblem"
  },
  {
    name: "Personal Training Conflict",
    description: "Issue with PT scheduling or behavior", 
    department: "STAFF_MANAGEMENT",
    keywords: ["PT issue", "personal training", "PT conflict", "PT schedule", "PT problem", "पर्सनल ट्रेनिंग"],
    priority_weight: 2,
    escalation_threshold: 2,
    color_code: "#D69E2E",
    icon_name: "Schedule"
  },
  {
    name: "Wrong Guidance / Unsafe Exercise",
    description: "Unsafe instructions or wrong form guidance",
    department: "STAFF_MANAGEMENT", 
    keywords: ["wrong guidance", "unsafe exercise", "wrong form", "bad instruction", "गलत एक्सरसाइज़", "गलत तरीका"],
    priority_weight: 1,
    escalation_threshold: 1,
    color_code: "#E53E3E",
    icon_name: "Warning"
  },

  // 🏢 STAFF ISSUES (Priority 2-3)
  {
    name: "Staff Unavailable at Front Desk",
    description: "No staff available at reception/front desk",
    department: "STAFF_MANAGEMENT",
    keywords: ["no staff", "front desk empty", "reception empty", "staff unavailable", "स्टाफ नहीं है", "रिसेप्शन खाली"],
    priority_weight: 2,
    escalation_threshold: 2,
    color_code: "#D69E2E",
    icon_name: "Desk"
  },
  {
    name: "Staff Rudeness or Misconduct", 
    description: "Unprofessional staff behavior",
    department: "MANAGEMENT",
    keywords: ["staff rude", "staff misconduct", "staff behavior", "staff attitude", "स्टाफ बदतमीज", "स्टाफ गंदा व्यवहार"],
    priority_weight: 1,
    escalation_threshold: 1,
    color_code: "#E53E3E",
    icon_name: "ReportProblem"
  },

  // 🌡️ FACILITY ENVIRONMENT (Priority 2-3)
  {
    name: "AC Not Working",
    description: "Air conditioning not functioning",
    department: "FACILITY_MANAGEMENT",
    keywords: ["AC not working", "air conditioning", "AC off", "too hot", "no cooling", "AC खराब", "ठंडक नहीं"],
    priority_weight: 2,
    escalation_threshold: 3,
    color_code: "#3182CE",
    icon_name: "Thermostat"
  },
  {
    name: "Power Cut / Backup Issue",
    description: "Electricity issues at the gym", 
    department: "FACILITY_MANAGEMENT",
    keywords: ["power cut", "electricity issue", "lights off", "no power", "generator", "बिजली नहीं", "लाइट नहीं"],
    priority_weight: 1,
    escalation_threshold: 2,
    color_code: "#E53E3E",
    icon_name: "Power"
  },
  {
    name: "Water Not Available",
    description: "Drinking or washroom water unavailable",
    department: "FACILITY_MANAGEMENT", 
    keywords: ["no water", "water not available", "water problem", "thirsty", "washroom water", "पानी नहीं", "पानी की समस्या"],
    priority_weight: 2,
    escalation_threshold: 2,
    color_code: "#3182CE",
    icon_name: "Water"
  },

  // 🧹 CLEANLINESS (Priority 2-3)
  {
    name: "Cleanliness / Washroom Issue",
    description: "Dirty toilets, gym floor, etc.",
    department: "FACILITY_MANAGEMENT",
    keywords: ["dirty", "washroom dirty", "toilet dirty", "floor dirty", "smell", "गंदा", "साफ नहीं", "बदबू"],
    priority_weight: 2,
    escalation_threshold: 2,
    color_code: "#38A169",
    icon_name: "CleaningServices"
  },
  {
    name: "Mirror / Glass Broken",
    description: "Mirror or reflective surfaces broken",
    department: "FACILITY_MANAGEMENT",
    keywords: ["mirror broken", "glass broken", "mirror crack", "शीशा टूटा", "आईना टूटा"],
    priority_weight: 3,
    escalation_threshold: 3,
    color_code: "#D69E2E",
    icon_name: "BrokenImage"
  },
  {
    name: "Music System / Volume Complaint",
    description: "Music too loud or not working",
    department: "FACILITY_MANAGEMENT",
    keywords: ["music loud", "volume high", "music not working", "song problem", "आवाज़ तेज़", "म्यूज़िक खराब"],
    priority_weight: 4,
    escalation_threshold: 4,
    color_code: "#805AD5",
    icon_name: "VolumeUp"
  },

  // 🏋️ EQUIPMENT ISSUES (Priority 1-2)
  {
    name: "Treadmill Not Working",
    description: "Treadmill machine issue",
    department: "EQUIPMENT_MAINTENANCE",
    keywords: ["treadmill not working", "treadmill broken", "treadmill problem", "running machine", "ट्रेडमिल खराब", "दौड़ने की मशीन"],
    priority_weight: 1,
    escalation_threshold: 2,
    color_code: "#E53E3E",
    icon_name: "DirectionsRun"
  },
  {
    name: "Weight Stack Broken",
    description: "Weights not functioning or damaged",
    department: "EQUIPMENT_MAINTENANCE", 
    keywords: ["weight broken", "weight stack", "weights not working", "weight problem", "वेट खराब", "भार की समस्या"],
    priority_weight: 1,
    escalation_threshold: 2,
    color_code: "#E53E3E",
    icon_name: "FitnessCenter"
  },
  {
    name: "Machine Rusted or No Lubrication",
    description: "Maintenance issue with machines",
    department: "EQUIPMENT_MAINTENANCE",
    keywords: ["machine rusted", "machine maintenance", "lubrication", "machine stuck", "मशीन जंग", "मशीन खराब"],
    priority_weight: 2,
    escalation_threshold: 3,
    color_code: "#D69E2E",
    icon_name: "Build"
  },
  {
    name: "Free Weight Missing / Damaged", 
    description: "Missing dumbbells/plates/kettlebells",
    department: "EQUIPMENT_MAINTENANCE",
    keywords: ["dumbbells missing", "weights missing", "plates missing", "free weights", "डम्बल नहीं", "प्लेट नहीं"],
    priority_weight: 2,
    escalation_threshold: 3,
    color_code: "#D69E2E",
    icon_name: "FitnessCenter"
  },
  {
    name: "Cable / Pin / Bench Problem",
    description: "Cables loose or benches broken",
    department: "EQUIPMENT_MAINTENANCE",
    keywords: ["cable loose", "pin broken", "bench broken", "cable problem", "केबल ढीला", "बेंच टूटा"],
    priority_weight: 2,
    escalation_threshold: 3,
    color_code: "#D69E2E", 
    icon_name: "Build"
  },
  {
    name: "Machines Occupied or Misused",
    description: "Members not allowing others to use machines",
    department: "CUSTOMER_SERVICE",
    keywords: ["machine occupied", "not sharing", "machine misuse", "someone not leaving", "मशीन कब्जा", "शेयर नहीं कर रहा"],
    priority_weight: 3,
    escalation_threshold: 2,
    color_code: "#D69E2E",
    icon_name: "Group"
  },

  // 💰 BILLING & MEMBERSHIP (Priority 2-4)
  {
    name: "Wrong Plan Information",
    description: "Mismatch between promised vs actual plan",
    department: "CUSTOMER_SERVICE",
    keywords: ["wrong plan", "plan mismatch", "plan problem", "membership issue", "प्लान गलत", "मेम्बरशिप समस्या"],
    priority_weight: 2,
    escalation_threshold: 2,
    color_code: "#805AD5",
    icon_name: "Assignment"
  },
  {
    name: "Refund Not Received",
    description: "Refund delay or denial",
    department: "CUSTOMER_SERVICE",
    keywords: ["refund not received", "refund pending", "money not returned", "रिफंड नहीं मिला", "पैसा वापस नहीं"],
    priority_weight: 2,
    escalation_threshold: 2,
    color_code: "#D69E2E",
    icon_name: "Payment"
  },
  {
    name: "Payment Link Not Working",
    description: "Payment gateway failure or expired links",
    department: "CUSTOMER_SERVICE",
    keywords: ["payment link", "payment not working", "payment failed", "पेमेंट लिंक", "पेमेंट नहीं हो रहा"],
    priority_weight: 3,
    escalation_threshold: 3,
    color_code: "#D69E2E",
    icon_name: "LinkOff"
  },
  {
    name: "Invoice Not Received",
    description: "Invoice missing after payment",
    department: "CUSTOMER_SERVICE",
    keywords: ["invoice not received", "bill not received", "receipt missing", "इनवॉयस नहीं मिला", "बिल नहीं मिला"],
    priority_weight: 4,
    escalation_threshold: 4,
    color_code: "#718096",
    icon_name: "Receipt"
  },
  {
    name: "Addon Issue / Not Applied",
    description: "Add-on not reflecting after payment",
    department: "CUSTOMER_SERVICE", 
    keywords: ["addon not applied", "addon issue", "addon missing", "एडऑन समस्या", "एडऑन नहीं मिला"],
    priority_weight: 3,
    escalation_threshold: 3,
    color_code: "#D69E2E",
    icon_name: "AddBox"
  },
  {
    name: "Renewal Amount Different Than Told",
    description: "Mismatch in renewal price vs earlier rate",
    department: "CUSTOMER_SERVICE",
    keywords: ["renewal amount", "price different", "amount mismatch", "रिन्यूअल अमाउंट", "कीमत अलग"],
    priority_weight: 3,
    escalation_threshold: 2,
    color_code: "#D69E2E",
    icon_name: "MoneyOff"
  },

  // 📱 APP ISSUES (Priority 3-4)
  {
    name: "App Login Issue",
    description: "App not accepting login credentials",
    department: "CUSTOMER_SERVICE",
    keywords: ["app login", "login issue", "app not opening", "login problem", "एप लॉगिन", "एप नहीं खुल रहा"],
    priority_weight: 3,
    escalation_threshold: 3,
    color_code: "#3182CE",
    icon_name: "Login"
  },
  {
    name: "Workout Not Getting Tracked",
    description: "Sessions or progress not recorded in app",
    department: "CUSTOMER_SERVICE",
    keywords: ["workout not tracked", "progress not saved", "tracking issue", "वर्कआउट ट्रैक नहीं", "प्रोग्रेस नहीं"],
    priority_weight: 4,
    escalation_threshold: 4,
    color_code: "#718096",
    icon_name: "TrackChanges"
  },
  {
    name: "Steps/Calories Not Syncing",
    description: "Tracker data not syncing with app",
    department: "CUSTOMER_SERVICE",
    keywords: ["steps not syncing", "calories not syncing", "sync issue", "स्टेप्स सिंक नहीं", "कैलोरी सिंक नहीं"],
    priority_weight: 4,
    escalation_threshold: 4,
    color_code: "#718096",
    icon_name: "Sync"
  },
  {
    name: "App Crashing or Hanging",
    description: "App freezing or not opening",
    department: "CUSTOMER_SERVICE",
    keywords: ["app crashing", "app hanging", "app freeze", "app slow", "एप क्रैश", "एप हैंग"],
    priority_weight: 3,
    escalation_threshold: 3,
    color_code: "#E53E3E",
    icon_name: "BugReport"
  },
  {
    name: "Wrong Member Data / QR Code Issue",
    description: "Profile info wrong or QR not working",
    department: "CUSTOMER_SERVICE",
    keywords: ["wrong data", "QR code issue", "profile wrong", "member data", "QR स्कैन नहीं", "डेटा गलत"],
    priority_weight: 3,
    escalation_threshold: 3,
    color_code: "#D69E2E",
    icon_name: "QrCode"
  },
  {
    name: "Offer Not Showing in App",
    description: "Campaign offers missing",
    department: "CUSTOMER_SERVICE",
    keywords: ["offer not showing", "offer missing", "promotion not visible", "ऑफर नहीं दिख रहा", "प्रमोशन नहीं"],
    priority_weight: 4,
    escalation_threshold: 4,
    color_code: "#718096",
    icon_name: "LocalOffer"
  },
  {
    name: "Trainer Not Visible in App",
    description: "Trainer assignment issue in UI",
    department: "CUSTOMER_SERVICE",
    keywords: ["trainer not visible", "trainer missing app", "trainer assignment", "ट्रेनर एप में नहीं", "ट्रेनर असाइन नहीं"],
    priority_weight: 4,
    escalation_threshold: 4,
    color_code: "#718096",
    icon_name: "PersonSearch"
  },

  // 🎫 PASSES & ACCESS (Priority 2-3)
  {
    name: "One-Day Pass Not Generated",
    description: "Visitor pass not sent after payment",
    department: "CUSTOMER_SERVICE",
    keywords: ["day pass", "visitor pass", "pass not generated", "day pass not received", "डे पास नहीं मिला", "विज़िटर पास"],
    priority_weight: 3,
    escalation_threshold: 3,
    color_code: "#D69E2E",
    icon_name: "ConfirmationNumber"
  },
  {
    name: "Live Chat Not Working",
    description: "Support chat not responding",
    department: "CUSTOMER_SERVICE",
    keywords: ["live chat", "chat not working", "support chat", "chat issue", "लाइव चैट", "चैट नहीं चल रहा"],
    priority_weight: 4,
    escalation_threshold: 4,
    color_code: "#718096",
    icon_name: "Chat"
  },

  // 🚪 ENTRY & ACCESS (Priority 1-2)
  {
    name: "QR Code Scan Failed",
    description: "Entry QR not scanning at gate",
    department: "FACILITY_MANAGEMENT",
    keywords: ["QR not scanning", "QR scan failed", "entry problem", "gate issue", "QR स्कैन नहीं", "गेट पर समस्या"],
    priority_weight: 2,
    escalation_threshold: 2,
    color_code: "#E53E3E",
    icon_name: "QrCodeScanner"
  },
  {
    name: "Blocked at Entry Without Reason",
    description: "Denied entry even with valid plan",
    department: "CUSTOMER_SERVICE",
    keywords: ["blocked entry", "denied entry", "can't enter", "entry blocked", "एंट्री नहीं मिल रही", "अंदर नहीं जा सकते"],
    priority_weight: 1,
    escalation_threshold: 1,
    color_code: "#E53E3E",
    icon_name: "Block"
  },
  {
    name: "Fingerprint / Access System Not Working",
    description: "Biometric access failure",
    department: "FACILITY_MANAGEMENT",
    keywords: ["fingerprint not working", "biometric issue", "access system", "finger scan", "फिंगरप्रिंट नहीं", "बायोमेट्रिक"],
    priority_weight: 2,
    escalation_threshold: 2,
    color_code: "#D69E2E",
    icon_name: "Fingerprint"
  },
  {
    name: "Wrong Check-In Time Marked",
    description: "Incorrect check-in timestamp",
    department: "CUSTOMER_SERVICE",
    keywords: ["wrong time", "check-in time", "time incorrect", "चेक-इन टाइम गलत", "समय गलत"],
    priority_weight: 4,
    escalation_threshold: 4,
    color_code: "#718096",
    icon_name: "Schedule"
  },

  // 🚨 EMERGENCY ISSUES (Priority 1)
  {
    name: "Fight or Physical Altercation",
    description: "Violent or aggressive behavior at gym",
    department: "SECURITY",
    keywords: ["fight", "physical altercation", "violence", "aggressive", "मारपीट", "लड़ाई"],
    priority_weight: 1,
    escalation_threshold: 1,
    color_code: "#E53E3E",
    icon_name: "ReportProblem"
  },
  {
    name: "Medical Emergency Reported",
    description: "Member fainted or injured during workout",
    department: "SECURITY",
    keywords: ["medical emergency", "fainted", "injured", "hurt", "accident", "मेडिकल इमरजेंसी", "बेहोश"],
    priority_weight: 1,
    escalation_threshold: 1,
    color_code: "#E53E3E",
    icon_name: "LocalHospital"
  },
  {
    name: "Suspicious Behavior or Security Risk",
    description: "Unidentified person or theft report",
    department: "SECURITY",
    keywords: ["suspicious", "security risk", "theft", "stranger", "चोरी", "संदिग्ध व्यक्ति"],
    priority_weight: 1,
    escalation_threshold: 1,
    color_code: "#E53E3E",
    icon_name: "Security"
  },
  {
    name: "Sexual Harassment or Misconduct",
    description: "Serious complaint regarding harassment",
    department: "MANAGEMENT",
    keywords: ["harassment", "misconduct", "inappropriate", "sexual harassment", "उत्पीड़न", "गलत व्यवहार"],
    priority_weight: 1,
    escalation_threshold: 1,
    color_code: "#E53E3E",
    icon_name: "ReportProblem"
  },

  // 💬 FEEDBACK & SUGGESTIONS (Priority 4-5)
  {
    name: "General Feedback",
    description: "Member giving general comment",
    department: "CUSTOMER_SERVICE",
    keywords: ["feedback", "comment", "opinion", "फीडबैक", "राय"],
    priority_weight: 5,
    escalation_threshold: 5,
    color_code: "#718096",
    icon_name: "Feedback"
  },
  {
    name: "Trainer Appreciation",
    description: "Positive review for trainer",
    department: "STAFF_MANAGEMENT",
    keywords: ["trainer good", "trainer appreciation", "trainer thanks", "ट्रेनर अच्छा", "ट्रेनर धन्यवाद"],
    priority_weight: 5,
    escalation_threshold: 5,
    color_code: "#38A169",
    icon_name: "ThumbUp"
  },
  {
    name: "Facility Suggestion",
    description: "Member giving improvement suggestion",
    department: "CUSTOMER_SERVICE",
    keywords: ["suggestion", "improvement", "facility suggestion", "सुझाव", "सुधार"],
    priority_weight: 4,
    escalation_threshold: 5,
    color_code: "#718096",
    icon_name: "Lightbulb"
  },
  {
    name: "Request for New Equipment",
    description: "Member asking for machine or weights",
    department: "EQUIPMENT_MAINTENANCE",
    keywords: ["new equipment", "need machine", "request equipment", "नया उपकरण", "मशीन चाहिए"],
    priority_weight: 4,
    escalation_threshold: 5,
    color_code: "#718096", 
    icon_name: "AddCircle"
  },
  {
    name: "Request for New Batch / Timings",
    description: "Request for new workout slot",
    department: "CUSTOMER_SERVICE",
    keywords: ["new batch", "new timing", "time slot", "schedule request", "नया बैच", "नया समय"],
    priority_weight: 4,
    escalation_threshold: 5,
    color_code: "#718096",
    icon_name: "Schedule"
  },

  // 🔄 ESCALATION ISSUES (Priority 1-2)
  {
    name: "Repeated Issue Not Resolved",
    description: "Same issue coming again",
    department: "MANAGEMENT",
    keywords: ["repeated issue", "same problem", "not resolved", "again problem", "दोबारा समस्या", "वही दिक्कत"],
    priority_weight: 1,
    escalation_threshold: 1,
    color_code: "#E53E3E",
    icon_name: "Repeat"
  },
  {
    name: "No Callback from Manager",
    description: "Member expected a call back but didn't receive",
    department: "MANAGEMENT",
    keywords: ["no callback", "manager call", "call back", "expected call", "कॉल बैक नहीं", "मैनेजर कॉल नहीं"],
    priority_weight: 2,
    escalation_threshold: 2,
    color_code: "#D69E2E",
    icon_name: "PhoneMissed"
  },
  {
    name: "Spoken Earlier, Still Pending",
    description: "Previously escalated, still open",
    department: "MANAGEMENT", 
    keywords: ["spoken earlier", "still pending", "previous complaint", "पहले बोला था", "अभी भी pending"],
    priority_weight: 1,
    escalation_threshold: 1,
    color_code: "#E53E3E",
    icon_name: "Pending"
  },
  {
    name: "Told Multiple Times, No Action",
    description: "Repeated complaints not acted upon",
    department: "MANAGEMENT",
    keywords: ["told multiple times", "no action", "multiple complaints", "कई बार बोला", "कोई एक्शन नहीं"],
    priority_weight: 1,
    escalation_threshold: 1,
    color_code: "#E53E3E",
    icon_name: "ReportProblem"
  }
];

async function enhanceIssueCategories() {
  try {
    console.log('🧱 ENHANCING ISSUE CATEGORIES FOR WTF GYM ROUTING SYSTEM');
    console.log('=' .repeat(60));
    
    // 1. Clear existing categories (optional - can be commented out to preserve)
    console.log('\n🗑️ Clearing existing issue categories...');
    await prisma.routingRule.deleteMany(); // Clear dependent records first
    await prisma.issueCategory.deleteMany();
    console.log('✅ Cleared existing categories');
    
    // 2. Insert enhanced gym-specific categories
    console.log(`\n💾 Inserting ${detailedGymCategories.length} enhanced gym categories...`);
    
    let insertedCount = 0;
    for (const category of detailedGymCategories) {
      try {
        await prisma.issueCategory.create({
          data: {
            category_name: category.name,
            department: category.department,
            keywords: JSON.stringify(category.keywords),
            priority_weight: category.priority_weight,
            auto_route: true,
            escalation_threshold: category.escalation_threshold,
            business_context: category.description,
            color_code: category.color_code,
            icon_name: category.icon_name
          }
        });
        
        insertedCount++;
        console.log(`✅ Added: ${category.name} (${category.department})`);
      } catch (error) {
        console.log(`❌ Failed to add: ${category.name} - ${error.message}`);
      }
    }
    
    // 3. Verify insertion
    const totalCategories = await prisma.issueCategory.count();
    console.log(`\n📊 Total categories in database: ${totalCategories}`);
    
    // 4. Summary by department
    console.log('\n📈 CATEGORY SUMMARY BY DEPARTMENT:');
    const departments = [...new Set(detailedGymCategories.map(c => c.department))];
    for (const dept of departments) {
      const count = detailedGymCategories.filter(c => c.department === dept).length;
      console.log(`   ${dept}: ${count} categories`);
    }
    
    console.log('\n🎉 Issue categories enhancement completed successfully!');
    console.log(`✅ Successfully inserted ${insertedCount} out of ${detailedGymCategories.length} categories`);
    
  } catch (error) {
    console.error('❌ Error enhancing issue categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Export categories for use by routing rules script
module.exports = { detailedGymCategories };

// Run if called directly
if (require.main === module) {
  enhanceIssueCategories();
}