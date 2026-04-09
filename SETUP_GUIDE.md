# Smart Cafe - AI Chatbox Setup Guide

## 🚨 **CRITICAL: Fix the AI Chatbox**

The AI chatbox requires a valid **Groq API Key**. Follow these steps:

### Step 1: Get Your Groq API Key
1. Go to [https://console.groq.com/keys](https://console.groq.com/keys)
2. Sign up or log in to your account
3. Create a new API key (it will start with `gsk_`)
4. Copy your API key

### Step 2: Update Your `.env` File
Replace `gsk_your_actual_groq_api_key_here` with your real Groq API key:

```env
GROQ_API_KEY=gsk_your_real_key_here
```

**Important:** 
- ✅ DO NOT include quotes around the key
- ✅ Make sure it starts with `gsk_`
- ❌ The current key in the file is INVALID (it's a Firebase key, not Groq)

### Step 3: Restart the Server
After updating the `.env` file:
```bash
npm run dev
```

## 🔧 How It Works

The AI chatbox uses:
- **Backend**: [`server.ts`](file:///Users/harun/Desktop/smart-cafe/server.ts) - Express server with Groq API integration
- **Frontend**: [`src/lib/ai.ts`](file:///Users/harun/Desktop/smart-cafe/src/lib/ai.ts) - Frontend AI utilities
- **Components**: 
  - [`MenuScreen.tsx`](file:///Users/harun/Desktop/smart-cafe/src/screens/MenuScreen.tsx) - Main menu with concierge
  - [`WineListScreen.tsx`](file:///Users/harun/Desktop/smart-cafe/src/screens/WineListScreen.tsx) - Wine list with sommelier

## 📝 Environment Variables Required

| Variable | Description | Example |
|----------|-------------|---------|
| `GROQ_API_KEY` | Your Groq API key | `gsk_abc123...` |
| `APP_URL` | Backend server URL | `http://localhost:3000` |
| `VITE_API_URL` | Frontend API endpoint | `http://localhost:3000` |

## 🐛 Troubleshooting

If the chatbox still doesn't work:

1. **Check Console Logs**: Open browser DevTools and look for errors
2. **Verify API Key**: Ensure your Groq key is valid and hasn't expired
3. **Check Server**: Make sure the server is running on port 3000
4. **Network Tab**: Check if `/api/chat` requests are failing

---