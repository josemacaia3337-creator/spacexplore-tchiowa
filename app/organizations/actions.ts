"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export async function createOrganization(formData:FormData){
 const name=String(formData.get("name")??"").trim();
 const slug=String(formData.get("slug")??"").trim().toLowerCase();
 if(name.length<2||name.length>120||!/^[a-z0-9]+([a-z0-9-]*[a-z0-9])?$/.test(slug)||slug.length>60)redirect("/dashboard?error=Verifique%20o%20nome%20e%20o%20identificador%20da%20organização.");
 const supabase=await createClient();const {error}=await supabase.rpc("create_organization_with_owner",{org_name:name,org_slug:slug});
 if(error)redirect("/dashboard?error=Não%20foi%20possível%20criar%20a%20organização.%20O%20identificador%20pode%20já%20estar%20em%20uso.");
 redirect("/dashboard?created=1");
}
