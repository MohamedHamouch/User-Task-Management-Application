<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class TaskPolicy
{
    /**
     * Determine whether the user can view any tasks.
     */
    public function viewAny(User $user): Response
    {
        return Response::allow();
    }

    /**
     * Determine whether the user can view the task.
     */
    public function view(User $user, Task $task): Response
    {
        if ($user->isAdmin()) {
            return Response::allow();
        }

        if ($user->isClient()) {
            return $task->client_id === $user->id
                ? Response::allow()
                : Response::deny('You do not have permission to view another client\'s task.');
        }

        if ($user->isWorker()) {
            return $task->worker_id === $user->id
                ? Response::allow()
                : Response::deny('You do not have permission to view a task assigned to another worker.');
        }

        return Response::deny('You do not have permission to view this task.');
    }

    /**
     * Determine whether the user can create tasks.
     */
    public function create(User $user): Response
    {
        return ($user->isAdmin() || $user->isClient())
            ? Response::allow()
            : Response::deny('Only clients and administrators can create tasks.');
    }

    /**
     * Determine whether the user can update the task details.
     */
    public function update(User $user, Task $task): Response
    {
        if ($user->isAdmin()) {
            return Response::allow();
        }

        if ($user->isClient()) {
            if ($task->client_id !== $user->id) {
                return Response::deny('You do not have permission to edit another client\'s task.');
            }

            if ($task->status !== 'pending') {
                return Response::deny('Clients can only edit tasks while in pending status.');
            }

            return Response::allow();
        }

        return Response::deny('You do not have permission to edit task details.');
    }

    /**
     * Determine whether the user can update the status of the task.
     */
    public function updateStatus(User $user, Task $task): Response
    {
        if ($user->isAdmin()) {
            return Response::allow();
        }

        if ($user->isWorker()) {
            return $task->worker_id === $user->id
                ? Response::allow()
                : Response::deny('You can only update the status of tasks assigned to you.');
        }

        return Response::deny('Only assigned workers and administrators can update task status.');
    }

    /**
     * Determine whether the user can delete the task.
     */
    public function delete(User $user, Task $task): Response
    {
        return $user->isAdmin()
            ? Response::allow()
            : Response::deny('Only administrators can delete tasks.');
    }
}
