import type {ReactNode} from 'react';

// The canonical project-status line, rendered on the landing page, the
// Evaluation Result page and the open-call news post. The support statement
// and the project period are also restated in prose on the About,
// Objectives, Expected Outputs, What is ELIAS?, The 2nd Open Call & FSTP,
// Work Plan and Deliverables pages and in the news posts; when the status
// changes, update this wording and those pages together.
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
