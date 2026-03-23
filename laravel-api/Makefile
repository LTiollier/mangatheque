.PHONY: help pint phpcs phpcs-fix stan test coverage domain-coverage migrate fresh clean sync sync-all work all

DOCKER_BE = docker-compose exec backend

# Default target
help:
	@echo "Available commands:"
	@echo "  make pint            Run Laravel Pint for code style fixing"
	@echo "  make phpcs           Run PHP_CodeSniffer for code style check"
	@echo "  make phpcs-fix       Run PHPCBF to fix code style issues"
	@echo "  make stan            Run Larastan (PHPStan) for static analysis"
	@echo "  make test            Run all tests using Pest"
	@echo "  make coverage        Run tests with global coverage (min 95%)"
	@echo "  make domain-coverage Run strict domain layer coverage check (min 100%)"
	@echo "  make migrate         Run database migrations"
	@echo "  make fresh           Shortcut for migrate:fresh --seed"
	@echo "  make all             Run pint, phpcs, stan and all tests"
	@echo "  make clean           Clear caches"
	@echo "  make sync-all        Full synchronization of all series from MangaCollec API"
	@echo "  make sync            Synchronization of used and new series from MangaCollec API"
	@echo "  make work            Start the queue worker"

all: pint phpcs stan test

pint:
	$(DOCKER_BE) ./vendor/bin/pint

phpcs:
	$(DOCKER_BE) ./vendor/bin/phpcs

phpcs-fix:
	$(DOCKER_BE) ./vendor/bin/phpcbf || true

stan:
	$(DOCKER_BE) ./vendor/bin/phpstan analyse --memory-limit 2G

test:
	$(DOCKER_BE) ./vendor/bin/pest

coverage:
	$(DOCKER_BE) ./vendor/bin/pest --coverage --min=95

domain-coverage:
	$(DOCKER_BE) ./vendor/bin/pest --configuration phpunit.domain.xml --coverage --min=100

migrate:
	$(DOCKER_BE) php artisan migrate

fresh:
	$(DOCKER_BE) php artisan migrate:fresh --seed

clean:
	$(DOCKER_BE) php artisan config:clear
	$(DOCKER_BE) php artisan cache:clear
	$(DOCKER_BE) php artisan route:clear
	$(DOCKER_BE) php artisan view:clear

sync-all:
	$(DOCKER_BE) php artisan app:sync-all-series

sync:
	$(DOCKER_BE) php artisan app:sync-series

work:
	$(DOCKER_BE) php artisan queue:work --queue=high,default
