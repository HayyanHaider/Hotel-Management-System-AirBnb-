const axios = require('axios');

async function testAdminLogin() {
    try {
        console.log('🔐 Testing admin login...\n');

        // Step 1: Login
        const loginResponse = await axios.post('http://`localhost:5000`/api/auth/login', {
            email: 'admin@hotelmanagement.com',
            password: 'admin123'
        });

        console.log('✅ Login successful!');
        console.log('Token:', loginResponse.data.token);
        console.log('User:', JSON.stringify(loginResponse.data.user, null, 2));
        console.log('\n---\n');

        // Step 2: Try to access admin dashboard stats with the token
        const token = loginResponse.data.token;
        console.log('📊 Fetching dashboard stats with token...\n');

        const statsResponse = await axios.get('http://localhost:5000/api/admin/dashboard/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('✅ Dashboard stats retrieved successfully!');
        console.log('Stats:', JSON.stringify(statsResponse.data, null, 2));

    } catch (error) {
        console.error('❌ Error:', error.response?.status, error.response?.statusText);
        console.error('Error message:', error.response?.data?.message || error.message);
        console.error('Full error data:', JSON.stringify(error.response?.data, null, 2));
    }
}

testAdminLogin();
