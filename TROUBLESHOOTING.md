# Smart Cafe - Troubleshooting Update

## 🚨 **Current Issue: Invalid Groq API Key**

Your API key `gsk_c7EY...` is returning a **403 Forbidden** error, which means it's invalid, expired, or revoked.

### **How to Fix:**

#### Step 1: Get a NEW Groq API Key
1. Go to [https://console.groq.com/keys](https://console.groq.com/keys)
2. **Delete the old key** (if it exists)
3. Click **"Create API Key"**
4. Give it a name (e.g., "Smart Cafe")
5. **Copy the ENTIRE key immediately** (you can only see it once!)
6. Make sure your account has available credits/free tier access

#### Step 2: Update .env File
Open `.env` and replace the key:

```env
GROQ_API_KEY=gsk_YOUR_BRAND_NEW_KEY_HERE
```

⚠️ **Important:** 
- Copy the ENTIRE key (should be ~56 characters)
- No quotes around the value
- No extra spaces before or after

#### Step 3: Restart the Server
```bash
# Stop the current server (Ctrl+C)
npm run dev
```

### **Verification Steps:**

After updating, test the key:
```bash
npx tsx test-groq.ts
```

You should see:
```
✅ SUCCESS! Groq API is working!
```

### **Common Issues:**

1. **403 Forbidden**: Key is invalid/expired → Get a new key
2. **401 Unauthorized**: Key format is wrong → Check for typos
3. **429 Too Many Requests**: Rate limit exceeded → Wait or upgrade plan
4. **Model Not Found**: Key doesn't have access to `llama-3.1-8b-instant` → Check model availability

### **Alternative Models to Try:**

If `llama-3.1-8b-instant` doesn't work, you can try these in `server.ts`:
- `llama3-8b-8192`
- `llama3-70b-8192`
- `mixtral-8x7b-32768`

---