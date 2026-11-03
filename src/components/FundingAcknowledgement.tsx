import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';

// The standard funding acknowledgement. The grant agreement number belongs
// to ELIAS, the parent Horizon Europe project, and is always attributed to
// ELIAS. News posts carry the same wording inline.
export default function FundingAcknowledgement(): ReactNode {
  return (
    <p>
      <em>
        The GUARDIAN project received financial support through the{' '}
        <Link to="https://elias-ai.eu/opportunities/elias-2nd-open-call/">
          ELIAS 2nd FSTP Open Call
        </Link>
        . ELIAS — the European Lighthouse of AI for Sustainability — is funded
        by the European Union&apos;s Horizon Europe research and innovation
        programme under grant agreement No. 101120237.
      </em>
    </p>
  );
}
