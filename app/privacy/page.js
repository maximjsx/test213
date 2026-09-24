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
        <p className={styles.updated}>Last updated: September 2026</p>

        <section>
          <h2>Who Is Responsible</h2>
          <p>
            The controller for your personal data is Максим Фидлер (Maxim Fiedler), 8217 Aheloy, Burgas
            Province, Bulgaria, <a href="mailto:legal@bulgarian.dev">legal@bulgarian.dev</a>.
          </p>
        </section>

        <section>
          <h2>Overview</h2>
          <p>
            You can use the whole course without an account. Your progress then lives only in your browser.
            Signing in with Discord is optional and lets you sync progress, add friends, appear on the
            leaderboard, claim certificates, and contribute voice recordings. We do not sell your data, show
            ads, or use analytics or tracking tools.
          </p>
        </section>

        <section>
          <h2>Without an Account</h2>
          <p>
            Your progress (lessons, XP, streaks, hearts, settings) is saved in your browser&apos;s local storage
            and is not sent to us. You can clear it at any time in your browser settings.
          </p>
          <p>
            Like every website, our hosting provider (Vercel) processes your IP address and basic request details
            to deliver the pages and keep the service secure. These logs are kept for a short time and are not
            used to identify you.
          </p>
        </section>

        <section>
          <h2>Signing In With Discord</h2>
          <p>
            When you sign in, Discord shares your Discord user ID, username, display name, and avatar with us. We
            never receive your email address or password. We store these together with a username you can change,
            your synced progress (lessons, XP, streaks, quests, daily XP history), and Discord access tokens. We use
            the tokens only to refresh your name and avatar every few hours, so your profile stays current.
          </p>
          <p>
            A single essential cookie keeps you signed in. Legal basis: performance of our agreement with you
            (Art. 6(1)(b) GDPR).
          </p>
        </section>

        <section>
          <h2>Public Profile, Friends, and Leaderboard</h2>
          <p>
            Signed-in players have a public profile at <code>/u/username</code> showing their username, avatar,
            join date, XP, and streak. The same details appear on the public leaderboards and to your friends.
            Friend requests are sent by username. If you team up with a friend for the weekly friend quest, we
            store who you picked, and you both see each other&apos;s XP for that week. Weekly leagues group players
            by the XP they earned the week before.
          </p>
        </section>

        <section>
          <h2>Speaking Exercises</h2>
          <p>
            Speaking exercises use your microphone only while you press the record button. To check what you said,
            the audio is transcribed by one of these services, depending on your browser:
          </p>
          <ul>
            <li>your browser&apos;s built-in speech recognition (for example Google in Chrome, Apple in Safari);</li>
            <li>Speechmatics, in its EU region;</li>
            <li>Groq, as a fallback on some devices.</li>
          </ul>
          <p>
            We do not store this audio or the transcripts, and we do not send your name or account with them.
            Legal basis: performance of our agreement with you, because you started the exercise.
          </p>
        </section>

        <section id="recordings">
          <h2>Voice Studio Recordings</h2>
          <p>
            If you contribute recordings in the voice studio, we store the audio on our own file server together
            with your account ID, your username, and the date. Approved recordings play in the lessons for everyone,
            with your username shown as the speaker. You accept the{' '}
            <Link href="/terms#recordings">voice contribution terms</Link> before your first recording, and we store
            when you accepted them.
          </p>
          <p>
            Legal basis: performance of the contribution agreement you accepted (Art. 6(1)(b) GDPR). Unreviewed
            recordings are deleted when you delete your account. Approved recordings are kept for as long as they
            are used in the course, with your username and account ID removed.
          </p>
          <p>
            You can still contact us about your recordings at any time. We will handle every request according to
            the GDPR.
          </p>
        </section>

        <section>
          <h2>Certificates</h2>
          <p>
            When you claim a certificate, we store the name you enter, the certificate details, and the signed PDF.
            Anyone with the certificate link or ID can view the name and details, so employers and others can check
            it is real. Certificates are deleted when you delete your account, and their links then stop working.
          </p>
        </section>

        <section>
          <h2>Text-to-Speech</h2>
          <p>
            Some lessons generate pronunciation audio with Google Cloud Text-to-Speech. Only lesson text is sent,
            never anything about you.
          </p>
        </section>

        <section>
          <h2>Cookies and Local Storage</h2>
          <p>
            We use one essential session cookie when you sign in, and local storage for your progress and settings.
            Both are strictly necessary for features you ask for, so no consent banner is needed. We do not use
            tracking, analytics, or advertising cookies, and our font is served from our own domain.
          </p>
        </section>

        <section>
          <h2>Who Processes Data for Us</h2>
          <ul>
            <li>Vercel: website hosting.</li>
            <li>Our database provider: stores accounts, progress, certificates, and recording details.</li>
            <li>Discord: sign-in.</li>
            <li>Speechmatics, Groq, and your browser&apos;s provider: speech recognition.</li>
            <li>Google: text-to-speech (lesson text only).</li>
          </ul>
          <p>
            Some of these providers are based outside the EU, mainly in the United States. Those transfers rely on
            the EU-US Data Privacy Framework or the European Commission&apos;s Standard Contractual Clauses.
          </p>
        </section>

        <section>
          <h2>Deleting Your Account</h2>
          <p>
            You can delete your account at any time from your profile page. This immediately deletes your account,
            synced progress, Discord tokens, friends, certificates, and unreviewed recordings, and removes your name
            from approved recordings. Progress stored only in a browser&apos;s local storage is not affected.
          </p>
        </section>

        <section>
          <h2>Children</h2>
          <p>
            The course is suitable for all ages without an account. Accounts are not meant for children under 14,
            the age of digital consent in Bulgaria. Contributing voice recordings requires being 18, or permission
            from a parent or guardian.
          </p>
        </section>

        <section>
          <h2>Your Rights</h2>
          <p>
            Under the GDPR you have the right to access, correct, delete, restrict, or port your personal data, and
            to object to its processing. Email <a href="mailto:legal@bulgarian.dev">legal@bulgarian.dev</a> and we will
            reply within one month. You can also complain to the Bulgarian Commission for Personal Data Protection
            (<a href="https://www.cpdp.bg" target="_blank" rel="noopener noreferrer">cpdp.bg</a>) or the data
            protection authority in your country.
          </p>
        </section>

        <section>
          <h2>Changes to This Policy</h2>
          <p>
            We may update this policy as the service changes and will update the date above when we do.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            Максим Фидлер (Maxim Fiedler), software developer<br />
            8217 Aheloy, Burgas Province, Bulgaria<br />
            Email: <a href="mailto:legal@bulgarian.dev">legal@bulgarian.dev</a><br />
            The full postal address is available on request by email.
          </p>
        </section>
      </main>
    </div>
  )
}
