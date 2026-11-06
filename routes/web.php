<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Permanent redirects
|--------------------------------------------------------------------------
|
| These run before Statamic's catch-all route, so they win over any entry
| with the same URL. Keep old URLs here when posts are merged or moved, so
| links and search rankings carry over to the new page.
|
*/

// Categories live at /writing/categories/*. The standalone /categories/*
// copies were duplicates of the same pages, so send them to the real ones.
Route::permanentRedirect('categories', '/writing/categories');

Route::get('categories/{slug}', function (Request $request, string $slug) {
    $slug = $slug === 'menturing' ? 'mentoring' : $slug;
    $query = $request->getQueryString();

    return redirect('/writing/categories/'.$slug.($query ? '?'.$query : ''), 301);
})->where('slug', '[a-z0-9-]+');

// "menturing" was a misspelled duplicate of the mentoring category.
Route::permanentRedirect('writing/categories/menturing', '/writing/categories/mentoring');

// Posts that covered the same topic as another post were merged into the
// stronger one. Old URL => the post it was merged into.
$merged = [
    'git-reflog-recovery-guide' => 'git-reflog-recovery-disaster-prevention',
    'git-bisect-debugging-guide' => 'git-bisect-debugging-time-travel',
    'git-cherry-pick-guide' => 'git-cherry-pick-stash-advanced-techniques',
    'git-stash-workflow-guide' => 'git-cherry-pick-stash-advanced-techniques',
    'git-rebase-vs-merge' => 'git-rebase-merge-strategies-clean-history',
    'ai-prompt-engineering-advanced-techniques' => 'prompt-engineering-best-practices-comprehensive-guide',
    'ai-mlops-model-lifecycle-management' => 'mlops-deployment-production-guide',
    'aws-lambda-serverless-patterns-best-practices' => 'serverless-architecture-patterns-best-practices',
    'ai-rag-vector-databases-implementation' => 'vector-databases-embeddings-comprehensive-guide',
    'ai-governance-ethical-frameworks' => 'ai-ethics-responsible-development',
];

foreach ($merged as $from => $to) {
    Route::permanentRedirect("writing/{$from}", "/writing/{$to}");
}
