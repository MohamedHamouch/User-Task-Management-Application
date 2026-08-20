<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\Response;

class UserPolicy
{
    /**
     * Determine whether the user can view any users.
     */
    public function viewAny(User $user): Response
    {
        return $user->isAdmin()
            ? Response::allow()
            : Response::deny('Only administrators can view the user list.');
    }

    /**
     * Determine whether the user can view the specific user.
     */
    public function view(User $user, User $model): Response
    {
        return ($user->isAdmin() || $user->id === $model->id)
            ? Response::allow()
            : Response::deny('You do not have permission to view this user profile.');
    }

    /**
     * Determine whether the user can create users.
     */
    public function create(User $user): Response
    {
        return $user->isAdmin()
            ? Response::allow()
            : Response::deny('Only administrators can create users.');
    }

    /**
     * Determine whether the user can update the user.
     */
    public function update(User $user, User $model): Response
    {
        return $user->isAdmin()
            ? Response::allow()
            : Response::deny('Only administrators can update users.');
    }

    /**
     * Determine whether the user can delete the user.
     */
    public function delete(User $user, User $model): Response
    {
        if (! $user->isAdmin()) {
            return Response::deny('Only administrators can delete users.');
        }

        if ($user->id === $model->id) {
            return Response::deny('You cannot delete your own account.');
        }

        return Response::allow();
    }
}
