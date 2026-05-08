# 🧭 WanderLust - Premium Airbnb Clone (AI-Powered)

WanderLust is a full-stack, high-performance travel marketplace application that allows users to discover, book, and host unique accommodations around the world. Built with a focus on modern UI/UX, real-time interactions, and **Dual-Core AI Integration**.

---

## 🚀 Key Features

### 🤖 Dual-Core AI Integration
- **AI Property Assistant**: A floating chatbot powered by **Groq Llama 3.3 AI** that answers guest questions (parking, price, location) based on specific property details.
- **AI Smart Description Generator**: A magic writing tool for hosts. Enter a title, and the AI writes a professional, high-converting property description instantly.
- **Instant Intelligence**: Real-time property-specific data processing to assist both guests and hosts.

### 🏠 For Guests
- **Discovery Map**: Explore properties geographically using a full-screen interactive Mapbox integration with real-time price markers.
- **Smart Search & Filters**: Search-as-you-type destination search and category-based filtering (Pools, Farms, Castles, etc.) with AJAX updates.
- **Booking System**: Request stays with real-time availability checking to prevent double-booking.
- **Photo Reviews**: Share your experience with star ratings and actual travel photos uploaded via Cloudinary.
- **Real-time Wishlist**: Save your favorite properties instantly with a single heart tap.

### 💼 For Hosts
- **Host Dashboard**: Professional analytics showing total earnings, booking stats, and a 6-month revenue chart powered by Chart.js.
- **Booking Approval**: Full control over your property with the ability to Approve or Reject incoming guest requests.
- **Listing Management**: Create and edit property details, including high-quality image uploads.

### 🛡️ Advanced Security & Privacy
- **Secure Password Change**: Users can safely update their credentials after verifying their current password.
- **Danger Zone**: One-click permanent account deletion for user privacy and GDPR compliance.
- **Initial-Based Avatars**: Smart profile logic that fallback to beautiful initial-based avatars if no photo is uploaded, ensuring zero broken images.

### 📱 Premium UX/UI
- **Mobile Optimized**: Airbnb-style fixed bottom navigation and responsive glassmorphism UI.
- **Dark Mode**: Fully integrated system-aware dark mode for comfortable late-night browsing.
- **Flash Notifications**: Modern, auto-dismissing floating notifications for instant feedback.

---

## 🛠️ Tech Stack

- **Frontend**: EJS (Embedded JavaScript), Tailwind CSS, Vanilla JS, Font Awesome.
- **Backend**: Node.js, Express.js.
- **AI Engine**: Groq Cloud API (Llama 3.3 70B model).
- **Database**: MongoDB (Mongoose ODM).
- **Authentication**: Passport.js with Local Strategy.
- **Cloud Storage**: Cloudinary (via Multer) for images.
- **Maps**: Mapbox GL JS API.
- **Charts**: Chart.js for host analytics.

---

## 📂 Project Structure

```text
├── controllers/        # Business Logic (Listings, Reviews, Users, AI Chat)
├── models/             # Mongoose Schemas (Listing, Review, User, Booking)
├── routes/             # Express Routers
├── views/              # EJS Templates (Layouts, Includes, Listings, Users)
├── public/             # Static Assets (CSS, JS, Images)
├── middleware.js       # Authentication & Authorization guards
├── cloudConfig.js      # Cloudinary & Multer configuration
└── app.js              # Application Entry Point
```

---

## ⚙️ Setup & Installation

1. **Clone the repository**:
   ```bash
   git clone <your-repo-link>
   cd AirBnb
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Environment Variables**:
   Create a `.env` file in the root directory and add:
   ```env
   CLOUD_NAME=your_cloudinary_name
   CLOUD_API_KEY=your_api_key
   CLOUD_API_SECRET=your_api_secret
   MAP_TOKEN=your_mapbox_token
   GROQ_API_KEY=your_groq_ai_key
   ATLASDB_URL=your_mongodb_uri
   SECRET=your_session_secret
   ```

4. **Start the Server**:
   ```bash
   npm start
   ```
   Open `http://localhost:8080` in your browser.

---

## 👨‍💻 Built By
**Ankit** - *Lead Developer*

Built with ❤️ for travelers and explorers.
