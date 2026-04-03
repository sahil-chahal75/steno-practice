export const siteConfig = {
  name: "StenoPulse", 
  adminName: "SAHIL CHAHAL",
  adminEmail: "sahilchahalkuk@gmail.com", // ✅ Tumhari sahi ID ab set hai
  heroMessage: "Focus, Type, and Conquer!",
  
  // 🎨 THEME COLORS
  theme: {
    primary: "#2563eb", 
    darkBg: "#0f172a",  
    darkCard: "#1e293b", 
    accent: "#10b981",   
  },

  // 📂 STENO & TYPING CATEGORIES (Combined for Admin & Home)
  categories: [
    // Steno Hub
    { id: "kc", name: "KC Magazine", icon: "📘", hasSubfolders: false },
    { 
      id: "prog", 
      name: "Progressive Magazine", 
      icon: "📈",
      hasSubfolders: true,
      years: ["2024", "2025", "2026", "2027", "2028"],
      months: [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ]
    },
    { id: "speed", name: "Speedography", icon: "⚡", hasSubfolders: false },
    { id: "misc", name: "Miscellaneous", icon: "📁", hasSubfolders: false },

    // Typing Arena (Inka ID Admin Panel ke options se match karta hai)
    { id: "gen", name: "General Typing", icon: "📄" },
    { id: "legal", name: "Legal Matter", icon: "⚖️" },
    { id: "tech", name: "Technology", icon: "💻" },
    { id: "essay", name: "Essay Typing", icon: "✍️" },
    { id: "poly", name: "Political Matter", icon: "🏛️" },
    { id: "misc_type", name: "Misc Typing", icon: "⌨️" }
  ],

  features: [
    "Modern Dictation Typing Tool",
    "Modern Automatic Calculator",
    "Full Detailed Result (Full/Half Mistake)",
    "Download Result (Original & Typed)",
    "Zero-Highlight Exam Mode"
  ]
};
