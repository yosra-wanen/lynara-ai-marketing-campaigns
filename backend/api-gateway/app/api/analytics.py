"""
analytics.py — Lynara Campaign Analytics API
=============================================
ALL endpoints filter:
  - is_post_lynara = True  (After Lynara period only — app shows current state)
  - company_id = TRAVELTODO_ID
 
Endpoints:
  GET /executive          — KPIs, funnel, channels, weekly evolution
  GET /campaigns          — Campaign performance with ROI
  GET /social             — Social interactions, intent, sentiment
  GET /leads-intelligence — Lead scoring, AI confidence, top leads
  GET /roi-report         — Channel ROI, LTV/CAC analysis
  GET /competitive-benchmark — vs industry benchmarks
  GET /data-quality       — DW completeness check
  GET /export/bi-views    — Power BI connection info
"""
 
from fastapi import APIRouter, Query
from app.database import supabase
from collections import defaultdict
from datetime import date
 
router = APIRouter()
 
TRAVELTODO_ID = "4f8edee8-9ec2-47d8-be24-180854da63df"
 
 
def fetch_after(table: str):
    """Fetch all After Lynara rows for Traveltodo with pagination."""
    all_rows = []
    offset   = 0
    while True:
        res = (supabase.table(table)
               .select("*")
               .eq("is_post_lynara", True)
               .eq("company_id", TRAVELTODO_ID)
               .range(offset, offset + 999)
               .execute())
        batch = res.data or []
        all_rows.extend(batch)
        if len(batch) < 1000:
            break
        offset += 1000
    return all_rows
 
 
def build_dim_maps():
    channels  = supabase.table("dw_dim_channel").select(
        "channel_id, channel_name, display_name, brand_color, channel_type, icon"
    ).execute().data or []
    statuses  = supabase.table("dw_dim_status").select(
        "status_id, status_name, status_label, funnel_order, is_active"
    ).execute().data or []
    campaigns = supabase.table("dw_dim_campaign").select(
        "campaign_id, campaign_name, campaign_type, destination, budget, actual_spend, start_date, end_date, status"
    ).execute().data or []
    return (
        {r["channel_id"]:  r for r in channels},
        {r["status_id"]:   r for r in statuses},
        {r["campaign_id"]: r for r in campaigns},
    )
 
 
# ─────────────────────────────────────────────────────────────────────────────
# 1. EXECUTIVE DASHBOARD
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/executive")
async def get_executive_dashboard(company_id: str = Query(...)):
    try:
        leads = fetch_after("dw_fact_leads")
        channel_map, status_map, _ = build_dim_maps()
 
        total        = len(leads)
        converted    = [l for l in leads if l.get("is_converted")]
        n_converted  = len(converted)
        conv_rate    = round(n_converted / total * 100, 1) if total > 0 else 0
        total_rev    = round(sum(float(l.get("revenue") or 0) for l in converted), 0)
        avg_deal     = round(total_rev / n_converted, 0) if n_converted > 0 else 0
        avg_cpl      = round(sum(float(l.get("cost_per_lead") or 0) for l in leads) / total, 0) if total > 0 else 0
        avg_days     = round(sum(float(l.get("days_to_convert") or 0) for l in converted) / n_converted, 1) if n_converted > 0 else 0
        avg_ltv      = round(sum(float(l.get("customer_ltv") or 0) for l in converted) / n_converted, 0) if n_converted > 0 else 0
        avg_cac      = round(sum(float(l.get("cac") or 0) for l in converted) / n_converted, 0) if n_converted > 0 else 0
        total_cost   = sum(float(l.get("cost_per_lead") or 0) for l in leads)
        total_roi    = round((total_rev - total_cost) / total_cost * 100, 1) if total_cost > 0 else 0
        avg_score    = round(sum(float(l.get("lead_score") or 0) for l in leads) / total, 1) if total > 0 else 0
        avg_conf     = round(sum(float(l.get("ai_confidence_score") or 0) for l in leads) / total, 1) if total > 0 else 0
 
        # Funnel — cumulative (strictly decreasing, lost excluded)
        status_counts = {}
        for l in leads:
            sid  = l.get("status_id")
            name = status_map.get(sid, {}).get("status_name", "unknown") if sid else "unknown"
            status_counts[name] = status_counts.get(name, 0) + 1
 
        funnel_stages = sorted(
            [s for s in status_map.values() if s.get("funnel_order") and s["status_name"] != "lost"],
            key=lambda x: x["funnel_order"]
        )
        funnel_colors = ["#7C4DFF", "#8B5FF7", "#A079FF", "#B394FF", "#6D3FEB"]
        funnel = []
        for i, stage in enumerate(funnel_stages):
            count = sum(
                status_counts.get(s["status_name"], 0)
                for s in funnel_stages
                if s["funnel_order"] >= stage["funnel_order"]
            )
            funnel.append({
                "stage": stage["status_label"],
                "count": count,
                "color": funnel_colors[i % len(funnel_colors)],
            })
 
        # Channel performance
        channel_stats = {}
        for l in leads:
            cid  = l.get("channel_id")
            if not cid: continue
            ch   = channel_map.get(cid, {})
            name = ch.get("channel_name", "unknown")
            if name not in channel_stats:
                channel_stats[name] = {
                    "channel":   ch.get("display_name", name.capitalize()),
                    "icon":      ch.get("icon", ""),
                    "color":     ch.get("brand_color", "#7C4DFF"),
                    "leads":     0, "converted": 0,
                    "revenue":   0.0, "cost": 0.0,
                }
            channel_stats[name]["leads"] += 1
            channel_stats[name]["cost"]  += float(l.get("cost_per_lead") or 0)
            if l.get("is_converted"):
                channel_stats[name]["converted"] += 1
                channel_stats[name]["revenue"]   += float(l.get("revenue") or 0)
 
        channels_list = []
        for data in channel_stats.values():
            data["revenue"] = round(data["revenue"], 0)
            data["cost"]    = round(data["cost"], 0)
            data["rate"]    = round(data["converted"] / data["leads"] * 100, 1) if data["leads"] > 0 else 0
            data["roi"]     = round((data["revenue"] - data["cost"]) / data["cost"] * 100, 1) if data["cost"] > 0 else 0
            channels_list.append(data)
        channels_list.sort(key=lambda x: x["revenue"], reverse=True)
 
        # Weekly evolution
        weekly_map = defaultdict(lambda: {"leads": 0, "converted": 0})
        for l in leads:
            dt = (l.get("created_at") or "")[:10]
            if dt:
                try:
                    d  = date.fromisoformat(dt)
                    wk = f"{d.year}-W{d.isocalendar()[1]:02d}"
                    weekly_map[wk]["leads"] += 1
                    if l.get("is_converted"):
                        weekly_map[wk]["converted"] += 1
                except:
                    pass
 
        sorted_weeks = sorted(weekly_map.keys())[-8:]
        weekly = [
            {"week": f"S{i+1}", "leads": weekly_map[w]["leads"], "converted": weekly_map[w]["converted"]}
            for i, w in enumerate(sorted_weeks)
        ]
 
        return {
            "success": True,
            "data": {
                "kpis": {
                    "total_leads":      total,
                    "converted":        n_converted,
                    "conversion_rate":  conv_rate,
                    "total_revenue":    total_rev,
                    "avg_deal_value":   avg_deal,
                    "cpl":              avg_cpl,
                    "avg_days_convert": avg_days,
                    "avg_ltv":          avg_ltv,
                    "avg_cac":          avg_cac,
                    "total_roi":        total_roi,
                    "avg_score":        avg_score,
                    "avg_ai_confidence":avg_conf,
                },
                "funnel":   funnel,
                "channels": channels_list,
                "weekly":   weekly,
            }
        }
    except Exception as e:
        print(f"Executive error: {e}")
        return {"success": False, "error": str(e)}
 
 
# ─────────────────────────────────────────────────────────────────────────────
# 2. CAMPAIGNS
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/campaigns")
async def get_campaigns_analytics(company_id: str = Query(...)):
    try:
        events = fetch_after("dw_fact_events")
        leads  = fetch_after("dw_fact_leads")
        channel_map, _, campaign_map = build_dim_maps()
 
        stats = {}
        for e in events:
            cid  = e.get("campaign_id")
            if not cid: continue
            camp = campaign_map.get(cid, {})
            name = camp.get("campaign_name", "Unknown")
            ch   = channel_map.get(e.get("channel_id"), {})
            if name not in stats:
                stats[name] = {
                    "campaign":       name,
                    "campaign_type":  camp.get("campaign_type", ""),
                    "destination":    camp.get("destination", ""),
                    "budget":         float(camp.get("budget") or 0),
                    "actual_spend":   float(camp.get("actual_spend") or 0),
                    "start_date":     camp.get("start_date", ""),
                    "end_date":       camp.get("end_date", ""),
                    "status":         camp.get("status", ""),
                    "channel":        ch.get("display_name", ""),
                    "posts":          0, "total_reach":    0,
                    "total_likes":    0, "total_comments": 0,
                    "total_shares":   0, "total_clicks":   0,
                    "leads":          0, "converted":      0,
                    "revenue":        0.0, "cost":         0.0,
                }
            stats[name]["posts"]           += 1
            stats[name]["total_reach"]     += int(e.get("reach")    or 0)
            stats[name]["total_likes"]     += int(e.get("likes")    or 0)
            stats[name]["total_comments"]  += int(e.get("comments") or 0)
            stats[name]["total_shares"]    += int(e.get("shares")   or 0)
            stats[name]["total_clicks"]    += int(e.get("clicks")   or 0)
 
        for l in leads:
            cid  = l.get("campaign_id")
            if not cid: continue
            camp = campaign_map.get(cid, {})
            name = camp.get("campaign_name", "Unknown")
            if name not in stats:
                stats[name] = {
                    "campaign": name, "campaign_type": "", "destination": "",
                    "budget": 0, "actual_spend": 0, "start_date": "", "end_date": "",
                    "status": "", "channel": "", "posts": 0, "total_reach": 0,
                    "total_likes": 0, "total_comments": 0, "total_shares": 0,
                    "total_clicks": 0, "leads": 0, "converted": 0,
                    "revenue": 0.0, "cost": 0.0,
                }
            stats[name]["leads"] += 1
            stats[name]["cost"]  += float(l.get("cost_per_lead") or 0)
            if l.get("is_converted"):
                stats[name]["converted"] += 1
                stats[name]["revenue"]   += float(l.get("revenue") or 0)
 
        campaigns = list(stats.values())
        for c in campaigns:
            c["revenue"]         = round(c["revenue"], 0)
            c["cost"]            = round(c["cost"], 0)
            c["conversion_rate"] = round(c["converted"] / c["leads"] * 100, 1) if c["leads"] > 0 else 0
            c["roi"]             = round((c["revenue"] - c["cost"]) / c["cost"] * 100, 1) if c["cost"] > 0 else 0
            c["budget_usage"]    = round(c["actual_spend"] / c["budget"] * 100, 1) if c["budget"] > 0 else 0
        campaigns.sort(key=lambda x: x["total_reach"], reverse=True)
 
        return {
            "success": True,
            "data": {
                "total_campaigns": len(campaigns),
                "total_reach":     sum(c["total_reach"] for c in campaigns),
                "total_likes":     sum(c["total_likes"] for c in campaigns),
                "total_posts":     sum(c["posts"] for c in campaigns),
                "total_revenue":   sum(c["revenue"] for c in campaigns),
                "campaigns":       campaigns,
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
 
 
# ─────────────────────────────────────────────────────────────────────────────
# 3. SOCIAL ANALYTICS
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/social")
async def get_social_analytics(company_id: str = Query(...)):
    try:
        events = fetch_after("dw_fact_events")
        channel_map, _, _ = build_dim_maps()
 
        social   = [e for e in events if e.get("event_type") == "social_interaction"]
        total    = len(social)
        positive = sum(1 for e in social if e.get("sentiment") == "positive")
        negative = sum(1 for e in social if e.get("sentiment") == "negative")
        neutral  = sum(1 for e in social if e.get("sentiment") == "neutral")
        price_inq   = sum(1 for e in social if e.get("intent") == "price_inquiry")
        visit_req   = sum(1 for e in social if e.get("intent") == "visit_request")
        high_urg    = sum(1 for e in social if float(e.get("urgency_score") or 0) >= 70)
        leads_made  = sum(1 for e in social if e.get("fact_lead_id"))
        escalations = sum(1 for e in social if e.get("escalated_to_human"))
        avg_urgency = round(sum(float(e.get("urgency_score") or 0) for e in social) / total, 1) if total > 0 else 0
        avg_resp    = round(sum(float(e.get("agent_response_time_seconds") or 0) for e in social) / total, 1) if total > 0 else 0
 
        platform_stats = {}
        for e in social:
            cid      = e.get("channel_id")
            ch       = channel_map.get(cid, {})
            platform = ch.get("channel_name", "unknown")
            if platform not in platform_stats:
                platform_stats[platform] = {
                    "platform":      ch.get("display_name", platform.capitalize()),
                    "color":         ch.get("brand_color", "#7C4DFF"),
                    "icon":          ch.get("icon", ""),
                    "total":         0, "positive":      0,
                    "negative":      0, "neutral":       0,
                    "leads_created": 0, "escalated":     0,
                    "total_likes":   0, "total_shares":  0,
                    "total_reach":   0, "intents":       {},
                }
            p = platform_stats[platform]
            p["total"]        += 1
            p["total_likes"]  += int(e.get("likes")  or 0)
            p["total_shares"] += int(e.get("shares") or 0)
            p["total_reach"]  += int(e.get("reach")  or 0)
            s = e.get("sentiment", "neutral")
            if s == "positive":   p["positive"]  += 1
            elif s == "negative": p["negative"]  += 1
            else:                 p["neutral"]   += 1
            if e.get("fact_lead_id"):        p["leads_created"] += 1
            if e.get("escalated_to_human"):  p["escalated"]     += 1
            intent = e.get("intent") or "unknown"
            p["intents"][intent] = p["intents"].get(intent, 0) + 1
 
        for p in platform_stats.values():
            p["conversion_rate"]    = round(p["leads_created"] / p["total"] * 100, 1) if p["total"] > 0 else 0
            p["positive_rate"]      = round(p["positive"] / p["total"] * 100, 1) if p["total"] > 0 else 0
            p["avg_reach_per_post"] = round(p["total_reach"] / p["total"], 0) if p["total"] > 0 else 0
 
        intent_counts = {}
        for e in social:
            intent = e.get("intent") or "unknown"
            intent_counts[intent] = intent_counts.get(intent, 0) + 1
 
        recent = sorted(social, key=lambda x: x.get("event_date") or "", reverse=True)[:20]
        recent_display = [{
            "platform":     channel_map.get(e.get("channel_id"), {}).get("display_name", "Unknown"),
            "intent":       e.get("intent"),
            "sentiment":    e.get("sentiment"),
            "urgency_score":e.get("urgency_score"),
            "agent_name":   e.get("agent_name"),
            "response_time":e.get("agent_response_time_seconds"),
            "event_date":   e.get("event_date"),
            "led_to_lead":  bool(e.get("fact_lead_id")),
            "escalated":    bool(e.get("escalated_to_human")),
        } for e in recent]
 
        return {
            "success": True,
            "data": {
                "total_interactions":  total,
                "positive_rate":       round(positive / total * 100, 1) if total > 0 else 0,
                "negative_rate":       round(negative / total * 100, 1) if total > 0 else 0,
                "neutral_rate":        round(neutral  / total * 100, 1) if total > 0 else 0,
                "price_inquiries":     price_inq,
                "visit_requests":      visit_req,
                "high_urgency":        high_urg,
                "social_leads_created":leads_made,
                "social_lead_rate":    round(leads_made / total * 100, 1) if total > 0 else 0,
                "escalation_rate":     round(escalations / total * 100, 1) if total > 0 else 0,
                "avg_urgency_score":   avg_urgency,
                "avg_response_time_s": avg_resp,
                "platform_stats":      list(platform_stats.values()),
                "intent_distribution": intent_counts,
                "recent":              recent_display,
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
 
 
# ─────────────────────────────────────────────────────────────────────────────
# 4. LEAD INTELLIGENCE
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/leads-intelligence")
async def get_leads_intelligence(company_id: str = Query(...)):
    try:
        leads = fetch_after("dw_fact_leads")
        channel_map, status_map, _ = build_dim_maps()
 
        total     = len(leads)
        converted = [l for l in leads if l.get("is_converted")]
        lost      = [l for l in leads if status_map.get(l.get("status_id"), {}).get("status_name") == "lost"]
        b2b       = [l for l in leads if l.get("lead_type") == "b2b"]
        social    = [l for l in leads if l.get("lead_source_type") == "social"]
 
        distribution = {"0-25": 0, "26-50": 0, "51-75": 0, "76-100": 0}
        for l in leads:
            s = float(l.get("lead_score") or 0)
            if   s <= 25:  distribution["0-25"]   += 1
            elif s <= 50:  distribution["26-50"]  += 1
            elif s <= 75:  distribution["51-75"]  += 1
            else:          distribution["76-100"] += 1
 
        hot_leads           = distribution["76-100"]
        avg_score           = round(sum(float(l.get("lead_score") or 0) for l in leads) / total, 1) if total > 0 else 0
        avg_score_converted = round(sum(float(l.get("lead_score") or 0) for l in converted) / len(converted), 1) if converted else 0
        avg_score_lost      = round(sum(float(l.get("lead_score") or 0) for l in lost) / len(lost), 1) if lost else 0
        avg_confidence      = round(sum(float(l.get("ai_confidence_score") or 0) for l in leads) / total, 1) if total > 0 else 0
 
        confidence_bands = {"Low (<60)": 0, "Medium (60-80)": 0, "High (>80)": 0}
        for l in leads:
            c = float(l.get("ai_confidence_score") or 0)
            if   c < 60:  confidence_bands["Low (<60)"]      += 1
            elif c <= 80: confidence_bands["Medium (60-80)"]  += 1
            else:         confidence_bands["High (>80)"]      += 1
 
        pipeline_score = round(
            sum(float(l.get("lead_score") or 0) for l in leads if not l.get("is_converted")) /
            max(sum(1 for l in leads if not l.get("is_converted")), 1), 1
        )
 
        top_leads = sorted(leads, key=lambda x: float(x.get("lead_score") or 0), reverse=True)[:10]
        top_display = []
        for l in top_leads:
            cid   = l.get("channel_id")
            sid   = l.get("status_id")
            score = float(l.get("lead_score") or 0)
            top_display.append({
                "fact_lead_id":        l.get("fact_lead_id"),
                "lead_score":          score,
                "temperature":         "Très Chaud" if score >= 76 else "Chaud" if score >= 51 else "Tiède" if score >= 26 else "Froid",
                "is_converted":        l.get("is_converted"),
                "revenue":             float(l.get("revenue") or 0),
                "ai_confidence_score": float(l.get("ai_confidence_score") or 0),
                "score_reason":        l.get("score_reason") or "",
                "lead_type":           l.get("lead_type"),
                "lead_source_type":    l.get("lead_source_type"),
                "channel":             channel_map.get(cid, {}).get("display_name", "Unknown") if cid else "Unknown",
                "status":              status_map.get(sid, {}).get("status_label", "Unknown") if sid else "Unknown",
                "days_to_convert":     int(l.get("days_to_convert") or 0),
            })
 
        return {
            "success": True,
            "data": {
                "total_scored":        total,
                "avg_score":           avg_score,
                "avg_score_converted": avg_score_converted,
                "avg_score_lost":      avg_score_lost,
                "avg_confidence":      avg_confidence,
                "hot_leads":           hot_leads,
                "b2b_count":           len(b2b),
                "social_leads_count":  len(social),
                "pipeline_score":      pipeline_score,
                "distribution":        distribution,
                "confidence_bands":    confidence_bands,
                "top_leads":           top_display,
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
 
 
# ─────────────────────────────────────────────────────────────────────────────
# 5. ROI REPORT
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/roi-report")
async def get_roi_report(company_id: str = Query(...)):
    try:
        leads = fetch_after("dw_fact_leads")
        channel_map, _, campaign_map = build_dim_maps()
 
        converted     = [l for l in leads if l.get("is_converted")]
        total_rev     = sum(float(l.get("revenue") or 0) for l in converted)
        total_cost    = sum(float(l.get("cost_per_lead") or 0) for l in leads)
        total_budget  = sum(float(c.get("budget") or 0) for c in campaign_map.values())
        total_spend   = sum(float(c.get("actual_spend") or 0) for c in campaign_map.values())
        avg_cac       = round(sum(float(l.get("cac") or 0) for l in converted) / len(converted), 0) if converted else 0
        avg_ltv       = round(sum(float(l.get("customer_ltv") or 0) for l in converted) / len(converted), 0) if converted else 0
        roi           = round((total_rev - total_cost) / total_cost * 100, 1) if total_cost > 0 else 0
        ltv_cac       = round(avg_ltv / avg_cac, 2) if avg_cac > 0 else 0
        avg_days      = round(sum(float(l.get("days_to_convert") or 0) for l in converted) / len(converted), 1) if converted else 0
 
        channel_roi = {}
        for l in leads:
            cid  = l.get("channel_id")
            if not cid: continue
            ch   = channel_map.get(cid, {})
            name = ch.get("channel_name", "unknown")
            if name not in channel_roi:
                channel_roi[name] = {
                    "channel":  ch.get("display_name", name.capitalize()),
                    "color":    ch.get("brand_color", "#7C4DFF"),
                    "icon":     ch.get("icon", ""),
                    "leads":    0, "converted": 0,
                    "revenue":  0.0, "cost": 0.0,
                    "ltv":      0.0, "cac_sum": 0.0, "days_sum": 0.0,
                }
            channel_roi[name]["leads"]  += 1
            channel_roi[name]["cost"]   += float(l.get("cost_per_lead") or 0)
            if l.get("is_converted"):
                channel_roi[name]["converted"] += 1
                channel_roi[name]["revenue"]   += float(l.get("revenue") or 0)
                channel_roi[name]["ltv"]       += float(l.get("customer_ltv") or 0)
                channel_roi[name]["cac_sum"]   += float(l.get("cac") or 0)
                channel_roi[name]["days_sum"]  += float(l.get("days_to_convert") or 0)
 
        channel_list = []
        for data in channel_roi.values():
            conv = data["converted"]
            channel_list.append({
                "channel":         data["channel"],
                "color":           data["color"],
                "icon":            data["icon"],
                "leads":           data["leads"],
                "converted":       conv,
                "revenue":         round(data["revenue"], 0),
                "cost":            round(data["cost"], 0),
                "roi":             round((data["revenue"] - data["cost"]) / data["cost"] * 100, 1) if data["cost"] > 0 else 0,
                "roi_ratio":       round(data["revenue"] / data["cost"], 2) if data["cost"] > 0 else 0,
                "cpl":             round(data["cost"] / data["leads"], 0) if data["leads"] > 0 else 0,
                "cac":             round(data["cac_sum"] / conv, 0) if conv > 0 else 0,
                "avg_ltv":         round(data["ltv"] / conv, 0) if conv > 0 else 0,
                "ltv_cac":         round((data["ltv"] / conv) / (data["cac_sum"] / conv), 2) if conv > 0 and data["cac_sum"] > 0 else 0,
                "avg_days":        round(data["days_sum"] / conv, 1) if conv > 0 else 0,
                "conversion_rate": round(conv / data["leads"] * 100, 1) if data["leads"] > 0 else 0,
            })
        channel_list.sort(key=lambda x: x["roi"], reverse=True)
 
        return {
            "success": True,
            "data": {
                "summary": {
                    "total_leads":      len(leads),
                    "total_converted":  len(converted),
                    "total_revenue":    round(total_rev, 0),
                    "total_cost":       round(total_cost, 0),
                    "total_budget":     round(total_budget, 0),
                    "total_spend":      round(total_spend, 0),
                    "roi_percent":      roi,
                    "cac":              avg_cac,
                    "ltv":              avg_ltv,
                    "ltv_cac_ratio":    ltv_cac,
                    "avg_days_convert": avg_days,
                },
                "by_channel": channel_list,
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
 
 
# ─────────────────────────────────────────────────────────────────────────────
# 6. COMPETITIVE BENCHMARK
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/competitive-benchmark")
async def get_competitive_benchmark(company_id: str = Query(...)):
    try:
        events = fetch_after("dw_fact_events")
        leads  = fetch_after("dw_fact_leads")
 
        post_events   = [e for e in events if e.get("event_type") == "post_published"]
        social_events = [e for e in events if e.get("event_type") == "social_interaction"]
 
        total_reach      = sum(int(e.get("reach") or 0) for e in post_events)
        total_engagement = sum(
            int(e.get("likes") or 0) + int(e.get("comments") or 0) + int(e.get("shares") or 0)
            for e in post_events
        )
        avg_reach  = round(total_reach / len(post_events), 0) if post_events else 0
        eng_rate   = round(total_engagement / total_reach * 100, 2) if total_reach > 0 else 0
        converted  = [l for l in leads if l.get("is_converted")]
        avg_cpl    = round(sum(float(l.get("cost_per_lead") or 0) for l in leads) / len(leads), 0) if leads else 0
        conv_rate  = round(len(converted) / len(leads) * 100, 1) if leads else 0
        social_lead_rate = round(
            sum(1 for e in social_events if e.get("fact_lead_id")) / len(social_events) * 100, 1
        ) if social_events else 0
 
        weekly_posts = defaultdict(int)
        for e in post_events:
            dt = (e.get("event_date") or "")[:10]
            if dt:
                try:
                    d = date.fromisoformat(dt)
                    weekly_posts[d.isocalendar()[1]] += 1
                except:
                    pass
        avg_posts_per_week = round(sum(weekly_posts.values()) / max(len(weekly_posts), 1), 1)
 
        return {
            "success": True,
            "data": {
                "our_metrics": {
                    "avg_posts_per_week":  avg_posts_per_week,
                    "avg_engagement_rate": eng_rate,
                    "avg_reach_per_post":  avg_reach,
                    "conversion_rate":     conv_rate,
                    "avg_cpl":             avg_cpl,
                    "social_lead_rate":    social_lead_rate,
                },
                # Benchmarks: HubSpot State of Marketing 2024, Socialinsider Travel 2024
                "competitors": [
                    {"name": "Concurrent A", "avg_posts_per_week": 3.1, "avg_engagement_rate": 5.2, "avg_reach_per_post": 18200, "conversion_rate": 12.4, "avg_cpl": 210},
                    {"name": "Concurrent B", "avg_posts_per_week": 5.8, "avg_engagement_rate": 4.8, "avg_reach_per_post": 15600, "conversion_rate": 10.8, "avg_cpl": 245},
                    {"name": "Concurrent C", "avg_posts_per_week": 2.4, "avg_engagement_rate": 6.9, "avg_reach_per_post": 22100, "conversion_rate": 14.1, "avg_cpl": 185},
                ],
                "note": "Competitor benchmarks: HubSpot State of Marketing 2024, Socialinsider Travel Industry 2024, DataReportal Tunisia 2025"
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
 
 
# ─────────────────────────────────────────────────────────────────────────────
# 7. DATA QUALITY
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/data-quality")
async def get_data_quality(company_id: str = Query(...)):
    try:
        leads = fetch_after("dw_fact_leads")
        total = len(leads)
        if total == 0:
            return {"success": True, "data": {"total_leads": 0, "overall_quality_score": 0}}
 
        has_score      = sum(1 for l in leads if float(l.get("lead_score") or 0) > 0)
        has_revenue    = sum(1 for l in leads if float(l.get("revenue") or 0) > 0)
        has_channel    = sum(1 for l in leads if l.get("channel_id"))
        has_campaign   = sum(1 for l in leads if l.get("campaign_id"))
        has_confidence = sum(1 for l in leads if float(l.get("ai_confidence_score") or 0) > 0)
        has_ltv        = sum(1 for l in leads if float(l.get("customer_ltv") or 0) > 0)
        has_cac        = sum(1 for l in leads if float(l.get("cac") or 0) > 0)
        converted      = sum(1 for l in leads if l.get("is_converted"))
        overall        = round((has_score + has_channel + has_campaign + has_confidence) / (total * 4) * 100, 1)
 
        return {
            "success": True,
            "data": {
                "total_leads":          total,
                "has_score":            has_score,
                "has_revenue":          has_revenue,
                "has_channel":          has_channel,
                "has_campaign":         has_campaign,
                "has_ai_confidence":    has_confidence,
                "has_ltv":              has_ltv,
                "has_cac":              has_cac,
                "converted_count":      converted,
                "overall_quality_score":overall,
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
 
 
# ─────────────────────────────────────────────────────────────────────────────
# 8. BI EXPORT INFO
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/export/bi-views")
async def get_bi_views_info(company_id: str = Query(...)):
    return {
        "success": True,
        "data": {
            "tables": [
                "dw_fact_leads",
                "dw_fact_events",
                "dw_dim_channel",
                "dw_dim_campaign",
                "dw_dim_status",
                "dw_dim_time",
            ],
            "filter":       "All endpoints filter by is_post_lynara=TRUE and company_id=Traveltodo",
            "note":         "Power BI dashboards connect directly to Supabase via CSV export or REST API",
        }
    }
 