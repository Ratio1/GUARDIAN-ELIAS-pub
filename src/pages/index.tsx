import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import FundingStatus from '@site/src/components/FundingStatus';
import FundingAcknowledgement from '@site/src/components/FundingAcknowledgement';

import styles from './index.module.css';

const summary =
  'Resource-aware, auditable edge AI for energy-sector monitoring and operations-center co-piloting';

function HomepageHeader() {
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          GUARDIAN
        </Heading>
        <p className="hero__subtitle">{summary}</p>
        <div className={styles.buttons}>
          <Link className="button button--secondary button--lg" to="/docs/about">
            About the project
          </Link>
        </div>
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
      'A toolkit and benchmark for comparing operational AI workloads across low-power edge, low-end VPS, local-server and cloud profiles.',
  },
  {
    title: 'Why',
    description:
      'To show where a workload can run, how fast it responds, what data has to leave the site and what resources it uses. Environmental benefits are measured, not assumed.',
  },
  {
    title: 'How',
    description:
      'CPU-first, smaller-model inference, including small language models, on the Ratio1 edge platform, measured with one benchmark protocol.',
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
                  <Heading as="h2">{card.title}</Heading>
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

function HomepageProgress() {
  return (
    <section className={styles.progress}>
      <div className="container">
        <Heading as="h2">Work in progress</Heading>
        <p>
          GUARDIAN is progressing with both validation partners:{' '}
          <Link to="/docs/use-cases/energy-monitoring">MONSSON</Link>, on
          SLM-based second-opinion agents for energy-sector operations, and{' '}
          <Link to="/docs/use-cases/operations-center-copilot">
            Hyperfy (GOC)
          </Link>
          , on efficient SLM deployment on CPU-first edge and VPS
          infrastructure in a physical-security co-pilot demonstrator.{' '}
          <Link to="/blog/guardian-progressing-with-monsson-and-hyperfy">
            Read the November 2026 update
          </Link>
          .
        </p>
        <p>
          Both scenarios are advisory-only: operators stay in control, with no
          live asset control, automated enforcement, live dispatch or
          biometric identification.
        </p>
      </div>
    </section>
  );
}

function HomepageStatus() {
  return (
    <section className={styles.status}>
      <div className="container">
        <FundingStatus />
        <FundingAcknowledgement />
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout title="GUARDIAN" description={summary}>
      <HomepageHeader />
      <main>
        <HomepageCards />
        <HomepageProgress />
        <HomepageStatus />
      </main>
    </Layout>
  );
}
