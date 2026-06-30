IMAGE ?= statgpt-mcp-app-frontend
TAG   ?= local
PORT  ?= 8080

# The widget origin is supplied at run time: the image carries a placeholder
# origin and the startup script rewrites it to this value. Override for
# non-local deployments:
#   make docker-run VITE_BASE_URL=https://widget.example.com
VITE_BASE_URL ?= http://localhost:$(PORT)

.PHONY: docker-build docker-run docker-run-hardened docker-stop

docker-build:
	docker build -t $(IMAGE):$(TAG) .

docker-run:
	docker run --rm -p $(PORT):8080 -e VITE_BASE_URL=$(VITE_BASE_URL) $(IMAGE):$(TAG)

# Reproduce the deployment's hardened securityContext locally:
# read-only root filesystem, only /tmp writable, non-root user.
docker-run-hardened:
	docker run --rm --read-only --tmpfs /tmp --user 1001 \
		-p $(PORT):8080 -e VITE_BASE_URL=$(VITE_BASE_URL) $(IMAGE):$(TAG)

docker-stop:
	docker stop $$(docker ps -q --filter ancestor=$(IMAGE):$(TAG))
