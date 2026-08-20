<?php

use App\Models\Task;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    $this->workerA = User::factory()->worker()->create();
    $this->workerB = User::factory()->worker()->create();
    $this->client = User::factory()->client()->create();
});

test('worker can only see tasks assigned to them', function () {
    Task::factory()->count(2)->assignedTo($this->workerA)->forClient($this->client)->create();
    Task::factory()->count(3)->assignedTo($this->workerB)->forClient($this->client)->create();

    Sanctum::actingAs($this->workerA);

    $response = $this->getJson('/api/tasks');

    $response->assertOk();
    expect($response->json('tasks'))->toHaveCount(2);

    foreach ($response->json('tasks') as $task) {
        expect($task['worker_id'])->toBe($this->workerA->id);
    }
});

test('worker can view details of their assigned task', function () {
    $task = Task::factory()->assignedTo($this->workerA)->forClient($this->client)->create();

    Sanctum::actingAs($this->workerA);

    $response = $this->getJson("/api/tasks/{$task->id}");

    $response->assertOk()
        ->assertJson([
            'task' => [
                'id' => $task->id,
                'worker_id' => $this->workerA->id,
            ],
        ]);
});

test('worker can update the status of their assigned task', function () {
    $task = Task::factory()->pending()->assignedTo($this->workerA)->forClient($this->client)->create();

    Sanctum::actingAs($this->workerA);

    // Transition from pending to in_progress
    $responseInProgress = $this->patchJson("/api/tasks/{$task->id}/status", [
        'status' => 'in_progress',
    ]);

    $responseInProgress->assertOk()
        ->assertJson([
            'message' => 'Task status updated successfully',
            'task' => [
                'id' => $task->id,
                'status' => 'in_progress',
            ],
        ]);

    // Transition from in_progress to completed
    $responseCompleted = $this->patchJson("/api/tasks/{$task->id}/status", [
        'status' => 'completed',
    ]);

    $responseCompleted->assertOk()
        ->assertJson([
            'task' => [
                'status' => 'completed',
            ],
        ]);
});

test('quiz scenario: worker B cannot access worker A assigned task', function () {
    $taskAssignedToWorkerA = Task::factory()
        ->assignedTo($this->workerA)
        ->forClient($this->client)
        ->create();

    Sanctum::actingAs($this->workerB);

    $response = $this->getJson("/api/tasks/{$taskAssignedToWorkerA->id}");

    $response->assertForbidden()
        ->assertJson(['message' => 'You do not have permission to view a task assigned to another worker.']);
});

test('quiz scenario: worker B cannot modify worker A assigned task status', function () {
    $taskAssignedToWorkerA = Task::factory()
        ->pending()
        ->assignedTo($this->workerA)
        ->forClient($this->client)
        ->create();

    Sanctum::actingAs($this->workerB);

    $response = $this->patchJson("/api/tasks/{$taskAssignedToWorkerA->id}/status", [
        'status' => 'in_progress',
    ]);

    $response->assertForbidden()
        ->assertJson(['message' => 'You can only update the status of tasks assigned to you.']);
});

test('worker cannot modify task details like title or description', function () {
    $task = Task::factory()->assignedTo($this->workerA)->forClient($this->client)->create();

    Sanctum::actingAs($this->workerA);

    $response = $this->putJson("/api/tasks/{$task->id}", [
        'title' => 'Worker trying to rename task',
    ]);

    $response->assertForbidden();
});

test('worker cannot create tasks', function () {
    Sanctum::actingAs($this->workerA);

    $response = $this->postJson('/api/tasks', [
        'title' => 'Worker attempting task creation',
    ]);

    $response->assertForbidden();
});

test('worker cannot delete tasks', function () {
    $task = Task::factory()->assignedTo($this->workerA)->forClient($this->client)->create();

    Sanctum::actingAs($this->workerA);

    $response = $this->deleteJson("/api/tasks/{$task->id}");

    $response->assertForbidden();
    $this->assertDatabaseHas('tasks', ['id' => $task->id]);
});
