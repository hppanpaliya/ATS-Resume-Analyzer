# MinIO image-pull recovery — `ats-resume-analyzer`

## Incident and root cause

On 2026-10-07, the MinIO Deployment created a new pod using
`minio/minio:latest`. Kubernetes reported:

```text
failed to resolve image: pull access denied, repository does not exist or may
require authorization: insufficient_scope: authorization failed
```

The old healthy pod was running **MinIO RELEASE.2025-09-07T16-13-09Z** on
Linux ARM64 from the worker node's containerd cache. The upstream
`minio/minio` Docker Hub image is no longer anonymously pullable. A mutable
`latest` tag with `imagePullPolicy: Always` therefore makes a routine pod
recreation fail.

## Live mitigation applied

`minio-image-recovery-strategic.yaml` was applied to the existing Deployment.
It makes two intentional changes:

1. `imagePullPolicy: IfNotPresent` lets the current ARM64 worker use its proven,
   locally cached MinIO image instead of contacting the unavailable upstream
   registry on every restart.
2. `strategy.type: Recreate` prevents two MinIO pods from running at once
   against the single `local-path` / ReadWriteOnce `minio-data` PVC.

Apply or reapply it from a machine with kubeconfig for the **kube** cluster:

```sh
kubectl patch deployment/minio -n ats-resume-analyzer \
  --type=strategic \
  --patch-file deploy/kubernetes/minio-image-recovery-strategic.yaml
kubectl rollout status deployment/minio -n ats-resume-analyzer --timeout=180s
```

## Verify

```sh
kubectl get deployment,pods -n ats-resume-analyzer -l app=minio -o wide
kubectl get deployment/minio -n ats-resume-analyzer \
  -o jsonpath='{.spec.strategy.type}{"\n"}{.spec.template.spec.containers[0].imagePullPolicy}{"\n"}'
```

Expected output is one Ready pod, followed by:

```text
Recreate
IfNotPresent
```

## Required follow-up: make the image durable

This mitigation is sufficient for restarts on the present worker because its
containerd cache contains the image. It is **not** a long-term supply-chain
solution: a new worker, an emptied image cache, or a rebuilt node cannot pull
`minio/minio:latest`.

Before any node replacement or cache cleanup, replace the image reference with
an immutable ARM64 image hosted in a registry Harshal controls, then update this
Deployment to that digest. Do not change it to another mutable `latest` tag.
Test the replacement with a one-pod rollout and retain this `Recreate` strategy
because this MinIO instance has one writable local PVC.
