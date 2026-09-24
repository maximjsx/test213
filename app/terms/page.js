import Link from 'next/link'
import styles from '../legal/page.module.css'

export const metadata = {
  title: 'Terms of Use',
  description: 'Terms of use for Learn Bulgarian, including the terms for contributing voice recordings.',
}

export default function TermsPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.back}>Back to course</Link>
      </header>
      <main className={styles.main}>
        <h1>Terms of Use</h1>
        <p className={styles.updated}>Last updated: September 2026</p>

        <section>
          <h2>Who We Are</h2>
          <p>
            Learn Bulgarian (learn.bulgarian.dev) is run by o7studios EOOD, Sredna Gora St. 1, Floor 6, Apt. 66,
            8217 Aheloy, Bulgaria. By using the site you agree to these terms. If you do not agree, please do not
            use it.
          </p>
        </section>

        <section>
          <h2>The Service</h2>
          <p>
            Learn Bulgarian is a free course. We may add, change, or remove lessons and features at any time, and
            we do not promise that the site will always be available or free of errors.
          </p>
        </section>

        <section>
          <h2>Accounts</h2>
          <p>
            Signing in with Discord is optional. You are responsible for what happens under your account. Choose a
            username that is not offensive and does not pretend to be someone else. We may rename, suspend, or
            delete accounts that break these terms.
          </p>
        </section>

        <section>
          <h2>Acceptable Use</h2>
          <ul>
            <li>Do not upload anything unlawful, hateful, sexual, or that belongs to someone else.</li>
            <li>Do not try to cheat the leaderboard, certificates, or quests.</li>
            <li>Do not overload, scrape, or misuse our servers or the speech services behind them.</li>
          </ul>
        </section>

        <section id="recordings">
          <h2>Voice Recordings</h2>
          <p>
            Signed-in users can record words and sentences for the course in the voice studio. Before your first
            recording you are asked to accept these terms. By submitting a recording you confirm that:
          </p>
          <ul>
            <li>it is your own voice and you have the right to give the license below;</li>
            <li>you are 18 or older, or a parent or guardian has agreed on your behalf.</li>
          </ul>
          <p>
            <strong>License.</strong> You give o7studios EOOD a worldwide, royalty-free, non-exclusive, perpetual,
            and irrevocable license to use, copy, edit, adapt, publish, and distribute your recordings, as part of
            Learn Bulgarian and its related materials, and to let others do so on our behalf. You keep ownership of
            your recordings and may use them anywhere else you like.
          </p>
          <p>
            <strong>Credit.</strong> Approved recordings are shown with your username as the speaker. You agree
            that we may stop crediting you, for example when you delete your account.
          </p>
          <p>
            <strong>After you delete your account.</strong> Recordings that have not been reviewed yet are deleted.
            Approved recordings stay in the course, because lessons depend on them, but your username and account
            ID are removed from them.
          </p>
          <p>
            <strong>Review.</strong> We decide which recordings to use and may reject or remove any recording at
            any time, without giving a reason.
          </p>
          <p>
            This license covers copyright and related rights in the recordings. It does not take away any rights
            you have under data protection law. See the <Link href="/privacy#recordings">Privacy Policy</Link> for
            how we handle recordings as personal data.
          </p>
        </section>

        <section>
          <h2>Certificates</h2>
          <p>
            Certificates confirm that you finished the listed lessons on Learn Bulgarian. They are not an official
            CEFR exam result or a qualification from any authority. We may revoke a certificate that was obtained
            by cheating.
          </p>
        </section>

        <section>
          <h2>Our Content</h2>
          <p>
            The lessons, design, and code of Learn Bulgarian belong to o7studios EOOD or its licensors. You may use
            them for your own learning. Please do not copy or republish them without asking us first.
          </p>
        </section>

        <section>
          <h2>Liability</h2>
          <p>
            The service is provided free of charge and as is. To the extent Bulgarian law allows, we are not liable
            for indirect losses or for losses caused by the site being unavailable. Nothing in these terms limits
            liability for intent or gross negligence, or any rights you have as a consumer that cannot be waived.
          </p>
        </section>

        <section>
          <h2>Changes and Governing Law</h2>
          <p>
            We may update these terms and will change the date above when we do. If we change the voice recording
            terms, you will be asked to accept the new version before recording again. These terms are governed by
            Bulgarian law. This does not take away the protection of mandatory consumer laws in your country.
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
