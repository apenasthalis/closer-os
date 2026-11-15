<?php
namespace Tests\Unit\Finance;
use App\Domain\Finance\PaymentRules;
use PHPUnit\Framework\TestCase;

class PaymentRulesTest extends TestCase {
    public function test_boleto_forced(): void {
        $n = PaymentRules::normalize(['method'=>'boleto','amount_cents'=>400000,'status'=>'pending','gateway_fee'=>10,'received_at'=>'2025-01-01']);
        $this->assertEquals('paid', $n['status']);
        $this->assertEquals(0, $n['gateway_fee_cents']);
        $this->assertNull($n['received_at']);
        $this->assertEquals(400000, $n['amount_cents']);
    }
    public function test_card_pending(): void {
        $n = PaymentRules::normalize(['method'=>'card','amount_cents'=>300000,'status'=>'pending','installments'=>3,'gateway_fee'=>9000]);
        $this->assertEquals('pending', $n['status']);
        $this->assertNull($n['received_at']);
        $this->assertEquals(3, $n['installments']);
    }
}
