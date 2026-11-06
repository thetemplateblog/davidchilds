<?php

namespace Davidchilds\ReadingGuide;

use Statamic\Facades\Addon;

/**
 * Shared helpers for the controller, tags and CP utility.
 */
class ReadingGuide
{
    public const PACKAGE = 'davidchilds/reading-guide';

    public static function setting(string $key, $default = null): mixed
    {
        $value = Addon::get(static::PACKAGE)?->setting($key);

        return filled($value) ? $value : $default;
    }

    /** Switched on in the CP and able to answer (an API key is configured). */
    public static function ready(): bool
    {
        return (bool) static::setting('enabled', false) && filled(config('reading-guide.api_key'));
    }

    public static function launcher(): bool
    {
        return (bool) static::setting('launcher', true);
    }

    public static function launcherLabel(): string
    {
        return (string) static::setting('launcher_label', 'Ask');
    }

    public static function launcherBadge(): bool
    {
        return (bool) static::setting('launcher_badge', true);
    }

    public static function title(): string
    {
        return (string) static::setting('title', 'What would you like to read?');
    }

    public static function greeting(): string
    {
        return (string) static::setting('greeting', "Tell me what you're curious about and I'll find the right article.");
    }

    public static function suggestions(): array
    {
        return array_values(array_filter(array_map('strval', (array) static::setting('suggestions', []))));
    }

    public static function topics(): array
    {
        return array_values(array_filter(array_map('strval', (array) static::setting('topics', []))));
    }

    public static function siteDescription(): string
    {
        return (string) static::setting('site_description', 'this website');
    }

    /** The search index definition the addon registers when the site hasn't defined one. */
    public static function defaultIndexConfig(): array
    {
        $fields = array_values((array) config('reading-guide.search.fields', ['title']));

        return [
            'driver' => 'local',
            'searchables' => array_map(fn ($c) => "collection:{$c}", (array) config('reading-guide.search.collections', [])),
            'fields' => $fields,
            'query_mode' => 'words',
            'use_stemming' => true,
            'property_weights' => array_map(fn ($f) => $f === 'title' ? 3 : 1, array_combine($fields, $fields)),
            'stop_words' => ['the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'about', 'with', 'how', 'what', 'is', 'my', 'i'],
        ];
    }
}
