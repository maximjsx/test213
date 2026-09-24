import styles from './About.module.css'

const EVENTS = [
  { when: '860s', title: 'The Glagolitic script', text: 'Cyril and Methodius create the first Slavic alphabet for their mission to Great Moravia.' },
  { when: '886', title: 'A school in Pliska', text: 'Their disciples reach Bulgaria and Prince Boris I founds a literary school, which moves to the capital Preslav in 893.' },
  { when: 'c. 900', title: 'Cyrillic takes shape', text: 'Scholars of the Preslav school adapt the Greek uncial script to Slavic sounds. This is the Cyrillic alphabet.' },
  { when: '9th to 11th c.', title: 'Old Bulgarian', text: 'Old Church Slavonic, the first Slavic language attested in writing, becomes the literary language of the Slavs.' },
  { when: '12th to 15th c.', title: 'Middle Bulgarian', text: 'The official language of the Second Bulgarian Empire. The genitive, locative and instrumental cases disappear from the language.' },
  { when: '16th c. on', title: 'Modern Bulgarian', text: 'In the 19th century, during the National Revival, a standard language forms on the eastern dialects.' },
  { when: '1899', title: 'First official spelling', text: 'The Drinov and Ivanchev orthography, with 32 letters, is made official after independence.' },
  { when: '1945', title: 'Spelling reform', text: 'The letters ѣ and ѫ are dropped, leaving the 30-letter alphabet used today.' },
  { when: '2007', title: 'Cyrillic in the EU', text: 'Bulgaria joins the European Union on 1 January and Cyrillic becomes its third official alphabet, after Latin and Greek.' },
]

export default function Timeline() {
  return (
    <ol className={styles.timeline}>
      {EVENTS.map(e => (
        <li key={e.when} className={styles.event}>
          <span className={styles.eventWhen}>{e.when}</span>
          <div className={styles.eventBody}>
            <h3 className={styles.eventTitle}>{e.title}</h3>
            <p className={styles.eventText}>{e.text}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
