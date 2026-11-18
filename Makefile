.PHONY: help up down restart logs ps db-ready db-migrate db-generate db-seed db-studio \
        dev-backend dev-frontend build-backend build-frontend setup

help: ## Показать список доступных команд
	@echo "Доступные команды:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

# --- Инфраструктура ---
up: ## Запустить PostgreSQL и Redis
	docker compose up -d

down: ## Остановить контейнеры
	docker compose down

restart: ## Перезапустить контейнеры
	@$(MAKE) down
	@$(MAKE) up

logs: ## Посмотреть логи контейнеров
	docker compose logs -f

ps: ## Проверить статус контейнеров
	docker compose ps

db-ready: ## Дождаться готовности PostgreSQL и Redis
	@echo "Ожидание готовности PostgreSQL и Redis..."
	@i=0; \
	while [ "$$(docker inspect -f '{{.State.Health.Status}}' cascade_postgres 2>/dev/null)" != "healthy" ] || \
	      [ "$$(docker inspect -f '{{.State.Health.Status}}' cascade_redis 2>/dev/null)" != "healthy" ]; do \
		i=$$((i + 1)); \
		if [ $$i -ge 60 ]; then \
			echo "PostgreSQL или Redis не запустились за 60 секунд"; \
			docker compose ps; \
			exit 1; \
		fi; \
		sleep 1; \
	done
	@echo "PostgreSQL и Redis готовы."

# --- База данных ---
db-migrate: ## Применить миграции
	cd backend && npx prisma migrate dev

db-generate: ## Сгенерировать Prisma Client
	cd backend && npx prisma generate

db-seed: ## Добавить начальные данные
	cd backend && npx prisma db seed

db-studio: ## Открыть Prisma Studio
	cd backend && npx prisma studio

# --- Backend ---
dev-backend: ## Запустить базу и backend
	@$(MAKE) up
	@$(MAKE) db-ready
	@$(MAKE) db-generate
	@$(MAKE) db-migrate
	cd backend && npm run start:dev

build-backend: ## Собрать backend
	cd backend && npm run build

# --- Frontend ---
dev-frontend: ## Запустить frontend
	cd frontend && npm run dev

build-frontend: ## Собрать frontend
	cd frontend && npm run build

# --- Первый запуск ---
setup: ## Подготовить базу, применить миграции и добавить начальные данные
	@$(MAKE) up
	@$(MAKE) db-ready
	@$(MAKE) db-generate
	@$(MAKE) db-migrate
	@$(MAKE) db-seed
	@echo "Настройка завершена."
	@echo "Запустите backend:  make dev-backend"
	@echo "Запустите frontend: make dev-frontend"
