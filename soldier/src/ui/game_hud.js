window.SKY = window.SKY || {};

class GameHud {
  drawPanel(ctx, x, y, w, h, options = {}) {
    const alert = options.alert || false;
    ctx.save();
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, alert ? 'rgba(42,12,10,.82)' : 'rgba(4,13,24,.82)');
    g.addColorStop(.55, alert ? 'rgba(18,8,10,.80)' : 'rgba(3,8,17,.76)');
    g.addColorStop(1, 'rgba(0,3,9,.70)');
    ctx.fillStyle = g;
    SKY.Draw.roundRectPath(ctx, x, y, w, h, 10);
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = alert ? 'rgba(255,126,68,.78)' : 'rgba(81,218,255,.70)';
    ctx.stroke();

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255,255,255,.16)';
    SKY.Draw.roundRectPath(ctx, x + 3, y + 3, w - 6, h - 6, 7);
    ctx.stroke();

    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = alert ? 'rgba(255,95,48,.20)' : 'rgba(74,218,255,.18)';
    ctx.fillRect(x + 12, y + 6, Math.max(20, w - 24), 2);
    ctx.restore();
  }

  drawPlayerHp(ctx, world) {
    const hp = Math.max(0, world.player.hp || 0);
    const max = world.player.maxHp || 6;
    const x = 26;
    const y = 20;
    const pipW = 26;
    const pipH = 13;
    const gap = 6;
    const w = 98 + max * (pipW + gap);
    const h = 40;

    this.drawPanel(ctx, x, y, w, h);

    ctx.save();
    ctx.font = '900 14px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(235,250,255,.98)';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(0,6,12,.96)';
    ctx.strokeText('LIFE', x + 17, y + 21);
    ctx.fillText('LIFE', x + 17, y + 21);

    for (let i = 0; i < max; i++) {
      const px = x + 70 + i * (pipW + gap);
      const py = y + 14;
      ctx.fillStyle = i < hp ? 'rgba(255,222,88,.98)' : 'rgba(255,222,88,.13)';
      ctx.fillRect(px, py, pipW, pipH);
      ctx.fillStyle = i < hp ? 'rgba(255,255,255,.42)' : 'rgba(255,255,255,.05)';
      ctx.fillRect(px, py, pipW, 3);
      ctx.strokeStyle = i < hp ? 'rgba(255,156,42,.72)' : 'rgba(80,120,140,.22)';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + .5, py + .5, pipW - 1, pipH - 1);
    }
    ctx.restore();
  }

  drawStageLabel(ctx, world) {
    const phase = world.stage?.phase || 'stage01';
    const map = {
      intro: 'STAGE 01',
      ready: 'STAGE 01',
      wave01: 'ACCESS PLATFORM',
      wave02: 'AIR SECURITY',
      helicopterWarning: 'ENEMY CHOPPER',
      helicopterFight: 'AH-91 RAZORBACK',
      bossWarning: 'CONTAINMENT BREACH',
      bossFight: 'OMEGA-01',
      stageClear: 'STAGE CLEAR',
      complete: 'MISSION COMPLETE',
    };
    const label = map[phase] || 'IRON HANGAR';
    const alert = phase === 'bossWarning' || phase === 'bossFight' || phase === 'helicopterWarning';
    const w = 250;
    const h = 34;
    const x = world.W - w - 24;
    const y = 20;

    this.drawPanel(ctx, x, y, w, h, { alert });
    ctx.save();
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.font = '900 12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    ctx.fillStyle = alert ? 'rgba(255,217,156,.95)' : 'rgba(217,246,255,.92)';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,5,12,.95)';
    ctx.strokeText(label, x + w - 16, y + h / 2 + 1);
    ctx.fillText(label, x + w - 16, y + h / 2 + 1);
    ctx.textAlign = 'left';
    ctx.font = '900 11px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    ctx.fillStyle = alert ? 'rgba(255,126,68,.9)' : 'rgba(80,218,255,.9)';
    ctx.fillText('01', x + 16, y + h / 2 + 1);
    ctx.restore();
  }

  drawBossBar(ctx, world) {
    const boss = world.enemies.find(e => e instanceof SKY.BossBiomechEnemy && !e.remove && (!e.dead || !e.finalExplosionDone));
    if (!boss || boss.state === 'enter') return;
    const x = 360;
    const y = 22;
    const w = 500;
    const h = 34;
    const a = Math.max(0, Math.min(1, boss.hp / boss.maxHp));

    this.drawPanel(ctx, x, y, w, h, { alert: true });
    ctx.save();
    ctx.font = '900 12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,230,142,.98)';
    ctx.fillText('OMEGA-01', x + 16, y + 17);

    const bx = x + 102;
    const by = y + 11;
    const bw = w - 122;
    const bh = 12;
    ctx.fillStyle = 'rgba(34,10,8,.96)';
    ctx.fillRect(bx, by, bw, bh);
    const g = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    g.addColorStop(0, '#ffed7d');
    g.addColorStop(.55, '#ff963d');
    g.addColorStop(1, '#ff302c');
    ctx.fillStyle = g;
    ctx.fillRect(bx, by, bw * a, bh);
    ctx.fillStyle = 'rgba(255,255,255,.36)';
    ctx.fillRect(bx, by, bw * a, 3);
    ctx.strokeStyle = 'rgba(255,219,110,.35)';
    ctx.strokeRect(bx + .5, by + .5, bw - 1, bh - 1);
    ctx.restore();
  }

  drawControlHint(ctx, world) {
    if (!world.debug) return;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '800 12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    ctx.fillStyle = 'rgba(215,235,255,.54)';
    ctx.fillText('DEBUG: Z/J JUMP · SPACE/X FIRE · ↑ AIM UP · ↑+←/→ DIAGONAL · G GRENADE · R RESET', world.W / 2, world.H - 22);
    ctx.restore();
  }

  draw(ctx, world) {
    this.drawPlayerHp(ctx, world);
    this.drawBossBar(ctx, world);
    this.drawStageLabel(ctx, world);
    this.drawControlHint(ctx, world);
  }
}

window.SKY.GameHud = GameHud;
