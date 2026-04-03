export const siteConfig = {
  name: "StenoPulse", 
  adminName: "SAHIL CHAHAL",
  adminEmail: "sahilchahalkuk@gmail.com", // Authorized Admin
  heroMessage: "Focus, Type, and Conquer!",
  
  // 🎨 DARK MODE & THEME COLORS
  theme: {
    primary: "#2563eb", // Blue-600
    darkBg: "#0f172a",  // Slate-900 (Main background)
    darkCard: "#1e293b", // Slate-800 (Boxes/Cards background)
    accent: "#10b981",   // Green-500 (Success/Qualified)
  },

  categories: [
    { id: "kc", name: "KC Magazine", icon: "📘" },
    { 
      id: "prog", 
      name: "Progressive Magazine", 
      icon: "📈",
      // ✨ NAYA: Nested Structure logic for Home.js
      hasSubfolders: true,
      years: ["2026", "2027", "2028"],
      months: [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ]
    },
    { id: "speed", name: "Speedography", icon: "⚡" },
    { id: "misc", name: "Miscellaneous Matter", icon: "📁" }
  ],

  features: [
    "Real Exam Interface",
    "Auto-Mistake Calculator",
    "Download PDF Result",
    "Global Leaderboard",
    "Dark Mode Support"
  ]
};
