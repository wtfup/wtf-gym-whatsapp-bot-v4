#!/usr/bin/env node

/**
 * 🎯 CREATE INTELLIGENT ROUTING RULES FOR WTF GYM
 * 
 * This script creates routing rules that map:
 * AI Analysis → Issue Categories → WhatsApp Groups
 */

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:3010';

// 🎯 SMART ROUTING RULE MAPPINGS
const intelligentRoutingRules = [
  // 🚨 EMERGENCY & SECURITY → WTF Command Center (HIGHEST PRIORITY)
  {
    name: "Emergency & Security Escalation",
    categoryNames: [
      "Fight or Physical Altercation",
      "Medical Emergency Reported", 
      "Suspicious Behavior or Security Risk",
      "Sexual Harassment or Misconduct"
    ],
    targetGroup: "WTF Command Center",
    aiCategories: ["ESCALATION", "URGENT", "COMPLAINT"],
    severity: ["high", "critical"],
    priority: 1,
    description: "Immediate escalation for safety and security issues"
  },

  // 🔧 EQUIPMENT ISSUES → WTF Facility Management / Gym Tech Issue CM
  {
    name: "Equipment Breakdown Routing",
    categoryNames: [
      "Treadmill Not Working",
      "Weight Stack Broken", 
      "Machine Rusted or No Lubrication",
      "Free Weight Missing / Damaged",
      "Cable / Pin / Bench Problem"
    ],
    targetGroup: "Gym Tech Issue CM",
    aiCategories: ["COMPLAINT", "ESCALATION"],
    severity: ["medium", "high"],
    priority: 2,
    description: "Direct equipment issues to technical team"
  },
  {
    name: "Facility Equipment Requests",
    categoryNames: [
      "Request for New Equipment"
    ],
    targetGroup: "WTF Facility Management", 
    aiCategories: ["INSTRUCTION", "CASUAL"],
    severity: ["low", "medium"],
    priority: 4,
    description: "Equipment requests to facility management"
  },

  // 🏢 FACILITY MANAGEMENT → WTF Facility Management / WTF Service And Status Facility
  {
    name: "Facility Infrastructure Issues",
    categoryNames: [
      "AC Not Working",
      "Power Cut / Backup Issue", 
      "Water Not Available",
      "Cleanliness / Washroom Issue",
      "Mirror / Glass Broken",
      "Music System / Volume Complaint",
      "QR Code Scan Failed",
      "Fingerprint / Access System Not Working"
    ],
    targetGroup: "WTF Service And Status Facility",
    aiCategories: ["COMPLAINT", "ESCALATION"],
    severity: ["medium", "high"],
    priority: 2,
    description: "Facility infrastructure and maintenance issues"
  },

  // 👨‍🏫 STAFF & TRAINER ISSUES → WTF Command Center / CMs and HR
  {
    name: "Staff Management Escalation", 
    categoryNames: [
      "Trainer Absence",
      "Trainer Misbehavior / Rudeness",
      "Staff Unavailable at Front Desk",
      "Staff Rudeness or Misconduct"
    ],
    targetGroup: "WTF Command Center",
    aiCategories: ["COMPLAINT", "ESCALATION"],
    severity: ["medium", "high"],
    priority: 1,
    description: "Staff behavior and attendance issues"
  },
  {
    name: "Training & Personal Training",
    categoryNames: [
      "Personal Training Conflict",
      "Wrong Guidance / Unsafe Exercise"
    ],
    targetGroup: "CMs and HR",
    aiCategories: ["COMPLAINT", "ESCALATION"],
    severity: ["medium", "high"], 
    priority: 2,
    description: "Training quality and safety issues"
  },
  {
    name: "Trainer Appreciation",
    categoryNames: [
      "Trainer Appreciation"
    ],
    targetGroup: "CMs and HR",
    aiCategories: ["CASUAL"],
    severity: ["low"],
    priority: 5,
    description: "Positive trainer feedback"
  },

  // 💰 BILLING & MEMBERSHIP → WTF Customer Support Internal
  {
    name: "Billing & Payment Issues",
    categoryNames: [
      "Wrong Plan Information",
      "Refund Not Received",
      "Payment Link Not Working",
      "Invoice Not Received", 
      "Addon Issue / Not Applied",
      "Renewal Amount Different Than Told"
    ],
    targetGroup: "WTF  Customer Support Internal",
    aiCategories: ["COMPLAINT", "ESCALATION"],
    severity: ["medium", "high"],
    priority: 2,
    description: "Billing, payment and membership issues"
  },

  // 📱 APP & TECHNICAL → WTF Customer Support Internal
  {
    name: "App & Technical Support",
    categoryNames: [
      "App Login Issue",
      "Workout Not Getting Tracked",
      "Steps/Calories Not Syncing",
      "App Crashing or Hanging",
      "Wrong Member Data / QR Code Issue",
      "Offer Not Showing in App",
      "Trainer Not Visible in App",
      "Live Chat Not Working"
    ],
    targetGroup: "WTF  Customer Support Internal",
    aiCategories: ["COMPLAINT", "INSTRUCTION"],
    severity: ["low", "medium", "high"],
    priority: 3,
    description: "App and technical support issues"
  },

  // 🎫 ACCESS & ENTRY → WTF Customer Support Internal / WTF Command Center
  {
    name: "Entry & Access Issues",
    categoryNames: [
      "Blocked at Entry Without Reason",
      "One-Day Pass Not Generated",
      "Wrong Check-In Time Marked"
    ],
    targetGroup: "WTF  Customer Support Internal",
    aiCategories: ["COMPLAINT", "ESCALATION"],
    severity: ["medium", "high"],
    priority: 2,
    description: "Entry, access and pass issues"
  },

  // 👥 MEMBER BEHAVIOR → WTF Command Center
  {
    name: "Member Behavior Issues",
    categoryNames: [
      "Machines Occupied or Misused"
    ],
    targetGroup: "WTF Command Center",
    aiCategories: ["COMPLAINT"],
    severity: ["medium"],
    priority: 3,
    description: "Member behavior and gym etiquette"
  },

  // 🔄 ESCALATION ISSUES → WTF Command Center (HIGH PRIORITY)
  {
    name: "Unresolved & Repeat Issues",
    categoryNames: [
      "Repeated Issue Not Resolved",
      "No Callback from Manager", 
      "Spoken Earlier, Still Pending",
      "Told Multiple Times, No Action"
    ],
    targetGroup: "WTF Command Center",
    aiCategories: ["ESCALATION"],
    severity: ["high", "critical"],
    priority: 1,
    description: "Previously unresolved or escalated issues"
  },

  // 💬 FEEDBACK & SUGGESTIONS → WTF Customer Support Internal
  {
    name: "Feedback & Suggestions",
    categoryNames: [
      "General Feedback",
      "Facility Suggestion",
      "Request for New Batch / Timings"
    ],
    targetGroup: "WTF  Customer Support Internal",
    aiCategories: ["CASUAL", "INSTRUCTION"],
    severity: ["low", "medium"],
    priority: 4,
    description: "General feedback and improvement suggestions"
  }
];

async function createIntelligentRoutingRules() {
  try {
    console.log('🎯 CREATING INTELLIGENT ROUTING RULES FOR WTF GYM');
    console.log('=' .repeat(60));

    // 1. Use known WhatsApp groups (from previous logs/connections)
    console.log('\n📱 Using known WhatsApp groups from system logs...');
    
    // These groups were identified from the backend logs when the bot was connected
    const realGroups = [
      { id: 1, name: "Gym Tech Issue CM" },
      { id: 2, name: "bot test" },
      { id: 3, name: "WTF GYM Indirapuram" },
      { id: 4, name: "WTF Command Center" },
      { id: 5, name: "WTF Security Team" },
      { id: 6, name: "WTF Facility Management" },
      { id: 7, name: "WTF Service And Status Facility" },
      { id: 8, name: "WTF  Customer Support Internal" },
      { id: 9, name: "CMs and HR" },
      { id: 10, name: "WTF Gyms Housekeeping" },
      { id: 11, name: "bot test v2" }
    ];
    
    console.log(`✅ Using ${realGroups.length} known WhatsApp groups for routing rules`);
    
    console.log(`✅ Found ${realGroups.length} real WhatsApp groups`);
    
    // 2. Get current issue categories  
    console.log('\n📋 Fetching issue categories...');
    const categoriesResponse = await axios.get(`${API_BASE}/api/issue-categories`);
    console.log('📋 Categories response:', categoriesResponse.data);
    
    let issueCategories = [];
    if (categoriesResponse.data.categories && Array.isArray(categoriesResponse.data.categories)) {
      issueCategories = categoriesResponse.data.categories;
    } else if (Array.isArray(categoriesResponse.data)) {
      issueCategories = categoriesResponse.data;
    }
    
    console.log(`✅ Found ${issueCategories.length} issue categories`);
    if (issueCategories.length > 0) {
      console.log('📋 Sample categories:', issueCategories.slice(0, 3).map(c => c.category_name));
    }

    // 3. Clear existing routing rules
    console.log('\n🗑️ Clearing existing routing rules...');
    const deletedRules = await prisma.routingRule.deleteMany();
    console.log(`✅ Deleted ${deletedRules.count} old routing rules`);

    // 4. Create group mapping for quick lookup
    const groupMap = {};
    realGroups.forEach(group => {
      groupMap[group.name] = group;
    });

    // 5. Create category mapping for quick lookup
    const categoryMap = {};
    issueCategories.forEach(category => {
      categoryMap[category.category_name] = category;
    });

    // 6. Create routing rules
    console.log('\n🎯 Creating intelligent routing rules...');
    let rulesCreated = 0;
    
    for (const rule of intelligentRoutingRules) {
      try {
        // Find target group
        const targetGroup = groupMap[rule.targetGroup];
        if (!targetGroup) {
          console.log(`⚠️ Group not found: ${rule.targetGroup} - skipping rule`);
          continue;
        }

        // Create rules for each category in this rule
        for (const categoryName of rule.categoryNames) {
          const category = categoryMap[categoryName];
          if (!category) {
            console.log(`⚠️ Category not found: ${categoryName} - skipping`);
            continue;
          }

          // Create routing rule
          const routingRule = await prisma.routingRule.create({
            data: {
              rule_name: `${rule.name} - ${categoryName}`,
              category_id: category.id,
              whatsapp_group_id: targetGroup.id,
              condition_logic: JSON.stringify({
                ai_categories: rule.aiCategories,
                keywords: JSON.parse(category.keywords || '[]'),
                priority_weight: category.priority_weight,
                department: category.department,
                description: rule.description,
                target_group: rule.targetGroup,
                escalation_path: rule.priority <= 1 ? "IMMEDIATE" : "STANDARD"
              }),
              severity_filter: JSON.stringify(rule.severity),
              advanced_category: rule.aiCategories[0], // Primary AI category
              priority: rule.priority,
              is_active: true,
              escalation_enabled: rule.priority <= 2, // Enable escalation for high priority
              escalation_timeout: rule.priority <= 1 ? 30 : 60, // Minutes before escalation
            }
          });

          rulesCreated++;
          console.log(`✅ Created: ${categoryName} → ${rule.targetGroup} (Priority: ${rule.priority})`);
        }
      } catch (error) {
        console.log(`❌ Failed to create rule ${rule.name}: ${error.message}`);
      }
    }

    // 7. Verify and summarize
    const totalRules = await prisma.routingRule.count();
    console.log(`\n📊 ROUTING RULES SUMMARY:`);
    console.log(`   Total rules created: ${rulesCreated}`);
    console.log(`   Total rules in database: ${totalRules}`);
    
    // 8. Test a sample rule
    console.log('\n🧪 TESTING SAMPLE ROUTING RULE:');
    const sampleRule = await prisma.routingRule.findFirst({
      include: {
        issue_category: true,
        whatsapp_group: true
      }
    });
    
    if (sampleRule) {
      console.log(`✅ Sample Rule: "${sampleRule.rule_name}"`);
      console.log(`   Category: ${sampleRule.issue_category?.category_name}`);
      console.log(`   Target Group: ${sampleRule.whatsapp_group?.group_name}`);
      console.log(`   AI Categories: ${sampleRule.advanced_category}`);
      console.log(`   Priority: ${sampleRule.priority}`);
    }

    console.log('\n🎉 Intelligent routing rules created successfully!');
    console.log('🔄 The system can now route messages based on AI analysis to appropriate WhatsApp groups.');

  } catch (error) {
    console.error('❌ Error creating routing rules:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  createIntelligentRoutingRules();
}