<?php

namespace Davidchilds\ReadingGuide\Support;

use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * Reads the question log: storage/logs/reading-guide/reading-guide-YYYY-MM-DD.log,
 * one JSON line per visitor question (written by ChatController).
 */
class ChatLog
{
    public const CHANNEL = 'reading-guide';

    /** Questions from the last $days days, oldest first. */
    public static function entries(int $days = 1): Collection
    {
        $days = max(1, $days);

        return collect(range($days - 1, 0))
            ->map(fn ($ago) => static::path(now()->subDays($ago)))
            ->filter(fn ($path) => is_file($path))
            ->flatMap(fn ($path) => file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES))
            ->map(fn ($line) => static::parse($line))
            ->filter()
            ->values();
    }

    /** Most common questions, grouped case- and whitespace-insensitively. */
    public static function top(Collection $entries, int $limit = 25): Collection
    {
        return $entries
            ->groupBy(fn ($e) => Str::of($e['asked'] ?? '')->lower()->squish()->toString())
            ->map(fn ($group, $asked) => [
                'asked' => $asked,
                'times' => $group->count(),
                'no_match' => $group->where('outcome', 'no_match')->count(),
                'last_shown' => $group->last()['shown'] ?? [],
            ])
            ->sortByDesc('times')
            ->take($limit)
            ->values();
    }

    public static function summary(Collection $entries): array
    {
        return [
            'questions' => $entries->count(),
            'visitors' => $entries->pluck('visitor')->unique()->count(),
            'no_match' => $entries->where('outcome', 'no_match')->count(),
            'input_tokens' => (int) $entries->sum('input_tokens'),
            'output_tokens' => (int) $entries->sum('output_tokens'),
        ];
    }

    public static function parse(string $line): ?array
    {
        $data = json_decode($line, true);

        if (! is_array($data) || ($data['message'] ?? null) !== 'question') {
            return null;
        }

        return ['time' => $data['datetime'] ?? null] + (array) ($data['context'] ?? []);
    }

    public static function directory(): string
    {
        return rtrim((string) (config('reading-guide.log.path') ?: storage_path('logs/reading-guide')), '/');
    }

    public static function path(Carbon $day): string
    {
        return static::directory().'/reading-guide-'.$day->toDateString().'.log';
    }

    /** Log channel definition; the addon registers it unless the site defines its own. */
    public static function channelConfig(): array
    {
        return [
            'driver' => 'daily',
            'path' => static::directory().'/reading-guide.log',
            'level' => 'info',
            'days' => (int) config('reading-guide.log.days', 30),
            'formatter' => \Monolog\Formatter\JsonFormatter::class,
            'replace_placeholders' => true,
        ];
    }

    /** Format a log timestamp in the CP's display timezone. */
    public static function time(?string $datetime, string $format = 'M j, g:i a'): string
    {
        if (! $datetime) {
            return '';
        }

        $zone = config('statamic.system.display_timezone') ?: config('app.timezone');

        return Carbon::parse($datetime)->setTimezone($zone)->format($format);
    }
}
