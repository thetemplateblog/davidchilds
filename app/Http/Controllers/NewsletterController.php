<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class NewsletterController extends Controller
{
    public function subscribe(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'email' => 'required|email'
            ]);

            $email = $request->input('email');
            $convertKitApiKey = env('CONVERTKIT_API_KEY');

            if (!$convertKitApiKey) {
                \Log::error('ConvertKit API key not found in environment variables');
                // For development, we'll just log the email and return success
                \Log::info('Email subscription request: ' . $email);
                return response()->json([
                    'success' => true,
                    'message' => 'Email registered successfully (dev mode)'
                ]);
            }

            // Step 1: Create/update subscriber
            $subscriberResponse = $this->makeConvertKitRequest('subscribers', [
                'email_address' => $email,
                'state' => 'active'
            ], $convertKitApiKey);

            if (!$subscriberResponse['success']) {
                \Log::error('ConvertKit subscriber API error: ' . json_encode($subscriberResponse['data']));
                return response()->json([
                    'error' => 'Failed to subscribe to newsletter'
                ], 500);
            }

            // Step 2: Create tag first (if it doesn't exist), then tag the subscriber
            $tagName = 'davidchilds-newsletter';
            $tagId = $this->getOrCreateTag($tagName, $convertKitApiKey);

            // Step 3: Tag the subscriber if we have a tag ID
            if ($tagId) {
                $tagResponse = $this->makeConvertKitRequest("tags/{$tagId}/subscribers", [
                    'email_address' => $email
                ], $convertKitApiKey);

                if (!$tagResponse['success']) {
                    \Log::error('ConvertKit tag API error: ' . json_encode($tagResponse['data']));
                    // Don't fail the whole request if tagging fails
                }
            } else {
                \Log::error('Could not find or create ' . $tagName . ' tag');
            }

            return response()->json([
                'success' => true,
                'message' => 'Successfully subscribed to newsletter!'
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Invalid email format'
            ], 400);
        } catch (\Exception $e) {
            \Log::error('Subscription error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Internal server error'
            ], 500);
        }
    }

    private function makeConvertKitRequest(string $endpoint, array $data, string $apiKey): array
    {
        $response = \Http::withHeaders([
            'Content-Type' => 'application/json',
            'X-Kit-Api-Key' => $apiKey
        ])->post("https://api.convertkit.com/v4/{$endpoint}", $data);

        return [
            'success' => $response->successful(),
            'data' => $response->json()
        ];
    }

    private function getOrCreateTag(string $tagName, string $apiKey): ?int
    {
        // Try to create the tag first
        $createTagResponse = $this->makeConvertKitRequest('tags', [
            'name' => $tagName
        ], $apiKey);

        if ($createTagResponse['success'] && isset($createTagResponse['data']['tag']['id'])) {
            return $createTagResponse['data']['tag']['id'];
        }

        // Tag might already exist, try to get it
        $getTagsResponse = \Http::withHeaders([
            'X-Kit-Api-Key' => $apiKey
        ])->get('https://api.convertkit.com/v4/tags');

        if ($getTagsResponse->successful()) {
            $tagsData = $getTagsResponse->json();
            $existingTag = collect($tagsData['tags'] ?? [])->firstWhere('name', $tagName);
            return $existingTag['id'] ?? null;
        }

        return null;
    }
}