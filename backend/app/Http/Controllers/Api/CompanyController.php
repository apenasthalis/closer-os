<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Http\Request;
class CompanyController extends Controller {
    public function index(Request $r){ $q=Company::query(); if(!$r->user()->isAdmin()) $q->where('user_id',$r->user()->id); return $q->get(); }
    public function store(Request $r){ $d=$r->validate(['name'=>'required|string']); $d['user_id']=$r->user()->id; return Company::create($d); }
    public function show(Company $company){ return $company; }
    public function update(Request $r, Company $company){ $company->update($r->only('name')); return $company; }
    public function destroy(Company $company){ $company->delete(); return response()->noContent(); }
}
