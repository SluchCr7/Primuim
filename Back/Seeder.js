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
        image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500" 
      },
      { 
        name: "Fashion & Apparel", 
        description: "Clothing, Shoes, and Accessories", 
        image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500" 
      },
      { 
        name: "Home & Kitchen", 
        description: "Furniture, Kitchenware, and Decor", 
        image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500" 
      },
      { 
        name: "Beauty & Personal Care", 
        description: "Makeup, Skincare, and Perfumes", 
        image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500" 
      },
      { 
        name: "Sports & Outdoors", 
        description: "Fitness equipment and Sports wear", 
        image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=500" 
      },
      { 
        name: "Supermarket & Groceries", 
        description: "Food, Drinks, and Household essentials", 
        image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500" 
      },
      { 
        name: "Baby & Toys", 
        description: "Baby clothing, Toys, and Games", 
        image: "https://images.unsplash.com/photo-1515488042361-404e9250afef?w=500" 
      },
      { 
        name: "Books & Stationery", 
        description: "Educational books, Novels, and Office supplies", 
        image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500" 
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
      { name: "Smartphones & Tablets", parent: categoryMap["Electronics"], description: "Mobile phones and tablets", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500" },
      { name: "Laptops & Computers", parent: categoryMap["Electronics"], description: "Computers, laptops, and components", image: "https://images.unsplash.com/photo-1496181130204-755241524eab?w=500" },
      { name: "Audio & Headphones", parent: categoryMap["Electronics"], description: "Speakers, headphones, and earbuds", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500" },
      { name: "Smart Watches & Wearables", parent: categoryMap["Electronics"], description: "Fitness trackers and smartwatches", image: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=500" },
      { name: "Cameras & Photography", parent: categoryMap["Electronics"], description: "Cameras, lenses, and accessories", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500" },

      // Fashion & Apparel
      { name: "Men's Fashion", parent: categoryMap["Fashion & Apparel"], description: "Men's clothing and shoes", image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=500" },
      { name: "Women's Fashion", parent: categoryMap["Fashion & Apparel"], description: "Women's clothing, dresses, and bags", image: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=500" },
      { name: "Kids' Fashion", parent: categoryMap["Fashion & Apparel"], description: "Children and baby clothing", image: "https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=500" },
      { name: "Watches & Jewelry", parent: categoryMap["Fashion & Apparel"], description: "Luxury watches and fine jewelry", image: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=500" },

      // Home & Kitchen
      { name: "Furniture", parent: categoryMap["Home & Kitchen"], description: "Living room, bedroom, and office furniture", image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=500" },
      { name: "Kitchen & Dining", parent: categoryMap["Home & Kitchen"], description: "Cookware, tableware, and small appliances", image: "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=500" },
      { name: "Home Decor", parent: categoryMap["Home & Kitchen"], description: "Lighting, carpets, and wall art", image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500" },

      // Beauty & Personal Care
      { name: "Makeup", parent: categoryMap["Beauty & Personal Care"], description: "Face, eyes, and lips cosmetics", image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500" },
      { name: "Skincare", parent: categoryMap["Beauty & Personal Care"], description: "Moisturizers, serums, and sunscreens", image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500" },
      { name: "Fragrances & Perfumes", parent: categoryMap["Beauty & Personal Care"], description: "Men and women perfumes", image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=500" },

      // Sports & Outdoors
      { name: "Fitness & Gym", parent: categoryMap["Sports & Outdoors"], description: "Treadmills, dumbbells, and gym gear", image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500" },
      { name: "Sports Wear", parent: categoryMap["Sports & Outdoors"], description: "Athletic clothing and shoes", image: "https://images.unsplash.com/photo-1483721310020-03333e577078?w=500" },
      { name: "Outdoor Recreation", parent: categoryMap["Sports & Outdoors"], description: "Camping, hiking, and cycling gear", image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=500" },

      // Supermarket & Groceries
      { name: "Beverages", parent: categoryMap["Supermarket & Groceries"], description: "Coffee, tea, juices, and water", image: "https://images.unsplash.com/photo-1527960656555-ff537f81f13a?w=500" },
      { name: "Snacks & Sweets", parent: categoryMap["Supermarket & Groceries"], description: "Chips, chocolates, and biscuits", image: "https://images.unsplash.com/photo-1599490659223-e1b98175b24a?w=500" },
      { name: "Canned & Packaged Food", parent: categoryMap["Supermarket & Groceries"], description: "Rice, pasta, and cooking oils", image: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=500" },

      // Baby & Toys
      { name: "Baby Gear", parent: categoryMap["Baby & Toys"], description: "Strollers, car seats, and feeding supplies", image: "https://images.unsplash.com/photo-1592501061917-21a4f009e9db?w=500" },
      { name: "Toys & Games", parent: categoryMap["Baby & Toys"], description: "Action figures, board games, and puzzles", image: "https://images.unsplash.com/photo-1531746790731-6c20792c17d7?w=500" },

      // Books & Stationery
      { name: "English Books", parent: categoryMap["Books & Stationery"], description: "Novels, business, and self-help books", image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500" },
      { name: "Arabic Books", parent: categoryMap["Books & Stationery"], description: "Arabic literature and history books", image: "https://images.unsplash.com/photo-1513001900722-370f803f498d?w=500" },
      { name: "Office Supplies", parent: categoryMap["Books & Stationery"], description: "Pens, notebooks, and organizers", image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=500" }
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