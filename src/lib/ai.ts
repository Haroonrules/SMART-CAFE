import { MenuItem } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * Generates a text recommendation based on the user's mood and the menu items.
 * Uses the backend API for AI responses.
 */
export async function generateMoodRecommendation(
  mood: string,
  menuItems: MenuItem[],
): Promise<{ text: string; items: MenuItem[] }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `I'm feeling ${mood}, what do you recommend?`,
        menuType: "cafe",
        cartItems: menuItems,
        history: [],
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      text:
        data.text ||
        "I think a nice cup of coffee would be perfect for you right now.",
      items: data.items || [],
    };
  } catch (error) {
    console.error("Error generating mood recommendation:", error);
    // Fallback to simple recommendation
    return {
      text: "I think a nice cup of coffee would be perfect for you right now.",
      items: menuItems.slice(0, 1),
    };
  }
}

/**
 * Chat with the AI assistant using the backend API.
 */
export async function chatWithAI(
  message: string,
  menuType: "cafe" | "wine" = "cafe",
  menuItems: MenuItem[] = [],
  history: { role: string; content: string }[] = [],
): Promise<{ text: string; items: MenuItem[] }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        menuType,
        cartItems: menuItems,
        history,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error (${response.status}):`, errorText);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    // Match recommended IDs to actual menu items
    let recommendedItems: MenuItem[] = [];
    if (data.recommendedIds && data.recommendedIds.length > 0) {
      recommendedItems = menuItems.filter((item) =>
        data.recommendedIds.map(String).includes(String(item.id)),
      );
    } else if (data.items && data.items.length > 0) {
      recommendedItems = data.items;
    }

    return {
      text: data.text || "I'd recommend checking out our special selections.",
      items: recommendedItems.slice(0, 3),
    };
  } catch (error) {
    console.error("Error in chatWithAI:", error);
    // Fallback
    return {
      text: "I'm having trouble connecting right now. How about a classic espresso?",
      items: menuItems.slice(0, 1),
    };
  }
}

/**
 * Generates AI insights for the admin dashboard based on recent orders and menu items.
 */
export async function generateAdminInsights(
  orders: any[],
  menuItems: any[],
): Promise<{ sentiment: string; peakTime: string; insight: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/insights`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orders,
        menuItems,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error generating admin insights:", error);
    // Return default insights
    return {
      sentiment: "Positive",
      peakTime: "10:45 AM",
      insight:
        "Customers are asking for more non-dairy dessert options today. Consider highlighting the Vegan Tart.",
    };
  }
}
