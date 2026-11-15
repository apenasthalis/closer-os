<?php
namespace Database\Seeders;
use App\Models\Company;
use App\Models\Department;
use App\Models\Objection;
use App\Models\Operation;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder {
    public function run(): void {
        $admin = User::firstOrCreate(['email'=>'admin@closeros.test'], [
            'name'=>'Administrador',
            'password'=>Hash::make('password'),
            'role'=>'admin',
        ]);
        $closer = User::firstOrCreate(['email'=>'closer@closeros.test'], [
            'name'=>'Closer Demo',
            'password'=>Hash::make('password'),
            'role'=>'closer',
        ]);

        $company = Company::firstOrCreate(['name'=>'TZN Legacy'], ['user_id'=>$admin->id]);
        $ml = Department::firstOrCreate(['company_id'=>$company->id,'name'=>'Mercado Livre']);
        $vis = Department::firstOrCreate(['company_id'=>$company->id,'name'=>'Visagismo']);

        foreach ([
            ['Mercado Livre', 7, $company->id, $ml->id],
            ['Visagismo masculino', 10, $company->id, $vis->id],
        ] as $o) {
            Operation::firstOrCreate(['name'=>$o[0]], [
                'user_id'=>$admin->id,
                'company_id'=>$o[2],
                'department_id'=>$o[3],
                'commission_percent'=>$o[1],
                'archived_at'=>null,
            ]);
        }

        $objs = [
            ['Vou pensar','Decisão','62','Faz sentido pensar. O que exatamente você precisa avaliar para ter certeza? Se eu esclarecer isso agora, você decide hoje?'],
            ['Está caro','Preço','48','Caro comparado a quê? Se o resultado que você descreveu for alcançado, quanto isso vale por mês para você?'],
            ['Preciso falar com meu sócio','Autoridade','55','Perfeito. Vamos fazer uma call de 15 minutos com ele junto, ainda esta semana? Assim eu respondo as dúvidas direto.'],
            ['Já tentei e não deu certo','Confiança','51','Me conta o que você tentou e onde travou. Quero ter certeza de que o que proponho não repete esse caminho.'],
            ['Agora não tenho tempo','Timing','44','Entendo. Quanto tempo por semana isso está custando para você hoje sem resolver? Podemos começar com o mínimo possível.'],
            ['Vou ver com calma e te falo','Decisão','38','Combinado. Para eu não te incomodar à toa, qual dia e horário eu te chamo para ouvir sua decisão?'],
        ];
        foreach ($objs as $o) {
            Objection::firstOrCreate(['name'=>$o[0]], [
                'user_id'=>$admin->id,
                'category'=>$o[1],
                'reference_conversion'=>$o[2],
                'suggested_response'=>$o[3],
            ]);
        }

        // compensation rule TZN
        \App\Models\CompensationRule::firstOrCreate(['name'=>'TZN Legacy padrão'], [
            'company_id'=>$company->id,
            'department_id'=>null,
            'monthly_cash_target_cents'=>1800000,
            'full_fixed_cents'=>180000,
            'intermediate_percent'=>70,
            'intermediate_fixed_cents'=>90000,
            'effective_from'=>now()->startOfMonth()->toDateString(),
            'effective_to'=>null,
        ]);
    }
}
