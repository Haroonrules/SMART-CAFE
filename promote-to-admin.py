"""
Script to promote a Firebase user to admin using Custom Claims.
Run this once to set the admin claim on your user account.

Usage:
    python promote-to-admin.py
"""

import firebase_admin
from firebase_admin import credentials, auth
import os

# Initialize Firebase Admin SDK
# Make sure you have your service account key file
SERVICE_ACCOUNT_KEY = "serviceAccountKey.json"

def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    if not firebase_admin._apps:
        if os.path.exists(SERVICE_ACCOUNT_KEY):
            cred = credentials.Certificate(SERVICE_ACCOUNT_KEY)
            firebase_admin.initialize_app(cred)
            print("✅ Firebase Admin SDK initialized successfully")
        else:
            print(f"❌ Service account key not found: {SERVICE_ACCOUNT_KEY}")
            print("Please download your Firebase service account key and save it as serviceAccountKey.json")
            return False
    return True

def make_user_admin(uid: str):
    """
    Attach the 'admin: true' custom claim to a user's account.
    
    Args:
        uid: The Firebase Auth UID of the user to promote
    """
    try:
        # Verify the user exists first
        user = auth.get_user(uid)
        print(f"\n📋 User Details:")
        print(f"   UID: {user.uid}")
        print(f"   Email: {user.email}")
        print(f"   Display Name: {user.display_name or 'N/A'}")
        
        # Set custom claims
        auth.set_custom_user_claims(uid, {'admin': True})
        
        print(f"\n✅ SUCCESS! User {uid} is now an Admin.")
        print(f"🔑 Custom claim 'admin: true' has been attached to their account.")
        print(f"\n⚠️  IMPORTANT: The user must LOG OUT and LOG BACK IN for the new token to take effect.")
        
    except auth.UserNotFoundError:
        print(f"❌ Error: User with UID '{uid}' not found in Firebase Auth.")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    # Your Firebase UID
    USER_UID = "baqV3tQlhnWczwTSUFsFsOs1w392"
    
    print("=" * 60)
    print("🔐 Firebase Custom Claims - Admin Promotion Script")
    print("=" * 60)
    
    if initialize_firebase():
        make_user_admin(USER_UID)
    else:
        print("\n⚠️  Cannot proceed without Firebase initialization.")
