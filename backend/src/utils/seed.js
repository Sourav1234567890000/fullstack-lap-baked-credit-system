require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/user.model"); // Ensure this path is correct
const Applicant = require("../models/applicant.model");
const DagWorkflow = require("../models/dagworkflow.model");
const connectDB = require("../config/db");

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    // Dropping the collection removes documents AND the unique index
    await Applicant.collection.drop();
    await DagWorkflow.deleteMany({});
    console.log(" Cleared existing data and dropped indexes");

    // Create users
    const users = await User.create([
      {
        name: "Sourav Negi",
        email: "officer.sourav@jetro.ai",
        password: "password123",
        role: "officer",
      },
      {
        name: "Priya Sharma",
        email: "manager.priya@jetro.ai",
        password: "password123",
        role: "underwriter",
      },
      {
        name: "Admin Jetro",
        email: "admin@jetro.ai",
        password: "password123",
        role: "admin",
      },
    ]);
    console.log(" Users seeded");

    // Create applicants (Aadhaar redacted for security)
    const applicants = await Applicant.create([
      {
        name: "Sourav Negi",
        phone: "+91 9988221102",
        email: "souravnegi144@gmail.com",
        pan: "CDKPN8891B",
        aadhaar: "[Aadhaar Redacted]",
        propertyType: "Residential Apartment",
        propertyArea: "Residential",
        propertyValue: 2450000,
        loanAmount: 1600000,
        monthlyIncome: 85000,
        monthlyObligations: 12000,
        interestRate: 9.5,
        tenureMonths: 120,
        cibil: 0,
        stage: 0,
        assignedOfficer: users[0]._id,
      },
      {
        name: "Sarah Jenkins",
        phone: "+1 312 902 4431",
        email: "sarah.j@outlook.com",
        pan: "SRJKN1234A",
        propertyType: "Commercial Complex",
        propertyArea: "Commercial",
        propertyValue: 5200000,
        loanAmount: 3100000,
        monthlyIncome: 125000,
        monthlyObligations: 22000,
        interestRate: 9.75,
        tenureMonths: 120,
        cibil: 710,
        otpVerified: true,
        faceVerified: true,
        stage: 1,
        assignedOfficer: users[0]._id,
      },
      {
        name: "Vikram Malhotra",
        phone: "+91 9833019882",
        email: "vikram@malhotra.in",
        pan: "VKRML5678B",
        propertyType: "Industrial Land",
        propertyArea: "Industrial",
        propertyValue: 7800000,
        loanAmount: 3500000,
        monthlyIncome: 250000,
        monthlyObligations: 35000,
        interestRate: 9.25,
        tenureMonths: 180,
        cibil: 820,
        otpVerified: true,
        faceVerified: true,
        stage: 2,
        assignedOfficer: users[0]._id,
      },
    ]);
    console.log(" Applicants seeded");

    console.log("\n🎉 Seed complete!");
    console.log("Login credentials:");
    console.log("  Officer:    officer.sourav@jetro.ai / password123");
    console.log("  Manager:    manager.priya@jetro.ai / password123");
    console.log("  Admin:      admin@jetro.ai / password123");
    console.log("  Passcode:   password123");

    await mongoose.connection.close();
    console.log("🔌 Database connection closed gracefully.");
  } catch (err) {
    console.error(" Seed failed:", err);
    process.exit(1);
  }
};

seedData();
