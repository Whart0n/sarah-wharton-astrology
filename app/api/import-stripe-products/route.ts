import { NextResponse } from "next/server";
import { getServerStripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";

// Default duration for imported services (minutes)
const DEFAULT_DURATION = 60;

export async function POST() {
  try {
    const stripe = getServerStripe();
    if (!stripe) {
      return NextResponse.json({ error: "Stripe not initialized" }, { status: 500 });
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin not initialized" }, { status: 500 });
    }

    // Fetch all active products with prices
    const products = await stripe.products.list({ active: true, limit: 100 });
    const prices = await stripe.prices.list({ active: true, limit: 100, expand: ["data.product"] });
    // Map productId -> price (first price found)
    const priceMap: Record<string, number> = {};
    for (const price of prices.data) {
      if (typeof price.unit_amount === "number" && typeof price.product === "string") {
        priceMap[price.product] = price.unit_amount;
      } else if (typeof price.unit_amount === "number" && price.product && typeof price.product === "object" && "id" in price.product) {
        priceMap[(price.product as any).id] = price.unit_amount;
      }
    }

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    const results: any[] = [];

    for (const product of products.data) {
      const price_cents = priceMap[product.id];
      if (!price_cents) {
        skipped++;
        results.push({ name: product.name, reason: "No price found" });
        continue;
      }
      // Duration from metadata or default
      let duration_minutes = DEFAULT_DURATION;
      if (product.metadata && product.metadata.duration_minutes) {
        const parsed = parseInt(product.metadata.duration_minutes as string, 10);
        if (!isNaN(parsed)) duration_minutes = parsed;
      }
      // Upsert into Supabase services table (by name)
      const { data: existing, error: fetchErr } = await supabaseAdmin
        .from("services")
        .select("id")
        .eq("name", product.name)
        .maybeSingle();
      if (fetchErr) {
        results.push({ name: product.name, reason: "Supabase fetch error", error: fetchErr.message });
        skipped++;
        continue;
      }
      const upsertObj = {
        name: product.name,
        description: product.description || "",
        duration_minutes,
        price_cents,
      };
      let upsertRes;
      if (existing) {
        upsertRes = await supabaseAdmin
          .from("services")
          .update(upsertObj)
          .eq("id", existing.id)
          .select()
          .single();
        updated++;
      } else {
        upsertRes = await supabaseAdmin
          .from("services")
          .insert([upsertObj])
          .select()
          .single();
        imported++;
      }
      if (upsertRes.error) {
        results.push({ name: product.name, reason: "Supabase upsert error", error: upsertRes.error.message });
        skipped++;
      } else {
        results.push({ name: product.name, status: existing ? "updated" : "imported" });
      }
    }
    return NextResponse.json({ imported, updated, skipped, results });
  } catch (error: any) {
    console.error("Error importing Stripe products:", error);
    return NextResponse.json({ error: error.message || "Failed to import Stripe products" }, { status: 500 });
  }
}
