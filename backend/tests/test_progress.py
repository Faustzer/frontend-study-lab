from app.services.progress import split_total_xp, xp_for_level


class TestLevelMath:
    def test_mirrors_frontend_formula(self):
        assert xp_for_level(1) == 100
        assert xp_for_level(2) == 150
        assert xp_for_level(3) == 225

    def test_split_total_xp(self):
        assert split_total_xp(0) == (1, 0)
        assert split_total_xp(99) == (1, 99)
        assert split_total_xp(100) == (2, 0)
        assert split_total_xp(120) == (2, 20)
        assert split_total_xp(250) == (3, 0)


class TestProgressEndpoints:
    async def test_requires_auth(self, client):
        assert (await client.get("/api/progress")).status_code == 401
        resp = await client.post("/api/progress/complete", json={"moduleSlug": "bind"})
        assert resp.status_code == 401

    async def test_default_progress(self, auth_client):
        resp = await auth_client.get("/api/progress")
        assert resp.status_code == 200
        assert resp.json()["data"] == {
            "xp": 0,
            "level": 1,
            "completedModules": [],
            "completedChallenges": {},
        }

    async def test_complete_module_awards_catalog_xp(self, auth_client):
        resp = await auth_client.post(
            "/api/progress/complete",
            json={"moduleSlug": "bind", "xpReward": 9999},  # client value must be ignored
        )
        data = resp.json()["data"]
        assert data["completedModules"] == ["bind"]
        assert data["xp"] == 60  # from the server catalog, not 9999
        assert data["level"] == 1

    async def test_complete_module_is_idempotent(self, auth_client):
        await auth_client.post("/api/progress/complete", json={"moduleSlug": "bind"})
        resp = await auth_client.post("/api/progress/complete", json={"moduleSlug": "bind"})
        data = resp.json()["data"]
        assert data["completedModules"] == ["bind"]
        assert data["xp"] == 60

    async def test_unknown_module_recorded_without_xp(self, auth_client):
        resp = await auth_client.post("/api/progress/complete", json={"moduleSlug": "nope"})
        data = resp.json()["data"]
        assert data["completedModules"] == ["nope"]
        assert data["xp"] == 0

    async def test_level_up(self, auth_client):
        # bind(60) + curry(60) = 120 total → level 2, 20 xp remaining
        await auth_client.post("/api/progress/complete", json={"moduleSlug": "bind"})
        resp = await auth_client.post("/api/progress/complete", json={"moduleSlug": "curry"})
        data = resp.json()["data"]
        assert data["level"] == 2
        assert data["xp"] == 20

    async def test_complete_challenge_caps_xp(self, auth_client):
        resp = await auth_client.post(
            "/api/progress/challenge/complete",
            json={"moduleSlug": "bind", "challengeId": "test-1", "xpReward": 9999},
        )
        data = resp.json()["data"]
        assert data["completedChallenges"] == {"bind": ["test-1"]}
        assert data["xp"] == 50  # capped

    async def test_complete_challenge_is_idempotent(self, auth_client):
        body = {"moduleSlug": "bind", "challengeId": "test-1", "xpReward": 10}
        await auth_client.post("/api/progress/challenge/complete", json=body)
        resp = await auth_client.post("/api/progress/challenge/complete", json=body)
        data = resp.json()["data"]
        assert data["completedChallenges"] == {"bind": ["test-1"]}
        assert data["xp"] == 10

    async def test_progress_persists_across_requests(self, auth_client):
        await auth_client.post("/api/progress/complete", json={"moduleSlug": "debounce"})
        resp = await auth_client.get("/api/progress")
        data = resp.json()["data"]
        assert data["completedModules"] == ["debounce"]
        assert data["xp"] == 30
