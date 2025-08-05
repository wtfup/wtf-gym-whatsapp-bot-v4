#!/usr/bin/env node

/**
 * 🧪 COMPREHENSIVE WHATSAPP ROUTING SYSTEM TEST SUITE
 * 
 * Tests all components of the WhatsApp routing functionality
 * including real-time data, routing rules, and account switching.
 */

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const API_BASE = 'http://localhost:3010';
const prisma = new PrismaClient();

// Test Results Tracker
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  failures: []
};

/**
 * 🧪 Test Helper Functions
 */
function logTest(name, status, details = '') {
  testResults.total++;
  if (status === 'PASS') {
    testResults.passed++;
    console.log(`✅ ${name}`);
  } else {
    testResults.failed++;
    testResults.failures.push({ name, details });
    console.log(`❌ ${name} - ${details}`);
  }
}

async function makeRequest(endpoint, method = 'GET', data = null) {
  try {
    const config = { method, url: `${API_BASE}${endpoint}` };
    if (data) config.data = data;
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { success: false, error: error.message, status: error.response?.status };
  }
}

/**
 * 🧪 TEST SUITE 1: WhatsApp Data Manager Tests
 */
async function testWhatsAppDataManager() {
  console.log('\n🧪 TESTING: WhatsApp Data Manager');
  
  // Test 1: Data Manager Status
  const statsResult = await makeRequest('/api/whatsapp/data-stats');
  logTest(
    'Data Manager Stats API',
    statsResult.success ? 'PASS' : 'FAIL',
    statsResult.success ? '' : statsResult.error
  );
  
  // Test 2: Fresh Groups Data
  const groupsResult = await makeRequest('/api/whatsapp-groups/fresh');
  logTest(
    'Fresh WhatsApp Groups API',
    groupsResult.success && groupsResult.data.groups ? 'PASS' : 'FAIL',
    groupsResult.success ? `Found ${groupsResult.data.groups?.length || 0} groups` : groupsResult.error
  );
  
  // Test 3: Real-time Messages
  const messagesResult = await makeRequest('/api/messages?limit=10');
  logTest(
    'Real-time Messages API',
    messagesResult.success && Array.isArray(messagesResult.data) ? 'PASS' : 'FAIL',
    messagesResult.success ? `Found ${messagesResult.data?.length || 0} messages` : messagesResult.error
  );
  
  // Test 4: Senders Data
  const sendersResult = await makeRequest('/api/whatsapp/senders');
  logTest(
    'WhatsApp Senders API',
    sendersResult.success && sendersResult.data.senders ? 'PASS' : 'FAIL',
    sendersResult.success ? `Found ${sendersResult.data.senders?.length || 0} senders` : sendersResult.error
  );
  
  // Test 5: Data Manager Force Refresh
  const refreshResult = await makeRequest('/api/whatsapp/force-refresh', 'POST');
  logTest(
    'Data Manager Force Refresh',
    refreshResult.success ? 'PASS' : 'FAIL',
    refreshResult.success ? 'Refresh completed' : refreshResult.error
  );
}

/**
 * 🧪 TEST SUITE 2: Issue Categories Tests
 */
async function testIssueCategories() {
  console.log('\n🧪 TESTING: Issue Categories');
  
  // Test 1: Categories API
  const categoriesResult = await makeRequest('/api/issue-categories');
  logTest(
    'Issue Categories API',
    categoriesResult.success && Array.isArray(categoriesResult.data) ? 'PASS' : 'FAIL',
    categoriesResult.success ? `Found ${categoriesResult.data?.length || 0} categories` : categoriesResult.error
  );
  
  // Test 2: Categories have required fields
  if (categoriesResult.success && categoriesResult.data.length > 0) {
    const category = categoriesResult.data[0];
    const hasRequiredFields = category.id && category.category_name && category.department;
    logTest(
      'Categories Schema Validation',
      hasRequiredFields ? 'PASS' : 'FAIL',
      hasRequiredFields ? 'All required fields present' : 'Missing required fields'
    );
  }
  
  // Test 3: Categories have keywords
  if (categoriesResult.success && categoriesResult.data.length > 0) {
    const categoriesWithKeywords = categoriesResult.data.filter(cat => cat.keywords && cat.keywords.length > 0);
    logTest(
      'Categories Keywords Test',
      categoriesWithKeywords.length > 0 ? 'PASS' : 'FAIL',
      `${categoriesWithKeywords.length}/${categoriesResult.data.length} categories have keywords`
    );
  }
}

/**
 * 🧪 TEST SUITE 3: Routing Rules Tests
 */
async function testRoutingRules() {
  console.log('\n🧪 TESTING: Routing Rules');
  
  // Test 1: Routing Rules API
  const rulesResult = await makeRequest('/api/whatsapp-routing-rules');
  logTest(
    'Routing Rules API',
    rulesResult.success && rulesResult.data.rules ? 'PASS' : 'FAIL',
    rulesResult.success ? `Found ${rulesResult.data.rules?.length || 0} rules` : rulesResult.error
  );
  
  // Test 2: Rules have valid group references
  if (rulesResult.success && rulesResult.data.rules.length > 0) {
    const rulesWithValidGroups = rulesResult.data.rules.filter(rule => 
      rule.group_status && rule.group_name
    );
    logTest(
      'Rules Group References',
      rulesWithValidGroups.length === rulesResult.data.rules.length ? 'PASS' : 'FAIL',
      `${rulesWithValidGroups.length}/${rulesResult.data.rules.length} rules have valid group references`
    );
  }
  
  // Test 3: Rules have bot in group status
  if (rulesResult.success && rulesResult.data.rules.length > 0) {
    const rulesWithBotInGroup = rulesResult.data.rules.filter(rule => 
      rule.group_status?.botInGroup === true
    );
    logTest(
      'Bot in Target Groups',
      rulesWithBotInGroup.length > 0 ? 'PASS' : 'FAIL',
      `${rulesWithBotInGroup.length}/${rulesResult.data.rules.length} rules target groups where bot is present`
    );
  }
}

/**
 * 🧪 TEST SUITE 4: Database Consistency Tests
 */
async function testDatabaseConsistency() {
  console.log('\n🧪 TESTING: Database Consistency');
  
  try {
    // Test 1: Categories count consistency
    const dbCategories = await prisma.issueCategory.count();
    const apiCategoriesResult = await makeRequest('/api/issue-categories');
    const apiCategories = apiCategoriesResult.success ? apiCategoriesResult.data.length : 0;
    
    logTest(
      'Categories DB-API Consistency',
      dbCategories === apiCategories ? 'PASS' : 'FAIL',
      `DB: ${dbCategories}, API: ${apiCategories}`
    );
    
    // Test 2: WhatsApp groups consistency
    const dbGroups = await prisma.whatsAppGroup.count();
    const apiGroupsResult = await makeRequest('/api/whatsapp-groups/fresh');
    const apiGroups = apiGroupsResult.success ? apiGroupsResult.data.groups.length : 0;
    
    logTest(
      'Groups DB-API Consistency',
      Math.abs(dbGroups - apiGroups) <= 2 ? 'PASS' : 'FAIL', // Allow small variance
      `DB: ${dbGroups}, API: ${apiGroups}`
    );
    
    // Test 3: Routing rules foreign key integrity
    const routingRules = await prisma.routingRule.findMany({
      include: {
        whatsapp_group: true,
        issue_category: true
      }
    });
    
    const validRules = routingRules.filter(rule => rule.whatsapp_group && rule.issue_category);
    logTest(
      'Routing Rules Foreign Key Integrity',
      validRules.length === routingRules.length ? 'PASS' : 'FAIL',
      `${validRules.length}/${routingRules.length} rules have valid foreign keys`
    );
    
  } catch (error) {
    logTest('Database Connection', 'FAIL', error.message);
  }
}

/**
 * 🧪 TEST SUITE 5: Real-time Update Tests
 */
async function testRealTimeUpdates() {
  console.log('\n🧪 TESTING: Real-time Updates');
  
  // Test 1: Socket connection (check if backend emits data)
  // This is a simplified test - in production, we'd use socket.io-client
  const initialMessages = await makeRequest('/api/messages?limit=5');
  
  if (initialMessages.success) {
    logTest(
      'Real-time Data Availability',
      'PASS',
      'Messages API responsive for real-time testing'
    );
  } else {
    logTest(
      'Real-time Data Availability',
      'FAIL',
      'Messages API not responding'
    );
  }
  
  // Test 2: Data freshness (check if timestamps are recent)
  if (initialMessages.success && initialMessages.data.length > 0) {
    const latestMessage = initialMessages.data[0];
    const messageTime = new Date(latestMessage.received_at || latestMessage.timestamp);
    const now = new Date();
    const timeDiff = now - messageTime;
    const hoursOld = timeDiff / (1000 * 60 * 60);
    
    logTest(
      'Data Freshness',
      hoursOld < 24 ? 'PASS' : 'FAIL', // Messages should be less than 24 hours old
      `Latest message is ${hoursOld.toFixed(1)} hours old`
    );
  }
}

/**
 * 🧪 TEST SUITE 6: Error Handling Tests
 */
async function testErrorHandling() {
  console.log('\n🧪 TESTING: Error Handling');
  
  // Test 1: Invalid endpoint
  const invalidResult = await makeRequest('/api/invalid-endpoint');
  logTest(
    'Invalid Endpoint Handling',
    !invalidResult.success && invalidResult.status === 404 ? 'PASS' : 'FAIL',
    `Status: ${invalidResult.status}`
  );
  
  // Test 2: Invalid routing rule creation
  const invalidRuleResult = await makeRequest('/api/whatsapp-routing-rules', 'POST', {
    categoryId: 99999, // Non-existent category
    whatsappGroupId: 'invalid-group'
  });
  
  logTest(
    'Invalid Data Handling',
    !invalidRuleResult.success ? 'PASS' : 'FAIL',
    'API correctly rejects invalid data'
  );
}

/**
 * 🧪 MAIN TEST RUNNER
 */
async function runAllTests() {
  console.log('🧪 WHATSAPP ROUTING SYSTEM - COMPREHENSIVE TEST SUITE');
  console.log('=' .repeat(60));
  
  try {
    await testWhatsAppDataManager();
    await testIssueCategories();
    await testRoutingRules();
    await testDatabaseConsistency();
    await testRealTimeUpdates();
    await testErrorHandling();
    
  } catch (error) {
    console.error('❌ Test suite execution failed:', error);
  } finally {
    await prisma.$disconnect();
  }
  
  // Print summary
  console.log('\n' + '=' .repeat(60));
  console.log('🧪 TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Total:  ${testResults.total}`);
  console.log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.failures.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.failures.forEach((failure, i) => {
      console.log(`   ${i + 1}. ${failure.name}: ${failure.details}`);
    });
  }
  
  console.log('\n🎯 RECOMMENDATIONS:');
  if (testResults.failed === 0) {
    console.log('   ✅ All tests passed! System is working correctly.');
  } else {
    console.log('   🔧 Fix failed tests to ensure system reliability.');
    console.log('   🔄 Re-run tests after fixes.');
  }
  
  process.exit(testResults.failed === 0 ? 0 : 1);
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests, testResults };