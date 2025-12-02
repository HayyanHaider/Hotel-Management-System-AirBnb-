const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/userModel');
const UserRepository = require('./repositories/UserRepository');

async function checkAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const admins = await User.find({ email: 'admin@hotelmanagement.com' });
        console.log(`Found ${admins.length} admins directly via Model:`);
        admins.forEach(a => {
            console.log(`- _id: ${a._id} (${typeof a._id})`);
            console.log(`- id field: ${a.get('id')} (${typeof a.get('id')})`);
        });

        console.log('\nChecking via UserRepository:');
        const userRepoAdmin = await UserRepository.findByEmail('admin@hotelmanagement.com');
        if (userRepoAdmin) {
            console.log('UserRepository found:');
            console.log(`- id: ${userRepoAdmin.id}`);
            console.log(`- _id: ${userRepoAdmin._id}`);
            console.log(`- _id type: ${typeof userRepoAdmin._id}`);
            if (userRepoAdmin._id && userRepoAdmin._id.toString) {
                console.log(`- _id toString: ${userRepoAdmin._id.toString()}`);
            }
        } else {
            console.log('UserRepository found nothing');
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkAdmin();
