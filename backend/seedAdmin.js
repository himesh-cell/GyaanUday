const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");
const connectDB = require("./config/db");

dotenv.config();

const seedAdmin = async () => {
  try {
    await connectDB();
    
    const adminEmail = process.env.ADMIN_EMAIL || "admin@admin.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    
    const adminExists = await User.findOne({ email: adminEmail });
    if (adminExists) {
      console.log("Admin already exists in database.");
      process.exit(0);
    }
    
    await User.create({
      name: "Super Admin",
      email: adminEmail,
      password: adminPassword,
      role: "admin",
    });
    
    console.log("Admin seeded successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding admin:", error);
    process.exit(1);
  }
};

seedAdmin();
