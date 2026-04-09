# Smart Cafe Thesis - Part 2
## Chapters 3-4: Requirements Analysis & System Architecture

---

# CHAPTER 3: SYSTEM REQUIREMENTS AND ANALYSIS

## 3.1 Stakeholder Analysis

Understanding stakeholder needs is fundamental to successful system design. Smart Cafe serves three primary user groups with distinct requirements:

### 3.1.1 Customers

**Profile:** Cafe patrons seeking convenient, personalized ordering experiences.

**Key Characteristics:**
- Varying levels of technical proficiency
- Diverse dietary preferences and restrictions
- Time-sensitive (lunch breaks, meetings)
- Desire for personalized recommendations
- Concern about order accuracy and wait times

**Primary Needs:**
1. Quick and intuitive menu browsing
2. Personalized suggestions based on mood/preferences
3. Ability to customize orders (milk type, extras, etc.)
4. Real-time order status visibility
5. Transparent pricing with customization costs
6. Easy reordering of favorites

**Pain Points Addressed:**
- Decision fatigue from extensive menus → AI recommendations
- Uncertainty about ingredients/allergens → Detailed descriptions + AI Q&A
- Long wait times without updates → Real-time tracking
- Inability to modify orders after placement → Clear customization upfront

### 3.1.2 Kitchen Staff

**Profile:** Baristas, chefs, and kitchen managers responsible for order preparation.

**Key Characteristics:**
- High-pressure, fast-paced environment
- Need for clear, prioritized task lists
- Limited time for administrative tasks
- Require real-time inventory awareness

**Primary Needs:**
1. Instant notification of new orders
2. Clear preparation instructions including customizations
3. Order prioritization (FIFO, rush orders)
4. Inventory level visibility
5. Ability to mark items as sold out
6. Minimal interface complexity

**Pain Points Addressed:**
- Missed or delayed orders → Real-time push notifications
- Confusion about customizations → Detailed order breakdowns
- Running out of ingredients mid-prep → Live inventory tracking
- Inefficient workflow → Organized queue by order time

### 3.1.3 Administrators/Owners

**Profile:** Cafe owners and managers overseeing operations.

**Key Characteristics:**
- Business-focused decision makers
- Need comprehensive operational insights
- Responsible for menu planning and pricing
- Monitor staff performance and customer satisfaction

**Primary Needs:**
1. Sales analytics and trend identification
2. Menu performance metrics (popular items, profit margins)
3. Inventory management and reorder alerts
4. Customer feedback aggregation
5. Staff scheduling optimization
6. AI-generated business insights

**Pain Points Addressed:**
- Lack of data-driven decision making → Analytics dashboard
- Manual inventory counting → Automated tracking
- Unknown peak hours → Historical order pattern analysis
- Ineffective menu items → Performance metrics per item

### 3.1.4 Secondary Stakeholders

**System Developers/Maintainers:**
- Require clean, documented codebase
- Need scalable architecture for future enhancements
- Desire comprehensive error logging

**Regulatory Bodies:**
- Food safety compliance (allergen information)
- Alcohol service regulations (consumption limits)
- Data privacy laws (GDPR, CCPA)

## 3.2 Functional Requirements

Functional requirements define specific behaviors and capabilities the system must provide. These are organized by user role and feature module.

### 3.2.1 Customer-Facing Features

#### FR-C1: User Authentication and Profile Management
- **FR-C1.1:** System shall support email/password authentication via Firebase Auth
- **FR-C1.2:** System shall support Google OAuth single sign-on
- **FR-C1.3:** System shall automatically create user profiles in Firestore upon first login
- **FR-C1.4:** System shall maintain user order history for personalized recommendations
- **FR-C1.5:** System shall allow users to view and update profile information

#### FR-C2: AI-Powered Recommendation Engine
- **FR-C2.1:** System shall accept natural language input describing mood, preferences, or cravings
- **FR-C2.2:** System shall query Groq API with Llama model for personalized recommendations
- **FR-C2.3:** System shall display recommended items with images, descriptions, and prices
- **FR-C2.4:** System shall provide "Customize" and "Add to Cart" options for each recommendation
- **FR-C2.5:** System shall maintain conversation context for follow-up queries
- **FR-C2.6:** System shall handle unavailable items gracefully with alternative suggestions

#### FR-C3: Interactive Menu Browsing
- **FR-C3.1:** System shall display all available menu items categorized (Drinks, Food, Desserts)
- **FR-C3.2:** System shall filter items by category with smooth transitions
- **FR-C3.3:** System shall show real-time availability status (in stock/sold out)
- **FR-C3.4:** System shall display high-quality product images for visual appeal
- **FR-C3.5:** System shall show detailed descriptions including ingredients and allergens

#### FR-C4: Order Customization
- **FR-C4.1:** System shall present customization options when user selects an item
- **FR-C4.2:** System shall support single-choice options (e.g., milk type: whole/oat/almond)
- **FR-C4.3:** System shall support multiple-choice options (e.g., extra toppings)
- **FR-C4.4:** System shall dynamically calculate and display updated price with customizations
- **FR-C4.5:** System shall validate required selections before allowing cart addition
- **FR-C4.6:** System shall persist customization choices within session

#### FR-C5: Shopping Cart Management
- **FR-C5.1:** System shall maintain persistent cart state across page navigation
- **FR-C5.2:** System shall display cart summary with item count and subtotal
- **FR-C5.3:** System shall allow quantity adjustment for cart items
- **FR-C5.4:** System shall allow item removal from cart
- **FR-C5.5:** System shall recalculate totals when items are modified
- **FR-C5.6:** System shall preserve cart contents during browser refresh (via localStorage)

#### FR-C6: Checkout and Order Placement
- **FR-C6.1:** System shall collect delivery/pickup preference
- **FR-C6.2:** System shall display final order summary with all customizations
- **FR-C6.3:** System shall calculate total including taxes and fees
- **FR-C6.4:** System shall create order document in Firestore with unique ID
- **FR-C6.5:** System shall clear cart upon successful order placement
- **FR-C6.6:** System shall provide order confirmation with estimated preparation time
- **[PLACEHOLDER]: Payment gateway integration for actual transactions**

#### FR-C7: Real-Time Order Tracking
- **FR-C7.1:** System shall display current order status (Received, Preparing, Ready, Completed)
- **FR-C7.2:** System shall update status in real-time via Firestore listeners
- **FR-C7.3:** System shall show estimated completion time
- **FR-C7.4:** System shall notify user when order is ready for pickup
- **FR-C7.5:** System shall maintain order history accessible from profile

#### FR-C8: Wine Sommelier Module
- **FR-C8.1:** System shall provide specialized AI assistant for wine recommendations
- **FR-C8.2:** System shall consider food pairings when suggesting wines
- **FR-C8.3:** System shall track alcohol consumption per user session
- **FR-C8.4:** System shall enforce maximum limit of 3 alcoholic drinks per session
- **FR-C8.5:** System shall politely refuse additional alcohol requests after limit reached
- **FR-C8.6:** System shall suggest non-alcoholic alternatives when limit exceeded

### 3.2.2 Admin-Facing Features

#### FR-A1: Administrative Authentication
- **FR-A1.1:** System shall verify admin credentials against hardcoded authorized emails
- **FR-A1.2:** System shall redirect unauthorized users to customer interface
- **FR-A1.3:** System shall maintain separate admin session state

#### FR-A2: Dashboard Analytics
- **FR-A2.1:** System shall display today's total orders and revenue
- **FR-A2.2:** System shall show popular items ranking
- **FR-A2.3:** System shall visualize peak hours with heat map
- **FR-A2.4:** System shall display customer sentiment analysis (AI-generated)
- **FR-A2.5:** System shall provide AI-generated daily insights and recommendations
- **FR-A2.6:** System shall update metrics in real-time as orders arrive

#### FR-A3: Live Order Management
- **FR-A3.1:** System shall display all active orders in chronological queue
- **FR-A3.2:** System shall show order details including customizations
- **FR-A3.3:** System shall allow status updates (Preparing → Ready → Completed)
- **FR-A3.4:** System shall highlight overdue orders requiring attention
- **FR-A3.5:** System shall play audio notification for new orders
- **FR-A3.6:** System shall sync across multiple admin devices simultaneously

#### FR-A4: Menu Inventory Management
- **FR-A4.1:** System shall display complete menu with all items
- **FR-A4.2:** System shall allow adding new menu items with full details
- **FR-A4.3:** System shall allow editing existing items (name, price, description, image)
- **FR-A4.4:** System shall allow toggling item availability (in stock/sold out)
- **FR-A4.5:** System shall allow deactivating items (soft delete)
- **FR-A4.6:** System shall support customization options CRUD operations
- **FR-A4.7:** System shall validate required fields before saving
- **FR-A4.8:** System shall provide image URL validation

#### FR-A5: Business Intelligence
- **FR-A5.1:** System shall generate weekly sales reports
- **FR-A5.2:** System shall identify trending items and declining performers
- **FR-A5.3:** System shall analyze customer ordering patterns
- **FR-A5.4:** System shall predict inventory needs based on historical data
- **[PLACEHOLDER]: Advanced forecasting algorithms**

### 3.2.3 System-Wide Features

#### FR-S1: Error Handling and Resilience
- **FR-S1.1:** System shall display user-friendly error messages for common failures
- **FR-S1.2:** System shall implement retry logic for transient network errors
- **FR-S1.3:** System shall log errors to console for debugging
- **FR-S1.4:** System shall gracefully degrade when AI service unavailable
- **FR-S1.5:** System shall maintain offline capability for cached menu data

#### FR-S2: Responsive Design
- **FR-S2.1:** System shall function on desktop browsers (1920x1080 minimum)
- **FR-S2.2:** System shall adapt to tablet screens (768px - 1024px)
- **FR-S2.3:** System shall optimize for mobile devices (320px - 767px)
- **FR-S2.4:** System shall maintain touch-friendly tap targets (minimum 44x44px)

#### FR-S3: Accessibility
- **FR-S3.1:** System shall support keyboard navigation throughout
- **FR-S3.2:** System shall provide ARIA labels for screen readers
- **FR-S3.3:** System shall maintain sufficient color contrast ratios (WCAG AA)
- **FR-S3.4:** System shall allow text resizing up to 200% without breaking layout

## 3.3 Non-Functional Requirements

Non-functional requirements define quality attributes and constraints on the system.

### 3.3.1 Performance Requirements

#### NFR-P1: Response Time
- **NFR-P1.1:** Menu page shall load within 2 seconds on 4G connection
- **NFR-P1.2:** AI recommendation response shall complete within 5 seconds
- **NFR-P1.3:** Order status updates shall propagate within 1 second
- **NFR-P1.4:** Cart operations (add/remove/update) shall complete within 500ms

#### NFR-P2: Scalability
- **NFR-P2.1:** System shall support up to 100 concurrent users
- **NFR-P2.2:** Database shall handle 1000 orders per day without degradation
- **NFR-P2.3:** System architecture shall support horizontal scaling for future growth

#### NFR-P3: Resource Efficiency
- **NFR-P3.1:** Frontend bundle size shall not exceed 500KB (gzipped)
- **NFR-P3.2:** Images shall be optimized and lazy-loaded
- **NFR-P3.3:** Unused components shall be code-split for efficient loading

### 3.3.2 Reliability Requirements

#### NFR-R1: Availability
- **NFR-R1.1:** System shall achieve 99% uptime during business hours
- **NFR-R1.2:** Firebase services provide built-in redundancy and failover
- **NFR-R1.3:** System shall display appropriate messaging during maintenance windows

#### NFR-R2: Data Integrity
- **NFR-R2.1:** All database writes shall use atomic operations where applicable
- **NFR-R2.2:** Order records shall be immutable once created (append-only updates)
- **NFR-R2.3:** System shall validate data types before database insertion
- **NFR-R2.4:** Concurrent modifications shall be handled via Firestore transactions

#### NFR-R3: Fault Tolerance
- **NFR-R3.1:** System shall continue functioning if AI service temporarily unavailable
- **NFR-R3.2:** Network interruptions shall not result in data loss (optimistic updates with rollback)
- **NFR-R3.3:** Invalid user input shall not crash the application

### 3.3.3 Security Requirements

#### NFR-S1: Authentication and Authorization
- **NFR-S1.1:** All user sessions shall be authenticated via Firebase Auth tokens
- **NFR-S1.2:** Admin routes shall be protected with role-based access control
- **NFR-S1.3:** Session tokens shall expire after 1 hour of inactivity
- **NFR-S1.4:** Passwords shall never be stored locally (handled by Firebase)

#### NFR-S2: Data Protection
- **NFR-S2.1:** All API communications shall use HTTPS/TLS encryption
- **NFR-S2.2:** Sensitive user data (email, phone) shall be encrypted at rest
- **NFR-S2.3:** API keys shall be stored in environment variables, not committed to version control
- **NFR-S2.4:** Firestore security rules shall restrict read/write access by role

#### NFR-S3: Input Validation
- **NFR-S3.1:** All user inputs shall be sanitized to prevent XSS attacks
- **NFR-S3.2:** Numeric inputs (prices, quantities) shall be validated for reasonable ranges
- **NFR-S3.3:** Text inputs shall have maximum length limits
- **NFR-S3.4:** Image URLs shall be validated for proper format

### 3.3.4 Usability Requirements

#### NFR-U1: Learnability
- **NFR-U1.1:** New users shall complete first order within 3 minutes without training
- **NFR-U1.2:** Interface shall follow established e-commerce patterns (cart icon, checkout flow)
- **NFR-U1.3:** AI chatbot shall provide helpful guidance for first-time users

#### NFR-U2: User Satisfaction
- **NFR-U2.1:** System shall achieve SUS (System Usability Scale) score above 70
- **NFR-U2.2:** Users shall rate AI recommendations as "helpful" in >60% of interactions
- **[PLACEHOLDER]: Formal usability testing results**

#### NFR-U3: Accessibility Compliance
- **NFR-U3.1:** System shall meet WCAG 2.1 Level AA standards
- **NFR-U3.2:** All interactive elements shall be keyboard accessible
- **NFR-U3.3:** Color shall not be sole indicator of information (use icons/text as well)

### 3.3.5 Maintainability Requirements

#### NFR-M1: Code Quality
- **NFR-M1.1:** Code shall follow TypeScript strict mode for type safety
- **NFR-M1.2:** Components shall be modular and reusable (DRY principle)
- **NFR-M1.3:** Complex functions shall include JSDoc comments
- **NFR-M1.4:** Code shall pass ESLint validation with zero warnings

#### NFR-M2: Documentation
- **NFR-M2.1:** README shall provide complete setup instructions
- **NFR-M2.2:** API endpoints shall be documented with request/response examples
- **NFR-M2.3:** Database schema shall be documented with field descriptions
- **NFR-M2.4:** Deployment process shall be documented step-by-step

#### NFR-M3: Extensibility
- **NFR-M3.1:** New features shall be addable without modifying existing code (Open/Closed Principle)
- **NFR-M3.2:** AI model shall be swappable via configuration (not hardcoded)
- **NFR-M3.3:** Payment providers shall be pluggable via adapter pattern
- **[PLACEHOLDER]: Plugin architecture for third-party integrations**

## 3.4 Use Case Modeling

Use cases describe interactions between actors (users) and the system to achieve specific goals.

### 3.4.1 Primary Use Cases

#### UC1: Receive AI-Powered Recommendations

**Actor:** Customer  
**Precondition:** User is logged in and on menu page  
**Postcondition:** User receives personalized item suggestions

**Main Flow:**
1. User clicks AI chatbot icon
2. System displays chat interface with greeting
3. User types mood/preference (e.g., "I need energy")
4. System sends query to Groq API with menu context
5. AI analyzes request and returns recommendations
6. System displays recommended items with images and descriptions
7. User can click "Customize" or "Add to Cart" for any recommendation

**Alternative Flows:**
- A1: AI service unavailable → System shows fallback recommendations from popular items
- A2: No matching items found → AI explains and suggests closest alternatives
- A3: User asks follow-up question → System maintains conversation context

**Exceptions:**
- E1: Network timeout → Display error message with retry option
- E2: Invalid API key → Log error, show generic message to user

---

#### UC2: Customize and Add Item to Cart

**Actor:** Customer  
**Precondition:** User has selected a menu item  
**Postcondition:** Customized item added to shopping cart

**Main Flow:**
1. User clicks on menu item
2. System opens customization modal
3. System displays available options (milk type, extras, etc.)
4. User selects desired customizations
5. System calculates and displays updated price in real-time
6. User clicks "Add to Cart"
7. System validates selections
8. System adds item with customizations to cart
9. System displays success toast notification
10. System closes modal

**Alternative Flows:**
- A1: User cancels → Modal closes without adding to cart
- A2: User modifies quantity → System updates cart accordingly

**Exceptions:**
- E1: Required option not selected → Show validation error
- E2: Item becomes unavailable → Display error, remove from selection

---

#### UC3: Place Order

**Actor:** Customer  
**Precondition:** Cart contains at least one item  
**Postcondition:** Order created in database, kitchen notified

**Main Flow:**
1. User navigates to cart page
2. System displays all cart items with customizations and prices
3. System calculates subtotal, taxes, and total
4. User selects pickup or delivery option
5. User reviews order details
6. User clicks "Place Order"
7. System creates order document in Firestore with:
   - Unique order ID
   - User ID
   - Items array with customizations
   - Total amount
   - Status: "pending"
   - Timestamp
8. System clears user's cart
9. System displays confirmation with order number
10. Kitchen admin receives real-time notification

**Alternative Flows:**
- A1: User modifies cart before checkout → Return to cart, recalculate
- A2: User applies discount code → [PLACEHOLDER: Future feature]

**Exceptions:**
- E1: Database write fails → Retry up to 3 times, then show error
- E2: Network disconnected → Save order locally, sync when reconnected

---

#### UC4: Manage Live Orders (Kitchen Staff)

**Actor:** Admin/Kitchen Staff  
**Precondition:** Admin is logged in and on orders page  
**Postcondition:** Order status updated, customer notified

**Main Flow:**
1. System displays queue of pending orders sorted by time
2. New order arrives → System plays notification sound
3. Admin views order details including customizations
4. Admin clicks "Start Preparing"
5. System updates order status to "preparing"
6. Customer receives real-time status update
7. Admin completes preparation
8. Admin clicks "Mark Ready"
9. System updates status to "ready"
10. Customer receives pickup notification

**Alternative Flows:**
- A1: Item unavailable → Admin marks as sold out, contacts customer
- A2: Rush order → Admin can prioritize by moving up in queue

**Exceptions:**
- E1: Multiple admins update same order → Firestore handles conflict resolution
- E2: Connection lost → Reconnect and sync pending updates

---

#### UC5: Update Menu Inventory

**Actor:** Admin  
**Precondition:** Admin is logged in and on inventory page  
**Postcondition:** Menu item added/edited/deactivated

**Main Flow:**
1. Admin clicks "Add New Item" or selects existing item to edit
2. System opens item form modal
3. Admin enters/updates:
   - Name
   - Description
   - Category
   - Price
   - Image URL
   - Customization options
4. Admin toggles availability status
5. Admin clicks "Save"
6. System validates all required fields
7. System writes to Firestore
8. System displays success message
9. All connected clients receive real-time update

**Alternative Flows:**
- A1: Admin deactivates item → Item hidden from customer menu but preserved in database
- A2: Admin marks as sold out → Item visible but marked unavailable

**Exceptions:**
- E1: Invalid image URL → Show validation error
- E2: Missing required field → Highlight missing fields, prevent save

---

#### UC6: View Analytics Dashboard

**Actor:** Admin  
**Precondition:** Admin is logged in  
**Postcondition:** Admin views business metrics and insights

**Main Flow:**
1. Admin navigates to dashboard
2. System queries Firestore for today's orders
3. System calculates:
   - Total orders count
   - Total revenue
   - Average order value
   - Top selling items
4. System displays metrics in cards
5. System generates AI insights based on order patterns
6. System displays peak hours visualization
7. Admin reviews insights for decision making

**Alternative Flows:**
- A1: No orders today → Display "No data yet" message
- A2: Admin wants historical data → [PLACEHOLDER: Date range selector]

**Exceptions:**
- E1: AI insights generation fails → Display metrics without insights
- E2: Insufficient data → Show placeholder charts

---

### 3.4.2 Use Case Diagram

```
                    ┌─────────────────┐
                    │   Smart Cafe    │
                    │    System       │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────┐        ┌─────▼─────┐       ┌──────▼──────┐
   │Customer │        │  Admin/   │       │   Kitchen   │
   │         │        │  Owner    │       │   Staff     │
   └────┬────┘        └─────┬─────┘       └──────┬──────┘
        │                   │                     │
        │                   │                     │
   ┌────▼───────────────────▼─────────────────────▼────┐
   │ Use Cases:                                        │
   │                                                   │
   │ • Browse Menu                                     │
   │ • Get AI Recommendations                          │
   │ • Customize Orders                                │
   │ • Manage Cart                                     │
   │ • Place Orders                                    │
   │ • Track Order Status                              │
   │ • View Order History                              │
   │ • Consult Wine Sommelier                          │
   │                                                   │
   │ • View Analytics Dashboard                        │
   │ • Manage Live Orders                              │
   │ • Update Menu Inventory                           │
   │ • Generate Business Insights                      │
   │ • Monitor Stock Levels                            │
   │                                                   │
   │ • Receive Order Notifications                     │
   │ • Update Order Status                             │
   │ • View Preparation Queue                          │
   │ • Mark Items Sold Out                             │
   └───────────────────────────────────────────────────┘
```

## 3.5 System Constraints

Constraints are limitations or restrictions that influence design decisions.

### 3.5.1 Technical Constraints

**C1: Browser Compatibility**
- System must support modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Legacy browser support (IE11) explicitly excluded to leverage modern JavaScript features

**C2: Mobile Responsiveness**
- Must function on screens as small as 320px width (iPhone SE)
- Touch interactions must work without hover states
- Virtual keyboard must not obscure critical UI elements

**C3: API Rate Limits**
- Groq API free tier: 30 requests/minute, 200 requests/day
- System must implement client-side caching to minimize API calls
- Exceeded quota must degrade gracefully (fallback recommendations)

**C4: Firebase Free Tier Limitations**
- Firestore: 50,000 reads/day, 20,000 writes/day
- Authentication: 10,000 MAU (monthly active users)
- Storage: 5GB total, 1GB downloaded/day
- System must optimize queries to stay within limits during development

**C5: Network Dependency**
- Core features require internet connection
- Offline mode limited to viewing cached menu
- Order placement requires active connection

### 3.5.2 Business Constraints

**C6: Budget Limitations**
- Development uses free tiers of all services
- Production deployment budget: $[TO BE DETERMINED]/month
- No paid AI model training or fine-tuning

**C7: Time Constraints**
- Thesis deadline: [DATE]
- Minimum viable product must be functional by [DATE]
- User testing window: [DATE RANGE]

**C8: Regulatory Compliance**
- Must comply with local food service regulations
- Alcohol service requires age verification [PLACEHOLDER: Implementation]
- Data privacy must meet GDPR/CCPA requirements

### 3.5.3 Operational Constraints

**C9: Single Location**
- System designed for one cafe location initially
- Multi-location support requires architectural changes
- No inter-store inventory synchronization

**C10: Staff Training**
- Kitchen staff have limited technical expertise
- Admin interface must be intuitive with minimal training
- Documentation must include step-by-step guides with screenshots

**C11: Maintenance Resources**
- No dedicated IT staff post-deployment
- System must be self-monitoring with clear error messages
- Updates must be deployable by cafe owner with basic technical skills

---

# CHAPTER 4: SYSTEM ARCHITECTURE AND DESIGN

## 4.1 Architectural Overview

Smart Cafe employs a **client-server architecture** with cloud-based backend services, following modern web application best practices. The system is structured into three logical tiers:

### 4.1.1 Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  PRESENTATION TIER                       │
│              (Client-Side React Application)             │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Customer │  │  Admin   │  │  Kitchen │              │
│  │  Views   │  │Dashboard │  │  Display │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│                                                          │
│  ┌──────────────────────────────────────────┐           │
│  │       React Components & State Mgmt      │           │
│  │  (React Router, Context API, Hooks)      │           │
│  └──────────────────────────────────────────┘           │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS / WebSocket
┌──────────────────────▼──────────────────────────────────┐
│                  APPLICATION TIER                        │
│            (Server-Side Logic & APIs)                    │
│                                                          │
│  ┌──────────────────────────────────────────┐           │
│  │     Express.js Server (server.ts)        │           │
│  │                                          │           │
│  │  • AI Chat Endpoint (/api/chat)          │           │
│  │  • Admin Insights (/api/insights)        │           │
│  │  • Proxy to Groq API                     │           │
│  │  • Environment Variable Management       │           │
│  └──────────────────────────────────────────┘           │
└──────────────────────┬──────────────────────────────────┘
                       │ Internal Calls
┌──────────────────────▼──────────────────────────────────┐
│                    DATA TIER                             │
│              (Cloud Services - Firebase)                 │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Firestore   │  │   Firebase   │  │   Firebase   │  │
│  │  Database    │  │   Auth       │  │   Storage    │  │
│  │              │  │              │  │  (Optional)  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────┐           │
│  │         External AI Service              │           │
│  │      Groq API (Llama Models)             │           │
│  └──────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────┘
```

### 4.1.2 Architectural Style Justification

**Why Client-Server over Monolithic?**
- Separation of concerns: Frontend handles UI/UX, backend handles business logic
- Independent scaling: Can scale frontend CDN separately from backend API
- Technology flexibility: Frontend can evolve (React → Vue/Angular) without backend changes
- Team collaboration: Frontend and backend developers can work in parallel

**Why Serverless Backend (Firebase)?**
- Eliminates server management overhead
- Automatic scaling handles traffic spikes
- Built-in real-time capabilities (Firestore listeners)
- Integrated authentication reduces development time
- Cost-effective for variable usage patterns (pay-per-use)

**Why Not Microservices?**
- Single cafe operation doesn't justify microservice complexity
- Firebase provides sufficient modularity through collections
- Microservices introduce distributed system challenges (consistency, latency)
- Can migrate to microservices if scaling to multiple locations

### 4.1.3 Key Architectural Decisions

**Decision 1: Real-Time Synchronization via Firestore Listeners**
- **Rationale:** Kitchen staff need instant order notifications; polling would introduce delays and waste resources
- **Implementation:** `onSnapshot()` establishes WebSocket connections that push updates immediately
- **Trade-off:** Slightly higher cost vs. polling, but superior UX justifies expense

**Decision 2: AI Processing on Backend Server**
- **Rationale:** 
  - Protects API keys from exposure in client-side code
  - Enables request throttling and caching
  - Allows prompt engineering adjustments without client updates
- **Implementation:** Express server proxies requests to Groq API
- **Trade-off:** Adds server infrastructure requirement, but necessary for security

**Decision 3: Optimistic UI Updates**
- **Rationale:** Perceived performance critical for user satisfaction; waiting for server confirmation feels slow
- **Implementation:** Cart updates reflect immediately; rollback on error
- **Trade-off:** Complexity in error handling, but worth improved responsiveness

**Decision 4: Static AI Model Selection (Llama via Groq)**
- **Rationale:** 
  - No need for custom model training (zero-shot capability sufficient)
  - Groq provides fastest inference speeds (critical for UX)
  - Cost predictable with per-token pricing
- **Implementation:** Hardcoded model name in server.ts, easily changeable
- **Trade-off:** Less control than self-hosted models, but operational simplicity preferred

## 4.2 Technology Stack Selection

Technology choices balance performance, developer productivity, cost, and learning objectives.

### 4.2.1 Frontend Technologies

#### React 18+
**Selection Rationale:**
- Component-based architecture promotes reusability (MenuItemModal, CartSummary, etc.)
- Large ecosystem of libraries and community support
- Virtual DOM provides efficient updates for dynamic interfaces
- Hooks simplify state management compared to class components
- Strong TypeScript support for type safety

**Alternatives Considered:**
- **Vue.js:** Simpler learning curve but smaller ecosystem
- **Svelte:** Better performance but less mature tooling
- **Angular:** Overly complex for project scope

**Justification:** React's balance of flexibility, community, and job market relevance made it ideal for academic project demonstrating industry-standard skills.

#### TypeScript
**Selection Rationale:**
- Catches type errors at compile time rather than runtime
- Self-documenting code through type annotations
- Superior IDE support (autocomplete, refactoring)
- Essential for maintaining large codebases
- Industry standard for professional React development

**Example Impact:**
```typescript
// Without TypeScript - runtime error possible
const price = item.price + customization.price; // What if price is undefined?

// With TypeScript - compile-time error
interface MenuItem {
  price: number;  // Compiler enforces this exists
}
const price = item.price + customization.price; // Safe!
```

#### Tailwind CSS
**Selection Rationale:**
- Utility-first approach accelerates development
- No context switching between JSX and CSS files
- Responsive design built-in (md:, lg: prefixes)
- Consistent design system via configuration
- Smaller bundle size than component libraries (only used classes included)

**Alternatives Considered:**
- **Material-UI:** Pre-built components but larger bundle, less customization
- **Styled-Components:** More flexible but slower runtime performance
- **Bootstrap:** Rapid prototyping but generic appearance

**Justification:** Tailwind enables rapid UI iteration while maintaining unique brand identity—critical for thesis demonstration.

#### Motion (Framer Motion)
**Selection Rationale:**
- Declarative animation syntax integrates with React
- Handles complex transitions (page transitions, modal animations)
- Gesture support (drag, tap, hover)
- Performance optimized (GPU-accelerated)

**Usage Examples:**
- Menu item hover effects
- Modal slide-in/slide-out animations
- Page transition fades
- Cart item addition animations

### 4.2.2 Backend Technologies

#### Node.js + Express
**Selection Rationale:**
- JavaScript throughout stack (frontend + backend) reduces context switching
- Express minimal and unopinionated—only includes needed features
- Middleware architecture enables clean separation (CORS, JSON parsing, error handling)
- Large npm ecosystem for additional functionality
- Easy deployment to various platforms (Heroku, Railway, Vercel)

**Server Responsibilities:**
- Proxy AI requests to Groq (protects API keys)
- Prompt engineering and context assembly
- Error handling and fallback responses
- Environment variable management
- [PLACEHOLDER]: Future payment processing

#### Groq API (Llama Models)
**Selection Rationale:**
- Fastest LLM inference speeds (critical for conversational UX)
- Free tier sufficient for development and initial deployment
- Llama 3.1 8B provides good balance of capability and speed
- JSON output mode ensures structured responses
- Simple REST API integration

**Model Evolution:**
- Initial: `llama-3.1-8b-instant` (fast, adequate for basic recommendations)
- Upgraded: `llama-3.2-90b-text-preview` (better reasoning for flavor matching)
- [PLACEHOLDER]: Future evaluation of GPT-4, Claude for comparison study

**Alternatives Considered:**
- **OpenAI GPT-4:** More capable but significantly more expensive
- **Anthropic Claude:** Excellent reasoning but slower response times
- **Self-hosted models:** Full control but requires GPU infrastructure

**Justification:** Groq's speed-to-cost ratio ideal for real-time conversational AI in resource-constrained academic project.

### 4.2.3 Cloud Services (Firebase)

#### Firestore Database
**Selection Rationale:**
- Real-time listeners eliminate need for custom WebSocket implementation
- Flexible schema accommodates evolving requirements (no migrations)
- Automatic indexing optimizes query performance
- Offline persistence improves mobile experience
- Generous free tier for development

**Data Model:**
- Document-oriented (JSON-like structure)
- Collections: `users`, `menu_items`, `orders`, `wine_items`
- Subcollections for nested data (e.g., order items)

**Alternatives Considered:**
- **MongoDB Atlas:** Similar flexibility but no built-in real-time listeners
- **Supabase:** SQL-based, better for complex queries but steeper learning curve
- **AWS DynamoDB:** Highly scalable but complex permission model

**Justification:** Firestore's real-time capabilities and simplicity outweigh SQL benefits for this use case.

#### Firebase Authentication
**Selection Rationale:**
- Handles secure password hashing (never see plaintext passwords)
- Social login integration (Google OAuth) with minimal code
- Session management and token refresh automatic
- Email verification workflows built-in
- Integrates seamlessly with Firestore security rules

**Authentication Flows Supported:**
- Email/password registration and login
- Google OAuth single sign-on
- Session persistence across browser refreshes
- Protected routes via Higher-Order Components

**Security Features:**
- JWT tokens with expiration
- CSRF protection
- Rate limiting on failed attempts
- [PLACEHOLDER]: Multi-factor authentication for admin accounts

#### Firebase Hosting (Planned)
**[PLACEHOLDER]: Deployment Configuration**
- Continuous deployment from Git repository
- Automatic SSL certificate provisioning
- Global CDN for low-latency asset delivery
- Rollback capability for failed deployments

### 4.2.4 Development Tools

#### Vite
**Selection Rationale:**
- Near-instant hot module replacement (HMR) during development
- Optimized production builds with tree-shaking
- Native ES module support (faster than Webpack)
- Simple configuration (vite.config.ts)
- Plugin ecosystem for additional functionality

**Performance Comparison:**
- Dev server startup: ~500ms (Vite) vs ~30s (Create React App)
- HMR updates: <50ms (Vite) vs ~2s (Webpack)

#### ESLint + Prettier
**Selection Rationale:**
- Enforces consistent code style across team (even solo developer)
- Catches common mistakes (unused variables, unreachable code)
- Auto-formatting saves time and eliminates style debates
- Integrates with VS Code for real-time feedback

#### Git + GitHub
**Selection Rationale:**
- Version control essential for academic integrity (commit history proves work)
- Branching strategy enables feature development without breaking main
- GitHub Issues for task tracking
- README and documentation alongside code

## 4.3 Database Design

Database schema design balances normalization (reducing redundancy) with denormalization (improving read performance).

### 4.3.1 Entity-Relationship Diagram

```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│     users        │       │   menu_items     │       │     orders       │
│──────────────────│       │──────────────────│       │──────────────────│
│ id (PK)          │       │ id (PK)          │       │ id (PK)          │
│ email            │       │ name             │       │ user_id (FK)     │
│ role             │       │ description      │       │ items[]          │
│ phone_number     │       │ category         │       │ total_amount     │
│ created_at       │       │ price            │       │ status           │
│ total_orders     │       │ image_url        │       │ created_at       │
│ last_login       │       │ is_active        │       │ updated_at       │
└────────┬─────────┘       │ is_available     │       │ pickup_time      │
         │                 │ customization_   │       └────────┬─────────┘
         │                 │   options[]      │                │
         │                 └────────┬─────────┘                │
         │                          │                          │
         │              ┌───────────▼───────────┐              │
         │              │  wine_items           │              │
         │              │───────────────────────│              │
         │              │ id (PK)               │              │
         │              │ name                  │              │
         │              │ description           │              │
         │              │ price                 │              │
         │              │ region                │              │
         │              │ grape_variety         │              │
         │              │ food_pairings[]       │              │
         │              │ image_url             │              │
         │              │ is_available          │              │
         │              └───────────────────────┘              │
         │                                                     │
         └─────────────────────────────────────────────────────┘
                        References user_id
```

### 4.3.2 Collection Schemas

#### Collection: `users`

**Purpose:** Store user profiles and authentication metadata.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | string | Yes | (Auth UID) | Firebase Auth user ID (primary key) |
| `email` | string | Yes | - | User's email address |
| `role` | string | Yes | `"customer"` | User role: `"customer"` or `"admin"` |
| `phone_number` | string | No | `null` | Contact number for order notifications |
| `created_at` | timestamp | Yes | (now) | Account creation timestamp |
| `last_login` | timestamp | No | `null` | Most recent login timestamp |
| `total_orders` | number | Yes | `0` | Lifetime order count |
| `favorite_items` | string[] | No | `[]` | Array of frequently ordered item IDs |

**Indexes:**
- Compound index: `(role, created_at)` for admin user queries
- Single field: `email` (automatic) for login lookups

**Security Rules:**
```javascript
match /users/{userId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow write: if request.auth != null && request.auth.uid == userId;
  // Admins can read all users for analytics
  allow read: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin";
}
```

**Design Decisions:**
- **Denormalization:** `total_orders` cached to avoid counting orders collection every time
- **Role-based access:** Hardcoded admin email check in application logic (see Section 4.5)
- **Minimal PII:** Only store essential information to reduce privacy concerns

---

#### Collection: `menu_items`

**Purpose:** Store cafe menu items with customization options.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | string | Yes | (auto) | Unique document ID |
| `name` | string | Yes | - | Item display name |
| `description` | string | Yes | - | Detailed description with ingredients |
| `category` | string | Yes | - | Category: `"Drink"`, `"Food"`, `"Dessert"` |
| `price` | number | Yes | - | Base price in USD |
| `image_url` | string | No | `null` | Product image URL (Unsplash or custom) |
| `is_active` | boolean | Yes | `true` | Whether item appears on menu |
| `is_available` | boolean | Yes | `true` | Whether item is currently in stock |
| `customization_options` | object[] | No | `[]` | Available customizations (see below) |
| `created_at` | timestamp | Yes | (now) | Item creation timestamp |
| `updated_at` | timestamp | Yes | (now) | Last modification timestamp |

**Customization Options Structure:**
```typescript
{
  id: string;              // Option group ID (e.g., "milk_type")
  name: string;            // Display name (e.g., "Milk Type")
  type: "single" | "multiple"; // Selection type
  required: boolean;       // Whether selection is mandatory
  options: {
    id: string;            // Option ID (e.g., "oat_milk")
    name: string;          // Display name (e.g., "Oat Milk")
    price: number;         // Additional cost (0 if free)
  }[]
}
```

**Example Document:**
```json
{
  "id": "abc123",
  "name": "Salted Caramel Mocha",
  "description": "Espresso, steamed milk, mocha sauce, and toffee nut syrup, topped with sweetened whipped cream, caramel drizzle and a blend of turbinado sugar and sea salt.",
  "category": "Coffee",
  "price": 5.50,
  "image_url": "https://images.unsplash.com/photo-1572442388796-11668a67e53d",
  "is_active": true,
  "is_available": true,
  "customization_options": [
    {
      "id": "milk_type",
      "name": "Milk Type",
      "type": "single",
      "required": true,
      "options": [
        { "id": "whole", "name": "Whole Milk", "price": 0 },
        { "id": "oat", "name": "Oat Milk", "price": 0.80 },
        { "id": "almond", "name": "Almond Milk", "price": 0.80 }
      ]
    }
  ],
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T14:45:00Z"
}
```

**Indexes:**
- Compound index: `(category, is_active, is_available)` for menu filtering
- Single field: `is_available` for sold-out queries

**Design Decisions:**
- **Soft deletes:** `is_active` flag instead of deleting documents (preserves order history)
- **Availability tracking:** Separate `is_available` allows temporary sold-out status without removing from menu
- **Nested customizations:** Embedded in document to avoid joins (Firestore doesn't support joins)
- **Snake_case naming:** Consistent with Firestore conventions and memory specification

---

#### Collection: `wine_items`

**Purpose:** Store wine list with sommelier-specific attributes.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | string | Yes | (auto) | Unique document ID (prefixed with "w") |
| `name` | string | Yes | - | Wine name |
| `description` | string | Yes | - | Tasting notes and characteristics |
| `price` | number | Yes | - | Price per glass/bottle |
| `region` | string | Yes | - | Wine region (e.g., "Napa Valley") |
| `grape_variety` | string | Yes | - | Primary grape (e.g., "Cabernet Sauvignon") |
| `food_pairings` | string[] | No | `[]` | Suggested food pairings |
| `image_url` | string | No | `null` | Bottle/wine image URL |
| `is_available` | boolean | Yes | `true` | Current availability |
| `tags` | string[] | No | `[]` | Tags for AI matching (e.g., ["bold", "fruity"]) |

**Example Document:**
```json
{
  "id": "w1",
  "name": "Caymus Cabernet Sauvignon",
  "description": "Full-bodied red wine with rich flavors of dark cherry, cocoa, and vanilla. Smooth tannins with a long finish.",
  "price": 18.00,
  "region": "Napa Valley, California",
  "grape_variety": "Cabernet Sauvignon",
  "food_pairings": ["Grilled steak", "Lamb chops", "Aged cheese"],
  "image_url": "https://images.unsplash.com/photo-wine-bottle",
  "is_available": true,
  "tags": ["red", "full-bodied", "bold", "dry"]
}
```

**Design Decisions:**
- **Separate collection:** Wines have different attributes than regular menu items
- **Tags for AI:** Explicit tags help LLM match user preferences (e.g., "I want something fruity")
- **Food pairings:** Enables sommelier to suggest wines based on food orders

---

#### Collection: `orders`

**Purpose:** Store customer orders with full details for tracking and analytics.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | string | Yes | (auto) | Unique order ID |
| `user_id` | string | Yes | - | Reference to users collection |
| `items` | object[] | Yes | - | Array of ordered items with customizations |
| `subtotal` | number | Yes | - | Sum of item prices before tax |
| `tax` | number | Yes | - | Calculated tax amount |
| `total_amount` | number | Yes | - | Final total (subtotal + tax) |
| `status` | string | Yes | `"pending"` | Order status (see below) |
| `order_type` | string | Yes | `"pickup"` | `"pickup"` or `"delivery"` |
| `created_at` | timestamp | Yes | (now) | Order placement time |
| `updated_at` | timestamp | Yes | (now) | Last status update time |
| `estimated_ready` | timestamp | No | `null` | Predicted completion time |
| `notes` | string | No | `""` | Special instructions |

**Order Status Enum:**
- `"pending"`: Order received, awaiting kitchen acknowledgment
- `"preparing"`: Kitchen actively preparing order
- `"ready"`: Order complete, ready for pickup
- `"completed"`: Customer has picked up order
- `"cancelled"`: Order cancelled (by customer or admin)

**Items Array Structure:**
```typescript
{
  item_id: string;         // Reference to menu_items
  name: string;            // Denormalized name (in case item deleted)
  base_price: number;      // Price at time of order
  quantity: number;        // Number of this item
  customizations: {        // Selected options
    [optionGroupId]: string | string[];
  };
  customization_total: number; // Extra cost from customizations
}
```

**Example Document:**
```json
{
  "id": "order_xyz789",
  "user_id": "user_abc123",
  "items": [
    {
      "item_id": "menu_item_1",
      "name": "Salted Caramel Mocha",
      "base_price": 5.50,
      "quantity": 1,
      "customizations": {
        "milk_type": "oat"
      },
      "customization_total": 0.80
    }
  ],
  "subtotal": 6.30,
  "tax": 0.50,
  "total_amount": 6.80,
  "status": "preparing",
  "order_type": "pickup",
  "created_at": "2024-01-20T15:30:00Z",
  "updated_at": "2024-01-20T15:32:00Z",
  "estimated_ready": "2024-01-20T15:45:00Z",
  "notes": ""
}
```

**Indexes:**
- Compound index: `(status, created_at)` for order queue sorting
- Single field: `user_id` for order history queries
- TTL index: Auto-archive completed orders after 90 days [PLACEHOLDER]

**Design Decisions:**
- **Denormalization:** Item names and prices stored in order (snapshot in time)
  - Rationale: Menu prices may change; historical orders should reflect original prices
  - Trade-off: Increased storage cost, but necessary for accuracy
- **Status tracking:** Enables real-time order progress visualization
- **Estimated ready time:** Calculated based on kitchen workload (future enhancement)

---

### 4.3.3 Data Flow Diagrams

#### DFD Level 0: Context Diagram

```
         ┌─────────────┐
         │   Customer  │
         └──────┬──────┘
                │ Places orders, gets recommendations
                ▼
┌───────────────────────────────────────┐
│                                       │
│         Smart Cafe System             │◄──────┐
│                                       │       │
└───────────────┬───────────────────────┘       │
                │                               │
                │ Provides analytics, insights  │
                ▼                               │
         ┌─────────────┐                       │
         │   Admin/    │───────────────────────┘
         │   Manager   │  Updates menu, monitors orders
         └─────────────┘
```

#### DFD Level 1: Major Processes

```
┌──────────┐     ┌──────────────────┐     ┌──────────────┐
│ Customer │────▶│  AI Recommender  │────▶│   Firestore   │
│  Input   │     │  (Groq API)      │     │   Database    │
└──────────┘     └──────────────────┘     └──────┬───────┘
                                                 │
┌──────────┐     ┌──────────────────┐           │
│  Admin   │────▶│ Order Management │◀──────────┘
│ Actions  │     │  (Real-time)     │
└──────────┘     └──────────────────┘
```

### 4.3.4 Data Validation Rules

**Client-Side Validation:**
- Required fields checked before form submission
- Price inputs restricted to positive numbers with 2 decimal places
- Image URLs validated with regex pattern
- Text inputs limited to reasonable lengths (name: 100 chars, description: 500 chars)

**Server-Side Validation:**
- Firestore security rules enforce data types
- Cloud Functions validate business logic (e.g., total_amount matches items sum)
- AI input sanitized to prevent prompt injection attacks

**Consistency Checks:**
- Order total recalculated on server to prevent client tampering
- Inventory decremented atomically when order placed (future enhancement)
- User roles verified on every admin action

## 4.4 API Design

The system exposes RESTful API endpoints for AI services and integrates with Firebase for data operations.

### 4.4.1 Custom API Endpoints (Express Server)

#### Endpoint: POST `/api/chat`

**Purpose:** Process natural language queries and return AI-powered menu recommendations.

**Request:**
```typescript
{
  message: string;           // User's query (e.g., "I need energy")
  menuType: "cafe" | "wine"; // Which menu to search
  cartItems: Array<{         // Current cart contents (for context)
    id: string;
    quantity: number;
  }>;
  history: Array<{           // Conversation history
    role: "user" | "assistant";
    content: string;
  }>;
}
```

**Response:**
```typescript
{
  text: string;              // AI's natural language response
  items: MenuItem[];         // Recommended items with full details
  recommendedIds: string[];  // Item IDs for frontend matching
}
```

**Process Flow:**
1. Server receives request with user message
2. Fetches relevant menu items from Firestore (live data)
3. Constructs system prompt with menu context and business rules
4. Sends request to Groq API with Llama model
5. Parses JSON response from AI
6. Hydrates recommended item IDs with full item details from Firestore
7. Returns formatted response to client

**Error Handling:**
- 400: Invalid request format
- 429: Rate limit exceeded
- 500: AI service error (returns fallback response)

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I need something sour",
    "menuType": "cafe",
    "cartItems": [],
    "history": []
  }'
```

**Example Response:**
```json
{
  "text": "I don't see any specifically sour items on our current menu. However, our Green Tea has a slight tartness and refreshing quality. Would you like to try that?",
  "items": [
    {
      "id": "u8X2GGzFqgQEa37MmaGH",
      "name": "Green Tea",
      "description": "Organic Japanese green tea with delicate umami flavor",
      "price": 3.00,
      "category": "Drink",
      "image_url": "https://...",
      "is_available": true
    }
  ],
  "recommendedIds": ["u8X2GGzFqgQEa37MmaGH"]
}
```

**Security Considerations:**
- API key stored in environment variable (not exposed to client)
- Input sanitization prevents prompt injection
- Rate limiting protects against abuse
- CORS configured to only accept requests from approved origins

---

#### Endpoint: POST `/api/insights`

**Purpose:** Generate AI-powered business insights from order data for admin dashboard.

**Request:**
```typescript
{
  orders: Order[];           // Recent orders for analysis
  menuItems: MenuItem[];     // Current menu for context
}
```

**Response:**
```typescript
{
  sentiment: string;         // Overall customer sentiment ("Positive", "Mixed", etc.)
  peakTime: string;          // Busiest time period ("10:45 AM")
  insight: string;           // Actionable business insight
}
```

**Use Case:** Admin views dashboard → System sends today's orders → AI analyzes patterns → Returns insights like "Customers are asking for more non-dairy dessert options today. Consider highlighting the Vegan Tart."

**[PLACEHOLDER]:** Currently returns mock data; full implementation planned.

---

### 4.4.2 Firebase Integration Patterns

#### Pattern 1: Real-Time Listeners (Kitchen Display)

```typescript
import { collection, query, where, onSnapshot } from 'firebase/firestore';

// Subscribe to pending orders
const ordersRef = collection(db, 'orders');
const q = query(ordersRef, where('status', 'in', ['pending', 'preparing']));

onSnapshot(q, (snapshot) => {
  const orders = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  // Update UI with latest orders
  setOrders(orders);
  
  // Play notification for new orders
  if (snapshot.docChanges().some(change => change.type === 'added')) {
    playNotificationSound();
  }
});
```

**Benefits:**
- Automatic reconnection on network issues
- Batched updates for efficiency
- Local cache for offline support

---

#### Pattern 2: Atomic Operations (Order Creation)

```typescript
import { runTransaction } from 'firebase/firestore';

async function placeOrder(userId: string, items: CartItem[]) {
  const orderRef = doc(collection(db, 'orders'));
  
  await runTransaction(db, async (transaction) => {
    // Calculate total
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    // Create order document
    transaction.set(orderRef, {
      user_id: userId,
      items: items,
      total_amount: total,
      status: 'pending',
      created_at: serverTimestamp(),
      // ... other fields
    });
    
    // Increment user's order count
    const userRef = doc(db, 'users', userId);
    transaction.update(userRef, {
      total_orders: increment(1)
    });
  });
}
```

**Benefits:**
- Ensures consistency (both operations succeed or both fail)
- Prevents race conditions
- Automatic retry on transient failures

---

#### Pattern 3: Optimistic Updates (Cart Management)

```typescript
// Optimistically add to cart
const optimisticItem = { ...item, tempId: Date.now() };
setCart(prev => [...prev, optimisticItem]);

try {
  // Attempt to persist (if needed)
  await addToCartAPI(item);
} catch (error) {
  // Rollback on failure
  setCart(prev => prev.filter(i => i.tempId !== optimisticItem.tempId));
  toast.error('Failed to add item. Please try again.');
}
```

**Benefits:**
- Immediate UI feedback (feels faster)
- Graceful degradation on errors
- Improved perceived performance

---

### 4.4.3 API Versioning Strategy

**Current Approach:** No explicit versioning (v1 implied)

**Rationale:**
- Single client application (no third-party integrations yet)
- Breaking changes communicated via deployment coordination
- Backward compatibility maintained where possible

**Future Considerations:**
- If mobile apps or third-party integrations emerge, implement URL versioning: `/api/v1/chat`, `/api/v2/chat`
- Deprecation policy: Support previous version for 3 months after new release
- Version negotiation via Accept header [PLACEHOLDER]

## 4.5 Security Architecture

Security is implemented at multiple layers following defense-in-depth principles.

### 4.5.1 Authentication Layer

#### Firebase Authentication Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────┐
│  Client  │────▶│   Firebase   │────▶│   Identity   │────▶│  Client  │
│  App     │     │   Auth SDK   │     │   Provider   │     │  (Token) │
└──────────┘     └──────────────┘     └──────────────┘     └──────────┘
                       │                                        │
                       │                                        │
                       ▼                                        ▼
                  Stores token                         Attaches to requests
                  in memory                            to Firebase services
```

**Token Lifecycle:**
1. User logs in (email/password or Google OAuth)
2. Firebase Auth issues JWT token (expires in 1 hour)
3. Token automatically refreshed by SDK before expiration
4. Token included in all Firestore requests
5. Firestore security rules validate token

**Session Management:**
- Tokens stored in memory (not localStorage) to prevent XSS theft
- Refresh tokens handled automatically by Firebase SDK
- Logout revokes token and clears session

---

### 4.5.2 Authorization Layer

#### Role-Based Access Control (RBAC)

**Admin Detection Strategy:**
```typescript
// Hardcoded admin email check (application layer)
const ADMIN_EMAILS = ['harookhan0119@gmail.com'];

function isAdmin(user: User): boolean {
  return ADMIN_EMAILS.includes(user.email);
}

// Route protection
<Route 
  path="/admin/*" 
  element={
    isAuthenticated && isAdmin(currentUser) 
      ? <AdminLayout /> 
      : <Navigate to="/" />
  } 
/>
```

**Rationale for Hardcoding:**
- Small team with known administrators
- Avoids chicken-and-egg problem (need admin to create first admin)
- Can migrate to database-stored roles in future

**Firestore Security Rules (Database Layer):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection
    match /users/{userId} {
      // Users can read/write their own profile
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Admins can read all users
      allow read: if request.auth != null && 
        request.auth.token.email == 'harookhan0119@gmail.com';
    }
    
    // Menu items
    match /menu_items/{itemId} {
      // Anyone can read active menu
      allow read: if true;
      
      // Only admins can modify menu
      allow write: if request.auth != null && 
        request.auth.token.email == 'harookhan0119@gmail.com';
    }
    
    // Orders
    match /orders/{orderId} {
      // Users can read their own orders
      allow read: if request.auth != null && 
        resource.data.user_id == request.auth.uid;
      
      // Admins can read all orders
      allow read: if request.auth != null && 
        request.auth.token.email == 'harookhan0119@gmail.com';
      
      // Anyone can create orders (authenticated)
      allow create: if request.auth != null;
      
      // Only admins can update order status
      allow update: if request.auth != null && 
        request.auth.token.email == 'harookhan0119@gmail.com';
    }
  }
}
```

**Security Rule Principles:**
- Default deny: All rules start restrictive, explicitly grant access
- Least privilege: Users only access what they need
- Defense in depth: Application-layer checks + database rules

---

### 4.5.3 Data Protection

#### Encryption

**In Transit:**
- All API communications use HTTPS/TLS 1.2+
- Firebase services enforce SSL automatically
- Certificate pinning not implemented (browser limitation)

**At Rest:**
- Firebase encrypts all data automatically (AES-256)
- API keys stored in environment variables (not in code)
- [PLACEHOLDER]: Sensitive fields (phone numbers) could use application-level encryption

#### API Key Management

**.env File (Not Committed to Git):**
```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxx
VITE_GROQ_API_KEY=gsk_xxxxxxxxxxxxx
FIREBASE_API_KEY=AIzaSy...
```

**Git Ignore:**
```gitignore
# Environment variables
.env
.env.local
.env.production
```

**Deployment:**
- Platform-specific secret management (Vercel, Netlify, Heroku)
- Keys injected at build/runtime, never in bundle

---

### 4.5.4 Input Validation and Sanitization

#### Client-Side Validation

**Form Validation Example:**
```typescript
function validateMenuItem(data: MenuItemForm): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!data.name || data.name.length < 2) {
    errors.push({ field: 'name', message: 'Name must be at least 2 characters' });
  }
  
  if (!data.price || data.price <= 0) {
    errors.push({ field: 'price', message: 'Price must be positive' });
  }
  
  if (data.image_url && !isValidUrl(data.image_url)) {
    errors.push({ field: 'image_url', message: 'Invalid URL format' });
  }
  
  return errors;
}
```

**Sanitization:**
- React automatically escapes HTML in JSX (prevents XSS)
- User input displayed as text, not innerHTML
- URLs validated before rendering in `<img>` tags

---

#### Server-Side Validation

**AI Input Sanitization:**
```typescript
// Prevent prompt injection
function sanitizeInput(input: string): string {
  // Remove potential prompt injection patterns
  return input
    .replace(/ignore previous instructions/gi, '')
    .replace(/system:/gi, '')
    .substring(0, 1000); // Limit length
}
```

**Output Validation:**
```typescript
// Ensure AI returns valid JSON
try {
  const aiData = JSON.parse(rawText);
  // Validate structure
  if (!aiData.text || !Array.isArray(aiData.recommended_item_ids)) {
    throw new Error('Invalid AI response structure');
  }
} catch (parseError) {
  // Fallback to safe default
  return { text: 'Sorry, I encountered an error.', items: [] };
}
```

---

### 4.5.5 Threat Modeling

#### Identified Threats and Mitigations

| Threat | Likelihood | Impact | Mitigation |
|--------|------------|--------|------------|
| **SQL Injection** | Low | High | Not applicable (NoSQL database) |
| **XSS Attacks** | Medium | High | React auto-escaping, CSP headers [PLACEHOLDER] |
| **CSRF Attacks** | Low | Medium | Firebase tokens immune to CSRF |
| **API Key Theft** | Medium | High | Keys in env vars, not client-side |
| **Unauthorized Admin Access** | Low | Critical | Hardcoded email check + Firestore rules |
| **Prompt Injection** | Medium | Medium | Input sanitization, system prompt isolation |
| **Rate Limit Abuse** | Medium | Low | Groq API rate limits, client-side caching |
| **Data Breach** | Low | Critical | Firebase encryption, minimal PII storage |
| **Denial of Service** | Low | Medium | Firebase auto-scaling, rate limiting |

#### Security Testing Plan

**[PLACEHOLDER]: Planned Security Audits**
- Penetration testing before production deployment
- Dependency vulnerability scanning (npm audit)
- Firestore rules simulator testing
- OWASP Top 10 compliance check

## 4.6 User Interface Design Principles

UI design follows Material Design 3 guidelines with custom branding for Smart Cafe aesthetic.

### 4.6.1 Design System

#### Color Palette

**Primary Colors:**
- `--color-primary`: #26170C (Deep brown - coffee-inspired)
- `--color-secondary`: #8B5E3C (Warm caramel)
- `--color-tertiary`: #D4A574 (Light tan)

**Semantic Colors:**
- Success: #4CAF50 (Green for confirmations)
- Warning: #FF9800 (Orange for alerts)
- Error: #F44336 (Red for errors)
- Info: #2196F3 (Blue for information)

**Neutral Scale:**
- Surface backgrounds: #FAFAFA to #F5F5F5
- Text primary: #212121
- Text secondary: #757575
- Dividers: #E0E0E0

**Accessibility:**
- All text meets WCAG AA contrast ratio (4.5:1 minimum)
- Color not sole indicator (icons accompany color-coded statuses)
- Dark mode support [PLACEHOLDER]

---

#### Typography

**Font Families:**
- Headings: Playfair Display (serif, elegant)
- Body: Inter (sans-serif, highly readable)
- Labels: Space Grotesk (modern, uppercase tracking)

**Type Scale:**
```
Display:  48px / 3rem  (Hero sections)
H1:       36px / 2.25rem (Page titles)
H2:       30px / 1.875rem (Section headers)
H3:       24px / 1.5rem (Card titles)
Body:     16px / 1rem (Default text)
Small:    14px / 0.875rem (Secondary text)
Caption:  12px / 0.75rem (Labels, timestamps)
```

**Hierarchy Principles:**
- Larger = More important
- Bold = Actionable or key information
- Italic = Emphasis or AI-generated content
- Uppercase + tracking = Labels and metadata

---

#### Spacing System

**8px Grid:**
All spacing uses multiples of 8px for consistency:
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px
- 3xl: 64px

**Application:**
- Component padding: `p-4` (16px), `p-6` (24px)
- Gap between elements: `gap-4` (16px)
- Section margins: `mb-16` (64px)

---

### 4.6.2 Component Design Patterns

#### Pattern 1: Cards

**Usage:** Menu items, recommendations, order summaries

**Structure:**
```
┌─────────────────────────────┐
│  [Image]                    │
│                             │
│  Title         $Price       │
│  Description (truncated)    │
│                             │
│  [Action Button]            │
└─────────────────────────────┘
```

**Design Rules:**
- Rounded corners: `rounded-xl` (12px radius)
- Shadow: `shadow-md` for elevation
- Hover effect: Scale up 2% (`hover:scale-[1.02]`)
- Consistent aspect ratio for images

---

#### Pattern 2: Modals

**Usage:** Item customization, admin forms

**Structure:**
```
┌──────────────────────────────────┐
│  [Backdrop - semi-transparent]   │
│                                  │
│  ┌────────────────────────────┐  │
│  │  Header (Title + Close)    │  │
│  ├────────────────────────────┤  │
│  │                            │  │
│  │  Content (scrollable)      │  │
│  │                            │  │
│  ├────────────────────────────┤  │
│  │  Footer (Actions)          │  │
│  └────────────────────────────┘  │
│                                  │
└──────────────────────────────────┘
```

**Behavior:**
- Slide up from bottom on mobile
- Center on desktop
- Backdrop click closes modal
- Escape key closes modal
- Focus trap inside modal

---

#### Pattern 3: Buttons

**Hierarchy:**
1. **Primary:** Solid background, bold text (main actions)
   - Example: "Add to Cart", "Place Order"
2. **Secondary:** Outlined or lighter background (alternative actions)
   - Example: "Customize", "Cancel"
3. **Tertiary:** Text-only (low-emphasis actions)
   - Example: "View Details", "Learn More"

**States:**
- Default: Normal appearance
- Hover: Slightly darker, cursor pointer
- Active: Pressed effect (scale down 2%)
- Disabled: 50% opacity, no pointer events
- Loading: Spinner replaces text

**Sizes:**
- Small: `py-2 px-4` (secondary actions)
- Medium: `py-3 px-6` (default)
- Large: `py-4 px-8` (primary CTAs)

---

### 4.6.3 Responsive Design Strategy

#### Breakpoints

```typescript
const breakpoints = {
  sm: '640px',   // Small phones
  md: '768px',   // Tablets
  lg: '1024px',  // Laptops
  xl: '1280px',  // Desktops
  '2xl': '1536px' // Large screens
};
```

#### Layout Adaptations

**Mobile (< 768px):**
- Single column layout
- Bottom navigation bar
- Full-width cards
- Hamburger menu for admin
- Swipe gestures for carousels

**Tablet (768px - 1024px):**
- Two-column grid for menu
- Side drawer for filters
- Larger touch targets

**Desktop (> 1024px):**
- Three-column grid for menu
- Persistent sidebar for admin
- Hover effects enabled
- Keyboard shortcuts available

---

### 4.6.4 Accessibility Features

#### Keyboard Navigation

**Tab Order:**
- Logical flow matching visual layout
- Skip links for main content
- Focus indicators (outline rings)

**Keyboard Shortcuts:**
- `Esc`: Close modals
- `Enter`: Submit forms
- `Space`: Toggle checkboxes
- Arrow keys: Navigate carousels

---

#### Screen Reader Support

**ARIA Attributes:**
```tsx
<button 
  aria-label="Add Salted Caramel Mocha to cart"
  aria-disabled={isSoldOut}
>
  Add to Cart
</button>

<div role="alert" aria-live="polite">
  Item added to cart successfully
</div>
```

**Semantic HTML:**
- `<nav>` for navigation
- `<main>` for primary content
- `<article>` for menu items
- `<button>` for actions (not `<div onClick>`)

---

#### Motion Preferences

**Respect User Settings:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Implementation:**
- Fade transitions instead of slides for reduced motion
- Disable parallax effects
- Instant state changes (no animations)

---

### 4.6.5 Microinteractions

#### Purposeful Animations

**Feedback:**
- Button press: Scale down 5% then back
- Cart addition: Item flies to cart icon
- Form error: Shake animation on invalid field

**Guidance:**
- Loading spinners indicate processing
- Progress bars show multi-step flows
- Skeleton screens during data fetch

**Delight:**
- Confetti on first order completion [PLACEHOLDER]
- Smooth page transitions
- Subtle hover lifts on cards

**Performance Considerations:**
- Use CSS transforms (GPU-accelerated)
- Avoid animating layout properties (width, height)
- Throttle scroll-based animations
- Lazy-load heavy animations

---

**[END OF PART 2]**

This completes Chapters 3-4 covering Requirements Analysis and System Architecture.

**Key Takeaways:**
- Comprehensive stakeholder needs analysis
- Detailed functional/non-functional requirements
- Justified technology stack selections
- Robust database schema with real-world examples
- Multi-layered security architecture
- Thoughtful UI/UX design principles

**Next Parts:**
- Part 3: Chapter 5 (Implementation Details)
- Part 4: Chapters 6-7 (Testing & Results)
- Part 5: Chapters 8-9 (Future Work & Conclusion)

Would you like me to proceed with Part 3 (Implementation), or would you prefer to review and provide feedback on Parts 1-2 first?