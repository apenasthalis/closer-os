<?php
namespace Tests\Feature;

use App\Services\ConversionService;
use App\Services\RefundService;

class ConversionScenariosTest extends DomainTestCase
{
    public function test_lead_without_real_call_does_not_enter_denominator(): void
    {
        $this->makeLead();
        $m = ConversionService::metrics($this->admin, ['from'=>'2026-11-01','to'=>'2026-11-30']);
        $this->assertSame(0, $m['calls_held']);
        $this->assertSame(0.0, (float)$m['conversion']);
    }

    public function test_no_show_does_not_enter_denominator(): void
    {
        $lead = $this->makeLead();
        $this->makeCall($lead, 'no_show');
        $m = ConversionService::metrics($this->admin, ['from'=>'2026-11-01','to'=>'2026-11-30']);
        $this->assertSame(0, $m['calls_held']);
        $this->assertSame(1, $m['no_shows']);
        $this->assertSame(0.0, (float)$m['conversion']);
    }

    public function test_disqualified_without_call_does_not_affect_conversion(): void
    {
        $this->makeLead(overrides: ['stage'=>'desqualificado']);
        $m = ConversionService::metrics($this->admin, ['from'=>'2026-11-01','to'=>'2026-11-30']);
        $this->assertSame(0, $m['calls_held']);
        $this->assertSame(1, $m['disqualified']);
        $this->assertSame(0.0, (float)$m['conversion']);
    }

    public function test_held_call_enters_denominator(): void
    {
        $lead = $this->makeLead();
        $this->makeCall($lead, 'held');
        $m = ConversionService::metrics($this->admin, ['from'=>'2026-11-01','to'=>'2026-11-30']);
        $this->assertSame(1, $m['calls_held']);
        $this->assertSame(0.0, (float)$m['conversion']);
    }

    public function test_sale_with_held_call_is_100_percent_conversion(): void
    {
        $lead = $this->makeLead();
        $this->makeCall($lead, 'held');
        $this->makeSale($lead, [['method'=>'pix','amount_cents'=>500000,'status'=>'paid','received_at'=>'2026-11-10']]);
        $m = ConversionService::metrics($this->admin, ['from'=>'2026-11-01','to'=>'2026-11-30']);
        $this->assertSame(1, $m['calls_held']);
        $this->assertSame(1, $m['sales']);
        $this->assertSame(100.0, (float)$m['conversion']);
    }

    public function test_refund_is_separate_from_active_sale(): void
    {
        $lead = $this->makeLead();
        $this->makeCall($lead, 'held');
        $sale = $this->makeSale($lead, [['method'=>'pix','amount_cents'=>500000,'status'=>'paid','received_at'=>'2026-11-10']]);
        RefundService::refund($sale, $this->admin);
        $m = ConversionService::metrics($this->admin, ['from'=>'2026-11-01','to'=>'2026-11-30']);
        $this->assertSame(0, $m['sales']);
        $this->assertSame(1, $m['refunded_sales']);
        $this->assertSame(0.0, (float)$m['conversion']);
    }
}
