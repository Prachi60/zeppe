
import mongoose from 'mongoose';
import Transaction from './app/models/transaction.js';
import Order from './app/models/order.js';
import Seller from './app/models/seller.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const withdrawals = await Transaction.find({ type: 'Withdrawal', status: 'Settled' }).limit(1).lean();

        if (withdrawals.length === 0) {
            console.log("No settled withdrawals found");
            const anyWithdrawal = await Transaction.findOne({ type: 'Withdrawal' }).lean();
            console.log("Any withdrawal status:", anyWithdrawal ? anyWithdrawal.status : "None");
            process.exit(0);
        }

        console.log("Found settled withdrawal:", withdrawals[0].amount);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkData();
