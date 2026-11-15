<?php
namespace Database\Seeders;

use App\Models\Company;
use App\Models\CompensationRule;
use App\Models\Department;
use App\Models\FollowUpTemplate;
use App\Models\Goal;
use App\Models\Objection;
use App\Models\Operation;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(['email' => '1thalisgabriel1@gmail.com'], [
            'name' => 'Thalis Gabriel',
            'password' => Hash::make('123456'),
            'role' => 'admin',
            'active' => true,
        ]);

        $closer = null;
        if (app()->environment('local', 'testing')) {
            $closer = User::firstOrCreate(['email' => 'closer@closeros.test'], [
                'name' => 'Closer Demo',
                'password' => Hash::make('password'),
                'role' => 'closer',
                'active' => true,
            ]);
        }

        $company = Company::firstOrCreate(['name' => 'TZN Legacy']);
        $ml = Department::firstOrCreate(['company_id' => $company->id, 'name' => 'Mercado Livre']);
        $vis = Department::firstOrCreate(['company_id' => $company->id, 'name' => 'Visagismo']);

        foreach ([
            ['Mercado Livre', 7, $company->id, $ml->id],
            ['Visagismo masculino', 10, $company->id, $vis->id],
        ] as $o) {
            Operation::firstOrCreate(['name' => $o[0]], [
                'company_id' => $o[2],
                'department_id' => $o[3],
                'commission_percent' => $o[1],
                'archived_at' => null,
            ]);
        }

        $objections = [
            ['Vou pensar', 'Decisão', 62, 'Faz sentido pensar. O que exatamente você precisa avaliar para ter certeza? Se eu esclarecer isso agora, você decide hoje?'],
            ['Está caro', 'Preço', 48, 'Caro comparado a quê? Se o resultado que você descreveu for alcançado, quanto isso vale por mês para você?'],
            ['Preciso falar com meu sócio', 'Autoridade', 55, 'Perfeito. Vamos fazer uma call de 15 minutos com ele junto, ainda esta semana? Assim eu respondo as dúvidas direto.'],
            ['Já tentei e não deu certo', 'Confiança', 51, 'Me conta o que você tentou e onde travou. Quero ter certeza de que o que proponho não repete esse caminho.'],
            ['Agora não tenho tempo', 'Timing', 44, 'Entendo. Quanto tempo por semana isso está custando para você hoje sem resolver? Podemos começar com o mínimo possível.'],
            ['Vou ver com calma e te falo', 'Decisão', 38, 'Combinado. Para eu não te incomodar à toa, qual dia e horário eu te chamo para ouvir sua decisão?'],
        ];
        foreach ($objections as [$name, $category, $conversion, $response]) {
            Objection::firstOrCreate(['name' => $name], [
                'category' => $category,
                'reference_conversion' => $conversion,
                'suggested_response' => $response,
            ]);
        }

        $templates = [
            ['Antes da call', 'D-1', 'Confirmar call', 'Oi {nome}, passando para confirmar nossa call amanhã às {horario}. Posso contar com você?'],
            ['No-show', 'D0', 'Recuperar no-show', 'Oi {nome}, senti sua falta na nossa call. Aconteceu algo? Consegue me dizer um novo horário?'],
            ['Após call', 'D+1', 'Resumo da call', 'Oi {nome}, obrigado pela conversa. Resumo do que combinamos: {resumo}. Qualquer dúvida, me chama.'],
            ['Proposta', 'D+2', 'Follow-up proposta', 'Oi {nome}, conseguiu avaliar a proposta? Fico à disposição para ajustar o que fizer sentido.'],
            ['Negociação', 'D+4', 'Última objeção', 'Oi {nome}, queria entender o que ainda está te impedindo de avançar. Posso te ajudar com isso hoje?'],
            ['Fechamento', 'D+7', 'Fechamento', 'Oi {nome}, estou encerrando as vagas desta semana. Ainda quer garantir a sua?'],
        ];
        foreach ($templates as [$situation, $day, $title, $body]) {
            FollowUpTemplate::firstOrCreate(
                ['user_id' => null, 'title' => $title],
                ['situation' => $situation, 'day_label' => $day, 'body' => $body]
            );
        }

        CompensationRule::firstOrCreate(['name' => 'TZN Legacy padrão'], [
            'company_id' => $company->id,
            'department_id' => null,
            'monthly_cash_target_cents' => 1800000,
            'full_fixed_cents' => 180000,
            'intermediate_percent' => 70,
            'intermediate_fixed_cents' => 90000,
            'effective_from' => now()->startOfMonth()->toDateString(),
            'effective_to' => null,
        ]);

        if ($closer) {
            $month = now()->startOfMonth()->toDateString();
            foreach ([
                'calls_scheduled' => 120,
                'calls_held' => 80,
                'sales' => 20,
                'revenue_cents' => 3000000,
                'cash_cents' => 2500000,
                'commission_cents' => 250000,
            ] as $metric => $target) {
                Goal::firstOrCreate(
                    ['user_id' => $closer->id, 'company_id' => $company->id, 'department_id' => null, 'month' => $month, 'metric' => $metric],
                    ['target_value' => $target]
                );
            }
        }
    }
}
