IMAGE ?= statgpt-mcp-app-frontend
TAG   ?= local
PORT  ?= 8080

# Asset URLs are stamped into index.html at build time — must match the
# origin where the container will be served. Override for non-local deployments:
#   make docker-build VITE_BASE_URL=https://widget.example.com
VITE_BASE_URL ?= http://localhost:$(PORT)

.PHONY: docker-build docker-run docker-stop

docker-build:
	docker build \
		--build-arg VITE_BASE_URL=$(VITE_BASE_URL) \
		-t $(IMAGE):$(TAG) .

docker-run:
	docker run --rm -p $(PORT):80 $(IMAGE):$(TAG)

docker-stop:
	docker stop $$(docker ps -q --filter ancestor=$(IMAGE):$(TAG))
