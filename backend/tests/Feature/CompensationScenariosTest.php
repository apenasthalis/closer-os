<?php
namespace Tests\Feature;

use App\Services\CompensationService;
use App\Services\RefundService;

class CompensationScenariosTest extends DomainTestCase
{
    private function cashSale(int $cents, string $receivedAt = '2026-11-10'): void
    {
        $this->makeSale($this->makeLead(), [
            ['method'=>'pix','amount_cents'=>$cents,'status'=>'paid','received_at'=>$receivedAt],
        ]);
    }

    public function test_below_70_percent_receives_only_commission(): void
    {
        $this->makeRule();
        $this->cashSale(1259800);
        $r = CompensationService::calculate($this->admin, $this->closer->id, '2026-11');
        $this->assertSame('sem_fixo', $r['fixed_status']);
        $this->assertSame(0, $r['fixed_cents']);
        $this->assertSame(88186, $r['commission_cents']);
    }

    public function test_exactly_70_percent_receives_half_fixed(): void
    {
        $this->makeRule();
        $this->cashSale(1260000);
        $r = CompensationService::calculate($this->admin, $this->closer->id, '2026-11');
        $this->assertSame(70.0, (float)$r['percent']);
        $this->assertSame('fixo_parcial', $r['fixed_status']);
        $this->assertSame(90000, $r['fixed_cents']);
        $this->assertSame(88200, $r['commission_cents']);
        $this->assertSame(178200, $r['total_cents']);
    }

    public function test_between_70_and_99_receives_half_fixed(): void
    {
        $this->makeRule();
        $this->cashSale(1500000);
        $r = CompensationService::calculate($this->admin, $this->closer->id, '2026-11');
        $this->assertSame('fixo_parcial', $r['fixed_status']);
        $this->assertSame(90000, $r['fixed_cents']);
    }

    public function test_100_percent_receives_full_fixed(): void
    {
        $this->makeRule();
        $this->cashSale(1800000);
        $r = CompensationService::calculate($this->admin, $this->closer->id, '2026-11');
        $this->assertSame(100.0, (float)$r['percent']);
        $this->assertSame('fixo_integral', $r['fixed_status']);
        $this->assertSame(180000, $r['fixed_cents']);
        $this->assertSame(126000, $r['commission_cents']);
        $this->assertSame(306000, $r['total_cents']);
    }

    public function test_payment_in_later_month_counts_only_in_receipt_month(): void
    {
        $this->makeRule();
        $this->cashSale(1260000, '2026-12-01');
        $nov = CompensationService::calculate($this->admin, $this->closer->id, '2026-11');
        $dec = CompensationService::calculate($this->admin, $this->closer->id, '2026-12');
        $this->assertSame(0, $nov['cash_received_cents']);
        $this->assertSame(0, $nov['fixed_cents']);
        $this->assertSame(1260000, $dec['cash_received_cents']);
        $this->assertSame(90000, $dec['fixed_cents']);
    }

    public function test_refund_reduces_cash_and_remuneration(): void
    {
        $this->makeRule();
        $sale = $this->makeSale($this->makeLead(), [
            ['method'=>'pix','amount_cents'=>1800000,'status'=>'paid','received_at'=>'2026-11-10'],
        ]);
        RefundService::refund($sale, $this->admin);
        $r = CompensationService::calculate($this->admin, $this->closer->id, '2026-11');
        $this->assertSame(0, $r['cash_received_cents']);
        $this->assertSame(0, $r['fixed_cents']);
        $this->assertSame(0, $r['commission_cents']);
    }

    public function test_historical_snapshot_is_preserved_after_rule_change(): void
    {
        $rule = $this->makeRule(['effective_from'=>'2026-01-01']);
        $oct = CompensationService::calculate($this->admin, $this->closer->id, '2026-10');
        $this->assertSame(1800000, $oct['target_cents']);

        $rule->update(['monthly_cash_target_cents'=>2500000,'full_fixed_cents'=>250000,'intermediate_fixed_cents'=>125000]);
        $again = CompensationService::calculate($this->admin, $this->closer->id, '2026-10');
        $this->assertSame(1800000, $again['target_cents']);
        $this->assertSame(180000, $again['snapshot']['full_fixed_cents']);
    }
}
