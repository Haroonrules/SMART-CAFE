import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase (Make sure your path to the JSON key is correct)
cred = credentials.Certificate("firebase-admin-sdk.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

def seed_database():
    print("🌱 Seeding the new world...")

    # 1. Seed Menu Items
    menu_ref = db.collection("menu_items")
    menu_ref.add({
        "name": "Iced Vanilla Latte",
        "category": "Coffee",
        "price": 5.50,
        "image_url": "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=500&q=60",
        "is_active": True,
        "is_available": True,
        "customizations": [
            {"name": "Oat Milk", "extra_price": 1.00},
            {"name": "Extra Shot", "extra_price": 1.50}
        ]
    })
    
    menu_ref.add({
        "name": "Avocado Toast",
        "category": "Food",
        "price": 9.00,
        "image_url": "https://images.unsplash.com/photo-1603048297172-c92544798d5e?auto=format&fit=crop&w=500&q=60",
        "is_active": True,
        "is_available": True,
        "customizations": [
            {"name": "Add Egg", "extra_price": 2.00},
            {"name": "Gluten Free Bread", "extra_price": 1.50}
        ]
    })

    # 2. Seed Wines
    wine_ref = db.collection("wines")
    wine_ref.add({
        "name": "Napa Valley Cabernet Sauvignon",
        "type": "Red",
        "region": "California",
        "vintage": "2019",
        "tasting_notes": "Bold, dark cherry, oak, and a hint of vanilla. Perfect for heavy meals.",
        "price_glass": 14.00,
        "price_bottle": 55.00,
        "image_url": "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?auto=format&fit=crop&w=500&q=60",
        "stock_status": "in_stock"
    })

    # 3. Seed YOUR Admin Account 
    # IMPORTANT: Replace the string below with your actual Firebase Auth UID!
    YOUR_UID = "baqV3tQlhnWczwTSUFsFsOs1w392" 
    
    staff_ref = db.collection("staff").document(YOUR_UID)
    staff_ref.set({
        "uid": YOUR_UID,
        "email": "haroonkhan0119@gmail.com", # Put your actual login email here
        "display_role": "Head Architect",
        "system_role": "admin",
        "is_on_duty": True,
        "photo_url": "https://lh3.googleusercontent.com/a/ACg8ocKXLs6h74qeYWwYcfiIWkONBNraGAPfx2hbxeUoGOZNKnUBI4tl=s576-c-no"
    })

    print("✅ Seeding Complete! Go check your Firebase Console and refresh your React app.")

if __name__ == "__main__":
    seed_database()