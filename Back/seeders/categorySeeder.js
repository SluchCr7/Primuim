
const mongoose = require("mongoose");
const path = require("path");
const slugify = require("slugify");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

const connectDB = require("../config/db");
const { Category } = require("../models/Category");

// ======================================================
// CATEGORY TREE
// ======================================================

const categoryTree = [
  {
    id: "6a392bdaf71d80816ab3bc0a",
    name: "Electronics",
    children: [
      {
        id: "6a392d7ef71d80816ab3bc13",
        name: "Smartphones & Tablets",
      },
      {
        id: "6a392e16f71d80816ab3bc35",
        name: "Laptops & Computers",
      },
      {
        id: "6a392e83f71d80816ab3bc36",
        name: "Audio & Headphones",
      },
      {
        id: "6a392ef2f71d80816ab3bc37",
        name: "Smart Watches & Wearables",
      },
      {
        id: "6a392f3cf71d80816ab3bc38",
        name: "Cameras & Photography",
      },
    ],
  },

  {
    id: "6a392c3af71d80816ab3bc0b",
    name: "Fashion & Apparel",
    children: [
      {
        id: "6a393277f71d80816ab3bc5c",
        name: "Men's Fashion",
        children: [
          {
            id: "6a393724f71d80816ab3bc94",
            name: "Men's T-Shirts",
          },
          {
            id: "6a39373ef71d80816ab3bc95",
            name: "Men's Shirts & Suits",
          },
          {
            id: "6a39376bf71d80816ab3bc96",
            name: "Men's Shoes",
          },
        ],
      },
      {
        id: "6a3932bbf71d80816ab3bc5d",
        name: "Women's Fashion",
        children: [
          {
            id: "6a3937b7f71d80816ab3bc97",
            name: "Women's Dresses",
          },
          {
            id: "6a3937cef71d80816ab3bc98",
            name: "Women's Handbags",
          },
          {
            id: "6a3937e0f71d80816ab3bc99",
            name: "Women's Shoes",
          },
        ],
      },
      {
        id: "6a39331ff71d80816ab3bc5e",
        name: "Watches & Jewelry",
      },
      {
        id: "6a39391bf71d80816ab3bcc2",
        name: "Kids' Fashion",
      },
    ],
  },

  {
    id: "6a392c60f71d80816ab3bc0c",
    name: "Home & Kitchen",
    children: [
      {
        id: "6a393376f71d80816ab3bc5f",
        name: "Furniture",
      },
      {
        id: "6a393397f71d80816ab3bc60",
        name: "Kitchen & Dining",
      },
      {
        id: "6a3933bcf71d80816ab3bc61",
        name: "Home Decor",
      },
    ],
  },

  {
    id: "6a392c8cf71d80816ab3bc0d",
    name: "Beauty & Personal Care",
    children: [
      {
        id: "6a3933e9f71d80816ab3bc62",
        name: "Makeup",
      },
      {
        id: "6a39341ff71d80816ab3bc63",
        name: "Skincare",
      },
      {
        id: "6a393434f71d80816ab3bc64",
        name: "Fragrances & Perfumes",
      },
    ],
  },

  {
    id: "6a392cadf71d80816ab3bc0e",
    name: "Sports & Outdoors",
    children: [
      {
        id: "6a39348af71d80816ab3bc65",
        name: "Fitness & Gym",
      },
      {
        id: "6a3934b7f71d80816ab3bc66",
        name: "Sports Wear",
      },
      {
        id: "6a3938b9f71d80816ab3bc9a",
        name: "Outdoor Recreation",
      },
    ],
  },

  {
    id: "6a392cd5f71d80816ab3bc0f",
    name: "Supermarket & Groceries",
    children: [
      {
        id: "6a393534f71d80816ab3bc67",
        name: "Beverages",
      },
      {
        id: "6a39359ef71d80816ab3bc8d",
        name: "Snacks & Sweets",
      },
      {
        id: "6a3935bcf71d80816ab3bc8e",
        name: "Canned & Packaged Food",
      },
    ],
  },

  {
    id: "6a392cf2f71d80816ab3bc10",
    name: "Baby & Toys",
    children: [
      {
        id: "6a39361ef71d80816ab3bc8f",
        name: "Baby Gear",
      },
      {
        id: "6a393649f71d80816ab3bc90",
        name: "Toys & Games",
      },
    ],
  },

  {
    id: "6a392d13f71d80816ab3bc11",
    name: "Books & Stationery",
    children: [
      {
        id: "6a393662f71d80816ab3bc91",
        name: "English Books",
      },
      {
        id: "6a3936aef71d80816ab3bc92",
        name: "Arabic Books",
      },
      {
        id: "6a3936ccf71d80816ab3bc93",
        name: "Office Supplies",
      },
    ],
  },

  {
    id: "6a3939d4f71d80816ab3bcc3",
    name: "Health & Wellness",
    children: [
      {
        id: "6a3a9d596e6289bad62c6a6b",
        name: "Vitamins & Supplements",
      },
      {
        id: "6a3a9d9b6e6289bad62c6a6c",
        name: "Medical Supplies",
      },
    ],
  },

  {
    id: "6a3939fff71d80816ab3bcc4",
    name: "Gaming",
    children: [
      {
        id: "6a3a9c626e6289bad62c6a68",
        name: "Consoles",
      },
      {
        id: "6a3a9cc66e6289bad62c6a69",
        name: "Video Games",
      },
      {
        id: "6a3a9cf56e6289bad62c6a6a",
        name: "Gaming Accessories",
      },
    ],
  },
];

// ======================================================
// CATEGORY IMAGES
// Every category has its own image.
// ======================================================

const CATEGORY_IMAGES = {
  // Main categories
  electronics:
    "https://images.unsplash.com/photo-1498049794561-7780e7231661",

  "fashion-apparel":
    "https://images.unsplash.com/photo-1483985988355-763728e1935b",

  "home-kitchen":
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0",

  "beauty-personal-care":
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348",

  "sports-outdoors":
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438",

  "supermarket-groceries":
    "https://images.unsplash.com/photo-1542838132-92c53300491e",

  "baby-toys":
    "https://images.unsplash.com/photo-1566004100631-35d015d6a491",

  "books-stationery":
    "https://images.unsplash.com/photo-1507842217343-583bb7270b66",

  "health-wellness":
    "https://images.unsplash.com/photo-1505751172876-fa1923c5c528",

  gaming:
    "https://images.unsplash.com/photo-1593305841991-05c297ba4575",

  // Electronics
  "smartphones-tablets":
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9",

  "laptops-computers":
    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853",

  "audio-headphones":
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",

  "smart-watches-wearables":
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30",

  "cameras-photography":
    "https://images.unsplash.com/photo-1516035069371-29a1b244cc32",

  // Fashion
  "mens-fashion":
    "https://images.unsplash.com/photo-1617137968427-85924c800a22",

  "mens-t-shirts":
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",

  "mens-shirts-suits":
    "https://images.unsplash.com/photo-1596755094514-f87e34085b2c",

  "mens-shoes":
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff",

  "womens-fashion":
    "https://images.unsplash.com/photo-1483985988355-763728e1935b",

  "womens-dresses":
    "https://images.unsplash.com/photo-1595777457583-95e059d581b8",

  "womens-handbags":
    "https://images.unsplash.com/photo-1584917865442-de89df76afd3",

  "womens-shoes":
    "https://images.unsplash.com/photo-1543163521-1bf539c55dd2",

  "watches-jewelry":
    "https://images.unsplash.com/photo-1611652022419-a9419f74343d",

  "kids-fashion":
    "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea",

  // Home & Kitchen
  furniture:
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc",

  "kitchen-dining":
    "https://images.unsplash.com/photo-1556911220-e15b29be8c8f",

  "home-decor":
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0",

  // Beauty
  makeup:
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9",

  skincare:
    "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b",

  "fragrances-perfumes":
    "https://images.unsplash.com/photo-1541643600914-78b084683601",

  // Sports
  "fitness-gym":
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48",

  "sports-wear":
    "https://images.unsplash.com/photo-1538805060514-97d9cc17730c",

  "outdoor-recreation":
    "https://images.unsplash.com/photo-1472396961693-142e6e269027",

  // Groceries
  beverages:
    "https://images.unsplash.com/photo-1513558161293-cdaf765edfd4",

  "snacks-sweets":
    "https://images.unsplash.com/photo-1621939514649-280e2aa9f5c0",

  "canned-packaged-food":
    "https://images.unsplash.com/photo-1547592180-85f173990554",

  // Baby & Toys
  "baby-gear":
    "https://images.unsplash.com/photo-1519689680058-324335c77eba",

  "toys-games":
    "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1",

  // Books & Stationery
  "english-books":
    "https://images.unsplash.com/photo-1544947950-fa07a98d237f",

  "arabic-books":
    "https://images.unsplash.com/photo-1512820790803-83ca734da794",

  "office-supplies":
    "https://images.unsplash.com/photo-1455390582262-044cdead277a",

  // Health
  "vitamins-supplements":
    "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8",

  "medical-supplies":
    "https://images.unsplash.com/photo-1584982751601-97dcc096659c",

  // Gaming
  consoles:
    "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3",

  "video-games":
    "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8",

  "gaming-accessories":
    "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08",
};

// ======================================================
// FLATTEN CATEGORY TREE
// ======================================================

const flattenCategories = (
  nodes,
  parentId = null,
  level = 0
) => {
  const result = [];

  for (const node of nodes) {
    const slug = slugify(node.name, {
      lower: true,
      strict: true,
    });

    const category = {
      _id: new mongoose.Types.ObjectId(node.id),

      name: node.name,

      slug,

      image:
        CATEGORY_IMAGES[slug] ||
        "https://via.placeholder.com/150",

      description:
        node.description ||
        `Explore our ${node.name} collection.`,

      parent: parentId
        ? new mongoose.Types.ObjectId(parentId)
        : null,

      level,

      isActive: true,
    };

    result.push(category);

    if (node.children?.length) {
      result.push(
        ...flattenCategories(
          node.children,
          node.id,
          level + 1
        )
      );
    }
  }

  return result;
};

// ======================================================
// VALIDATE SEED DATA
// ======================================================

const validateSeedData = (categories) => {
  const ids = new Set();
  const slugs = new Set();

  for (const category of categories) {
    const id = category._id.toString();

    if (!mongoose.isValidObjectId(id)) {
      throw new Error(`Invalid category ID: ${id}`);
    }

    if (ids.has(id)) {
      throw new Error(`Duplicate category ID: ${id}`);
    }

    if (slugs.has(category.slug)) {
      throw new Error(
        `Duplicate category slug: ${category.slug}`
      );
    }

    if (!category.image) {
      throw new Error(
        `Missing image for category: ${category.name}`
      );
    }

    ids.add(id);
    slugs.add(category.slug);
  }

  if (categories.length !== 47) {
    throw new Error(
      `Expected 47 categories, found ${categories.length}`
    );
  }
};

// ======================================================
// SEED CATEGORIES
// ======================================================


const seedCategories = async () => {
  try {
    const categories = flattenCategories(categoryTree);

    validateSeedData(categories);

    console.log(
      `Starting category seeder (${categories.length} categories)...`
    );

    let inserted = 0;
    let skipped = 0;

    for (const category of categories) {
      const result = await Category.updateOne(
        { _id: category._id },
        {
          $setOnInsert: {
            _id: category._id,
            name: category.name,
            slug: category.slug,
            image: category.image,
            description: category.description,
            parent: category.parent,
            level: category.level,
            isActive: true,
          },
        },
        {
          upsert: true,
          runValidators: true,
        }
      );

      if (result.upsertedCount > 0) {
        inserted++;
        console.log(`+ Created: ${category.name}`);
      } else {
        skipped++;
        console.log(`= Skipped (already exists): ${category.name}`);
      }
    }

    console.log("\n================================");
    console.log("Category seeder completed!");
    console.log("================================");
    console.log(`Total: ${categories.length}`);
    console.log(`Inserted: ${inserted}`);
    console.log(`Skipped: ${skipped}`);
    console.log("================================");
  } catch (error) {
    console.error("Category seeder failed:", error);
    throw error;
  }
};


// ======================================================
// RUN DIRECTLY
// ======================================================

if (require.main === module) {
  (async () => {
    try {
      await connectDB();

      await seedCategories();

      await mongoose.disconnect();

      process.exit(0);
    } catch (error) {
      console.error(error);

      await mongoose.disconnect().catch(() => {});

      process.exit(1);
    }
  })();
}
