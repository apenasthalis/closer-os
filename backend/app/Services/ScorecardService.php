<?php
namespace App\Services;

class ScorecardService
{
    public const CRITERIA = [
        ['key' => 'opening', 'label' => 'Abri com contrato de tempo e objetivo da call', 'weight' => 10],
        ['key' => 'current_situation', 'label' => 'Mapeei a situação atual do lead', 'weight' => 15],
        ['key' => 'pain', 'label' => 'O lead disse a dor com as próprias palavras', 'weight' => 15],
        ['key' => 'cost', 'label' => 'Quantifiquei o custo de não resolver', 'weight' => 15],
        ['key' => 'decision', 'label' => 'Defini critério e prazo de decisão', 'weight' => 10],
        ['key' => 'solution', 'label' => 'Apresentei a solução ligada à dor', 'weight' => 15],
        ['key' => 'close', 'label' => 'Pedi o fechamento de forma direta', 'weight' => 10],
        ['key' => 'next_step', 'label' => 'Combinei próximo passo com data e hora', 'weight' => 10],
    ];

    public static function calculate(array $checked, int $talkRatio): array
    {
        $total = 0;
        $missing = null;
        foreach (self::CRITERIA as $criterion) {
            if (!empty($checked[$criterion['key']])) {
                $total += $criterion['weight'];
            } elseif ($missing === null || $criterion['weight'] > $missing['weight']) {
                $missing = $criterion;
            }
        }

        $penalty = ($talkRatio >= 30 && $talkRatio <= 50) ? 0 : (($talkRatio >= 20 && $talkRatio <= 60) ? 5 : 10);

        return [
            'score' => max(0, $total - $penalty),
            'penalty' => $penalty,
            'missing' => $missing,
            'criteria' => $checked,
        ];
    }
}
