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
- **Video.** The About section plays ICF's *What is coaching?* video. To use a different one, change `data-embed` on the video button in `index.html`.
- **Client stories** are sample text. Replace them with real client quotes (with permission) before launch.

## Run locally

```
npx serve .
```

Then open http://localhost:3000.
