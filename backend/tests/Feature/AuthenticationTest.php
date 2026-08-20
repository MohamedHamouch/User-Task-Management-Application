<?php

use App\Models\User;
use Laravel\Sanctum\Sanctum;

test('a user with valid credentials can log in and receives a token', function () {
    $user = User::factory()->create([
        'email' => 'alice@example.com',
        'password' => bcrypt('secret123'),
        'role' => 'client',
    ]);

    $response = $this->postJson('/api/login', [
        'email' => 'alice@example.com',
        'password' => 'secret123',
    ]);

    $response->assertOk()
        ->assertJsonStructure([
            'message',
            'token',
            'user' => ['id', 'name', 'email', 'role'],
        ])
        ->assertJson([
            'user' => [
                'email' => 'alice@example.com',
                'role' => 'client',
            ],
        ]);

    expect($response->json('token'))->toBeString()->not->toBeEmpty();
});

test('invalid credentials are rejected', function () {
    $user = User::factory()->create([
        'email' => 'bob@example.com',
        'password' => bcrypt('correct-password'),
    ]);

    $response = $this->postJson('/api/login', [
        'email' => 'bob@example.com',
        'password' => 'wrong-password',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['email']);
});

test('unauthenticated users cannot access protected endpoints', function () {
    $this->getJson('/api/me')->assertUnauthorized();
    $this->getJson('/api/tasks')->assertUnauthorized();
    $this->postJson('/api/logout')->assertUnauthorized();
});

test('authenticated user can fetch their profile via me endpoint', function () {
    $user = User::factory()->worker()->create();
    Sanctum::actingAs($user);

    $response = $this->getJson('/api/me');

    $response->assertOk()
        ->assertJson([
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'role' => 'worker',
            ],
        ]);
});

test('authenticated user can logout and revoke their token', function () {
    $user = User::factory()->create();
    $token = $user->createToken('test-token')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/logout');

    $response->assertOk()
        ->assertJson(['message' => 'Logged out successfully']);

    expect($user->tokens()->count())->toBe(0);
});
