<?php
namespace Tests\Unit\Finance;
use App\Domain\Finance\SaleCalculator;
use PHPUnit\Framework\TestCase;

class SaleCalculatorTest extends TestCase {
    public function test_pix_paid(): void {
        $p = [['method'=>'pix','amount_cents'=>500000,'status'=>'paid']];
        $t = SaleCalculator::totals($p);
        $this->assertEquals(500000, $t['fat']);
        $this->assertEquals(500000, $t['caixa']);
        $this->assertEquals(0, $t['aberto']);
    }
    public function test_pix_pending(): void {
        $p = [['method'=>'pix','amount_cents'=>500000,'status'=>'pending']];
        $t = SaleCalculator::totals($p);
        $this->assertEquals(500000, $t['fat']);
        $this->assertEquals(0, $t['caixa']);
        $this->assertEquals(500000, $t['aberto']);
    }
    public function test_boleto(): void {
        $p = [['method'=>'boleto','amount_cents'=>600000,'status'=>'paid']];
        $t = SaleCalculator::totals($p);
        $this->assertEquals(600000, $t['fat']);
        $this->assertEquals(0, $t['caixa']);
    }
    public function test_multi(): void {
        $p = [
            ['method'=>'pix','amount_cents'=>200000,'status'=>'paid'],
            ['method'=>'card','amount_cents'=>200000,'status'=>'paid','gateway_fee_cents'=>9000],
            ['method'=>'boleto','amount_cents'=>100000,'status'=>'paid'],
        ];
        $t = SaleCalculator::totals($p);
        $this->assertEquals(500000, $t['fat']);
        $this->assertEquals(391000, $t['caixa']);
    }
    public function test_commission(): void {
        $this->assertEquals(14000, SaleCalculator::commission(200000, 7));
    }
}
