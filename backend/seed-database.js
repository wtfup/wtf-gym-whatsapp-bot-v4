const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // 1. Seed WhatsApp Groups (Departments)
    console.log('📱 Seeding WhatsApp Groups...');
    const groupsData = [
      {
        group_id: 'equipment-maintenance-group',
        group_name: 'Equipment Maintenance Team',
        department: 'EQUIPMENT_MAINTENANCE',
        priority_level: 1,
        response_time_kpi: 15,
        description: 'Handles all gym equipment breakdowns and maintenance issues',
        contact_person: 'Maintenance Manager'
      },
      {
        group_id: 'facility-management-group',
        group_name: 'Facility Management',
        department: 'FACILITY_MANAGEMENT',
        priority_level: 2,
        response_time_kpi: 30,
        description: 'HVAC, electricity, water, infrastructure issues',
        contact_person: 'Facility Manager'
      },
      {
        group_id: 'customer-service-group',
        group_name: 'Customer Service Team',
        department: 'CUSTOMER_SERVICE',
        priority_level: 3,
        response_time_kpi: 10,
        description: 'Member complaints, billing, general inquiries',
        contact_person: 'Customer Service Head'
      },
      {
        group_id: 'management-escalation-group',
        group_name: 'Management Escalation',
        department: 'MANAGEMENT',
        priority_level: 1,
        response_time_kpi: 5,
        description: 'Critical issues and escalated complaints',
        contact_person: 'Gym Manager'
      }
    ];

    for (const groupData of groupsData) {
      try {
        await prisma.whatsAppGroup.create({
          data: groupData
        });
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️ Group ${groupData.group_name} already exists, skipping...`);
        } else {
          throw error;
        }
      }
    }

    // 2. Seed Issue Categories
    console.log('🏷️ Seeding Issue Categories...');
    const categoriesData = [
      {
        category_name: 'Equipment Breakdown',
        department: 'EQUIPMENT_MAINTENANCE',
        keywords: JSON.stringify(['broken', 'not working', 'out of order', 'machine', 'equipment', 'treadmill', 'weights', 'खराब', 'काम नहीं कर रहा']),
        priority_weight: 1,
        escalation_threshold: 2,
        color_code: '#FF5722',
        icon_name: 'Build'
      },
      {
        category_name: 'AC/HVAC Issues',
        department: 'FACILITY_MANAGEMENT',
        keywords: JSON.stringify(['AC', 'air conditioning', 'temperature', 'hot', 'cold', 'ventilation', 'ठंडा', 'गर्म']),
        priority_weight: 2,
        escalation_threshold: 3,
        color_code: '#2196F3',
        icon_name: 'Thermostat'
      },
      {
        category_name: 'Cleanliness Issues',
        department: 'FACILITY_MANAGEMENT',
        keywords: JSON.stringify(['dirty', 'clean', 'smell', 'bathroom', 'toilet', 'hygiene', 'गंदा', 'साफ']),
        priority_weight: 3,
        escalation_threshold: 2,
        color_code: '#4CAF50',
        icon_name: 'CleaningServices'
      },
      {
        category_name: 'Staff Issues',
        department: 'CUSTOMER_SERVICE',
        keywords: JSON.stringify(['staff', 'trainer', 'rude', 'behavior', 'attitude', 'employee', 'स्टाफ', 'ट्रेनर']),
        priority_weight: 2,
        escalation_threshold: 1,
        color_code: '#FF9800',
        icon_name: 'Person'
      },
      {
        category_name: 'Billing & Membership',
        department: 'CUSTOMER_SERVICE',
        keywords: JSON.stringify(['bill', 'payment', 'membership', 'fee', 'money', 'charge', 'बिल', 'पैसा']),
        priority_weight: 4,
        escalation_threshold: 3,
        color_code: '#9C27B0',
        icon_name: 'Payment'
      },
      {
        category_name: 'Safety & Emergency',
        department: 'MANAGEMENT',
        keywords: JSON.stringify(['emergency', 'injury', 'hurt', 'danger', 'safety', 'fire', 'accident', 'चोट', 'खतरा']),
        priority_weight: 1,
        escalation_threshold: 1,
        color_code: '#F44336',
        icon_name: 'Warning'
      }
    ];

    for (const categoryData of categoriesData) {
      try {
        await prisma.issueCategory.create({
          data: categoryData
        });
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️ Category ${categoryData.category_name} already exists, skipping...`);
        } else {
          throw error;
        }
      }
    }

    // 3. Create Routing Rules
    console.log('🔄 Creating Routing Rules...');
    const groups = await prisma.whatsAppGroup.findMany();
    const categories = await prisma.issueCategory.findMany();

    for (const category of categories) {
      const targetGroup = groups.find(g => g.department === category.department);
      if (targetGroup) {
        await prisma.routingRule.create({
          data: {
            rule_name: `Auto-route ${category.category_name} to ${targetGroup.group_name}`,
            category_id: category.id,
            whatsapp_group_id: targetGroup.id,
            condition_logic: JSON.stringify({
              keywords: JSON.parse(category.keywords),
              min_confidence: 0.7,
              escalation_enabled: true
            }),
            severity_filter: JSON.stringify(['medium', 'high', 'critical']),
            priority: category.priority_weight,
            escalation_enabled: true,
            escalation_timeout: category.escalation_threshold * 30
          }
        });
      }
    }

    console.log('✅ Database seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`- WhatsApp Groups: ${groups.length}`);
    console.log(`- Issue Categories: ${categories.length}`);
    console.log(`- Routing Rules: ${categories.length}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = { seedDatabase };

// Run if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}