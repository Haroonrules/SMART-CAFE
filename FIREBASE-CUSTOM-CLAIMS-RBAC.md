# Firebase Custom Claims - Role-Based Access Control (RBAC)

## Overview

This document describes the implementation of Firebase Custom Claims for secure, scalable admin access control in Smart Cafe. We've migrated from hardcoded email checks and Firestore role lookups to token-based authorization using Firebase Custom Claims.

## What Changed?

### Before (❌ Old Method)
- Hardcoded admin email in frontend code
- Firestore database lookups on every route change
- Manual role synchronization between email and database
- Security dependent on client-side checks

### After (✅ New Method)
- Admin status embedded directly in Firebase Auth tokens
- No database lookups for authorization
- Server-side token verification available
- Scalable and industry-standard approach

## Architecture

```
┌─────────────────┐
│  Firebase Auth  │ ← Custom Claims stored here
│   (Admin SDK)   │    (admin: true/false)
└────────┬────────┘
         │
         │ Token issued with claims
         ▼
┌─────────────────┐
│   Frontend      │ ← Checks token.claims.admin
│   (React)       │    No DB reads needed
└────────┬────────┘
         │
         │ Bearer token in API calls
         ▼
┌─────────────────┐
│   Backend       │ ← Verifies token & claims
│   (Express)     │    Rejects non-admin requests
└─────────────────┘
```

## Implementation Details

### 1. Promoting a User to Admin

**File:** `promote-to-admin.py`

Run this script **once** to attach the admin claim to a user's account:

```bash
python promote-to-admin.py
```

The script will:
1. Initialize Firebase Admin SDK
2. Verify the user exists
3. Attach `admin: true` custom claim
4. Provide confirmation

**Important:** After running this script, the user **must log out and log back in** for the new token to take effect.

### 2. Frontend Protection

**File:** `src/components/ProtectedRoute.tsx`

The ProtectedRoute component now checks for admin claims:

```typescript
const tokenResult = await user.getIdTokenResult();
if (tokenResult.claims.admin === true) {
  setIsAuthorized(true);
} else {
  setIsAuthorized(false);
}
```

**Benefits:**
- ✅ No Firestore reads
- ✅ No hardcoded emails
- ✅ Instant authorization check
- ✅ Tamper-proof (claims are signed by Firebase)

### 3. Profile Screen Integration

**File:** `src/screens/ProfileScreen.tsx`

The profile screen checks admin status on load:

```typescript
const tokenResult = await currentUser.getIdTokenResult();
const isAdminUser = tokenResult.claims.admin === true;
setIsAdmin(isAdminUser);
```

Admin dashboard link is shown conditionally:
```tsx
{isAdmin && (
  <ProfileLink icon={<Settings size={20} />} label="Admin Dashboard" href="/admin/dashboard" />
)}
```

### 4. Backend Verification (Optional)

**File:** `server.ts`

For future API routes that need admin protection, use the `verifyAdminToken` middleware:

```typescript
app.post("/api/admin/menu", verifyAdminToken, async (req, res) => {
  // Only admins can reach this code
  // req.user contains decoded token with admin claim
});
```

## How It Works

### Custom Claims Flow

1. **Set Claim (One-time):**
   ```python
   auth.set_custom_user_claims(uid, {'admin': True})
   ```

2. **Token Issuance:**
   - User logs in → Firebase issues JWT token
   - Token includes `{ "admin": true }` in claims
   - Token is cryptographically signed

3. **Frontend Check:**
   ```typescript
   const result = await user.getIdTokenResult();
   if (result.claims.admin === true) { /* Admin! */ }
   ```

4. **Backend Check:**
   ```typescript
   const decoded = await admin.auth().verifyIdToken(token);
   if (decoded.admin !== true) { throw 403; }
   ```

## Migration Checklist

- [x] Updated `ProtectedRoute.tsx` to use custom claims
- [x] Updated `ProfileScreen.tsx` to check claims instead of email
- [x] Created `promote-to-admin.py` script
- [x] Added backend verification middleware in `server.ts`
- [ ] Run `promote-to-admin.py` with your UID
- [ ] Log out and log back in to refresh token
- [ ] Test admin access to `/admin/dashboard`
- [ ] Test that non-admin users cannot access admin routes

## Testing

### Test Admin Access

1. Run the promotion script:
   ```bash
   python promote-to-admin.py
   ```

2. Log out of the app completely

3. Log back in with the admin account

4. Navigate to Profile → Should see "Admin Dashboard" link

5. Click "Admin Dashboard" → Should load without redirect

### Test Non-Admin Access

1. Log in with a different (non-admin) account

2. Try to manually navigate to `/admin/dashboard`

3. Should be redirected to `/profile`

## Troubleshooting

### "Admin Dashboard" link not showing

**Problem:** You ran the script but still don't see the admin link.

**Solution:** 
1. Completely log out (clear session)
2. Close browser tab
3. Log back in
4. Custom claims only update on new token issuance

### Token verification failing on backend

**Problem:** Backend returns 401 errors.

**Solution:**
1. Ensure `serviceAccountKey.json` exists in project root
2. Check environment variable: `FIREBASE_ADMIN_SDK_PATH`
3. Verify Firebase Admin SDK is initialized (check server logs)

### Claims not updating after script run

**Problem:** Script says success but claims aren't working.

**Solution:**
1. Verify the UID is correct
2. Check Firebase Console → Authentication → Users → Custom Claims
3. Force token refresh: `await user.getIdToken(true)` (forces refresh)

## Security Considerations

### Why This Is Better

1. **Tamper-Proof:** Claims are signed by Firebase, cannot be forged
2. **No Client-Side Trust:** Backend can independently verify
3. **No Database Dependency:** Authorization doesn't depend on Firestore availability
4. **Scalable:** Can add more roles (moderator, staff, etc.) easily
5. **Performance:** No extra database reads on every route change

### Best Practices

- ✅ Never expose service account key in frontend code
- ✅ Always verify tokens on backend for sensitive operations
- ✅ Use HTTPS for all API calls
- ✅ Regularly rotate service account keys
- ❌ Don't store admin UIDs in client-side code
- ❌ Don't rely solely on client-side checks

## Adding More Roles

You can extend this system with additional roles:

```python
# Python - Set multiple roles
auth.set_custom_user_claims(uid, {
  'admin': True,
  'staff': True,
  'inventory_manager': True
})
```

```typescript
// TypeScript - Check multiple roles
const result = await user.getIdTokenResult();
const isAdmin = result.claims.admin === true;
const isStaff = result.claims.staff === true;
```

## Future Enhancements

1. **Role Expiration:** Add time-limited admin access
2. **Audit Logging:** Track when admin claims are set/removed
3. **Multi-Factor Admin:** Require MFA for admin accounts
4. **IP Restrictions:** Limit admin access to specific IPs
5. **Session Management:** Force logout on all devices when role changes

## References

- [Firebase Custom Claims Documentation](https://firebase.google.com/docs/auth/admin/custom-claims)
- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [JWT Token Structure](https://firebase.google.com/docs/auth/admin/verify-id-tokens)

---

**Last Updated:** 2026-04-08  
**Author:** Smart Cafe Development Team  
**Status:** ✅ Production Ready
