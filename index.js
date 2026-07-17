const express = require('express');
const app = express();

let pendingCmd = null;

app.get('/toy-cmd', (req, res) => {
  const { secret, action, ...p } = req.query;
  if (secret !== 'babyrin99') return res.status(403).send('no');
  if (action === 'speed') pendingCmd = { speed: parseFloat(p.value), sec: p.sec ? parseFloat(p.sec) : null };
  else if (action === 'stop') pendingCmd = { stop: true };
  else if (action === 'raw') pendingCmd = { raw: p.hex };
  res.send('ok');
});

app.get('/toy-next', (req, res) => {
  const cmd = pendingCmd;
  pendingCmd = null;
  res.json(cmd || {});
});

app.get('/panel', (req, res) => {
  res.send(`<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<title>controller</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui;background:#0a0a0a;color:#eee;min-height:100vh;padding:20px;
user-select:none;-webkit-user-select:none}
h1{text-align:center;font-size:18px;margin-bottom:20px;color:#666}
.sec{background:#1a1a1a;border-radius:16px;padding:20px;margin-bottom:14px}
.label{font-size:12px;color:#555;letter-spacing:1px;margin-bottom:10px}
.val{text-align:center;font-size:52px;font-weight:200;color:#4a9eff;margin-bottom:6px}
input[type=range]{-webkit-appearance:none;width:100%;height:8px;border-radius:4px;background:#333;outline:none}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:34px;height:34px;border-radius:50%;background:#4a9eff;cursor:pointer}
.grid{display:grid;gap:8px;margin-top:10px}
.g4{grid-template-columns:repeat(4,1fr)}
.g3{grid-template-columns:repeat(3,1fr)}
.g2{grid-template-columns:repeat(2,1fr)}
.grid button{padding:13px 0;border:none;border-radius:10px;font-size:14px;cursor:pointer;
background:#2a2a2a;color:#ccc;transition:all .12s}
.grid button:active{transform:scale(.95)}
.grid button.on{background:#4a9eff;color:#fff}
#btn-stop{width:100%;padding:18px;border:none;border-radius:14px;font-size:18px;font-weight:600;
cursor:pointer;background:#ff3b3b;color:#fff}
#btn-stop:active{transform:scale(.97);background:#cc0000}
.status{text-align:center;font-size:12px;color:#444;margin-top:10px}
</style></head><body>
<h1>toy controller</h1>

<div class="sec">
<div class="label">强度</div>
<div class="val" id="vd">0%</div>
<input type="range" id="sl" min="0" max="100" value="0">
<div class="grid g4" style="margin-top:12px">
<button onclick="ss(0)">关</button>
<button onclick="ss(25)">轻</button>
<button onclick="ss(50)">中</button>
<button onclick="ss(75)">强</button>
</div>
<div class="grid" style="margin-top:8px;grid-template-columns:1fr">
<button onclick="ss(100)" style="background:#4a9eff33;color:#4a9eff">全 力</button>
</div>
</div>

<div class="sec">
<div class="label">花样</div>
<div class="grid g3">
<button id="p-pulse" onclick="sp('pulse')">脉冲</button>
<button id="p-wave" onclick="sp('wave')">波浪</button>
<button id="p-climb" onclick="sp('climb')">渐强</button>
<button id="p-tease" onclick="sp('tease')">挑逗</button>
<button id="p-storm" onclick="sp('storm')">风暴</button>
<button id="p-random" onclick="sp('random')">随机</button>
</div>
</div>

<div style="padding:0">
<button id="btn-stop" onclick="stp()">停 止</button>
</div>
<div class="status" id="st">就绪</div>

<script>
const B=location.origin,S='babyrin99';
let pt=null,sl=document.getElementById('sl'),vd=document.getElementById('vd'),st=document.getElementById('st'),sdt=null;

sl.addEventListener('input',()=>{
  let v=sl.value;vd.textContent=v+'%';
  vd.style.color=v>75?'#ff4a4a':v>40?'#ffaa00':'#4a9eff';
  clearTimeout(sdt);sdt=setTimeout(()=>{cp();cmd('speed',v/100)},80);
});

function ss(v){sl.value=v;vd.textContent=v+'%';vd.style.color=v>75?'#ff4a4a':v>40?'#ffaa00':'#4a9eff';cp();cmd('speed',v/100)}
function stp(){cp();sl.value=0;vd.textContent='0%';vd.style.color='#4a9eff';cmd('stop',0)}

function cmd(a,v){
  fetch(B+'/toy-cmd?secret='+S+'&action='+a+'&value='+v)
  .then(()=>{st.textContent=a==='stop'?'已停止':'强度 '+Math.round(v*100)+'%'})
  .catch(()=>{st.textContent='发送失败'});
}

function cp(){if(pt){clearInterval(pt);pt=null}document.querySelectorAll('.grid button').forEach(b=>b.classList.remove('on'))}

function sp(n){
  cp();document.getElementById('p-'+n).classList.add('on');
  let t=0;const r=()=>{let v=0;
  switch(n){
    case'pulse':v=t%2?.8:0;break;
    case'wave':v=(Math.sin(t*.3)+1)/2;break;
    case'climb':v=Math.min(t*.04,1);break;
    case'tease':v=t%6<2?.25+Math.random()*.2:0;break;
    case'storm':v=.7+Math.random()*.3;break;
    case'random':v=Math.random();break;
  }
  v=Math.round(v*100)/100;cmd('speed',v);
  sl.value=Math.round(v*100);vd.textContent=Math.round(v*100)+'%';t++;};
  r();pt=setInterval(r,n==='pulse'?500:n==='tease'?400:600);
}
</script></body></html>`);
});

app.listen(process.env.PORT || 3000, () => console.log('running'));

