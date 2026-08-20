<?php

use App\Models\Task;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    $this->clientA = User::factory()->client()->create();
    $this->clientB = User::factory()->client()->create();
});

test('client can only see their own tasks in task listing', function () {
    Task::factory()->count(2)->forClient($this->clientA)->create();
    Task::factory()->count(3)->forClient($this->clientB)->create();

    Sanctum::actingAs($this->clientA);

    $response = $this->getJson('/api/tasks');

    $response->assertOk();
    expect($response->json('tasks'))->toHaveCount(2);

    foreach ($response->json('tasks') as $task) {
        expect($task['client_id'])->toBe($this->clientA->id);
    }
});

test('client can create a task that is automatically assigned to themselves', function () {
    Sanctum::actingAs($this->clientA);

    $response = $this->postJson('/api/tasks', [
        'title' => 'Mobile App UI Design',
        'description' => 'Create Figma wireframes for iOS app',
    ]);

    $response->assertCreated()
        ->assertJson([
            'message' => 'Task created successfully',
            'task' => [
                'title' => 'Mobile App UI Design',
                'description' => 'Create Figma wireframes for iOS app',
                'status' => 'pending',
                'client_id' => $this->clientA->id,
                'worker_id' => null,
            ],
        ]);
});

test('client can update their own task only when status is pending', function () {
    $pendingTask = Task::factory()->pending()->forClient($this->clientA)->create([
        'title' => 'Initial Title',
    ]);

    Sanctum::actingAs($this->clientA);

    $response = $this->putJson("/api/tasks/{$pendingTask->id}", [
        'title' => 'Updated Title',
        'description' => 'Updated Description',
    ]);

    $response->assertOk()
        ->assertJson([
            'message' => 'Task updated successfully',
            'task' => [
                'id' => $pendingTask->id,
                'title' => 'Updated Title',
            ],
        ]);
});

test('client cannot update their task once it is in_progress or completed', function () {
    $inProgressTask = Task::factory()->inProgress()->forClient($this->clientA)->create();
    $completedTask = Task::factory()->completed()->forClient($this->clientA)->create();

    Sanctum::actingAs($this->clientA);

    // Attempting to update in_progress task
    $responseInProgress = $this->putJson("/api/tasks/{$inProgressTask->id}", [
        'title' => 'Attempted Edit on In Progress',
    ]);

    $responseInProgress->assertForbidden()
        ->assertJson(['message' => 'Clients can only edit tasks while in pending status.']);

    // Attempting to update completed task
    $responseCompleted = $this->putJson("/api/tasks/{$completedTask->id}", [
        'title' => 'Attempted Edit on Completed',
    ]);

    $responseCompleted->assertForbidden()
        ->assertJson(['message' => 'Clients can only edit tasks while in pending status.']);
});

test('client cannot access or view another client task', function () {
    $clientBTask = Task::factory()->forClient($this->clientB)->create();

    Sanctum::actingAs($this->clientA);

    $response = $this->getJson("/api/tasks/{$clientBTask->id}");

    $response->assertForbidden()
        ->assertJson(['message' => 'You do not have permission to view another client\'s task.']);
});

test('client cannot update another client task', function () {
    $clientBTask = Task::factory()->pending()->forClient($this->clientB)->create();

    Sanctum::actingAs($this->clientA);

    $response = $this->putJson("/api/tasks/{$clientBTask->id}", [
        'title' => 'Malicious Edit',
    ]);

    $response->assertForbidden()
        ->assertJson(['message' => 'You do not have permission to edit another client\'s task.']);
});

test('client cannot delete any task', function () {
    $task = Task::factory()->forClient($this->clientA)->create();

    Sanctum::actingAs($this->clientA);

    $response = $this->deleteJson("/api/tasks/{$task->id}");

    $response->assertForbidden();
    $this->assertDatabaseHas('tasks', ['id' => $task->id]);
});
