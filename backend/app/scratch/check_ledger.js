import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/zeppe";

async function checkLedger() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        const LedgerEntry = mongoose.model('LedgerEntry', new mongoose.Schema({}, { strict: false }));
        
        const latestEntries = await LedgerEntry.find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        console.log("Latest Ledger Entries:");
        console.log(JSON.stringify(latestEntries, null, 2));

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

checkLedger();
