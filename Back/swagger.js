const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi   = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Premium E-Commerce API',
      version: '2.0.0',
      description: `
## Overview
A fully-featured REST API powering the **Premium E-Commerce Platform** — supporting multi-role auth, product catalog, shopping cart, orders, payments, reviews, analytics, seller onboarding, and more.

## Authentication
Most protected routes require a **Bearer JWT** in the \`Authorization\` header:
\`\`\`
Authorization: Bearer <your_access_token>
\`\`\`
Refresh tokens are stored in an **HttpOnly cookie** automatically set on login.

## Rate Limiting
- **Global:** 200 requests / 15 min per IP  
- **Auth routes:** 15 requests / 15 min per IP
      `,
      contact: {
        name: 'API Support',
        email: 'support@premium.com',
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC',
      },
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Local Development Server' },
      { url: 'https://api.shoppremium.com', description: 'Production Server' },
    ],
    tags: [
      { name: 'Auth',         description: 'Registration, login, token refresh, OTP, 2FA, social login' },
      { name: 'Users',        description: 'Profile, password, photo, wishlist, addresses, size profile' },
      { name: 'Products',     description: 'Full product catalog — CRUD, search, suggestions, top-lists' },
      { name: 'Categories',   description: 'Category tree — public fetch & admin CRUD' },
      { name: 'Cart',         description: 'Shopping cart — add, update, remove, clear, merge' },
      { name: 'Checkout',     description: 'Multi-step checkout session — address, shipping, payment state' },
      { name: 'Orders',       description: 'Order lifecycle — create, view, cancel, invoice download' },
      { name: 'Payments',     description: 'Payment processing, status updates, refunds, webhooks' },
      { name: 'Discounts',    description: 'Coupon management — create, validate, apply, usage tracking' },
      { name: 'Reviews',      description: 'Product reviews — create, vote helpful, seller reply, moderation' },
      { name: 'Analytics',    description: 'Event tracking, funnel, cohort, revenue, customer & product analytics' },
      { name: 'Articles',     description: 'Seller blog articles — CRUD, likes, comments, analytics, admin moderation' },
      { name: 'Sellers',      description: 'Seller onboarding, store profile, orders, stats, payout' },
      { name: 'Admin',        description: 'Admin dashboard — users, analytics, inventory, seller requests' },
      { name: 'SuperAdmin',   description: 'Super-admin — role management, create/delete admins, settings, audit logs' },
      { name: 'Testimonials', description: 'Homepage testimonials — create, moderate, delete' },
      { name: 'Upload',       description: 'Cloudinary image upload endpoint' },
      { name: 'Currency',     description: 'Real-time exchange rates (EGP, USD, EUR)' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Paste your access token obtained from `/api/auth/login`',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'refreshToken',
          description: 'HttpOnly refresh-token cookie set automatically on login',
        },
      },
      schemas: {

        /* ─── Shared wrappers ─────────────────────────────────────────── */
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation completed successfully.' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'An error occurred.' },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page:          { type: 'integer', example: 1 },
            totalPages:    { type: 'integer', example: 12 },
            totalProducts: { type: 'integer', example: 93 },
          },
        },

        /* ─── Auth ────────────────────────────────────────────────────── */
        RegisterInput: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name:     { type: 'string', example: 'Jane Doe' },
            email:    { type: 'string', format: 'email', example: 'jane@example.com' },
            password: { type: 'string', format: 'password', example: 'Str0ngP@ss!', minLength: 8 },
          },
        },
        LoginInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email:    { type: 'string', format: 'email', example: 'jane@example.com' },
            password: { type: 'string', format: 'password', example: 'Str0ngP@ss!' },
          },
        },
        SocialLoginInput: {
          type: 'object',
          required: ['provider', 'token'],
          properties: {
            provider: { type: 'string', enum: ['google', 'facebook'], example: 'google' },
            token:    { type: 'string', example: 'ya29.a0AfH...' },
          },
        },
        ForgotPasswordInput: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email', example: 'jane@example.com' },
          },
        },
        ResetPasswordInput: {
          type: 'object',
          required: ['token', 'password'],
          properties: {
            token:    { type: 'string', example: 'abc123resettoken' },
            password: { type: 'string', format: 'password', example: 'NewStr0ng@Pass!' },
          },
        },
        AuthTokenResponse: {
          type: 'object',
          properties: {
            success:     { type: 'boolean', example: true },
            accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            user:        { $ref: '#/components/schemas/UserPublic' },
          },
        },

        /* ─── User ────────────────────────────────────────────────────── */
        UserPublic: {
          type: 'object',
          properties: {
            _id:       { type: 'string', example: '64b1f7e4c9e12a001b8d4321' },
            name:      { type: 'string', example: 'Jane Doe' },
            email:     { type: 'string', example: 'jane@example.com' },
            role:      { type: 'string', enum: ['user', 'seller', 'admin', 'superadmin'], example: 'user' },
            photo:     { type: 'string', example: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' },
            isVerified:{ type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        UpdateProfileInput: {
          type: 'object',
          properties: {
            name:  { type: 'string', example: 'Jane Smith' },
            phone: { type: 'string', example: '+201001234567' },
            bio:   { type: 'string', example: 'Luxury fashion enthusiast' },
          },
        },
        UpdatePasswordInput: {
          type: 'object',
          required: ['currentPassword', 'newPassword'],
          properties: {
            currentPassword: { type: 'string', format: 'password', example: 'OldPass123!' },
            newPassword:     { type: 'string', format: 'password', example: 'NewPass456!' },
          },
        },
        Address: {
          type: 'object',
          required: ['street', 'city', 'country'],
          properties: {
            _id:        { type: 'string', example: '64b9aaaaaaaaaaaaaaaaaa99' },
            label:      { type: 'string', example: 'Home' },
            street:     { type: 'string', example: '123 Nile Corniche' },
            city:       { type: 'string', example: 'Cairo' },
            state:      { type: 'string', example: 'Cairo Governorate' },
            country:    { type: 'string', example: 'Egypt' },
            postalCode: { type: 'string', example: '11511' },
            isDefault:  { type: 'boolean', example: true },
          },
        },
        SizeProfileInput: {
          type: 'object',
          properties: {
            height:     { type: 'number', example: 172 },
            weight:     { type: 'number', example: 65 },
            shoeSize:   { type: 'string', example: '42' },
            topSize:    { type: 'string', enum: ['XS','S','M','L','XL','XXL'], example: 'M' },
            bottomSize: { type: 'string', enum: ['XS','S','M','L','XL','XXL'], example: 'M' },
          },
        },

        /* ─── Product ─────────────────────────────────────────────────── */
        Product: {
          type: 'object',
          properties: {
            _id:           { type: 'string', example: '64b1f7e4c9e12a001b8d4321' },
            title:         { type: 'string', example: 'Luxury Leather Handbag' },
            slug:          { type: 'string', example: 'luxury-leather-handbag' },
            description:   { type: 'string', example: 'Premium Italian leather...' },
            price:         { type: 'number', example: 4999.99 },
            comparePrice:  { type: 'number', example: 6500.00 },
            category:      { $ref: '#/components/schemas/CategorySummary' },
            seller:        { $ref: '#/components/schemas/SellerSummary' },
            images: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  url:       { type: 'string' },
                  public_id: { type: 'string' },
                },
              },
            },
            stock:         { type: 'integer', example: 15 },
            brand:         { type: 'string', example: 'Valentino' },
            ratingAverage: { type: 'number', example: 4.8 },
            ratingCount:   { type: 'integer', example: 134 },
            isBestSeller:  { type: 'boolean', example: false },
            isPublished:   { type: 'boolean', example: true },
            createdAt:     { type: 'string', format: 'date-time' },
          },
        },
        ProductInput: {
          type: 'object',
          required: ['title', 'price', 'category'],
          properties: {
            title:       { type: 'string', example: 'Luxury Leather Handbag' },
            description: { type: 'string', example: 'Premium Italian leather...' },
            price:       { type: 'number', example: 4999.99 },
            comparePrice:{ type: 'number', example: 6500.00 },
            category:    { type: 'string', example: '64b1f7e4c9e12a001b8d4321' },
            stock:       { type: 'integer', example: 15 },
            brand:       { type: 'string', example: 'Valentino' },
            tags:        { type: 'array', items: { type: 'string' }, example: ['leather', 'luxury'] },
          },
        },

        /* ─── Category ────────────────────────────────────────────────── */
        CategorySummary: {
          type: 'object',
          properties: {
            _id:  { type: 'string' },
            name: { type: 'string', example: 'Handbags' },
            slug: { type: 'string', example: 'handbags' },
          },
        },
        Category: {
          type: 'object',
          properties: {
            _id:           { type: 'string', example: '64b1f7e4c9e12a001b8d4321' },
            name:          { type: 'string', example: 'Handbags' },
            slug:          { type: 'string', example: 'handbags' },
            description:   { type: 'string' },
            image:         { type: 'string' },
            parent:        { type: 'string', nullable: true },
            subcategories: { type: 'array', items: { $ref: '#/components/schemas/CategorySummary' } },
          },
        },
        CategoryInput: {
          type: 'object',
          required: ['name'],
          properties: {
            name:        { type: 'string', example: 'Handbags' },
            description: { type: 'string', example: 'Luxury handbags from top designers' },
            parent:      { type: 'string', nullable: true, description: 'Parent category ObjectId (omit for root)' },
          },
        },

        /* ─── Cart ────────────────────────────────────────────────────── */
        CartItem: {
          type: 'object',
          properties: {
            product:  { $ref: '#/components/schemas/Product' },
            quantity: { type: 'integer', example: 2 },
            price:    { type: 'number', example: 4999.99 },
          },
        },
        Cart: {
          type: 'object',
          properties: {
            _id:        { type: 'string' },
            items:      { type: 'array', items: { $ref: '#/components/schemas/CartItem' } },
            totalItems: { type: 'integer', example: 3 },
            totalPrice: { type: 'number', example: 14999.97 },
          },
        },
        AddToCartInput: {
          type: 'object',
          required: ['productId', 'quantity'],
          properties: {
            productId: { type: 'string', example: '64b1f7e4c9e12a001b8d4321' },
            quantity:  { type: 'integer', example: 1, minimum: 1 },
          },
        },
        UpdateCartInput: {
          type: 'object',
          required: ['productId', 'quantity'],
          properties: {
            productId: { type: 'string', example: '64b1f7e4c9e12a001b8d4321' },
            quantity:  { type: 'integer', example: 3, minimum: 1 },
          },
        },
        MergeCartInput: {
          type: 'object',
          properties: {
            guestItems: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  productId: { type: 'string' },
                  quantity:  { type: 'integer' },
                },
              },
            },
          },
        },

        /* ─── Order ───────────────────────────────────────────────────── */
        Order: {
          type: 'object',
          properties: {
            _id:             { type: 'string', example: '64b1f7e4c9e12a001b8d5555' },
            user:            { $ref: '#/components/schemas/UserPublic' },
            items:           { type: 'array', items: { $ref: '#/components/schemas/CartItem' } },
            totalAmount:     { type: 'number', example: 14999.97 },
            status:          { type: 'string', enum: ['pending','processing','shipped','delivered','cancelled'], example: 'processing' },
            shippingAddress: { $ref: '#/components/schemas/Address' },
            paymentMethod:   { type: 'string', example: 'stripe' },
            createdAt:       { type: 'string', format: 'date-time' },
          },
        },
        OrderInput: {
          type: 'object',
          required: ['shippingAddressId', 'paymentMethod'],
          properties: {
            shippingAddressId: { type: 'string', example: '64b9aaaaaaaaaaaaaaaaaa99' },
            paymentMethod:     { type: 'string', enum: ['stripe', 'cod'], example: 'stripe' },
            couponCode:        { type: 'string', example: 'SUMMER20' },
          },
        },

        /* ─── Payment ─────────────────────────────────────────────────── */
        Payment: {
          type: 'object',
          properties: {
            _id:           { type: 'string' },
            order:         { type: 'string', example: '64b1f7e4c9e12a001b8d5555' },
            amount:        { type: 'number', example: 14999.97 },
            provider:      { type: 'string', enum: ['stripe', 'cod'], example: 'stripe' },
            status:        { type: 'string', enum: ['pending','paid','failed','refunded'], example: 'paid' },
            transactionId: { type: 'string', example: 'pi_3NzXXXXXXXXXXXX' },
          },
        },
        CreatePaymentInput: {
          type: 'object',
          required: ['provider'],
          properties: {
            provider:    { type: 'string', enum: ['stripe', 'cod'], example: 'stripe' },
            returnUrl:   { type: 'string', format: 'uri', example: 'https://shoppremium.com/checkout/success' },
          },
        },
        UpdatePaymentStatusInput: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { type: 'string', enum: ['pending','paid','failed','refunded'], example: 'paid' },
          },
        },

        /* ─── Discount ────────────────────────────────────────────────── */
        Coupon: {
          type: 'object',
          properties: {
            _id:          { type: 'string' },
            code:         { type: 'string', example: 'SUMMER20' },
            type:         { type: 'string', enum: ['percentage', 'fixed'], example: 'percentage' },
            value:        { type: 'number', example: 20 },
            minOrderValue:{ type: 'number', example: 500 },
            maxUsage:     { type: 'integer', example: 100 },
            usageCount:   { type: 'integer', example: 34 },
            expiresAt:    { type: 'string', format: 'date-time' },
            isActive:     { type: 'boolean', example: true },
          },
        },
        CouponInput: {
          type: 'object',
          required: ['code', 'type', 'value'],
          properties: {
            code:          { type: 'string', example: 'SUMMER20' },
            type:          { type: 'string', enum: ['percentage', 'fixed'], example: 'percentage' },
            value:         { type: 'number', example: 20 },
            minOrderValue: { type: 'number', example: 500 },
            maxUsage:      { type: 'integer', example: 100 },
            expiresAt:     { type: 'string', format: 'date-time', example: '2026-12-31T23:59:59Z' },
          },
        },
        ValidateCouponInput: {
          type: 'object',
          required: ['code'],
          properties: {
            code:         { type: 'string', example: 'SUMMER20' },
            orderAmount:  { type: 'number', example: 2000 },
          },
        },

        /* ─── Review ──────────────────────────────────────────────────── */
        Review: {
          type: 'object',
          properties: {
            _id:          { type: 'string' },
            user:         { $ref: '#/components/schemas/UserPublic' },
            product:      { type: 'string' },
            rating:       { type: 'integer', minimum: 1, maximum: 5, example: 5 },
            title:        { type: 'string', example: 'Absolutely stunning quality!' },
            body:         { type: 'string', example: 'The craftsmanship is impeccable. Arrived faster than expected.' },
            isApproved:   { type: 'boolean', example: true },
            helpfulVotes: { type: 'integer', example: 12 },
            sellerReply:  { type: 'string', nullable: true },
            createdAt:    { type: 'string', format: 'date-time' },
          },
        },
        ReviewInput: {
          type: 'object',
          required: ['productId', 'rating', 'body'],
          properties: {
            productId: { type: 'string', example: '64b1f7e4c9e12a001b8d4321' },
            rating:    { type: 'integer', minimum: 1, maximum: 5, example: 5 },
            title:     { type: 'string', example: 'Absolutely stunning quality!' },
            body:      { type: 'string', example: 'The craftsmanship is impeccable.' },
          },
        },
        ReviewReplyInput: {
          type: 'object',
          required: ['reply'],
          properties: {
            reply: { type: 'string', example: 'Thank you for your wonderful feedback!' },
          },
        },

        /* ─── Article ─────────────────────────────────────────────────── */
        Article: {
          type: 'object',
          properties: {
            _id:        { type: 'string' },
            title:      { type: 'string', example: '5 Luxury Fashion Trends Dominating 2026' },
            slug:       { type: 'string', example: '5-luxury-fashion-trends-2026' },
            body:       { type: 'string' },
            image:      { type: 'string' },
            author:     { $ref: '#/components/schemas/SellerSummary' },
            tags:       { type: 'array', items: { type: 'string' } },
            isPublished:{ type: 'boolean', example: true },
            likes:      { type: 'integer', example: 47 },
            createdAt:  { type: 'string', format: 'date-time' },
          },
        },
        ArticleInput: {
          type: 'object',
          required: ['title', 'body'],
          properties: {
            title: { type: 'string', example: '5 Luxury Fashion Trends Dominating 2026' },
            body:  { type: 'string', example: 'Long article content...' },
            tags:  { type: 'array', items: { type: 'string' }, example: ['fashion', 'luxury'] },
          },
        },
        CommentInput: {
          type: 'object',
          required: ['body'],
          properties: {
            body: { type: 'string', example: 'Great read, very insightful!' },
          },
        },

        /* ─── Seller ──────────────────────────────────────────────────── */
        SellerSummary: {
          type: 'object',
          properties: {
            _id:       { type: 'string' },
            storeName: { type: 'string', example: 'Maison Élégance' },
            slug:      { type: 'string', example: 'maison-elegance' },
            logo:      { type: 'string' },
          },
        },
        SellerApplicationInput: {
          type: 'object',
          required: ['storeName', 'bio', 'phone'],
          properties: {
            storeName:  { type: 'string', example: 'Maison Élégance' },
            bio:        { type: 'string', example: 'A Parisian luxury atelier with 20 years of heritage.' },
            phone:      { type: 'string', example: '+20100000000' },
            website:    { type: 'string', format: 'uri', example: 'https://maison-elegance.com' },
            country:    { type: 'string', example: 'France' },
            logoUrl:    { type: 'string', example: 'https://res.cloudinary.com/demo/image/upload/logo.jpg' },
          },
        },
        SellerProfileInput: {
          type: 'object',
          properties: {
            storeName:   { type: 'string', example: 'Maison Élégance Updated' },
            bio:         { type: 'string', example: 'Updated bio text...' },
            website:     { type: 'string', format: 'uri' },
            phone:       { type: 'string', example: '+20100000001' },
            returnPolicy:{ type: 'string', example: '30-day hassle-free returns.' },
          },
        },
        PayoutRequestInput: {
          type: 'object',
          required: ['amount'],
          properties: {
            amount:     { type: 'number', example: 5000 },
            bankAccount:{ type: 'string', example: 'IBAN: EG123456789...' },
          },
        },

        /* ─── Admin ───────────────────────────────────────────────────── */
        UpdateRoleInput: {
          type: 'object',
          required: ['role'],
          properties: {
            role: { type: 'string', enum: ['user', 'seller', 'admin'], example: 'seller' },
          },
        },
        AdjustInventoryInput: {
          type: 'object',
          required: ['adjustment'],
          properties: {
            adjustment: { type: 'integer', example: 10, description: 'Positive to add stock, negative to subtract.' },
            reason:     { type: 'string', example: 'Shipment received.' },
          },
        },
        ModerateSellerInput: {
          type: 'object',
          required: ['status'],
          properties: {
            status:  { type: 'string', enum: ['approved', 'rejected'], example: 'approved' },
            remarks: { type: 'string', example: 'Store credentials verified.' },
          },
        },

        /* ─── SuperAdmin ──────────────────────────────────────────────── */
        SettingsInput: {
          type: 'object',
          properties: {
            maintenanceMode:  { type: 'boolean', example: false },
            allowRegistration:{ type: 'boolean', example: true },
            platformFeePercent:{ type: 'number', example: 5 },
            supportEmail:     { type: 'string', format: 'email', example: 'support@premium.com' },
          },
        },
        CreateAdminInput: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name:     { type: 'string', example: 'Admin User' },
            email:    { type: 'string', format: 'email', example: 'admin@premium.com' },
            password: { type: 'string', format: 'password', example: 'SecureAdm1n!' },
          },
        },

        /* ─── Testimonial ─────────────────────────────────────────────── */
        Testimonial: {
          type: 'object',
          properties: {
            _id:     { type: 'string' },
            user:    { $ref: '#/components/schemas/UserPublic' },
            message: { type: 'string', example: 'World-class service and lightning-fast delivery!' },
            rating:  { type: 'integer', minimum: 1, maximum: 5, example: 5 },
            status:  { type: 'string', enum: ['pending', 'approved', 'rejected'], example: 'approved' },
          },
        },
        TestimonialInput: {
          type: 'object',
          required: ['message', 'rating'],
          properties: {
            message: { type: 'string', example: 'World-class service and lightning-fast delivery!' },
            rating:  { type: 'integer', minimum: 1, maximum: 5, example: 5 },
          },
        },

        /* ─── Checkout ────────────────────────────────────────────────── */
        CheckoutState: {
          type: 'object',
          properties: {
            step:            { type: 'integer', example: 2 },
            cartSnapshot:    { type: 'array', items: { $ref: '#/components/schemas/CartItem' } },
            shippingAddress: { $ref: '#/components/schemas/Address' },
            paymentMethod:   { type: 'string', example: 'stripe' },
            subtotal:        { type: 'number', example: 14999.97 },
            discount:        { type: 'number', example: 1500.00 },
            total:           { type: 'number', example: 13499.97 },
          },
        },

        /* ─── Analytics ───────────────────────────────────────────────── */
        AnalyticsEventInput: {
          type: 'object',
          required: ['event'],
          properties: {
            event:      { type: 'string', example: 'product_view' },
            properties: {
              type: 'object',
              example: { productId: '64b1f7e4c9e12a001b8d4321', source: 'search' },
            },
          },
        },

        /* ─── Upload ──────────────────────────────────────────────────── */
        UploadResponse: {
          type: 'object',
          properties: {
            success:   { type: 'boolean', example: true },
            url:       { type: 'string', example: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' },
            public_id: { type: 'string', example: 'ecommerce/products/sample' },
          },
        },

        /* ─── Currency ────────────────────────────────────────────────── */
        ExchangeRates: {
          type: 'object',
          properties: {
            base:  { type: 'string', example: 'EGP' },
            rates: {
              type: 'object',
              example: { USD: 0.021, EUR: 0.019, GBP: 0.016 },
            },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },
  apis: ['./Routers/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };