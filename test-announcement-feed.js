import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Test credentials - adjust based on your test data
const ADMIN_CREDENTIALS = {
  email: 'admin@bakilid.gov.ph',
  password: 'admin123'
};

let authToken = '';
let testAnnouncementId = null;

async function login() {
  console.log('🔐 Logging in as admin...');
  try {
    const response = await axios.post(`${API_URL}/auth/login`, ADMIN_CREDENTIALS);
    authToken = response.data.token;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function testGetAllAnnouncements() {
  console.log('\n📋 Testing: Get All Announcements');
  try {
    const response = await axios.get(`${API_URL}/announcements`);
    console.log('✅ Success:', response.data.data?.length || 0, 'announcements found');
    
    if (response.data.data && response.data.data.length > 0) {
      const announcement = response.data.data[0];
      testAnnouncementId = announcement.id;
      console.log('   Sample announcement:', {
        id: announcement.id,
        title: announcement.title,
        isPinned: announcement.isPinned,
        category: announcement.category,
        priority: announcement.priority
      });
    }
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    return false;
  }
}

async function testCreateAnnouncement() {
  console.log('\n📝 Testing: Create Announcement');
  try {
    const newAnnouncement = {
      title: 'Test Announcement - Modern Feed',
      description: 'This is a test announcement for the new modern feed design. It includes all the new features like pinning and categories.',
      priority: 'High',
      status: 'Active',
      category: 'Advisory'
    };

    const response = await axios.post(
      `${API_URL}/announcements`,
      newAnnouncement,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    testAnnouncementId = response.data.data.id;
    console.log('✅ Announcement created:', response.data.data.id);
    console.log('   Title:', response.data.data.title);
    console.log('   Priority:', response.data.data.priority);
    console.log('   Category:', response.data.data.category);
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    return false;
  }
}

async function testTogglePin() {
  if (!testAnnouncementId) {
    console.log('\n⚠️ Skipping: Toggle Pin (no announcement ID)');
    return false;
  }

  console.log('\n📌 Testing: Toggle Pin Announcement');
  try {
    const response = await axios.patch(
      `${API_URL}/announcements/${testAnnouncementId}/pin`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    console.log('✅ Pin toggled:', response.data.message);
    console.log('   isPinned:', response.data.data.isPinned);
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    return false;
  }
}

async function testArchiveAnnouncement() {
  if (!testAnnouncementId) {
    console.log('\n⚠️ Skipping: Archive (no announcement ID)');
    return false;
  }

  console.log('\n📦 Testing: Archive Announcement');
  try {
    const response = await axios.patch(
      `${API_URL}/announcements/${testAnnouncementId}/archive`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    console.log('✅ Announcement archived:', response.data.message);
    console.log('   Status:', response.data.data.status);
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    return false;
  }
}

async function testUpdateAnnouncement() {
  if (!testAnnouncementId) {
    console.log('\n⚠️ Skipping: Update (no announcement ID)');
    return false;
  }

  console.log('\n✏️ Testing: Update Announcement');
  try {
    const updateData = {
      title: 'Updated Test Announcement',
      description: 'This announcement has been updated to test the edit functionality.',
      priority: 'Urgent'
    };

    const response = await axios.put(
      `${API_URL}/announcements/${testAnnouncementId}`,
      updateData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    console.log('✅ Announcement updated');
    console.log('   New title:', response.data.data.title);
    console.log('   New priority:', response.data.data.priority);
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testing Task 10 - Modern Announcement Feed API\n');
  console.log('='.repeat(60));

  const loggedIn = await login();
  if (!loggedIn) {
    console.log('\n❌ Cannot proceed without authentication');
    return;
  }

  await testGetAllAnnouncements();
  await testCreateAnnouncement();
  await testTogglePin();
  await testTogglePin(); // Toggle back
  await testUpdateAnnouncement();
  await testArchiveAnnouncement();

  console.log('\n' + '='.repeat(60));
  console.log('✅ All tests completed!');
  console.log('\n📌 Key Features Tested:');
  console.log('   ✓ Get announcements');
  console.log('   ✓ Create announcement with new fields');
  console.log('   ✓ Toggle pin status');
  console.log('   ✓ Update announcement');
  console.log('   ✓ Archive announcement');
  console.log('\n💡 Next: Test the frontend at http://localhost:5173');
  console.log('   - Login as admin');
  console.log('   - Navigate to Announcements tab');
  console.log('   - Test the modern feed UI');
}

runTests().catch(console.error);
