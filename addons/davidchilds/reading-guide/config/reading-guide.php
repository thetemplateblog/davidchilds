<?php

/*
|--------------------------------------------------------------------------
| Reading Guide
|--------------------------------------------------------------------------
|
| Technical settings. Wording (title, greeting, suggested questions, what
| your site is about) and the on/off switch live in the Control Panel:
| Tools › Addons › Reading Guide › Settings.
|
| Publish this file with: php artisan vendor:publish --tag=reading-guide-config
|
*/

return [

    // Claude API. The guide stays hidden until a key is set.
    'api_key' => env('READING_GUIDE_API_KEY', env('ANTHROPIC_API_KEY')),
    'model' => env('READING_GUIDE_MODEL', 'claude-haiku-5-5'),
    'max_tokens' => 1500,

    // What the guide can search. Only published entries are ever returned.
    'search' => [
        // Statamic search index to use. If no index with this name exists in
        // config/statamic/search.php, the addon defines one from the settings below.
        'index' => 'reading_guide',
        'collections' => ['blog'],
        'fields' => ['title', 'excerpt'],

        // Field shown under each suggested entry, and passed to the model.
        'summary_field' => 'excerpt',

        // Optional taxonomy field passed to the model as topics.
        'topics_field' => 'categories',
    ],

    'limits' => [
        // Per visitor (by IP).
        'per_minute' => 8,
        'per_day' => 60,

        // Whole site, so a traffic spike can't run up the API bill.
        'site_per_day' => (int) env('READING_GUIDE_DAILY_LIMIT', 300),
    ],

    // Question log: one file per day, reading-guide-YYYY-MM-DD.log
    'log' => [
        'enabled' => true,
        'days' => (int) env('READING_GUIDE_LOG_DAYS', 30),
        'path' => storage_path('logs/reading-guide'),
    ],

];
