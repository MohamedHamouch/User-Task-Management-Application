<?php

namespace Database\Seeders;

use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create Admin
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'System Admin',
                'password' => Hash::make('password'),
                'role' => 'admin',
            ]
        );

        // 2. Create Clients
        $client1 = User::firstOrCreate(
            ['email' => 'client1@example.com'],
            [
                'name' => 'Alice Client (Acme Corp)',
                'password' => Hash::make('password'),
                'role' => 'client',
            ]
        );

        $client2 = User::firstOrCreate(
            ['email' => 'client2@example.com'],
            [
                'name' => 'Bob Client (Globex Inc)',
                'password' => Hash::make('password'),
                'role' => 'client',
            ]
        );

        // 3. Create Workers
        $worker1 = User::firstOrCreate(
            ['email' => 'worker1@example.com'],
            [
                'name' => 'Charlie Worker',
                'password' => Hash::make('password'),
                'role' => 'worker',
            ]
        );

        $worker2 = User::firstOrCreate(
            ['email' => 'worker2@example.com'],
            [
                'name' => 'Dana Worker',
                'password' => Hash::make('password'),
                'role' => 'worker',
            ]
        );

        // 4. Create Sample Tasks
        $tasks = [
            [
                'title' => 'Design homepage wireframe',
                'description' => 'Create a high-fidelity Figma mockup for the landing page.',
                'status' => 'pending',
                'client_id' => $client1->id,
                'worker_id' => $worker1->id,
            ],
            [
                'title' => 'Implement payment gateway',
                'description' => 'Integrate Stripe checkout API with webhook listeners.',
                'status' => 'in_progress',
                'client_id' => $client1->id,
                'worker_id' => $worker1->id,
            ],
            [
                'title' => 'Security Audit & Vulnerability Assessment',
                'description' => 'Perform penetration testing and review authorization policies.',
                'status' => 'pending',
                'client_id' => $client2->id,
                'worker_id' => $worker2->id,
            ],
            [
                'title' => 'Database indexing & optimization',
                'description' => 'Review slow queries and optimize database execution plans.',
                'status' => 'pending',
                'client_id' => $client2->id,
                'worker_id' => null,
            ],
            [
                'title' => 'Setup CI/CD pipeline',
                'description' => 'Automate test running and deployment using GitHub Actions.',
                'status' => 'completed',
                'client_id' => $client1->id,
                'worker_id' => $worker2->id,
            ],
        ];

        foreach ($tasks as $taskData) {
            Task::firstOrCreate(
                [
                    'title' => $taskData['title'],
                    'client_id' => $taskData['client_id'],
                ],
                $taskData
            );
        }
    }
}
