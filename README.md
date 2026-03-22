# Code Block Protection

A [SillyTavern](https://github.com/SillyTavern/SillyTavern) extension that prevents macros from being resolved inside code blocks.

## Problem

SillyTavern's macro system resolves `{{user}}`, `{{char}}`, `{{getvar::name}}`, and other macros everywhere in text - including inside fenced code blocks and inline code. This means if you want to show or discuss macro syntax literally (e.g. in tutorials, character card documentation, or coding examples), the macros get replaced before the text reaches the model or the screen.

## Solution

This extension hooks into the Macro Engine's pre/post processor pipeline:

1. **Before** macro evaluation - extracts all code blocks and replaces them with inert placeholders
2. **After** macro evaluation - restores the original code block content untouched

Code blocks are detected by standard markdown syntax:
- Fenced blocks: `` ``` ... ``` ``
- Inline code: `` ` ... ` ``

## Requirements

- SillyTavern 1.12.0+
- **Experimental Macro Engine** must be enabled (it is by default). Found in User Settings > Account.

## Installation

Use SillyTavern's built-in extension installer with this URL:

```text
https://github.com/CalamitousFelicitousness/SillyTavern-CodeBlockProtect
```

## Limitations

- **Regex scripts** are a separate processing layer and are not intercepted by this extension. Code blocks will still be affected by user-defined regex scripts.
- If the Experimental Macro Engine is disabled, this extension has no effect (a warning is shown in the settings panel).
