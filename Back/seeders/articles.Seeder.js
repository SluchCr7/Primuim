
const mongoose = require("mongoose");
const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

const connectDB = require("../config/db");
const { Article } = require("../models/Article");
const cloudinary = require("../config/cloudUplaod");

// Users used as article authors and commenters.
const users = [
  new mongoose.Types.ObjectId("6af9a75c3431758c5021de54"),
  new mongoose.Types.ObjectId("6a3a6caa3f50534a6356a3ad"),
  new mongoose.Types.ObjectId("6a3a5f5dc47d720a8a7c2b26"),
  new mongoose.Types.ObjectId("6a395eb437e74f8cd357d9c4"),
];

// Article cover images.
const articleImages = {
  ai: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=85",

  javascript:
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=85",

  lifestyle:
    "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=85",

  finance:
    "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=85",

  remoteWork:
    "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=85",

  security:
    "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=1200&q=85",

  productivity:
    "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=1200&q=85",

  business:
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=85",
};

// Article data.
const articlesData = [
  {
    title: "The Future of Artificial Intelligence in Everyday Life",

    subtitle:
      "How AI is quietly transforming the way we work, communicate, and make decisions.",

    coverImageUrl: articleImages.ai,

    content: `
Artificial Intelligence is no longer a concept limited to science fiction or research laboratories. It has become part of our everyday lives, influencing how we communicate, work, learn, and interact with technology.

From personalized recommendations to intelligent virtual assistants, AI-powered systems are helping people complete tasks faster and make better-informed decisions.

One of the most significant changes is happening in the workplace. AI tools can automate repetitive tasks, analyze large amounts of information, and assist professionals in solving complex problems. This allows people to focus more on creativity, strategy, and decision-making.

Education is another area experiencing major improvements. Intelligent learning platforms can adapt to individual students, identify knowledge gaps, and recommend personalized learning materials.

However, the rapid growth of AI also introduces important challenges. Privacy, data security, misinformation, and job displacement are concerns that require responsible development and regulation.

The future of artificial intelligence will not depend only on how powerful these systems become, but also on how thoughtfully society chooses to use them.

Ultimately, AI should be viewed as a tool that enhances human capabilities rather than completely replacing human judgment and creativity.
    `.trim(),

    author: users[0],
    authorName: "Ahmed",

    category: "Technology",

    tags: [
      "Artificial Intelligence",
      "Technology",
      "Future",
      "Innovation",
    ],

    status: "approved",
    views: 1240,
    isFeatured: true,

    metaTitle: "The Future of AI in Everyday Life",

    metaDescription:
      "Discover how artificial intelligence is transforming workplaces, education, communication, and everyday experiences.",

    keywords: [
      "AI",
      "Artificial Intelligence",
      "Future Technology",
    ],

    canonicalUrl: "",

    comments: [
      {
        user: users[1],
        username: "Sarah",
        profilePhoto: "",
        text: "AI is changing things faster than most people realize. Great article!",
        createdAt: new Date("2026-10-12"),
      },
      {
        user: users[2],
        username: "Omar",
        profilePhoto: "",
        text: "The point about responsible AI development is especially important.",
        createdAt: new Date("2026-10-13"),

        reply: {
          text: "Absolutely! Responsible development should always come first.",
          createdAt: new Date("2026-10-13"),
        },
      },
    ],

    likes: [users[1], users[2]],
  },

  {
    title: "Why Learning JavaScript Is Still Worth It",

    subtitle:
      "A practical look at why JavaScript remains one of the most valuable programming languages.",

    coverImageUrl: articleImages.javascript,

    content: `
JavaScript has been one of the most influential programming languages in web development for decades. Despite the emergence of many new technologies, it continues to play a central role in building modern applications.

One of JavaScript's greatest strengths is its versatility. Developers can use it to build interactive websites, server-side applications, mobile applications, and even desktop software.

With frameworks and libraries such as React, Next.js, and Node.js, JavaScript developers can work across different layers of an application using a familiar language.

Another reason to learn JavaScript is its ecosystem. The npm registry contains thousands of packages that help developers solve common problems without building everything from scratch.

However, becoming a good JavaScript developer requires more than memorizing syntax. Understanding asynchronous programming, closures, the event loop, data structures, and software architecture is essential.

Beginners should focus on building projects, reading documentation, debugging problems, and understanding why their code works.

JavaScript remains a valuable skill because the web continues to evolve, and developers who understand its fundamentals can adapt to new tools and frameworks more easily.
    `.trim(),

    author: users[1],
    authorName: "Sarah",

    category: "Programming",

    tags: [
      "JavaScript",
      "Web Development",
      "React",
      "Programming",
    ],

    status: "approved",
    views: 890,
    isFeatured: true,

    metaTitle: "Why JavaScript Is Worth Learning",

    metaDescription:
      "Explore why JavaScript remains essential for modern web development and what developers should focus on learning.",

    keywords: [
      "JavaScript",
      "Learn JavaScript",
      "Web Development",
    ],

    comments: [
      {
        user: users[0],
        username: "Ahmed",
        profilePhoto: "",
        text: "Understanding fundamentals makes a huge difference.",
      },
    ],

    likes: [users[0], users[2], users[3]],
  },

  {
    title: "Building Better Habits Through Small Daily Changes",

    subtitle:
      "Why consistent small actions can create meaningful long-term improvements.",

    coverImageUrl: articleImages.lifestyle,

    content: `
Building better habits does not necessarily require dramatic lifestyle changes. In many cases, the smallest actions are the easiest to maintain and can produce the most meaningful results over time.

People often approach personal development with ambitious goals. They decide to exercise every day, read several books each month, or completely change their routines. While these goals can be motivating, they may also become difficult to sustain.

A more effective approach is to start small. Reading five pages every day, walking for ten minutes, or spending fifteen minutes learning a new skill can create a foundation for long-term progress.

Consistency is more important than intensity. A small habit repeated regularly is often more valuable than an ambitious routine followed for only a few days.

It is also important to make good habits easier to perform. Preparing your environment, removing distractions, and connecting new behaviors to existing routines can improve consistency.

Progress should be measured over time rather than judged by individual days. Missing one day does not mean failure. What matters is returning to the routine.

Meaningful change is rarely the result of one extraordinary decision. More often, it comes from ordinary actions repeated with intention.
    `.trim(),

    author: users[2],
    authorName: "Omar",

    category: "Lifestyle",

    tags: [
      "Habits",
      "Personal Growth",
      "Productivity",
      "Lifestyle",
    ],

    status: "approved",
    views: 670,

    metaTitle: "Building Better Daily Habits",

    metaDescription:
      "Learn how small daily actions, consistency, and simple routines can help you build better habits.",

    keywords: [
      "Daily Habits",
      "Personal Development",
      "Consistency",
    ],

    comments: [],

    likes: [users[0], users[3]],
  },

  {
    title: "The Importance of Financial Literacy for Young Adults",

    subtitle:
      "Understanding money management before making important financial decisions.",

    coverImageUrl: articleImages.finance,

    content: `
Financial literacy is an essential life skill, particularly for young adults who are beginning to manage their own income and expenses.

Understanding how money works can help people make better decisions, avoid unnecessary debt, and build a more stable financial future.

The first step toward financial awareness is understanding where money goes. Tracking monthly income and expenses helps identify spending patterns and areas where savings are possible.

Creating a realistic budget is another important practice. A budget does not mean eliminating everything enjoyable. Instead, it provides a framework for balancing essential expenses, personal priorities, and future goals.

Young adults should also understand the basics of saving, emergency funds, interest rates, and responsible borrowing.

Financial decisions should be based on research and realistic expectations rather than social pressure or promises of quick returns.

Developing good financial habits early can make a significant difference over time. Even small amounts saved consistently can contribute to greater financial security.

Financial literacy is not about becoming wealthy overnight. It is about gaining the knowledge and confidence needed to make informed decisions.
    `.trim(),

    author: users[3],
    authorName: "Mohamed",

    category: "Business",

    tags: [
      "Finance",
      "Money Management",
      "Education",
      "Young Adults",
    ],

    status: "approved",
    views: 530,

    metaTitle: "Financial Literacy for Young Adults",

    metaDescription:
      "Discover essential money management skills, budgeting strategies, and financial habits for young adults.",

    keywords: [
      "Financial Literacy",
      "Budgeting",
      "Money Management",
    ],

    comments: [
      {
        user: users[1],
        username: "Sarah",
        profilePhoto: "",
        text: "Financial education should definitely start earlier.",
      },
    ],

    likes: [users[0], users[1]],
  },

  {
    title: "Remote Work: Opportunities and Challenges",

    subtitle:
      "How working remotely is changing modern careers and workplace culture.",

    coverImageUrl: articleImages.remoteWork,

    content: `
Remote work has become an important part of the modern professional landscape. Advances in communication technology have made it possible for people to collaborate with teams located in different cities and countries.

One of the biggest advantages of remote work is flexibility. Employees can often organize their schedules more effectively and avoid long daily commutes.

Remote opportunities also allow companies to access a wider talent pool, giving professionals more options regardless of their geographical location.

However, remote work introduces challenges that should not be ignored. Communication can become difficult without clear processes, and employees may struggle to maintain a healthy boundary between professional and personal life.

Successful remote teams depend on trust, accountability, effective documentation, and clear expectations.

For individuals, developing communication skills and learning how to manage time independently are essential.

Remote work is not simply about working from home. It requires a different approach to collaboration, organization, and professional responsibility.
    `.trim(),

    author: users[0],
    authorName: "Ahmed",

    category: "Career",

    tags: [
      "Remote Work",
      "Career",
      "Workplace",
      "Productivity",
    ],

    status: "approved",
    views: 420,

    metaTitle: "Remote Work Opportunities and Challenges",

    metaDescription:
      "Explore the benefits and challenges of remote work and discover what makes distributed teams successful.",

    keywords: [
      "Remote Work",
      "Work From Home",
      "Career Development",
    ],

    comments: [],

    likes: [users[2], users[3]],
  },

  {
    title: "Understanding the Basics of Web Application Security",

    subtitle:
      "Essential security practices every web developer should understand.",

    coverImageUrl: articleImages.security,

    content: `
Web application security is an important responsibility for developers. A functional application is not necessarily a secure application, and overlooking security can expose users and businesses to serious risks.

One of the first principles of secure development is never trusting user input. Data received from forms, query parameters, headers, and external services should always be validated.

Authentication and authorization are also fundamental concepts. Authentication identifies who a user is, while authorization determines what that user is allowed to do.

Passwords should never be stored as plain text. Developers should use established password hashing algorithms such as bcrypt or Argon2.

Applications should also protect sensitive authentication tokens, configure secure cookies correctly, and use HTTPS in production environments.

Other important practices include rate limiting, secure HTTP headers, proper error handling, dependency updates, and protecting against common vulnerabilities such as injection attacks and cross-site scripting.

Security should not be treated as a final step before deployment. It should be considered throughout the entire development process.
    `.trim(),

    author: users[1],
    authorName: "Sarah",

    category: "Technology",

    tags: [
      "Web Security",
      "Backend",
      "Node.js",
      "Authentication",
    ],

    status: "pending",
    views: 0,

    metaTitle: "Web Application Security Basics",

    metaDescription:
      "Learn essential web security concepts including authentication, password hashing, validation, and secure cookies.",

    keywords: [
      "Web Security",
      "Application Security",
      "Backend Security",
    ],

    comments: [],

    likes: [],
  },

  {
    title: "How to Stay Productive Without Burning Out",

    subtitle:
      "A healthier approach to managing your time, energy, and responsibilities.",

    coverImageUrl: articleImages.productivity,

    content: `
Productivity is often associated with completing as many tasks as possible. However, constantly working without sufficient rest can eventually reduce performance and lead to burnout.

A healthier approach begins with understanding priorities. Not every task deserves the same amount of attention, and identifying the most important responsibilities can make daily planning more effective.

Breaking large projects into smaller tasks also makes progress easier to track. Instead of focusing on the entire project, concentrate on completing one manageable step at a time.

Taking breaks is equally important. Short periods of rest can improve concentration and help maintain energy throughout the day.

It is also useful to establish clear boundaries between work and personal time. Constantly checking messages or thinking about unfinished tasks can make it difficult to recover mentally.

Productivity should be measured by meaningful progress rather than the number of hours spent working.

A sustainable routine allows people to achieve their goals while protecting their health and personal well-being.
    `.trim(),

    author: users[2],
    authorName: "Omar",

    category: "Productivity",

    tags: [
      "Productivity",
      "Time Management",
      "Work Life Balance",
    ],

    status: "draft",
    views: 0,

    metaTitle: "Stay Productive Without Burning Out",

    metaDescription:
      "Discover practical ways to manage priorities, improve focus, and maintain a healthy work-life balance.",

    keywords: [
      "Productivity",
      "Burnout",
      "Time Management",
    ],

    comments: [],

    likes: [],
  },

  {
    title: "Why Every Business Needs a Strong Digital Presence",

    subtitle:
      "The role of websites and digital platforms in building customer trust.",

    coverImageUrl: articleImages.business,

    content: `
A strong digital presence has become essential for businesses of all sizes. Customers increasingly use the internet to discover products, compare services, and evaluate companies before making purchasing decisions.

A professional website gives a business control over how it presents its identity, products, and services. Unlike social media platforms, a website provides a dedicated space where companies can organize information and create a consistent customer experience.

Search engine optimization can also help businesses reach people who are actively looking for their products or services.

Social media platforms play an important role as well. They allow companies to communicate with customers, share updates, and build long-term relationships.

However, digital presence is not simply about being active on every platform. Businesses should focus on choosing channels that match their audience and objectives.

Consistent branding, useful content, responsive design, and reliable customer support all contribute to building trust.

A thoughtful digital strategy can help businesses increase visibility, strengthen relationships, and create new opportunities for sustainable growth.
    `.trim(),

    author: users[3],
    authorName: "Mohamed",

    category: "Business",

    tags: [
      "Digital Marketing",
      "Business",
      "Web Development",
      "Branding",
    ],

    status: "pending",
    views: 0,

    metaTitle: "Why Businesses Need a Digital Presence",

    metaDescription:
      "Understand how websites, SEO, and social media help businesses build trust and reach more customers.",

    keywords: [
      "Digital Presence",
      "Digital Marketing",
      "Business Growth",
    ],

    comments: [],

    likes: [],
  },
];

// Upload one article cover image to Cloudinary.
const uploadArticleImage = async (imageUrl, articleTitle) => {
  const uploadedImage = await cloudinary.uploader.upload(imageUrl, {
    folder: "articles",
    resource_type: "image",

    transformation: [
      {
        width: 1200,
        height: 800,
        crop: "fill",
        gravity: "auto",
        quality: "auto",
        fetch_format: "auto",
      },
    ],

    context: {
      caption: articleTitle,
    },
  });

  return {
    publicId: uploadedImage.public_id,
    url: uploadedImage.secure_url,
  };
};

// Delete uploaded images if database insertion fails.
const deleteCloudinaryImages = async (publicIds) => {
  if (!publicIds.length) return;

  await Promise.allSettled(
    publicIds.map((publicId) =>
      cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
      })
    )
  );
};

// Main seeder.
const seedArticles = async () => {
  const uploadedPublicIds = [];

  try {
    await connectDB();

    console.log("Starting article seeder...\n");

    // Find previous seeded articles.
    const existingArticles = await Article.find({
      title: {
        $in: articlesData.map((article) => article.title),
      },
    }).select("_id image.publicId");

    // Upload all article images.
    console.log("Uploading article images to Cloudinary...\n");

    const articlesWithImages = [];

    for (const article of articlesData) {
      console.log(`Uploading: ${article.title}`);

      const image = await uploadArticleImage(
        article.coverImageUrl,
        article.title
      );

      uploadedPublicIds.push(image.publicId);

      articlesWithImages.push({
        ...article,
        image,
      });

      console.log(`Uploaded successfully: ${image.publicId}\n`);
    }

    console.log("All article images uploaded successfully.\n");

    // Insert new articles first.
    // Existing articles remain untouched if insertion fails.
    let insertedArticles;

    try {
      insertedArticles = await Article.insertMany(
        articlesWithImages,
        { ordered: true }
      );
    } catch (error) {
      console.error("Database insertion failed.");

      await deleteCloudinaryImages(uploadedPublicIds);

      throw error;
    }

    console.log(
      `Successfully inserted ${insertedArticles.length} articles.\n`
    );

    // Remove previous seeded articles after successful insertion.
    const oldArticleIds = existingArticles.map(
      (article) => article._id
    );

    await Article.deleteMany({
      _id: {
        $in: oldArticleIds,
      },
    });

    // Remove previous Cloudinary images.
    const oldImageIds = existingArticles
      .map((article) => article.image?.publicId)
      .filter(Boolean);

    if (oldImageIds.length) {
      console.log("Cleaning up previous Cloudinary images...");

      await deleteCloudinaryImages(oldImageIds);
    }

    console.log("\n=================================");
    console.log("Article seeder completed!");
    console.log(`Articles inserted: ${insertedArticles.length}`);
    console.log(`Images uploaded: ${uploadedPublicIds.length}`);
    console.log("Cloudinary folder: articles");
    console.log("=================================\n");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("\nError seeding articles:", error);

    // Clean up newly uploaded images if insertion never completed.
    // If insertion succeeded, keep the images referenced by MongoDB.
    if (
      uploadedPublicIds.length &&
      error.code !== "SEED_INSERT_COMPLETED"
    ) {
      // Cleanup is handled specifically around insertMany.
    }

    await mongoose.connection.close().catch(() => {});

    process.exit(1);
  }
};

seedArticles();
