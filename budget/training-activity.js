/* Read-only activity presentation. Saved workouts remain the single data source. */
(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else {root.TrainingActivity=api;api.install();}
})(typeof window==='undefined'?globalThis:window,function(){
  'use strict';
  var DAY=86400000, state={view:'week',metric:'minutes',offset:0};
  function date(value){
    if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
    var d=new Date(value+'T12:00:00Z');
    return Number.isFinite(+d)&&d.toISOString().slice(0,10)===value?d:null;
  }
  function iso(d){return d.toISOString().slice(0,10);}
  function shift(d,n){return new Date(+d+n*DAY);}
  function monday(d){return shift(d,-((d.getUTCDay()+6)%7));}
  function weekNumber(d){
    var thursday=shift(monday(d),3),year=thursday.getUTCFullYear();
    return Math.round((+monday(d)-+monday(new Date(Date.UTC(year,0,4,12))))/(7*DAY))+1;
  }
  function build(workouts,options){
    options=options||{};
    var today=date(options.today);
    if(!today)throw new Error('A valid local calendar date is required');
    var history=options.view==='history',offset=Math.min(0,Math.trunc(Number(options.offset)||0));
    var endWeek=shift(monday(today),offset*7),start=shift(endWeek,history?-49:0);
    var buckets=Array.from({length:history?8:7},function(_,i){
      var d=shift(start,i*(history?7:1));
      return {date:iso(d),end:iso(shift(d,history?6:0)),label:history?'v'+weekNumber(d):['Mån','Tis','Ons','Tor','Fre','Lör','Sön'][i],
        current:history?iso(d)===iso(monday(today)):iso(d)===iso(today),sessions:0,minutes:0,missing:0};
    });
    (Array.isArray(workouts)?workouts:[]).forEach(function(w){
      var d=w&&date(w.date);if(!d||+d>+today)return;
      var index=Math.floor((+d-+start)/(DAY*(history?7:1)));
      if(index<0||index>=buckets.length)return;
      var b=buckets[index],minutes=Number(w.duration);
      b.sessions++;
      if(w.duration!=null&&w.duration!==''&&Number.isFinite(minutes)&&minutes>=0)b.minutes+=minutes;
      else b.missing++;
    });
    return {buckets:buckets,start:iso(start),end:iso(shift(endWeek,6)),week:weekNumber(endWeek),
      sessions:buckets.reduce(function(n,b){return n+b.sessions;},0),
      minutes:buckets.reduce(function(n,b){return n+b.minutes;},0),
      missing:buckets.reduce(function(n,b){return n+b.missing;},0)};
  }
  function localToday(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function number(n){return new Intl.NumberFormat('sv-SE',{maximumFractionDigits:1}).format(n);}
  function shortDate(value){return new Intl.DateTimeFormat('sv-SE',{day:'numeric',month:'short',timeZone:'UTC'}).format(date(value));}
  function text(id,value){var n=document.getElementById(id);if(n)n.textContent=value;}
  function config(workouts){
    var active=document.documentElement.dataset.trainingOverview==='observatory';
    text('activity-title',active?(state.view==='week'?'Veckans aktivitet':'Veckorytm'):'Träningspass per vecka');
    if(!active)return null;
    var data=build(workouts,{today:localToday(),view:state.view,offset:state.offset});
    var unit=state.metric==='minutes'?'min':'pass';
    text('activity-total',number(data[state.metric]));text('activity-unit',state.metric==='minutes'?'minuter':'pass');
    text('activity-period',(state.view==='week'?'Vecka '+data.week+' · ':'')+shortDate(data.start)+(data.start.slice(0,4)!==data.end.slice(0,4)?' '+data.start.slice(0,4):'')+' – '+shortDate(data.end)+' '+data.end.slice(0,4));
    text('activity-note',state.metric==='minutes'&&data.missing?data.missing+' pass saknar registrerad tid.':data.sessions?data.sessions+' registrerade pass under perioden.':'Inga registrerade pass under perioden.');
    document.querySelectorAll('[data-activity-view]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.activityView===state.view));});
    document.querySelectorAll('[data-activity-metric]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.activityMetric===state.metric));});
    var next=document.getElementById('activity-next'),now=document.getElementById('activity-now');
    if(next)next.disabled=state.offset===0;if(now)now.disabled=state.offset===0;
    var canvas=document.getElementById('chart-sessions');
    canvas.setAttribute('role','img');
    canvas.setAttribute('aria-label',data.buckets.map(function(b){return b.date+(state.view==='history'?' till '+b.end:'')+': '+number(b[state.metric])+' '+unit;}).join('. '));
    return {
      type:'bar',data:{labels:data.buckets.map(function(b){return b.label;}),datasets:[{
        label:state.metric==='minutes'?'Träningstid':'Träningspass',data:data.buckets.map(function(b){return b[state.metric];}),
        borderColor:'#ff657a',borderWidth:0,borderRadius:5,borderSkipped:false,maxBarThickness:8,barPercentage:.55,categoryPercentage:.9,
        backgroundColor:function(context){
          var area=context.chart.chartArea;if(!area)return '#ff657a';
          var current=data.buckets[context.dataIndex]&&data.buckets[context.dataIndex].current;
          var bar=context.chart.getDatasetMeta(0).data[context.dataIndex];
          var top=bar && Number.isFinite(bar.y) ? Math.min(bar.y,area.bottom-1) : area.top;
          var gradient=context.chart.ctx.createLinearGradient(0,top,0,area.bottom);
          gradient.addColorStop(0,current?'#ffe4d6':'#ffb3a5');gradient.addColorStop(.3,current?'#ff9a91':'#ff657a');gradient.addColorStop(1,'#ff657a30');return gradient;
        }
      }]},
      plugins:[{id:'activityGlow',beforeDatasetDraw:function(chart){chart.ctx.save();chart.ctx.shadowColor='#ff657a80';chart.ctx.shadowBlur=14;},afterDatasetDraw:function(chart){chart.ctx.restore();
        var ctx=chart.ctx,meta=chart.getDatasetMeta(0),base=chart.scales.y.getPixelForValue(0);
        ctx.save();ctx.fillStyle='#a8b0ba55';
        meta.data.forEach(function(bar,i){if(chart.data.datasets[0].data[i]===0)ctx.fillRect(bar.x-3,base-2,6,2);});
        ctx.restore();}}],
      options:{responsive:true,maintainAspectRatio:false,animation:matchMedia('(prefers-reduced-motion: reduce)').matches?false:{duration:300},
        layout:{padding:{top:16,right:8,left:4}},interaction:{mode:'index',intersect:false},events:['mousemove','mouseout','click','touchstart','touchmove'],
        plugins:{legend:{display:false},tooltip:{backgroundColor:'#121820',titleColor:'#f2f3f5',bodyColor:'#c5cbd3',borderColor:'#ff657a44',borderWidth:1,padding:12,displayColors:false,
          callbacks:{title:function(items){var b=data.buckets[items[0].dataIndex];return shortDate(b.date)+(state.view==='history'?' – '+shortDate(b.end):'');},label:function(item){return number(item.parsed.y)+' '+unit;}}}},
        scales:{x:{grid:{display:false},border:{display:false},ticks:{font:{family:'Inter',size:12},maxRotation:0,autoSkip:false,color:function(c){return data.buckets[c.index]&&data.buckets[c.index].current?'#ffe4d6':'#a8b0ba';}}},
          y:{beginAtZero:true,suggestedMax:state.metric==='minutes'?30:3,border:{display:false},grid:{color:'#ffffff08'},ticks:{maxTicksLimit:4,precision:0,color:'#a8b0ba',font:{family:'Inter',size:11}}}}
      }
    };
  }
  function install(){
    function bind(){
      var host=document.getElementById('activity-chart');if(!host)return;
      host.addEventListener('click',function(event){
        var b=event.target.closest('button');if(!b||!host.contains(b))return;
        if(b.dataset.activityView)state.view=b.dataset.activityView;
        else if(b.dataset.activityMetric)state.metric=b.dataset.activityMetric;
        else if(b.id==='activity-prev')state.offset-=state.view==='history'?8:1;
        else if(b.id==='activity-next')state.offset=Math.min(0,state.offset+(state.view==='history'?8:1));
        else if(b.id==='activity-now')state.offset=0;
        else return;
        var chart=window.Chart&&Chart.getChart('chart-sessions');
        if(!chart||typeof window.getWorkouts!=='function')return;
        var next=config(window.getWorkouts());if(!next)return;
        chart.data=next.data;chart.options=next.options;
        chart.update();
      });
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
  }
  return {build:build,config:config,install:install};
});
