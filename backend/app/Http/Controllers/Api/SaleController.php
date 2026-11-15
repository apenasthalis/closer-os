<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Refund;
use App\Models\Sale;
use App\Models\SalePayment;
use App\Services\RefundService;
use App\Services\SaleService;
use Illuminate\Http\Request;

class SaleController extends Controller
{
    public function index(Request $request)
    {
        $query = Sale::query()
            ->with(['payments','refund','lead','operation','closer','company','department'])
            ->visibleTo($request->user());
        if ($request->from) $query->whereDate('closed_at','>=',$request->from);
        if ($request->to) $query->whereDate('closed_at','<=',$request->to);
        if ($request->company_id) $query->where('company_id',$request->company_id);
        if ($request->department_id) $query->where('department_id',$request->department_id);
        if ($request->closer_id) $query->where('user_id',$request->closer_id);
        if ($request->operation_id) $query->where('operation_id',$request->operation_id);
        if ($request->q) $query->whereHas('lead', fn ($q) => $q->where('name','like','%'.$request->q.'%'));
        return $query->orderByDesc('closed_at')->paginate(min(200, max(10, (int)$request->input('per_page', 50))));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'lead_id' => ['required','exists:leads,id'],
            'operation_id' => ['required','exists:operations,id'],
            'description' => ['nullable','string'],
            'closed_at' => ['nullable','date'],
            'payments' => ['required','array','min:1'],
            'payments.*.method' => ['required','in:pix,card,boleto'],
            'payments.*.amount_cents' => ['required','integer','min:1'],
            'payments.*.installments' => ['nullable','integer','min:1','max:12'],
            'payments.*.gateway_fee_cents' => ['nullable','integer','min:0'],
            'payments.*.status' => ['nullable','in:paid,pending'],
            'payments.*.received_at' => ['nullable','date'],
        ]);
        $lead = Lead::findOrFail($data['lead_id']);
        $sale = SaleService::create($request->user(), $lead, $data);
        return response()->json($sale, 201);
    }

    public function show(Request $request, Sale $sale)
    {
        $this->authorize('view', $sale);
        return $sale->load(['payments','refund','lead','operation','closer','company','department','commissions']);
    }

    public function update(Request $request, Sale $sale)
    {
        $this->authorize('update', $sale);
        $data = $request->validate([
            'description' => ['nullable','string'],
            'closed_at' => ['sometimes','date'],
            'payments' => ['sometimes','array','min:1'],
            'payments.*.method' => ['required_with:payments','in:pix,card,boleto'],
            'payments.*.amount_cents' => ['required_with:payments','integer','min:1'],
            'payments.*.installments' => ['nullable','integer','min:1','max:12'],
            'payments.*.gateway_fee_cents' => ['nullable','integer','min:0'],
            'payments.*.status' => ['nullable','in:paid,pending'],
            'payments.*.received_at' => ['nullable','date'],
        ]);
        return SaleService::update($request->user(), $sale, $data);
    }

    public function destroy(Request $request, Sale $sale)
    {
        $this->authorize('delete', $sale);
        $refund = RefundService::refund($sale, $request->user());
        return response()->json(['message' => 'Reembolso registrado.', 'refund' => $refund], 201);
    }

    public function pay(Request $request, Sale $sale, SalePayment $payment)
    {
        $this->authorize('update', $sale);
        if ($payment->sale_id !== $sale->id) abort(404);
        $data = $request->validate(['received_at' => ['nullable','date']]);
        $sale = SaleService::markPaymentPaid($request->user(), $sale, $payment, $data['received_at'] ?? null);
        return $sale;
    }

    public function refunds(Request $request)
    {
        $query = Refund::query()->with(['sale','closer','actor'])->orderByDesc('refunded_at');
        if (!$request->user()->isAdmin()) $query->where('closer_user_id', $request->user()->id);
        if ($request->from) $query->whereDate('refunded_at','>=',$request->from);
        if ($request->to) $query->whereDate('refunded_at','<=',$request->to);
        return $query->get();
    }

    public function refund(Request $request, Sale $sale)
    {
        $this->authorize('view', $sale);
        return $sale->refund()->with(['closer','actor'])->firstOrFail();
    }
}
