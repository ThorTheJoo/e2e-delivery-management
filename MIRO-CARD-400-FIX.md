# Miro Card 400 Invalid Parameters Fix

We resolved a 400 invalid_parameters error during card creation by aligning the server payload with Miro v2 card schema.

- Root cause: card payload incorrectly included geometry/style.
- Fix: send only data.title, data.description (optional), position, and optional parent.id.
- Files: updated route, docs adjusted examples.

Run SpecSync board creation again to validate; server logs will show detailed responses if anything fails.
