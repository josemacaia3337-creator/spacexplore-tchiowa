import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeAuthReturnPath } from "@/lib/auth-redirect";
export async function GET(request:NextRequest){
 const url=new URL(request.url),code=url.searchParams.get("code"),next=url.searchParams.get("next");
 const safeNext=safeAuthReturnPath(next);
 if(code){const supabase=await createClient();const {error}=await supabase.auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(new URL(safeNext,url.origin));}
 return NextResponse.redirect(new URL("/login?error=Não%20foi%20possível%20confirmar%20o%20email.",url.origin));
}
