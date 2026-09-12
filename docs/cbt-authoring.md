# School CBT authoring

The school-only **CBT authoring** page provides campus/class/subject selection, academic session and term setup for owners, question banks, question creation and new versions, review/approval/archive actions, draft exams, editable settings, fixed-question sections and random pools, scheduling and student PIN issuance.

All eight backend question types have form controls. Options and answer keys are submitted with only the validator's accepted fields. Review actions require reasons and remain subject to server permissions and separation-of-duty rules. Published question content is revised by creating a new version.

PINs are shown only in page memory and can be hidden immediately. Reissuing a PIN invalidates the previous credentials; enrollment is checked on the server. No PIN is persisted in browser storage.

The student route statically loads only the exam application and shared dependencies. Staff routes load via a dynamic import. The offline shell follows static bundle imports and excludes the staff chunk.

Use Yarn for this repository. The backend uses its own npm lockfile.
