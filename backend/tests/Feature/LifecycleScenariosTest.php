<?php
namespace Tests\Feature;

use App\Models\Call;
use App\Models\FollowUpTask;
use App\Models\Lead;
use App\Models\LeadEvent;
use App\Models\Refund;

class LifecycleScenariosTest extends DomainTestCase
{
    public function test_deleted_lead_removes_data_and_new_lead_starts_clean(): void
    {
        $lead = $this->makeLead();
        $this->makeCall($lead);
        FollowUpTask::create(['lead_id'=>$lead->id,'user_id'=>$this->closer->id,'scheduled_at'=>now(),'message'=>'x']);
        LeadEvent::create(['lead_id'=>$lead->id,'actor_user_id'=>$this->closer->id,'type'=>'note','payload'=>['note'=>'x'],'created_at'=>now()]);

        $this->actingAs($this->admin)->deleteJson('/api/v1/leads/'.$lead->id)->assertNoContent();
        $this->assertNull(Lead::find($lead->id));
        $this->assertSame(0, Call::where('lead_id',$lead->id)->count());
        $this->assertSame(0, FollowUpTask::where('lead_id',$lead->id)->count());
        $this->assertSame(0, LeadEvent::where('lead_id',$lead->id)->count());

        $new = Lead::create([
            'user_id'=>$this->closer->id,'company_id'=>$this->company->id,'department_id'=>$this->department->id,
            'name'=>'Lead Teste','stage'=>'lead_agendado','no_show_count'=>0,
        ]);
        $this->assertSame(0, $new->no_show_count);
        $this->assertSame(0, $new->events()->count());
    }

    public function test_lead_with_sale_cannot_be_deleted(): void
    {
        $lead = $this->makeLead();
        $this->makeSale($lead, [['method'=>'pix','amount_cents'=>100000,'status'=>'paid','received_at'=>'2026-11-10']]);
        $this->actingAs($this->admin)->deleteJson('/api/v1/leads/'.$lead->id)->assertStatus(422);
        $this->assertNotNull(Lead::find($lead->id));
    }

    public function test_reactivated_lead_starts_new_cycle_without_history(): void
    {
        $lead = $this->makeLead(overrides: ['stage'=>'loss','no_show_count'=>2,'loss_reason'=>'Preço']);
        $this->makeCall($lead, 'no_show');
        LeadEvent::create(['lead_id'=>$lead->id,'actor_user_id'=>$this->closer->id,'type'=>'stage_changed','created_at'=>now()]);

        $response = $this->actingAs($this->admin)->postJson('/api/v1/leads/'.$lead->id.'/reactivate')->assertCreated();
        $newId = $response->json('id');
        $new = Lead::find($newId);
        $this->assertNotNull($new);
        $this->assertSame('lead_agendado', $new->stage);
        $this->assertSame(0, $new->no_show_count);
        $this->assertNull($new->call_at);
        $this->assertNull($new->loss_reason);
        $this->assertNull(Lead::find($lead->id));
        $this->assertSame(1, $new->events()->count());
        $this->assertSame('reactivated', $new->events()->first()->type);
    }

    public function test_each_no_show_occurrence_is_counted(): void
    {
        $lead = $this->makeLead();
        $this->actingAs($this->admin)->postJson('/api/v1/leads/'.$lead->id.'/transition', ['stage'=>'no_show'])->assertOk();
        $this->actingAs($this->admin)->postJson('/api/v1/leads/'.$lead->id.'/transition', ['stage'=>'no_show'])->assertOk();
        $this->assertSame(2, $lead->fresh()->no_show_count);
        $this->assertSame(2, $lead->calls()->where('status','no_show')->count());
    }

    public function test_manual_refund_stage_is_blocked_and_sale_delete_creates_refund(): void
    {
        $lead = $this->makeLead();
        $this->actingAs($this->admin)->postJson('/api/v1/leads/'.$lead->id.'/transition', ['stage'=>'reembolso'])->assertStatus(422);
        $this->assertSame('lead_agendado', $lead->fresh()->stage);

        $sale = $this->makeSale($lead, [['method'=>'pix','amount_cents'=>100000,'status'=>'paid','received_at'=>'2026-11-10']]);
        $this->actingAs($this->admin)->deleteJson('/api/v1/sales/'.$sale->id)->assertCreated();
        $this->assertSame('reembolso', $lead->fresh()->stage);
        $this->assertSame(1, Refund::where('sale_id',$sale->id)->count());
        $this->assertTrue(LeadEvent::where('lead_id',$lead->id)->where('type','refund')->exists());
    }
}
