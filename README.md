# FIFA Admin

Admin-only dashboard for the invite list.
The dashboard can also set the invite capacity that controls when new guests move to the waitlist.

## Local setup

1. Copy `.env.example` to `.env.local`
2. Point `NEXT_PUBLIC_CONTROL_URL` at `fifa-control`
3. Run `npm run dev`

The dashboard stores the admin key in `localStorage` after the first successful load.
