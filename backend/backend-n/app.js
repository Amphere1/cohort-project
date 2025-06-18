import express from "express";
import mongoose from "mongoose";
import passport from "passport";
import dotenv from "dotenv";
import authRoutes from './routes/auth.js';
import doctorRoutes from './routes/doctor.js';
import patientRoutes from './routes/patientDetails.js';
import prescriptionRoutes from './routes/prescriptions.js';
import "./config/passport.js";
import cors from 'cors';
import verifyToken from './middleware/auth.js';
import { checkInteractions } from "./genkit/interactions.js";
import fs from 'fs';
import fetch from 'node-fetch';


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

app.get('/', (req, res) => {
  res.send('Server is working correctly');
});

app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/prescriptions', prescriptionRoutes);

// Documentation endpoint for authentication
app.get("/api/auth/docs", (req, res) => {
  res.json({
    message: "Authentication Documentation",
    endpoints: [
      {
        path: "/api/auth/register",
        method: "POST",
        description: "Register a new user",
        body: {
          username: "string (required)",
          email: "string (required)",
          password: "string (required)"
        }
      },
      {
        path: "/api/auth/login",
        method: "POST",
        description: "Login with email and password",
        body: {
          email: "string (required)",
          password: "string (required)"
        }
      },      {
        path: "/api/auth/doctor-login",
        method: "POST",
        description: "Doctor login with government registration number and password",
        body: {
          govtRegistrationNumber: "string (required)",
          password: "string (required)"
        }
      },
      {
        path: "/api/auth/doctor-register",
        method: "POST",
        description: "Register a new doctor with direct password (no separate user account needed)",
        body: {
          name: "string (required)",
          govtRegistrationNumber: "string (required)",
          specialization: "string (required)",
          experience: "number (required)",
          contactNumber: "string (required)",
          email: "string (required)",
          password: "string (required)",
          confirmPassword: "string (required)",
          qualifications: "array of strings (required)"
        }
      },
      {
        path: "/api/auth/doctor-setup",
        method: "POST",
        description: "Set up doctor account or reset password",
        body: {
          govtRegistrationNumber: "string (required)",
          email: "string (required)",
          password: "string (required)",
          confirmPassword: "string (required)"
        }
      },
      {
        path: "/api/auth/validate-govt-registration/:number",
        method: "GET",
        description: "Validate if a government registration number exists",
        params: {
          number: "string (required)"
        }
      }
    ]
  });
});

// Drugs information source endpoint
app.get("/api/drugs/sources", (req, res) => {
  res.json({
    message: "This system uses OpenFDA API and AI-powered search for drug information",
    sources: [
      {
        name: "OpenFDA",
        description: "Official FDA drug database with comprehensive medication information",
        endpoint: "/api/drugs/search"
      },
      {
        name: "AI Search",
        description: "AI-powered search for medication recommendations based on conditions and symptoms",
        endpoint: "/api/prescriptions/generate"
      }
    ]
  });
});


// drug information endpoint

app.post("/api/drugs/search", verifyToken, async (req, res) => {
  const drugInput = req.body.drugName;
  if (!drugInput) {
    return res.status(400).json({ error: "Missing drugName in request body" });
  }
  try {
    const response = await fetch(`https://api.fda.gov/drug/label.json?search=openfda.brand_name:${encodeURIComponent(drugInput)}`);
    const data = await response.json();
    let drugs = {};
    if (data.results) {
      data.results.forEach(element => {
        if (element.openfda) {
          drugs = {
            generic_name: element.openfda.generic_name || [],
            brand_name: element.openfda.brand_name || [],
            rxcui: element.openfda.rxcui || [],
            purpose: element.purpose || [],
            dosage_and_administration: element.dosage_and_administration || [],
            indications_and_usage: element.indications_and_usage || [],
            active_ingredient: element.active_ingredient || [],
            inactive_ingredient: element.inactive_ingredient || [],
            storage_and_handling: element.storage_and_handling || [],
          };
        }
      });
    }
    console.log(drugs);
    res.json(drugs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch drug data" });
  }
});

// drug Interaction endpoint
app.post("/api/drugs/interaction", verifyToken, async (req, res) => {
  const drugInput = req.body.drugName; // Can be a single name or an array of names

  if (!drugInput || !Array.isArray(drugInput)) {
    return res.status(400).json({ error: "drugName must be an array of up to 10 items." });
  }

  if (drugInput.length > 10) {
    return res.status(400).json({ error: "You can only check up to 10 drugs at a time." });
  }

  try {
    const formattedDrugs = [];

    for (const drug of drugInput) {
      const response = await fetch(
        `https://api.fda.gov/drug/label.json?search=openfda.brand_name:${encodeURIComponent(drug)}`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const firstResult = data.results[0];

        formattedDrugs.push({
          name: firstResult.openfda?.generic_name?.[0] || drug,
          purpose: firstResult.purpose || [],
          interactions: firstResult.drug_interactions || [],
          warnings: firstResult.warnings || [],
          description: firstResult.description?.[0] || '',
        });
      }
    }

    // Genkit Flow
    const interactionResult = await checkInteractions(formattedDrugs);

    res.json({
      drugs: formattedDrugs,
      interactions: interactionResult,
    });
  } catch (error) {
    console.error("Error in /api/drugs:", error);
    res.status(500).json({ error: "Failed to fetch or analyze drug data" });
  }
});


mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(error => console.error('MongoDB connection error:', error));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});