# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

**Note:** :star: indicates versions published to the Firefox Add-ons site.

## [Released]

---

## [Unreleased]

### [0.1.1] 2025-07-27

#### Changed
- Currency selection lists in `popup.html` are now dynamically generated by JavaScript, removing hardcoded `<option>` elements.
- Updated `popup.js` to populate currency `<select>` elements using the `availableCurrencies` array, making it easier to add or remove supported currencies.

### [0.1.0] 2025-07-22

#### Added
- Initial scaffolding of the extension.
- Basic static currency conversion UI.
