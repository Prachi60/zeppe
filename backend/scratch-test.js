import mongoose from "mongoose";
import dotenv from "dotenv";
import { placeOrderAtomic } from "./app/services/orderPlacementService.js";

dotenv.config();

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected.");

  const customerId = "69f04708b8de7046d7c68a29";
  const payload = {
    paymentMode: "COD",
    address: {
      type: "Home",
      name: "Jane Doe",
      address: "Corporate House, Flim Colony, South Tukoganj, Indore, Madhya Pradesh 452001, India",
      city: "Indore, Madhya Pradesh",
      phone: "1213212215",
      landmark: "",
      // location is omitted completely!
    },
    items: [
      {
        product: "69fecab6b112085fefc859d3",
        name: "Aashirvaad aata",
        variantSku: "aashi-001",
        quantity: 1,
        price: 45,
      }
    ]
  };

  try {
    console.log("Placing order...");
    const result = await placeOrderAtomic({ customerId, payload });
    console.log("Order placed successfully!", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Order placement failed with error:");
    console.error(error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

run();
