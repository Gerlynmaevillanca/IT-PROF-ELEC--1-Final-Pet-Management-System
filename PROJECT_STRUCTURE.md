# Project Structure After Supabase Integration

```
Villanca/
├── src/
│   ├── lib/
│   │   ├── supabase.js                 # ✅ Supabase client (minimal)
│   │   ├── auth.js                     # ✅ Authentication functions
│   │   ├── pets.js                     # ✅ Pet management functions
│   │   ├── applications.js             # ✅ Adoption application functions
│   │   ├── messaging.js                # ✅ Messaging functions
│   │   ├── notifications.js            # ✅ Notification functions
│   │   ├── reports.js                  # ✅ Statistics & reports functions
│   │   ├── sounds.js                   # ✅ Sound analysis functions
│   │   └── ai.js                       # (Existing Gemini integration)
│   │
│   ├── components/
│   │   ├── Layout.jsx
│   │   ├── Header.jsx
│   │   ├── Sidebar.jsx
│   │   ├── AdminLayout.jsx
│   │   ├── AdminSidebar.jsx
│   │   ├── ChatbotWidget.jsx
│   │   └── ... (other components)
│   │
│   ├── pages/
│   │   ├── LoginPage.jsx               # ← Uses auth.js
│   │   ├── SignupPage.jsx              # ← Uses auth.js
│   │   ├── LandingPage.jsx
│   │   ├── BrowsePetsPage.jsx          # ← Uses pets.js
│   │   ├── ApplicationPage.jsx         # ← Uses applications.js, messaging.js
│   │   ├── ApplicationAdminPage.jsx    # ← Uses applications.js, notifications.js
│   │   ├── BrowsePetsAdminPage.jsx     # ← Uses pets.js, reports.js
│   │   ├── AdminDashboardPage.jsx      # ← Uses reports.js, applications.js
│   │   └── ... (other pages)
│   │
│   ├── App.jsx
│   ├── main.jsx
│   ├── index.css
│   └── assets/
│
├── public/
│
├── supabase_schema.sql                 # ✅ Database schema (execute in Supabase)
├── SUPABASE_INTEGRATION_GUIDE.md       # ✅ Complete setup guide
├── FUNCTION_IMPORTS_REFERENCE.md       # ✅ Quick reference with examples
├── SETUP_COMPLETE.md                   # ✅ Summary of all changes
│
├── package.json
├── vite.config.js
├── eslint.config.js
├── README.md
└── .env.local                          # ← Add these variables:
                                        #   VITE_SUPABASE_URL=...
                                        #   VITE_SUPABASE_ANON_KEY=...
```

## Database Schema Structure (in Supabase)

```
Public Schema
├── Tables
│   ├── users                           # User profiles with roles
│   ├── pets                            # Pet listings
│   ├── adoption_applications           # Application forms
│   ├── conversations                   # Messaging conversations
│   ├── messages                        # Individual messages
│   ├── notifications                   # User notifications
│   └── sound_analysis                  # Gemini sound analysis results
│
├── Indexes
│   ├── idx_users_email
│   ├── idx_users_role
│   ├── idx_pets_category
│   ├── idx_pets_status
│   ├── idx_adoption_applications_status
│   ├── idx_messages_conversation_id
│   ├── idx_notifications_user_id
│   └── ... (8+ more)
│
├── Functions
│   └── update_updated_at_column()      # Auto timestamp updates
│
├── Triggers
│   ├── update_users_updated_at
│   ├── update_pets_updated_at
│   ├── update_adoption_applications_updated_at
│   └── update_conversations_updated_at
│
└── RLS Policies
    ├── users (4 policies)
    ├── pets (4 policies)
    ├── adoption_applications (5 policies)
    ├── conversations (2 policies)
    ├── messages (3 policies)
    ├── notifications (3 policies)
    └── sound_analysis (2 policies)

Storage Buckets
├── pet-images/                         # Pet photos (public)
│   └── pets/{petId}/{timestamp}.jpg
│
└── animal-sounds/                      # Audio files (public)
    └── sounds/{petId}/{timestamp}.mp3
```

## Authentication Flow Diagram

```
User (Frontend)
    │
    ├── Sign Up
    │   ├── auth.js: signUp(email, password, fullname, role)
    │   │
    │   ├─> Create in auth.users (email, password)
    │   │    - Stores fullname in user_metadata
    │   │
    │   └─> Create in public.users (fullname, role)
    │        - Trigger syncs metadata to public.users
    │
    ├── Sign In
    │   ├── auth.js: signIn(email, password)
    │   │
    │   └─> Returns { user, profile, session }
    │
    └── Get Current User
        ├── auth.js: getCurrentUser()
        │
        └─> Returns { user: authUser, profile: userProfile }
```

## Feature Implementation Map

### 1. Pet Management
```
BrowsePetsPage.jsx
  └── uses pets.js
      ├── getAllPets()
      ├── getAvailablePets()
      ├── getPetsByCategory()
      └── getPetById()

BrowsePetsAdminPage.jsx
  └── uses pets.js
      ├── addPet()
      ├── updatePet()
      ├── updatePetStatus()
      ├── uploadPetImage()
      └── deletePet()
```

### 2. Adoption Applications
```
ApplicationPage.jsx
  └── uses applications.js
      ├── submitApplication()
      └── getApplicationsByUser()

ApplicationAdminPage.jsx
  └── uses applications.js
      ├── getPendingApplications()
      ├── approveApplication()
      └── declineApplication()
```

### 3. Messaging
```
ChatbotWidget.jsx / MessagingComponent
  └── uses messaging.js
      ├── createOrGetConversation()
      ├── sendMessage()
      ├── getConversationMessages()
      ├── getUserConversations()
      └── markMessageAsRead()
```

### 4. Admin Dashboard
```
AdminDashboardPage.jsx
  └── uses reports.js
      ├── getOverallStatistics()
      ├── getAdoptionStatistics()
      ├── getPetCategoryDemand()
      ├── getAdoptionRate()
      └── generateCustomReport()
```

### 5. Notifications
```
NotificationBell / NotificationCenter
  └── uses notifications.js
      ├── getUserNotifications()
      ├── getUnreadNotifications()
      ├── markNotificationAsRead()
      └── getUnreadNotificationCount()
```

### 6. Sound Analysis
```
PetDetailPage.jsx / SoundAnalysisComponent
  └── uses sounds.js
      ├── uploadAnimalSound()
      ├── saveSoundAnalysis()
      ├── getPetSoundAnalyses()
      └── formatGeminiAnalysis()
```

## Function Call Flow Example

```
User clicks "Apply for Pet" in ApplicationPage.jsx
    │
    ├── Calls: submitApplication(applicationData, userId)
    │   Location: src/lib/applications.js
    │   │
    │   ├── Validates input
    │   ├── Calls Supabase insert
    │   │   - Inserts into adoption_applications table
    │   │   - RLS checks: auth.uid() = user_id
    │   │   - Automatic timestamps via trigger
    │   │
    │   └── Returns: { success, message, application, error }
    │
    └── Component receives result
        ├── if success: show confirmation
        └── if error: display error message
```

## Data Flow with RLS Security

```
User Request
    │
    ├── Auth Check (Supabase handles)
    │   ├── If not authenticated → ERROR
    │   └── If authenticated → Continue
    │
    ├── RLS Policy Check
    │   ├── Does user role allow operation? → YES/NO
    │   ├── Does user own the resource? → YES/NO
    │   ├── Is user staff/admin? → YES/NO
    │   └── All checks must pass
    │
    ├── Operation Execution (if passed)
    │   ├── SELECT → Only returns user's data
    │   ├── INSERT → Only creates new rows
    │   ├── UPDATE → Only updates allowed rows
    │   └── DELETE → Only deletes allowed rows
    │
    ├── Database Triggers (automatic)
    │   ├── Sync display_name if user metadata updated
    │   └── Update updated_at timestamps
    │
    └── Response to Client
        ├── success: true + data
        └── error: "Policy violation" or operation error
```

## Import Pattern for Each Page

```javascript
// LoginPage.jsx
import { signIn } from '@/lib/auth';

// SignupPage.jsx
import { signUp } from '@/lib/auth';

// BrowsePetsPage.jsx
import { getAvailablePets, getPetsByCategory } from '@/lib/pets';

// ApplicationPage.jsx
import { submitApplication } from '@/lib/applications';
import { createOrGetConversation, sendMessage } from '@/lib/messaging';

// ApplicationAdminPage.jsx
import { getPendingApplications, approveApplication, declineApplication } from '@/lib/applications';
import { createNotification } from '@/lib/notifications';

// AdminDashboardPage.jsx
import { getOverallStatistics, getAdoptionRate, getPetCategoryDemand } from '@/lib/reports';
import { getPendingApplications } from '@/lib/applications';

// BrowsePetsAdminPage.jsx
import { getAllPets, addPet, updatePetStatus, uploadPetImage } from '@/lib/pets';

// NotificationCenter.jsx
import { getUserNotifications, markNotificationAsRead } from '@/lib/notifications';

// PetDetailPage.jsx
import { getPetById } from '@/lib/pets';
import { uploadAnimalSound, saveSoundAnalysis } from '@/lib/sounds';
```

## Checklist for Integration

- [ ] Read `SETUP_COMPLETE.md` for overview
- [ ] Read `SUPABASE_INTEGRATION_GUIDE.md` for detailed setup
- [ ] Execute `supabase_schema.sql` in Supabase SQL Editor
- [ ] Create `pet-images` and `animal-sounds` storage buckets
- [ ] Add environment variables to `.env.local`
- [ ] Update `LoginPage.jsx` to use `signIn()` from auth.js
- [ ] Update `SignupPage.jsx` to use `signUp()` from auth.js
- [ ] Update `BrowsePetsPage.jsx` to use pets.js functions
- [ ] Update `ApplicationPage.jsx` to use applications.js functions
- [ ] Update `ApplicationAdminPage.jsx` for admin workflow
- [ ] Update `AdminDashboardPage.jsx` with reports.js
- [ ] Set up messaging component with messaging.js
- [ ] Add notification bell with notifications.js
- [ ] Integrate sound analysis with Gemini in sounds.js
- [ ] Test signup/login flow
- [ ] Test pet browsing
- [ ] Test application submission
- [ ] Test admin approval workflow
- [ ] Test messaging between users
- [ ] Deploy to production

---

All code is ready for integration. Use `FUNCTION_IMPORTS_REFERENCE.md` for copy-paste examples!
