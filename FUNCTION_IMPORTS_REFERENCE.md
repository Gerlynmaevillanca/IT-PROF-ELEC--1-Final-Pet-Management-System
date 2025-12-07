// Quick Reference: Importing Supabase Functions in Components

// ============================================
// AUTHENTICATION (SignUp, Login, Logout)
// ============================================
import { signUp, signIn, signOut, getCurrentUser, updateUserProfile } from '@/lib/auth';

// Usage in LoginPage.jsx
const handleLogin = async () => {
  const result = await signIn(email, password);
  if (result.success) {
    const { user, profile, session } = result;
    // Store in context/state
  }
};

// Usage in SignupPage.jsx
const handleSignup = async () => {
  const result = await signUp(email, password, confirmPassword, fullname, 'adopter');
  if (result.success) {
    // Show confirmation message
  } else {
    setError(result.error);
  }
};

// ============================================
// PET MANAGEMENT (Browse Pets, Add Pets)
// ============================================
import { 
  getAllPets, 
  getPetById, 
  getPetsByCategory, 
  getAvailablePets,
  addPet,
  updatePet,
  updatePetStatus,
  uploadPetImage 
} from '@/lib/pets';

// Usage in BrowsePetsPage.jsx
useEffect(() => {
  const fetchPets = async () => {
    const { pets } = await getAvailablePets();
    setPets(pets);
  };
  fetchPets();
}, []);

// Usage in ApplicationPage.jsx
const { pet } = await getPetById(petId);

// Usage in AdminPage.jsx (Add Pet)
const { pet } = await addPet({
  name, category, breed, age, age_unit, description
}, currentUserId);

// Upload pet image
const { imageUrl } = await uploadPetImage(imageFile, petId);

// ============================================
// ADOPTION APPLICATIONS (Submit, Review)
// ============================================
import { 
  submitApplication,
  getApplicationsByUser,
  getApplicationsByPet,
  getPendingApplications,
  approveApplication,
  declineApplication 
} from '@/lib/applications';

// Usage in ApplicationPage.jsx
const { application } = await submitApplication({
  pet_id: petId,
  living_situation,
  home_type,
  rent_or_own,
  // ... other form fields
}, currentUserId);

// Get user's applications
const { applications } = await getApplicationsByUser(userId);

// Usage in AdminDashboardPage.jsx
const { applications } = await getPendingApplications();

// Approve application
await approveApplication(applicationId, petId, staffUserId);

// Decline application
await declineApplication(applicationId, declineReason, staffUserId);

// ============================================
// MESSAGING & CONVERSATIONS
// ============================================
import { 
  createOrGetConversation,
  sendMessage,
  getConversationMessages,
  getUserConversations,
  markMessageAsRead,
  getUnreadCount 
} from '@/lib/messaging';

// Usage in messaging component
const { conversation } = await createOrGetConversation(currentUserId, otherUserId);
await sendMessage(conversationId, currentUserId, otherUserId, messageText);

const { messages } = await getConversationMessages(conversationId);

const { conversations } = await getUserConversations(currentUserId);

const { unreadCount } = await getUnreadCount(currentUserId);

// ============================================
// NOTIFICATIONS
// ============================================
import { 
  getUserNotifications,
  getUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification 
} from '@/lib/notifications';

// Usage in notification component
const { notifications } = await getUserNotifications(userId);
const { notifications } = await getUnreadNotifications(userId);

await markNotificationAsRead(notificationId);
await markAllNotificationsAsRead(userId);

// ============================================
// REPORTS & STATISTICS (Admin Dashboard)
// ============================================
import { 
  getOverallStatistics,
  getAdoptionStatistics,
  getPetCategoryDemand,
  getPetInventoryByCategory,
  getApplicationStatisticsByMonth,
  getAdoptionRate,
  generateCustomReport 
} from '@/lib/reports';

// Usage in AdminDashboardPage.jsx
useEffect(() => {
  const fetchStats = async () => {
    const { statistics } = await getOverallStatistics();
    const { adoptionRate } = await getAdoptionRate();
    const { categoryDemand } = await getPetCategoryDemand();
    setDashboardData({ statistics, adoptionRate, categoryDemand });
  };
  fetchStats();
}, []);

// Generate custom report with filters
const { report } = await generateCustomReport({
  status: 'Approved',
  startDate: new Date(2024, 0, 1),
  endDate: new Date()
});

// ============================================
// SOUND ANALYSIS (AI Feature with Gemini)
// ============================================
import { 
  uploadAnimalSound,
  saveSoundAnalysis,
  getPetSoundAnalyses,
  formatGeminiAnalysis 
} from '@/lib/sounds';

// Usage in PetDetailPage.jsx (Upload sound)
const { soundUrl } = await uploadAnimalSound(audioFile, petId);

// After Gemini API analysis
const formattedAnalysis = formatGeminiAnalysis(geminiResponse);
await saveSoundAnalysis(petId, soundUrl, formattedAnalysis);

// Get sound history
const { analyses } = await getPetSoundAnalyses(petId);

// ============================================
// PATTERN: Using in React Components
// ============================================

// Pattern 1: useEffect with dependency array
import { useState, useEffect } from 'react';
import { getPetsByCategory } from '@/lib/pets';

export default function CatAdopterPage() {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCats = async () => {
      const { success, pets } = await getPetsByCategory('cat');
      if (success) {
        setCats(pets);
      }
      setLoading(false);
    };
    fetchCats();
  }, []);

  return (
    <div>
      {loading ? <p>Loading...</p> : <PetList pets={cats} />}
    </div>
  );
}

// Pattern 2: Form submission with error handling
import { submitApplication } from '@/lib/applications';

export default function ApplicationForm({ petId, userId }) {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await submitApplication({
      pet_id: petId,
      living_situation: formData.living_situation,
      // ... other fields
    }, userId);

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">Application submitted!</div>}
      {/* form fields */}
    </form>
  );
}

// Pattern 3: Real-time updates with polling
import { useEffect } from 'react';
import { getUnreadNotifications } from '@/lib/notifications';

export default function NotificationBell({ userId }) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    // Poll for new notifications every 10 seconds
    const interval = setInterval(async () => {
      const { notifications } = await getUnreadNotifications(userId);
      setUnread(notifications.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [userId]);

  return <div className="bell">{unread}</div>;
}

// ============================================
// ERROR HANDLING PATTERN
// ============================================

// Always check result.success before using data
async function safeOperation() {
  const result = await someFunction();

  if (result.success) {
    // Use result.data or specific field like result.pet, result.user
    console.log(result.data);
  } else {
    // Handle error
    console.error('Error:', result.error);
    // Show user-friendly error message
  }
}

// ============================================
// CONTEXT EXAMPLE: Auth Context
// ============================================

import { createContext, useState, useEffect } from 'react';
import { getCurrentUser, signOut } from '@/lib/auth';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const result = await getCurrentUser();
      if (result.success) {
        setUser(result.user);
        setProfile(result.profile);
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const logout = async () => {
    await signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Usage in component
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';

function UserMenu() {
  const { user, profile, logout } = useContext(AuthContext);

  if (!user) return <LoginButton />;

  return (
    <div>
      <p>Welcome, {profile.fullname}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
