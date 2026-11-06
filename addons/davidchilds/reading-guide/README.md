# Reading Guide

A Statamic 6 addon that adds an AI "What would you like to read?" guide to your site. Visitors type what they're curious about; Claude searches your published entries and suggests up to three, with a sentence on why each fits.

- **Only your content.** The model's single job is to search your entries and pick from the results. It can't browse the web, and the panel only links to entries the search actually returned, never URLs the model writes.
- **Only published entries.** Drafts and scheduled entries are never offered.
- **Cost controls.** Per-visitor rate limits plus a site-wide daily cap. Built for a small, fast model (Claude Haiku by default).
- **See what people ask.** Every question is logged (visitor as a short hash, never an IP). Browse it in the Control Panel under **Utilities › Reading Guide**, or with `php artisan reading-guide:log`.

## Requirements

- Statamic 6, PHP 8.2+
- [Alpine.js](https://alpinejs.dev) on the front end (the panel is an Alpine component)
- A Claude API key

## Install

```bash
composer require davidchilds/reading-guide
php artisan vendor:publish --tag=reading-guide-config   # optional, to change collections/fields/limits
```

Add the key to `.env`:

```env
ANTHROPIC_API_KEY=sk-ant-...
# optional
READING_GUIDE_MODEL=claude-haiku-5-5
READING_GUIDE_DAILY_LIMIT=300
READING_GUIDE_LOG_DAYS=30
```

Build the search index (and add this to your deploy script, since entries changed through Git don't update the index on their own):

```bash
php please search:update reading_guide
```

Then switch it on in **Tools › Addons › Reading Guide › Settings**, where you also set the title, greeting, suggested questions, a one-line description of your site and the topics you cover.

The guide only appears when it's switched on **and** an API key is configured, so an environment without a key never shows a guide that can't answer.

## Templates

Place the panel once in your layout, before `</body>`:

```antlers
{{ reading_guide }}
```

Open it from anything, using Alpine's `$dispatch`:

```antlers
{{ if {reading_guide:ready} }}
    <button type="button" @click="$dispatch('reading-guide-open')">Ask</button>

    <form x-data="{ q: '' }" @submit.prevent="$dispatch('reading-guide-open', { q }); q = ''">
        <label for="ask">{{ reading_guide:title }}</label>
        <input id="ask" x-model="q">
    </form>

    {{ reading_guide:suggestions }}
        <button type="button" @click="$dispatch('reading-guide-open', { q: '{{ value | entities }}' })">{{ value }}</button>
    {{ /reading_guide:suggestions }}
{{ /if }}
```

| Tag | Returns |
| --- | --- |
| `{{ reading_guide }}` | The chat panel (nothing when the guide is off) |
| `{{ reading_guide:ready }}` | `true` when switched on and a key is set |
| `{{ reading_guide:title }}` | Title from the settings |
| `{{ reading_guide:suggestions }}` | Loop of suggested questions (`{{ value }}`) |

### Styling

The panel uses Tailwind utility classes (with `dark:` variants for class-based dark mode). Add the addon's views to your Tailwind `content` paths:

```js
'./vendor/davidchilds/reading-guide/resources/views/**/*.antlers.html',
```

To change the markup, copy `resources/views/panel.antlers.html` to `resources/views/vendor/reading-guide/panel.antlers.html` in your site.

## Configuration

`config/reading-guide.php`:

| Key | Default | |
| --- | --- | --- |
| `search.collections` | `['blog']` | Collections the guide can recommend from |
| `search.fields` | `['title', 'excerpt']` | Fields that are searched (keep long body fields out; they drown out title matches) |
| `search.summary_field` | `excerpt` | Shown under each suggestion and given to the model |
| `search.topics_field` | `categories` | Taxonomy field given to the model as topics |
| `search.index` | `reading_guide` | Search index name. Defined automatically unless `config/statamic/search.php` already has one with this name |
| `limits.per_minute` / `per_day` | 8 / 60 | Per visitor |
| `limits.site_per_day` | 300 | Whole site |
| `log.days` / `log.path` | 30 / `storage/logs/reading-guide` | Question log retention and location. Keep this folder out of Git |

## The question log

One JSON line per question in `storage/logs/reading-guide/reading-guide-YYYY-MM-DD.log`: what was asked, the keywords searched, the entries suggested, the outcome (`answered`, `no_match`, `daily_limit`, `error`) and token counts.

- **Control Panel:** Utilities › Reading Guide. Super admins see it; give other roles the *Reading Guide* utility permission.
- **Terminal:** `php artisan reading-guide:log` (`--days=7`, `--top` for most asked, `--follow` to watch live).

Visitors type free text, so the log can contain personal information. Mention it in your privacy policy, and keep the folder out of version control.

## Security notes

- Visitor text is rendered as text everywhere: `x-text` in the panel, and `v-pre` in the CP utility (Statamic compiles utility views as Vue templates, so a visitor's `{{ }}` would otherwise be evaluated in an admin's browser).
- Search results are passed to the model as data with an instruction to ignore instructions inside them, and the model has no tools beyond searching and choosing results.
