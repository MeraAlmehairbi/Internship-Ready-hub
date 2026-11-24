# Team P06 · Internship Preparation LMS · Sprint 3 demo

This is a **standalone classroom demonstration** of the Internship Preparation LMS. It is intentionally separate from the repository's existing React/Vite production prototype under `artifacts/internship-prep-lms` and does not replace the Replit deployment.

## Open locally

Open `docs/index.html` in Chrome, or from `docs/` run `python3 -m http.server 8080` and visit http://localhost:8080.

## What can be demonstrated

- Student overview and progress tracking
- Three courses and lesson completion
- CV quiz and a saved score
- Upload, reopen and download a sample PDF using browser IndexedDB
- Readiness report and JSON export
- Reset demo data between rehearsals

**Limitations:** Student Raisa is sample data; `localStorage` and `IndexedDB` work in **one browser only**; no sign-in, backend database, or real integration with Student Profile / Admin Review. The exported JSON file is not automatically sent to other IPP teams. The existing React app and Replit website remain unchanged.

## GitHub Pages publishing

In the GitHub repository, open **Settings → Pages → Build and deployment**. Select **Deploy from a branch**, `main` (after this change has been approved/merged), and **/docs**. GitHub Pages then serves `docs/index.html` at the repository's Pages URL. Confirm with the team before enabling Pages on a shared repository.

## Recommended collaboration

Use a feature branch and pull request to add `docs/` and `README_P06_MVP.md`, rather than replacing the existing application. A teammate with write access should review the change before merging.
