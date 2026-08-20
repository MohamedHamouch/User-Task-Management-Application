<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Http\Requests\UpdateTaskStatusRequest;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TaskController extends Controller
{
    /**
     * Display a listing of tasks scoped to user role.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Task::with(['client:id,name,email', 'worker:id,name,email'])
            ->latest();

        if ($user->isAdmin()) {
            if ($request->filled('status')) {
                $query->where('status', $request->query('status'));
            }
            if ($request->filled('client_id')) {
                $query->where('client_id', $request->query('client_id'));
            }
            if ($request->filled('worker_id')) {
                $query->where('worker_id', $request->query('worker_id'));
            }
        } elseif ($user->isClient()) {
            $query->where('client_id', $user->id);
        } elseif ($user->isWorker()) {
            $query->where('worker_id', $user->id);
        } else {
            return response()->json(['tasks' => []]);
        }

        return response()->json([
            'tasks' => $query->get(),
        ]);
    }

    /**
     * Store a newly created task.
     */
    public function store(StoreTaskRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        if ($user->isClient()) {
            $task = Task::create([
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'status' => 'pending',
                'client_id' => $user->id,
                'worker_id' => null,
            ]);
        } else {
            // Admin
            $task = Task::create([
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'status' => $validated['status'] ?? 'pending',
                'client_id' => $validated['client_id'],
                'worker_id' => $validated['worker_id'] ?? null,
            ]);
        }

        $task->load(['client:id,name,email', 'worker:id,name,email']);

        return response()->json([
            'message' => 'Task created successfully',
            'task' => $task,
        ], Response::HTTP_CREATED);
    }

    /**
     * Display the specified task.
     */
    public function show(Request $request, Task $task): JsonResponse
    {
        $response = \Illuminate\Support\Facades\Gate::inspect('view', $task);

        if ($response->denied()) {
            return response()->json([
                'message' => $response->message() ?: 'Access denied. You do not have permission to view this task.',
            ], Response::HTTP_FORBIDDEN);
        }

        $task->load(['client:id,name,email', 'worker:id,name,email']);

        return response()->json([
            'task' => $task,
        ]);
    }

    /**
     * Update the specified task.
     */
    public function update(UpdateTaskRequest $request, Task $task): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        if ($user->isClient()) {
            // Client can only update title and description while pending
            $task->update([
                'title' => $validated['title'] ?? $task->title,
                'description' => array_key_exists('description', $validated) ? $validated['description'] : $task->description,
            ]);
        } else {
            // Admin can update all fields
            $task->update($validated);
        }

        $task->load(['client:id,name,email', 'worker:id,name,email']);

        return response()->json([
            'message' => 'Task updated successfully',
            'task' => $task,
        ]);
    }

    /**
     * Update only the task status (for workers & admins).
     */
    public function updateStatus(UpdateTaskStatusRequest $request, Task $task): JsonResponse
    {
        $validated = $request->validated();

        $task->update([
            'status' => $validated['status'],
        ]);

        $task->load(['client:id,name,email', 'worker:id,name,email']);

        return response()->json([
            'message' => 'Task status updated successfully',
            'task' => $task,
        ]);
    }

    /**
     * Delete the specified task.
     */
    public function destroy(Request $request, Task $task): JsonResponse
    {
        $response = \Illuminate\Support\Facades\Gate::inspect('delete', $task);

        if ($response->denied()) {
            return response()->json([
                'message' => $response->message() ?: 'Access denied. You do not have permission to delete this task.',
            ], Response::HTTP_FORBIDDEN);
        }

        $task->delete();

        return response()->json([
            'message' => 'Task deleted successfully',
        ]);
    }
}
