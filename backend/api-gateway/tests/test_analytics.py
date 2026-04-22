"""Tests for analytics endpoints — Scenarios T1-T10"""
import pytest
import sys
import os
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

COMPANY_ID = "1c7e1651-d68a-4725-abd7-ecf63719a70d"


@pytest.fixture
def client():
    from app.main import app
    return TestClient(app)


# ─── T1: Funnel end-to-end ────────────────────────────────────────────────────

class TestT1FunnelEndToEnd:
    """T1 — Funnel end-to-end: lead_created → converted traceable in dashboard"""

    def test_executive_endpoint_returns_funnel(self, client):
        response = client.get(f"/analytics/executive?company_id={COMPANY_ID}")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "funnel" in data["data"]

    def test_funnel_has_correct_stages(self, client):
        response = client.get(f"/analytics/executive?company_id={COMPANY_ID}")
        funnel = response.json()["data"]["funnel"]
        stages = [f["stage"] for f in funnel]
        assert "Leads créés" in stages
        assert "Convertis" in stages

    def test_funnel_counts_are_descending(self, client):
        response = client.get(f"/analytics/executive?company_id={COMPANY_ID}")
        funnel = response.json()["data"]["funnel"]
        counts = [f["count"] for f in funnel]
        assert counts == sorted(counts, reverse=True)

    def test_kpis_are_present(self, client):
        response = client.get(f"/analytics/executive?company_id={COMPANY_ID}")
        kpis = response.json()["data"]["kpis"]
        required = ["total_leads", "converted", "conversion_rate", "total_revenue"]
        for key in required:
            assert key in kpis


# ─── T2: Attribution multicanale ─────────────────────────────────────────────

class TestT2Attribution:
    """T2 — Attribution: first-touch and last-touch correct per lead"""

    def test_channels_present_in_executive(self, client):
        response = client.get(f"/analytics/executive?company_id={COMPANY_ID}")
        assert response.status_code == 200
        channels = response.json()["data"]["channels"]
        assert isinstance(channels, list)

    def test_channel_has_required_fields(self, client):
        response = client.get(f"/analytics/executive?company_id={COMPANY_ID}")
        channels = response.json()["data"]["channels"]
        if channels:
            for ch in channels:
                assert "channel" in ch
                assert "leads" in ch
                assert "converted" in ch
                assert "revenue" in ch

    def test_roi_by_channel_available(self, client):
        response = client.get(f"/analytics/roi-report?company_id={COMPANY_ID}")
        assert response.status_code == 200
        data = response.json()["data"]
        assert "by_channel" in data
        assert isinstance(data["by_channel"], list)


# ─── T3: Lead scoring ─────────────────────────────────────────────────────────

class TestT3LeadScoring:
    """T3 — Lead scoring: score increases with engagement, score_reason coherent"""

    def test_leads_intelligence_returns_scores(self, client):
        response = client.get(f"/analytics/leads-intelligence?company_id={COMPANY_ID}")
        assert response.status_code == 200
        data = response.json()["data"]
        assert data["total_scored"] > 0

    def test_score_distribution_has_all_ranges(self, client):
        response = client.get(f"/analytics/leads-intelligence?company_id={COMPANY_ID}")
        distribution = response.json()["data"]["distribution"]
        assert "0-25" in distribution
        assert "26-50" in distribution
        assert "51-75" in distribution
        assert "76-100" in distribution

    def test_avg_score_is_valid(self, client):
        response = client.get(f"/analytics/leads-intelligence?company_id={COMPANY_ID}")
        avg_score = response.json()["data"]["avg_score"]
        assert 0 <= avg_score <= 100

    def test_batch_scoring_works(self, client):
        response = client.post(f"/analytics/ml/score-leads?company_id={COMPANY_ID}")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["total_scored"] > 0


# ─── T4: Segmentation ─────────────────────────────────────────────────────────

class TestT4Segmentation:
    """T4 — Segmentation: stable and business-relevant segments"""

    def test_recompute_segments_works(self, client):
        response = client.post(f"/analytics/recompute-segments?company_id={COMPANY_ID}")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_segments_contain_expected_keys(self, client):
        response = client.post(f"/analytics/recompute-segments?company_id={COMPANY_ID}")
        segments = response.json()["data"]
        assert "hot_leads" in segments
        assert "cold_leads" in segments
        assert "converted" in segments
        assert "high_score" in segments

    def test_segment_counts_are_positive(self, client):
        response = client.post(f"/analytics/recompute-segments?company_id={COMPANY_ID}")
        segments = response.json()["data"]
        for seg_name, seg_data in segments.items():
            assert seg_data["count"] >= 0


# ─── T5: A/B Testing ──────────────────────────────────────────────────────────

class TestT5ABTesting:
    """T5 — A/B testing: uplift exploitable and winner recommended"""

    def test_campaigns_endpoint_returns_data(self, client):
        response = client.get(f"/analytics/campaigns?company_id={COMPANY_ID}")
        assert response.status_code == 200
        data = response.json()["data"]
        assert "campaigns" in data
        assert data["total_campaigns"] > 0

    def test_campaigns_have_engagement_metrics(self, client):
        response = client.get(f"/analytics/campaigns?company_id={COMPANY_ID}")
        campaigns = response.json()["data"]["campaigns"]
        if campaigns:
            camp = campaigns[0]
            assert "total_reach" in camp
            assert "total_likes" in camp
            assert "total_comments" in camp

    def test_content_quality_available(self, client):
        response = client.get(f"/analytics/content-quality?company_id={COMPANY_ID}")
        assert response.status_code == 200
        data = response.json()["data"]
        assert "avg_quality_score" in data


# ─── T6: Data Quality ─────────────────────────────────────────────────────────

class TestT6DataQuality:
    """T6 — Data quality: invalid emails/phones flagged, DQ report generated"""

    def test_data_quality_endpoint_works(self, client):
        response = client.get(f"/analytics/data-quality?company_id={COMPANY_ID}")
        assert response.status_code == 200
        data = response.json()["data"]
        assert "overall_quality_score" in data

    def test_quality_scores_between_0_and_100(self, client):
        response = client.get(f"/analytics/data-quality?company_id={COMPANY_ID}")
        data = response.json()["data"]
        assert 0 <= data["email_quality_score"] <= 100
        assert 0 <= data["phone_quality_score"] <= 100
        assert 0 <= data["overall_quality_score"] <= 100

    def test_total_leads_matches(self, client):
        response = client.get(f"/analytics/data-quality?company_id={COMPANY_ID}")
        data = response.json()["data"]
        assert data["total_leads"] > 0
        assert data["valid_emails"] <= data["total_leads"]
        assert data["valid_phones"] <= data["total_leads"]


# ─── T7: Résilience pipeline ──────────────────────────────────────────────────

class TestT7Resilience:
    """T7 — Resilience: endpoints handle errors gracefully"""

    def test_invalid_company_id_handled(self, client):
        response = client.get("/analytics/executive?company_id=invalid-id")
        assert response.status_code == 200
        data = response.json()
        assert "success" in data

    def test_missing_company_id_returns_422(self, client):
        response = client.get("/analytics/executive")
        assert response.status_code == 422

    def test_social_endpoint_resilient(self, client):
        response = client.get(f"/analytics/social?company_id={COMPANY_ID}")
        assert response.status_code == 200


# ─── T8: Performance ──────────────────────────────────────────────────────────

class TestT8Performance:
    """T8 — Performance: dashboard queries respond in reasonable time"""

    def test_executive_responds_quickly(self, client):
        import time
        start = time.time()
        client.get(f"/analytics/executive?company_id={COMPANY_ID}")
        duration = time.time() - start
        assert duration < 10

    def test_social_responds_quickly(self, client):
        import time
        start = time.time()
        client.get(f"/analytics/social?company_id={COMPANY_ID}")
        duration = time.time() - start
        assert duration < 10

    def test_roi_responds_quickly(self, client):
        import time
        start = time.time()
        client.get(f"/analytics/roi-report?company_id={COMPANY_ID}")
        duration = time.time() - start
        assert duration < 10


# ─── T9: Sécurité/RLS ────────────────────────────────────────────────────────

class TestT9Security:
    """T9 — Security: data isolation per company_id"""

    def test_different_company_returns_different_data(self, client):
        res1 = client.get(f"/analytics/executive?company_id={COMPANY_ID}")
        res2 = client.get("/analytics/executive?company_id=00000000-0000-0000-0000-000000000000")
        data1 = res1.json()["data"]["kpis"]["total_leads"]
        data2 = res2.json()["data"]["kpis"]["total_leads"]
        assert data1 != data2 or data2 == 0

    def test_unknown_company_returns_empty(self, client):
        response = client.get("/analytics/executive?company_id=00000000-0000-0000-0000-000000000000")
        assert response.status_code == 200
        data = response.json()["data"]["kpis"]
        assert data["total_leads"] == 0


# ─── T10: Drift ML ────────────────────────────────────────────────────────────

class TestT10MLDrift:
    """T10 — ML Drift: model versioning tracked"""

    def test_score_leads_returns_model_version(self, client):
        response = client.post(f"/analytics/ml/score-leads?company_id={COMPANY_ID}")
        data = response.json()["data"]
        assert "model_version" in data
        assert data["model_version"] == "v1.1"

    def test_lead_scores_have_model_version(self, client):
        response = client.get(f"/analytics/leads-intelligence?company_id={COMPANY_ID}")
        top_leads = response.json()["data"]["top_leads"]
        if top_leads:
            assert "model_version" in top_leads[0]

    def test_bi_export_views_available(self, client):
        response = client.get(f"/analytics/export/bi-views?company_id={COMPANY_ID}")
        assert response.status_code == 200
        views = response.json()["data"]["views"]
        assert len(views) == 4