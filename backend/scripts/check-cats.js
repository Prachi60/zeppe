import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '../.env' });

const categorySchema = new mongoose.Schema({
    name: String,
    type: String,
    parentId: mongoose.Schema.Types.ObjectId,
    status: String
}, { collection: 'categories' });

const Category = mongoose.model('Category', categorySchema);

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zeppe');
        const total = await Category.countDocuments();
        const types = await Category.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]);
        const level2 = await Category.countDocuments({ type: 'category' });
        const level3 = await Category.countDocuments({ type: 'subcategory' });
        
        console.log('Total:', total);
        console.log('Types:', JSON.stringify(types, null, 2));
        console.log('Level 2 count:', level2);
        console.log('Level 3 count:', level3);
        
        const first5 = await Category.find({ type: 'category' }).limit(10).select('name type');
        console.log('First 10 Level 2:', JSON.stringify(first5, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

check();
