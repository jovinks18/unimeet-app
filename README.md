That README is definitely a bit dry—it's just the default boilerplate for a new project. Since you've built a sophisticated app with **Google Maps**, **OpenAI**, and **Supabase**, your README should actually reflect the "UniMeet" journey.

Here is a much better version you can have Claude swap in. It tells the story of the project from the ground up.

---

# 🎓 UniMeet: The Campus Social Hub

UniMeet is a high-fidelity campus networking app designed to bridge the gap between "I'm free" and "Let's hang out." Built with a premium dark-themed UI, it integrates real-time location services and AI-assisted planning.

## 🚀 The Journey So Far

### 1. Foundation & Authentication

* **Supabase Auth**: Wired up a secure login flow with custom `AuthContext`.
* **Onboarding**: Implemented an "Upsert" logic to prevent duplicate profile crashes while collecting user interests.
* **Premium UI**: Established a consistent palette: Background `#051124`, Cards `#121E31`, and Gold highlights `#F3D99A`.

### 2. The Discovery Engine

* **Smart Planning**: Built an interactive "Create Plan" form featuring custom-built **Date/Time** and **Location** popovers.
* **Google Maps Integration**: Dynamically loads the Google Maps JS SDK for real-time location autocomplete without external heavy libraries.
* **✨ AI Description**: Integrated `gpt-4o-mini` to automatically generate fun event descriptions based on user inputs.

### 3. Social Connectivity (My Circle)

* **Live Status**: Users can toggle their "Free to hang out" status, which updates their `last_seen` heartbeat in the database.
* **Bidirectional Friendships**: A custom Supabase query handles friendship logic so plans are shared instantly between connected users.
* **Squads & Events**: Added dedicated spaces for group-based networking and larger campus events.

## 🛠️ Tech Stack

* **Frontend**: React + TypeScript + Vite
* **Backend/DB**: Supabase (PostgreSQL + RLS)
* **APIs**: Google Places API, OpenAI API
* **Styling**: Modern CSS-in-JS for responsive dark-mode layouts

## 🔧 Database Configuration

To get this working, the following tables were added to Supabase:

* `profiles`: Tracks `current_status` and `last_seen`.
* `activities`: Stores plans with `max_guests` constraints.
* `friendships`: Manages bidirectional social links.

---

