# Contributing

Thanks for your interest in improving [Node Screenshot](https://community.obsidian.md/plugins/canvas-node-screenshot)!

## Reporting bugs and ideas

[Open an issue](https://github.com/cestfredy/obsidian-canvas-node-screenshot/issues) and include:

- your Obsidian version and operating system,
- the type of node you tried to capture (text, note, image, link, group),
- what you expected and what happened instead.

## Submitting a pull request

1. Fork the repository and clone it into the `.obsidian/plugins/` folder of a test vault.
2. Install dependencies with `npm install`.
3. Run `npm run dev` to rebuild `main.js` on every change, then reload the plugin in Obsidian.
4. Before opening the pull request, make sure `npm run build` passes.

Please keep each pull request focused on a single change, and avoid unrelated edits (formatting, lockfile updates, etc.).

## Releases

Releases are handled by the maintainer. `npm version patch` (or `minor` / `major`) bumps the version, and pushing the tag triggers the release workflow.
