<?php
namespace App\Enums;
enum Stage: string {
    case LeadAgendado = 'lead_agendado';
    case NoShow = 'no_show';
    case Fup = 'fup';
    case Remarcado = 'remarcado';
    case Negociacao = 'negociacao';
    case Fechado = 'fechado';
    case Reembolso = 'reembolso';
    case Loss = 'loss';
    case Desqualificado = 'desqualificado';

    public function label(): string {
        return match($this) {
            self::LeadAgendado => 'Lead Agendado',
            self::NoShow => 'No-show',
            self::Fup => 'FUP',
            self::Remarcado => 'Remarcado',
            self::Negociacao => 'Negociação',
            self::Fechado => 'Fechado',
            self::Reembolso => 'Reembolso',
            self::Loss => 'Loss',
            self::Desqualificado => 'Desqualificado',
        };
    }
}
