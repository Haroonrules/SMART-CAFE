/**
 * Smart Cafe - Firebase Cloud Functions
 * Serverless Data Aggregation Engine
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
admin.initializeApp();

const db = admin.firestore();

/**
 * Get formatted date string for stats document ID
 * Format: daily_YYYYMMDD
 */
const getDailyStatsDocId = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `daily_${year}${month}${day}`;
};

/**
 * Get formatted date string for monthly stats document ID
 * Format: monthly_YYYYMM
 */
const getMonthlyStatsDocId = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `monthly_${year}${month}`;
};

/**
 * Interface for item sales data in stats document
 */
interface ItemSalesData {
  count: number;
  revenue: number;
  lastSold?: admin.firestore.Timestamp;
}

/**
 * Interface for best sellers map
 */
interface BestSellersMap {
  [itemId: string]: {
    name: string;
    count: number;
    revenue: number;
    category: string;
  };
}

/**
 * Cloud Function: Aggregate Order Statistics
 *
 * Triggered when a new order is created in the orders collection.
 * Updates daily and monthly statistics documents with:
 * - totalTurnover: Sum of all order totals
 * - totalOrders: Count of all orders
 * - itemSalesCount: Map of item sales data
 * - bestSellers: Ranked map of best selling items
 *
 * Uses atomic FieldValue.increment() operations to prevent race conditions.
 */
export const aggregateOrderStatistics = functions.firestore
  .document("orders/{orderId}")
  .onCreate(async (snap, context) => {
    const orderData = snap.data();

    // Validate order data
    if (!orderData || !orderData.total || !orderData.items) {
      functions.logger.warn("Invalid order data:", {
        orderId: context.params.orderId,
      });
      return null;
    }

    const orderDate = orderData.createdAt
      ? new Date(orderData.createdAt)
      : new Date();

    const dailyDocId = getDailyStatsDocId(orderDate);
    const monthlyDocId = getMonthlyStatsDocId(orderDate);

    const batch = db.batch();

    // Update daily stats
    const dailyStatsRef = db.collection("statistics").doc(dailyDocId);
    const dailyStatsUpdate: Record<string, any> = {
      totalTurnover: admin.firestore.FieldValue.increment(orderData.total),
      totalOrders: admin.firestore.FieldValue.increment(1),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      date: orderDate.toISOString().split("T")[0],
      period: "daily",
    };

    // Process each item in the order
    const dailyItemUpdates: Record<string, ItemSalesData> = {};
    const dailyBestSellersUpdate: BestSellersMap = {};

    if (Array.isArray(orderData.items)) {
      for (const item of orderData.items) {
        const itemId = item.id;
        const itemQuantity = item.quantity || 1;
        const itemTotal = item.price * itemQuantity;

        // Track item sales for daily stats
        dailyItemUpdates[`itemSalesCount.${itemId}`] = {
          count: admin.firestore.FieldValue.increment(itemQuantity),
          revenue: admin.firestore.FieldValue.increment(itemTotal),
          lastSold: admin.firestore.FieldValue.serverTimestamp(),
        };

        // Track best sellers for daily stats
        dailyBestSellersUpdate[itemId] = {
          name: item.name,
          count: admin.firestore.FieldValue.increment(itemQuantity),
          revenue: admin.firestore.FieldValue.increment(itemTotal),
          category: item.category || "Unknown",
        };
      }
    }

    batch.update(dailyStatsRef, {
      ...dailyStatsUpdate,
      itemSalesCount: dailyItemUpdates,
      bestSellers: dailyBestSellersUpdate,
    });

    // Update monthly stats
    const monthlyStatsRef = db.collection("statistics").doc(monthlyDocId);
    const monthlyStatsUpdate: Record<string, any> = {
      totalTurnover: admin.firestore.FieldValue.increment(orderData.total),
      totalOrders: admin.firestore.FieldValue.increment(1),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      month: orderDate.toISOString().slice(0, 7),
      period: "monthly",
    };

    // Process each item for monthly stats
    const monthlyItemUpdates: Record<string, ItemSalesData> = {};
    const monthlyBestSellersUpdate: BestSellersMap = {};

    if (Array.isArray(orderData.items)) {
      for (const item of orderData.items) {
        const itemId = item.id;
        const itemQuantity = item.quantity || 1;
        const itemTotal = item.price * itemQuantity;

        monthlyItemUpdates[`itemSalesCount.${itemId}`] = {
          count: admin.firestore.FieldValue.increment(itemQuantity),
          revenue: admin.firestore.FieldValue.increment(itemTotal),
          lastSold: admin.firestore.FieldValue.serverTimestamp(),
        };

        monthlyBestSellersUpdate[itemId] = {
          name: item.name,
          count: admin.firestore.FieldValue.increment(itemQuantity),
          revenue: admin.firestore.FieldValue.increment(itemTotal),
          category: item.category || "Unknown",
        };
      }
    }

    batch.update(monthlyStatsRef, {
      ...monthlyStatsUpdate,
      itemSalesCount: monthlyItemUpdates,
      bestSellers: monthlyBestSellersUpdate,
    });

    // Commit the batch
    await batch.commit();

    functions.logger.info("Successfully aggregated order statistics", {
      orderId: context.params.orderId,
      dailyDocId,
      monthlyDocId,
      total: orderData.total,
      itemCount: orderData.items?.length || 0,
    });

    return null;
  });

/**
 * Cloud Function: Update Statistics on Order Status Change
 *
 * Triggered when an order is updated. Handles:
 * - Cancelling orders: Reverts statistics
 * - Completing orders: Finalizes statistics
 */
export const updateStatisticsOnOrderChange = functions.firestore
  .document("orders/{orderId}")
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

    const beforeStatus = beforeData?.status;
    const afterStatus = afterData?.status;

    // Only process if status changed to cancelled
    if (beforeStatus !== afterStatus && afterStatus === "cancelled") {
      const orderDate = afterData.createdAt
        ? new Date(afterData.createdAt)
        : new Date();

      const dailyDocId = getDailyStatsDocId(orderDate);
      const monthlyDocId = getMonthlyStatsDocId(orderDate);

      const batch = db.batch();

      // Revert daily stats
      const dailyStatsRef = db.collection("statistics").doc(dailyDocId);
      const dailyUpdate: Record<string, any> = {
        totalTurnover: admin.firestore.FieldValue.increment(
          -(afterData.total || 0),
        ),
        totalOrders: admin.firestore.FieldValue.increment(-1),
        cancelledOrders: admin.firestore.FieldValue.increment(1),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Revert item sales
      if (Array.isArray(afterData.items)) {
        for (const item of afterData.items) {
          const itemId = item.id;
          const itemQuantity = item.quantity || 1;
          const itemTotal = item.price * itemQuantity;

          dailyUpdate[`itemSalesCount.${itemId}.count`] =
            admin.firestore.FieldValue.increment(-itemQuantity);
          dailyUpdate[`itemSalesCount.${itemId}.revenue`] =
            admin.firestore.FieldValue.increment(-itemTotal);

          // Update best sellers
          dailyUpdate[`bestSellers.${itemId}.count`] =
            admin.firestore.FieldValue.increment(-itemQuantity);
          dailyUpdate[`bestSellers.${itemId}.revenue`] =
            admin.firestore.FieldValue.increment(-itemTotal);
        }
      }

      batch.update(dailyStatsRef, dailyUpdate);

      // Revert monthly stats
      const monthlyStatsRef = db.collection("statistics").doc(monthlyDocId);
      const monthlyUpdate: Record<string, any> = {
        totalTurnover: admin.firestore.FieldValue.increment(
          -(afterData.total || 0),
        ),
        totalOrders: admin.firestore.FieldValue.increment(-1),
        cancelledOrders: admin.firestore.FieldValue.increment(1),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (Array.isArray(afterData.items)) {
        for (const item of afterData.items) {
          const itemId = item.id;
          const itemQuantity = item.quantity || 1;
          const itemTotal = item.price * itemQuantity;

          monthlyUpdate[`itemSalesCount.${itemId}.count`] =
            admin.firestore.FieldValue.increment(-itemQuantity);
          monthlyUpdate[`itemSalesCount.${itemId}.revenue`] =
            admin.firestore.FieldValue.increment(-itemTotal);

          monthlyUpdate[`bestSellers.${itemId}.count`] =
            admin.firestore.FieldValue.increment(-itemQuantity);
          monthlyUpdate[`bestSellers.${itemId}.revenue`] =
            admin.firestore.FieldValue.increment(-itemTotal);
        }
      }

      batch.update(monthlyStatsRef, monthlyUpdate);

      await batch.commit();

      functions.logger.info("Reverted statistics for cancelled order", {
        orderId: context.params.orderId,
      });
    }

    return null;
  });

/**
 * Scheduled Function: Generate Weekly Summary
 *
 * Runs every Monday at 1 AM UTC to create weekly summary documents
 */
export const generateWeeklySummary = functions.pubsub
  .schedule("0 1 * * 1")
  .timeZone("UTC")
  .onRun(async (context) => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get the start of the week (Monday)
    const startOfWeek = new Date(oneWeekAgo);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);

    const weekNumber = getWeekNumber(startOfWeek);
    const year = startOfWeek.getFullYear();
    const weeklyDocId = `weekly_${year}_W${weekNumber}`;

    // Query all daily stats for the past week
    const statsSnapshot = await db
      .collection("statistics")
      .where("period", "==", "daily")
      .where("date", ">=", startOfWeek.toISOString().split("T")[0])
      .where("date", "<=", now.toISOString().split("T")[0])
      .get();

    let totalTurnover = 0;
    let totalOrders = 0;
    let totalCancelledOrders = 0;
    const aggregatedBestSellers: BestSellersMap = {};

    statsSnapshot.forEach((doc) => {
      const data = doc.data();
      totalTurnover += data.totalTurnover || 0;
      totalOrders += data.totalOrders || 0;
      totalCancelledOrders += data.cancelledOrders || 0;

      // Aggregate best sellers
      if (data.bestSellers) {
        Object.entries(data.bestSellers).forEach(
          ([itemId, sellerData]: [string, any]) => {
            if (!aggregatedBestSellers[itemId]) {
              aggregatedBestSellers[itemId] = {
                name: sellerData.name,
                count: 0,
                revenue: 0,
                category: sellerData.category,
              };
            }
            aggregatedBestSellers[itemId].count += sellerData.count || 0;
            aggregatedBestSellers[itemId].revenue += sellerData.revenue || 0;
          },
        );
      }
    });

    // Create weekly summary document
    const weeklyStatsRef = db.collection("statistics").doc(weeklyDocId);
    await weeklyStatsRef.set(
      {
        totalTurnover,
        totalOrders,
        cancelledOrders: totalCancelledOrders,
        bestSellers: aggregatedBestSellers,
        period: "weekly",
        weekNumber,
        year,
        startDate: startOfWeek.toISOString(),
        endDate: now.toISOString(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    functions.logger.info("Generated weekly summary", {
      weeklyDocId,
      totalOrders,
      totalTurnover,
    });

    return null;
  });

/**
 * Helper function to get ISO week number
 */
function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Callable Function: Set Admin Custom Claims
 *
 * Allows an existing admin to promote another user to admin status.
 * This sets the 'admin' custom claim on the target user's Firebase Auth token.
 *
 * IMPORTANT: This function should only be callable by existing admins.
 * In a production environment, you may want to add additional validation
 * such as requiring MFA or approval workflows.
 */
export const setAdminCustomClaim = functions.https.onCall(
  async (data, context) => {
    // Verify the caller is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated to perform this action.",
      );
    }

    // Verify the caller is an admin (check custom claims)
    const callerToken = await admin.auth().verifyIdToken(context.auth.token);
    if (!callerToken.admin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only existing admins can promote users to admin.",
      );
    }

    const { uid, email } = data;

    if (!uid && !email) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Either uid or email must be provided.",
      );
    }

    try {
      let targetUid = uid;

      // If email provided instead of uid, look up the user
      if (email && !uid) {
        const userRecord = await admin.auth().getUserByEmail(email);
        targetUid = userRecord.uid;
      }

      if (!targetUid) {
        throw new functions.https.HttpsError(
          "not-found",
          "Target user not found.",
        );
      }

      // Set the admin custom claim
      await admin.auth().setCustomUserClaims(targetUid, { admin: true });

      // Also create/update the user document in Firestore for consistency
      const userRef = db.collection("users").doc(targetUid);
      await userRef.set(
        {
          role: "admin",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      functions.logger.info("Successfully set admin custom claim", {
        targetUid,
        promotedBy: context.auth.uid,
      });

      return {
        success: true,
        message: `User ${targetUid} has been promoted to admin.`,
        uid: targetUid,
      };
    } catch (error: any) {
      functions.logger.error("Error setting admin custom claim:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to set admin custom claim.",
      );
    }
  },
);

/**
 * Callable Function: Remove Admin Custom Claims
 *
 * Allows an existing admin to demote another user from admin status.
 */
export const removeAdminCustomClaim = functions.https.onCall(
  async (data, context) => {
    // Verify the caller is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated to perform this action.",
      );
    }

    // Verify the caller is an admin
    const callerToken = await admin.auth().verifyIdToken(context.auth.token);
    if (!callerToken.admin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only existing admins can remove admin privileges.",
      );
    }

    const { uid, email } = data;

    if (!uid && !email) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Either uid or email must be provided.",
      );
    }

    try {
      let targetUid = uid;

      // If email provided instead of uid, look up the user
      if (email && !uid) {
        const userRecord = await admin.auth().getUserByEmail(email);
        targetUid = userRecord.uid;
      }

      if (!targetUid) {
        throw new functions.https.HttpsError(
          "not-found",
          "Target user not found.",
        );
      }

      // Prevent self-demotion
      if (targetUid === context.auth.uid) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Cannot remove your own admin privileges through this function.",
        );
      }

      // Remove the admin custom claim (set to false/null)
      await admin.auth().setCustomUserClaims(targetUid, { admin: null });

      // Update the user document in Firestore
      const userRef = db.collection("users").doc(targetUid);
      await userRef.update({
        role: "customer",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      functions.logger.info("Successfully removed admin custom claim", {
        targetUid,
        demotedBy: context.auth.uid,
      });

      return {
        success: true,
        message: `User ${targetUid} is no longer an admin.`,
        uid: targetUid,
      };
    } catch (error: any) {
      functions.logger.error("Error removing admin custom claim:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to remove admin custom claim.",
      );
    }
  },
);

/**
 * Callable Function: Get Statistics Summary
 *
 * Can be called from the client to get a quick summary of statistics
 */
export const getStatisticsSummary = functions.https.onCall(
  async (data, context) => {
    // Verify user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated to access statistics.",
      );
    }

    // Check if user has admin role (you may need to implement custom claims check)
    // This is a basic check - implement proper RBAC based on your needs

    const period = data.period || "daily";
    const dateStr = data.date || new Date().toISOString().split("T")[0];

    let docId: string;

    if (period === "daily") {
      docId = `daily_${dateStr.replace(/-/g, "")}`;
    } else if (period === "monthly") {
      docId = `monthly_${dateStr.slice(0, 7).replace(/-/g, "")}`;
    } else {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid period. Use 'daily' or 'monthly'.",
      );
    }

    const statsDoc = await db.collection("statistics").doc(docId).get();

    if (!statsDoc.exists) {
      return {
        exists: false,
        message: "No statistics available for this period.",
      };
    }

    const data_ = statsDoc.data();

    // Get top 10 best sellers sorted by count
    const bestSellers = data_?.bestSellers || {};
    const sortedBestSellers = Object.entries(bestSellers)
      .sort(
        ([, a]: [string, any], [, b]: [string, any]) =>
          (b.count || 0) - (a.count || 0),
      )
      .slice(0, 10)
      .map(([id, item]: [string, any]) => ({
        id,
        ...item,
      }));

    return {
      exists: true,
      period: data_?.period,
      date: data_?.date || data_?.month,
      totalTurnover: data_?.totalTurnover || 0,
      totalOrders: data_?.totalOrders || 0,
      cancelledOrders: data_?.cancelledOrders || 0,
      bestSellers: sortedBestSellers,
      itemSalesCount: data_?.itemSalesCount || {},
    };
  },
);
