# ====== Config ======
REGION        ?= us-east-1
REPO          ?= of-worker
CONTEXT_DIR   ?= workers/of-worker
PLATFORM      ?= linux/amd64

# Auto-détection du compte
ACCOUNT_ID    := $(shell aws sts get-caller-identity --query Account --output text)
ECR_URI       := $(ACCOUNT_ID).dkr.ecr.$(REGION).amazonaws.com/$(REPO)

# Tagging
GIT_SHA       := $(shell git rev-parse --short HEAD 2>/dev/null || echo nogit)
DATE_UTC      := $(shell date -u +%Y%m%d-%H%M%S)
TAG           ?= latest
RELEASE_TAG   ?= $(DATE_UTC)-$(GIT_SHA)

# ====== Helpers ======
.PHONY: help ecr-create ecr-login ecr-build ecr-tag ecr-push ecr-release ecr-all ecr-clean

help:
	@echo "Targets:"
	@echo "  ecr-create    - Crée le repo ECR ($(REPO)) si besoin"
	@echo "  ecr-login     - Docker login sur ECR ($(REGION))"
	@echo "  ecr-build     - Build image $(REPO):$(TAG) (platform=$(PLATFORM))"
	@echo "  ecr-tag       - Tag local -> $(ECR_URI):$(TAG)"
	@echo "  ecr-push      - Push $(ECR_URI):$(TAG)"
	@echo "  ecr-release   - Tag + push release ($(RELEASE_TAG))"
	@echo "  ecr-all       - create + login + build + tag + push (TAG=$(TAG))"
	@echo "  ecr-clean     - Nettoie images locales"
	@echo ""
	@echo "Vars: REGION=$(REGION)  REPO=$(REPO)  CONTEXT_DIR=$(CONTEXT_DIR)  PLATFORM=$(PLATFORM)"

ecr-create:
	aws ecr describe-repositories --repository-names $(REPO) --region $(REGION) >/dev/null 2>&1 || \
	aws ecr create-repository \
	  --repository-name $(REPO) \
	  --image-scanning-configuration scanOnPush=true \
	  --encryption-configuration encryptionType=KMS \
	  --region $(REGION)
	@echo "✔ ECR repo prêt: $(ECR_URI)"

ecr-login:
	aws ecr get-login-password --region $(REGION) | \
	docker login --username AWS --password-stdin $(ACCOUNT_ID).dkr.ecr.$(REGION).amazonaws.com
	@echo "✔ Docker connecté à ECR ($(REGION))"

ecr-build:
	docker buildx build --platform $(PLATFORM) -t $(REPO):$(TAG) $(CONTEXT_DIR)
	@echo "✔ Build local: $(REPO):$(TAG)"

ecr-tag:
	docker tag $(REPO):$(TAG) $(ECR_URI):$(TAG)
	@echo "✔ Taggé: $(ECR_URI):$(TAG)"

ecr-push:
	docker push $(ECR_URI):$(TAG)
	@echo "✔ Poussé: $(ECR_URI):$(TAG)"

ecr-release: ecr-login
	docker tag $(REPO):$(TAG) $(ECR_URI):$(RELEASE_TAG)
	docker push $(ECR_URI):$(RELEASE_TAG)
	@echo "✔ Release tag poussé: $(ECR_URI):$(RELEASE_TAG)"

ecr-all: ecr-create ecr-login ecr-build ecr-tag ecr-push

ecr-clean:
	-@docker rmi $(REPO):$(TAG) 2>/dev/null || true

