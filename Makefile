.PHONY: help up down restart logs ps db-migrate db-generate db-studio dev-backend build-backend

help: ## Показать список доступных команд
	@echo "Доступные команды:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

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

db-studio: ## Открыть Prisma Studio (веб-интерфейс к базе)
	cd backend && npx prisma studio

# --- Backend ---
dev-backend: ## Запустить backend в режиме разработки
	cd backend && npm run start:dev

build-backend: ## Собрать backend
	cd backend && npm run build

# --- Полный первый запуск ---
setup: up ## Поднять БД и накатить миграции
	@echo "Ожидание готовности PostgreSQL..."
	@sleep 3
	@make db-migrate
	@echo "Проект готов к запуску! Выполни: make dev-backend"
