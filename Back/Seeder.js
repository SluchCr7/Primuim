const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { Category } = require("./models/Category"); 

dotenv.config({ path: "./.env" });

mongoose
  .connect(process.env.MONGO_URI) 
  .then(() => console.log("Connected to MongoDB for seeding..."))
  .catch((err) => console.error("Database connection error:", err));

const seedCategories = async () => {
  try {
    await Category.deleteMany(); 
    console.log("🧹 Cleared existing categories...");

    // -------------------------------------------------------------
    // [1] الأقسام الرئيسية (مع حقل الصورة المضافة)
    // -------------------------------------------------------------
    const mainCategoriesData = [
      { 
        name: "Electronics", 
        description: "Mobiles, Laptops, and Gadgets", 
        image: "/images/electronics.jpg" 
      },
      { 
        name: "Fashion & Apparel", 
        description: "Clothing, Shoes, and Accessories", 
        image: "/images/fashion.jpg" 
      },
      { 
        name: "Home & Kitchen", 
        description: "Furniture, Kitchenware, and Decor", 
        image: "/images/Home&Kitchen.jpg" 
      },
      { 
        name: "Beauty & Personal Care", 
        description: "Makeup, Skincare, and Perfumes", 
        image: "/images/Beauty.jpg" 
      },

      { 
        name: "Sports & Outdoors", 
        description: "Fitness equipment and Sports wear", 
        image: "/images/Sports.jpg" 
      },
      { 
        name: "Supermarket & Groceries", 
        description: "Food, Drinks, and Household essentials", 
        image: "/images/Supermarker.jpg" 
      },
      { 
        name: "Baby & Toys", 
        description: "Baby clothing, Toys, and Games", 
        image: "/images/Baby & Toys.avif" 
      },
      { 
        name: "Books & Stationery", 
        description: "Educational books, Novels, and Office supplies", 
        image: "/images/Books.jpg" 
      }
    ];

    const mainCategories = await Category.create(mainCategoriesData);
    console.log("🌱 Main categories created.");

    const categoryMap = {};
    mainCategories.forEach(cat => {
      categoryMap[cat.name] = cat._id;
    });

    // -------------------------------------------------------------
    // [2] الأقسام الفرعية المستوى الأول (مع حقل الصورة المضافة)
    // -------------------------------------------------------------
    const subCategoriesData = [
      // Electronics
      { name: "Smartphones & Tablets", parent: categoryMap["Electronics"], description: "Mobile phones and tablets", image: "/images/smartPhones.jpg" },
      { name: "Laptops & Computers", parent: categoryMap["Electronics"], description: "Computers, laptops, and components", image: "/images/laptops_computers.jpg" },
      { name: "Audio & Headphones", parent: categoryMap["Electronics"], description: "Speakers, headphones, and earbuds", image: "/images/audio_headphones.jpg" },
      { name: "Smart Watches & Wearables", parent: categoryMap["Electronics"], description: "Fitness trackers and smartwatches", image: "/images/smart_watches_wearables.jpg" },
      { name: "Cameras & Photography", parent: categoryMap["Electronics"], description: "Cameras, lenses, and accessories", image: "/images/cameras_photography.jpg" },

      // Fashion & Apparel
      { name: "Men's Fashion", parent: categoryMap["Fashion & Apparel"], description: "Men's clothing and shoes", image: "/images/men_fashion.jpg" },
      { name: "Women's Fashion", parent: categoryMap["Fashion & Apparel"], description: "Women's clothing, dresses, and bags", image: "/images/women_fashion.jpg" },
      // { name: "Kids' Fashion", parent: categoryMap["Fashion & Apparel"], description: "Children and baby clothing", image: "/images/kids_fashion.jpg" },
      { name: "Watches & Jewelry", parent: categoryMap["Fashion & Apparel"], description: "Luxury watches and fine jewelry", image: "/images/watches_jewelry.jpg" },

      // Home & Kitchen
      { name: "Furniture", parent: categoryMap["Home & Kitchen"], description: "Living room, bedroom, and office furniture", image: "/images/furniture.jpg" },
      { name: "Kitchen & Dining", parent: categoryMap["Home & Kitchen"], description: "Cookware, tableware, and small appliances", image: "/images/kitchen_dining.jpg" },
      { name: "Home Decor", parent: categoryMap["Home & Kitchen"], description: "Lighting, carpets, and wall art", image: "/images/home_decor.jpg" },

      // Beauty & Personal Care
      { name: "Makeup", parent: categoryMap["Beauty & Personal Care"], description: "Face, eyes, and lips cosmetics", image: "/images/makeup.jpg" },
      { name: "Skincare", parent: categoryMap["Beauty & Personal Care"], description: "Moisturizers, serums, and sunscreens", image: "/images/skincare.jpg" },
      { name: "Fragrances & Perfumes", parent: categoryMap["Beauty & Personal Care"], description: "Men and women perfumes", image: "/images/fragrances_perfumes.jpg" },

      // Sports & Outdoors
      { name: "Fitness & Gym", parent: categoryMap["Sports & Outdoors"], description: "Treadmills, dumbbells, and gym gear", image: "/images/fitness_gym.jpg" },
      { name: "Sports Wear", parent: categoryMap["Sports & Outdoors"], description: "Athletic clothing and shoes", image: "/images/sports_wear.jpg" },
      // { name: "Outdoor Recreation", parent: categoryMap["Sports & Outdoors"], description: "Camping, hiking, and cycling gear", image: "/images/outdoor_recreation.jpg" },

      // Supermarket & Groceries
      { name: "Beverages", parent: categoryMap["Supermarket & Groceries"], description: "Coffee, tea, juices, and water", image: "/images/beverages.jpg" },
      { name: "Snacks & Sweets", parent: categoryMap["Supermarket & Groceries"], description: "Chips, chocolates, and biscuits", image: "/images/snacks_sweets.jpg" },
      { name: "Canned & Packaged Food", parent: categoryMap["Supermarket & Groceries"], description: "Rice, pasta, and cooking oils", image: "/images/canned_packaged_food.jpg" },

      // Baby & Toys
      { name: "Baby Gear", parent: categoryMap["Baby & Toys"], description: "Strollers, car seats, and feeding supplies", image: "/images/baby_gear.jpg" },
      { name: "Toys & Games", parent: categoryMap["Baby & Toys"], description: "Action figures, board games, and puzzles", image: "/images/toys_games.jpg" },

      // Books & Stationery
      { name: "English Books", parent: categoryMap["Books & Stationery"], description: "Novels, business, and self-help books", image: "/images/english_books.jpg" },
      { name: "Arabic Books", parent: categoryMap["Books & Stationery"], description: "Arabic literature and history books", image: "/images/arabic_books.jpg" },
      { name: "Office Supplies", parent: categoryMap["Books & Stationery"], description: "Pens, notebooks, and organizers", image: "/images/office_supplies.jpg" }
    ];

    const subCategories = await Category.create(subCategoriesData);
    console.log("🌿 Subcategories level 1 created.");

    // -------------------------------------------------------------
    // [3] الأقسام الفرعية المستوى الثاني (مع حقل الصورة المضافة)
    // -------------------------------------------------------------
    const mensFashionId = subCategories.find(cat => cat.name === "Men's Fashion")._id;
    const womensFashionId = subCategories.find(cat => cat.name === "Women's Fashion")._id;

    const deepSubCategoriesData = [
      { name: "Men's T-Shirts", parent: mensFashionId, description: "Casual t-shirts for men", image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500" },
      { name: "Men's Shirts & Suits", parent: mensFashionId, description: "Formal shirts and suits", image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500" },
      { name: "Men's Shoes", parent: mensFashionId, description: "Sneakers, boots, and classic shoes", image: "https://images.unsplash.com/photo-1539185441755-769473a23570?w=500" },
      
      { name: "Women's Dresses", parent: womensFashionId, description: "Casual and evening dresses", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500" },
      { name: "Women's Handbags", parent: womensFashionId, description: "Leather bags and clutches", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500" },
      { name: "Women's Shoes", parent: womensFashionId, description: "Heels, flats, and sneakers", image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500" }
    ];

    await Category.create(deepSubCategoriesData);
    console.log("🌳 Deep Subcategories level 2 created.");

    console.log("✨ ✅ Database successfully populated with comprehensive categories tree and images!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding categories:", error);
    process.exit(1);
  }
};

mongoose.connection.once("open", () => {
  seedCategories();
});