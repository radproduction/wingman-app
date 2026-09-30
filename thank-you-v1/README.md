# Thank-you email - v1

Sent right after someone signs up for Wingman. It thanks them, says what happens next, and keeps the product under wraps: no app screens, no feature list. Same look as `../news-and-updates-v1/`.

## What is in this folder

| File | What it is |
| --- | --- |
| `email.html` | The template to send. |
| `images/` | `logo.png`, `logo-dark.png` (164 x 34 at 2x) and `thanks-hero.png` (the brand mark on a soft wash, 536 x 260 at 2x). |
| `preview.html` | Approval copy with every image embedded. Share it as one file. **Do not send it.** |

## Sending

- Suggested subject: `You're on the list`. The preheader is set in the template.
- Merge tags use Resend's syntax: `{{{FIRST_NAME|there}}}` and `{{{RESEND_UNSUBSCRIBE_URL}}}`.
- Images load from `https://wingman-rouge.vercel.app/email/v1/` (from `app/public/email/v1/`). That host must serve them without a bot challenge; see `../news-and-updates-v1/README.md`. To host elsewhere, upload `images/` and find/replace the base URL.
- `hello@imyourwingman.ai` (the contacts tip) is a placeholder until confirmed. Send the email from that same address so the tip makes sense.
