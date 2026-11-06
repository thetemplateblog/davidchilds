<?php

namespace Davidchilds\ReadingGuide\Console\Commands;

use Davidchilds\ReadingGuide\Support\ChatLog;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * Terminal view of the question log (the CP has Utilities › Reading Guide too).
 *
 *   php artisan reading-guide:log              today's questions
 *   php artisan reading-guide:log --days=7     the last week
 *   php artisan reading-guide:log --top        most common questions
 *   php artisan reading-guide:log --follow     watch live
 */
class LogCommand extends Command
{
    protected $signature = 'reading-guide:log
        {--days=1 : How many days of logs to include}
        {--top : Show the most common questions instead of every one}
        {--follow : Keep watching and print new questions as they arrive}';

    protected $description = 'Show what visitors asked the reading guide';

    public function handle(): int
    {
        if ($this->option('follow')) {
            return $this->follow();
        }

        $days = max(1, (int) $this->option('days'));
        $entries = ChatLog::entries($days);

        if ($entries->isEmpty()) {
            $this->info($days === 1 ? 'No chat questions logged today.' : "No chat questions logged in the last {$days} days.");

            return self::SUCCESS;
        }

        $this->option('top') ? $this->top($entries) : $this->list($entries);

        $s = ChatLog::summary($entries);
        $this->line(sprintf('%d questions from %d visitors · %d with no match · %s tokens in / %s out',
            $s['questions'], $s['visitors'], $s['no_match'], number_format($s['input_tokens']), number_format($s['output_tokens'])));

        return self::SUCCESS;
    }

    private function list(Collection $entries): void
    {
        $this->table(
            ['Time', 'Visitor', 'Asked', 'Searched', 'Shown', 'Result'],
            $entries->map(fn ($e) => [
                ChatLog::time($e['time'], 'M j H:i'),
                $e['visitor'] ?? '',
                Str::limit($e['asked'] ?? '', 48),
                Str::limit(implode(', ', $e['searches'] ?? []), 30),
                $this->shown($e['shown'] ?? []),
                $e['outcome'] ?? '',
            ])->all()
        );
    }

    private function top(Collection $entries): void
    {
        $this->table(['Asked', 'Times', 'No match', 'Last shown'], ChatLog::top($entries)->map(fn ($row) => [
            Str::limit($row['asked'], 60), $row['times'], $row['no_match'], $this->shown($row['last_shown']),
        ])->all());
    }

    private function follow(): int
    {
        $this->info('Watching for new questions. Press Ctrl+C to stop.');

        $path = null;
        $offset = 0;

        while (true) {
            $today = ChatLog::path(now());

            if ($today !== $path) {
                $path = $today;
                $offset = is_file($path) ? filesize($path) : 0;
            }

            clearstatcache(false, $path);

            if (is_file($path) && filesize($path) > $offset) {
                $handle = fopen($path, 'r');
                fseek($handle, $offset);

                while (($line = fgets($handle)) !== false) {
                    if ($e = ChatLog::parse($line)) {
                        $this->line(sprintf('<comment>%s</comment> %s  “%s”  → searched: %s  → shown: %s  <info>%s</info>',
                            ChatLog::time($e['time'], 'M j H:i'), $e['visitor'] ?? '', Str::limit($e['asked'] ?? '', 80),
                            implode(', ', $e['searches'] ?? []) ?: '—', $this->shown($e['shown'] ?? [], 60), $e['outcome'] ?? ''));
                    }
                }

                $offset = ftell($handle);
                fclose($handle);
            }

            sleep(2);
        }
    }

    private function shown(array $titles, int $limit = 40): string
    {
        if ($titles === []) {
            return '—';
        }

        $first = Str::limit($titles[0], $limit);

        return count($titles) > 1 ? $first.' (+'.(count($titles) - 1).')' : $first;
    }
}
