# Kao Photography

A dark editorial photography portfolio connected to public Flickr albums.

## Categories

- Event — 10 albums
- Portrait — 8 albums
- Commercial — 1 album
- Food — 1 album
- Travel — 15 albums

The Flickr album titles are mapped in `api/flickr.js`. The account user ID is `161644745@N07`.

## Deploy to Vercel

1. Import this GitHub repository into Vercel.
2. Add the environment variable `FLICKR_API_KEY` in Project Settings → Environment Variables.
3. Redeploy the project.
4. Open the deployed site and test each portfolio category.

Never commit Flickr API secrets to this repository. This integration uses public Flickr photosets and requires an API key; it does not require the API secret for these public read-only methods.

## Notes

- The API proxy caches responses for 15 minutes with stale-while-revalidate.
- Each photoset view loads up to 30 photos.
- Photo links point back to their Flickr photo pages.
- Replace the placeholder email and Instagram URL in `index.html` before publishing.
- Confirm Flickr's current API commercial-use requirements for a client-facing photography portfolio before launch.
