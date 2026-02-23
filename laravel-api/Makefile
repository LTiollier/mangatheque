.PHONY: help pint stan test coverage domain-coverage migrate fresh ide-helper clean

# Default target
help:
	@echo "Available commands:"
	@echo "  make pint            Run Laravel Pint for code style fixing"
	@echo "  make stan            Run Larastan (PHPStan) for static analysis"
	@echo "  make test            Run all tests using Pest"
	@echo "  make coverage        Run tests with global coverage (min 95%)"
	@echo "  make domain-coverage Run strict domain layer coverage check (min 100%)"
	@echo "  make migrate         Run database migrations"
	@echo "  make fresh           Shortcut for migrate:fresh --seed"
	@echo "  make all             Run pint, stan and all tests"

all: pint stan test

pint:
	./vendor/bin/pint

stan:
	./vendor/bin/phpstan analyse --memory-limit 2G

test:
	./vendor/bin/pest

coverage:
	./vendor/bin/pest --coverage --min=95

domain-coverage:
	./vendor/bin/pest --configuration phpunit.domain.xml --coverage --min=100

migrate:
	php artisan migrate

fresh:
	php artisan migrate:fresh --seed

clean:
	php artisan config:clear
	php artisan cache:clear
	php artisan route:clear
	php artisan view:clear
