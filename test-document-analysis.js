// Test script for document analysis functionality
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:3001/api';

async function testDocumentAnalysis() {
  console.log('🧪 Testing Document Analysis System...\n');

  try {
    // Test 1: Check if the backend is responding
    console.log('1. Testing backend connectivity...');
    const healthCheck = await fetch(`${API_BASE}/health`);
    if (healthCheck.ok) {
      console.log('✅ Backend is running\n');
    } else {
      console.log('❌ Backend not responding\n');
      return;
    }

    // Test 2: Test chat with document analysis intent
    console.log('2. Testing document analysis intent...');
    const chatResponse = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'I want to upload my GST certificate for analysis',
        userId: 'test-user-' + Date.now(),
        chatId: 'test-chat-' + Date.now(),
        userProfile: {
          businessType: 'Cafe',
          state: 'Karnataka'
        }
      })
    });

    if (chatResponse.ok) {
      const chatData = await chatResponse.json();
      console.log('✅ Chat response:', chatData.response.substring(0, 100) + '...\n');
    } else {
      console.log('❌ Chat endpoint failed\n');
    }

    // Test 3: Test file upload with mock document context
    console.log('3. Testing file upload analysis...');
    
    // Create a simple test file
    const testContent = `GST Certificate
GSTIN: 29ABCDE1234F1Z5
Business Name: Test Cafe
Address: 123 Main Street, Bangalore, Karnataka
PAN: ABCDE1234F
Date of Registration: 01/01/2024`;
    
    const testFilePath = path.join(process.cwd(), 'test-gst-doc.txt');
    fs.writeFileSync(testFilePath, testContent);

    const form = new FormData();
    form.append('files', fs.createReadStream(testFilePath), 'gst-certificate.txt');
    form.append('message', 'Please analyze this GST certificate for compliance');
    form.append('userId', 'test-user-' + Date.now());
    form.append('chatId', 'test-chat-' + Date.now());
    form.append('userProfile', JSON.stringify({
      businessType: 'Cafe',
      state: 'Karnataka'
    }));

    const uploadResponse = await fetch(`${API_BASE}/files/chat-upload`, {
      method: 'POST',
      body: form
    });

    if (uploadResponse.ok) {
      const uploadData = await uploadResponse.json();
      console.log('✅ File upload successful');
      console.log('📊 Analysis Summary:');
      console.log(`   - Files processed: ${uploadData.fileResults?.length || 0}`);
      console.log(`   - Compliance score: ${uploadData.combinedAnalysis?.complianceScore || 0}%`);
      console.log(`   - Extracted fields: ${Object.keys(uploadData.combinedAnalysis?.extractedFields || {}).length}`);
      console.log(`   - Issues found: ${uploadData.combinedAnalysis?.allIssues?.length || 0}`);
      console.log('💬 AI Response:', uploadData.chatResponse?.response?.substring(0, 150) + '...\n');
    } else {
      const errorData = await uploadResponse.text();
      console.log('❌ File upload failed:', errorData, '\n');
    }

    // Cleanup
    fs.unlinkSync(testFilePath);

    console.log('🎉 Document Analysis System Test Complete!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Add health check endpoint test
async function testHealthEndpoint() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    if (!response.ok) {
      console.log('Health endpoint not found, creating basic test...');
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
}

// Run the test
testDocumentAnalysis().then(() => {
  console.log('Test execution completed.');
}).catch(error => {
  console.error('Test execution failed:', error);
});