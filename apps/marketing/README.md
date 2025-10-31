# MindEase Marketing Website

This is the public-facing marketing website for MindEase, built with React, Vite, and Tailwind CSS.

## Tailwind CSS Scoping

**Important:** Tailwind CSS is used **only** in this `marketing` app. It is not used in the `webapp` or any shared packages. All Tailwind configuration is self-contained within this directory.

## Running the Site

To run the marketing site locally, use the following command from the monorepo root:

```bash
npm run -w @mindease/marketing dev
```

## Adding a New Marketing Page

1.  **Create the component:** Add a new `.jsx` file in `apps/marketing/src/routes`.
2.  **Add the route:** Open `apps/marketing/src/App.jsx` and add a new `<Route>` for your page.
3.  **Add navigation link:** Open `apps/marketing/src/components/Navbar.jsx` and add a new `<NavLink>` to the navigation bar.

## Adding New i18n Strings

All user-visible strings must be translated into both English and Nepali.

1.  **Add the English string:** Open `apps/marketing/src/locales/en/common.json` and add a new key-value pair.
2.  **Add the Nepali string:** Open `apps/marketing/src/locales/ne/common.json` and add the corresponding key with the Nepali translation.
