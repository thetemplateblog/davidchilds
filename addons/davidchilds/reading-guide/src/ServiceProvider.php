<?php

namespace Davidchilds\ReadingGuide;

use Davidchilds\ReadingGuide\Support\ChatLog;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Statamic\Facades\Utility;
use Statamic\Providers\AddonServiceProvider;

/**
 * Auto-discovered by Statamic: config/reading-guide.php, routes/actions.php,
 * resources/blueprints/settings.yaml, resources/views (reading-guide::),
 * src/Tags and src/Console/Commands.
 */
class ServiceProvider extends AddonServiceProvider
{
    public function bootAddon()
    {
        $this->registerSearchIndex()
            ->registerLogChannel()
            ->registerRateLimiter()
            ->registerUtility();
    }

    /** Define the search index unless the site already has one with that name. */
    protected function registerSearchIndex(): self
    {
        $index = config('reading-guide.search.index');

        if ($index && ! config("statamic.search.indexes.{$index}")) {
            config(["statamic.search.indexes.{$index}" => ReadingGuide::defaultIndexConfig()]);
        }

        return $this;
    }

    protected function registerLogChannel(): self
    {
        if (! config('logging.channels.'.ChatLog::CHANNEL)) {
            config(['logging.channels.'.ChatLog::CHANNEL => ChatLog::channelConfig()]);
        }

        return $this;
    }

    /** Per-visitor limits; the controller also caps the whole site per day. */
    protected function registerRateLimiter(): self
    {
        RateLimiter::for('reading-guide', fn (Request $request) => [
            Limit::perMinute((int) config('reading-guide.limits.per_minute', 8))->by($request->ip()),
            Limit::perDay((int) config('reading-guide.limits.per_day', 60))->by($request->ip()),
        ]);

        return $this;
    }

    /** Control Panel › Utilities › Reading Guide: what visitors asked. */
    protected function registerUtility(): self
    {
        Utility::extend(function () {
            Utility::register('reading_guide')
                ->title('Reading Guide')
                ->navTitle('Reading Guide')
                ->icon('ai-chat-spark')
                ->description('See what visitors ask the reading guide and which entries it suggested.')
                ->view('reading-guide::utilities.log', function (Request $request) {
                    $days = in_array((int) $request->query('days'), [1, 7, 30], true) ? (int) $request->query('days') : 7;
                    $entries = ChatLog::entries($days);

                    return [
                        'days' => $days,
                        'mode' => $request->query('view') === 'top' ? 'top' : 'all',
                        'entries' => $entries->reverse()->take(300)->values(),
                        'top' => ChatLog::top($entries),
                        'summary' => ChatLog::summary($entries),
                    ];
                });
        });

        return $this;
    }
}
