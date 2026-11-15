<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Department;
use Illuminate\Http\Request;
class DepartmentController extends Controller {
    public function index(Request $r){ $q=Department::query(); if($r->company_id) $q->where('company_id',$r->company_id); return $q->get(); }
    public function store(Request $r){ $d=$r->validate(['company_id'=>'required|exists:companies,id','name'=>'required|string']); return Department::create($d); }
    public function show(Department $department){ return $department; }
    public function update(Request $r, Department $department){ $department->update($r->only('name')); return $department; }
    public function destroy(Department $department){ $department->delete(); return response()->noContent(); }
}
