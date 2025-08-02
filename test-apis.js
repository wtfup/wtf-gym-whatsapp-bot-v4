const axios = require('axios');

const BASE_URL = 'http://localhost:3010';

async function testAdvancedAnalytics() {
  console.log('\n🧠 Testing Advanced Analytics API...');
  try {
    const response = await axios.get(`${BASE_URL}/api/advanced-analytics?timeframe=7`);
    console.log('✅ Advanced Analytics Response:');
    console.log(`   - Total Messages: ${response.data.overview.total_messages}`);
    console.log(`   - Flagged Messages: ${response.data.overview.flagged_messages}`);
    console.log(`   - Flagging Rate: ${response.data.overview.flagging_rate.toFixed(2)}%`);
    console.log(`   - Avg Processing Time: ${response.data.overview.avg_processing_time}ms`);
    console.log(`   - Avg Confidence: ${response.data.overview.avg_confidence}%`);
    console.log(`   - Categories Found: ${response.data.category_distribution.length}`);
    console.log(`   - High Risk Messages: ${response.data.escalation_analysis.length}`);
  } catch (error) {
    console.log('❌ Advanced Analytics Failed:', error.message);
  }
}

async function testRoutingDashboard() {
  console.log('\n🔄 Testing Routing Dashboard API...');
  try {
    const response = await axios.get(`${BASE_URL}/api/routing-dashboard?timeframe=24`);
    console.log('✅ Routing Dashboard Response:');
    console.log(`   - Active Routing Rules: ${response.data.system_status.active_routing_rules}`);
    console.log(`   - Active WhatsApp Groups: ${response.data.system_status.active_whatsapp_groups}`);
    console.log(`   - Routes Processed: ${response.data.system_status.total_routes_processed}`);
    console.log(`   - Recent Activity: ${response.data.recent_activity.length} entries`);
    console.log(`   - Department Performance: ${response.data.department_performance.length} departments`);
    console.log(`   - Escalation Alerts: ${response.data.escalation_alerts.length} alerts`);
  } catch (error) {
    console.log('❌ Routing Dashboard Failed:', error.message);
  }
}

async function testEscalationMonitor() {
  console.log('\n🚨 Testing Escalation Monitor API...');
  try {
    const response = await axios.get(`${BASE_URL}/api/escalation-monitor?timeframe=7`);
    console.log('✅ Escalation Monitor Response:');
    console.log(`   - Total Messages: ${response.data.escalation_overview.total_messages}`);
    console.log(`   - Escalated Messages: ${response.data.escalation_overview.escalated_messages}`);
    console.log(`   - Escalation Rate: ${response.data.escalation_overview.escalation_rate}%`);
    console.log(`   - Critical Escalations: ${response.data.escalation_overview.critical_escalations}`);
    console.log(`   - Repetition Issues: ${response.data.escalation_overview.repetition_issues}`);
    console.log(`   - Sender Risk Profiles: ${response.data.sender_risk_profiles.length}`);
    console.log(`   - Contextual Alerts: ${response.data.contextual_alerts.length}`);
  } catch (error) {
    console.log('❌ Escalation Monitor Failed:', error.message);
  }
}

async function testAllAPIs() {
  console.log('🚀 TESTING ALL ADVANCED AI API ENDPOINTS\n');
  console.log('=' * 50);
  
  await testAdvancedAnalytics();
  await testRoutingDashboard();
  await testEscalationMonitor();
  
  console.log('\n' + '=' * 50);
  console.log('🎯 API Testing Complete!');
  console.log('\n📊 To test in browser, visit:');
  console.log(`   🧠 http://localhost:3010/api/advanced-analytics`);
  console.log(`   🔄 http://localhost:3010/api/routing-dashboard`);
  console.log(`   🚨 http://localhost:3010/api/escalation-monitor`);
}

// Run the tests
testAllAPIs().catch(console.error);