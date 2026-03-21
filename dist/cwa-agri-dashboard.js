class CwaAgriReportCard extends HTMLElement {
  setConfig(config) {
    this.config = {
      entity: 'input_text.cwa_agri_report',
      title: '農業氣象報告',
      days: 5,
      ...config,
    };
    if (!this.config.entity) throw new Error('entity is required');
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  getCardSize() {
    return 8;
  }

  _esc(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  _arr(value) {
    return Array.isArray(value) ? value : [];
  }

  _fmtDate(value) {
    if (!value || typeof value !== 'string' || value.length < 10) return '-';
    return `${Number(value.slice(5, 7))}/${Number(value.slice(8, 10))}`;
  }

  _weatherIcon(text) {
    const s = String(text || '');
    if (s.includes('雷')) return '⛈️';
    if (s.includes('雨')) return '🌧️';
    if (s.includes('晴')) return '☀️';
    if (s.includes('雲')) return '⛅';
    return '🌤️';
  }

  _renderList(items, empty = '—') {
    const arr = this._arr(items).filter(Boolean);
    if (!arr.length) return `<div class="muted">${this._esc(empty)}</div>`;
    return `<ul>${arr.map((x) => `<li>${this._esc(x)}</li>`).join('')}</ul>`;
  }

  render() {
    if (!this._hass || !this.config) return;
    const stateObj = this._hass.states[this.config.entity];
    if (!stateObj) {
      this.innerHTML = `<ha-card><div class="pad">找不到 entity：${this._esc(this.config.entity)}</div></ha-card>`;
      return;
    }

    const a = stateObj.attributes || {};
    const fs = a.farmer_summary || {};
    const note = fs.note_section || a.note_section || {};
    const weekly = this._arr(a.weekly_forecast || []).slice(0, this.config.days || 5);
    const warningActions = this._arr(fs.warning_priority_actions).slice(0, 3);
    const liveAlertActions = this._arr(fs.live_alert_actions).slice(0, 5);
    const next3 = this._arr(fs.next_3_day_action_window).slice(0, 3);
    const stageAdvice = this._arr(fs.stage_based_advice).slice(0, 4);
    const riskDrivers = this._arr(fs.risk_drivers).slice(0, 4);
    const weeklyActionFocus = this._arr(a.weekly_action_focus || fs.weekly_action_focus).slice(0, 3);
    const weeklyManagementAdvice = this._arr(a.weekly_management_advice || fs.weekly_management_advice).slice(0, 3);
    const highestRiskDay = a.highest_risk_day || fs.highest_risk_day || null;

    const trend = weekly.length
      ? `本週白天約 ${Math.min(...weekly.map(d => Number(d.maxT || 0)))}~${Math.max(...weekly.map(d => Number(d.maxT || 0)))}°C，夜間 ${Math.min(...weekly.map(d => Number(d.minT || 0)))}~${Math.max(...weekly.map(d => Number(d.minT || 0)))}°C。`
      : '暫無 7 天預報';

    this.innerHTML = `
      <ha-card header="${this._esc(this.config.title)}">
        <div class="card">
          <div class="hero">
            <div class="hero-title">${this._esc(a.risk_icon || '🌱')} ${this._esc(a.farm_name || '農場')}｜${this._esc(a.crop_name || '-')}</div>
            <div class="hero-sub">${this._esc(a.date || '-')}</div>
          </div>

          <div class="banner ${fs.warning_headline ? 'warn' : 'ok'}">
            ${fs.warning_headline
              ? `⚠️ ${this._esc(fs.warning_headline)}${fs.tonight_warning_note ? `<div class="banner-sub">🌙 ${this._esc(fs.tonight_warning_note)}</div>` : ''}`
              : '✅ 今日沒有額外即時警報'}
          </div>

          <section>
            <h3>今日判讀</h3>
            <ul>
              ${fs.headline ? `<li>${this._esc(fs.headline)}</li>` : ''}
              <li>${this._esc(a.current_weather || '-')}｜${this._esc(a.temp_min ?? '-')}°C ~ ${this._esc(a.temp_max ?? '-')}°C</li>
              ${fs.weather ? `<li>${this._esc(fs.weather)}</li>` : ''}
            </ul>
          </section>

          <section>
            <h3>今日建議</h3>
            ${warningActions.length ? this._renderList(warningActions) : '<div class="muted">今日無即時警報，可照原排程作業</div>'}
          </section>

          <section>
            <h3>作業安排</h3>
            <ul>
              ${fs.work_window ? `<li><b>巡田：</b>${this._esc(fs.work_window)}</li>` : ''}
              ${fs.fertilizing_advice ? `<li><b>施肥：</b>${this._esc(fs.fertilizing_advice)}</li>` : ''}
              ${fs.spraying_advice ? `<li><b>噴藥：</b>${this._esc(fs.spraying_advice)}</li>` : ''}
              ${fs.irrigation_advice ? `<li><b>灌溉：</b>${this._esc(fs.irrigation_advice)}</li>` : ''}
            </ul>
          </section>

          <section>
            <h3>近 3 天窗口</h3>
            ${this._renderList(next3, '暫無資料')}
          </section>

          ${liveAlertActions.length ? `
            <section>
              <h3>即時警報動作</h3>
              ${this._renderList(liveAlertActions)}
            </section>
          ` : ''}

          <section>
            <h3>生長狀態</h3>
            <ul>
              <li><b>風險：</b>${this._esc(a.risk_text || '-')}</li>
              <li><b>階段：</b>${this._esc(a.growth_stage || '-')}</li>
              <li><b>本日度日：</b>${this._esc(a.gdd_today ?? '-')} GDD</li>
              <li><b>累計積溫：</b>${this._esc(a.gdd_accumulated ?? '-')} GDD</li>
              <li><b>進度：</b>${this._esc(a.gdd_progress || '-')}</li>
              ${stageAdvice.length ? `<li><b>階段建議：</b>${this._esc(stageAdvice.join('；'))}</li>` : ''}
              ${riskDrivers.length ? `<li><b>風險來源：</b>${this._esc(riskDrivers.join('、'))}</li>` : ''}
            </ul>
          </section>

          <section>
            <h3>本週重點</h3>
            <ul>
              ${weeklyActionFocus.length ? `<li><b>作業重點：</b>${this._esc(weeklyActionFocus.join('；'))}</li>` : ''}
              ${highestRiskDay ? `<li><b>最高風險日：</b>${this._esc(highestRiskDay.summary || highestRiskDay)}</li>` : ''}
              ${weeklyManagementAdvice.length ? `<li><b>管理建議：</b>${this._esc(weeklyManagementAdvice.join('；'))}</li>` : ''}
              ${fs.risk_interpretation ? `<li><b>本週判讀：</b>${this._esc(fs.risk_interpretation)}</li>` : a.risk_interpretation ? `<li><b>本週判讀：</b>${this._esc(a.risk_interpretation)}</li>` : ''}
            </ul>
          </section>

          <section>
            <h3>7 天預報</h3>
            <div class="muted trend">${this._esc(trend)}</div>
            <div class="forecast-grid header">
              <div>項目</div>
              ${weekly.map((d) => `<div>${this._esc(this._fmtDate(d.date))}</div>`).join('')}
            </div>
            <div class="forecast-grid">
              <div>天氣</div>
              ${weekly.map((d) => `<div>${this._weatherIcon(d.weather)} ${this._esc(d.weather || '-')}</div>`).join('')}
            </div>
            <div class="forecast-grid">
              <div>溫度</div>
              ${weekly.map((d) => `<div>${this._esc(d.minT)}~${this._esc(d.maxT)}°C</div>`).join('')}
            </div>
          </section>

          ${note.monitoring_items_text ? `
            <section class="note">
              <div class="note-title">附註說明</div>
              ${note.monitoring_risks_text ? `<div>${this._esc(note.monitoring_risks_text)}</div>` : ''}
              <div>${this._esc(note.monitoring_items_text)}</div>
            </section>
          ` : ''}

          <div class="footer">更新時間：${this._esc(a.issued_at || '-')}</div>
        </div>
      </ha-card>
    `;

    if (!this._styled) {
      const style = document.createElement('style');
      style.textContent = `
        ha-card { display:block; }
        .card { padding: 16px; }
        .hero-title { font-size: 1.15rem; font-weight: 700; }
        .hero-sub, .muted, .footer { color: var(--secondary-text-color); }
        .banner { margin: 12px 0; padding: 10px 12px; border-radius: 12px; font-weight: 600; }
        .banner.ok { background: rgba(56, 142, 60, 0.12); }
        .banner.warn { background: rgba(245, 124, 0, 0.12); }
        .banner-sub { font-weight: 400; margin-top: 4px; }
        section { margin-top: 16px; }
        h3 { margin: 0 0 8px; font-size: 1rem; }
        ul { margin: 0; padding-left: 18px; }
        li { margin: 4px 0; }
        .forecast-grid { display:grid; grid-template-columns: 72px repeat(${Math.max(weekly.length,1)}, minmax(0,1fr)); gap: 6px; font-size: .9rem; margin-top: 6px; }
        .forecast-grid > div { padding: 6px 4px; border-radius: 8px; background: var(--secondary-background-color); text-align:center; }
        .forecast-grid > div:first-child { font-weight: 700; }
        .forecast-grid.header > div { background: transparent; font-weight: 700; }
        .trend { margin-bottom: 8px; }
        .note { margin-top: 18px; font-size: .82rem; color: var(--secondary-text-color); }
        .note-title { font-weight: 700; margin-bottom: 4px; }
        .footer { margin-top: 18px; font-size: .8rem; }
        .pad { padding: 16px; }
      `;
      this.appendChild(style);
      this._styled = true;
    }
  }
}

customElements.define('cwa-agri-report-card', CwaAgriReportCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'cwa-agri-report-card',
  name: 'CWA Agri Report Card',
  description: 'OpenClaw CWA agri report dashboard card',
});
