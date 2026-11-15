<?php
namespace App\Services;

use App\Models\AuditLog;

class AuditService
{
    public static function log(?int $actorId, string $action, string $entityType, ?int $entityId, array $payload = []): AuditLog
    {
        return AuditLog::create([
            'actor_user_id' => $actorId,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'payload' => $payload,
            'created_at' => now(),
        ]);
    }
}
