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

- **Contact details are fictional.** The email (`hello@deviacoaching.com`) and phone/WhatsApp number (`+44 7700 900724`) look real but reach no one: the number is from Ofcom's range reserved for drama, so it never connects to a real line, and the email domain is unregistered. Replace them with the real ones before launch.
- **Visitor data is masked.** On the review and confirmation screens the visitor's email keeps only its first 2 letters and the domain (`pr•••••@gmail.com`) and the phone only its last 2 digits.
- **Form data.** Answers are kept in the browser (sessionStorage) to carry them from page to page. To receive applications and bookings, paste a form endpoint (Formspree, Getform, a Make or Zapier webhook) into `endpoint` at the top of `assets/site.js`.
- **Booking calendar.** Hours, time zone, call length and booking window are set at the top of `assets/site.js`. Slots are generated in the browser and nothing is reserved yet, so connect a real calendar (Google Calendar, Calendly or Cal.com) and the confirmation email before going live.
- **Photos** come from Pexels (free licence) and load from Pexels for now. The hero shows *Two Women Sitting while Talking on a Sofa* by Karolina Grabowska; the gallery shows 1:1, workshop and business sessions. Download them into `assets/img` before launch so the site doesn't depend on Pexels.
- **Hero clip.** The hero can play a muted background clip over the photo: put an `.mp4` path in `data-src` on the hero `<video>` in `index.html`.
- **Video.** The About section plays Atul Gawande's TED talk *Want to get great at something? Get a coach* from YouTube (plays inline on phones), with a *Watch on TED* link below it. To use a different one, change `data-embed` on the video button in `index.html`.
- **Programs.** Session counts and inclusions in the Programs section are defaults. Update them to match the real offer.
- **Reviews** are sample text. Replace them with real client reviews (with permission) before launch. When the business has a Google Business Profile, link the section to the real Google reviews.

## Run locally

```
npx serve .
```

Then open http://localhost:3000.
