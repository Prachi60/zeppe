import mongoose from "mongoose";
import dotenv from "dotenv";
import SubscriptionPlan from "./app/models/subscriptionPlan.js";

dotenv.config();

const plans = [
  {
    role: "seller",
    name: "Standard Seller Plan",
    price: 8399,
    duration: { value: 1, unit: "months" },
    features: ["Store Dashboard", "Inventory Management", "Technical Support"],
    isActive: true,
  },
  {
    role: "delivery",
    name: "Basic Plan",
    price: 399,
    duration: { value: 1, unit: "months" },
    features: ["Delivery partner access", "Order handling", "Basic support"],
    isActive: true,
  },
  {
    role: "delivery",
    name: "Premium Plan",
    price: 599,
    duration: { value: 1, unit: "months" },
    features: ["Delivery partner access", "Free bag & dress kit", "Priority support"],
    isActive: true,
  },
];

const seedPlans = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/zeppe");
    console.log("Connected to MongoDB");

    for (const plan of plans) {
      await SubscriptionPlan.findOneAndUpdate(
        { role: plan.role, name: plan.name },
        plan,
        { upsert: true, new: true }
      );
    }

    console.log("Plans seeded successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding plans:", error);
    process.exit(1);
  }
};

seedPlans();
