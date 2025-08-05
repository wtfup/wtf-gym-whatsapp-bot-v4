const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const ISSUE_CATEGORIES = [
  {
    category_name: 'Facility - Equipment & Machines',
    department: 'EQUIPMENT_MAINTENANCE',
    keywords: JSON.stringify(['equipment', 'machine', 'treadmill', 'weights', 'broken', 'not working', 'repair', 'fix']),
    priority_weight: 1,
    auto_route: true,
    escalation_threshold: 2,
    color_code: '#E50012',
    icon_name: 'Build'
  },
  {
    category_name: 'Facility - Infrastructure',
    department: 'FACILITY_MANAGEMENT',
    keywords: JSON.stringify(['building', 'structure', 'roof', 'floor', 'wall', 'construction', 'renovation']),
    priority_weight: 2,
    auto_route: true,
    escalation_threshold: 3,
    color_code: '#FF9800',
    icon_name: 'Business'
  },
  {
    category_name: 'Facility - HVAC & Environment',
    department: 'FACILITY_MANAGEMENT',
    keywords: JSON.stringify(['AC', 'air conditioning', 'temperature', 'hot', 'cold', 'ventilation', 'heating']),
    priority_weight: 2,
    auto_route: true,
    escalation_threshold: 3,
    color_code: '#2196F3',
    icon_name: 'Thermostat'
  },
  {
    category_name: 'Hygiene & Cleanliness',
    department: 'FACILITY_MANAGEMENT',
    keywords: JSON.stringify(['clean', 'dirty', 'smell', 'bathroom', 'toilet', 'hygiene', 'sanitization']),
    priority_weight: 2,
    auto_route: true,
    escalation_threshold: 2,
    color_code: '#4CAF50',
    icon_name: 'CleaningServices'
  },
  {
    category_name: 'Staff - Service Quality',
    department: 'CUSTOMER_SERVICE',
    keywords: JSON.stringify(['staff', 'trainer', 'service', 'rude', 'helpful', 'behavior', 'attitude']),
    priority_weight: 3,
    auto_route: true,
    escalation_threshold: 2,
    color_code: '#9C27B0',
    icon_name: 'SupervisorAccount'
  },
  {
    category_name: 'Billing & Membership',
    department: 'CUSTOMER_SERVICE',
    keywords: JSON.stringify(['billing', 'payment', 'membership', 'fee', 'subscription', 'refund', 'invoice']),
    priority_weight: 3,
    auto_route: true,
    escalation_threshold: 2,
    color_code: '#FF5722',
    icon_name: 'Payment'
  },
  {
    category_name: 'Safety & Security',
    department: 'MANAGEMENT',
    keywords: JSON.stringify(['safety', 'security', 'emergency', 'danger', 'accident', 'injury', 'theft']),
    priority_weight: 1,
    auto_route: true,
    escalation_threshold: 1,
    color_code: '#F44336',
    icon_name: 'Security'
  },
  {
    category_name: 'General Feedback & Suggestions',
    department: 'CUSTOMER_SERVICE',
    keywords: JSON.stringify(['feedback', 'suggestion', 'idea', 'improvement', 'opinion', 'review']),
    priority_weight: 4,
    auto_route: true,
    escalation_threshold: 5,
    color_code: '#607D8B',
    icon_name: 'Feedback'
  }
];

async function seedIssueCategories() {
  try {
    console.log('🌱 Seeding issue categories...');
    
    for (const category of ISSUE_CATEGORIES) {
      // Check if category already exists
      const existing = await prisma.issueCategory.findFirst({
        where: { category_name: category.category_name }
      });
      
      if (!existing) {
        await prisma.issueCategory.create({
          data: category
        });
        console.log(`✅ Created category: ${category.category_name}`);
      } else {
        console.log(`⏭️  Category already exists: ${category.category_name}`);
      }
    }
    
    console.log('🎉 Issue categories seeding completed!');
    
  } catch (error) {
    console.error('❌ Error seeding issue categories:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedIssueCategories();
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { seedIssueCategories };