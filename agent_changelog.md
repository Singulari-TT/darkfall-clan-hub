# System Agent Changelog
> **Rule Requirement:** Every time an AI Agent finishes a significant coding session, feature addition, or architectural change, they MUST append a summary to the top of this file. 
> **Purpose:** This prevents isolated context between different agent instances and ensures any agent acting on this codebase immediately understands the current state of the architecture, authentication methods, and database schemas.

## [2026-03-06] Empire Hub & War Room Optimization
- **Agent Focus:** Territorial Intelligence & Resource Logistics
- **Changes Made:**
  - **Empire Dashboard**: Created a new "Empire" module (`/empire`) for tracking clan holdings (Cities/Hamlets). Includes tactical cards and estimated resource yield tracking (Timber, Ore, Stone, Resin).
  - **War Room Scaling**: Reduced the Tactical Map footprint by 30% and added immersive overlays (GRID_ALPHA_V1) for a more professional command feel.
  - **Native Intelligence Feeds**: Replaced blocked iframes for Ganks and Bans with native scraping API routes (`/api/agon/ganks`, `/api/agon/bans`) and a custom `NativeIntelligenceFeed` component.
  - **Harvest Scraper**: Created `scripts/scrape_harvests.js` to parse News Reel milestone events (1st, 10th, 20th...) for imperial resource estimation.
  - **Multi-Platform Code Watch**: Expanded the repository watcher to aggregate searches from **GitHub** and **GitLab**. Added platform-specific branding and icons to the "Code Watch" feed.
  - **Aggregator API**: Implemented `/api/intel/code-watch` to source and normalize development activity across the ecosystem.
  - **UI Fix (Shift-Layout)**: Resolved the Admin Sidebar overlap bug. Implemented a conditional `pl-14` layout shift in the root `layout.tsx` for Admin users, ensuring the sidebar no longer covers main content.
- **SQL Requirement**: Run `src/database/empire-schema.sql` to initialize imperial tracking tables.
- **Pending**: Actual yield numbers for Mines and Quarries from user.

- **Agent Focus:** Hardcore Tactical Utility & Personalization
- **Changes Made:**
  - **War Room Terminal**: Overhauled the Tactical Map into a multi-tab "War Room" hub. Integrated live **Gank Feeds**, **Ban Watch**, and **Agon Metrics HeatMap** via iframe relays. Centralized all Agon intelligence for rapid-access command.
  - **Identity Codex**: Implemented character registration with "Main" character designation. Created Admin Identity dashboard (`/admin/identities`) for comprehensive roster management.
  - **Roster Evolution**: Refined the Member Directory with compact "Command Center" styling. Added direct **PvP Intel** links to Agon Metrics profiles for all verified Main characters.
  - **Terminology Purge**: Replaced generic "Operative" terminology with personalized names or "Member" across all views, hooks, and Discord interaction handlers.
  - **Loot Splitter V2**: Upgraded AI identification to `gemini-1.5-flash` and implemented "Party Roster" for dynamic 15-member dice rolls with player names.
  - **Tournament ID Sync**: Standardized ID handling between Discord and local Supabase UUIDs to fix creation/registration errors.
  - **Aesthetics**: Integrated "Dragon City" premium background for Directives and tightened UI density (font/padding) for a more professional tactical feel.
- **SQL Requirement:** Added `is_main` column to `Characters` table and created Admin view permissions.
- **Pending:** Integration of "Last Seen" metrics from News Reel scraping into the Identity cards.

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
