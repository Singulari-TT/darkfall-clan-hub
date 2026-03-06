# System Agent Changelog
> **Rule Requirement:** Every time an AI Agent finishes a significant coding session, feature addition, or architectural change, they MUST append a summary to the top of this file. 
> **Purpose:** This prevents isolated context between different agent instances and ensures any agent acting on this codebase immediately understands the current state of the architecture, authentication methods, and database schemas.

## [2026-03-05] Tournament Brackets & Match Management
- **Agent Focus:** Feature Enhancement — Automated Tournament Match System
- **Changes Made:**
  - Added `Tournament_Matches` table to track single-elimination rounds and progression.
  - Implemented `generateBrackets` server action: dynamically shuffles participants and creates round-robin structures (Power-of-2 logic).
  - Implemented `updateMatchResult` server action: handles scoring and automatically promotes winners to the next round placeholder.
  - Created `src/app/tournaments/components/TournamentBracket.tsx` — interactive SVG/CSS bracket visualization with creator reporting modal.
  - Updated `src/app/tournaments/[id]/page.tsx` — integrated Bracket tab, Generate button, and real-time state updates for matches.
- **SQL Requirement:** Added `Tournament_Matches` table (user must run manually in Supabase).
- **Pending:** None.

## [2026-03-05] Clan Tournament Module
- **Agent Focus:** New Feature — Member-Accessible Tournament System
- **Changes Made:**
  - Created `src/app/tournaments/actions.ts` — full server action suite: `fetchTournaments`, `fetchTournamentById`, `createTournament`, `joinTournament`, `leaveTournament`, `updateTournamentStatus`, `deleteTournament`, `setPlacement`. All auth-gated via NextAuth session + Supabase `discord_id` lookup.
  - Created `src/app/tournaments/page.tsx` — Tournament list page with glassmorphic cards grouped by status (Open/In Progress/Ended), inline "Create Tournament" modal with format picker (FFA/1v1/Team), prize, and date fields.
  - Created `src/app/tournaments/[id]/page.tsx` — Detail page with participant roster (🥇🥈🥉 placement icons), join/leave modal, and creator management controls (Mark as In Progress → Ended, set placements, delete).
  - Added `{ label: "Tournaments", href: "/tournaments", icon: "⚔️" }` to `Navbar.tsx`.
  - Added Tournaments card (amber/gold theme) to the Dashboard `page.tsx`.
  - **DB Schema:** Two new Supabase tables: `Tournaments` and `Tournament_Participants` (with UNIQUE constraint on `tournament_id + user_id`).
- **Auth Note:** Any authenticated member can create/join/leave. Only the creator or Admin can change status, set placements, or delete.
- **Pending:** None.

## [2026-03-05] Aesthetic Overhaul Rollout & Scraper Automation
- **Agent Focus:** UI Redesign and Database Automation
- **Changes Made:**
  - Integrated `behavioral_engineering_research.md` (Charcoal #0D1117 backgrounds, Glassmorphism, Cobalt accents) across Navbar and Dashboard.
  - Successfully rolled out the new Cobalt/Charcoal aesthetic to: Loot Splitter, Member Directory, Vault, Intel, Database, Goals, Marketplace, and Interactive Map pages.
  - Refactored Loot Splitter: Gutted the individual name tracking for a cleaner integer 'partySize' division, complete with a 'Custom Adjustment' table for edge cases.
  - Decoupled the "Krew Online" count from the Supabase `Characters` table. It now relies on a raw integer in the `SystemConfig` table.
  - Adapted the `parse_online.js` scraper to run via GitHub Actions.
  - **Auth Note:** Discovered the Darkfall WebGate requires a multi-step SHA-1 handshake and `SessionKey` extraction. Moved this logic into the GitHub Actions cron script so it can run fully autonomously without user intervention.
  - **Bug Fix:** The initial online scraper relied on the *News Reel* events, which only caught players who logged in very recently. Rewrote `parse_online_cron.js` to paginate through the actual Clan Roster (`WebGateRequest=47`) and count the exact number of active `<State>Online</State>` tags for 100% accuracy.
  - Implemented Tesseract.js client-side OCR parsing in `src/app/loot-splitter/page.tsx` to scan screenshots and auto-fill the item list when users press Ctrl+V.
- **Pending:** None currently.
