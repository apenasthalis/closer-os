<?php
namespace Tests\Feature;

use App\Models\Call;
use App\Models\Company;
use App\Models\CompensationRule;
use App\Models\Department;
use App\Models\Lead;
use App\Models\Operation;
use App\Models\Sale;
use App\Models\User;
use App\Services\SaleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

abstract class DomainTestCase extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $closer;
    protected User $otherCloser;
    protected Company $company;
    protected Department $department;
    protected Operation $operation;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create(['name'=>'Admin','email'=>'admin@test.local','password'=>'password','role'=>'admin','active'=>true]);
        $this->closer = User::create(['name'=>'Closer Um','email'=>'closer1@test.local','password'=>'password','role'=>'closer','active'=>true]);
        $this->otherCloser = User::create(['name'=>'Closer Dois','email'=>'closer2@test.local','password'=>'password','role'=>'closer','active'=>true]);
        $this->company = Company::create(['name'=>'TZN Legacy']);
        $this->department = Department::create(['company_id'=>$this->company->id,'name'=>'Mercado Livre']);
        $this->operation = Operation::create([
            'company_id'=>$this->company->id,
            'department_id'=>$this->department->id,
            'name'=>'Mercado Livre',
            'commission_percent'=>7,
        ]);
    }

    protected function makeLead(?User $user = null, array $overrides = []): Lead
    {
        return Lead::create(array_merge([
            'user_id'=>($user ?? $this->closer)->id,
            'company_id'=>$this->company->id,
            'department_id'=>$this->department->id,
            'name'=>'Lead Teste',
            'phone'=>'11999999999',
            'email'=>'lead@test.local',
            'call_at'=>now()->setDate(2026, 11, 16)->setTime(14, 0),
            'stage'=>'lead_agendado',
            'stage_changed_at'=>now(),
            'no_show_count'=>0,
            'qualification'=>['budget'=>false,'authority'=>false,'need'=>false,'timing'=>false],
        ], $overrides));
    }

    protected function makeSale(Lead $lead, array $payments, ?string $closedAt = '2026-11-15', ?User $actor = null): Sale
    {
        return SaleService::create($actor ?? $this->admin, $lead, [
            'operation_id'=>$this->operation->id,
            'closed_at'=>$closedAt,
            'payments'=>$payments,
        ]);
    }

    protected function makeCall(Lead $lead, string $status = 'held', ?string $at = '2026-11-15 14:00:00', ?User $user = null): Call
    {
        return Call::create([
            'user_id'=>($user ?? $lead->closer)->id,
            'lead_id'=>$lead->id,
            'company_id'=>$lead->company_id,
            'department_id'=>$lead->department_id,
            'call_at'=>$at,
            'status'=>$status,
        ]);
    }

    protected function makeRule(array $overrides = []): CompensationRule
    {
        return CompensationRule::create(array_merge([
            'company_id'=>$this->company->id,
            'department_id'=>null,
            'name'=>'TZN Legacy padrão',
            'monthly_cash_target_cents'=>1800000,
            'full_fixed_cents'=>180000,
            'intermediate_percent'=>70,
            'intermediate_fixed_cents'=>90000,
            'effective_from'=>'2026-01-01',
            'effective_to'=>null,
        ], $overrides));
    }

    protected function finance(string $from, string $to, ?User $user = null): array
    {
        return \App\Services\FinanceService::metrics($user ?? $this->admin, ['from'=>$from,'to'=>$to]);
    }
}
