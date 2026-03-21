# CWA Agri Dashboard

HACS custom card for OpenClaw / Home Assistant agricultural weather reports.

This card is designed for the entity pushed by the OpenClaw CWA skill, typically:

- `sensor.cwa_agri_report`

## Features

- Daily interpretation
- Operation guidance
- 3-day action window
- Weekly focus / highest-risk-day / management advice
- Card-style daily / weekly summary blocks
- 7-day forecast responsive tiles（不再依賴 Markdown 表格）
- Note section for rule-based monitoring items

## Install with HACS

1. Open HACS
2. Add custom repository:
   - URL: `https://github.com/ivanlee1007/cwa-agri-dashboard`
   - Type: `Dashboard`
3. Install **CWA Agri Dashboard**
4. Reload browser

## Lovelace usage

> 建議直接使用這個 custom card，不要再用 Home Assistant 原生 Markdown card 來排 7 天預報表格；窄欄位或某些主題下，Markdown 表格容易變形。


### Minimal card

```yaml
type: custom:cwa-agri-report-card
entity: sensor.cwa_agri_report
title: 藍莓農場氣象儀表板
```

### Example dashboard card

```yaml
type: vertical-stack
cards:
  - type: custom:cwa-agri-report-card
    entity: sensor.cwa_agri_report
    title: 呼密·藍莓農場
```

## Included files

- `dist/cwa-agri-dashboard.js` — HACS frontend card
- `examples/dashboard.yaml` — example dashboard snippet

## Data source expectations

The card reads attributes from the target entity, for example:

- `farm_name`
- `crop_name`
- `risk_icon`
- `current_weather`
- `temp_min`, `temp_max`
- `weekly_forecast`
- `farmer_summary`
- `warning_headline`
- `weekly_action_focus`
- `highest_risk_day`
- `weekly_management_advice`

This matches the output currently pushed by the OpenClaw CWA report scripts.
