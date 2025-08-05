#!/usr/bin/env node

/**
 * 🔥 CREATE REAL ROUTING RULES FOR CURRENT WHATSAPP ACCOUNT
 * 
 * This script maps issue categories to ACTUAL WhatsApp groups
 * that exist in the current account, replacing fake group references.
 */

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

async function createRealRoutingRules() {
  try {
    console.log('🔥 CREATING REAL ROUTING RULES...');
    
    // 1. Get current WhatsApp groups
    console.log('📱 Fetching current WhatsApp groups...');
    const groupsResponse = await axios.get('http://localhost:3010/api/whatsapp-groups/fresh');
    const responseData = groupsResponse.data;
    const realGroups = Array.isArray(responseData.groups) ? responseData.groups : 
                       Array.isArray(responseData) ? responseData : [];
    
    if (realGroups.length === 0) {
      console.error('API Response:', responseData);
      throw new Error('No WhatsApp groups found! Make sure bot is connected.');
    }
    
    console.log(`✅ Found ${realGroups.length} real WhatsApp groups`);
    realGroups.forEach((group, i) => {
      console.log(`   ${i+1}. ${group.name} (${group.id})`);
    });
    
    // 2. Get issue categories
    console.log('\n📋 Fetching issue categories...');
    const categoriesResponse = await axios.get('http://localhost:3010/api/issue-categories');
    const categories = categoriesResponse.data || [];
    
    console.log(`✅ Found ${categories.length} issue categories`);
    
    // 3. Clear related records first (to avoid foreign key constraints)
    console.log('\n🗑️ Clearing routing logs...');
    const deletedLogs = await prisma.messageRoutingLog.deleteMany({});
    console.log(`✅ Deleted ${deletedLogs.count} routing logs`);
    
    // 4. Clear old routing rules
    console.log('\n🗑️ Clearing old routing rules...');
    const deletedRules = await prisma.routingRule.deleteMany({});
    console.log(`✅ Deleted ${deletedRules.count} old routing rules`);
    
    // 5. Clear old group records
    console.log('\n🗑️ Clearing old group records...');
    const deletedGroups = await prisma.whatsAppGroup.deleteMany({});
    console.log(`✅ Deleted ${deletedGroups.count} old group records`);
    
    // 6. Insert real WhatsApp groups into database
    console.log('\n💾 Storing real WhatsApp groups in database...');
    const groupInserts = [];
    
    for (const group of realGroups) {
      // Smart department mapping based on group name
      let department = 'CUSTOMER_SERVICE'; // default
      const groupName = group.name.toLowerCase();
      
      if (groupName.includes('facility') || groupName.includes('maintenance') || 
          groupName.includes('housekeeping') || groupName.includes('service and status')) {
        department = 'FACILITY_MANAGEMENT';
      } else if (groupName.includes('command') || groupName.includes('management') ||
                 groupName.includes('escalation') || groupName.includes('cms and hr')) {
        department = 'MANAGEMENT';
      } else if (groupName.includes('tech') || groupName.includes('equipment')) {
        department = 'EQUIPMENT_MAINTENANCE';
      }
      
      groupInserts.push({
        group_id: group.id,
        group_name: group.name,
        department: department,
        description: group.description || '',
        is_active: true,
        participant_count: group.participantCount || 0
      });
    }
    
    await prisma.whatsAppGroup.createMany({
      data: groupInserts
    });
    
    console.log(`✅ Stored ${groupInserts.length} real groups in database`);
    
    // 7. Create smart group mappings
    const groupMappings = createSmartGroupMappings(realGroups, categories);
    
    // 8. Create routing rules
    console.log('\n🎯 Creating routing rules...');
    let rulesCreated = 0;
    
    for (const category of categories) {
      const targetGroup = groupMappings[category.department] || groupMappings['DEFAULT'];
      
      if (targetGroup) {
        const dbGroup = await prisma.whatsAppGroup.findFirst({
          where: { group_id: targetGroup.id }
        });
        
        if (dbGroup) {
          await prisma.routingRule.create({
            data: {
              category_id: category.id,
              whatsapp_group_id: dbGroup.id, // Use database ID, not WhatsApp ID
              severity_filter: ['medium', 'high', 'critical'],
              is_active: true
            }
          });
          
          rulesCreated++;
          console.log(`✅ Created rule: ${category.category_name} → ${targetGroup.name}`);
        }
      }
    }
    
    console.log(`\n🎉 SUCCESS! Created ${rulesCreated} routing rules with real WhatsApp groups!`);
    
    // 9. Verify the setup
    console.log('\n🔍 Verifying setup...');
    const verifyResponse = await axios.get('http://localhost:3010/api/whatsapp-routing-rules');
    const newRules = verifyResponse.data.rules || [];
    
    console.log(`✅ Verification: ${newRules.length} active routing rules`);
    newRules.forEach((rule, i) => {
      const status = rule.group_status?.botInGroup ? '✅ Bot in group' : '❌ Bot not in group';
      console.log(`   ${i+1}. ${rule.category_name} → ${rule.group_name} (${status})`);
    });
    
  } catch (error) {
    console.error('❌ Error creating routing rules:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Smart mapping of departments to actual WhatsApp groups
 */
function createSmartGroupMappings(realGroups, categories) {
  const mappings = {};
  
  // Find best matches for each department
  const facilityGroup = realGroups.find(g => 
    g.name.toLowerCase().includes('facility') || 
    g.name.toLowerCase().includes('maintenance')
  );
  
  const techGroup = realGroups.find(g => 
    g.name.toLowerCase().includes('tech') || 
    g.name.toLowerCase().includes('issue') ||
    g.name.toLowerCase().includes('gym tech')
  );
  
  const managementGroup = realGroups.find(g => 
    g.name.toLowerCase().includes('command') || 
    g.name.toLowerCase().includes('management') ||
    g.name.toLowerCase().includes('escalation')
  );
  
  const testGroup = realGroups.find(g => 
    g.name.toLowerCase().includes('test')
  );
  
  // Create department mappings
  mappings['FACILITY_MANAGEMENT'] = facilityGroup || techGroup || testGroup;
  mappings['EQUIPMENT_MAINTENANCE'] = techGroup || facilityGroup || testGroup;
  mappings['MANAGEMENT'] = managementGroup || techGroup || testGroup;
  mappings['CUSTOMER_SERVICE'] = techGroup || testGroup;
  mappings['DEFAULT'] = testGroup || realGroups[0]; // Fallback
  
  console.log('\n🎯 Smart Group Mappings:');
  Object.entries(mappings).forEach(([dept, group]) => {
    if (group) {
      console.log(`   ${dept} → ${group.name}`);
    }
  });
  
  return mappings;
}

// Run the script
if (require.main === module) {
  createRealRoutingRules()
    .then(() => {
      console.log('\n🎉 Routing rules setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Failed to setup routing rules:', error);
      process.exit(1);
    });
}

module.exports = { createRealRoutingRules };