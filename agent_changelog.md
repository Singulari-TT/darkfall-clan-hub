# System Agent Changelog
> **Rule Requirement:** Every time an AI Agent finishes a significant coding session, feature addition, or architectural change, they MUST append a summary to the top of this file. 
> **Purpose:** This prevents isolated context between different agent instances and ensures any agent acting on this codebase immediately understands the current state of the architecture, authentication methods, and database schemas.

## [2026-03-05] Aesthetic Overhaul Rollout & Scraper Automation
- **Agent Focus:** UI Redesign and Database Automation
- **Changes Made:**
  - Integrated `behavioral_engineering_research.md` (Charcoal #0D1117 backgrounds, Glassmorphism, Cobalt accents) across Navbar and Dashboard.
  - Successfully rolled out the new Cobalt/Charcoal aesthetic to: Loot Splitter, Member Directory, Vault, Intel, Database, Goals, Marketplace, and Interactive Map pages.
  - Refactored Loot Splitter: Gutted the individual name tracking for a cleaner integer 'partySize' division, complete with a 'Custom Adjustment' table for edge cases.
  - Decoupled the "Krew Online" count from the Supabase `Characters` table. It now relies on a raw integer in the `SystemConfig` table.
  - Adapted the `parse_online.js` scraper to run via GitHub Actions.
  - **Auth Note:** Discovered the Darkfall WebGate requires a multi-step SHA-1 handshake and `SessionKey` extraction. Moved this logic into the GitHub Actions cron script so it can run fully autonomously without user intervention.
- **Pending:** Merging the full SHA-1 auth flow into `parse_online_cron.js` and finishing the OCR item parsing for the Loot Splitter.
