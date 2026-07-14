import type {ReactNode} from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import FundingStatus from '@site/src/components/FundingStatus';

import styles from './index.module.css';

function HomepageHeader() {
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          GUARDIAN
        </Heading>
        <p className="hero__subtitle">
          Green, user-guided, auditable edge AI for renewable-storage
          monitoring and operations-center co-piloting
        </p>
      </div>
    </header>
  );
}

type CardProps = {
  title: string;
  description: string;
};

const cards: CardProps[] = [
  {
    title: 'What',
    description:
      'A reusable toolkit and benchmark for resource-aware AI on commodity edge and VPS infrastructure.',
  },
  {
    title: 'Why',
    description:
      'Greener, auditable operational AI, run close to the data instead of shipped off to a distant data center.',
  },
  {
    title: 'How',
    description:
      'CPU-first, smaller-model serving on the Ratio1 edge platform, measured by a common benchmark protocol.',
  },
];

function HomepageCards() {
  return (
    <section className={styles.cards}>
      <div className="container">
        <div className="row">
          {cards.map((card) => (
            <div key={card.title} className="col col--4">
              <div className={clsx('card', styles.card)}>
                <div className="card__header">
                  <Heading as="h3">{card.title}</Heading>
                </div>
                <div className="card__body">
                  <p>{card.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HomepageStatus() {
  return (
    <section className={styles.status}>
      <div className="container">
        <FundingStatus />
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title="GUARDIAN"
      description="Green, user-guided, auditable edge AI for renewable-storage monitoring and operations-center co-piloting">
      <HomepageHeader />
      <main>
        <HomepageCards />
        <HomepageStatus />
      </main>
    </Layout>
  );
}
