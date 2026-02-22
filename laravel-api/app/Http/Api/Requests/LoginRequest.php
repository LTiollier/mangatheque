<?php

namespace App\Http\Api\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ];
    }

    public function toDTO(): \App\User\Application\DTOs\LoginDTO
    {
        return new \App\User\Application\DTOs\LoginDTO(
            email: $this->string('email')->toString(),
            password: $this->string('password')->toString(),
        );
    }
}
