const { PrismaClient } = require('@prisma/client');
const WhatsAppClient = require('./src/whatsapp');

const prisma = new PrismaClient();

/**
 * Sync WhatsApp groups to database
 * This utility fetches current WhatsApp groups and adds them to the database
 */
async function syncWhatsAppGroups() {
  try {
    console.log('🔄 Starting WhatsApp groups synchronization...');
    
    // Initialize WhatsApp client
    const whatsappClient = new WhatsAppClient();
    await whatsappClient.initialize();
    
    // Wait for client to be ready
    console.log('⏳ Waiting for WhatsApp client to be ready...');
    while (!whatsappClient.isReady) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('✅ WhatsApp client is ready, fetching groups...');
    
    // Get all WhatsApp chats and filter for groups
    const chats = await whatsappClient.client.getChats();
    const groups = chats.filter(chat => chat.isGroup);
    
    console.log(`📊 Found ${groups.length} WhatsApp groups`);
    
    let syncedCount = 0;
    let updatedCount = 0;
    
    for (const group of groups) {
      try {
        const groupData = {
          group_id: group.id._serialized,
          group_name: group.name,
          department: 'GENERAL', // Default department
          priority_level: 3, // Default priority
          is_active: true,
          description: `WhatsApp group: ${group.name}`,
          contact_person: null
        };
        
        // Check if group already exists
        const existingGroup = await prisma.whatsAppGroup.findFirst({
          where: { group_id: groupData.group_id }
        });
        
        if (existingGroup) {
          // Update existing group
          await prisma.whatsAppGroup.update({
            where: { id: existingGroup.id },
            data: {
              group_name: groupData.group_name,
              description: groupData.description
            }
          });
          updatedCount++;
          console.log(`📝 Updated: ${group.name}`);
        } else {
          // Create new group
          await prisma.whatsAppGroup.create({
            data: groupData
          });
          syncedCount++;
          console.log(`➕ Added: ${group.name}`);
        }
        
      } catch (groupError) {
        console.error(`❌ Error syncing group "${group.name}":`, groupError.message);
      }
    }
    
    console.log(`\n🎉 Synchronization completed!`);
    console.log(`📊 Statistics:`);
    console.log(`   • New groups added: ${syncedCount}`);
    console.log(`   • Existing groups updated: ${updatedCount}`);
    console.log(`   • Total groups in database: ${syncedCount + updatedCount}`);
    
    // Clean up
    await whatsappClient.client.destroy();
    
  } catch (error) {
    console.error('❌ Error during WhatsApp groups synchronization:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Auto-run if called directly
if (require.main === module) {
  syncWhatsAppGroups()
    .then(() => {
      console.log('✅ WhatsApp groups sync completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ WhatsApp groups sync failed:', error);
      process.exit(1);
    });
}

module.exports = { syncWhatsAppGroups };