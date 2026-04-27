import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/zeppe';

const categorySchema = new mongoose.Schema({
    name: String,
    type: String,
    parentId: mongoose.Schema.Types.ObjectId,
    status: String
}, { collection: 'categories' });

const Category = mongoose.model('Category', categorySchema);

async function check() {
    try {
        console.log('Connecting to:', MONGO_URI);
        await mongoose.connect(MONGO_URI);
        const total = await Category.countDocuments();
        const types = await Category.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]);
        
        console.log('Total:', total);
        console.log('Types:', JSON.stringify(types, null, 2));
        
        const cats = await Category.find({ type: 'category' }).select('name type parentId');
        console.log('Level 2 categories:', JSON.stringify(cats, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

check();
