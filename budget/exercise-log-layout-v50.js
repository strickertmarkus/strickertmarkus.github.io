(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exerciseLogLayoutV50Installed) return;
  window.__exerciseLogLayoutV50Installed = true;

  function addStyles() {
    if (document.getElementById('exercise-log-layout-v50-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-log-layout-v50-style';
    style.textContent = `
      html body .log-pulse-interval-v9 .pulse-unit-label-v49 {
        fill:#FCA5A5 !important;
        font-weight:850 !important;
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
          min-width:0 !important;
          min-height:16px !important;
          margin:0 0 6px !important;
          padding-right:94px !important;
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
          align-items:center !important;
          overflow:visible !important;
        }
        html body .log-detail-meta-v8 .log-meta-date-v8 {
          position:absolute !important;
          top:2px !important;
          right:48px !important;
          width:auto !important;
          min-width:0 !important;
          margin:0 !important;
          white-space:nowrap !important;
          color:#67E8F9 !important;
          font-size:10px !important;
          font-weight:850 !important;
          line-height:1 !important;
          text-align:right !important;
        }
        html body .log-detail-meta-v8 .log-meta-time-v8 {
          position:absolute !important;
          top:2px !important;
          right:0 !important;
          width:auto !important;
          min-width:0 !important;
          margin:0 !important;
          white-space:nowrap !important;
          color:#FDBA74 !important;
          font-size:10px !important;
          font-weight:850 !important;
          line-height:1 !important;
          text-align:right !important;
        }
        html body .log-detail-meta-v8 .log-pulse-interval-v9 {
          grid-column:1 !important;
          grid-row:1 !important;
        }
        html body .log-detail-meta-v8 .log-vo2-goal-v36 {
          grid-column:2 !important;
          grid-row:1 !important;
        }
        html body .log-detail-meta-v8 .log-pace-interval-v37 {
          grid-column:3 !important;
          grid-row:1 !important;
        }
        html body .log-detail-meta-v8 .log-pulse-interval-v9,
        html body .log-detail-meta-v8 .log-vo2-goal-v36,
        html body .log-detail-meta-v8 .log-pace-interval-v37 {
          display:flex !important;
          align-items:center !important;
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
        }
        html body .log-detail-meta-v8 .log-pulse-interval-v9 text,
        html body .log-detail-meta-v8 .log-vo2-goal-v36 text,
        html body .log-detail-meta-v8 .log-pace-interval-v37 text {
          font-size:7.5px !important;
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
        html body .log-detail-box {
          padding-left:7px !important;
          padding-right:7px !important;
        }
        html body .log-detail-copy-v8 > strong {
          padding-right:86px !important;
          margin-bottom:5px !important;
        }
        html body .log-detail-meta-v8 {
          grid-template-rows:43px !important;
          column-gap:6px !important;
        }
        html body .log-detail-meta-v8 .log-meta-date-v8 {
          right:44px !important;
          font-size:8.5px !important;
        }
        html body .log-detail-meta-v8 .log-meta-time-v8 {
          font-size:8.5px !important;
        }
        html body .log-detail-meta-v8 .log-pulse-interval-v9,
        html body .log-detail-meta-v8 .log-vo2-goal-v36,
        html body .log-detail-meta-v8 .log-pace-interval-v37,
        html body .log-detail-meta-v8 .log-pulse-interval-v9 svg,
        html body .log-detail-meta-v8 .log-vo2-goal-v36 svg,
        html body .log-detail-meta-v8 .log-pace-interval-v37 svg {
          height:43px !important;
        }
        html body .log-detail-meta-v8 .log-pulse-interval-v9 text,
        html body .log-detail-meta-v8 .log-vo2-goal-v36 text,
        html body .log-detail-meta-v8 .log-pace-interval-v37 text {
          font-size:6.7px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureSvgRoom(svg) {
    if (!svg) return;
    var parts = String(svg.getAttribute('viewBox') || '').trim().split(/\s+/);
    if (parts.length !== 4) return;
    var height = Number(parts[3]);
    if (!Number.isFinite(height) || height >= 34) return;
    svg.setAttribute('viewBox', parts[0] + ' ' + parts[1] + ' ' + parts[2] + ' 34');
  }

  function upsertSvgText(svg,className,x,y,anchor,text) {
    if (!svg) return;
    var node = svg.querySelector('.' + className);
    if (!node) {
      node = document.createElementNS('http://www.w3.org/2000/svg','text');
      node.setAttribute('class',className);
      svg.appendChild(node);
    }
    node.setAttribute('x',String(x));
    node.setAttribute('y',String(y));
    node.setAttribute('text-anchor',anchor || 'middle');
    node.textContent = text;
  }

  function syncGraphLabels() {
    document.querySelectorAll('.log-pulse-interval-v9 svg').forEach(function (svg) {
      ensureSvgRoom(svg);
      upsertSvgText(svg,'pulse-unit-label-v49',42,31.5,'middle','bpm');
    });
    document.querySelectorAll('.log-pace-interval-v37 svg').forEach(function (svg) {
      ensureSvgRoom(svg);
      upsertSvgText(svg,'pace-goal-label-v49',76,31.5,'end','4 mål');
    });
  }

  var scheduled = false;
  function scheduleSync() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false;
      syncGraphLabels();
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
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
