import admin from "firebase-admin";
import { readFileSync } from "fs";

// 1. Read the JSON file the modern ESM way
// ⚠️ MAKE SURE TO PUT YOUR ACTUAL FIREBASE JSON FILE NAME HERE!
const serviceAccount = JSON.parse(
  readFileSync(new URL("./firebase-admin-sdk.json", import.meta.url), "utf-8"),
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// ... the rest of the seedDatabase() function below remains exactly the same
const seedDatabase = async () => {
  try {
    const seedData = [
      {
        name: "Americano",
        category: "Coffee",
        price: 4.5,
        description:
          "Our purest expression. A double shot of single-origin, specialty-grade espresso drawn long with 205°F Third Wave water.",
        is_available: true,
        image_url: "https://source.unsplash.com/nzyzAUsbV0M",
        customizations: [{ name: "Extra Shot", extra_price: 2.0 }],
      },
      {
        name: "Cappuccino",
        category: "Coffee",
        price: 5.5,
        description:
          "One-third double espresso, one-third steamed microfoam, one-third stiff foam. Topped with single-origin cacao.",
        is_available: true,
        image_url: "https://source.unsplash.com/tNALoIZ6P60",
        customizations: [{ name: "Oat Milk", extra_price: 1.0 }],
      },
      {
        name: "Velvet Latte",
        category: "Coffee",
        price: 6.0,
        description:
          "A double shot of Ethiopian Yirgacheffe meets steamed, organic whole milk stretched to liquid silk. Finished with wildflower honey.",
        is_available: true,
        image_url: "https://source.unsplash.com/6366579241",
        customizations: [
          { name: "Oat Milk", extra_price: 1.0 },
          { name: "Extra Honey", extra_price: 0.5 },
        ],
      },
      {
        name: "Caffè Mocha",
        category: "Coffee",
        price: 6.5,
        description:
          "Double espresso combined with 66% dark Venezuelan couverture chocolate. Steamed milk, fresh tonka bean.",
        is_available: true,
        image_url: "https://source.unsplash.com/rY9-nS3q3yI",
        customizations: [{ name: "Oat Milk", extra_price: 1.0 }],
      },
      {
        name: "Macchiato",
        category: "Coffee",
        price: 4.0,
        description:
          "A double shot of our seasonal reserve espresso, marked with exactly one perfect dollop of dense, chilled foam.",
        is_available: true,
        image_url: "https://source.unsplash.com/W7N97z0uI8U",
        customizations: [],
      },
      {
        name: "Flat White",
        category: "Coffee",
        price: 5.0,
        description:
          "A double ristretto layered with silky, unfoamed micro-milk. Served in a 6oz cup.",
        is_available: true,
        image_url: "https://source.unsplash.com/p9H-6IeY8v8",
        customizations: [{ name: "Oat Milk", extra_price: 1.0 }],
      },
      {
        name: "Cortado",
        category: "Coffee",
        price: 4.5,
        description:
          "One double shot of Colombian washed arabica, cut with exactly two ounces of warm, textured milk.",
        is_available: true,
        image_url: "https://source.unsplash.com/7VofvS97XGg",
        customizations: [{ name: "Oat Milk", extra_price: 1.0 }],
      },
      {
        name: "Irish Coffee",
        category: "Coffee",
        price: 12.0,
        description:
          "Fresh-brewed drip coffee, one measure of Irish whiskey, and a collar of lightly whipped, unpasteurized heavy cream.",
        is_available: true,
        image_url: "https://source.unsplash.com/wH6L7T6yZRE",
        customizations: [],
      },
      {
        name: "Cold Brew Coffee",
        category: "Coffee",
        price: 6.0,
        description:
          "Steeped for 18 hours at 36°F. Coarse-ground, anaerobic-fermented Brazilian beans. Served over a single large ice cube.",
        is_available: true,
        image_url: "https://source.unsplash.com/fB95_N0-H_w",
        customizations: [{ name: "Cold Foam", extra_price: 1.5 }],
      },

      // --- WORLD COLLECTION ---
      {
        name: "Cà Phê Trứng",
        category: "World Coffee",
        price: 7.0,
        description:
          "Vietnamese robusta dripped over a meringue-like cream made from organic egg yolks and sweetened condensed milk.",
        is_available: true,
        image_url: "https://source.unsplash.com/Tia698h4vK4",
        customizations: [],
      },
      {
        name: "Kaffeost",
        category: "World Coffee",
        price: 8.0,
        description:
          "A cube of firm, squeaky leipäjuusto (bread cheese) with hot medium-roast coffee poured over it.",
        is_available: true,
        image_url: "https://source.unsplash.com/kID9s9z_CgY",
        customizations: [],
      },
      {
        name: "Kopi Joss",
        category: "World Coffee",
        price: 9.0,
        description:
          "Coarse-ground Robusta with a piece of red-hot, food-grade mangrove charcoal dropped directly into the glass.",
        is_available: true,
        image_url: "https://source.unsplash.com/0V98B7F6M5A",
        customizations: [],
      },
      {
        name: "Café de Olla",
        category: "World Coffee",
        price: 6.5,
        description:
          "Clay-pot brewed dark roast coffee with a raw piloncillo cone, Ceylon cinnamon, and star anise.",
        is_available: true,
        image_url: "https://source.unsplash.com/m9W75J_8SRE",
        customizations: [],
      },

      // --- SAVORY FOOD ---
      {
        name: "Avocado Toast",
        category: "Food",
        price: 14.0,
        description:
          "Thick slice of house-baked sourdough, charred. Smashed with a whole Haas avocado, Maldon sea salt, and Urfa chili.",
        is_available: true,
        image_url: "https://source.unsplash.com/2696614138",
        customizations: [
          { name: "Add Poached Egg", extra_price: 3.0 },
          { name: "Gluten Free Bread", extra_price: 2.0 },
        ],
      },
      {
        name: "Prosciutto Panini",
        category: "Food",
        price: 16.0,
        description:
          "Pressed in a 500°F Italian cast-iron grill. Prosciutto di Parma, fresh mozzarella, and arugula.",
        is_available: true,
        image_url: "https://source.unsplash.com/1564753063544-31835824836d",
        customizations: [{ name: "Extra Prosciutto", extra_price: 4.0 }],
      },
      {
        name: "Shakshuka",
        category: "Food",
        price: 18.0,
        description:
          "San Marzano tomatoes, fire-roasted peppers, six spices. Two organic poached eggs. Cast-iron pan with challah.",
        is_available: true,
        image_url: "https://source.unsplash.com/L_LpSIdh_F4",
        customizations: [
          { name: "Extra Egg", extra_price: 2.5 },
          { name: "Add Feta", extra_price: 2.0 },
        ],
      },
      {
        name: "Caesar Salad",
        category: "Food",
        price: 13.0,
        description:
          "Whole romaine leaves, house-made dressing (anchovy, garlic, Parmigiano-Reggiano). Finished with a single, perfect crouton.",
        is_available: true,
        image_url: "https://source.unsplash.com/7VofvS97XGg",
        customizations: [{ name: "Add Grilled Chicken", extra_price: 5.0 }],
      },

      // --- DESSERTS & PASTRIES ---
      {
        name: "French Croissant",
        category: "Dessert",
        price: 5.5,
        description:
          "Laminated by hand over 36 hours. French AOP butter. Dark, crisp layers that shatter like glass.",
        is_available: true,
        image_url: "https://source.unsplash.com/3333423788",
        customizations: [{ name: "Side of Jam", extra_price: 1.0 }],
      },
      {
        name: "Tiramisu",
        category: "Dessert",
        price: 9.0,
        description:
          "Ladyfingers soaked in real espresso + Marsala wine. Layered with mascarpone sabayon.",
        is_available: true,
        image_url: "https://source.unsplash.com/1571877427384-09c92693e23d",
        customizations: [],
      },
      {
        name: "Pastel de Nata",
        category: "Dessert",
        price: 4.0,
        description:
          "A shell of puff pastry burnt in spots. Filling is egg yolk, sugar, milk, and vanilla bean.",
        is_available: true,
        image_url: "https://source.unsplash.com/1563282142-990a442750e5",
        customizations: [],
      },
    ];

    console.log("Seeding database...");
    const batch = admin.firestore().batch();
    const collectionRef = admin.firestore().collection("menu_items");

    seedData.forEach((item) => {
      const docRef = collectionRef.doc();
      batch.set(docRef, item);
    });

    await batch.commit();
    console.log(`✅ Successfully seeded ${seedData.length} items!`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seedDatabase();
