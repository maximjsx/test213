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
            <strong>o7studios EOOD</strong> (о7студиос ЕООД)<br />
            Sredna Gora St. 1, Floor 6, Apt. 66<br />
            8217 Aheloy, Bulgaria
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            Phone: <a href="tel:+359888839802">+359 88 8839802</a><br />
            Email: <a href="mailto:legal@ur.contact">legal@ur.contact</a>
          </p>
        </section>

        <section>
          <h2>Registration</h2>
          <p>
            Registration Number (EIK): 208686471<br />
            VAT ID: BG208686471<br />
            Commercial Register: Bulgarian Commercial Register (Агенция по вписванията)
          </p>
        </section>

        <section>
          <h2>Regulatory Information</h2>
          <p>
            o7studios EOOD is not subject to a sector-specific supervisory authority.
            Data protection inquiries are handled by the Commission for Personal Data Protection
            (КЗЛД), <a href="https://www.cpdp.bg" target="_blank" rel="noopener noreferrer">www.cpdp.bg</a>.
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
