<?php

use App\Models\Task;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
});

test('admin can view all users', function () {
    User::factory()->count(3)->create();
    Sanctum::actingAs($this->admin);

    $response = $this->getJson('/api/users');

    $response->assertOk()
        ->assertJsonStructure(['users']);

    // Admin + 3 created users = 4
    expect($response->json('users'))->toHaveCount(4);
});

test('admin can filter users by role', function () {
    User::factory()->count(2)->client()->create();
    User::factory()->count(3)->worker()->create();
    Sanctum::actingAs($this->admin);

    $clientResponse = $this->getJson('/api/users?role=client');
    $clientResponse->assertOk();
    expect($clientResponse->json('users'))->toHaveCount(2);

    $workerResponse = $this->getJson('/api/users?role=worker');
    $workerResponse->assertOk();
    expect($workerResponse->json('users'))->toHaveCount(3);
});

test('admin can create a new user with role assignment', function () {
    Sanctum::actingAs($this->admin);

    $payload = [
        'name' => 'Charlie New Worker',
        'email' => 'charlie.new@example.com',
        'password' => 'secret123',
        'role' => 'worker',
    ];

    $response = $this->postJson('/api/users', $payload);

    $response->assertCreated()
        ->assertJson([
            'message' => 'User created successfully',
            'user' => [
                'name' => 'Charlie New Worker',
                'email' => 'charlie.new@example.com',
                'role' => 'worker',
            ],
        ]);

    $this->assertDatabaseHas('users', [
        'email' => 'charlie.new@example.com',
        'role' => 'worker',
    ]);
});

test('admin can update user details and change their role', function () {
    $user = User::factory()->client()->create();
    Sanctum::actingAs($this->admin);

    $response = $this->putJson("/api/users/{$user->id}", [
        'name' => 'Promoted Worker',
        'role' => 'worker',
    ]);

    $response->assertOk()
        ->assertJson([
            'message' => 'User updated successfully',
            'user' => [
                'name' => 'Promoted Worker',
                'role' => 'worker',
            ],
        ]);

    $this->assertDatabaseHas('users', [
        'id' => $user->id,
        'name' => 'Promoted Worker',
        'role' => 'worker',
    ]);
});

test('admin can delete a user', function () {
    $user = User::factory()->client()->create();
    Sanctum::actingAs($this->admin);

    $response = $this->deleteJson("/api/users/{$user->id}");

    $response->assertOk()
        ->assertJson(['message' => 'User deleted successfully']);

    $this->assertDatabaseMissing('users', ['id' => $user->id]);
});

test('admin cannot delete their own account', function () {
    Sanctum::actingAs($this->admin);

    $response = $this->deleteJson("/api/users/{$this->admin->id}");

    $response->assertStatus(422)
        ->assertJson(['message' => 'You cannot delete your own account.']);

    $this->assertDatabaseHas('users', ['id' => $this->admin->id]);
});

test('non-admins cannot access user management endpoints', function () {
    $client = User::factory()->client()->create();
    $worker = User::factory()->worker()->create();

    Sanctum::actingAs($client);
    $this->getJson('/api/users')->assertForbidden();
    $this->postJson('/api/users', ['name' => 'Test', 'email' => 'test@ex.com', 'password' => 'pwd123', 'role' => 'client'])->assertForbidden();

    Sanctum::actingAs($worker);
    $this->getJson('/api/users')->assertForbidden();
    $this->deleteJson("/api/users/{$client->id}")->assertForbidden();
});

test('admin can view all tasks, create tasks for clients, assign workers, and delete tasks', function () {
    $client = User::factory()->client()->create();
    $worker = User::factory()->worker()->create();
    Sanctum::actingAs($this->admin);

    // Admin creates task for client and assigns worker
    $createResponse = $this->postJson('/api/tasks', [
        'title' => 'Server Configuration',
        'description' => 'Setup web server',
        'client_id' => $client->id,
        'worker_id' => $worker->id,
        'status' => 'pending',
    ]);

    $createResponse->assertCreated()
        ->assertJson([
            'task' => [
                'title' => 'Server Configuration',
                'client_id' => $client->id,
                'worker_id' => $worker->id,
            ],
        ]);

    $taskId = $createResponse->json('task.id');

    // Admin updates task
    $updateResponse = $this->putJson("/api/tasks/{$taskId}", [
        'title' => 'Server Configuration Updated',
        'status' => 'in_progress',
    ]);

    $updateResponse->assertOk()
        ->assertJson([
            'task' => [
                'title' => 'Server Configuration Updated',
                'status' => 'in_progress',
            ],
        ]);

    // Admin deletes task
    $deleteResponse = $this->deleteJson("/api/tasks/{$taskId}");
    $deleteResponse->assertOk();

    $this->assertDatabaseMissing('tasks', ['id' => $taskId]);
});
