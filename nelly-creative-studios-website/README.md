# Nelly Creative Studios — Website

A complete, self-hosted website for **Nelly Creative Studios** fine jewelry. White background, gold & red typography, fully responsive.

## Pages Included

| File | Page |
|------|------|
| `index.html` | Homepage |
| `pages/boutique.html` | The Boutique (filterable product grid) |
| `pages/bespoke.html` | Bespoke Jewelry (process + gallery) |
| `pages/about.html` | About Nelly |
| `pages/journal.html` | The Jewelry Journal |
| `pages/faq.html` | FAQ (accordion) |
| `pages/contact.html` | Contact Form |

## File Structure

```
nelly-site/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── main.js
├── pages/
│   ├── boutique.html
│   ├── bespoke.html
│   ├── about.html
│   ├── journal.html
│   ├── faq.html
│   └── contact.html
└── README.md
```

---

## How to Host on GitHub Pages (Free)

### Step 1 — Create a GitHub account
Go to https://github.com and sign up (free).

### Step 2 — Create a new repository
1. Click the **+** icon → **New repository**
2. Name it exactly: `nellycreativestudios.com` (or any name you like)
3. Set it to **Public**
4. Click **Create repository**

### Step 3 — Upload your files
**Option A — Drag & Drop (easiest):**
1. Open your new repository
2. Click **Add file** → **Upload files**
3. Drag and drop ALL files and folders from this `nelly-site` folder
4. Click **Commit changes**

**Option B — GitHub Desktop (recommended for updates):**
1. Download GitHub Desktop from https://desktop.github.com
2. Clone your repository
3. Copy all files into the local folder
4. Commit and push

### Step 4 — Enable GitHub Pages
1. In your repository, click **Settings**
2. Scroll to **Pages** in the left sidebar
3. Under **Source**, select **Deploy from a branch**
4. Choose **main** branch, **/ (root)** folder
5. Click **Save**

Your site will be live at:
`https://yourusername.github.io/your-repo-name/`

---

## Custom Domain (nellycreativestudios.com)

To use your existing domain instead of the GitHub URL:

### Step 1 — Add custom domain in GitHub
1. Go to **Settings → Pages**
2. Under **Custom domain**, type `nellycreativestudios.com`
3. Click **Save**

### Step 2 — Update your DNS (at your domain registrar)
Add these DNS records at wherever you bought your domain:

| Type | Name | Value |
|------|------|-------|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | yourusername.github.io |

DNS changes take 24–48 hours to propagate.

### Step 3 — Enable HTTPS
Once DNS is set up, go back to **Settings → Pages** and check **Enforce HTTPS**.

---

## Updating Your Site

To add new products or edit content:
1. Edit the HTML files on your computer
2. Upload the changed files to GitHub (drag & drop or GitHub Desktop)
3. Changes go live automatically within ~1 minute

## Contact Form Note

The contact form currently uses `mailto:` which opens the user's email app. To receive form submissions directly to your inbox without an email client, sign up for a free service like **Formspree** (https://formspree.io):

1. Create a free Formspree account
2. Create a new form and get your form endpoint URL (e.g. `https://formspree.io/f/xabcdefg`)
3. In `pages/contact.html`, change the `<form>` tag to:
   ```html
   <form class="contact-form" action="https://formspree.io/f/YOUR_ID" method="POST">
   ```

---

© 2026 Nelly Creative Studios USA
