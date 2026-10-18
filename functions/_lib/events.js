// ─────────────────────────────────────────────────────────────────────────────
// EVENT LIBRARY for the private photo pages. Nothing here is ever shown on the
// website: it is only the list of events that are allowed to exist.
//
// Every event gets its OWN private link and its OWN password:
//
//     link:      https://nellycreativestudios.com/event/<link>
//     password:  set in Cloudflare (see EVENT-UPLOADS-SETUP.md, "Starting a new event")
//
// To add an event, add a line below (newest on top is easiest to read), then push to GitHub.
//   name = shown on that event's page after sign-in (use the exact spelling/case you want)
//   link = the last part of its web address: lowercase letters, numbers and dashes only
//
// Never change a link once photos exist: the photos are filed under it.
// ─────────────────────────────────────────────────────────────────────────────

export const EVENTS = [
  { name: 'celestial garden nyc preview 2026', link: 'celestial-garden-nyc-preview-2026' },
];
