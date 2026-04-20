from fastapi import APIRouter, Query
from app.database import supabase
from datetime import datetime, timedelta, timezone

router = APIRouter()

@router.get("/executive")
async def get_executive_dashboard(company_id: str = Query(...)):
    try:
        leads_res = supabase.schema("crm").table("leads").select(
            "lead_id, status, estimated_value, conversion_value, acquisition_channel, source, created_at, first_touch_at"
        ).eq("company_id", company_id).execute()

        leads = leads_res.data or []

        total_leads = len(leads)
        converted = [l for l in leads if l.get("status") == "converted"]
        total_converted = len(converted)
        conversion_rate = round((total_converted / total_leads * 100), 1) if total_leads > 0 else 0

        total_revenue = sum(
            float(l.get("conversion_value") or l.get("estimated_value") or 0)
            for l in converted
        )
        avg_deal_value = round(total_revenue / total_converted, 0) if total_converted > 0 else 0
        cpl = round(total_revenue / total_leads * 0.05, 0) if total_leads > 0 else 0

        # Funnel
        status_counts = {}
        for l in leads:
            s = l.get("status", "new")
            status_counts[s] = status_counts.get(s, 0) + 1

        funnel = [
            {"stage": "Leads créés", "count": total_leads, "color": "#7C4DFF"},
            {"stage": "Contactés", "count": status_counts.get("contacted", 0) + status_counts.get("qualified", 0) + status_counts.get("negotiation", 0) + status_counts.get("converted", 0), "color": "#8B5FF7"},
            {"stage": "Qualifiés", "count": status_counts.get("qualified", 0) + status_counts.get("negotiation", 0) + status_counts.get("converted", 0), "color": "#A079FF"},
            {"stage": "Négociation", "count": status_counts.get("negotiation", 0) + status_counts.get("converted", 0), "color": "#B394FF"},
            {"stage": "Convertis", "count": total_converted, "color": "#6D3FEB"},
        ]

        # Channels
        channel_stats = {}
        for l in leads:
            ch = l.get("acquisition_channel") or l.get("source") or "unknown"
            if ch == "unknown":
                continue
            if ch not in channel_stats:
                channel_stats[ch] = {"leads": 0, "converted": 0, "revenue": 0}
            channel_stats[ch]["leads"] += 1
            if l.get("status") == "converted":
                channel_stats[ch]["converted"] += 1
                channel_stats[ch]["revenue"] += float(
                    l.get("conversion_value") or l.get("estimated_value") or 0
                )

        channel_colors = {
            "instagram": "#E1306C",
            "facebook": "#1877F2",
            "tiktok": "#000000",
            "whatsapp": "#25D366",
            "email": "#7C4DFF",
            "manual": "#9CA3AF",
        }

        channels = [
            {
                "channel": ch.capitalize(),
                "leads": stats["leads"],
                "converted": stats["converted"],
                "revenue": round(stats["revenue"], 0),
                "color": channel_colors.get(ch, "#7C4DFF"),
            }
            for ch, stats in channel_stats.items()
        ]
        channels.sort(key=lambda x: x["revenue"], reverse=True)

        # Weekly data
        now = datetime.now(timezone.utc)
        weekly = []
        for i in range(7, -1, -1):
            week_start = now - timedelta(weeks=i+1)
            week_end = now - timedelta(weeks=i)
            week_leads = []
            for l in leads:
                created = l.get("created_at", "") or l.get("first_touch_at", "")
                if created:
                    try:
                        if created.endswith("Z"):
                            created = created.replace("Z", "+00:00")
                        lead_date = datetime.fromisoformat(created)
                        if lead_date.tzinfo is None:
                            lead_date = lead_date.replace(tzinfo=timezone.utc)
                        if week_start <= lead_date <= week_end:
                            week_leads.append(l)
                    except:
                        pass
            weekly.append({
                "week": f"S{8-i}",
                "leads": len(week_leads),
                "converted": len([l for l in week_leads if l.get("status") == "converted"])
            })

        return {
            "success": True,
            "data": {
                "kpis": {
                    "total_leads": total_leads,
                    "converted": total_converted,
                    "conversion_rate": conversion_rate,
                    "total_revenue": round(total_revenue, 0),
                    "avg_deal_value": avg_deal_value,
                    "cpl": cpl,
                },
                "funnel": funnel,
                "channels": channels,
                "weekly": weekly,
            }
        }

    except Exception as e:
        print(f"Analytics error: {e}")
        return {"success": False, "error": str(e)}


@router.get("/social")
async def get_social_analytics(company_id: str = Query(...)):
    try:
        res = supabase.table("social_interactions").select("*").eq("company_id", company_id).execute()
        interactions = res.data or []

        platform_stats = {}
        for i in interactions:
            p = i.get("platform", "unknown")
            if p not in platform_stats:
                platform_stats[p] = {"total": 0, "positive": 0, "negative": 0, "intents": {}}
            platform_stats[p]["total"] += 1
            if i.get("sentiment") == "positive":
                platform_stats[p]["positive"] += 1
            elif i.get("sentiment") == "negative":
                platform_stats[p]["negative"] += 1
            intent = i.get("intent", "unknown")
            platform_stats[p]["intents"][intent] = platform_stats[p]["intents"].get(intent, 0) + 1

        intent_counts = {}
        for i in interactions:
            intent = i.get("intent", "unknown")
            intent_counts[intent] = intent_counts.get(intent, 0) + 1

        recent = sorted(interactions, key=lambda x: x.get("created_at", ""), reverse=True)[:20]

        return {
            "success": True,
            "data": {
                "total_interactions": len(interactions),
                "platform_stats": platform_stats,
                "intent_distribution": intent_counts,
                "recent": recent,
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/leads-intelligence")
async def get_leads_intelligence(company_id: str = Query(...)):
    try:
        scores_res = supabase.table("lead_scores").select("*").eq("company_id", company_id).execute()
        scores = scores_res.data or []

        distribution = {"0-25": 0, "26-50": 0, "51-75": 0, "76-100": 0}
        for s in scores:
            score = s.get("score", 0)
            if score <= 25:
                distribution["0-25"] += 1
            elif score <= 50:
                distribution["26-50"] += 1
            elif score <= 75:
                distribution["51-75"] += 1
            else:
                distribution["76-100"] += 1

        avg_score = round(sum(s.get("score", 0) for s in scores) / len(scores), 1) if scores else 0
        avg_conversion_prob = round(
            sum(float(s.get("predicted_conversion_probability") or 0) for s in scores) / len(scores) * 100, 1
        ) if scores else 0

        return {
            "success": True,
            "data": {
                "total_scored": len(scores),
                "avg_score": avg_score,
                "avg_conversion_probability": avg_conversion_prob,
                "distribution": distribution,
                "top_leads": sorted(scores, key=lambda x: x.get("score", 0), reverse=True)[:10],
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/campaigns")
async def get_campaigns_analytics(company_id: str = Query(...)):
    try:
        events_res = supabase.table("analytics_events").select("*").eq(
            "company_id", company_id
        ).eq("event_type", "post_published").execute()

        events = events_res.data or []

        campaign_stats = {}
        for e in events:
            props = e.get("properties", {})
            campaign = props.get("campaign", "Unknown")
            if campaign not in campaign_stats:
                campaign_stats[campaign] = {
                    "campaign": campaign,
                    "posts": 0,
                    "total_reach": 0,
                    "total_likes": 0,
                    "total_comments": 0,
                    "total_shares": 0,
                    "channel": e.get("channel", "unknown"),
                }
            campaign_stats[campaign]["posts"] += 1
            campaign_stats[campaign]["total_reach"] += props.get("reach", 0)
            campaign_stats[campaign]["total_likes"] += props.get("likes", 0)
            campaign_stats[campaign]["total_comments"] += props.get("comments", 0)
            campaign_stats[campaign]["total_shares"] += props.get("shares", 0)

        campaigns = list(campaign_stats.values())
        campaigns.sort(key=lambda x: x["total_reach"], reverse=True)

        return {
            "success": True,
            "data": {
                "total_campaigns": len(campaigns),
                "campaigns": campaigns,
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}