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
        <p className={styles.updated}>Last updated: July 2026</p>

        <section>
          <h2>Overview</h2>
          <p>
            Learn Bulgarian is a free language learning web app. You can use the entire course without
            an account: your progress (completed lessons, XP, streaks, hearts) is stored in your browser
            using localStorage and never sent to any server. Signing in with Discord is optional and lets
            you back up your progress, use it across devices, add friends, and appear on the leaderboard.
          </p>
        </section>

        <section>
          <h2>Data We Do Not Collect</h2>
          <ul>
            <li>We do not require account registration to use the course.</li>
            <li>We never see or store your email address or Discord password.</li>
            <li>We do not sell or share any data with third parties for advertising.</li>
          </ul>
        </section>

        <section>
          <h2>Local Storage (no account)</h2>
          <p>
            If you don't sign in, your learning progress is saved only in your browser's localStorage and
            never leaves your device. You can clear it at any time through your browser settings.
          </p>
        </section>

        <section>
          <h2>Signing In With Discord</h2>
          <p>
            Signing in uses Discord OAuth. Discord shares your Discord user ID, username, and avatar with us;
            we do not receive your email address or password. We store this alongside a username (which you
            can change), avatar, and a signed session cookie that keeps you logged in.
          </p>
          <p>
            Once signed in, your course progress (lessons, XP, streaks, quests, daily XP history) is stored
            on our server tied to your account so it can sync across devices and be used to calculate
            leaderboard rankings.
          </p>
        </section>

        <section>
          <h2>Friends</h2>
          <p>
            You can send, accept, and decline friend requests using another player's username. Friends can
            see each other's username, avatar, XP, and streak. Anyone can view a public profile page
            (username, avatar, join date, and stats) at its <code>/u/username</code> URL, even without
            signing in.
          </p>
        </section>

        <section>
          <h2>Leaderboard</h2>
          <p>
            If you're signed in, your username, avatar, XP, and streak may appear on the public weekly,
            monthly, and all-time leaderboards. You can stop appearing on the leaderboard by deleting your
            account (see "Your Rights" below).
          </p>
        </section>

        <section>
          <h2>Account Deletion</h2>
          <p>
            You can permanently delete your account at any time from your profile page. This immediately
            removes your account record, synced progress, and all friend relationships from our database,
            and signs you out. This cannot be undone; progress that still lives only in a browser's
            localStorage is unaffected.
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
            We do not use tracking or advertising cookies. If you sign in, we set a single essential session
            cookie to keep you logged in; it is not used for tracking or advertising. No cookie consent
            banner is shown because no tracking cookies are placed.
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
            Under GDPR you have the right to access, correct, or delete any personal data we hold. If you
            have an account, you can delete it (and everything tied to it) yourself from your profile page,
            or contact us at <a href="mailto:legal@ur.contact">legal@ur.contact</a> for any other request.
            If you never signed in, we hold no personal data about you at all.
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
            o7studios EOOD (о7студиос ЕООД)<br />
            Sredna Gora St. 1, Floor 6, Apt. 66<br />
            8217 Aheloy, Bulgaria<br />
            Email: <a href="mailto:legal@ur.contact">legal@ur.contact</a>
          </p>
        </section>
      </main>
    </div>
  )
}
