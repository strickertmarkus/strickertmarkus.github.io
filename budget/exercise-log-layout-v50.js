(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exerciseLogLayoutV50Installed) return;
  window.__exerciseLogLayoutV50Installed = true;

  function isMobile() {
    return !!(window.matchMedia && window.matchMedia('(max-width:600px)').matches);
  }

  function addStyles() {
    if (document.getElementById('exercise-log-layout-v50-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-log-layout-v50-style';
    style.textContent = `
      html body .log-pulse-interval-v9 .pulse-unit-label-v49 {
        fill:#FCA5A5 !important;
        font-weight:850 !important;
        font-size:5.9px !important;
        letter-spacing:.08px !important;
      }
      html body .log-pace-interval-v37 .pace-goal-label-v49 {
        fill:#6EE7B7 !important;
        font-weight:850 !important;
        letter-spacing:.05px !important;
      }

      @media(max-width:600px) {
        html body .log-detail-head-v7 {
          display:grid !important;
          grid-template-columns:minmax(0,1fr) 32px !important;
          align-items:start !important;
          gap:4px !important;
        }
        html body .log-detail-copy-v8 {
          position:relative !important;
          display:block !important;
          width:100% !important;
          max-width:none !important;
          min-width:0 !important;
        }
        html body .log-detail-copy-v8 > strong {
          display:block !important;
          width:max-content !important;
          max-width:100% !important;
          min-width:0 !important;
          min-height:16px !important;
          margin:0 0 6px !important;
          padding:0 !important;
          overflow:hidden !important;
          text-overflow:ellipsis !important;
          white-space:nowrap !important;
        }
        html body .log-detail-meta-v8 {
          display:grid !important;
          grid-template-columns:repeat(3,minmax(0,1fr)) !important;
          grid-template-rows:48px !important;
          column-gap:9px !important;
          row-gap:0 !important;
          width:100% !important;
          max-width:none !important;
          min-width:0 !important;
          align-items:start !important;
          padding-top:1px !important;
          overflow:visible !important;
        }
        html body .log-detail-meta-v8 .log-meta-date-v8,
        html body .log-detail-meta-v8 .log-meta-time-v8 {
          position:absolute !important;
          right:auto !important;
          width:auto !important;
          min-width:0 !important;
          margin:0 !important;
          white-space:nowrap !important;
          font-size:10px !important;
          font-weight:850 !important;
          line-height:1 !important;
          text-align:left !important;
        }
        html body .log-detail-meta-v8 .log-meta-date-v8 { color:#67E8F9 !important; }
        html body .log-detail-meta-v8 .log-meta-time-v8 { color:#FDBA74 !important; }

        html body .log-detail-meta-v8 .log-pulse-interval-v9 { grid-column:1 !important;grid-row:1 !important; }
        html body .log-detail-meta-v8 .log-vo2-goal-v36 { grid-column:2 !important;grid-row:1 !important; }
        html body .log-detail-meta-v8 .log-pace-interval-v37 { grid-column:3 !important;grid-row:1 !important; }

        html body .log-detail-meta-v8 .log-pulse-interval-v9,
        html body .log-detail-meta-v8 .log-vo2-goal-v36,
        html body .log-detail-meta-v8 .log-pace-interval-v37 {
          display:flex !important;
          align-items:flex-start !important;
          justify-content:center !important;
          width:100% !important;
          min-width:0 !important;
          max-width:none !important;
          height:48px !important;
          margin:0 !important;
          overflow:visible !important;
        }
        html body .log-detail-meta-v8 .log-pulse-interval-v9 svg,
        html body .log-detail-meta-v8 .log-vo2-goal-v36 svg,
        html body .log-detail-meta-v8 .log-pace-interval-v37 svg {
          display:block !important;
          width:100% !important;
          min-width:0 !important;
          max-width:none !important;
          height:48px !important;
          overflow:visible !important;
          transform:none !important;
        }
        html body .log-detail-meta-v8 .log-pulse-interval-v9 text,
        html body .log-detail-meta-v8 .log-vo2-goal-v36 text,
        html body .log-detail-meta-v8 .log-pace-interval-v37 text {
          font-size:7.5px !important;
        }
        html body .log-detail-meta-v8 .log-pulse-interval-v9 .pulse-unit-label-v49 {
          font-size:5.9px !important;
        }
        html body .log-detail-actions-v8 {
          width:32px !important;
          min-width:32px !important;
          display:flex !important;
          justify-content:flex-end !important;
          align-items:flex-start !important;
          align-self:start !important;
          justify-self:end !important;
          gap:0 !important;
        }
        html body .log-add-workout-v8 {
          width:32px !important;
          height:32px !important;
          flex:0 0 32px !important;
        }
      }

      @media(max-width:380px) {
        html body .log-detail-box { padding-left:7px !important;padding-right:7px !important; }
        html body .log-detail-copy-v8 > strong { margin-bottom:5px !important; }
        html body .log-detail-meta-v8 { grid-template-rows:43px !important;column-gap:6px !important; }
        html body .log-detail-meta-v8 .log-meta-date-v8,
        html body .log-detail-meta-v8 .log-meta-time-v8 { font-size:8.5px !important; }
        html body .log-detail-meta-v8 .log-pulse-interval-v9,
        html body .log-detail-meta-v8 .log-vo2-goal-v36,
        html body .log-detail-meta-v8 .log-pace-interval-v37,
        html body .log-detail-meta-v8 .log-pulse-interval-v9 svg,
        html body .log-detail-meta-v8 .log-vo2-goal-v36 svg,
        html body .log-detail-meta-v8 .log-pace-interval-v37 svg { height:43px !important; }
        html body .log-detail-meta-v8 .log-pulse-interval-v9 text,
        html body .log-detail-meta-v8 .log-vo2-goal-v36 text,
        html body .log-detail-meta-v8 .log-pace-interval-v37 text { font-size:6.7px !important; }
        html body .log-detail-meta-v8 .log-pulse-interval-v9 .pulse-unit-label-v49 { font-size:5.4px !important; }
      }
    `;
    document.head.appendChild(style);
  }

  function setAttr(node,name,value) {
    if (node) node.setAttribute(name,String(value));
  }

  function setAttrAll(svg,selector,name,value) {
    svg.querySelectorAll(selector).forEach(function (node) { setAttr(node,name,value); });
  }

  function upsertSvgText(svg,className,x,y,anchor,text) {
    if (!svg) return null;
    var node = svg.querySelector('.' + className);
    if (!node) {
      node = document.createElementNS('http://www.w3.org/2000/svg','text');
      node.setAttribute('class',className);
      svg.appendChild(node);
    }
    setAttr(node,'x',x);
    setAttr(node,'y',y);
    setAttr(node,'text-anchor',anchor || 'middle');
    node.textContent = text;
    return node;
  }

  function normalizePulse(svg) {
    svg.setAttribute('viewBox','0 0 84 34');
    setAttrAll(svg,'.pulse-range-v9','y1',12);
    setAttrAll(svg,'.pulse-range-v9','y2',12);
    setAttrAll(svg,'.pulse-cap-v9','y1',7);
    setAttrAll(svg,'.pulse-cap-v9','y2',17);
    setAttrAll(svg,'.pulse-edge-v9,.pulse-average-v9','cy',12);
    svg.querySelectorAll('text').forEach(function (node) {
      if (!node.classList.contains('pulse-unit-label-v49')) setAttr(node,'y',29);
    });
    upsertSvgText(svg,'pulse-unit-label-v49',42,2.0,'middle','bpm');
  }

  function mapVo2X(value) {
    return 8 + (value - 8) * (68 / 76);
  }

  function normalizeVo2(svg) {
    if (svg.dataset.logVo2WidthNormalizedV50 !== 'true') {
      svg.querySelectorAll('line,circle,text').forEach(function (node) {
        ['x','x1','x2','cx'].forEach(function (attr) {
          var raw = node.getAttribute(attr);
          if (raw === null) return;
          var value = Number(raw);
          if (!Number.isFinite(value)) return;
          setAttr(node,attr,mapVo2X(value).toFixed(2));
        });
      });
      svg.dataset.logVo2WidthNormalizedV50 = 'true';
    }
    svg.setAttribute('viewBox','0 0 84 34');
    setAttrAll(svg,'.vo2-track-v36','y1',12);
    setAttrAll(svg,'.vo2-track-v36','y2',12);
    setAttrAll(svg,'.vo2-goal-cap-v36','y1',7);
    setAttrAll(svg,'.vo2-goal-cap-v36','y2',17);
    setAttrAll(svg,'.vo2-value-dot-v36,.vo2-goal-dot-v36','cy',12);
    setAttrAll(svg,'.vo2-value-label-v36','y',4.5);
    setAttrAll(svg,'.vo2-floor-label-v36,.vo2-goal-label-v36','y',29);
  }

  function normalizePace(svg) {
    svg.setAttribute('viewBox','0 0 84 34');
    setAttrAll(svg,'.pace-range-v37','y1',12);
    setAttrAll(svg,'.pace-range-v37','y2',12);
    setAttrAll(svg,'.pace-cap-v37','y1',7);
    setAttrAll(svg,'.pace-cap-v37','y2',17);
    setAttrAll(svg,'.pace-edge-v37,.pace-average-v37','cy',12);
    svg.querySelectorAll('.pace-average-label-v37').forEach(function (node) {
      setAttr(node,'y',/min\/km/i.test(String(node.textContent || '')) ? 29 : 4.5);
    });
    upsertSvgText(svg,'pace-goal-label-v49',76,29,'end','4 mål');
  }

  function syncGraphGeometry() {
    if (!isMobile()) return;
    document.querySelectorAll('.log-pulse-interval-v9 svg').forEach(normalizePulse);
    document.querySelectorAll('.log-vo2-goal-v36 svg').forEach(normalizeVo2);
    document.querySelectorAll('.log-pace-interval-v37 svg').forEach(normalizePace);
  }

  function syncHeaderMetaPositions() {
    if (!isMobile()) return;
    document.querySelectorAll('.log-detail-copy-v8').forEach(function (copy) {
      var title = copy.querySelector(':scope > strong');
      var date = copy.querySelector('.log-meta-date-v8');
      var time = copy.querySelector('.log-meta-time-v8');
      if (!title || !date || !time) return;

      var copyRect = copy.getBoundingClientRect();
      var dateWidth = date.getBoundingClientRect().width || 34;
      var timeWidth = time.getBoundingClientRect().width || 40;
      var reserved = dateWidth + timeWidth + 26;
      var maxTitleWidth = Math.max(70,copyRect.width - reserved);
      title.style.setProperty('max-width',maxTitleWidth + 'px','important');

      var titleRect = title.getBoundingClientRect();
      var dateLeft = Math.max(0,titleRect.right - copyRect.left + 10);
      date.style.setProperty('left',dateLeft + 'px','important');
      date.style.setProperty('right','auto','important');

      var dateRect = date.getBoundingClientRect();
      var timeLeft = Math.max(dateLeft + dateWidth + 8,dateRect.right - copyRect.left + 8);
      time.style.setProperty('left',timeLeft + 'px','important');
      time.style.setProperty('right','auto','important');

      dateRect = date.getBoundingClientRect();
      var timeRect = time.getBoundingClientRect();
      var titleCenter = (titleRect.top - copyRect.top) + titleRect.height / 2;
      date.style.setProperty('top',Math.max(0,titleCenter - dateRect.height / 2) + 'px','important');
      time.style.setProperty('top',Math.max(0,titleCenter - timeRect.height / 2) + 'px','important');
    });
  }

  var scheduled = false;
  function scheduleSync() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false;
      syncGraphGeometry();
      syncHeaderMetaPositions();
    });
  }

  function install() {
    addStyles();
    scheduleSync();
    setTimeout(scheduleSync,80);
    setTimeout(scheduleSync,350);

    var root = document.querySelector('.log-wrap') || document.body || document.documentElement;
    if (root) {
      var observer = new MutationObserver(scheduleSync);
      observer.observe(root,{subtree:true,childList:true});
    }
    window.addEventListener('resize',scheduleSync);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
