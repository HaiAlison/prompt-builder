<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

<!-- AGENT RULES:BEGIN -->
- The shared table component (src/components/common/data-table.tsx) exposes `Column<T>` as `{ id, header, cell, sort? }` and takes a `data` prop; FilterSelect label is optional. All list pages are written against this shape — do not switch back to key/render/rows.
<!-- AGENT RULES:END -->
