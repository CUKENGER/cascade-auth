.PHONY: help up down restart logs ps db-migrate db-generate db-seed db-studio dev-backend dev-frontend build-backend build-frontend setup

help: ## Показать список доступных команд
	@echo "Доступные команды:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

# --- Инфраструктура (Docker) ---
up: ## Запустить PostgreSQL и Redis в фоновом режиме
	docker compose up -d

down: ## Остановить все контейнеры
	docker compose down

restart: down up ## Перезапустить контейнеры

logs: ## Посмотреть логи контейнеров
	docker compose logs -f

ps: ## Проверить статус контейнеров
	docker compose ps

# --- База данных (Prisma) ---
db-migrate: ## Применить миграции базы данных
	cd backend && npx prisma migrate dev

db-generate: ## Сгенерировать Prisma Client
	cd backend && npx prisma generate

db-seed: ## Наполнить базу начальными данными (Demo Project & Cascade)
	cd backend && npx prisma db seed

db-studio: ## Открыть Prisma Studio (веб-интерфейс к базе)
	cd backend && npx prisma studio

# --- Backend ---
dev-backend: ## Запустить backend в режиме разработки (порт 4000)
	cd backend && npm run start:dev

build-backend: ## Собрать backend
	cd backend && npm run build

# --- Frontend ---
dev-frontend: ## Запустить frontend в режиме разработки (порт 3000)
	cd frontend && npm run dev

build-frontend: ## Собрать frontend
	cd frontend && npm run build

# --- Полный первый запуск ---
setup: up ## Развернуть базу данных и применить сиды
	@echo "Ожидание готовности PostgreSQL..."
	@sleep 3
	@make db-migrate
	@make db-seed
	@echo "=========================================================="
	@echo "Все сервисы развернуты!"
	@echo "В одном терминале запустите:  make dev-backend"
	@echo "Во втором терминале запустите: make dev-frontend"
	@echo "=========================================================="
