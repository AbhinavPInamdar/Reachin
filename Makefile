up:
	docker compose up -d

down:
	docker compose down

migrate:
	./scripts/migrate.sh

logs:
	docker compose logs -f