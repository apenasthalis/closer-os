<?php
namespace Tests\Feature;

class PermissionsTest extends DomainTestCase
{
    public function test_closer_cannot_view_other_closer_lead(): void
    {
        $lead = $this->makeLead($this->closer);
        $this->actingAs($this->otherCloser)->getJson('/api/v1/leads/'.$lead->id)->assertForbidden();
        $this->actingAs($this->admin)->getJson('/api/v1/leads/'.$lead->id)->assertOk();
    }

    public function test_closer_cannot_view_other_closer_sale(): void
    {
        $sale = $this->makeSale($this->makeLead($this->closer), [['method'=>'pix','amount_cents'=>100000,'status'=>'paid','received_at'=>'2026-11-10']]);
        $this->actingAs($this->otherCloser)->getJson('/api/v1/sales/'.$sale->id)->assertForbidden();
        $this->actingAs($this->admin)->getJson('/api/v1/sales/'.$sale->id)->assertOk();
    }

    public function test_closer_cannot_move_other_closer_lead(): void
    {
        $lead = $this->makeLead($this->closer);
        $this->actingAs($this->otherCloser)->postJson('/api/v1/leads/'.$lead->id.'/transition', ['stage'=>'negociacao'])->assertForbidden();
        $this->assertSame('lead_agendado', $lead->fresh()->stage);
    }

    public function test_admin_only_endpoints_are_blocked_for_closer(): void
    {
        $this->actingAs($this->closer)->getJson('/api/v1/users')->assertForbidden();
        $this->actingAs($this->closer)->postJson('/api/v1/goals', [
            'user_id'=>$this->closer->id,
            'company_id'=>$this->company->id,
            'month'=>'2026-11',
            'metric'=>'sales',
            'target_value'=>10,
        ])->assertForbidden();
        $this->actingAs($this->admin)->getJson('/api/v1/users')->assertOk();
    }
}
