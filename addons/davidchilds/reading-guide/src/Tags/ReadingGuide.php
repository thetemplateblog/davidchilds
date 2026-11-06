<?php

namespace Davidchilds\ReadingGuide\Tags;

use Davidchilds\ReadingGuide\ReadingGuide as Guide;
use Statamic\Tags\Tags;

/**
 * {{ reading_guide }}              the chat panel (place once, before </body>)
 * {{ if {reading_guide:ready} }}   true when switched on and an API key is set
 * {{ reading_guide:title }}        panel title from the addon settings
 * {{ reading_guide:suggestions }}  loop of suggested questions ({{ value }})
 *
 * Open the panel from anything with Alpine:
 *   $dispatch('reading-guide-open')                    just open it
 *   $dispatch('reading-guide-open', { q: 'question' }) open and ask
 */
class ReadingGuide extends Tags
{
    protected static $handle = 'reading_guide';

    public function index()
    {
        return $this->panel();
    }

    public function panel()
    {
        if (! Guide::ready()) {
            return '';
        }

        return view('reading-guide::panel', [
            'title' => Guide::title(),
            'greeting' => Guide::greeting(),
            'suggestions' => array_map(fn ($s) => ['value' => $s], Guide::suggestions()),
            'endpoint' => route('statamic.reading-guide.chat', [], false),
            'launcher' => Guide::launcher(),
            'launcher_label' => Guide::launcherLabel(),
            'launcher_badge' => Guide::launcherBadge(),
        ])->render();
    }

    public function ready()
    {
        return Guide::ready();
    }

    public function title()
    {
        return Guide::title();
    }

    public function suggestions()
    {
        return array_map(fn ($s) => ['value' => $s], Guide::suggestions());
    }
}
