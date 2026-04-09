import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import Groq from "groq-sdk";
import dotenv from "dotenv";
import cors from "cors";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./src/firebase.js";
import admin from "firebase-admin";

const require = createRequire(import.meta.url);
dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin SDK for token verification
try {
  // Check if already initialized by trying to get the default app
  const existingApp = admin.app();
  console.log("✅ Firebase Admin SDK already initialized");
} catch (error) {
  // App not initialized, so initialize it
  try {
    // Try using environment variables first (more reliable than JSON file)
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      console.log("Initializing Firebase Admin with environment variables...");
      console.log(`   Project ID: ${projectId}`);
      console.log(`   Client Email: ${clientEmail}`);
      
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log("✅ Firebase Admin SDK initialized successfully with env vars");
    } else {
      // Fallback to JSON file
      const require = createRequire(import.meta.url);
      const serviceAccountPath = process.env.FIREBASE_ADMIN_SDK_PATH || "./firebase-admin-sdk.json";
      console.log(`Falling back to service account file: ${serviceAccountPath}`);
      
      const serviceAccount = require(serviceAccountPath);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("✅ Firebase Admin SDK initialized successfully with JSON file");
    }
  } catch (initError: any) {
    console.error(
      "❌ CRITICAL: Firebase Admin SDK initialization failed!",
    );
    console.error("Initialization error:", initError.message);
    console.error("Stack:", initError.stack);
    console.error("\n⚠️  Admin token verification will NOT work until this is fixed.");
    console.error("Please check your .env file or firebase-admin-sdk.json credentials.\n");
  }
}

/**
 * Middleware to verify admin custom claims in Firebase ID token
 * Uses Firebase Admin SDK for cryptographic signature verification (SECURE)
 * Includes timeout handling for network issues
 */
async function verifyAdminToken(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Missing or invalid authorization header" });
  }

  const token = authHeader.split(" ")[1];

  try {
    console.log('🔐 Verifying Firebase ID token...');
    
    // Create a promise with timeout to prevent hanging
    const TIMEOUT_MS = 5000; // 5 second timeout
    
    const verifyWithTimeout = new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Firebase token verification timed out after ${TIMEOUT_MS}ms - check network connectivity`));
      }, TIMEOUT_MS);
      
      admin.auth().verifyIdToken(token)
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
    
    // Verify the ID token using Firebase Admin SDK (cryptographically secure)
    const decodedToken = await verifyWithTimeout as admin.auth.DecodedIdToken;
    
    console.log('✅ Token verified successfully');
    console.log('   User:', decodedToken.email);
    console.log('   UID:', decodedToken.uid);

    // Check for admin custom claim
    if (decodedToken.admin !== true) {
      console.log('❌ User does not have admin role');
      return res.status(403).json({ 
        error: "Admin privileges required",
        message: `User ${decodedToken.email} does not have admin role.`
      });
    }

    // Attach user info to request
    req.user = decodedToken;
    console.log('✅ Admin verification successful - proceeding to handler');
    next();
  } catch (error: any) {
    console.error("❌ Token verification failed:", error.message);
    
    // Handle timeout specifically
    if (error.message.includes('timed out')) {
      console.error('💡 NETWORK ISSUE: Cannot reach Firebase servers');
      console.error('   Possible causes:');
      console.error('   - Firewall blocking outbound HTTPS connections');
      console.error('   - VPN/proxy interfering with Google Cloud APIs');
      console.error('   - Network restrictions on identitytoolkit.googleapis.com');
      console.error('   Solution: Check your network configuration or try a different network');
      
      return res.status(503).json({ 
        error: "Service temporarily unavailable",
        message: "Cannot verify authentication token due to network issues. Please check your connection or try again later.",
        details: error.message
      });
    }
    
    // Handle specific Firebase auth errors
    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({ error: "Invalid token format or signature" });
    }
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: "Token has expired. Please log in again." });
    }
    
    if (error.code === 'auth/argument-error') {
      return res.status(401).json({ error: "Invalid token provided" });
    }
    
    // Generic unauthorized error for all other cases
    return res.status(401).json({ error: "Unauthorized - Invalid or expired token" });
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Request logging middleware
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  app.use(cors());
  app.use(express.json());

  // Initialize Groq
  const groqApiKey = process.env.GROQ_API_KEY;
  if (groqApiKey) {
    console.log(`Groq API Key loaded: ${groqApiKey.substring(0, 7)}...`);
  } else {
    console.error("CRITICAL: No Groq API Key found!");
  }
  const groq = new Groq({ apiKey: groqApiKey || "" });

  // API Routes
  app.post("/api/chat", async (req, res) => {
    const {
      message,
      menuType = "cafe",
      cartItems = [],
      history = [],
    } = req.body;

    try {
      console.log(`Attempting chat with Groq model: llama-3.1-8b-instant`);

      const isWine = menuType === "wine";
      
      // Fetch menu items from Firestore
      let activeMenu: any[] = [];
      if (isWine) {
        const winesSnapshot = await admin.firestore().collection("wines").get();
        activeMenu = winesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          category: 'Wine',
          description: doc.data().tasting_notes
        }));
      } else {
        const menuSnapshot = await admin.firestore().collection("menu_items")
          .where("is_active", "==", true)
          .where("is_available", "==", true)
          .get();
        activeMenu = menuSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }

      // Calculate alcohol limit (e.g., limit to 3 drinks)
      const alcoholCount = cartItems
        .filter((item: any) => activeMenu.some((w) => w.id === item.id && w.category === 'Wine'))
        .reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);

      const overLimit = alcoholCount >= 3;

      let systemInstruction = "";

      if (isWine) {
        systemInstruction = `You are an expert, sophisticated Sommelier for Smart Cafe. 
Help the user find the perfect wine. Provide nuanced recommendations considering user preferences like region, grape varietal, and food pairings. Answer follow-up questions about specific wines on our list.

CRITICAL RULES:
1. NEVER mention the ID numbers of the items in your text response. Just use their names.
2. You MUST only output valid JSON. 
3. When you recommend items, you MUST explicitly prompt the user to buy them (e.g., "I highly recommend adding this to your ritual today. Shall I prepare a bottle for you?").
4. You CANNOT place orders for the user. You can ONLY recommend items. If a user asks you to place an order, politely inform them that they can add items to their cart using the 'Add to Ritual' button next to the recommendations.
5. You CANNOT recommend anything other than wine if the users ask for desserts or food you can politely tell them to use the food/coffee menu
6. If a user asks for a wine that is not on the list, politely inform them of our current selection and suggest the closest alternative.

Menu Context: ${JSON.stringify(activeMenu.map((i) => ({ id: i.id, name: i.name, type: i.type, region: i.region, price_bottle: i.price_bottle, price_glass: i.price_glass, tasting_notes: i.tasting_notes })))}

Use this exact schema: 
{"text": "Your helpful response message here", "recommended_item_ids": ["w1", "w2", "w3"]} 
Only recommend items that exist in the provided menu context.`;

        if (overLimit) {
          systemInstruction += `\n\nCRITICAL SAFETY RULE: The user has already ordered ${alcoholCount} alcoholic drinks. This is the maximum safe limit. You MUST politely but firmly refuse to recommend or serve any more alcohol. Suggest water or that they enjoy their current selections. Do NOT return any recommended_item_ids.`;
        } else {
          systemInstruction += `\n\nThe user currently has ${alcoholCount} alcoholic drinks in their cart. You may recommend wine, but do not recommend exceeding a total of 3 alcoholic drinks.`;
        }
      } else {
        systemInstruction = `You are a helpful and responsible AI ordering assistant for Smart Cafe. 
Help the user find the perfect food or drink. 

CRITICAL RULES:
1. NEVER mention the ID numbers of the items in your text response. Just use their names.
2. Promote safe and healthy consumption. If a user asks for an extreme or dangerous amount of caffeine (e.g., more than 4 espresso shots or equivalent) or food, you MUST politely decline. Provide a clear warning about the health risks of excessive caffeine intake (e.g., jitters, increased heart rate), and suggest a safer, reasonable alternative from the menu (like decaf, herbal tea, or a single standard coffee).
3. You CANNOT place orders for the user. You can ONLY recommend items. If a user asks you to place an order, politely inform them that they can add items to their cart using the 'Add to Cart' or 'Customize' buttons.
4. You MUST only output valid JSON. 

Menu Context: ${JSON.stringify(activeMenu.map((i) => ({ id: i.id, name: i.name, category: i.category, price: i.price, description: i.description })))}

Use this exact schema: 
{"text": "Your helpful response message here", "recommended_item_ids": ["1", "2", "3"]} 
Only recommend items that exist in the provided menu context.`;
      }

      console.log(`System Instruction Length: ${systemInstruction.length}`);
      console.log(`User Message: ${message}`);
      console.log(`Alcohol Count: ${alcoholCount}, Over Limit: ${overLimit}`);

      const formattedHistory = history.map((msg: any) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      }));

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemInstruction },
          ...formattedHistory,
          { role: "user", content: message },
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const rawText = chatCompletion.choices[0]?.message?.content || "{}";

      try {
        const aiData = JSON.parse(rawText);
        const recommendedIds = aiData.recommended_item_ids || [];
        const hydratedItems = activeMenu.filter((item) =>
          recommendedIds.map(String).includes(String(item.id)),
        );

        res.json({
          text: aiData.text || "Here are some recommendations:",
          items: hydratedItems,
          recommendedIds: recommendedIds,
        });
      } catch (parseError) {
        console.error("JSON Parse Error:", rawText);
        res.json({ text: rawText, items: [] });
      }
    } catch (error: any) {
      console.error("Groq Error:", error);
      res.status(500).json({
        text: "I'm having trouble thinking right now. Please check if your API key is valid.",
        items: [],
        error: error.message,
      });
    }
  });

  // Admin Insights API
  app.post("/api/insights", async (req, res) => {
    const { orders = [], menuItems = [] } = req.body;

    try {
      const systemInstruction = `You are an expert restaurant manager AI analyzing data for Smart Cafe.
Analyze the provided orders and menu items to generate a concise, actionable insight for the restaurant admin.
Return a JSON object with exactly these three keys:
- "sentiment": A single word describing overall customer sentiment (e.g., "Positive", "Excellent", "Mixed").
- "peakTime": A string representing the busiest time (e.g., "10:45 AM", "1:30 PM").
- "insight": A 1-2 sentence actionable insight or observation based on the data.

Orders data: ${JSON.stringify(orders.slice(0, 20))}
Menu items data: ${JSON.stringify(menuItems.map((i) => ({ name: i.name, category: i.category, price: i.price })))}`;

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: "Generate admin insights." },
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const rawText = chatCompletion.choices[0]?.message?.content || "{}";

      try {
        const aiData = JSON.parse(rawText);
        res.json({
          sentiment: aiData.sentiment || "Positive",
          peakTime: aiData.peakTime || "10:45 AM",
          insight: aiData.insight || "No insights available.",
        });
      } catch (parseError) {
        console.error("JSON Parse Error:", rawText);
        res.json({
          sentiment: "Positive",
          peakTime: "10:45 AM",
          insight: "Customers are satisfied with current offerings.",
        });
      }
    } catch (error: any) {
      console.error("Groq Error:", error);
      res.status(500).json({
        sentiment: "Positive",
        peakTime: "10:45 AM",
        insight: "Unable to generate insights. Please check API key.",
        error: error.message,
      });
    }
  });

  /**
   * Endpoint to add a new menu item (Admin Only)
   */
  app.post("/api/menu", verifyAdminToken, async (req, res) => {
    try {
      const {
        name,
        price,
        category,
        image_url,
        customizations = [],
        description = "",
        is_available = true,
      } = req.body;

      if (!name || !price || !category)
        return res.status(400).json({ error: "Missing required fields" });

      const newItem = {
        name,
        price: parseFloat(price),
        category,
        image_url: image_url || "",
        customizations: customizations.map((c: any) => ({
          name: c.name,
          extra_price: parseFloat(c.extra_price || 0)
        })),
        description,
        is_active: true,
        is_available,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      };

      const docRef = await admin.firestore().collection("menu_items").add(newItem);
      res.json({ success: true, id: docRef.id });
    } catch (error: any) {
      console.error("Error adding menu item:", error);
      res
        .status(500)
        .json({ error: "Failed to add menu item", details: error.message });
    }
  });

  /**
   * Endpoint to add a new wine (Admin Only)
   */
  app.post("/api/wines", verifyAdminToken, async (req, res) => {
    try {
      const {
        name,
        type,
        region,
        price_bottle,
        price_glass,
        stock_status,
        tasting_notes,
        image_url,
        vintage,
      } = req.body;

      if (!name || !price_bottle)
        return res.status(400).json({ error: "Missing required fields" });

      const newWine = {
        name,
        type,
        region,
        vintage: vintage || "",
        price_bottle,
        price_glass,
        stock_status,
        tasting_notes,
        image_url,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      };

      const docRef = await admin.firestore().collection("wines").add(newWine);
      res.json({ success: true, id: docRef.id });
    } catch (error: any) {
      res
        .status(500)
        .json({ error: "Failed to add wine", details: error.message });
    }
  });

  /**
   * Endpoint to update a menu item (Admin Only)
   */
  app.patch("/api/menu/:id", verifyAdminToken, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Remove undefined values
      Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

      await admin.firestore().collection("menu_items").doc(id).update(updates);
      res.json({ success: true });
    } catch (error: any) {
      res
        .status(500)
        .json({ error: "Failed to update menu item", details: error.message });
    }
  });

  /**
   * Endpoint to delete a menu item (Admin Only - soft delete)
   */
  app.delete("/api/menu/:id", verifyAdminToken, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Soft delete by setting is_active to false
      await admin.firestore().collection("menu_items").doc(id).update({
        is_active: false,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      res.json({ success: true });
    } catch (error: any) {
      res
        .status(500)
        .json({ error: "Failed to delete menu item", details: error.message });
    }
  });

  /**
   * Endpoint to update a wine (Admin Only)
   */
  app.patch("/api/wines/:id", verifyAdminToken, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Remove undefined values
      Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

      await admin.firestore().collection("wines").doc(id).update(updates);
      res.json({ success: true });
    } catch (error: any) {
      res
        .status(500)
        .json({ error: "Failed to update wine", details: error.message });
    }
  });

  /**
   * Endpoint to delete a wine (Admin Only)
   */
  app.delete("/api/wines/:id", verifyAdminToken, async (req, res) => {
    try {
      const { id } = req.params;
      
      await admin.firestore().collection("wines").doc(id).delete();
      res.json({ success: true });
    } catch (error: any) {
      res
        .status(500)
        .json({ error: "Failed to delete wine", details: error.message });
    }
  });

  /**
   * Endpoint to promote a user to admin/kitchen role
   */
  app.post("/api/admin/promote", verifyAdminToken, async (req, res) => {
    try {
      const { email, system_role, display_role, display_name } = req.body;

      console.log('Promoting/Creating user:', { email, system_role, display_role, display_name });

      if (!email || !system_role) {
        return res.status(400).json({ error: "Email and system_role are required" });
      }

      // Find user by email in users collection
      console.log('Searching for user by email...');
      const usersSnapshot = await admin.firestore()
        .collection("users")
        .where("email", "==", email)
        .get();

      let userId: string;
      let isNewUser = false;

      if (usersSnapshot.empty) {
        // User doesn't exist - create them
        console.log('User not found, creating new user account...');
        
        // Create user in Firebase Auth
        const userRecord = await admin.auth().createUser({
          email,
          displayName: display_name || email.split('@')[0],
          emailVerified: false,
        });
        
        userId = userRecord.uid;
        isNewUser = true;
        console.log('Created new user in Firebase Auth:', userId);
        
        // Create user document in Firestore
        await admin.firestore().collection("users").doc(userId).set({
          uid: userId,
          email,
          display_name: display_name || email.split('@')[0],
          system_role,
          display_role: display_role || system_role,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
          is_active: true,
        });
        console.log('Created user document in Firestore');
      } else {
        // User exists - update their role
        const userDoc = usersSnapshot.docs[0];
        userId = userDoc.id;
        console.log('Found existing user:', userId);

        // Update Firestore document
        console.log('Updating Firestore document...');
        await admin.firestore().collection("users").doc(userId).update({
          system_role,
          display_role: display_role || system_role,
          updated_at: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log('Firestore updated successfully');
      }

      // Update Firebase Auth custom claims
      console.log('Setting custom claims...');
      await admin.auth().setCustomUserClaims(userId, { 
        [system_role]: true 
      });
      console.log('Custom claims set successfully');

      res.json({ 
        success: true, 
        message: isNewUser 
          ? `New staff member ${email} created as ${system_role}` 
          : `User ${email} promoted to ${system_role}`,
        isNewUser
      });
      console.log('Response sent successfully');
    } catch (error: any) {
      console.error("❌ Error promoting/creating user:", error);
      console.error("Error stack:", error.stack);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/email-already-exists') {
        return res.status(409).json({ error: "A user with this email already exists in Firebase Auth but not in Firestore. Please check your database." });
      }
      
      if (error.code === 'auth/invalid-email') {
        return res.status(400).json({ error: "Invalid email address" });
      }
      
      res
        .status(500)
        .json({ error: "Failed to promote/create user", details: error.message });
    }
  });

  /**
   * Endpoint to update staff role
   */
  app.patch("/api/admin/staff/role", verifyAdminToken, async (req, res) => {
    try {
      const { uid, system_role } = req.body;

      if (!uid || !system_role) {
        return res.status(400).json({ error: "uid and system_role are required" });
      }

      // Update Firestore document
      await admin.firestore().collection("users").doc(uid).update({
        system_role,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });

      // Update Firebase Auth custom claims
      await admin.auth().setCustomUserClaims(uid, { 
        [system_role]: true 
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error updating staff role:", error);
      res
        .status(500)
        .json({ error: "Failed to update role", details: error.message });
    }
  });

  /**
   * Endpoint to remove staff member
   */
  app.delete("/api/admin/staff/:uid", verifyAdminToken, async (req, res) => {
    try {
      const { uid } = req.params;

      // Delete from Firestore
      await admin.firestore().collection("users").doc(uid).delete();

      // Optionally disable the user in Firebase Auth
      await admin.auth().updateUser(uid, { disabled: true });

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error removing staff:", error);
      res
        .status(500)
        .json({ error: "Failed to remove staff", details: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
