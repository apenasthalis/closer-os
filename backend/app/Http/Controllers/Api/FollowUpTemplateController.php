<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FollowUpTemplate;
use Illuminate\Http\Request;

class FollowUpTemplateController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        return FollowUpTemplate::query()
            ->when(!$user->isAdmin(), fn ($q) => $q->where(fn ($x) => $x->whereNull('user_id')->orWhere('user_id', $user->id)))
            ->when($request->situation, fn ($q, $v) => $q->where('situation', $v))
            ->orderBy('day_label')->orderBy('title')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'user_id' => ['nullable','exists:users,id'],
            'situation' => ['nullable','string','max:100'],
            'day_label' => ['nullable','string','max:100'],
            'title' => ['required','string','max:255'],
            'body' => ['required','string'],
        ]);
        if (!$request->user()->isAdmin()) {
            $data['user_id'] = $request->user()->id;
        }
        return response()->json(FollowUpTemplate::create($data), 201);
    }

    public function update(Request $request, FollowUpTemplate $followUpTemplate)
    {
        $this->authorizeTemplate($request, $followUpTemplate);
        $data = $request->validate([
            'situation' => ['nullable','string','max:100'],
            'day_label' => ['nullable','string','max:100'],
            'title' => ['sometimes','required','string','max:255'],
            'body' => ['sometimes','required','string'],
        ]);
        $followUpTemplate->update($data);
        return $followUpTemplate->fresh();
    }

    public function destroy(Request $request, FollowUpTemplate $followUpTemplate)
    {
        $this->authorizeTemplate($request, $followUpTemplate);
        $followUpTemplate->delete();
        return response()->noContent();
    }

    private function authorizeTemplate(Request $request, FollowUpTemplate $template): void
    {
        if (!$request->user()->isAdmin() && $template->user_id !== $request->user()->id) abort(403);
    }
}
