import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

async function testRegistration() {
    try {
        console.log('🧪 Testing Registration with Simple Password...\n');

        const formData = new FormData();
        
        // User data
        formData.append('username', 'testuser' + Date.now());
        formData.append('email', `testuser${Date.now()}@bakilid.local`);
        formData.append('password', 'pass123'); // Simple 6 char password
        
        // Personal info
        formData.append('firstName', 'Juan');
        formData.append('middleName', 'Santos');
        formData.append('lastName', 'Dela Cruz');
        formData.append('gender', 'Male');
        formData.append('birthDate', '1990-01-15');
        formData.append('contactNumber', '09123456789');
        
        // Address
        formData.append('address', '123 Main Street');
        formData.append('purok', 'Purok 1');
        
        // Files (using existing test files or creating dummy ones)
        const uploadsDir = path.join(process.cwd(), 'uploads');
        const existingFiles = fs.readdirSync(uploadsDir).filter(f => f.endsWith('.png'));
        
        if (existingFiles.length >= 2) {
            formData.append('validId', fs.createReadStream(path.join(uploadsDir, existingFiles[0])));
            formData.append('proofOfResidency', fs.createReadStream(path.join(uploadsDir, existingFiles[1])));
            console.log('📎 Using existing files from uploads folder');
        } else {
            console.log('⚠️  No files found in uploads folder, registration will fail file validation');
        }

        console.log('📤 Sending registration request...');
        console.log('Password:', 'pass123 (6 characters - should work now!)');
        console.log('');

        const response = await axios.post(`${API_URL}/auth/register`, formData, {
            headers: formData.getHeaders()
        });

        console.log('✅ Registration successful!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.error('❌ Registration failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Error:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
}

testRegistration();
