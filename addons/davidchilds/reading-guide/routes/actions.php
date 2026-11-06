<?php

use Davidchilds\ReadingGuide\Http\Controllers\ChatController;
use Illuminate\Support\Facades\Route;

// POST /!/reading-guide/chat  (route name: statamic.reading-guide.chat)
Route::post('chat', ChatController::class)
    ->middleware('throttle:reading-guide')
    ->name('reading-guide.chat');
