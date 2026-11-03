import type {ReactNode} from 'react';

// The current project-status line, shown on the landing page, the
// Evaluation Result page and the open-call news post. Pages render this
// component instead of restating the status, so the wording is changed in
// one place only.
export default function FundingStatus(): ReactNode {
  return (
    <p>
      GUARDIAN is a Naeural SRL (Ratio1) project supported through the ELIAS
      2nd FSTP Open Call, in which its proposal ranked 2nd with a score of
      8.86. The project started on 1 July 2026, and its six-month
      implementation runs to 31 December 2026.
    </p>
  );
}
