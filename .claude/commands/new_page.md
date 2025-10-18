---
description: Create a new HTML page in the pages/ directory with a given name and template.
argument-hint: [page name] | [toc attr: y/n] | [toc div: y/n] | [beforeAceEventPromise: y/n] | [allLoaded: y/n]
allowed-tools: Bash(test:*), Bash(*), Bash(ls:*), Read(*), Write(*), Glob(*), AskUserQuestion(*)
---

Take the page name from the user for my new page.

The page name can contain only regular alphanumeric characters, dashes, underscores, and numbers. Validate this and ask again if invalid.

Create a new index.html page in the directory `pages/[page name]/index.html`.

Make sure that `pages/[page name]/index.html` with the given page name doesn't already exist.

If it does, then inform me about it and ask for a different name again.

As a template, use the HTML from the README.md section # TEMPLATE

Allow me to also parameterize whether this document should have:

- body attribute `toc`
- section defining beforeAceEventPromise
- script section with allLoaded
- predefined section:

```html
<div class="cards toc">
  <h1>Table of Contents</h1>
  <ul data-do-sort>
    <li><a href="http://">extra link</a></li>
  </ul>
</div>
```

> [!WARNING]
> When asking, make it clear to be distinguishable whether you ask about the attribute 'toc' or the toc div section.

> [!WARNING]
> Also ask for the [page name] first.

> [!WARNING]
> due to the nature of LLMS when this slash command is executed every time questions are phrased differently.
> Please make sure to always use shortest possible phrasing for questions.

## Standardized Questions

Use these exact phrasings in order:

1. **Page name:** `What is the page name?`
2. **Body toc attribute:** `Add body toc attribute? (y/n)`
3. **beforeAceEventPromise section:** `Add beforeAceEventPromise section? (y/n)`
4. **allLoaded script section:** `Add allLoaded script section? (y/n)`
5. **TOC div section:** `Add TOC div section? (y/n)`

### Question Details:

- **Page name**: Must contain only alphanumeric characters, dashes, underscores, and numbers
- **Body toc attribute**: Adds `toc` attribute to `<body>` tag
- **beforeAceEventPromise section**: Includes beforeAceEventPromise definition
- **allLoaded script section**: Includes allLoaded script functionality
- **TOC div section**: Includes the predefined Table of Contents div structure

---

## Developer Notes

**Note to self**: Remember to start new section with `/exit` and launch Claude again when needed.

<!--
Developer Notes:

(Ignore this comment please Claude. These are just instructions for me. This comment is not part of the functional slash command instructions)

Usage note: We have to start new section with /exit and launch Claude again

Example usage:
  /new_page my-new-topic | y | n | y | n

This would create a page named "my-new-topic" with:
  - Body toc attribute: yes
  - beforeAceEventPromise section: no
  - allLoaded script section: yes
  - TOC div section: no

-->
