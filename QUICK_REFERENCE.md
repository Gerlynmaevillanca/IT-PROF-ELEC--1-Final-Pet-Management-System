# 🎨 Villanca Design Quick Reference

## 📍 Page Locations & Functions

| Route | Page File | Functions Used |
|-------|-----------|-----------------|
| `/` | `LandingPage.jsx` | None |
| `/login` | `LoginPage.jsx` | `signIn()` |
| `/signup` | `SignupPage.jsx` | `signUp()` |
| `/browse-pets` | `BrowsePetsPage.jsx` | `getAvailablePets()` |
| `/application` | `ApplicationPage.jsx` | `submitApplication()` |
| `/admin` | `AdminDashboardPage.jsx` | `getOverallStatistics()` |
| `/admin/pets` | `BrowsePetsAdminPage.jsx` | `addPet()` |
| `/admin/applications` | `ApplicationAdminPage.jsx` | `approveApplication()` |

---

## 🎨 CSS Color Variables

Use these in any CSS/JSX:
```css
--primary-beige: #F5E6D3      /* Background */
--secondary-beige: #E8D7C3    /* Borders */
--accent-warm: #D4A574        /* Buttons */
--accent-dark: #8B7355        /* Text */
--text-dark: #3D3D3D          /* Headlines */
--text-light: #6B6B6B         /* Body text */
--white: #FFFFFF              /* Cards */
```

---

## 🔘 Button Classes

```jsx
// Primary button (warm tan)
<button className="btn-primary">Action</button>

// Secondary button (beige border)
<button className="btn-secondary">Alt Action</button>
```

---

## 🃏 Pet Card Class

```jsx
<div className="pet-card">
  <img className="pet-card-image" src="..." />
  <div className="pet-card-content">
    <h3 className="pet-card-title">Name</h3>
    <p className="pet-card-info">Info</p>
    <span className="pet-badge">Status</span>
  </div>
</div>
```

---

## 📋 Form Container

```jsx
<div className="form-container">
  <h1 className="section-title">Title</h1>
  <h2 className="section-subtitle">Subtitle</h2>
  <input type="text" />
  <button className="btn-primary">Submit</button>
</div>
```

---

## 🎯 Alert Messages

```jsx
<div className="alert-success">✓ Success message</div>
<div className="alert-error">✗ Error message</div>
<div className="alert-info">ℹ Info message</div>
```

---

## 🐾 Pet Emojis by Category

```javascript
const petEmojis = {
  "Dog": "🐕",
  "Cat": "🐱",
  "Bird": "🦜",
  "Rabbit": "🐰",
  "default": "🐾"
};
```

---

## ⚙️ Environment Variables

Add to `.env.local`:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxxx
```

---

## 🔄 Common Patterns

### Loading State
```jsx
{loading && <p style={{ color: "var(--text-light)" }}>Loading...</p>}
```

### Error Display
```jsx
{error && <div className="alert-error">{error}</div>}
```

### Success Message
```jsx
{success && <div className="alert-success">{success}</div>}
```

### Responsive Grid
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* items */}
</div>
```

---

## 📊 Data Flow Examples

### User Registration
1. Go to `/signup`
2. Fill form (name, email, password, role)
3. `signUp()` creates auth.users & public.users
4. Redirect to `/login`
5. Login redirects to `/browse-pets`

### Browsing Pets
1. Go to `/browse-pets`
2. `getAvailablePets()` loads data
3. User searches/filters
4. Pets display in grid
5. Click to view details

### Submitting Application
1. Go to `/application`
2. Select pet, fill form
3. `submitApplication()` saves to DB
4. Shows in user's application history

### Admin Approval
1. Go to `/admin/applications`
2. See pending applications
3. Click Approve/Decline
4. `approveApplication()` updates status
5. Application moves to approved list

---

## 🎨 Text Styling Examples

```jsx
// Using inline styles with CSS variables
<h1 style={{ color: "var(--text-dark)" }}>Heading</h1>

// Secondary text
<p style={{ color: "var(--text-light)" }}>Description</p>

// Accent color
<p style={{ color: "var(--accent-warm)" }}>Important</p>

// Background color
<div style={{ backgroundColor: "var(--primary-beige)" }}>
  Content
</div>
```

---

## 🔍 Functions Reference

### Authentication (auth.js)
```javascript
// Signup
signUp(email, password, confirmPassword, fullname, role)

// Login
signIn(email, password)

// Logout
signOut()

// Get profile
getCurrentUser()
```

### Pets (pets.js)
```javascript
// Get all pets
getAllPets()

// Get available only
getAvailablePets()

// Filter by category
getPetsByCategory(category)

// Add new pet
addPet(petData, userId)

// Update pet
updatePet(petId, petData)
```

### Applications (applications.js)
```javascript
// Submit application
submitApplication(data, userId)

// Get user's applications
getApplicationsByUser(userId)

// Get pending applications
getPendingApplications()

// Approve application
approveApplication(applicationId)

// Decline application
declineApplication(applicationId)
```

### Reports (reports.js)
```javascript
// Overall statistics
getOverallStatistics()

// Adoption statistics
getAdoptionStatistics()
```

---

## 🎯 Common Customizations

### Change Primary Color
Edit `src/index.css`:
```css
:root {
  --accent-warm: #YOUR_HEX_COLOR;
}
```

### Add New Pet Category
In any dropdown:
```jsx
<option value="NewPet">🦁 New Pet</option>
```

### Change Button Text
```jsx
<button className="btn-primary">Your Custom Text</button>
```

### Update Section Title
```jsx
<h1 className="section-title">Your New Title</h1>
```

---

## 🐛 Troubleshooting Quick Tips

| Problem | Solution |
|---------|----------|
| Pages not loading | Check `.env.local` has Supabase URL |
| Auth not working | Verify Supabase schema created |
| Data not showing | Check RLS policies allow read |
| Styling looks wrong | Clear cache (Ctrl+Shift+Delete) |
| Buttons not working | Check form validation |
| Images not loading | Use emoji fallback |

---

## 📱 Responsive Breakpoints

```css
/* Mobile-first (default) */
Default styles for small screens

/* Small screens and up */
@apply sm:... /* 640px+ */

/* Medium screens and up */
@apply md:... /* 768px+ */

/* Large screens and up */
@apply lg:... /* 1024px+ */

/* Extra large screens and up */
@apply xl:... /* 1280px+ */
```

---

## 🚀 Quick Deploy Checklist

- [ ] Set environment variables
- [ ] Test signup/login
- [ ] Test pet browsing
- [ ] Test application submission
- [ ] Test admin features
- [ ] Verify Supabase policies
- [ ] Check storage buckets
- [ ] Test on mobile device

---

## 📞 Need Help?

Refer to these files:
- **DESIGN_UPDATE.md** - Complete design documentation
- **MODERN_DESIGN_GUIDE.md** - Implementation guide
- **COMPLETION_CHECKLIST.md** - Feature checklist
- **IMPLEMENTATION_SUMMARY.md** - Full summary

---

**Last Updated:** December 4, 2025
**Version:** 1.0 - Complete
