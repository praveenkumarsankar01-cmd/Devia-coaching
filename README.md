# Devia Coaching

Application and booking funnel for Devia Coaching.

**Flow:** landing page → application form → book a call → confirmation

Static HTML, CSS and JavaScript. No build step, so the folder can be deployed as it is (Vercel, Netlify or GitHub Pages).

## Pages

```
index.html       landing page: hero, coaching types, about video, how it works,
                 program, client stories, FAQ
apply.html       4-step application form
book.html        booking calendar (times shown in the visitor's time zone)
confirmed.html   confirmation with Google Calendar and .ics download
legal.html       privacy, terms and disclaimer
assets/site.css  styles
assets/site.js   form steps, validation, booking calendar, confirmation
assets/fonts     Poppins, self-hosted (SIL Open Font License)
```

## Notes

- **Personal data is masked.** Contact email shows as `XXXX@XXXX.com` and phone as `+91 XXXXX XXXXX`. On the review and confirmation screens the visitor's email shows as `XXXX@domain` and the phone keeps only the last 2 digits.
- **Form data.** Answers are kept in the browser (sessionStorage) to carry them from page to page. To receive applications and bookings, paste a form endpoint (Formspree, Getform, a Make or Zapier webhook) into `endpoint` at the top of `assets/site.js`.
- **Booking calendar.** Hours, time zone, call length and booking window are set at the top of `assets/site.js`. Slots are generated in the browser and nothing is reserved yet, so connect a real calendar (Google Calendar, Calendly or Cal.com) and the confirmation email before going live.
- **Photos** come from Pexels (free licence) and load from Pexels for now. The hero shows *Two Women Sitting while Talking on a Sofa* by Karolina Grabowska; the gallery shows 1:1, workshop and business sessions. Download them into `assets/img` before launch so the site doesn't depend on Pexels.
- **Hero clip.** The hero can play a muted background clip over the photo: put an `.mp4` path in `data-src` on the hero `<video>` in `index.html`.
- **Video.** The About section plays Atul Gawande's TED talk *Want to get great at something? Get a coach* through TED's player. To use a different one, change `data-embed` on the video button in `index.html`.
- **Programs.** Session counts and inclusions in the Programs section are defaults. Update them to match the real offer.
- **Client stories** are sample text. Replace them with real client quotes (with permission) before launch.

## Run locally

```
npx serve .
```

Then open http://localhost:3000.
