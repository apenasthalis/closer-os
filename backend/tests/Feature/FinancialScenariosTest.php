<?php
namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Commission;
use App\Models\Lead;
use App\Models\Refund;
use App\Models\Sale;
use App\Models\SalePayment;
use App\Services\RefundService;
use App\Services\SaleService;

class FinancialScenariosTest extends DomainTestCase
{
    public function test_pix_paid_counts_in_billing_and_cash(): void
    {
        $lead = $this->makeLead();
        $this->makeSale($lead, [['method'=>'pix','amount_cents'=>500000,'status'=>'paid','received_at'=>'2026-11-10']]);
        $f = $this->finance('2026-11-01','2026-11-30');
        $this->assertSame(500000, $f['faturamento_bruto']);
        $this->assertSame(500000, $f['caixa_liquido']);
        $this->assertSame(35000, $f['comissao_gerada']);
    }

    public function test_pix_pending_counts_in_billing_but_not_cash(): void
    {
        $lead = $this->makeLead();
        $this->makeSale($lead, [['method'=>'pix','amount_cents'=>500000,'status'=>'pending']]);
        $f = $this->finance('2026-11-01','2026-11-30');
        $this->assertSame(500000, $f['faturamento_bruto']);
        $this->assertSame(0, $f['caixa_liquido']);
        $this->assertSame(500000, $f['a_receber']);
        $this->assertSame(0, $f['comissao_gerada']);
    }

    public function test_card_pending_counts_in_billing_but_not_cash(): void
    {
        $lead = $this->makeLead();
        $this->makeSale($lead, [['method'=>'card','amount_cents'=>300000,'status'=>'pending','gateway_fee_cents'=>9000,'installments'=>3]]);
        $f = $this->finance('2026-11-01','2026-11-30');
        $this->assertSame(300000, $f['faturamento_bruto']);
        $this->assertSame(0, $f['caixa_liquido']);
    }

    public function test_pending_pix_paid_in_later_month_counts_only_then(): void
    {
        $lead = $this->makeLead();
        $sale = $this->makeSale($lead, [['method'=>'pix','amount_cents'=>500000,'status'=>'pending']]);
        $payment = $sale->payments()->first();
        SaleService::markPaymentPaid($this->admin, $sale, $payment, '2026-12-05');

        $nov = $this->finance('2026-11-01','2026-11-30');
        $dec = $this->finance('2026-12-01','2026-12-31');
        $this->assertSame(500000, $nov['faturamento_bruto']);
        $this->assertSame(0, $nov['caixa_liquido']);
        $this->assertSame(0, $nov['comissao_gerada']);
        $this->assertSame(0, $dec['faturamento_bruto']);
        $this->assertSame(500000, $dec['caixa_liquido']);
        $this->assertSame(35000, $dec['comissao_gerada']);
    }

    public function test_boleto_counts_in_billing_without_cash(): void
    {
        $lead = $this->makeLead();
        $this->makeSale($lead, [['method'=>'boleto','amount_cents'=>600000,'status'=>'pending']]);
        $f = $this->finance('2026-11-01','2026-11-30');
        $this->assertSame(600000, $f['faturamento_bruto']);
        $this->assertSame(0, $f['caixa_liquido']);
        $this->assertSame(0, $f['a_receber']);
    }

    public function test_multiple_payments_sum_correctly(): void
    {
        $lead = $this->makeLead();
        $this->makeSale($lead, [
            ['method'=>'pix','amount_cents'=>200000,'status'=>'paid','received_at'=>'2026-11-10'],
            ['method'=>'card','amount_cents'=>200000,'status'=>'paid','gateway_fee_cents'=>9000,'received_at'=>'2026-11-10'],
            ['method'=>'boleto','amount_cents'=>100000],
        ]);
        $f = $this->finance('2026-11-01','2026-11-30');
        $this->assertSame(500000, $f['faturamento_bruto']);
        $this->assertSame(391000, $f['caixa_liquido']);
        $this->assertSame(27370, $f['comissao_gerada']);
    }

    public function test_commission_only_on_eligible_cash(): void
    {
        $lead = $this->makeLead();
        $sale = $this->makeSale($lead, [
            ['method'=>'pix','amount_cents'=>100000,'status'=>'paid','received_at'=>'2026-11-10'],
            ['method'=>'pix','amount_cents'=>200000,'status'=>'pending'],
            ['method'=>'boleto','amount_cents'=>300000],
        ]);
        $commission = Commission::where('sale_id',$sale->id)->first();
        $this->assertSame(100000, $commission->base_cents);
        $this->assertSame(7000, $commission->amount_cents);
    }

    public function test_commission_percentage_is_frozen_on_sale(): void
    {
        $first = $this->makeSale($this->makeLead(), [['method'=>'pix','amount_cents'=>100000,'status'=>'paid','received_at'=>'2026-11-10']]);
        $this->operation->update(['commission_percent'=>10]);
        $second = $this->makeSale($this->makeLead(overrides: ['name'=>'Outro']), [['method'=>'pix','amount_cents'=>100000,'status'=>'paid','received_at'=>'2026-11-10']]);
        $this->assertSame('7.00', $first->fresh()->commission_percent);
        $this->assertSame('10.00', $second->fresh()->commission_percent);
        $this->assertSame(7000, Commission::where('sale_id',$first->id)->value('amount_cents'));
        $this->assertSame(10000, Commission::where('sale_id',$second->id)->value('amount_cents'));
    }

    public function test_refund_reverses_finance_and_commission(): void
    {
        $lead = $this->makeLead();
        $sale = $this->makeSale($lead, [
            ['method'=>'pix','amount_cents'=>50000,'status'=>'paid','received_at'=>'2026-11-10'],
            ['method'=>'card','amount_cents'=>50000,'status'=>'paid','gateway_fee_cents'=>2000,'received_at'=>'2026-11-10'],
            ['method'=>'boleto','amount_cents'=>20000],
            ['method'=>'pix','amount_cents'=>10000,'status'=>'pending'],
        ]);
        $refund = RefundService::refund($sale, $this->admin);

        $this->assertSame(130000, $refund->amount_cents);
        $this->assertSame(98000, $refund->cash_refunded_cents);
        $this->assertSame(6860, $refund->commission_reversed_cents);
        $this->assertSame('cancelled', $sale->payments()->where('method','pix')->where('amount_cents',10000)->value('status'));
        $this->assertSame('reembolso', $lead->fresh()->stage);
        $this->assertNotNull($sale->fresh());

        $f = $this->finance('2026-11-01','2026-11-30');
        $this->assertSame(130000, $f['faturamento_bruto']);
        $this->assertSame(130000, $f['reembolsos']);
        $this->assertSame(0, $f['faturamento_liquido']);
        $this->assertSame(0, $f['caixa_liquido']);
        $this->assertSame(0, $f['comissao_liquida']);
        $this->assertTrue(AuditLog::where('action','sale_refunded')->where('entity_id',$sale->id)->exists());
    }

    public function test_refund_is_atomic_and_cannot_be_duplicated(): void
    {
        $sale = $this->makeSale($this->makeLead(), [['method'=>'pix','amount_cents'=>500000,'status'=>'paid','received_at'=>'2026-11-10']]);
        RefundService::refund($sale, $this->admin);
        $this->expectException(\Illuminate\Validation\ValidationException::class);
        RefundService::refund($sale->fresh(), $this->admin);
        $this->assertSame(1, Refund::where('sale_id',$sale->id)->count());
    }

    public function test_scheduled_date_is_not_confused_with_received_date(): void
    {
        $lead = $this->makeLead();
        $sale = $this->makeSale($lead, [['method'=>'pix','amount_cents'=>500000,'status'=>'paid','received_at'=>'2026-12-01']], '2026-11-15');
        $nov = $this->finance('2026-11-01','2026-11-30');
        $dec = $this->finance('2026-12-01','2026-12-31');
        $this->assertSame(500000, $nov['faturamento_bruto']);
        $this->assertSame(0, $nov['caixa_liquido']);
        $this->assertSame(0, $dec['faturamento_bruto']);
        $this->assertSame(500000, $dec['caixa_liquido']);
    }
}
