
const mongoose = require("mongoose");
const { Product } = require("../models/Product");
const { Category } = require("../models/Category");
const { User } = require("../models/User");
const inventoryService = require("../utils/inventoryService");
require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});
// ============================================================
// CONFIG
// ============================================================

const APPROVED_SELLER_ID = "6afb253cb669c3195b023c45";

const CATEGORY_IDS = {
  electronics: "6a392bdaf71d80816ab3bc0a",
  smartphones: "6a392d7ef71d80816ab3bc13",
  laptops: "6a392e16f71d80816ab3bc35",
  audio: "6a392e83f71d80816ab3bc36",
  wearables: "6a392ef2f71d80816ab3bc37",
  cameras: "6a392f3cf71d80816ab3bc38",

  fashion: "6a392c3af71d80816ab3bc0b",
  men: "6a393277f71d80816ab3bc5c",
  menTshirts: "6a393724f71d80816ab3bc94",
  menShirts: "6a39373ef71d80816ab3bc95",
  menShoes: "6a39376bf71d80816ab3bc96",
  women: "6a3932bbf71d80816ab3bc5d",
  dresses: "6a3937b7f71d80816ab3bc97",
  handbags: "6a3937cef71d80816ab3bc98",
  womenShoes: "6a3937e0f71d80816ab3bc99",
  jewelry: "6a39331ff71d80816ab3bc5e",
  kidsFashion: "6a39391bf71d80816ab3bcc2",

  home: "6a392c60f71d80816ab3bc0c",
  furniture: "6a393376f71d80816ab3bc5f",
  kitchen: "6a393397f71d80816ab3bc60",
  decor: "6a3933bcf71d80816ab3bc61",

  beauty: "6a392c8cf71d80816ab3bc0d",
  makeup: "6a3933e9f71d80816ab3bc62",
  skincare: "6a39341ff71d80816ab3bc63",
  fragrances: "6a393434f71d80816ab3bc64",

  sports: "6a392cadf71d80816ab3bc0e",
  fitness: "6a39348af71d80816ab3bc65",
  sportswear: "6a3934b7f71d80816ab3bc66",
  outdoors: "6a3938b9f71d80816ab3bc9a",

  grocery: "6a392cd5f71d80816ab3bc0f",
  beverages: "6a393534f71d80816ab3bc67",
  snacks: "6a39359ef71d80816ab3bc8d",
  packagedFood: "6a3935bcf71d80816ab3bc8e",

  baby: "6a392cf2f71d80816ab3bc10",
  babyGear: "6a39361ef71d80816ab3bc8f",
  toys: "6a393649f71d80816ab3bc90",

  books: "6a392d13f71d80816ab3bc11",
  englishBooks: "6a393662f71d80816ab3bc91",
  arabicBooks: "6a3936aef71d80816ab3bc92",
  office: "6a3936ccf71d80816ab3bc93",

  health: "6a3939d4f71d80816ab3bcc3",
  vitamins: "6a3a9d596e6289bad62c6a6b",
  medical: "6a3a9d9b6e6289bad62c6a6c",

  gaming: "6a3939fff71d80816ab3bcc4",
  consoles: "6a3a9c626e6289bad62c6a68",
  videoGames: "6a3a9cc66e6289bad62c6a69",
  gamingAccessories: "6a3a9cf56e6289bad62c6a6a",
};

// ============================================================
// IMAGE URLS
// Direct image URLs. Replace with your Cloudinary URLs later.
// ============================================================

const IMAGES = {
  phone: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9",
  laptop: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853",
  headphones: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
  watch: "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
  camera: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32",

  tshirt: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
  shirt: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c",
  shoes: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
  dress: "https://images.unsplash.com/photo-1595777457583-95e059d581b8",
  handbag: "https://images.unsplash.com/photo-1584917865442-de89df76afd3",
  jewelry: "https://images.unsplash.com/photo-1611652022419-a9419f74343d",

  sofa: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
  kitchen: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f",
  decor: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0",

  makeup: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9",
  skincare: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b",
  perfume: "https://images.unsplash.com/photo-1541643600914-78b084683601",

  fitness: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48",
  sportswear: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c",
  outdoor: "https://images.unsplash.com/photo-1472396961693-142e6e269027",

  beverage: "https://images.unsplash.com/photo-1513558161293-cdaf765edfd4",
  snacks: "https://images.unsplash.com/photo-1621939514649-280e2aa9f5c0",
  food: "https://images.unsplash.com/photo-1547592180-85f173990554",

  baby: "https://images.unsplash.com/photo-1519689680058-324335c77eba",
  toys: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1",

  book: "https://images.unsplash.com/photo-1544947950-fa07a98d237f",
  stationery: "https://images.unsplash.com/photo-1455390582262-044cdead277a",

  health: "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8",
  medical: "https://images.unsplash.com/photo-1584982751601-97dcc096659c",

  gaming: "https://images.unsplash.com/photo-1593305841991-05c297ba4575",
  controller: "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08",
  console: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3",
};

// ============================================================
// PRODUCT FACTORY
// ============================================================

const createProduct = ({
  title,
  slug,
  description,
  category,
  subcategory = null,
  brand,
  price,
  comparePrice,
  stock = 20,
  image,
  tags = [],
  attributes = [],
  specifications = [],
  variants = [],
  isBestSeller = false,
  isPublished = true,
}) => ({
  seller: new mongoose.Types.ObjectId(APPROVED_SELLER_ID),
  title,
  slug,
  description,
  category: new mongoose.Types.ObjectId(category),
  subcategory: subcategory
    ? new mongoose.Types.ObjectId(subcategory)
    : null,
  brand,
  images: [
    {
      publicId: `seed-${slug}`,
      url: `${image}?auto=format&fit=crop&w=900&q=85`,
    },
  ],
  price,
  comparePrice,
  stock,
  lowStockThreshold: 5,
  reservedStock: 0,
  ratingAverage: 0,
  ratingCount: 0,
  sold: 0,
  salesCount: 0,
  isBestSeller,
  isPublished,
  isDeleted: false,
  attributes,
  variants,
  specifications,
  isDigital: false,
  isBundle: false,
  bundleProducts: [],
  tags,
  metaTitle: title,
  metaDescription: description.slice(0, 160),
});

// ============================================================
// PRODUCTS
// ============================================================

const products = [
  // ELECTRONICS
  createProduct({
    title: "Samsung Galaxy S24",
    slug: "samsung-galaxy-s24",
    description: "A powerful smartphone with a stunning display and advanced camera system.",
    category: CATEGORY_IDS.electronics,
    subcategory: CATEGORY_IDS.smartphones,
    brand: "Samsung",
    price: 32999,
    comparePrice: 35999,
    stock: 25,
    image: IMAGES.phone,
    tags: ["smartphone", "samsung", "android"],
    attributes: [{ name: "Color", values: ["Black", "Gray", "Violet"] }],
    specifications: [
      { name: "Display", value: "6.2 inches" },
      { name: "Storage", value: "256GB" },
      { name: "Operating System", value: "Android" },
    ],
    isBestSeller: true,
  }),

  createProduct({
    title: "Apple iPhone 15",
    slug: "apple-iphone-15",
    description: "Apple smartphone featuring a high-resolution camera and smooth performance.",
    category: CATEGORY_IDS.electronics,
    subcategory: CATEGORY_IDS.smartphones,
    brand: "Apple",
    price: 39999,
    stock: 15,
    image: IMAGES.phone,
    tags: ["iphone", "apple", "smartphone"],
    attributes: [{ name: "Storage", values: ["128GB", "256GB"] }],
  }),

  createProduct({
    title: "HP Pavilion Laptop",
    slug: "hp-pavilion-laptop",
    description: "A versatile laptop for productivity, studying, and everyday computing.",
    category: CATEGORY_IDS.electronics,
    subcategory: CATEGORY_IDS.laptops,
    brand: "HP",
    price: 28999,
    stock: 12,
    image: IMAGES.laptop,
    tags: ["laptop", "hp", "computer"],
    specifications: [
      { name: "RAM", value: "16GB" },
      { name: "Storage", value: "512GB SSD" },
      { name: "Display", value: "15.6 inches" },
    ],
  }),

  createProduct({
    title: "Sony Wireless Headphones",
    slug: "sony-wireless-headphones",
    description: "Comfortable wireless headphones designed for immersive everyday listening.",
    category: CATEGORY_IDS.electronics,
    subcategory: CATEGORY_IDS.audio,
    brand: "Sony",
    price: 4999,
    stock: 30,
    image: IMAGES.headphones,
    tags: ["headphones", "wireless", "audio"],
  }),

  createProduct({
    title: "Smart Fitness Watch",
    slug: "smart-fitness-watch",
    description: "A smart wearable for tracking activity and receiving everyday notifications.",
    category: CATEGORY_IDS.electronics,
    subcategory: CATEGORY_IDS.wearables,
    brand: "Amazfit",
    price: 3499,
    stock: 22,
    image: IMAGES.watch,
    tags: ["smartwatch", "fitness", "wearable"],
  }),

  // FASHION
  createProduct({
    title: "Classic Cotton T-Shirt",
    slug: "classic-cotton-tshirt",
    description: "A comfortable everyday cotton T-shirt with a clean and timeless design.",
    category: CATEGORY_IDS.men,
    subcategory: CATEGORY_IDS.menTshirts,
    brand: "BasicWear",
    price: 399,
    stock: 40,
    image: IMAGES.tshirt,
    tags: ["men", "tshirt", "cotton"],
    attributes: [
      { name: "Size", values: ["S", "M", "L", "XL"] },
      { name: "Color", values: ["Black", "White", "Navy"] },
    ],
    variants: [
      { sku: "CT-BLK-M", price: 399, stock: 15, combination: { Size: "M", Color: "Black" } },
      { sku: "CT-WHT-L", price: 399, stock: 15, combination: { Size: "L", Color: "White" } },
      { sku: "CT-NAV-XL", price: 449, stock: 10, combination: { Size: "XL", Color: "Navy" } },
    ],
  }),

  createProduct({
    title: "Men's Formal Shirt",
    slug: "mens-formal-shirt",
    description: "A smart formal shirt suitable for work, meetings, and special occasions.",
    category: CATEGORY_IDS.men,
    subcategory: CATEGORY_IDS.menShirts,
    brand: "UrbanLine",
    price: 899,
    stock: 35,
    image: IMAGES.shirt,
    tags: ["men", "shirt", "formal"],
    attributes: [{ name: "Size", values: ["M", "L", "XL"] }],
  }),

  createProduct({
    title: "Running Sneakers",
    slug: "running-sneakers",
    description: "Lightweight sneakers designed for comfortable everyday movement.",
    category: CATEGORY_IDS.men,
    subcategory: CATEGORY_IDS.menShoes,
    brand: "SportStep",
    price: 1599,
    stock: 28,
    image: IMAGES.shoes,
    tags: ["men", "shoes", "sneakers"],
    attributes: [{ name: "Size", values: ["40", "41", "42", "43", "44"] }],
  }),

  createProduct({
    title: "Elegant Women's Dress",
    slug: "elegant-womens-dress",
    description: "An elegant dress with a flattering silhouette for everyday and evening wear.",
    category: CATEGORY_IDS.women,
    subcategory: CATEGORY_IDS.dresses,
    brand: "Elegance",
    price: 1899,
    stock: 18,
    image: IMAGES.dress,
    tags: ["women", "dress", "fashion"],
    attributes: [{ name: "Size", values: ["S", "M", "L"] }],
  }),

  createProduct({
    title: "Minimal Leather Handbag",
    slug: "minimal-leather-handbag",
    description: "A versatile handbag with a minimalist design and practical storage space.",
    category: CATEGORY_IDS.women,
    subcategory: CATEGORY_IDS.handbags,
    brand: "Luxe",
    price: 2499,
    stock: 14,
    image: IMAGES.handbag,
    tags: ["women", "handbag", "accessories"],
  }),

  // HOME & KITCHEN
  createProduct({
    title: "Modern Living Room Sofa",
    slug: "modern-living-room-sofa",
    description: "A modern sofa designed to bring comfort and style to your living room.",
    category: CATEGORY_IDS.home,
    subcategory: CATEGORY_IDS.furniture,
    brand: "HomeStyle",
    price: 18999,
    stock: 5,
    image: IMAGES.sofa,
    tags: ["sofa", "furniture", "living-room"],
  }),

  createProduct({
    title: "Non-Stick Cookware Set",
    slug: "non-stick-cookware-set",
    description: "A practical cookware set for preparing everyday meals with ease.",
    category: CATEGORY_IDS.home,
    subcategory: CATEGORY_IDS.kitchen,
    brand: "KitchenPro",
    price: 3299,
    stock: 20,
    image: IMAGES.kitchen,
    tags: ["kitchen", "cookware", "cooking"],
  }),

  createProduct({
    title: "Decorative Table Lamp",
    slug: "decorative-table-lamp",
    description: "A stylish table lamp that adds warm lighting to your interior space.",
    category: CATEGORY_IDS.home,
    subcategory: CATEGORY_IDS.decor,
    brand: "GlowHome",
    price: 1199,
    stock: 17,
    image: IMAGES.decor,
    tags: ["home", "lamp", "decor"],
  }),

  // BEAUTY
  createProduct({
    title: "Everyday Makeup Kit",
    slug: "everyday-makeup-kit",
    description: "A curated makeup kit for creating simple everyday looks.",
    category: CATEGORY_IDS.beauty,
    subcategory: CATEGORY_IDS.makeup,
    brand: "BeautyBox",
    price: 1499,
    stock: 25,
    image: IMAGES.makeup,
    tags: ["makeup", "beauty", "cosmetics"],
  }),

  createProduct({
    title: "Hydrating Face Cream",
    slug: "hydrating-face-cream",
    description: "A daily moisturizing face cream designed for a soft and hydrated feel.",
    category: CATEGORY_IDS.beauty,
    subcategory: CATEGORY_IDS.skincare,
    brand: "SkinCare",
    price: 599,
    stock: 40,
    image: IMAGES.skincare,
    tags: ["skincare", "moisturizer", "beauty"],
  }),

  createProduct({
    title: "Classic Eau de Parfum",
    slug: "classic-eau-de-parfum",
    description: "A refined fragrance with a distinctive scent for everyday use.",
    category: CATEGORY_IDS.beauty,
    subcategory: CATEGORY_IDS.fragrances,
    brand: "Essence",
    price: 2199,
    stock: 16,
    image: IMAGES.perfume,
    tags: ["perfume", "fragrance", "beauty"],
  }),

  // SPORTS
  createProduct({
    title: "Adjustable Dumbbell Set",
    slug: "adjustable-dumbbell-set",
    description: "A versatile dumbbell set for strength training at home.",
    category: CATEGORY_IDS.sports,
    subcategory: CATEGORY_IDS.fitness,
    brand: "FitGear",
    price: 2799,
    stock: 12,
    image: IMAGES.fitness,
    tags: ["fitness", "gym", "dumbbells"],
  }),

  createProduct({
    title: "Performance Sports T-Shirt",
    slug: "performance-sports-tshirt",
    description: "A lightweight sports T-shirt made for comfortable training sessions.",
    category: CATEGORY_IDS.sports,
    subcategory: CATEGORY_IDS.sportswear,
    brand: "Active",
    price: 699,
    stock: 35,
    image: IMAGES.sportswear,
    tags: ["sportswear", "training", "fitness"],
    attributes: [{ name: "Size", values: ["S", "M", "L", "XL"] }],
  }),

  createProduct({
    title: "Outdoor Camping Backpack",
    slug: "outdoor-camping-backpack",
    description: "A spacious backpack for day trips, hiking, and outdoor adventures.",
    category: CATEGORY_IDS.sports,
    subcategory: CATEGORY_IDS.outdoors,
    brand: "Trail",
    price: 1799,
    stock: 15,
    image: IMAGES.outdoor,
    tags: ["outdoor", "camping", "backpack"],
  }),

  // GROCERIES
  createProduct({
    title: "Premium Ground Coffee",
    slug: "premium-ground-coffee",
    description: "A rich ground coffee blend for a flavorful daily coffee experience.",
    category: CATEGORY_IDS.grocery,
    subcategory: CATEGORY_IDS.beverages,
    brand: "DailyBrew",
    price: 249,
    stock: 80,
    image: IMAGES.beverage,
    tags: ["coffee", "beverages", "grocery"],
  }),

  createProduct({
    title: "Mixed Snack Box",
    slug: "mixed-snack-box",
    description: "A selection of sweet and savory snacks for sharing and everyday enjoyment.",
    category: CATEGORY_IDS.grocery,
    subcategory: CATEGORY_IDS.snacks,
    brand: "SnackTime",
    price: 349,
    stock: 50,
    image: IMAGES.snacks,
    tags: ["snacks", "sweets", "grocery"],
  }),

  createProduct({
    title: "Packaged Pasta Bundle",
    slug: "packaged-pasta-bundle",
    description: "A convenient selection of packaged pasta for quick everyday meals.",
    category: CATEGORY_IDS.grocery,
    subcategory: CATEGORY_IDS.packagedFood,
    brand: "PastaHouse",
    price: 199,
    stock: 65,
    image: IMAGES.food,
    tags: ["pasta", "food", "grocery"],
  }),

  // BABY & TOYS
  createProduct({
    title: "Baby Essentials Bag",
    slug: "baby-essentials-bag",
    description: "A practical bag for organizing baby essentials while traveling.",
    category: CATEGORY_IDS.baby,
    subcategory: CATEGORY_IDS.babyGear,
    brand: "LittleSteps",
    price: 1299,
    stock: 14,
    image: IMAGES.baby,
    tags: ["baby", "bag", "baby-gear"],
  }),

  createProduct({
    title: "Building Blocks Toy Set",
    slug: "building-blocks-toy-set",
    description: "A colorful building blocks set that encourages creativity and imagination.",
    category: CATEGORY_IDS.baby,
    subcategory: CATEGORY_IDS.toys,
    brand: "PlayWorld",
    price: 499,
    stock: 30,
    image: IMAGES.toys,
    tags: ["toys", "games", "kids"],
  }),

  // BOOKS & STATIONERY
  createProduct({
    title: "The Art of Programming",
    slug: "the-art-of-programming",
    description: "An educational programming book for readers interested in software development.",
    category: CATEGORY_IDS.books,
    subcategory: CATEGORY_IDS.englishBooks,
    brand: "TechBooks",
    price: 699,
    stock: 20,
    image: IMAGES.book,
    tags: ["book", "programming", "english"],
  }),

  createProduct({
    title: "Arabic Literature Collection",
    slug: "arabic-literature-collection",
    description: "A collection of Arabic literary works for reading and personal libraries.",
    category: CATEGORY_IDS.books,
    subcategory: CATEGORY_IDS.arabicBooks,
    brand: "DarAlQalam",
    price: 549,
    stock: 18,
    image: IMAGES.book,
    tags: ["arabic", "books", "literature"],
  }),

  createProduct({
    title: "Premium Notebook Set",
    slug: "premium-notebook-set",
    description: "A set of notebooks for organizing notes, ideas, and daily tasks.",
    category: CATEGORY_IDS.books,
    subcategory: CATEGORY_IDS.office,
    brand: "NoteCraft",
    price: 299,
    stock: 45,
    image: IMAGES.stationery,
    tags: ["stationery", "notebook", "office"],
  }),

  // HEALTH & WELLNESS
  createProduct({
    title: "Daily Wellness Essentials",
    slug: "daily-wellness-essentials",
    description: "A wellness product collection for everyday personal care.",
    category: CATEGORY_IDS.health,
    subcategory: CATEGORY_IDS.vitamins,
    brand: "Wellness",
    price: 499,
    stock: 30,
    image: IMAGES.health,
    tags: ["wellness", "health"],
  }),

  createProduct({
    title: "Digital Thermometer",
    slug: "digital-thermometer",
    description: "A digital thermometer designed for convenient temperature measurement.",
    category: CATEGORY_IDS.health,
    subcategory: CATEGORY_IDS.medical,
    brand: "MediCare",
    price: 249,
    stock: 25,
    image: IMAGES.medical,
    tags: ["medical", "thermometer", "health"],
  }),

  // GAMING
  createProduct({
    title: "Gaming Console",
    slug: "gaming-console",
    description: "A modern gaming console for enjoying a wide range of video games.",
    category: CATEGORY_IDS.gaming,
    subcategory: CATEGORY_IDS.consoles,
    brand: "Sony",
    price: 24999,
    stock: 8,
    image: IMAGES.console,
    tags: ["gaming", "console"],
  }),

  createProduct({
    title: "Wireless Gaming Controller",
    slug: "wireless-gaming-controller",
    description: "A wireless controller designed for comfortable and responsive gameplay.",
    category: CATEGORY_IDS.gaming,
    subcategory: CATEGORY_IDS.gamingAccessories,
    brand: "GamePro",
    price: 2199,
    stock: 20,
    image: IMAGES.controller,
    tags: ["gaming", "controller", "accessories"],
  }),

  createProduct({
    title: "Adventure Video Game",
    slug: "adventure-video-game",
    description: "An adventure game offering an engaging single-player gaming experience.",
    category: CATEGORY_IDS.gaming,
    subcategory: CATEGORY_IDS.videoGames,
    brand: "GameStudio",
    price: 1599,
    stock: 15,
    image: IMAGES.gaming,
    tags: ["video-game", "gaming", "adventure"],
  }),
];

// ============================================================
// SEED FUNCTION
// ============================================================

const normalizeSku = (sku) => String(sku || "").trim().toUpperCase();

const getInventoryRecords = (seedProduct, persistedProduct) => {
  const seededStockBySku = new Map(
    (seedProduct.variants || []).map((variant) => [
      normalizeSku(variant.sku),
      variant.stock,
    ])
  );
  const variants = persistedProduct ? persistedProduct.variants : seedProduct.variants;
  if (variants?.length) {
    return variants.map((variant) => ({
      sku: variant.sku,
      quantity: seededStockBySku.has(normalizeSku(variant.sku))
        ? seededStockBySku.get(normalizeSku(variant.sku))
        : variant.stock,
      referenceType: "product_variant",
    }));
  }
  const sku = persistedProduct
    ? persistedProduct.sku || persistedProduct.slug
    : seedProduct.sku || seedProduct.slug;
  const quantity = persistedProduct
    ? (normalizeSku(sku) === normalizeSku(seedProduct.sku || seedProduct.slug)
      ? seedProduct.stock
      : persistedProduct.stock)
    : seedProduct.stock;
  return [{
    sku,
    quantity,
    referenceType: "product",
  }];
};

const validateSeedProducts = async (seedProducts = products) => {
  const slugs = new Set();
  const skus = new Set();

  if (!mongoose.isValidObjectId(APPROVED_SELLER_ID)) {
    throw new Error(`Invalid approved seller ID: ${APPROVED_SELLER_ID}`);
  }

  for (const product of seedProducts) {
    if (slugs.has(product.slug)) {
      throw new Error(`Duplicate product slug in seed data: ${product.slug}`);
    }
    slugs.add(product.slug);

    for (const id of [product.category, product.subcategory].filter(Boolean)) {
      if (!mongoose.isValidObjectId(id)) {
        throw new Error(`Invalid category reference for product "${product.slug}": ${id}`);
      }
    }

    for (const record of getInventoryRecords(product)) {
      const sku = normalizeSku(record.sku);
      if (!sku) {
        throw new Error(`Missing SKU for product "${product.slug}".`);
      }
      if (skus.has(sku)) {
        throw new Error(`Duplicate product or variant SKU in seed data: ${sku}`);
      }
      skus.add(sku);

      if (!Number.isSafeInteger(record.quantity) || record.quantity < 0) {
        throw new Error(`Invalid seed quantity for ${sku}: ${record.quantity}`);
      }
    }

    const candidate = new Product({
      ...product,
      seller: new mongoose.Types.ObjectId(APPROVED_SELLER_ID),
      inventoryMode: "seller-managed",
      warehouse: null,
      stock: 0,
      reservedStock: 0,
      variants: product.variants.map((variant) => ({ ...variant, stock: 0 })),
    });
    await candidate.validate();
  }
};

const validateSellerAndCategories = async (seedProducts = products) => {
  const seller = await User.findById(APPROVED_SELLER_ID)
    .select("_id role sellerStatus isBlocked isVerify");
  if (!seller) {
    throw new Error(`Approved seller ${APPROVED_SELLER_ID} does not exist.`);
  }
  if (
    seller.role !== "seller" ||
    seller.sellerStatus !== "approved" ||
    seller.isBlocked ||
    !seller.isVerify
  ) {
    throw new Error(
      `Seller ${APPROVED_SELLER_ID} is not eligible to sell (requires verified, unblocked, approved seller account).`
    );
  }

  const categoryIds = new Set();
  for (const product of seedProducts) {
    categoryIds.add(String(product.category));
    if (product.subcategory) categoryIds.add(String(product.subcategory));
  }
  const categories = await Category.find({
    _id: { $in: [...categoryIds].map((id) => new mongoose.Types.ObjectId(id)) },
  }).select("_id parent isActive");
  const categoriesById = new Map(
    categories.map((category) => [String(category._id), category])
  );

  for (const product of seedProducts) {
    const category = categoriesById.get(String(product.category));
    if (!category) {
      throw new Error(`Category ${product.category} for "${product.slug}" does not exist.`);
    }
    if (!category.isActive) {
      throw new Error(`Category ${product.category} for "${product.slug}" is inactive.`);
    }
    if (product.subcategory) {
      const subcategory = categoriesById.get(String(product.subcategory));
      if (!subcategory) {
        throw new Error(`Subcategory ${product.subcategory} for "${product.slug}" does not exist.`);
      }
      if (!subcategory.isActive) {
        throw new Error(`Subcategory ${product.subcategory} for "${product.slug}" is inactive.`);
      }
      if (!subcategory.parent || String(subcategory.parent) !== String(category._id)) {
        throw new Error(
          `Subcategory ${product.subcategory} is not a child of category ${product.category} for "${product.slug}".`
        );
      }
    }
  }
};

const supportsTransactions = () => {
  const topologyType = mongoose.connection.getClient()?.topology?.description?.type;
  return ["ReplicaSetWithPrimary", "Sharded", "LoadBalanced"].includes(topologyType);
};

const withSession = (query, session) => session ? query.session(session) : query;

const seedProduct = async (seedData, session, counts, transactional) => {
  const existingQuery = Product.findOne({ slug: seedData.slug });
  const existingProduct = await withSession(existingQuery, session);

  if (
    existingProduct &&
    String(existingProduct.seller) !== APPROVED_SELLER_ID
  ) {
    throw new Error(
      `Product slug "${seedData.slug}" is already owned by a different seller.`
    );
  }
  if (
    existingProduct?.inventoryMode &&
    existingProduct.inventoryMode !== "seller-managed"
  ) {
    throw new Error(
      `Product "${seedData.slug}" is warehouse-managed and cannot be converted by this seller inventory seeder.`
    );
  }

  const inventoryRecords = getInventoryRecords(seedData, existingProduct);
  for (const record of inventoryRecords) {
    const skuOwnerQuery = Product.findOne({
      $or: [
        { sku: record.sku },
        { "variants.sku": record.sku },
      ],
    });
    const skuOwner = await withSession(skuOwnerQuery, session);
    if (skuOwner && String(skuOwner._id) !== String(existingProduct?._id || "")) {
      throw new Error(`SKU "${record.sku}" already belongs to product "${skuOwner.slug}".`);
    }
  }

  let product = existingProduct;
  if (!product) {
    product = new Product({
      ...seedData,
      seller: new mongoose.Types.ObjectId(APPROVED_SELLER_ID),
      inventoryMode: "seller-managed",
      warehouse: null,
      stock: 0,
      reservedStock: 0,
      variants: seedData.variants.map((variant) => ({ ...variant, stock: 0 })),
    });
    await product.save(session ? { session } : undefined);
    counts.createdProducts += 1;
  } else {
    counts.existingProducts += 1;
  }

  for (const record of inventoryRecords) {
    const options = {
      seller: APPROVED_SELLER_ID,
      product: product._id,
      sku: record.sku,
      warehouse: null,
      session,
    };
    const initialStock = Number.isSafeInteger(record.quantity) && record.quantity >= 0
      ? record.quantity
      : 0;
    const inventory = await inventoryService.getSellerInventory(options);
    if (inventory && inventory.stockInitialized !== false) {
      counts.preservedInventories += 1;
      continue;
    }

    try {
      await inventoryService.initializeSellerInventory({
        ...options,
        quantity: initialStock,
        lowStockThreshold: Number(product.lowStockThreshold || seedData.lowStockThreshold || 0),
        actor: "system",
        reason: "PRODUCT_SEED_INITIALIZATION",
        referenceType: record.referenceType,
        referenceId: String(product._id),
      });
      counts.createdInventories += 1;
    } catch (error) {
      if (transactional || error.code !== 11000) throw error;

      const concurrentInventory = await inventoryService.getSellerInventory(options);
      if (!concurrentInventory || concurrentInventory.stockInitialized === false) throw error;
      counts.preservedInventories += 1;
    }
  }
  await inventoryService.syncSellerProductStock({
    seller: product.seller,
    product: product._id,
    session,
  });
};

const seedProducts = async ({ productCatalog = products } = {}) => {
  await validateSeedProducts(productCatalog);
  await validateSellerAndCategories(productCatalog);

  const transactional = supportsTransactions();
  const counts = {
    createdProducts: 0,
    existingProducts: 0,
    createdInventories: 0,
    preservedInventories: 0,
  };

  console.log(`Starting product seeder (${productCatalog.length} products)...`);
  for (const product of productCatalog) {
    const session = transactional ? await mongoose.startSession() : null;
    try {
      if (session) session.startTransaction();
      await seedProduct(product, session, counts, transactional);
      if (session) await session.commitTransaction();
    } catch (error) {
      if (session?.inTransaction()) await session.abortTransaction();
      throw new Error(`Failed to seed product "${product.slug}": ${error.message}`, {
        cause: error,
      });
    } finally {
      if (session) await session.endSession();
    }
  }

  console.log("Product seeder completed.");
  console.log(`Products in seed file: ${productCatalog.length}`);
  console.log(`Inserted: ${counts.createdProducts}`);
  console.log(`Existing products preserved: ${counts.existingProducts}`);
  console.log(`Inventory records created: ${counts.createdInventories}`);
  console.log(`Existing inventory records preserved: ${counts.preservedInventories}`);
  return counts;
};

if (require.main === module) {
  const connectDB = require("../config/db");

  const runSeeder = async () => {
    try {
      await connectDB();
      await seedProducts();
    } catch (error) {
      console.error(error);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
    }
  };

  runSeeder();
}

module.exports = {
  seedProducts,
  validateSeedProducts,
  validateSellerAndCategories,
  getInventoryRecords,
  products,
};