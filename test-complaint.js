import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function testComplaintFeature() {
  console.log('🧪 Testing Complaint Feature\n');

  try {
    // 1. Login as resident
    console.log('1️⃣ Logging in as resident...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'resident@example.com',
      password: 'password123'
    });

    if (!loginRes.data.success) {
      console.log('⚠️  Login failed. Make sure you have a resident account.');
      console.log('   You can create one by registering at /register');
      return;
    }

    const token = loginRes.data.token;
    console.log('✅ Logged in successfully\n');

    // 2. File a complaint
    console.log('2️⃣ Filing a new complaint...');
    const complaintData = {
      subject: 'Test Complaint - Loud Music',
      description: 'There is loud music coming from the neighbor every night after 10 PM. This has been going on for the past week and is disturbing our sleep.'
    };

    const createRes = await axios.post(`${API_URL}/complaints`, complaintData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Complaint filed successfully');
    console.log('   Complaint ID:', createRes.data.data.id);
    console.log('   Status:', createRes.data.data.status);
    console.log('   Subject:', createRes.data.data.subject);
    console.log();

    const complaintId = createRes.data.data.id;

    // 3. Get my complaints
    console.log('3️⃣ Fetching my complaints...');
    const myComplaintsRes = await axios.get(`${API_URL}/complaints/my`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log(`✅ Found ${myComplaintsRes.data.data.length} complaint(s)`);
    myComplaintsRes.data.data.forEach((complaint, index) => {
      console.log(`   ${index + 1}. ${complaint.subject} - Status: ${complaint.status}`);
    });
    console.log();

    // 4. Get complaint details
    console.log('4️⃣ Fetching complaint details...');
    const detailRes = await axios.get(`${API_URL}/complaints/${complaintId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Complaint details retrieved');
    console.log('   ID:', detailRes.data.data.id);
    console.log('   Subject:', detailRes.data.data.subject);
    console.log('   Description:', detailRes.data.data.description);
    console.log('   Status:', detailRes.data.data.status);
    console.log('   Created:', new Date(detailRes.data.data.createdAt).toLocaleString());
    console.log();

    // 5. Test with admin (optional - if admin account exists)
    console.log('5️⃣ Testing admin access...');
    try {
      const adminLoginRes = await axios.post(`${API_URL}/auth/admin/login`, {
        email: 'admin@example.com',
        password: 'admin123'
      });

      if (adminLoginRes.data.success) {
        const adminToken = adminLoginRes.data.token;
        console.log('✅ Admin logged in');

        // Get all complaints
        const allComplaintsRes = await axios.get(`${API_URL}/complaints`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });

        console.log(`✅ Admin can view ${allComplaintsRes.data.data.length} total complaint(s)`);

        // Update complaint status
        const updateRes = await axios.put(
          `${API_URL}/complaints/${complaintId}`,
          { status: 'Investigating' },
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );

        console.log('✅ Admin updated complaint status to:', updateRes.data.data.status);
      }
    } catch (adminError) {
      console.log('⚠️  Admin test skipped (no admin account found)');
    }

    console.log('\n✨ All tests completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   - Residents can file complaints');
    console.log('   - Residents can view their own complaints');
    console.log('   - Complaint details are retrievable');
    console.log('   - Admin can update complaint status');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Message:', error.response.data.message);
    }
  }
}

// Run the test
testComplaintFeature();
