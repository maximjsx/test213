import Link from 'next/link'
import styles from './page.module.css'

export const metadata = {
  title: 'Legal Notice',
  description: 'Legal notice and contact information for Learn Bulgarian.',
}

export default function LegalPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.back}>Back to course</Link>
      </header>
      <main className={styles.main}>
        <h1>Legal Notice</h1>

        <section>
          <h2>Service Provider</h2>
          <p>
            <strong>Максим Фидлер</strong> (Maxim Fiedler)<br />
          </p>
          <p>
            1 6 66<br />
            8217 гр. Ахелой, област Бургас<br />
            Република България (Republic of Bulgaria)
          </p>
          <p><em>Please do not send letters to this address. Use email for correspondence.</em></p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            Email: <a href="mailto:legal@bulgarian.dev">legal@bulgarian.dev</a><br />
            Phone: <a href="tel:+359888839802">+359 88 8839802</a>
          </p>
        </section>

        <section>
          <h2>Editorial Responsibility</h2>
          <p>
            Максим Фидлер (Maxim Fiedler)<br />
            1 6 66, 8217 гр. Ахелой, област Бургас<br />
            Република България
          </p>
        </section>

        <section>
          <h2>Disclaimer</h2>
          <p>
            The content on Learn Bulgarian is provided for educational purposes only.
            We make no warranty about the completeness or accuracy of the course material.
            All trademarks and registered trademarks mentioned belong to their respective owners.
          </p>
        </section>

        <section>
          <h2>Dispute Resolution</h2>
          <p>
            The European Commission provides an online dispute resolution platform:{' '}
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
              https://ec.europa.eu/consumers/odr
            </a>.
            We are not obligated to participate in dispute resolution proceedings before a consumer arbitration board.
          </p>
        </section>
      </main>
    </div>
  )
}
