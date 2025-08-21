<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\NewsletterController;

// Newsletter subscription route
Route::post('/api/newsletter/subscribe', [NewsletterController::class, 'subscribe']);

// Route::statamic('example', 'example-view', [
//    'title' => 'Example'
// ]);
