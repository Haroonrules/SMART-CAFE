"""
Script to promote a Firebase user to admin using Custom Claims.
This script uses the Firebase Admin SDK to set custom claims on a user's account.

Prerequisites:
1. Install Firebase Admin SDK: pip install firebase-admin
2. Have your service account key file (firebase-admin-sdk.json)

Usage:
    python promote-to-admin.py --uid <user-uid>
    python promote-to-admin.py --email <user-email>
    python promote-to-admin.py --list  # List all users

Or run interactively:
    python promote-to-admin.py
"""

import firebase_admin
from firebase_admin import credentials, auth
import argparse
import os
import sys

# Firebase Admin SDK configuration
SERVICE_ACCOUNT_KEY = "firebase-admin-sdk.json"


def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    if not firebase_admin._apps:
        if os.path.exists(SERVICE_ACCOUNT_KEY):
            cred = credentials.Certificate(SERVICE_ACCOUNT_KEY)
            firebase_admin.initialize_app(cred)
            print("✅ Firebase Admin SDK initialized successfully")
            return True
        else:
            print(f"❌ Service account key not found: {SERVICE_ACCOUNT_KEY}")
            print("\n📋 Setup Instructions:")
            print("   1. Go to Firebase Console > Project Settings > Service Accounts")
            print("   2. Click 'Generate New Private Key'")
            print(f"   3. Save the downloaded JSON file as '{SERVICE_ACCOUNT_KEY}' in this directory")
            return False
    return True


def get_user_by_uid(uid: str):
    """Get user by UID"""
    try:
        user = auth.get_user(uid)
        return user
    except auth.UserNotFoundError:
        print(f"❌ Error: User with UID '{uid}' not found in Firebase Auth.")
        return None
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None


def get_user_by_email(email: str):
    """Get user by email"""
    try:
        user = auth.get_user_by_email(email)
        return user
    except auth.UserNotFoundError:
        print(f"❌ Error: User with email '{email}' not found in Firebase Auth.")
        return None
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None


def make_user_admin(uid: str):
    """
    Attach the 'admin: true' custom claim to a user's account.
    
    Args:
        uid: The Firebase Auth UID of the user to promote
    """
    user = get_user_by_uid(uid)
    if not user:
        return False
    
    print(f"\n📋 User Details:")
    print(f"   UID: {user.uid}")
    print(f"   Email: {user.email}")
    print(f"   Display Name: {user.display_name or 'N/A'}")
    print(f"   Email Verified: {user.email_verified}")
    
    # Check current claims
    user_record = auth.get_user(uid)
    current_claims = user_record.custom_claims or {}
    print(f"\n📊 Current Custom Claims: {current_claims}")
    
    if current_claims.get('admin'):
        print(f"\n⚠️  User is already an admin!")
        return True
    
    try:
        # Set custom claims
        auth.set_custom_user_claims(uid, {'admin': True})
        
        print(f"\n✅ SUCCESS! User {uid} is now an Admin.")
        print(f"🔑 Custom claim 'admin: true' has been attached to their account.")
        print(f"\n⚠️  IMPORTANT: The user must LOG OUT and LOG BACK IN for the new token to take effect.")
        print(f"   The new claim will be included in their ID token after re-authentication.")
        
        return True
        
    except Exception as e:
        print(f"❌ Error setting admin claim: {str(e)}")
        return False


def remove_admin(uid: str):
    """
    Remove the 'admin' custom claim from a user's account.
    
    Args:
        uid: The Firebase Auth UID of the user to demote
    """
    user = get_user_by_uid(uid)
    if not user:
        return False
    
    print(f"\n📋 User Details:")
    print(f"   UID: {user.uid}")
    print(f"   Email: {user.email}")
    
    try:
        # Remove admin claim
        auth.set_custom_user_claims(uid, {'admin': None})
        
        print(f"\n✅ SUCCESS! User {uid} is no longer an Admin.")
        print(f"🔑 Custom claim 'admin' has been removed from their account.")
        print(f"\n⚠️  IMPORTANT: The user must LOG OUT and LOG BACK IN for the change to take effect.")
        
        return True
        
    except Exception as e:
        print(f"❌ Error removing admin claim: {str(e)}")
        return False


def list_users(max_results: int = 10):
    """List all users in the Firebase project"""
    try:
        print(f"\n📋 Listing users (max {max_results}):")
        print("-" * 80)
        print(f"{'UID':<45} {'Email':<30} {'Display Name':<20}")
        print("-" * 80)
        
        users = auth.list_users(max_results=max_results)
        for user in users.users:
            claims = user.custom_claims or {}
            admin_status = "👑 Admin" if claims.get('admin') else "👤 User"
            print(f"{user.uid:<45} {user.email or 'N/A':<30} {user.display_name or 'N/A':<20} {admin_status}")
        
        print("-" * 80)
        print(f"Total users shown: {len(users.users)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error listing users: {str(e)}")
        return False


def check_admin_status(uid: str):
    """Check if a user has admin custom claim"""
    user = get_user_by_uid(uid)
    if not user:
        return None
    
    claims = user.custom_claims or {}
    is_admin = claims.get('admin', False)
    
    print(f"\n📊 Admin Status for user {uid}:")
    print(f"   Email: {user.email}")
    print(f"   Is Admin: {'✅ Yes' if is_admin else '❌ No'}")
    print(f"   Custom Claims: {claims}")
    
    return is_admin


def interactive_mode():
    """Run the script in interactive mode"""
    print("\n" + "=" * 60)
    print("🔐 Firebase Custom Claims - Admin Management")
    print("=" * 60)
    
    while True:
        print("\n📋 Choose an action:")
        print("   1. Promote user to admin (by UID)")
        print("   2. Promote user to admin (by email)")
        print("   3. Remove admin privileges (by UID)")
        print("   4. Remove admin privileges (by email)")
        print("   5. Check admin status (by UID)")
        print("   6. List all users")
        print("   7. Exit")
        
        choice = input("\nEnter your choice (1-7): ").strip()
        
        if choice == '1':
            uid = input("Enter user UID: ").strip()
            if uid:
                make_user_admin(uid)
        elif choice == '2':
            email = input("Enter user email: ").strip()
            if email:
                user = get_user_by_email(email)
                if user:
                    make_user_admin(user.uid)
        elif choice == '3':
            uid = input("Enter user UID: ").strip()
            if uid:
                remove_admin(uid)
        elif choice == '4':
            email = input("Enter user email: ").strip()
            if email:
                user = get_user_by_email(email)
                if user:
                    remove_admin(user.uid)
        elif choice == '5':
            uid = input("Enter user UID: ").strip()
            if uid:
                check_admin_status(uid)
        elif choice == '6':
            list_users()
        elif choice == '7':
            print("\n👋 Goodbye!")
            break
        else:
            print("❌ Invalid choice. Please enter a number between 1 and 7.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Firebase Custom Claims Admin Management Tool",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python promote-to-admin.py --uid baqV3tQlhnWczwTSUFsFsOs1w392
  python promote-to-admin.py --email user@example.com
  python promote-to-admin.py --list
  python promote-to-admin.py --check --uid baqV3tQlhnWczwTSUFsFsOs1w392
        """
    )
    
    parser.add_argument('--uid', help='Firebase Auth UID of the user')
    parser.add_argument('--email', help='Email address of the user')
    parser.add_argument('--list', action='store_true', help='List all users')
    parser.add_argument('--check', action='store_true', help='Check admin status instead of setting it')
    parser.add_argument('--remove', action='store_true', help='Remove admin privileges instead of granting')
    parser.add_argument('--max-results', type=int, default=10, help='Maximum number of users to list (default: 10)')
    
    args = parser.parse_args()
    
    # Initialize Firebase
    if not initialize_firebase():
        sys.exit(1)
    
    # Interactive mode if no arguments
    if len(sys.argv) == 1:
        interactive_mode()
        sys.exit(0)
    
    # List users
    if args.list:
        list_users(args.max_results)
        sys.exit(0)
    
    # Check admin status
    if args.check:
        if args.uid:
            check_admin_status(args.uid)
        elif args.email:
            user = get_user_by_email(args.email)
            if user:
                check_admin_status(user.uid)
        else:
            print("❌ Error: --check requires either --uid or --email")
            sys.exit(1)
        sys.exit(0)
    
    # Remove admin privileges
    if args.remove:
        if args.uid:
            remove_admin(args.uid)
        elif args.email:
            user = get_user_by_email(args.email)
            if user:
                remove_admin(user.uid)
        else:
            print("❌ Error: --remove requires either --uid or --email")
            sys.exit(1)
        sys.exit(0)
    
    # Promote to admin (default action)
    if args.uid:
        make_user_admin(args.uid)
    elif args.email:
        user = get_user_by_email(args.email)
        if user:
            make_user_admin(user.uid)
    else:
        print("❌ Error: Must specify either --uid or --email")
        parser.print_help()
        sys.exit(1)