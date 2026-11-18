# ClinicRelay UI/UX comparison

## Current project

The current Next.js screen is restrained and readable, with a navy sidebar, warm neutral canvas, teal action colour, status chips, inbox table, appointment table, and a night-shift brief. It is materially better than a generic gradient dashboard, but the main page still relies on compact Tailwind strings, has limited loading/error states, and the call modal is more “test form” than receptionist workspace.

Evidence: `app/page.tsx`, `app/globals.css`, `app/layout.tsx`.

## Extracted assessment reference

The reference CSS in `public/styles.css` and `public/index.html` has the stronger product system:

- floating, rounded sidebar with explicit workspace identity;
- warm white/grey surfaces and evergreen accent;
- compact answer band instead of four oversized KPI cards;
- activity strip and callback queue;
- readable tables with responsive horizontal overflow;
- drawer/modal patterns for transcripts and actions;
- explicit mobile breakpoints and safe-area handling;
- textual status and priority labels, not colour alone;
- empty, notice, and error state classes.

The reference UI is the strongest visual source, but it is coupled to a vanilla HTML application. Reuse its design decisions, not its markup or whole frontend.

## Static HTML references

`ClinicRelay.html` and `index (2).html` contain polished standalone visual explorations. Their strongest ideas are the compact operational dashboard, clear answer-first hierarchy, and calm premium colour system. They are not acceptable as direct replacements because they are static, duplicate the application, and do not provide the current typed Next.js/Supabase behavior.

## Selective UI recommendations

1. Replace the current four-card overview with an answer-first band: calls captured, callbacks to review, and appointment requests.
2. Add a callback queue and a seven-day activity view sourced only from persisted rows.
3. Use a reusable drawer for inbox details and a separate call modal for simulation.
4. Add explicit loading, failure, empty, and realtime connection states.
5. Add a mobile navigation control; do not rely only on horizontal overflow.
6. Preserve the current demo disclosure, fictional data boundary, and restrained motion.
7. Respect `prefers-reduced-motion`; the current marquee should not be the only status communication.

## Deliberately not merged

- No full HTML/CSS replacement.
- No decorative chart or fake performance graph.
- No copied branding, text, assets, or layout from SavedCalls or other products.
- No excessive gradients, emoji controls, or unverified “AI accuracy” claims.
