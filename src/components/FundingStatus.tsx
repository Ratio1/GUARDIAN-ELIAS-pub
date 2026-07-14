import type {ReactNode} from 'react';

// Single reusable source of truth for GUARDIAN's public funding/evaluation
// status sentence. Used on the landing page and the ELIAS wiki page so the
// wording only has to be updated in one place.
//
// Post-SGA gate: replace wording only after the signed agreement is stored
// and its communication obligations are confirmed.
export default function FundingStatus(): ReactNode {
  return (
    <p>
      Naeural SRL — the applicant behind GUARDIAN — ranked #2 (score 8.86)
      in the published evaluation of the ELIAS 2nd Open Call.
    </p>
  );
}
