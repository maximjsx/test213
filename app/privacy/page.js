import Link from 'next/link'
import styles from '../legal/page.module.css'

export const metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy for Learn Bulgarian. Learn how we handle your data.',
}

export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.back}>Back to course</Link>
      </header>
      <main className={styles.main}>
        <h1>Privacy Policy</h1>
        <p className={styles.updated}>Last updated: June 2026</p>

        <section>
          <h2>Overview</h2>
          <p>
            Learn Bulgarian is a free language learning web app. We collect as little data as possible.
            Your progress (completed lessons, XP, streaks, hearts) is stored entirely in your browser using
            localStorage and never sent to any server.
          </p>
        </section>

        <section>
          <h2>Data We Do Not Collect</h2>
          <ul>
            <li>We do not require account registration.</li>
            <li>We do not collect your name, email, or any personal identifiers.</li>
            <li>We do not sell or share any data with third parties for advertising.</li>
          </ul>
        </section>

        <section>
          <h2>Local Storage</h2>
          <p>
            Your learning progress is saved in your browser's localStorage. This data never leaves your device.
            You can clear it at any time through your browser settings.
          </p>
        </section>

        <section>
          <h2>Text-to-Speech (TTS)</h2>
          <p>
            Certain lessons use a text-to-speech API to generate audio pronunciation. Text snippets from lessons
            may be sent to a third-party TTS provider solely to generate audio. No personal information is included
            in these requests.
          </p>
        </section>

        <section>
          <h2>Cookies</h2>
          <p>
            We do not use tracking or advertising cookies. No cookie consent banner is shown because no tracking
            cookies are placed.
          </p>
        </section>

        <section>
          <h2>Third-Party Services</h2>
          <p>
            We use Google Fonts to load the Nunito typeface. Google may log the request to serve the font.
            See <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google's Privacy Policy</a> for details.
          </p>
        </section>

        <section>
          <h2>Children's Privacy</h2>
          <p>
            Learn Bulgarian does not knowingly collect any data from children under 13. Because no personal
            data is collected at all, the service is safe for all ages.
          </p>
        </section>

        <section>
          <h2>Your Rights</h2>
          <p>
            Under GDPR you have the right to access, correct, or delete any personal data we hold.
            As we hold no personal data, there is nothing to access or delete. If you have questions,
            contact us at <a href="mailto:legal@bulgarian.dev">legal@bulgarian.dev</a>.
          </p>
        </section>

        <section>
          <h2>Changes to This Policy</h2>
          <p>
            We may update this policy as the service evolves. Significant changes will be noted by updating
            the date above.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            Максим Фидлер (Maxim Fiedler)<br />
            Email: <a href="mailto:legal@bulgarian.dev">legal@bulgarian.dev</a>
          </p>
        </section>
      </main>
    </div>
  )
}
