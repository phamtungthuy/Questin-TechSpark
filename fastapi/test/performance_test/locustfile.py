from locust import HttpUser, task

class QuestinLocust(HttpUser):
    @task
    def test(self):
        token = ""
        headers = {
            "Authorization": f"Bearer {token}" # token
        }
        self.client.get("/api/v1/user/info", headers=headers)
        self.client.get("/api/v1/dialog/list", headers=headers)
