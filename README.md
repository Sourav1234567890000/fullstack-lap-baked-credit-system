LAPCard Full-Stack Platform

A full-stack, production-ready application for loan processing, featuring dynamic workflow management, RBAC-gated dashboards, and automated underwriting pipelines.

Live Demo

    URL: https://lap-card-backed-system.vercel.app/

Access Credentials

The platform utilizes Role-Based Access Control (RBAC). Use any of the following credentials to explore the system:

Role Email Password
Loan Officer officer.sourav@jetro.ai password123
Manager manager.priya@jetro.ai password123
Admin admin@jetro.ai password123

Key Features

    Dynamic DAG Workflow Engine: Visual pipeline configuration for underwriting stages.

    Automated Underwriting: Real-time calculation of loan limits based on property value and debt-to-income ratios.

    Multi-Stage Verification: Integrated flows for CIBIL checks, OTP, and face verification.

    Persistent Architecture: Node.js/Express backend with MongoDB Atlas integration.

Getting Started
Prerequisites

    Node.js (v18+)

    MongoDB Atlas Account

2. **Install dependencies:**
   ```bash
   npm install
   ```

Configure Environment: Create a .env file in the backend directory with your MONGODB_URI.

Seed Database: Run the provided seed script to populate initial roles and applicant data:

node backend/scripts/seed.js

5. **Start Application:**
   ```bash
   npm start
   ```

Built for Jetro Credit Hub | Developed by Sourav Negi
