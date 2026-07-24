"use strict";
const SIZE=8;
const boardEl=document.getElementById("board");
const statusEl=document.getElementById("status");
const heavenCountEl=document.getElementById("heavenCount");
const hellCountEl=document.getElementById("hellCount");
const activeCountEl=document.getElementById("activeCount");
const turnNameEl=document.getElementById("turnName");
const turnAvatarEl=document.getElementById("turnAvatar");
const turnDotEl=document.getElementById("turnDot");
const winModal=document.getElementById("winModal");
const rulesModal=document.getElementById("rulesModal");
const toastEl=document.getElementById("toast");
let board,turn,selected,legalTargets,mustContinue,gameOver,soundOn=true;

function resetGame(){
  board=Array.from({length:SIZE},()=>Array(SIZE).fill(null));
  for(let r=0;r<2;r++)for(let c=0;c<SIZE;c++)if((r+c)%2===1)board[r][c]={side:"hell",king:false};
  for(let r=6;r<8;r++)for(let c=0;c<SIZE;c++)if((r+c)%2===1)board[r][c]={side:"heaven",king:false};
  turn="hell";selected=null;legalTargets=[];mustContinue=false;gameOver=false;
  winModal.classList.remove("show");render();setStatus("เลือกตัวหมากเพื่อเริ่มเดิน");
}
const inside=(r,c)=>r>=0&&r<SIZE&&c>=0&&c<SIZE;
const forward=side=>side==="hell"?1:-1;
function pieces(side){
  const a=[];for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++)if(board[r][c]?.side===side)a.push({r,c,p:board[r][c]});return a;
}
function captureMoves(r,c){
  const p=board[r][c];if(!p)return[];
  const out=[];
  if(!p.king){
    const dr=forward(p.side);
    for(const dc of[-1,1]){
      const mr=r+dr,mc=c+dc,tr=r+2*dr,tc=c+2*dc;
      if(inside(tr,tc)&&board[mr]?.[mc]&&board[mr][mc].side!==p.side&&!board[tr][tc])out.push({r:tr,c:tc,capture:{r:mr,c:mc}});
    }
  }else{
    for(const[dr,dc]of[[-1,-1],[-1,1],[1,-1],[1,1]]){
      let rr=r+dr,cc=c+dc;
      while(inside(rr,cc)&&!board[rr][cc]){rr+=dr;cc+=dc}
      if(inside(rr,cc)&&board[rr][cc]?.side!==p.side){
        const tr=rr+dr,tc=cc+dc;
        if(inside(tr,tc)&&!board[tr][tc])out.push({r:tr,c:tc,capture:{r:rr,c:cc}});
      }
    }
  }
  return out;
}
function simpleMoves(r,c){
  const p=board[r][c];if(!p)return[];
  const out=[];
  if(!p.king){
    const dr=forward(p.side);
    for(const dc of[-1,1]){const tr=r+dr,tc=c+dc;if(inside(tr,tc)&&!board[tr][tc])out.push({r:tr,c:tc})}
  }else{
    for(const[dr,dc]of[[-1,-1],[-1,1],[1,-1],[1,1]]){
      let tr=r+dr,tc=c+dc;while(inside(tr,tc)&&!board[tr][tc]){out.push({r:tr,c:tc});tr+=dr;tc+=dc}
    }
  }
  return out;
}
function allCaptures(side){
  return pieces(side).map(x=>({...x,moves:captureMoves(x.r,x.c)})).filter(x=>x.moves.length);
}
function selectableMoves(r,c){
  const p=board[r][c];if(!p||p.side!==turn)return[];
  return allCaptures(turn).length?captureMoves(r,c):simpleMoves(r,c);
}
function handleCell(r,c){
  if(gameOver)return;
  const p=board[r][c];
  if(selected){
    const target=legalTargets.find(m=>m.r===r&&m.c===c);
    if(target)return performMove(selected.r,selected.c,target);
  }
  if(p?.side===turn&&!mustContinue){
    const moves=selectableMoves(r,c);
    if(!moves.length){toast(allCaptures(turn).length?"ต้องเลือกตัวที่กินได้":"ตัวนี้เดินไม่ได้");return}
    selected={r,c};legalTargets=moves;render();setStatus(moves.some(m=>m.capture)?"เลือกช่องสีแดงเพื่อกิน":"เลือกช่องสีทองเพื่อเดิน");
  }
}
function performMove(fr,fc,m){
  const p=board[fr][fc];board[m.r][m.c]=p;board[fr][fc]=null;
  let captured=false;
  if(m.capture){board[m.capture.r][m.capture.c]=null;captured=true;beep(520,.07)}else beep(300,.045);
  if(!p.king&&((p.side==="hell"&&m.r===7)||(p.side==="heaven"&&m.r===0))){
    p.king=true;beep(760,.15);toast("เลื่อนขั้นเป็นตัวฮอส!");
  }
  if(captured){
    const next=captureMoves(m.r,m.c);
    if(next.length){selected={r:m.r,c:m.c};legalTargets=next;mustContinue=true;render();setStatus("ต้องกินต่อด้วยตัวเดิม");return}
  }
  endTurn();
}
function endTurn(){
  turn=turn==="hell"?"heaven":"hell";selected=null;legalTargets=[];mustContinue=false;render();
  const winner=checkWinner();if(winner)return showWinner(winner);
  setStatus(allCaptures(turn).length?"มีหมากที่ต้องกิน":"เลือกตัวหมากเพื่อเดิน");
}
function checkWinner(){
  const h=pieces("heaven"),d=pieces("hell");
  if(!h.length)return"hell";if(!d.length)return"heaven";
  const canMove=pieces(turn).some(x=>captureMoves(x.r,x.c).length||simpleMoves(x.r,x.c).length);
  return canMove?null:(turn==="hell"?"heaven":"hell");
}
function pieceHTML(p){
  return `<div class="piece ${p.side} ${p.king?"king":""}">
    <div class="base"></div>
    <div class="figure">
      <div class="crown"></div>
      ${p.side==="heaven"?'<div class="wing l"></div><div class="wing r"></div>':'<div class="horn l"></div><div class="horn r"></div><div class="wing l"></div><div class="wing r"></div>'}
      <div class="head"></div><div class="torso"></div><div class="legs"></div><div class="spear"></div>
    </div>
  </div>`;
}
function render(){
  const forced=allCaptures(turn);boardEl.innerHTML="";
  for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++){
    const cell=document.createElement("div");
    const realm=r<4?"heaven":"hell",shade=(r+c)%2===0?"light":"dark";
    cell.className=`cell ${realm} ${shade}`;
    if((r+c)%2===1)cell.classList.add("playable");
    if(selected&&selected.r===r&&selected.c===c)cell.classList.add("selected");
    const target=legalTargets.find(m=>m.r===r&&m.c===c);
    if(target)cell.classList.add(target.capture?"capture-target":"target");
    if(!mustContinue&&forced.some(x=>x.r===r&&x.c===c))cell.classList.add("forced");
    if(board[r][c])cell.innerHTML=pieceHTML(board[r][c]);
    cell.onclick=()=>handleCell(r,c);boardEl.appendChild(cell);
  }
  const hc=pieces("heaven").length,dc=pieces("hell").length;
  heavenCountEl.textContent=hc;hellCountEl.textContent=dc;
  activeCountEl.textContent=turn==="heaven"?hc:dc;
  turnNameEl.textContent=turn==="heaven"?"ฝ่ายเทพ":"ฝ่ายอสูร";
  turnAvatarEl.textContent=turn==="heaven"?"😇":"👹";
  turnAvatarEl.className=`avatar ${turn}`;
  const color=turn==="heaven"?"#88d7ff":"#ff624f";
  turnDotEl.style.background=color;turnDotEl.style.color=color;
}
function setStatus(t){statusEl.textContent=t}
function toast(t){toastEl.textContent=t;toastEl.classList.add("show");clearTimeout(toastEl._t);toastEl._t=setTimeout(()=>toastEl.classList.remove("show"),1800)}
function showWinner(side){
  gameOver=true;document.getElementById("winnerTitle").textContent=`${side==="heaven"?"ฝ่ายเทพ":"ฝ่ายอสูร"}ชนะ!`;
  winModal.classList.add("show");beep(880,.18);setTimeout(()=>beep(1040,.22),180);
}
function beep(freq,duration){
  if(!soundOn)return;
  try{const A=window.AudioContext||window.webkitAudioContext,a=new A(),o=a.createOscillator(),g=a.createGain();
    o.frequency.value=freq;o.type="sine";g.gain.setValueAtTime(.05,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+duration);
    o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+duration);o.onended=()=>a.close()}catch(e){}
}
document.getElementById("newBtn").onclick=()=>{if(confirm("เริ่มเกมใหม่และล้างกระดานปัจจุบัน?"))resetGame()};
document.getElementById("playAgainBtn").onclick=resetGame;
document.getElementById("soundBtn").onclick=e=>{soundOn=!soundOn;e.currentTarget.innerHTML=soundOn?'🔊 <span>เสียง</span>':'🔇 <span>ปิดเสียง</span>'};
document.getElementById("rulesBtn").onclick=()=>rulesModal.classList.add("show");
document.getElementById("closeRules").onclick=()=>rulesModal.classList.remove("show");
rulesModal.onclick=e=>{if(e.target===rulesModal)rulesModal.classList.remove("show")};
document.getElementById("focusBtn").onclick=()=>{
  document.querySelector(".arena").scrollIntoView({behavior:"smooth",block:"start"});
  toast("โฟกัสที่กระดานแล้ว");
};
resetGame();