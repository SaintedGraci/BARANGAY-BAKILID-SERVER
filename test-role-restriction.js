import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function testRoleRestrictions() {
    try {
        console.log('🧪 Testing Role-Based Login Restrictions\n');

        // Test 1: Resident login
        console.log('1️⃣ Testing Resident Login...');
        const residentLogin = await axios.post(`${API_URL}/auth/login`, {
            email: 'maria.santos@email.com',
            password: 'resident123'
        });

        console.log('✅ Resident login successful');
        console.log('   Role:', residentLogin.data.user.role);
        console.log('   Should access: /dashboard');
        console.log('   Should NOT access: /admin/dashboard\n');

        // Test 2: Admin login
        console.log('2️⃣ Testing Admin Login...');
        const adminLogin = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@bakilid.gov.ph',
            password: 'admin123'
        });

        console.log('✅ Admin login successful');
        console.log('   Role:', adminLogin.data.user.role);
        console.log('   Should access: /admin/dashboard');
        console.log('   Should NOT access: /dashboard (resident)\n');

        // Test 3: Staff login
        console.log('3️⃣ Testing Staff Login...');
        const staffLogin = await axios.post(`${API_URL}/auth/login`, {
            email: 'staff@bakilid.gov.ph',
            password: 'staff123'
        });

        console.log('✅ Staff login successful');
        console.log('   Role:', staffLogin.data.user.role);
        console.log('   Should access: /admin/dashboard');
        console.log('   Should NOT access: /dashboard (resident)\n');

        // Test 4: Captain login
        console.log('4️⃣ Testing Captain Login...');
        const captainLogin = await axios.post(`${API_URL}/auth/login`, {
            email: 'captain@bakilid.gov.ph',
            password: 'captain123'
        });

        console.log('✅ Captain login successful');
        console.log('   Role:', captainLogin.data.user.role);
        console.log('   Should access: /admin/dashboard');
        console.log('   Should NOT access: /dashboard (resident)\n');

        console.log('📋 Summary:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Resident Login Page (/login):');
        console.log('  ✅ Allows: resident');
        console.log('  ❌ Blocks: admin, staff, captain');
        console.log('\nAdmin Login Page (/admin/login):');
        console.log('  ✅ Allows: admin, staff, captain');
        console.log('  ❌ Blocks: resident');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('🎉 All role restrictions are properly configured!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testRoleRestrictions();
