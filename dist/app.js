const $ = id => document.getElementById(id);
const everyday = [
  'Morning light spills across the desk. A pencil rolls toward an open notebook and settles beside a small sketch of the garden. Beyond the window a sparrow lands on the fence.',
  'The last train glides out of the station as the sky turns blue. A baker across the street hangs a paper sign in the window and opens the door to the morning air.',
  'A narrow trail follows the river past a quiet field. Flat stones catch the light along the bank. A silver fish breaks the surface and leaves a ring behind.',
  'Rain taps against the studio roof while two friends sort their prints. Each sheet holds a different shade of green. They hang the brightest one beside the door.'
];
const tracks = {
  "punctuation": [
    "Wait, said the editor. Which title fits best: A Quiet Room, or The Open Door? She read both aloud before choosing.",
    "The note on the fridge read, \"Leave a light on.\" By dusk, every window on the block was glowing.",
    "A single comma changed the invitation. Instead of bringing bread, cheese and fruit, Lee brought bread, cheese, and a fruit tart.",
    "Did you pack the map? I checked my coat, the desk, and the kitchen shelf. There it was: tucked inside yesterday's paper.",
    "Sam's draft had three parts: the arrival, the delay, and the journey home. He cut the last paragraph twice.",
    "One bag held pens; another held clips. The smallest pocket, hidden under the flap, held a key."
  ],
  "numbers": [
    "Order 714 contains 12 notebooks at $3.50 each. The packing slip lists shelf B4 and a total of $42.00.",
    "Train 208 leaves at 7:45 and arrives at 9:10. Our seats are in row 14, just past the cafe.",
    "At 8:05 the counter showed 125 entries. By 8:35 it had reached 149, a gain of 24 in half an hour.",
    "Label the first box A-17 and the next one B-24. Each should weigh 2.5 pounds before the seal goes on.",
    "The reading log starts on page 36. Read through page 48, then enter 13 in the total column.",
    "Our recipe uses 250 grams of flour and 125 grams of butter. Bake the small batch for 18 minutes."
  ],
  "everyday": [
    "A red umbrella stood beside the library door. Its owner had left a folded note inside the handle so the next visitor could return it.",
    "The market closed early when a gentle rain crossed the square. One last customer tucked a bunch of mint into her canvas bag.",
    "Before the guests arrived, Liam moved the table near the window. The evening light made even the plain white cups look warm.",
    "The bicycle bell rang twice outside the gate. Ella set down her brush and leaned out to see who had come."
  ]
};
tracks.everyday = everyday.concat(tracks.everyday);
const input = $('entry');
let seconds = 180, limit, source, previous, attempts, mistakes, missed, start, timer, result, drillWords, offset = 0;
let chars = [], expected = [], records = [];
try { records = JSON.parse(localStorage.getItem('keystill-history') || '[]'); if (!Array.isArray(records)) records=[]; } catch {}
const keys = {};
for (const letters of ['QWERTYUIOP','ASDFGHJKL','ZXCVBNM']) {
  const row = document.createElement('div'); row.className='row';
  for (const letter of letters) {const key=document.createElement('kbd');key.textContent=letter;row.append(key);keys[letter]=key;}
  $('keyboard').append(row);
}
function addPassage() {
  const chunk = drillWords ? drillWords.join(' ') : tracks[$('track').value][offset++ % tracks[$('track').value].length];
  const addition = chunk + ' ';
  source += addition;
  for (const word of chunk.split(' ')) {
    const group=document.createElement('span');group.className='word';
    for(const letter of word){const s=document.createElement('span');s.textContent=letter;group.append(s);chars.push(s);expected.push(word);}
    $('lines').append(group);
    const space=document.createElement('span');space.textContent=' ';$('lines').append(space);chars.push(space);expected.push(word);
  }
}
function reset(words=null) {
  clearInterval(timer);$('track').disabled=!!words;drillWords=words;limit=words?60:seconds;
  start=null;result=null;source='';chars=[];expected=[];previous='';attempts=0;mistakes=0;missed=new Set();
  input.value='';input.disabled=false;$('goal').disabled=false;$('times').hidden=!!words;
  $('lines').replaceChildren();$('lines').style.transform='';addPassage();addPassage();chars[0].className='caret';
  $('accessible').textContent=source;$('round').textContent=words?'Missed-word practice':'Timed practice';
  $('status').textContent='Click the passage and start typing';$('out').hidden=true;
  Object.values(keys).forEach(k=>k.classList.remove('keyOn'));update();
}
function stats(elapsed) {
  let correct=0;for(let i=0;i<input.value.length;i++) if(input.value[i]===source[i]) correct++;
  return {wpm:elapsed?Math.round(correct*12/elapsed):0,accuracy:attempts?Math.round(100*(attempts-mistakes)/attempts):null};
}
function update() {
  const elapsed=start===null?0:Math.min(limit,(performance.now()-start)/1000);
  const left=Math.ceil(limit-elapsed);$('clock').textContent=Math.floor(left/60)+':'+String(left%60).padStart(2,'0');
  const data=stats(elapsed);$('speed').textContent=data.wpm;$('accuracy').textContent=data.accuracy===null?'—':data.accuracy+'%';
  if(start!==null && elapsed>=limit && !result) finish(data);
}
function finish(data) {
  clearInterval(timer);input.disabled=true;$('track').disabled=false;$('goal').disabled=false;
  const target=parseInt($('goal').value);result={...data,date:new Date().toISOString(),target,limit,mode:drillWords?'Missed-word practice':$('track').selectedOptions[0].textContent};
  records.unshift(result);records=records.slice(0,50);
  try{localStorage.setItem('keystill-history',JSON.stringify(records));}catch{}
  $('status').textContent='Session complete';$('summary').textContent=data.wpm>=target?'Target reached at '+data.wpm+' WPM':(target-data.wpm)+' WPM to your target';
  $('drill').hidden=!missed.size;$('out').hidden=false;$('out').scrollIntoView({block:'nearest'});
}
input.onbeforeinput=e=>{if(e.inputType==='insertFromPaste'||e.inputType==='insertFromDrop') e.preventDefault();};
input.onpaste=input.ondrop=e=>e.preventDefault();
input.oninput=()=>{
  if(result)return;
  if(start!==null && performance.now()-start>=limit*1000){input.value=previous;update();return;}
  const value=input.value;if(start===null && value.length){start=performance.now();$('track').disabled=true;timer=setInterval(update,150);$('goal').disabled=true;$('status').textContent='Session in progress';}
  while(value.length+70>=source.length)addPassage();
  let same=0;while(same<previous.length && same<value.length && value[same]===previous[same])same++;
  for(let i=same;i<value.length;i++){attempts++;if(value[i]!==source[i]){mistakes++;missed.add(expected[i]);}}
  for(let i=same;i<=Math.max(previous.length,value.length);i++) chars[i].className=i===value.length?'caret':i>value.length?'':value[i]===source[i]?'ok':'bad';
  const current=chars[value.length];$('lines').style.transform='translateY(-'+Math.max(0,current.offsetTop-chars[0].offsetTop-48)+'px)';
  Object.values(keys).forEach(k=>k.classList.remove('keyOn'));keys[source[value.length].toUpperCase()]?.classList.add('keyOn');
  previous=value;input.setSelectionRange(value.length,value.length);update();
};
input.onkeydown=e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))e.preventDefault();};
input.onclick=()=>input.setSelectionRange(input.value.length,input.value.length);
$('times').onclick=e=>{if(!e.target.dataset.sec)return;seconds=Number(e.target.dataset.sec);for(const b of $('times').children)b.setAttribute('aria-pressed',b===e.target);reset();input.focus();};
$('restart').onclick=()=>{reset(drillWords);input.focus();};
$('again').onclick=()=>{reset();input.focus();};
$('drill').onclick=()=>{reset([...missed]);input.focus();};
$('download').onclick=()=>{
  if(!result)return;const c=document.createElement('canvas');c.width=1080;c.height=560;const ctx=c.getContext('2d');
  ctx.fillStyle='#202521';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#c8eea5';ctx.font='bold 40px sans-serif';ctx.fillText('Keystill',60,80);
  ctx.font='bold 100px monospace';ctx.fillText(result.wpm+' WPM',60,245);ctx.fillStyle='#edefe8';ctx.font='32px sans-serif';
  ctx.fillText(result.accuracy+'% accuracy   ·   '+result.limit/60+' min   ·   Target '+result.target+' WPM',60,335);
  ctx.fillText(result.mode+'   ·   '+new Date(result.date).toLocaleDateString(),60,450);
  const a=document.createElement('a');a.download='keystill-result.png';a.href=c.toDataURL('image/png');a.click();
};
function showHistory(show){
  $('practice').hidden=show;$('history').hidden=!show;$('studio').classList.toggle('active',!show);$('past').classList.toggle('active',show);
  $('records').replaceChildren();if(!records.length)$('records').textContent='Finish a timed session to see your first result here.';
  for(const r of records){const d=document.createElement('div');d.className='record';d.textContent=new Date(r.date).toLocaleDateString()+' · '+r.mode+' · '+r.wpm+' WPM · '+r.accuracy+'% accuracy · '+r.limit/60+' min';$('records').append(d);}
}
$('track').onchange=()=>{offset=0;reset();input.focus();};
$('clear').onclick=()=>{
  if (!records.length || !confirm('Delete all typing results saved in this browser?')) return;
  try { localStorage.removeItem('keystill-history'); }
  catch { $('clearStatus').textContent='Browser storage is unavailable. Clear site data in your browser settings.'; return; }
  records=[];showHistory(true);$('clearStatus').textContent='Saved history cleared.';
};
$('past').onclick=()=>showHistory(true);$('studio').onclick=()=>showHistory(false);
reset();

