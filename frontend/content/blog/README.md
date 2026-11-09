# Blog content

Add an article file using `BlogPost` from `lib/blog-types.ts`, then register it in `lib/blog.ts` in newest-first order.
Routes, article layout, blog cards, and homepage Recent Blogs cards share this data. Paragraphs, headings, and static figures
are rendered on the server; articles do not need a Markdown runtime, client chart library, or embedded report viewer.

Keep dates at the source's known precision. Attribute figures and link to the original report next to each chart.
Reuse original report covers, figures, and tables. Do not redraw figures or invent cover artwork.
Figure crops preserve original axes, legends, values, and uncertainty intervals. Only page margins and surrounding
prose are removed. `source-images.json` records each original PDF, SHA-256, physical page, and crop region.

Regenerate the static PNGs with Poppler's `pdftoppm` and the standard Python library:

```bash
python scripts/extract-blog-images.py --meta-report /path/to/muse-spark-1-3-evaluation-report.pdf
```

The Pokee PDF defaults to the existing file in `public/papers/`. Python and Poppler are not needed to serve the site.
Homepage cards link only to real blog articles. Titles and summaries explain how the featured team uses DTap.
Recent Blogs uses a persistent horizontal scrollbar for dragging, touch, and keyboard scrolling.
Card previews layer a translucent, blurred copy of the report cover behind the clear original cover.
Captions describe the figures directly, with the figure number linking to the source page.
