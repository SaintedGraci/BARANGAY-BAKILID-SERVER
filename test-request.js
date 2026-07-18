import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function testRequestFlow() {
    try {
        console.log('🧪 Testing Request Document Flow\n');

        // 1. Login as resident
        console.log('1️⃣ Logging in as resident...');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: 'maria.santos@email.com',
            password: 'resident123'
        });

        const token = loginResponse.data.token;
        console.log('✅ Login successful');
        console.log('   Token:', token.substring(0, 20) + '...\n');

        // 2. Create a document request
        console.log('2️⃣ Creating document request...');
        const requestResponse = await axios.post(
            `${API_URL}/requests`,
            {
                documentType: 'Barangay Clearance',
                purpose: 'Employment requirement',
                remarks: 'Urgent - needed for job application'
            },
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        console.log('✅ Request created successfully');
        console.log('   Request ID:', requestResponse.data.data.id);
        console.log('   Status:', requestResponse.data.data.status);
        console.log('   Document:', requestResponse.data.data.documentType);
        console.log('   Purpose:', requestResponse.data.data.purpose, '\n');

        // 3. Get all requests (resident view)
        console.log('3️⃣ Fetching resident requests...');
        const residentRequestsResponse = await axios.get(`${API_URL}/requests`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Requests fetched');
        console.log('   Total requests:', residentRequestsResponse.data.data.length, '\n');

        // 4. Login as admin
        console.log('4️⃣ Logging in as admin...');
        const adminLoginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@bakilid.gov.ph',
            password: 'admin123'
        });

        const adminToken = adminLoginResponse.data.token;
        console.log('✅ Admin login successful\n');

        // 5. Get all requests (admin view)
        console.log('5️⃣ Fetching all requests (admin view)...');
        const adminRequestsResponse = await axios.get(`${API_URL}/requests`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });

        console.log('✅ All requests fetched');
        console.log('   Total requests:', adminRequestsResponse.data.data.length);
        
        if (adminRequestsResponse.data.data.length > 0) {
            const lastRequest = adminRequestsResponse.data.data[0];
            console.log('   Latest request:');
            console.log('     - ID:', lastRequest.id);
            console.log('     - Document:', lastRequest.documentType);
            console.log('     - Status:', lastRequest.status);
            console.log('     - Resident:', lastRequest.Resident?.firstName, lastRequest.Resident?.lastName, '\n');
        }

        // 6. Update request status
        const requestId = requestResponse.data.data.id;
        console.log('6️⃣ Updating request status...');
        const updateResponse = await axios.put(
            `${API_URL}/requests/${requestId}`,
            { status: 'Processing' },
            { headers: { Authorization: `Bearer ${adminToken}` } }
        );

        console.log('✅ Request status updated');
        console.log('   New status:', updateResponse.data.data.status, '\n');

        console.log('🎉 All tests passed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testRequestFlow();
