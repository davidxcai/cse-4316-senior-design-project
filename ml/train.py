"""Phase 4: train a GRU sign classifier on extracted landmarks.

Usage: python train.py [--groups hands pose] [--epochs 60] [--name hands_pose]
Saves the best-validation checkpoint and a log to runs/<name>/. Test split is never touched here.
"""
import argparse, json, time
from pathlib import Path
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from dataset import ClipDataset, load_labels


class SignGRU(nn.Module):
    def __init__(self, in_dim, n_classes, hidden=128, layers=2, dropout=0.3):
        super().__init__()
        self.proj = nn.Sequential(nn.Linear(in_dim, hidden), nn.LayerNorm(hidden), nn.ReLU(), nn.Dropout(dropout))
        self.gru = nn.GRU(hidden, hidden, layers, batch_first=True, bidirectional=True, dropout=dropout)
        self.head = nn.Sequential(nn.Dropout(dropout), nn.Linear(4 * hidden, n_classes))

    def forward(self, x):  # x: [B, T, D]
        h, _ = self.gru(self.proj(x))
        return self.head(torch.cat([h.mean(1), h.max(1).values], dim=1))  # pool over time


@torch.no_grad()
def evaluate(model, loader, device):
    model.eval()
    top1 = top5 = n = 0
    loss_sum = 0.0
    for x, y in loader:
        x, y = x.to(device), y.to(device)
        out = model(x)
        loss_sum += nn.functional.cross_entropy(out, y, reduction="sum").item()
        t5 = out.topk(5, dim=1).indices
        top1 += (t5[:, 0] == y).sum().item()
        top5 += (t5 == y[:, None]).any(dim=1).sum().item()
        n += len(y)
    return loss_sum / n, top1 / n, top5 / n


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--groups", nargs="+", default=["hands", "pose"])
    ap.add_argument("--epochs", type=int, default=60)
    ap.add_argument("--batch", type=int, default=32)
    ap.add_argument("--lr", type=float, default=1e-3)
    ap.add_argument("--patience", type=int, default=15, help="stop after this many epochs without val improvement")
    ap.add_argument("--name", default=None)
    a = ap.parse_args()
    name = a.name or "_".join(a.groups)
    out_dir = Path("runs") / name
    out_dir.mkdir(parents=True, exist_ok=True)
    torch.manual_seed(0)
    device = "mps" if torch.backends.mps.is_available() else "cpu"

    labels = load_labels()
    tr = ClipDataset("train", a.groups, train=True, labels=labels)
    va = ClipDataset("val", a.groups, labels=labels)
    tl = DataLoader(tr, batch_size=a.batch, shuffle=True)
    vl = DataLoader(va, batch_size=64)
    model = SignGRU(tr.feature_dim, len(labels)).to(device)
    opt = torch.optim.AdamW(model.parameters(), lr=a.lr, weight_decay=1e-2)
    sched = torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=a.lr, total_steps=a.epochs * len(tl))
    print(f"{name}: groups={a.groups} dim={tr.feature_dim} train={len(tr)} val={len(va)} "
          f"params={sum(p.numel() for p in model.parameters()):,} device={device}", flush=True)

    best, best_ep, log = -1.0, 0, []
    for ep in range(1, a.epochs + 1):
        model.train()
        t0, loss_sum, correct, n = time.time(), 0.0, 0, 0
        for x, y in tl:
            x, y = x.to(device), y.to(device)
            out = model(x)
            loss = nn.functional.cross_entropy(out, y, label_smoothing=0.1)
            opt.zero_grad()
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            opt.step()
            sched.step()
            loss_sum += loss.item() * len(y)
            correct += (out.argmax(1) == y).sum().item()
            n += len(y)
        vloss, v1, v5 = evaluate(model, vl, device)
        row = dict(epoch=ep, train_loss=loss_sum / n, train_acc=correct / n, val_loss=vloss, val_top1=v1, val_top5=v5)
        log.append(row)
        mark = ""
        if v1 > best:
            best, best_ep, mark = v1, ep, " *"
            torch.save(dict(model=model.state_dict(), groups=a.groups, labels=labels, in_dim=tr.feature_dim), out_dir / "best.pt")
        print(f"ep {ep:>3}  train loss {row['train_loss']:.3f} acc {row['train_acc']:.2f}  |  "
              f"val loss {vloss:.3f} top1 {v1:.3f} top5 {v5:.3f}  ({time.time()-t0:.1f}s){mark}", flush=True)
        if ep - best_ep >= a.patience:
            print(f"early stop: no val improvement for {a.patience} epochs")
            break
    json.dump(log, open(out_dir / "log.json", "w"), indent=1)
    print(f"best val top1 {best:.3f} at epoch {best_ep}  -> {out_dir/'best.pt'}")


if __name__ == "__main__":
    main()
