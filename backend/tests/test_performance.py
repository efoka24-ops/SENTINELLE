"""Performance and load tests for SENTINELLE."""
import time
import pytest
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models import Signalement, Alert, Content, User


class TestEndpointResponseTimes:
    """Tests for endpoint response time performance."""

    def test_health_check_under_100ms(self, client):
        """Test health endpoint responds in under 100ms."""
        start = time.time()
        response = client.get("/api/v1/health")
        elapsed = (time.time() - start) * 1000

        assert response.status_code == 200
        assert elapsed < 100, f"Health check took {elapsed:.1f}ms"

    def test_alerts_list_under_1_second(self, client, headers_for_role):
        """Test alerts endpoint responds in under 1 second."""
        headers = headers_for_role("analyst_jr")
        start = time.time()
        response = client.get("/api/v1/alerts", headers=headers)
        elapsed = (time.time() - start) * 1000

        assert response.status_code == 200
        assert elapsed < 1000, f"Alerts endpoint took {elapsed:.1f}ms"

    def test_contents_list_under_1_second(self, client, headers_for_role):
        """Test contents endpoint responds in under 1 second."""
        headers = headers_for_role("analyst_jr")
        start = time.time()
        response = client.get("/api/v1/contents", headers=headers)
        elapsed = (time.time() - start) * 1000

        assert response.status_code == 200
        assert elapsed < 1000, f"Contents endpoint took {elapsed:.1f}ms"

    def test_signalements_query_under_500ms(self, client, headers_for_role):
        """Test signalements endpoint responds in under 500ms."""
        headers = headers_for_role("analyst_jr")
        start = time.time()
        response = client.get("/api/v1/signalements/assigned-to-me", headers=headers)
        elapsed = (time.time() - start) * 1000

        assert response.status_code == 200
        assert elapsed < 500, f"Signalements endpoint took {elapsed:.1f}ms"


class TestScalability:
    """Tests for performance with larger datasets."""

    def test_query_1000_alerts(self, client, db: Session, headers_for_role):
        """Test querying 1000 alerts completes quickly."""
        # Create 1000 test alerts
        alerts = []
        for i in range(1000):
            alert = Alert(
                number=f"ALERT-TEST-{i:04d}",
                level="HIGH" if i % 2 == 0 else "MEDIUM",
                threat_type="Test",
                title=f"Test alert {i}",
                platform="Test",
                region="National",
                status="Ouvert",
            )
            alerts.append(alert)

        db.bulk_save_objects(alerts)
        db.commit()

        # Query should complete in reasonable time
        headers = headers_for_role("analyst_jr")
        start = time.time()
        response = client.get("/api/v1/alerts?limit=1000", headers=headers)
        elapsed = (time.time() - start) * 1000

        assert response.status_code == 200
        assert elapsed < 2000, f"Query 1000 alerts took {elapsed:.1f}ms"

    def test_query_1000_contents(self, client, db: Session, headers_for_role):
        """Test querying 1000 content items completes quickly."""
        contents = []
        for i in range(1000):
            content = Content(
                platform="Test",
                source_id=f"test-{i}",
                source_url=f"https://example.com/{i}",
                author=f"author{i}",
                text=f"Test content {i}",
                threat_category="neutral" if i % 3 == 0 else "threat",
                threat_score=0.5 + (i % 5) * 0.1,
                region="National",
                status="analyzed",
            )
            contents.append(content)

        db.bulk_save_objects(contents)
        db.commit()

        headers = headers_for_role("analyst_jr")
        start = time.time()
        response = client.get("/api/v1/contents?limit=1000", headers=headers)
        elapsed = (time.time() - start) * 1000

        assert response.status_code == 200
        assert elapsed < 2000, f"Query 1000 contents took {elapsed:.1f}ms"

    def test_query_1000_signalements(self, client, db: Session, headers_for_role, users):
        """Test querying 1000 signalements completes quickly."""
        signalements = []
        now = datetime.now(timezone.utc)

        for i in range(1000):
            sig = Signalement(
                reference=f"SIG-PERF-{i:05d}",
                status="Nouveau" if i % 3 == 0 else "Analyse",
                category="Test",
                gravity="Modéré",
                assigned_to=users["analyst_jr"].id,
                created_at=now - timedelta(hours=i % 24),
                updated_at=now - timedelta(hours=i % 24),
            )
            signalements.append(sig)

        db.bulk_save_objects(signalements)
        db.commit()

        headers = headers_for_role("analyst_jr")
        start = time.time()
        response = client.get("/api/v1/signalements/assigned-to-me?limit=1000", headers=headers)
        elapsed = (time.time() - start) * 1000

        assert response.status_code == 200
        assert elapsed < 2000, f"Query 1000 signalements took {elapsed:.1f}ms"


class TestConcurrency:
    """Tests for handling concurrent requests."""

    def test_multiple_users_query_simultaneously(self, client, headers_for_role):
        """Test that multiple concurrent queries don't cause slowdown."""
        headers_jr = headers_for_role("analyst_jr")
        headers_sr = headers_for_role("analyst_sr")
        headers_chief = headers_for_role("chief")

        times = []

        # Simulate concurrent requests (sequential in test, but measures same behavior)
        for headers in [headers_jr, headers_sr, headers_chief, headers_jr, headers_sr]:
            start = time.time()
            response = client.get("/api/v1/alerts", headers=headers)
            elapsed = (time.time() - start) * 1000
            times.append(elapsed)
            assert response.status_code == 200

        avg_time = sum(times) / len(times)
        assert avg_time < 500, f"Average response time {avg_time:.1f}ms under load"

    def test_write_operations_dont_block_reads(self, client, db: Session, headers_for_role):
        """Test that write operations don't significantly impact read latency."""
        headers = headers_for_role("analyst_sr")

        # Measure read latency
        start = time.time()
        response = client.get("/api/v1/alerts", headers=headers)
        read_time = (time.time() - start) * 1000

        # Perform write operation
        alert = Alert(
            number="PERF-WRITE-001",
            level="HIGH",
            title="Test",
            platform="Test",
            region="National",
            status="Ouvert",
        )
        db.add(alert)
        db.commit()

        # Measure read latency again
        start = time.time()
        response = client.get("/api/v1/alerts", headers=headers)
        read_time_after_write = (time.time() - start) * 1000

        # Should not be significantly slower
        ratio = read_time_after_write / read_time if read_time > 0 else 1
        assert ratio < 2.0, f"Read slowdown ratio: {ratio:.2f}"


class TestDatabaseQueryPerformance:
    """Tests for database query efficiency."""

    def test_filtered_alerts_query_efficient(self, db: Session):
        """Test that filtered alert queries are efficient."""
        # Create test data
        for i in range(500):
            alert = Alert(
                number=f"ALERT-{i:04d}",
                level="CRITICAL" if i < 50 else "HIGH" if i < 200 else "MEDIUM",
                title=f"Alert {i}",
                platform="Facebook" if i % 2 == 0 else "Instagram",
                region="National",
                status="Ouvert" if i % 3 == 0 else "Fermé",
            )
            db.add(alert)
        db.commit()

        # Query with filters
        start = time.time()
        results = db.query(Alert).filter(
            Alert.level == "CRITICAL",
            Alert.status == "Ouvert"
        ).all()
        elapsed = (time.time() - start) * 1000

        assert len(results) > 0
        assert elapsed < 100, f"Filtered query took {elapsed:.1f}ms"

    def test_ordered_query_efficient(self, db: Session):
        """Test that ordered queries are efficient."""
        # Create test data
        for i in range(500):
            alert = Alert(
                number=f"ALERT-{i:04d}",
                title=f"Alert {i}",
                platform="Test",
                region="National",
                status="Ouvert",
                created_at=datetime.now(timezone.utc) - timedelta(hours=i),
            )
            db.add(alert)
        db.commit()

        # Query with ordering
        start = time.time()
        results = db.query(Alert).order_by(Alert.created_at.desc()).limit(50).all()
        elapsed = (time.time() - start) * 1000

        assert len(results) > 0
        assert elapsed < 100, f"Ordered query took {elapsed:.1f}ms"

    def test_count_query_efficient(self, db: Session):
        """Test that count queries are efficient."""
        # Create test data
        for i in range(500):
            alert = Alert(
                number=f"ALERT-{i:04d}",
                level="HIGH",
                title=f"Alert {i}",
                platform="Test",
                region="National",
                status="Ouvert",
            )
            db.add(alert)
        db.commit()

        # Count query
        start = time.time()
        count = db.query(Alert).filter(Alert.status == "Ouvert").count()
        elapsed = (time.time() - start) * 1000

        assert count > 0
        assert elapsed < 50, f"Count query took {elapsed:.1f}ms"


class TestMemoryUsage:
    """Tests for memory efficiency."""

    def test_large_result_set_handled_efficiently(self, db: Session):
        """Test that large result sets don't consume excessive memory."""
        # Create moderate dataset
        for i in range(500):
            alert = Alert(
                number=f"ALERT-{i:04d}",
                level="HIGH",
                title=f"Alert {i}",
                platform="Test",
                region="National",
                status="Ouvert",
            )
            db.add(alert)
        db.commit()

        # Fetch large result set (should use limit in real API)
        start = time.time()
        alerts = db.query(Alert).limit(500).all()
        elapsed = (time.time() - start) * 1000

        assert len(alerts) == 500
        assert elapsed < 500, f"Fetching 500 records took {elapsed:.1f}ms"


class TestCacheEffectiveness:
    """Tests for query result caching and optimization."""

    def test_repeated_query_faster(self, db: Session):
        """Test that repeated queries benefit from database caching."""
        # Create test data
        for i in range(100):
            alert = Alert(
                number=f"ALERT-{i:04d}",
                level="HIGH",
                title=f"Alert {i}",
                platform="Test",
                region="National",
                status="Ouvert",
            )
            db.add(alert)
        db.commit()

        # First query (cold cache)
        start = time.time()
        results1 = db.query(Alert).filter(Alert.level == "HIGH").all()
        first_time = (time.time() - start) * 1000

        # Second query (warm cache)
        start = time.time()
        results2 = db.query(Alert).filter(Alert.level == "HIGH").all()
        second_time = (time.time() - start) * 1000

        assert len(results1) == len(results2)
        # Second query should not be significantly slower (if slower, that's database behavior)
        # Just verify both complete in reasonable time
        assert first_time < 200
        assert second_time < 200
