"""
etl_pipeline.py
"""
 
import time
import hashlib
from datetime import datetime, timedelta, date
from supabase import create_client
 
SUPABASE_URL         = "https://jwkjqowuponrqmxwhgsj.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3a2pxb3d1cG9ucnFteHdoZ3NqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE3NzExNCwiZXhwIjoyMDg2NzUzMTE0fQ.cZPC5QXFMOyWBJgDBKc9uXoo-a6x0E-vbaH3AqHwsIc"
COMPANY_ID           = "4f8edee8-9ec2-47d8-be24-180854da63df"
LYNARA_LAUNCH        = date(2026, 2, 1)
 
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
 
CHANNEL_MAP = {
    "instagram": "instagram", "tiktok":   "tiktok",
    "facebook":  "facebook",  "whatsapp": "whatsapp",
    "email":     "email",     "linkedin": "linkedin",
    "organic":   "organic",   "referral": "referral",
}
 
# CPL ranges by channel — Tunisian digital market benchmarks
# After Lynara: AI bid optimisation → 15% reduction per channel
CPL_RANGES = {
    "instagram": (130, 180),
    "tiktok":    ( 80, 120),
    "facebook":  (180, 250),
    "whatsapp":  ( 70, 100),
    "email":     ( 90, 130),
    "linkedin":  (280, 400),
    "organic":   ( 30,  60),
    "referral":  ( 40,  70),
    "unknown":   ( 90, 130),
}
CPL_AI_FACTOR = 0.77  # 23% reduction from AI optimization (MENA benchmark)
 
# ── DETERMINISTIC HELPERS ────────────────────────────────────────────────────
def det_hash(lead_id, seed=""):
    return int(hashlib.md5((lead_id + seed).encode()).hexdigest(), 16)
 
def det_float(lead_id, lo, hi, seed=""):
    h = det_hash(lead_id, seed)
    return round(lo + (h % 10000) / 10000.0 * (hi - lo), 2)
 
def deterministic_cpl(lead_id, channel_name, is_post):
    lo, hi = CPL_RANGES.get(channel_name, (90, 130))
    base   = det_float(lead_id, lo, hi, "cpl")
    return round(base * (CPL_AI_FACTOR if is_post else 1.0), 2)
 
# ── DIMENSION: TIME ──────────────────────────────────────────────────────────
def populate_dim_time():
    print("  populating dw_dim_time...")
    start_date = date(2025, 1, 1)
    end_date   = date(2026, 12, 31)
    current    = start_date
    rows       = []
    while current <= end_date:
        is_post = current >= LYNARA_LAUNCH
        m       = current.month
        if m in [2, 3]:    season = "ramadan"
        elif m in [6,7,8]: season = "summer"
        elif m == 11:      season = "black_friday"
        elif m in [12, 1]: season = "year_end"
        else:              season = "low_season"
        rows.append({
            "full_date":      current.isoformat(),
            "day_of_month":   current.day,
            "day_name":       current.strftime("%A"),
            "week_number":    current.isocalendar()[1],
            "month_number":   current.month,
            "month_name":     current.strftime("%B"),
            "quarter":        (current.month - 1) // 3 + 1,
            "year":           current.year,
            "is_weekend":     current.weekday() >= 5,
            "is_post_lynara": is_post,
            "season":         season,
        })
        current += timedelta(days=1)
    inserted = 0
    for i in range(0, len(rows), 500):
        try:
            supabase.table("dw_dim_time").upsert(rows[i:i+500], on_conflict="full_date").execute()
            inserted += len(rows[i:i+500])
        except Exception as e:
            print(f"    warning: {e}")
    print(f"  ✅ {inserted} date rows upserted")
 
# ── LOAD DIMENSION IDs ───────────────────────────────────────────────────────
def get_dim_ids():
    print("  loading dimension IDs...")
    time_res     = supabase.table("dw_dim_time").select("time_id, full_date").execute()
    time_map     = {r["full_date"]: r["time_id"] for r in (time_res.data or [])}
    channel_res  = supabase.table("dw_dim_channel").select("channel_id, channel_name").execute()
    channel_map  = {r["channel_name"]: r["channel_id"] for r in (channel_res.data or [])}
    campaign_res = supabase.table("dw_dim_campaign").select("campaign_id, campaign_name").execute()
    campaign_map = {r["campaign_name"]: r["campaign_id"] for r in (campaign_res.data or [])}
    status_res   = supabase.table("dw_dim_status").select("status_id, status_name").execute()
    status_map   = {r["status_name"]: r["status_id"] for r in (status_res.data or [])}
    return time_map, channel_map, campaign_map, status_map
 
# ── LOOKUP HELPERS ───────────────────────────────────────────────────────────
def get_time_id(time_map, dt_str):
    if not dt_str: return None
    return time_map.get(str(dt_str)[:10])
 
def get_is_post(dt_str):
    if not dt_str: return False
    return datetime.fromisoformat(str(dt_str)[:10]).date() >= LYNARA_LAUNCH
 
def get_channel_id(channel_map, raw):
    normalized = CHANNEL_MAP.get((raw or "").lower().strip(), "organic")
    return channel_map.get(normalized, channel_map.get("organic"))
 
def get_campaign_id(campaign_map, name):
    if not name: return campaign_map.get("Campagne Générale Traveltodo")
    if name in campaign_map: return campaign_map[name]
    name_lower = str(name).lower()
    for k, v in campaign_map.items():
        if name_lower in k.lower() or k.lower() in name_lower:
            return v
    return campaign_map.get("Campagne Générale Traveltodo")
 
def get_status_id(status_map, status_name):
    return status_map.get(status_name or "new", status_map.get("new"))
 
# ── EXTRACT WITH PAGINATION ──────────────────────────────────────────────────
def extract_all(table_name):
    print(f"  extracting from {table_name}...")
    all_rows = []
    offset   = 0
    while True:
        res   = supabase.table(table_name).select("*").eq("company_id", COMPANY_ID).range(offset, offset + 999).execute()
        batch = res.data or []
        all_rows.extend(batch)
        if len(batch) < 1000:
            break
        offset += 1000
    print(f"  ✅ {len(all_rows)} rows extracted")
    return all_rows
 
# ── CALCULATE KPIs ───────────────────────────────────────────────────────────
def calculate_kpis(leads):
    kpis = {}
    score_ranges = {
        "converted":   (78, 98), "negotiation": (62, 82),
        "qualified":   (48, 68), "contacted":   (35, 54),
        "new":         (25, 50), "lost":        (10, 32),
    }
 
    for lead in leads:
        lead_id = lead.get("lead_id")
        if not lead_id:
            continue
 
        status       = (lead.get("status") or "new").lower().strip()
        is_converted = bool(lead.get("is_converted") or status == "converted")
        is_post      = get_is_post(lead.get("created_at", ""))
        is_b2b       = lead.get("lead_type") == "b2b"
        channel_name = CHANNEL_MAP.get((lead.get("source") or "organic").lower().strip(), "organic")
 
        # DETERMINISTIC CPL — Tunisian channel benchmarks + AI optimisation factor
        cost_per_lead = deterministic_cpl(lead_id, channel_name, is_post)
 
        # Revenue — from lynara_leads (set deterministically in generate_data.py)
        revenue = float(lead.get("revenue") or 0)
        if not is_converted:
            revenue = 0.0
 
        # ROI = (revenue - CPL) / CPL × 100
        roi = round((revenue - cost_per_lead) / cost_per_lead * 100, 2) if revenue > 0 and cost_per_lead > 0 else 0.0
 
        # LTV = revenue × 4.5
        # Source: 1.8 trips/year × 2.5 years customer lifespan (MENA tourism benchmark)
        customer_ltv = round(revenue * 4.5, 2) if revenue > 0 else 0.0
 
        # CAC = CPL × 1.6
        # Source: HubSpot formula — 60% overhead for sales agents, CRM, tooling
        cac = round(cost_per_lead * 1.6, 2) if is_converted else 0.0
 
        # Days to convert — deterministic via lead_id hash
        # B2B: 8-35 days | B2C: 1-12 days | After Lynara: 35% faster (AI follow-up)
        if is_converted:
            h    = det_hash(lead_id, "days")
            if is_b2b:
                base = 8 + (h % 28)   # 8-35 days
            else:
                base = 1 + (h % 12)   # 1-12 days
            days_to_convert = round(base * (0.65 if is_post else 1.0))
        else:
            days_to_convert = 0
 
        # Lead score — from lynara_leads (set deterministically in generate_data.py)
        lead_score = float(lead.get("score") or 0)
        if lead_score == 0:
            lo_s, hi_s = score_ranges.get(status, (30, 50))
            h = det_hash(lead_id, "score")
            lead_score = lo_s + (h % (hi_s - lo_s + 1))
 
        # AI confidence: 0 before Lynara (no AI existed), 68-96 after
        ai_confidence = lead.get("ai_confidence_score", 0)
        if ai_confidence is None:
            ai_confidence = 0
 
        kpis[lead_id] = {
            "is_converted":        is_converted,
            "revenue":             revenue,
            "cpl":                 cost_per_lead,
            "roi":                 roi,
            "ltv":                 customer_ltv,
            "cac":                 cac,
            "days_to_convert":     days_to_convert,
            "lead_score":          lead_score,
            "is_post":             is_post,
            "lead_type":           lead.get("lead_type", "b2c"),
            "campaign_name":       lead.get("campaign_name", ""),
            "score_reason":        lead.get("score_reason", "Standard qualification"),
            "b2b_company_size":    lead.get("b2b_company_size"),
            "b2b_industry":        lead.get("b2b_industry"),
            "last_activity_date":  lead.get("last_activity_date"),
            "human_escalated":     lead.get("human_escalated", False),
            "ai_confidence_score": ai_confidence,
            "status":              status,
            "lead_source_type":    lead.get("lead_source_type", "campaign"),
        }
    return kpis
 
# ── LOAD: FACT LEADS ─────────────────────────────────────────────────────────
def load_fact_leads(leads, kpis, time_map, channel_map, campaign_map, status_map):
    print("  loading dw_fact_leads...")
    rows = []
    for lead in leads:
        lead_id = lead.get("lead_id")
        if not lead_id:
            continue
        k = kpis.get(lead_id, {})
        rows.append({
            "company_id":          COMPANY_ID,
            "time_id":             get_time_id(time_map, lead.get("created_at")),
            "channel_id":          get_channel_id(channel_map, lead.get("source")),
            "campaign_id":         get_campaign_id(campaign_map, k.get("campaign_name")),
            "status_id":           get_status_id(status_map, k.get("status")),
            "source_lead_id":      str(lead_id),
            "lead_type":           k.get("lead_type", "b2c"),
            "lead_score":          k.get("lead_score", 40),
            "is_converted":        k.get("is_converted", False),
            "revenue":             k.get("revenue", 0),
            "cost_per_lead":       k.get("cpl", 0),
            "roi":                 k.get("roi", 0),
            "customer_ltv":        k.get("ltv", 0),
            "cac":                 k.get("cac", 0),
            "days_to_convert":     k.get("days_to_convert", 0),
            "is_post_lynara":      k.get("is_post", False),
            "score_reason":        k.get("score_reason"),
            "b2b_company_size":    k.get("b2b_company_size"),
            "b2b_industry":        k.get("b2b_industry"),
            "last_activity_date":  k.get("last_activity_date"),
            "human_escalated":     k.get("human_escalated", False),
            "ai_confidence_score": k.get("ai_confidence_score", 0),
            "created_at":          lead.get("created_at"),
            "lead_source_type":    k.get("lead_source_type", "campaign"),
        })
    loaded = 0
    for i in range(0, len(rows), 50):
        try:
            supabase.table("dw_fact_leads").upsert(rows[i:i+50], on_conflict="source_lead_id").execute()
            loaded += len(rows[i:i+50])
        except Exception as e:
            print(f"    warning batch {i}: {e}")
    print(f"  ✅ {loaded} dw_fact_leads rows loaded")
    return loaded
 
# ── BUILD UUID → fact_lead_id MAP ────────────────────────────────────────────
def get_lead_id_map():
    all_rows = []
    offset   = 0
    while True:
        res   = supabase.table("dw_fact_leads").select("fact_lead_id, source_lead_id").range(offset, offset + 999).execute()
        batch = res.data or []
        all_rows.extend(batch)
        if len(batch) < 1000:
            break
        offset += 1000
    return {r["source_lead_id"]: r["fact_lead_id"] for r in all_rows}
 
# ── LOAD: FACT EVENTS ────────────────────────────────────────────────────────
def load_fact_events(events, social, time_map, channel_map, campaign_map):
    print("  loading dw_fact_events...")
    rows        = []
    lead_id_map = get_lead_id_map()
 
    for event in events:
        dt_str  = event.get("event_ts") or event.get("created_at")
        is_post = get_is_post(dt_str)
        rows.append({
            "company_id":                  COMPANY_ID,
            "time_id":                     get_time_id(time_map, dt_str),
            "channel_id":                  get_channel_id(channel_map, event.get("channel")),
            "campaign_id":                 get_campaign_id(campaign_map, event.get("campaign_name")),
            "source_event_id":             str(event.get("event_id") or event.get("id", "")),
            "event_type":                  event.get("event_type", "unknown"),
            "intent":                      event.get("intent"),
            "sentiment":                   event.get("sentiment"),
            "reach":                       int(event.get("reach",    0) or 0),
            "likes":                       int(event.get("likes",    0) or 0),
            "comments":                    int(event.get("comments", 0) or 0),
            "shares":                      int(event.get("shares",   0) or 0),
            "clicks":                      int(event.get("clicks",   0) or 0),
            "conversions":                 int(event.get("conversions", 0) or 0),
            "is_post_lynara":              is_post,
            "event_date":                  dt_str[:10] if dt_str else None,
            "fact_lead_id":                None,
            "agent_name":                  event.get("agent_name"),
            "agent_response_time_seconds": event.get("agent_response_time_seconds"),
            "escalated_to_human":          event.get("escalated_to_human", False),
            "urgency_score":               event.get("urgency_score"),
        })
 
    for interaction in social:
        dt_str        = interaction.get("event_ts") or interaction.get("created_at")
        is_post       = get_is_post(dt_str)
        raw_lead_uuid = interaction.get("lead_id")
        rows.append({
            "company_id":                  COMPANY_ID,
            "time_id":                     get_time_id(time_map, dt_str),
            "channel_id":                  get_channel_id(channel_map, interaction.get("platform")),
            "campaign_id":                 get_campaign_id(campaign_map, interaction.get("campaign_name")),
            "source_event_id":             str(interaction.get("interaction_id") or ""),
            "event_type":                  "social_interaction",
            "intent":                      interaction.get("intent"),
            "sentiment":                   interaction.get("sentiment"),
            "reach":                       int(interaction.get("reach",    0) or 0),
            "likes":                       int(interaction.get("likes",    0) or 0),
            "comments":                    int(interaction.get("comments", 0) or 0),
            "shares":                      int(interaction.get("shares",   0) or 0),
            "clicks":                      0,
            "conversions":                 int(interaction.get("conversions", 0) or 0),
            "is_post_lynara":              is_post,
            "event_date":                  dt_str[:10] if dt_str else None,
            "fact_lead_id":                lead_id_map.get(raw_lead_uuid),
            "agent_name":                  interaction.get("agent_name"),
            "agent_response_time_seconds": interaction.get("agent_response_time_seconds"),
            "escalated_to_human":          interaction.get("escalated_to_human", False),
            "urgency_score":               interaction.get("urgency_score"),
        })
 
    loaded = 0
    for i in range(0, len(rows), 100):
        try:
            supabase.table("dw_fact_events").upsert(rows[i:i+100], on_conflict="source_event_id").execute()
            loaded += len(rows[i:i+100])
        except Exception as e:
            print(f"    warning batch {i}: {e}")
    print(f"  ✅ {loaded} dw_fact_events rows loaded")
    return loaded
 
# ── ETL LOG ──────────────────────────────────────────────────────────────────
def log_etl_run(status, leads_loaded, events_loaded, duration, error=None):
    try:
        supabase.table("dw_etl_log").insert({
            "status": status, "leads_loaded": leads_loaded,
            "events_loaded": events_loaded, "duration_sec": duration,
            "error_message": error,
        }).execute()
    except:
        pass
 
# ── MAIN ─────────────────────────────────────────────────────────────────────
def run_etl():
    start        = time.time()
    leads_loaded = events_loaded = 0
 
    print("=" * 62)
    print("🚀 ETL Pipeline — Lynara Campaign x Traveltodo")
    print("   All KPIs deterministic — no random values")
    print("=" * 62)
 
    try:
        print("\n[1/6] populating dw_dim_time...")
        populate_dim_time()
 
        print("\n[2/6] loading dimension IDs...")
        time_map, channel_map, campaign_map, status_map = get_dim_ids()
        print(f"  ✅ {len(time_map)} dates | {len(channel_map)} channels | "
              f"{len(campaign_map)} campaigns | {len(status_map)} statuses")
 
        print("\n[3/6] extracting raw data...")
        leads  = extract_all("lynara_leads")
        events = extract_all("lynara_events")
        social = extract_all("lynara_social")
 
        print("\n[4/6] calculating KPIs...")
        kpis = calculate_kpis(leads)
 
        before_leads = sum(1 for k in kpis.values() if not k["is_post"])
        after_leads  = sum(1 for k in kpis.values() if     k["is_post"])
        before_conv  = sum(1 for k in kpis.values() if not k["is_post"] and k["is_converted"])
        after_conv   = sum(1 for k in kpis.values() if     k["is_post"] and k["is_converted"])
        before_rev   = sum(k["revenue"] for k in kpis.values() if not k["is_post"])
        after_rev    = sum(k["revenue"] for k in kpis.values() if     k["is_post"])
        before_rate  = before_conv / before_leads * 100 if before_leads else 0
        after_rate   = after_conv  / after_leads  * 100 if after_leads  else 0
        before_cpl   = sum(k["cpl"] for k in kpis.values() if not k["is_post"]) / before_leads if before_leads else 0
        after_cpl    = sum(k["cpl"] for k in kpis.values() if     k["is_post"]) / after_leads  if after_leads  else 0
        social_leads = len([s for s in social if s.get("lead_id")])
        lead_growth  = round((after_leads / before_leads - 1) * 100) if before_leads else 0
        rev_growth   = round((after_rev   / before_rev   - 1) * 100) if before_rev   else 0
 
        status_before = {}
        status_after  = {}
        for k in kpis.values():
            st = k["status"]
            if k["is_post"]: status_after[st]  = status_after.get(st, 0)  + 1
            else:             status_before[st] = status_before.get(st, 0) + 1
 
        print(f"\n  📊 RESULTS — Traveltodo x Lynara")
        print(f"  {'─'*55}")
        print(f"  Before : {before_leads} leads | {before_rate:.1f}% conv | CPL {before_cpl:.0f} TND | Rev {before_rev:,.0f} TND")
        print(f"  After  : {after_leads} leads  | {after_rate:.1f}% conv  | CPL {after_cpl:.0f} TND  | Rev {after_rev:,.0f} TND")
        print(f"  Growth : +{lead_growth}% leads | +{rev_growth}% revenue | -{round((1-after_cpl/before_cpl)*100)}% CPL")
        print(f"  Social : {social_leads} interactions became leads")
        print(f"  {'─'*55}")
 
        print(f"\n  Status distribution After:")
        for st in ["new", "contacted", "qualified", "negotiation", "converted", "lost"]:
            print(f"    {st:12}: {status_after.get(st, 0)}")
 
        after_new      = status_after.get("new", 0)
        after_cont     = status_after.get("contacted", 0)
        after_nego     = status_after.get("negotiation", 0)
        after_conv_val = status_after.get("converted", 0)
        cum = [
            after_leads,
            after_leads - after_new,
            after_leads - after_new - after_cont,
            after_nego + after_conv_val,
            after_conv_val,
        ]
        labels = ["Nouveau", "Contacté", "Qualifié", "Négociation", "Converti"]
        print(f"\n  Cumulative funnel After:")
        ok = True
        for i, (l, v) in enumerate(zip(labels, cum)):
            check = "✅" if i == 0 or v <= cum[i-1] else "❌"
            if check == "❌": ok = False
            print(f"    {l:15}: {v} {check}")
        if ok:
            print(f"  ✅ Funnel strictly decreasing — coherent!")
        else:
            print(f"  ⚠️  Funnel issue — check status weights")
 
        print("\n[5/6] loading dw_fact_leads...")
        leads_loaded = load_fact_leads(leads, kpis, time_map, channel_map, campaign_map, status_map)
 
        print("\n[6/6] loading dw_fact_events...")
        events_loaded = load_fact_events(events, social, time_map, channel_map, campaign_map)
 
        duration = round(time.time() - start, 2)
        log_etl_run("success", leads_loaded, events_loaded, duration)
 
        print(f"\n{'='*62}")
        print(f"🎉 ETL complete in {duration}s")
        print(f"   leads loaded  : {leads_loaded}")
        print(f"   events loaded : {events_loaded}")
        print(f"\n▶️  Next: python scoring_model.py")
        print(f"{'='*62}")
 
    except Exception as e:
        duration = round(time.time() - start, 2)
        log_etl_run("error", leads_loaded, events_loaded, duration, str(e))
        print(f"\n❌ ETL failed: {e}")
        raise
 
if __name__ == "__main__":
    run_etl()
 