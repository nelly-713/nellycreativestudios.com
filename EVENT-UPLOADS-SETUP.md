# Event Photos — setup and everyday use

Every event gets **its own private link and its own password**. There is no list of events anywhere on the website, and the page has no event menu, so nobody can see or reach another event from theirs. The link looks like:

    https://nellycreativestudios.com/event/celestial-garden-nyc-preview-2026

Links are not in the menu or sitemap and are marked `noindex`. Share each link and its password only with the people for that event.

## One-time setup (Cloudflare dashboard)

Photos are stored in a Cloudflare **R2** bucket.

1. **Create the bucket**
   *R2 Object Storage* → *Create bucket* → name it e.g. `nelly-event-photos`.

2. **Connect the bucket to the site**
   *Workers & Pages* → your site's Pages project → *Settings* → *Bindings* → *Add* → *R2 bucket*
   - Variable name: `EVENT_PHOTOS` (must be exactly this)
   - R2 bucket: the one you just created

3. **Set the password(s)** (same project → *Settings* → *Variables and Secrets* → *Add*, type *Secret*)
   - `UPLOAD_PASSWORD` — the password for the first event (`celestial garden nyc preview 2026`). Also used by any event that has no password of its own.
   - `EVENT_PASSWORDS` — one line per event with its own password, written `link: password` (see below). Not needed until your second event.
   - (Optional) `UPLOAD_SECRET` — any long random string mixed into login-session signing.

4. **Redeploy** (push to GitHub, or *Retry deployment*). Bindings and variables only apply to new deployments.

## Starting a new event

Two small steps:

**1. Add it to the library.** Open `functions/_lib/events.js` and add a line:

```js
export const EVENTS = [
  { name: 'Holiday Trunk Show 2026',            link: 'holiday-trunk-show-2026' },
  { name: 'celestial garden nyc preview 2026',  link: 'celestial-garden-nyc-preview-2026' },
];
```

- `name` is what people see after signing in (spelled and capitalized exactly as written).
- `link` is the end of the web address: lowercase letters, numbers and dashes only. Never change it after photos exist.

**2. Give it a password.** In Cloudflare, edit the `EVENT_PASSWORDS` secret and add one line per event:

```
holiday-trunk-show-2026: Tinsel#4410
```

Push to GitHub / redeploy. The new link is `https://nellycreativestudios.com/event/holiday-trunk-show-2026`.

Notes:
- An event with no line in `EVENT_PASSWORDS` uses `UPLOAD_PASSWORD`. Give every event its own line if you don't want any two to share a password.
- Changing an event's password signs out only that event's users.
- A password can't contain a line break; a colon is fine.
- Old events stay in `functions/_lib/events.js` and keep working with their own link and password. Delete a line from `functions/_lib/events.js` to switch that event's page off (the photos stay safe in the bucket).

## Using the page

- **Upload tab:** the event name is shown and locked. Choose or drag in photos (JPG, PNG, WebP, HEIC up to 25 MB each), add your own name if you like, and click Upload.
- **View photos tab:** that event's photos, newest first. Click a photo to view it large (arrow keys or the on-screen arrows) and use *Download* to save it with its original name. *Download all* builds one `.zip` named after the event.

## Where the photos are stored

`events/<link>/<date>/<timestamp>-<id>-<original-name>.jpg` (small previews in `thumbs/`).
You can also browse everything, across all events, in the dashboard under *R2 → your bucket → Objects*. The uploader's name is saved with each photo.

## Security notes

- Passwords are never in the page source or in the code. Sessions last 8 hours.
- A sign-in for one event does nothing for any other event, and photos can only be opened by someone signed in to that event.
- After 8 wrong passwords from one network address on an event, that address is locked out of that event for 15 minutes. (Counters are kept in the bucket under `_system/` and can never be viewed or downloaded.)
- File types are checked from the file contents, not the name.
- Cloudflare's free plan only allows very short rate-limit windows, which is why the lockout is built into the page's own login.
