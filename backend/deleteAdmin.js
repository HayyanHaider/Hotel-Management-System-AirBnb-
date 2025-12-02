const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/userModel');

async function deleteAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const result = await User.deleteOne({ email: 'admin@hotelmanagement.com' });
        console.log('Deleted admin count:', result.deletedCount);

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

deleteAdmin();
