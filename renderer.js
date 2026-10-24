const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
let xp = 0, coins = 0, currentGame = 'home', cleanupGame = null;
const pageTitles = {home:'Choose your next adventure',snake:'Snake Battle', '2048':'2048',brick:'Brick Breaker',grammar:'Grammar Rush',settings:'Settings & Performance'};
function addRewards(amount, coinAmount=1){if(settings.sfx)tone(740,.045,'sine',.025);xp+=amount;coins+=coinAmount;$('#xpTotal').textContent=xp;$('#coinTotal').textContent=coins;const level=Math.floor(xp/100)+1;$('#levelText').textContent='LEVEL '+level;$('#xpBar').style.width=(xp%100)+'%';$('#xpText').textContent=(xp%100)+' / 100 XP to next level';}
function stopGame(){if(cleanupGame){cleanupGame();cleanupGame=null;} $('#gameArea').innerHTML='';}
function showPage(page){stopGame();currentGame=page;$('#homePage').classList.toggle('hidden',page!=='home');$('#gamePage').classList.add('hidden');$('#settingsPage').classList.toggle('hidden',page!=='settings');$('#pageTitle').textContent=pageTitles[page]||pageTitles.home;$$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page===page));if(page==='settings')refreshNetwork();}
function goHome(){showPage('home');}
function launch(game){if(game==='settings'){showPage('settings');return;}stopGame();currentGame=game;$('#homePage').classList.add('hidden');$('#settingsPage').classList.add('hidden');$('#gamePage').classList.remove('hidden');$('#pageTitle').textContent=pageTitles[game];$$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page===game));$('#gameStatus').textContent='READY TO PLAY';$('#restartBtn').onclick=()=>launch(game);if(game==='snake')renderSnake();if(game==='2048')render2048();if(game==='brick')renderBrick();if(game==='grammar')renderGrammar();}
$$('[data-page]').forEach(b=>b.addEventListener('click',()=>b.dataset.page==='home'?goHome():launch(b.dataset.page)));
$$('[data-launch]').forEach(b=>b.addEventListener('click',()=>launch(b.dataset.launch)));
$('#backHome').addEventListener('click',goHome);

function renderSnake(){
 $('#gameIntro').innerHTML='<h2>Snake Battle <span style="color:#55e6e9">/ AI Arena</span></h2><p>Eat glowing orbs, grow longer, and bait AI snakes into crashing into your body. Your head must avoid every snake body.</p><div class="mode-row"><button class="mode-btn selected" data-mode="easy">🟢 Easy</button><button class="mode-btn" data-mode="hard">🟠 Hard</button><button class="mode-btn" data-mode="devil">😈 Devil</button></div>';
 $('#gameArea').innerHTML='<div class="snake-layout"><div><canvas id="snakeCanvas" class="snake-board" width="600" height="420"></canvas><div class="game-actions"><button class="game-btn" id="snakeStart">▶ Start battle</button><button class="game-btn alt" id="snakePause">Ⅱ Pause</button></div><div class="touch-controls"><button data-dir="up">▲</button><button data-dir="left">◀</button><button data-dir="down">▼</button><button data-dir="right">▶</button></div></div><div class="side-panel"><div class="mini-stat"><small>YOUR LENGTH</small><b id="snakeLength">5</b></div><div class="mini-stat"><small>AI SNAKES LEFT</small><b id="snakeEnemies">6</b></div><div class="mini-stat"><small>ORBS EATEN</small><b id="snakeEaten">0</b></div><div class="mini-stat"><small>DIFFICULTY</small><b id="snakeMode">EASY</b><p class="mode-description" id="modeDescription">Slower AI and fewer opponents. Great for learning the controls.</p></div><div class="mode-description">Controls: Arrow keys or WASD. On mobile-sized windows, use the arrow buttons.</div></div></div><div class="game-message" id="snakeMessage">Pick a difficulty, then start your battle.</div>';
 const canvas=$('#snakeCanvas'),ctx=canvas.getContext('2d'),cell=15,cols=40,rows=28;
 let mode='easy',running=false,over=false,paused=false,timer=null,dir={x:1,y:0},nextDir={x:1,y:0},player=[],ais=[],orbs=[],eaten=0,lastTick=0;
 const configs={easy:{ai:3,speed:115,brain:.35,name:'Slower AI and fewer opponents. Great for learning the controls.'},hard:{ai:6,speed:85,brain:.65,name:'Faster AI that hunts orbs and tries to cut you off.'},devil:{ai:9,speed:62,brain:.95,name:'Fast, aggressive AI and a crowded arena. Good luck.'}};
 function randPos(){return{x:2+Math.floor(Math.random()*(cols-4)),y:2+Math.floor(Math.random()*(rows-4))};}
 function newSnake(x,y,color,len=5){return{body:Array.from({length:len},(_,i)=>({x:x-i,y})),dir:{x:1,y:0},color,alive:true,think:0};}
 function reset(){running=false;over=false;paused=false;clearInterval(timer);dir={x:1,y:0};nextDir={x:1,y:0};player=newSnake(10,14,'#54f4c2',5);ais=[];for(let i=0;i<configs[mode].ai;i++){let p=randPos();let s=newSnake(p.x,p.y,['#ff6b9d','#a78bfa','#ffc85e','#5acbff','#ff8a5c','#8bff70','#f58bff','#6af0e2','#ff6870'][i%9],4+Math.floor(Math.random()*4));s.dir={x:Math.random()>.5?1:-1,y:0};ais.push(s);}orbs=Array.from({length:22},randPos);eaten=0;$('#snakeLength').textContent=player.body.length;$('#snakeEnemies').textContent=ais.length;$('#snakeEaten').textContent='0';$('#snakeMessage').textContent='Ready! Eat the glowing orbs and outmaneuver the AI.';draw();}
 function occupied(p){return player.body.some(s=>s.x===p.x&&s.y===p.y)||ais.some(a=>a.alive&&a.body.some(s=>s.x===p.x&&s.y===p.y));}
 function addOrb(){let p;do{p=randPos()}while(occupied(p));orbs.push(p);}
 function turn(x,y){if(!running||paused||over)return;if(x===-dir.x&&y===-dir.y)return;nextDir={x,y};}
 function key(e){const k=e.key.toLowerCase();const map={arrowup:[0,-1],w:[0,-1],arrowdown:[0,1],s:[0,1],arrowleft:[-1,0],a:[-1,0],arrowright:[1,0],d:[1,0]};if(map[k]){e.preventDefault();turn(...map[k]);}}
 window.addEventListener('keydown',key);
 $$('[data-dir]').forEach(b=>b.onclick=()=>{const d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[b.dataset.dir];turn(...d)});
 function aiTurn(s){const head=s.body[0],cfg=configs[mode];let targets=orbs.slice().sort((a,b)=>Math.abs(a.x-head.x)+Math.abs(a.y-head.y)-(Math.abs(b.x-head.x)+Math.abs(b.y-head.y)));let target=targets[0];if(Math.random()<cfg.brain&&target){let dx=target.x-head.x,dy=target.y-head.y;let opts=[];if(Math.abs(dx)>Math.abs(dy))opts=dx>0?[[1,0],[0,1],[0,-1],[-1,0]]:[[-1,0],[0,-1],[0,1],[1,0]];else opts=dy>0?[[0,1],[1,0],[-1,0],[0,-1]]:[[0,-1],[-1,0],[1,0],[0,1]];for(let [x,y] of opts){if(x===-s.dir.x&&y===-s.dir.y)continue;let p={x:head.x+x,y:head.y+y};if(p.x>0&&p.x<cols-1&&p.y>0&&p.y<rows-1&&!bodyAt(p,s)){s.dir={x,y};return;}}}
 if(Math.random()<.2){let opts=[[1,0],[-1,0],[0,1],[0,-1]].filter(d=>!(d[0]===-s.dir.x&&d[1]===-s.dir.y));opts.sort(()=>Math.random()-.5);for(let [x,y] of opts){let p={x:head.x+x,y:head.y+y};if(p.x>0&&p.x<cols-1&&p.y>0&&p.y<rows-1&&!bodyAt(p,s)){s.dir={x,y};break;}}}}
 function bodyAt(p,self){if(player.body.some((q,i)=>i<player.body.length-1&&q.x===p.x&&q.y===p.y))return true;return ais.some(a=>a!==self&&a.alive&&a.body.some(q=>q.x===p.x&&q.y===p.y));}
 function moveSnake(s,isPlayer){if(!s.alive)return;let d=isPlayer?nextDir:s.dir;if(isPlayer)dir=d;let h={x:s.body[0].x+d.x,y:s.body[0].y+d.y};let wall=h.x<0||h.x>=cols||h.y<0||h.y>=rows;let collision=false;
   const all=[{body:player.body,alive:player.alive},...ais.map(a=>({body:a.body,alive:a.alive}))];
   for(const a of all){if(!a.alive)continue;for(let i=0;i<a.body.length;i++){if(a.body[i].x===h.x&&a.body[i].y===h.y){if(a.body===s.body&&i===a.body.length-1)continue;collision=true;break;}}if(collision)break;}
   if(wall||collision){s.alive=false;if(isPlayer){end(false);return;}return;}
   s.body.unshift(h);let idx=orbs.findIndex(o=>o.x===h.x&&o.y===h.y);if(idx>=0){orbs.splice(idx,1);addOrb();if(isPlayer){eaten++;$('#snakeEaten').textContent=eaten;$('#snakeLength').textContent=s.body.length;addRewards(2,1);}}else s.body.pop();
 }
 function tick(){if(!running||paused||over)return;ais.forEach(ai=>{if(ai.alive)aiTurn(ai)});moveSnake(player,true);if(over)return;ais.forEach(ai=>moveSnake(ai,false));ais=ais.filter(a=>a.alive);$('#snakeEnemies').textContent=ais.length;draw();if(ais.length===0)end(true);}
 function end(win){over=true;running=false;clearInterval(timer);$('#gameStatus').textContent=win?'ARENA CLEARED':'BATTLE OVER';$('#snakeMessage').textContent=win?'🏆 You outlasted every AI snake! Bonus XP earned.':'💥 Your snake crashed! Restart and try a different strategy.';if(win)addRewards(40,10);else addRewards(5,1);}
 function draw(){ctx.fillStyle='#081225';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.strokeStyle='#12203a';ctx.lineWidth=.5;for(let x=0;x<=cols;x++){ctx.beginPath();ctx.moveTo(x*cell,0);ctx.lineTo(x*cell,rows*cell);ctx.stroke()}for(let y=0;y<=rows;y++){ctx.beginPath();ctx.moveTo(0,y*cell);ctx.lineTo(cols*cell,y*cell);ctx.stroke()}
   orbs.forEach(o=>{ctx.fillStyle='#65f5ec';ctx.shadowColor='#65f5ec';ctx.shadowBlur=10;ctx.beginPath();ctx.arc(o.x*cell+cell/2,o.y*cell+cell/2,4,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;});
   function snake(s){if(!s.alive)return;s.body.forEach((p,i)=>{ctx.fillStyle=i===0?'#f7ffff':s.color;ctx.shadowColor=s.color;ctx.shadowBlur=i===0?8:2;ctx.beginPath();ctx.roundRect(p.x*cell+1,p.y*cell+1,cell-2,cell-2,4);ctx.fill();if(i===0){ctx.fillStyle='#0a1530';ctx.fillRect(p.x*cell+4,p.y*cell+4,2,2);ctx.fillRect(p.x*cell+9,p.y*cell+4,2,2);}});ctx.shadowBlur=0;}
   ais.forEach(snake);snake(player);ctx.fillStyle='#8392b6';ctx.font='10px sans-serif';ctx.fillText('GAMECADE ARENA',10,14);}
 function start(){if(over||!player.length)reset();running=true;paused=false;$('#gameStatus').textContent='BATTLE LIVE';$('#snakeMessage').textContent='Battle live — make the AI hit your body!';clearInterval(timer);timer=setInterval(tick,configs[mode].speed);}
 function setMode(m){mode=m;$$('[data-mode]').forEach(b=>b.classList.toggle('selected',b.dataset.mode===m));$('#snakeMode').textContent=m.toUpperCase();$('#modeDescription').textContent=configs[m].name;reset();}
 $$('[data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));$('#snakeStart').onclick=start;$('#snakePause').onclick=()=>{if(!running)return;paused=!paused;$('#snakePause').textContent=paused?'▶ Resume':'Ⅱ Pause';$('#gameStatus').textContent=paused?'PAUSED':'BATTLE LIVE';};
 reset();cleanupGame=()=>{clearInterval(timer);window.removeEventListener('keydown',key);};
}

function render2048(){
 $('#gameIntro').innerHTML='<h2>2048 <span style="color:#c29cff">/ Number Merge</span></h2><p>Use the arrow keys or WASD to slide every tile. Matching numbers merge into one — reach 2048 to win.</p>';
 $('#gameArea').innerHTML='<div class="puzzle-wrap"><div class="puzzle-top"><div class="score-box"><small>SCORE</small><b id="puzzleScore">0</b></div><button class="game-btn" id="newPuzzle">New game</button><div class="score-box"><small>BEST</small><b id="puzzleBest">0</b></div></div><div id="tileBoard" class="tile-board"></div><div id="puzzleMessage" class="game-instructions">Use ← ↑ → ↓ or WASD to play.</div></div>';
 let board,score,best=Number(localStorage.getItem('aplus2048best')||0),won=false,ended=false;
 const boardEl=$('#tileBoard');
 function spawn(){let empty=[];board.forEach((v,i)=>{if(!v)empty.push(i)});if(empty.length){let i=empty[Math.floor(Math.random()*empty.length)];board[i]=Math.random()<.9?2:4;}}
 function reset(){board=Array(16).fill(0);score=0;won=false;ended=false;spawn();spawn();draw();$('#puzzleMessage').textContent='Use ← ↑ → ↓ or WASD to play.';}
 function draw(){boardEl.innerHTML='';board.forEach(v=>{let d=document.createElement('div');d.className='tile-cell'+(v?' filled v'+v:'');d.textContent=v||'';boardEl.appendChild(d)});$('#puzzleScore').textContent=score;$('#puzzleBest').textContent=best;}
 function slide(line){let arr=line.filter(v=>v),out=[];for(let i=0;i<arr.length;i++){if(arr[i]===arr[i+1]){out.push(arr[i]*2);score+=arr[i]*2;i++;}else out.push(arr[i]);}while(out.length<4)out.push(0);return out;}
 function move(dir){if(ended)return;let old=board.join(',');for(let n=0;n<4;n++){let line=[];for(let i=0;i<4;i++){let idx=dir==='left'?n*4+i:dir==='right'?n*4+3-i:dir==='up'?i*4+n:(3-i)*4+n;line.push(board[idx]);}let result=slide(line);for(let i=0;i<4;i++){let idx=dir==='left'?n*4+i:dir==='right'?n*4+3-i:dir==='up'?i*4+n:(3-i)*4+n;board[idx]=result[i];}}
 if(old!==board.join(',')){spawn();if(score>best){best=score;localStorage.setItem('aplus2048best',best)}draw();addRewards(1,0);if(board.includes(2048)&&!won){won=true;$('#puzzleMessage').textContent='🎉 You made 2048! Keep going for a bigger tile.';addRewards(30,8);}else if(!board.some(v=>!v)&&!canMove()){$('#puzzleMessage').textContent='No moves left — start a new game!';ended=true;} }}
 function canMove(){for(let r=0;r<4;r++)for(let c=0;c<4;c++){let i=r*4+c;if(c<3&&board[i]===board[i+1]||r<3&&board[i]===board[i+4])return true;}return false;}
 function key(e){let map={arrowleft:'left',a:'left',arrowright:'right',d:'right',arrowup:'up',w:'up',arrowdown:'down',s:'down'};if(map[e.key.toLowerCase()]){e.preventDefault();move(map[e.key.toLowerCase()]);}}
 window.addEventListener('keydown',key);$('#newPuzzle').onclick=reset;reset();cleanupGame=()=>window.removeEventListener('keydown',key);
}
function renderBrick(){
 $('#gameIntro').innerHTML='<h2>Brick Breaker <span style="color:#ff8ca9">/ Neon Smash</span></h2><p>Move your paddle to bounce the ball into every brick. Use your mouse, trackpad, or arrow keys. Don’t let the ball fall!</p>';
 $('#gameArea').innerHTML='<div class="brick-wrap"><canvas id="brickCanvas" class="brick-canvas" width="650" height="390"></canvas><div style="display:flex;gap:24px;color:#a9b7d8;font-size:11px"><span>SCORE <b id="brickScore" style="color:#fff">0</b></span><span>LIVES <b id="brickLives" style="color:#fff">3</b></span><span>LEVEL <b id="brickLevel" style="color:#fff">1</b></span></div><div class="game-actions"><button class="game-btn" id="brickStart">▶ Start / Resume</button><button class="game-btn alt" id="brickRestart">↻ New game</button></div><div class="game-instructions" id="brickMessage">Move the mouse or use ← → to move your paddle.</div></div>';
 const c=$('#brickCanvas'),ctx=c.getContext('2d');let raf=null,running=false,over=false,score=0,lives=3,level=1,paddle={x:275,y:365,w:100,h:10},ball={x:325,y:340,dx:3,dy:-3,r:7},keys={},bricks=[];
 function makeBricks(){bricks=[];for(let r=0;r<4+Math.min(level,2);r++)for(let col=0;col<10;col++)bricks.push({x:13+col*63,y:35+r*23,w:55,h:15,alive:true,color:['#51dce7','#8e75ff','#ff6e9b','#ffc96b','#69e6b1'][r%5]});}
 function reset(){if(raf)cancelAnimationFrame(raf);running=false;over=false;score=0;lives=3;level=1;paddle.x=275;ball={x:325,y:340,dx:3,dy:-3,r:7};makeBricks();draw();$('#brickScore').textContent=score;$('#brickLives').textContent=lives;$('#brickLevel').textContent=level;$('#brickMessage').textContent='Move the mouse or use ← → to move your paddle.';}
 function draw(){ctx.fillStyle='#090f25';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#243152';ctx.fillRect(0,0,c.width,1);bricks.forEach(b=>{if(!b.alive)return;ctx.fillStyle=b.color;ctx.shadowColor=b.color;ctx.shadowBlur=8;ctx.beginPath();ctx.roundRect(b.x,b.y,b.w,b.h,4);ctx.fill();ctx.shadowBlur=0;});ctx.fillStyle='#7c91ff';ctx.shadowColor='#7c91ff';ctx.shadowBlur=15;ctx.beginPath();ctx.roundRect(paddle.x,paddle.y,paddle.w,paddle.h,6);ctx.fill();ctx.fillStyle='#fff';ctx.shadowColor='#4ee8ff';ctx.shadowBlur=12;ctx.beginPath();ctx.arc(ball.x,ball.y,ball.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#7181a8';ctx.font='10px sans-serif';ctx.fillText('GAMECADE NEON SMASH',14,18);}
 function frame(){if(!running||over)return;if(keys.left)paddle.x-=7;if(keys.right)paddle.x+=7;paddle.x=Math.max(0,Math.min(c.width-paddle.w,paddle.x));ball.x+=ball.dx;ball.y+=ball.dy;if(ball.x<ball.r||ball.x>c.width-ball.r)ball.dx*=-1;if(ball.y<ball.r)ball.dy=Math.abs(ball.dy);if(ball.y+ball.r>=paddle.y&&ball.x>=paddle.x&&ball.x<=paddle.x+paddle.w&&ball.dy>0){ball.dy=-Math.abs(ball.dy);ball.dx=((ball.x-(paddle.x+paddle.w/2))/(paddle.w/2))*4.2;}
 for(let b of bricks){if(b.alive&&ball.x>b.x&&ball.x<b.x+b.w&&ball.y-ball.r<b.y+b.h&&ball.y+ball.r>b.y){b.alive=false;ball.dy*=-1;score+=10;$('#brickScore').textContent=score;addRewards(1,0);break;}}
 if(ball.y>c.height){lives--;$('#brickLives').textContent=lives;if(lives<=0){over=true;running=false;$('#brickMessage').textContent='Game over! Score: '+score+'. Start a new game to try again.';$('#gameStatus').textContent='GAME OVER';addRewards(5,2);}else ball={x:paddle.x+paddle.w/2,y:340,dx:3,dy:-3};}
 if(bricks.every(b=>!b.alive)){level++;$('#brickLevel').textContent=level;makeBricks();ball.dx*=1.12;ball.dy*=1.12;$('#brickMessage').textContent='Level '+level+' — nice smashing!';addRewards(20,5);}
 draw();if(!over)raf=requestAnimationFrame(frame);}
 function start(){if(over)return;running=true;$('#gameStatus').textContent='GAME LIVE';$('#brickMessage').textContent='Smash those bricks!';if(raf)cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);}
 function keydown(e){if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();keys[e.key==='ArrowLeft'?'left':'right']=true;}}function keyup(e){if(['ArrowLeft','ArrowRight'].includes(e.key))keys[e.key==='ArrowLeft'?'left':'right']=false;}
 function mouse(e){const rect=c.getBoundingClientRect();paddle.x=((e.clientX-rect.left)/rect.width)*c.width-paddle.w/2;}
 c.addEventListener('mousemove',mouse);c.addEventListener('touchmove',e=>{e.preventDefault();const rect=c.getBoundingClientRect();paddle.x=((e.touches[0].clientX-rect.left)/rect.width)*c.width-paddle.w/2;},{passive:false});window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);$('#brickStart').onclick=start;$('#brickRestart').onclick=reset;reset();cleanupGame=()=>{if(raf)cancelAnimationFrame(raf);c.removeEventListener('mousemove',mouse);window.removeEventListener('keydown',keydown);window.removeEventListener('keyup',keyup);};
}
const questions=[
{q:'She ___ to school every morning.',a:['go','goes','going','gone'],c:1,e:'Use “goes” with he, she, or it in the simple present.'},
{q:'Which sentence is correct?',a:['They is happy.','They am happy.','They are happy.','They be happy.'],c:2,e:'“They” pairs with “are.”'},
{q:'My brother ___ like spicy food.',a:['don’t','doesn’t','isn’t','aren’t'],c:1,e:'Use “doesn’t” with a singular third-person subject.'},
{q:'We have lived here ___ 2020.',a:['for','since','during','from'],c:1,e:'Use “since” with the starting point of a period.'},
{q:'Choose the correct past tense of “teach.”',a:['teached','taught','teaching','teaches'],c:1,e:'“Teach” is irregular; its past tense is “taught.”'},
{q:'Which word is an adjective?',a:['quickly','happiness','bright','swim'],c:2,e:'“Bright” describes a noun, so it is an adjective.'},
{q:'There ___ three apples on the table.',a:['is','am','are','be'],c:2,e:'Use “are” with the plural noun “three apples.”'},
{q:'Choose the correctly punctuated sentence.',a:['Where are you.','Where are you?','Where are you,','Where are you!'],c:1,e:'A direct question normally ends with a question mark.'},
{q:'The cat is hiding ___ the bed.',a:['under','quickly','because','happy'],c:0,e:'“Under” is a preposition showing position.'},
{q:'If I ___ time, I will help you.',a:['have','had yesterday','has','having'],c:0,e:'In this first conditional, use the present simple after “if.”'},
{q:'Choose the correct plural of “child.”',a:['childs','childes','children','childrens'],c:2,e:'“Children” is the irregular plural of “child.”'},
{q:'Which sentence uses “your” correctly?',a:['Your welcome!','Is this your pencil?','Your going home.','I saw your yesterday.'],c:1,e:'“Your” shows possession: the pencil belongs to you.'},
{q:'He has ___ his homework already.',a:['finish','finished','finishing','finishes'],c:1,e:'Present perfect uses has/have + past participle.'},
{q:'Which is a synonym for “rapid”?',a:['slow','quiet','fast','late'],c:2,e:'“Rapid” means very fast or quick.'},
{q:'Neither of the answers ___ correct.',a:['are','were','is','be'],c:2,e:'In formal standard English, “neither” is treated as singular here.'},
{q:'Choose the correct article: ___ honest person.',a:['A','An','The only possible is A','No article'],c:1,e:'“Honest” begins with a vowel sound, so use “an.”'}
];
function renderGrammar(){
 $('#gameIntro').innerHTML='<h2>Grammar Rush <span style="color:#7ff1c3">/ Brain Boost</span></h2><p>Answer English questions on grammar, tenses, vocabulary, and punctuation. Get instant explanations and earn XP for every correct answer.</p>';
 $('#gameArea').innerHTML='<div class="quiz-box" id="quizBox"></div>';let order=[],index=0,score=0,answered=false;
 function begin(){order=questions.map((_,i)=>i).sort(()=>Math.random()-.5).slice(0,10);index=0;score=0;show();}
 function show(){answered=false;let q=questions[order[index]],pct=index/10*100;$('#quizBox').innerHTML=`<div class="quiz-progress"><i style="width:${pct}%"></i></div><div class="quiz-meta"><span>QUESTION ${index+1} OF 10</span><span>🏆 SCORE: ${score}</span></div><h3 class="quiz-question">${q.q}</h3><div class="quiz-options">${q.a.map((a,i)=>`<button class="quiz-option" data-answer="${i}">${String.fromCharCode(65+i)}. &nbsp; ${a}</button>`).join('')}</div><div id="quizFeedback" class="quiz-feedback"></div><div class="game-actions"><button class="game-btn quiz-next hidden" id="quizNext">${index===9?'See results':'Next question →'}</button></div>`;$$('[data-answer]').forEach(b=>b.onclick=()=>answer(Number(b.dataset.answer)));$('#gameStatus').textContent='QUESTION '+(index+1)+'/10';}
 function answer(n){if(answered)return;answered=true;let q=questions[order[index]],buttons=$$('[data-answer]');buttons.forEach((b,i)=>{b.disabled=true;if(i===q.c)b.classList.add('correct');if(i===n&&n!==q.c)b.classList.add('wrong');});if(n===q.c){score++;addRewards(10,2);$('#quizFeedback').textContent='✓ Correct! '+q.e;}else{$('#quizFeedback').textContent='Not quite. '+q.e;}$('#quizNext').classList.remove('hidden');}
 function next(){index++;if(index>=10){$('#gameStatus').textContent='QUIZ COMPLETE';$('#quizBox').innerHTML=`<div class="end-card"><div class="big-emoji">${score>=8?'🏆':score>=5?'🌟':'📚'}</div><h2>${score>=8?'Grammar champion!':score>=5?'Nice work!':'Keep practising!'}</h2><p>You scored <b>${score}/10</b>. ${score>=8?'Excellent grammar skills!':'Every round helps your English improve.'}</p><p>Earned ${score*10} XP from correct answers, plus practice rewards.</p><button class="game-btn" id="quizAgain">▶ Play another round</button></div>`;$('#quizAgain').onclick=begin;addRewards(score*2,score);return;}show();}
 $('#quizBox').addEventListener('click',e=>{if(e.target&&e.target.id==='quizNext')next();});begin();cleanupGame=()=>{};
}


// Settings: local preferences, synthetic background music, sound feedback, FPS and network estimate.
const settingsDefaults={music:false,sfx:true,musicVolume:25,sfxVolume:35,overlay:true,reduceMotion:false,tips:true};
let settings={...settingsDefaults};
try{settings={...settingsDefaults,...JSON.parse(localStorage.getItem('aplusSettings')||'{}')}}catch(e){}
let audioCtx=null,musicTimer=null,musicStep=0,musicGain=null,lastFpsStamp=performance.now(),fpsFrames=0,fps=0,networkInterval=null;
function saveSettings(){try{localStorage.setItem('aplusSettings',JSON.stringify(settings))}catch(e){}}
function syncSettingsUI(){
 const pairs=[['musicToggle','music'],['sfxToggle','sfx'],['overlayToggle','overlay'],['reduceMotionToggle','reduceMotion'],['tipsToggle','tips']];
 pairs.forEach(([id,key])=>{const el=document.getElementById(id);if(el)el.checked=!!settings[key]});
 [['musicVolume','musicVolume','musicVolumeLabel'],['sfxVolume','sfxVolume','sfxVolumeLabel']].forEach(([id,key,label])=>{const el=document.getElementById(id),out=document.getElementById(label);if(el)el.value=settings[key];if(out)out.textContent=settings[key]+'%'});
 document.body.classList.toggle('reduce-motion',!!settings.reduceMotion);
}
function ensureAudio(){if(!audioCtx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;audioCtx=new AC();musicGain=audioCtx.createGain();musicGain.gain.value=(settings.musicVolume/100)*0.12;musicGain.connect(audioCtx.destination);}if(audioCtx.state==='suspended')audioCtx.resume();return audioCtx;}
function tone(freq,duration=0.12,type='sine',volume=.08){const ac=ensureAudio();if(!ac||!settings.sfx)return;const osc=ac.createOscillator(),gain=ac.createGain();osc.type=type;osc.frequency.value=freq;gain.gain.value=(settings.sfxVolume/100)*volume;osc.connect(gain);gain.connect(ac.destination);osc.start();gain.gain.exponentialRampToValueAtTime(.001,ac.currentTime+duration);osc.stop(ac.currentTime+duration);}
function stopMusic(){if(musicTimer){clearInterval(musicTimer);musicTimer=null;}}
function startMusic(){stopMusic();const ac=ensureAudio();if(!ac||!settings.music)return;musicStep=0;const notes=[261.63,329.63,392,493.88,392,329.63,293.66,349.23];musicTimer=setInterval(()=>{if(!settings.music||!musicGain)return;const osc=ac.createOscillator(),g=ac.createGain();osc.type='triangle';osc.frequency.value=notes[musicStep++%notes.length];g.gain.value=(settings.musicVolume/100)*0.055;osc.connect(g);g.connect(musicGain);osc.start();g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+.28);osc.stop(ac.currentTime+.3);},340);}
function applyAudio(){if(settings.music)startMusic();else stopMusic();if(musicGain)musicGain.gain.value=(settings.musicVolume/100)*.12;}
function tickFps(now){fpsFrames++;if(now-lastFpsStamp>=1000){fps=Math.round(fpsFrames*1000/(now-lastFpsStamp));fpsFrames=0;lastFpsStamp=now;const el=document.getElementById('fpsValue');if(el)el.textContent=fps;const top=document.getElementById('fpsTopValue');if(top)top.textContent=fps;}requestAnimationFrame(tickFps);}
requestAnimationFrame(tickFps);
async function refreshNetwork(){
 const pingEl=document.getElementById('pingValue'),pingLabel=document.getElementById('pingLabel'),scoreEl=document.getElementById('internetScore'),scoreBar=document.getElementById('internetScoreBar'),scoreLabel=document.getElementById('internetLabel'),stateEl=document.getElementById('connectionState'),timeEl=document.getElementById('networkCheckedAt');
 if(!pingEl)return;
 pingEl.textContent='…';pingLabel.textContent='testing connection';scoreEl.textContent='…';scoreLabel.textContent='testing connection';
 const start=performance.now();
 try{
   const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),4500);
   await fetch('https://www.gstatic.com/generate_204?cacheBust='+Date.now(),{mode:'no-cors',cache:'no-store',signal:controller.signal});
   clearTimeout(timeout);
   const ms=Math.max(1,Math.round(performance.now()-start));
   pingEl.textContent=ms+' ms';pingLabel.textContent=ms<60?'Very responsive':ms<150?'Good response':'Slow response';
   // A simple, clearly-labelled 0–10 responsiveness estimate, not a bandwidth test.
   const rating=Math.max(0,Math.min(10,Math.round(10-ms/45)));
   scoreEl.textContent=rating;scoreBar.style.width=(rating*10)+'%';scoreLabel.textContent=rating>=8?'Excellent response':rating>=5?'Fair response':'Slow response';
   stateEl.textContent='Online (check succeeded)';stateEl.style.color='#80f4d2';
 }catch(e){
   pingEl.textContent='N/A';pingLabel.textContent='unavailable / blocked';scoreEl.textContent='—';scoreBar.style.width='0%';scoreLabel.textContent='no reliable connection result';stateEl.textContent=navigator.onLine?'Check blocked or timed out':'Offline';stateEl.style.color='#ffad9e';
 }
 timeEl.textContent=new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'});
}
function bindSetting(id,key,transform=v=>v){const el=document.getElementById(id);if(!el)return;el.addEventListener('change',()=>{settings[key]=transform(el.type==='checkbox'?el.checked:Number(el.value));saveSettings();syncSettingsUI();if(key==='music'||key==='musicVolume')applyAudio();if(key==='sfx')tone(660,.08);});}
bindSetting('musicToggle','music');bindSetting('sfxToggle','sfx');bindSetting('overlayToggle','overlay');bindSetting('reduceMotionToggle','reduceMotion');bindSetting('tipsToggle','tips');bindSetting('musicVolume','musicVolume',v=>Math.max(0,Math.min(100,v)));bindSetting('sfxVolume','sfxVolume',v=>Math.max(0,Math.min(100,v)));
$('#refreshNetwork')?.addEventListener('click',refreshNetwork);
$('#settingsShortcut')?.addEventListener('click',()=>showPage('settings'));
$('#resetSettings')?.addEventListener('click',()=>{settings={...settingsDefaults};saveSettings();syncSettingsUI();applyAudio();tone(520,.08);});
syncSettingsUI();
window.addEventListener('online',()=>{if(currentGame==='settings')refreshNetwork()});
window.addEventListener('offline',()=>{if(currentGame==='settings')refreshNetwork()});
