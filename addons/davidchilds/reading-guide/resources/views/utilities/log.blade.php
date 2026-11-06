{{--
    Control Panel › Utilities › Reading Guide (davidchilds/reading-guide)
    Statamic compiles this HTML as a Vue template, so every value that came from a
    visitor (or the model) sits inside a `v-pre` element: Vue then shows it as text
    instead of evaluating any {{ }} it contains. Blade's {{ }} handles HTML escaping.
--}}
@php
    $link = fn (array $q) => request()->url().'?'.http_build_query(array_merge(['days' => $days, 'view' => $mode], $q));
    $outcomes = [
        'answered' => ['green', 'Answered'],
        'no_match' => ['amber', 'No match'],
        'error' => ['red', 'Error'],
        'daily_limit' => ['default', 'Daily limit'],
    ];
    $th = 'padding: 8px 12px; text-align: left; font-weight: 500; font-size: 12px; opacity: .7; white-space: nowrap;';
    $td = 'padding: 10px 12px; vertical-align: top; border-top: 1px solid rgba(127,127,127,.2);';
    $muted = 'opacity: .65; font-size: 13px;';
    $periods = [1 => 'Today', 7 => 'Last 7 days', 30 => 'Last 30 days'];
@endphp

<ui-header title="Reading Guide" icon="ai-chat-spark"></ui-header>

<ui-description text="What visitors asked the reading guide, what it searched for, and which entries it suggested. Visitors are shown as a short hash, never an IP address. Logs are kept for {{ config('logging.channels.reading-guide.days') }} days."></ui-description>

<div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: space-between; margin: 20px 0 16px;">
    <div style="display: flex; flex-wrap: wrap; gap: 6px;">
        @foreach ($periods as $d => $label)
            <ui-button size="sm" variant="{{ $days === $d ? 'pressed' : 'default' }}" href="{{ $link(['days' => $d]) }}">{{ $label }}</ui-button>
        @endforeach
    </div>
    <div style="display: flex; flex-wrap: wrap; gap: 6px;">
        <ui-button size="sm" variant="{{ $mode === 'all' ? 'pressed' : 'default' }}" href="{{ $link(['view' => 'all']) }}">Every question</ui-button>
        <ui-button size="sm" variant="{{ $mode === 'top' ? 'pressed' : 'default' }}" href="{{ $link(['view' => 'top']) }}">Most asked</ui-button>
    </div>
</div>

<ui-card style="margin-bottom: 16px;">
    <div style="display: flex; flex-wrap: wrap; gap: 32px;">
        <div><div style="font-size: 24px; font-weight: 600;">{{ number_format($summary['questions']) }}</div><div style="{{ $muted }}">questions</div></div>
        <div><div style="font-size: 24px; font-weight: 600;">{{ number_format($summary['visitors']) }}</div><div style="{{ $muted }}">visitors</div></div>
        <div><div style="font-size: 24px; font-weight: 600;">{{ number_format($summary['no_match']) }}</div><div style="{{ $muted }}">with no match</div></div>
        <div><div style="font-size: 24px; font-weight: 600;">{{ number_format($summary['input_tokens'] + $summary['output_tokens']) }}</div><div style="{{ $muted }}">tokens ({{ number_format($summary['input_tokens']) }} in / {{ number_format($summary['output_tokens']) }} out)</div></div>
    </div>
</ui-card>

@if ($summary['questions'] === 0)
    <ui-card>
        <p style="margin: 0;">No questions in this period yet. Once the reading guide is switched on (Tools › Addons › Reading Guide › Settings), every visitor question shows up here.</p>
    </ui-card>
@elseif ($mode === 'top')
    <ui-card inset>
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <thead><tr>
                    <th style="{{ $th }}">Asked</th>
                    <th style="{{ $th }} text-align: right;">Times</th>
                    <th style="{{ $th }} text-align: right;">No match</th>
                    <th style="{{ $th }}">Last suggested</th>
                </tr></thead>
                <tbody>
                    @foreach ($top as $row)
                        <tr>
                            <td style="{{ $td }}" v-pre>{{ $row['asked'] }}</td>
                            <td style="{{ $td }} text-align: right; font-variant-numeric: tabular-nums;">{{ $row['times'] }}</td>
                            <td style="{{ $td }} text-align: right; font-variant-numeric: tabular-nums;">{{ $row['no_match'] ?: '' }}</td>
                            <td style="{{ $td }}" v-pre>{{ $row['last_shown'][0] ?? '—' }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </ui-card>
@else
    <ui-card inset>
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <thead><tr>
                    <th style="{{ $th }}">When</th>
                    <th style="{{ $th }}">Asked</th>
                    <th style="{{ $th }}">Searched for</th>
                    <th style="{{ $th }}">Suggested</th>
                    <th style="{{ $th }}">Result</th>
                </tr></thead>
                <tbody>
                    @foreach ($entries as $e)
                        @php([$color, $label] = $outcomes[$e['outcome'] ?? ''] ?? ['default', $e['outcome'] ?? '—'])
                        <tr>
                            <td style="{{ $td }} white-space: nowrap;">
                                {{ \Davidchilds\ReadingGuide\Support\ChatLog::time($e['time']) }}
                                <div style="{{ $muted }} font-family: ui-monospace, monospace; font-size: 12px;" title="Visitor">{{ $e['visitor'] ?? '' }}@if (($e['turn'] ?? 1) > 1) · follow-up @endif</div>
                            </td>
                            <td style="{{ $td }} min-width: 220px;" v-pre>{{ $e['asked'] ?? '' }}</td>
                            <td style="{{ $td }} {{ $muted }}" v-pre>{{ implode(', ', $e['searches'] ?? []) ?: '—' }}</td>
                            <td style="{{ $td }} min-width: 220px;" v-pre>
                                @forelse ($e['shown'] ?? [] as $title)
                                    <div>{{ $title }}</div>
                                @empty
                                    <span style="opacity: .5;">—</span>
                                @endforelse
                            </td>
                            <td style="{{ $td }}"><ui-badge color="{{ $color }}" size="sm">{{ $label }}</ui-badge></td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </ui-card>
    @if ($summary['questions'] > $entries->count())
        <p style="{{ $muted }} margin-top: 8px;">Showing the latest {{ $entries->count() }} of {{ number_format($summary['questions']) }}. Run <code>php artisan reading-guide:log --days={{ $days }}</code> for all of them.</p>
    @endif
@endif
