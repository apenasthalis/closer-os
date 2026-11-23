<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Call;
use App\Models\FollowUpTask;
use App\Models\Lead;
use App\Models\SalePayment;
use App\Services\FinanceService;
use App\Services\GoalService;
use App\Services\PipelineService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function today(Request $request)
    {
        $user = $request->user();
        $today = Carbon::now('America/Sao_Paulo');
        $start = $today->copy()->startOfDay()->utc();
        $end = $today->copy()->endOfDay()->utc();

        $leadsToday = Lead::query()->visibleTo($user)
            ->with(['closer','company','department','sale.payments'])
            ->whereBetween('call_at', [$start, $end])
            ->orderBy('call_at')->get();

        $callsToday = Call::query()->visibleTo($user)
            ->with(['lead','closer','scorecard'])
            ->whereBetween('call_at', [$start, $end])
            ->orderBy('call_at')->get();

        $needsDate = Lead::query()->visibleTo($user)
            ->with(['closer','company','department'])
            ->whereNotIn('stage', ['fechado','loss','desqualificado','reembolso','no_show'])
            ->where(function ($q) use ($start) {
                $q->whereNull('call_at')->orWhere('call_at', '<', $start);
            })
            ->orderBy('call_at')->limit(30)->get();

        $overdue = FollowUpTask::query()->visibleTo($user)
            ->with('lead')->where('status','pending')
            ->where('scheduled_at','<', now())->orderBy('scheduled_at')->limit(20)->get();

        $upcoming = FollowUpTask::query()->visibleTo($user)
            ->with('lead')->where('status','pending')
            ->where('scheduled_at','>=', now())->orderBy('scheduled_at')->limit(20)->get();

        $doneFollowUps = FollowUpTask::query()->visibleTo($user)
            ->with('lead')->where('status','done')
            ->orderByDesc('completed_at')->orderByDesc('scheduled_at')->limit(20)->get();

        $lossLeads = Lead::query()->visibleTo($user)
            ->with(['closer','company','department'])
            ->where('stage', 'loss')
            ->orderByDesc('stage_changed_at')
            ->limit(20)->get();

        $monthStart = $today->copy()->startOfMonth()->toDateString();
        $monthEnd = $today->copy()->endOfMonth()->toDateString();
        $finance = FinanceService::metrics($user, ['from'=>$monthStart,'to'=>$monthEnd]);

        $goals = GoalService::progress($user, [
            'month' => $today->format('Y-m'),
            'user_id' => $user->isAdmin() ? null : $user->id,
        ]);

        $pipeline = PipelineService::metrics($user, []);

        $pendingPayments = SalePayment::query()
            ->with(['sale.lead'])
            ->where('status', 'pending')
            ->whereIn('method', ['pix', 'card'])
            ->whereHas('sale', fn ($q) => $q->visibleTo($user)->whereDoesntHave('refund'))
            ->orderBy('received_at')
            ->limit(30)
            ->get();

        $pendingMoney = [
            'total_cents' => (int) $pendingPayments->sum('amount_cents'),
            'items' => $pendingPayments->map(fn ($p) => [
                'id' => $p->id,
                'sale_id' => $p->sale_id,
                'lead_id' => $p->sale?->lead_id,
                'lead_name' => $p->sale?->lead?->name,
                'method' => $p->method,
                'amount_cents' => $p->amount_cents,
                'received_at' => $p->received_at?->toDateString(),
            ])->values(),
        ];

        return response()->json([
            'date' => $today->toDateString(),
            'greeting_name' => $user->name,
            'leads_today' => $leadsToday,
            'calls_today' => $callsToday,
            'needs_new_date' => $needsDate,
            'pending_money' => $pendingMoney,
            'follow_ups_overdue' => $overdue,
            'follow_ups_upcoming' => $upcoming,
            'follow_ups_done' => $doneFollowUps,
            'loss_leads' => $lossLeads,
            'finance' => $finance,
            'goals' => $goals,
            'pipeline' => $pipeline,
        ]);
    }
}
