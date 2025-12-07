# Villanca Pet Adoption System - Supabase Integration Guide

## Overview

This document provides complete setup and integration instructions for the Villanca Pet Adoption System with Supabase.

## Architecture

The project follows a modular approach where:
- **supabase.js**: Only contains the Supabase client initialization
- **Feature-specific utility files**: Each feature has its own file in `src/lib/`
  - `auth.js` - Authentication functions
  - `pets.js` - Pet management functions
  - `applications.js` - Adoption application functions
  - `messaging.js` - Messaging and conversation functions
  - `notifications.js` - Notification functions
  - `reports.js` - Statistics and reporting functions
  - `sounds.js` - Animal sound analysis functions

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy your **Project URL** and **Anon Key**

### 2. Environment Variables

Add to `.env.local`:

```
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Create Database Schema

1. Go to Supabase SQL Editor
2. Copy the entire SQL from `supabase_schema.sql`
3. Paste and execute it in the SQL Editor
4. This will create all tables, indexes, RLS policies, and triggers

### 4. Create Storage Buckets

In Supabase Storage:

1. Create a bucket named `pet-images` and make it public
2. Create a bucket named `animal-sounds` and make it public

## Database Schema Overview

### Tables

#### `users` (public)
- Links to `auth.users` via UUID
- Stores: fullname, role (adopter/staff/admin), phone, address, profile picture, bio
- RLS: Users can view all profiles, update their own, admins can manage roles

#### `pets`
- Stores: name, category, breed, age, gender, size, color, health status, vaccination status, status (Available/Reserved/Adopted)
- RLS: Anyone can view, only staff/admin can create/update/delete

#### `adoption_applications`
- Stores: application form data, status (Pending/Approved/Declined), review information
- RLS: Users see own applications, staff/admin see all

#### `conversations`
- Links two users for direct messaging
- RLS: Users can only view/create conversations they're part of

#### `messages`
- Stores messages between two users
- RLS: Users can only view messages in their conversations, send to themselves, update read status

#### `notifications`
- Stores: type, title, message, related_data (JSONB), read status
- RLS: Users can only view/update/delete their own notifications

#### `sound_analysis`
- Stores: pet_id, sound_url, analysis (JSONB), created_at
- RLS: Anyone can view, authenticated users can create

## Authentication Flow

### Sign Up

```javascript
import { signUp } from '@/lib/auth';

const result = await signUp(
  email,
  password,
  confirmPassword,
  fullname,
  'adopter' // or 'staff', 'admin'
);
```

**What happens:**
1. User created in `auth.users` with email/password
2. fullname stored in auth metadata
3. User profile created in `public.users` with fullname, role, email
4. Trigger automatically syncs display_name from auth to public.users.fullname

### Sign In

```javascript
import { signIn } from '@/lib/auth';

const result = await signIn(email, password);
// Returns: { user, profile, session }
```

### Get Current User

```javascript
import { getCurrentUser } from '@/lib/auth';

const result = await getCurrentUser();
// Returns: { user: authUser, profile: userProfile }
```

## Feature Usage Examples

### Pets Management

```javascript
import { 
  getAllPets, 
  getPetById, 
  addPet, 
  updatePetStatus,
  uploadPetImage 
} from '@/lib/pets';

// Get all pets
const { pets } = await getAllPets();

// Add new pet (staff/admin only)
const { pet } = await addPet({
  name: 'Max',
  category: 'dog',
  breed: 'Golden Retriever',
  age: 2,
  age_unit: 'years',
  description: 'Friendly dog',
  image_url: null
}, userId);

// Update pet status
await updatePetStatus(petId, 'Reserved');

// Upload image
const { imageUrl } = await uploadPetImage(file, petId);
```

### Adoption Applications

```javascript
import { 
  submitApplication, 
  getApplicationsByUser,
  getPendingApplications,
  approveApplication 
} from '@/lib/applications';

// Submit application
const { application } = await submitApplication({
  pet_id: petId,
  living_situation: 'apartment',
  home_type: 'apartment',
  rent_or_own: 'rent',
  // ... other fields
}, userId);

// Get user's applications
const { applications } = await getApplicationsByUser(userId);

// Get pending (staff/admin only)
const { applications } = await getPendingApplications();

// Approve application
await approveApplication(applicationId, petId, staffUserId);
```

### Messaging

```javascript
import { 
  createOrGetConversation,
  sendMessage,
  getConversationMessages,
  getUserConversations
} from '@/lib/messaging';

// Start conversation
const { conversation } = await createOrGetConversation(userId1, userId2);

// Send message
await sendMessage(conversationId, senderId, receiverId, 'Hello!');

// Get messages
const { messages } = await getConversationMessages(conversationId);

// Get all conversations for user
const { conversations } = await getUserConversations(userId);
```

### Notifications

```javascript
import { 
  getUserNotifications,
  getUnreadNotifications,
  markNotificationAsRead
} from '@/lib/notifications';

// Get user notifications
const { notifications } = await getUserNotifications(userId);

// Get unread only
const { notifications } = await getUnreadNotifications(userId);

// Mark as read
await markNotificationAsRead(notificationId);
```

### Reports & Statistics

```javascript
import { 
  getOverallStatistics,
  getAdoptionStatistics,
  getPetCategoryDemand,
  getAdoptionRate
} from '@/lib/reports';

// Get overall stats
const { statistics } = await getOverallStatistics();
// Returns: totalPets, availablePets, adoptedPets, etc.

// Get adoption rate
const { adoptionRate } = await getAdoptionRate();
// Returns: { totalPets, adoptedPets, percentage }
```

### Sound Analysis

```javascript
import { 
  uploadAnimalSound,
  saveSoundAnalysis,
  getPetSoundAnalyses,
  formatGeminiAnalysis
} from '@/lib/sounds';

// Upload sound file
const { soundUrl } = await uploadAnimalSound(audioFile, petId);

// After Gemini analysis, save result
const analysis = formatGeminiAnalysis(geminiResponse);
await saveSoundAnalysis(petId, soundUrl, analysis);

// Get all analyses for pet
const { analyses } = await getPetSoundAnalyses(petId);
```

## Row Level Security (RLS) Policies

All tables have RLS enabled with specific policies:

### Users Table
- **SELECT**: Everyone can view public profiles
- **UPDATE**: Users can update their own profile; only admins/staff can update roles

### Pets Table
- **SELECT**: Everyone can view
- **INSERT/UPDATE/DELETE**: Only staff and admin

### Adoption Applications Table
- **SELECT**: Users see own; staff/admin see all
- **INSERT**: Users can submit own applications
- **UPDATE**: Users can update pending; staff/admin can update any

### Conversations & Messages
- **SELECT**: Users can only view conversations/messages they're part of
- **INSERT**: Users can only send messages in their conversations
- **UPDATE**: Users can mark messages as read

### Notifications
- **SELECT/UPDATE/DELETE**: Users can only access their own notifications

### Sound Analysis
- **SELECT**: Everyone can view
- **INSERT**: Authenticated users only

## Security Features

✅ **No JWT lowering** - All operations use proper RLS policies
✅ **Row-level security** - Each user can only access their data
✅ **Role-based access** - Different permissions for adopter/staff/admin
✅ **Automatic triggers** - Display name sync between auth and public tables
✅ **Updated_at tracking** - Automatic timestamps on updates
✅ **Foreign key constraints** - Data integrity maintained

## Triggers & Automation

### 1. Sync Display Name
- Automatically syncs `auth.users.user_metadata.fullname` to `public.users.fullname`
- Fires on auth user metadata updates

### 2. Update Timestamps
- Automatically updates `updated_at` on table changes
- Applied to: users, pets, adoption_applications, conversations

## Error Handling

All utility functions return a consistent format:

```javascript
{
  success: true/false,
  message: "Human readable message",
  data: { ... }, // or specific named fields like 'pet', 'user', etc.
  error: "Error message if failed"
}
```

Example:
```javascript
const result = await signUp(email, password, confirmPassword, fullname);

if (result.success) {
  // Use result.user and result.profile
} else {
  console.error(result.error);
}
```

## Best Practices

1. **Always check `success` property** before using returned data
2. **Use role-specific queries** - Don't load all data if users only need their own
3. **Handle async operations** - All functions are async, use await or .then()
4. **Validate input** - Client-side validation helps; server-side via RLS
5. **Use transactions** for multi-step operations (approve application + update pet status)
6. **Monitor RLS** - Check Supabase logs if queries are blocked
7. **Optimize queries** - Use `.select()` to fetch only needed columns

## Common Issues & Solutions

### Issue: "Rows were not updated/deleted"
**Cause**: RLS policy blocked the operation
**Solution**: Check if user role has permission; verify user is updating their own data

### Issue: Notifications not inserting
**Cause**: RLS restricts inserts to auth.uid() = user_id
**Solution**: Use backend function with service role, or create notifications from the app when needed

### Issue: Messages not sending
**Cause**: Conversation RLS blocking access
**Solution**: Ensure conversation includes both users; check conversation exists before sending

### Issue: Auth user and profile out of sync
**Cause**: Trigger not firing or duplicate user inserts
**Solution**: Check that user signup waits for both auth.users and public.users creation

## Deployment Checklist

- [ ] Environment variables set in production
- [ ] Database schema executed in Supabase
- [ ] Storage buckets created and set to public
- [ ] RLS policies verified
- [ ] Test signup/login flow
- [ ] Test file uploads (images, sounds)
- [ ] Verify messaging between users
- [ ] Test notifications
- [ ] Check reports/statistics queries
- [ ] Monitor Supabase logs for errors

## Support & Documentation

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage](https://supabase.com/docs/guides/storage)
