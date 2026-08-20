<?php

namespace App\Http\Requests;

use App\Models\Task;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class StoreTaskRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $response = Gate::inspect('create', Task::class);

        if ($response->denied()) {
            throw new AuthorizationException($response->message() ?: 'This action is unauthorized.');
        }

        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ];

        if ($this->user()->isAdmin()) {
            $rules['client_id'] = [
                'required',
                Rule::exists('users', 'id')->where(fn ($query) => $query->where('role', 'client')),
            ];
            $rules['worker_id'] = [
                'nullable',
                Rule::exists('users', 'id')->where(fn ($query) => $query->where('role', 'worker')),
            ];
            $rules['status'] = ['nullable', 'in:pending,in_progress,completed'];
        }

        return $rules;
    }
}
