<script setup lang="ts">
import { computed, ref } from 'vue'
import ChoiceButtons from '../../components/ChoiceButtons.vue'
import GameHeader from '../../components/GameHeader.vue'
import ItemArt from '../../components/ItemArt.vue'
import ResultPanel from '../../components/ResultPanel.vue'
import { churchPlaces } from '../../content/practice'
import { items } from '../../content/items'
import { shuffle } from '../../lib/game'
import { useRoundFocus } from '../../lib/focus'
import { useTransfer } from '../../lib/transfer'

const phase=ref<'setup'|'play'|'done'>('setup')
const difficulty=ref(1)
const rounds=ref<(typeof churchPlaces)[number][]>([])
const index=ref(0)
const solved=ref(false)
const wrong=ref<string[]>([])
const firstTry=ref(0)
const message=ref('')
const current=computed(()=>rounds.value[index.value]!)
function resetRound(){solved.value=false;wrong.value=[];message.value=''}
function start(){rounds.value=shuffle(churchPlaces);index.value=0;firstTry.value=0;resetRound();phase.value='play'}
function answer(id:string){
  if(solved.value||wrong.value.includes(id))return
  if(id===current.value.id){
    if(!wrong.value.length)firstTry.value++
    solved.value=true;message.value=`Našel jsi správné místo! ${items.find(item=>item.id===id)!.description}`
  }else{wrong.value.push(id);message.value='Tohle je jiné místo. Prohlédni si plánek a zkus to znovu.'}
}
const {drag,ghostStyle,begin,cancel,handleClick}=useTransfer((id,zone)=>{if(id===current.value.id)answer(zone)})
function next(){if(!solved.value)return;cancel();if(index.value+1===rounds.value.length)phase.value='done';else{index.value++;resetRound()}}
useRoundFocus(phase,index)
</script>
<template><div class="game-page church-game">
  <GameHeader title="Najdi místo v kostele" description="Prozkoumej obrázkový plánek a najdi místa, která ministrant zná." />
  <form v-if="phase==='setup'" class="setup-panel" @submit.prevent="start"><div class="setup-illustration blue"><ItemArt id="altar" /></div><h2>Projdeme se kostelem?</h2>
    <ChoiceButtons id="church-difficulty" v-model="difficulty" label="Obtížnost" :options="[{value:1,label:'S nápovědou',description:'Název, obrázek a krátká rada'},{value:2,label:'Jen podle názvu',description:'Poznáš všech 6 míst?'}]" />
    <p class="muted">Klepni na místo v plánku nebo na něj přetáhni kartičku s názvem za úchyt ⠿.</p><button class="primary" type="submit">Začít hrát →</button>
  </form>
  <template v-else-if="phase==='play'">
    <div class="round-stats"><span>Místo <strong>{{index+1}} z {{rounds.length}}</strong></span><span>Objevujeme kostel</span></div>
    <progress class="progress" :value="index+(solved?1:0)" :max="rounds.length" aria-label="Nalezená místa" />
    <h2 class="question-title" :data-place-id="current.id">Kde je {{current.name.toLocaleLowerCase('cs')}}?</h2>
    <div class="church-token"><ItemArt v-if="difficulty===1" :id="current.id" /><strong>{{current.name}}</strong><button type="button" class="transfer-handle" :disabled="solved" :aria-label="`Přetáhnout: ${current.name}. Místo lze také vybrat klepnutím v plánku.`" @pointerdown="begin($event,current.id)" @click="handleClick(()=>{message='Vyber místo v plánku klepnutím nebo klávesou Tab a Enter.'})"><span aria-hidden="true">⠿</span></button></div>
    <p v-if="difficulty===1" class="church-clue">{{current.clue}}</p>
    <p class="church-layout-note">Ukázkový plánek: rozmístění se může v jednotlivých kostelech lišit.</p>
    <div class="church-map" role="group" aria-label="Obrázkový plánek kostela">
      <svg class="church-floor" viewBox="0 0 600 540" aria-hidden="true">
        <path d="M38 526V136Q38 16 174 16h252q136 0 136 120v390H344v-13h-88v13Z" fill="#eee5d3" stroke="#b6ae96" stroke-width="3"/>
        <path d="M53 270h494V133Q547 31 426 31H174Q53 31 53 136Z" fill="#e3e9d7"/>
        <path d="M53 270h494m-486 8h478" stroke="#bec6ab" stroke-width="3"/>
        <path d="M266 290h68v210h-68Z" fill="#faf6e9"/>
        <g fill="#c9ac80" stroke="#9c815d" stroke-width="1.5"><rect v-for="y in [310,350,390]" :key="y" x="165" :y="y" width="80" height="20" rx="3"/><rect v-for="y in [310,350,390,430]" :key="y" x="355" :y="y" width="100" height="20" rx="3"/></g>
        <path d="M277 498h46m-23-12v24" stroke="#c5b999" stroke-width="2"/>
      </svg>
      <span class="church-map-label sanctuary-label">Presbytář</span><span class="church-map-label entrance-label">Vchod</span>
      <span class="tabernacle-light" aria-hidden="true">●</span>
      <button v-for="(place,i) in churchPlaces" :key="place.id" type="button" class="church-spot" :class="{'practice-wrong':wrong.includes(place.id),'practice-correct':solved&&place.id===current.id,'transfer-over':drag?.moved&&drag.over===place.id}" :style="{left:`${place.x}%`,top:`${place.y}%`}" :data-drop-zone="place.id" :disabled="solved||wrong.includes(place.id)" :aria-label="solved ? `Místo ${i+1}: ${place.name}` : `Místo ${i+1}`" @click="answer(place.id)"><ItemArt :id="place.id" /><span class="church-spot-number">{{solved&&place.id===current.id?'✓':i+1}}</span></button>
    </div>
    <p class="game-message" :class="{success:solved}" role="status">{{message||'Vyber místo v plánku nebo na něj přesuň název.'}}</p>
    <div class="next-row"><button v-if="solved" class="primary" @click="next">{{index+1===rounds.length?'Zobrazit výsledek':'Další místo'}} →</button></div>
    <Teleport to="body"><div v-if="drag?.moved" class="transfer-ghost" :style="ghostStyle" aria-hidden="true"><strong>{{current.name}}</strong></div></Teleport>
  </template>
  <ResultPanel v-else :message="`Našel jsi všech 6 míst, z toho ${firstTry} na první pokus. Při návštěvě svého kostela si zkus všimnout, kde jsou doopravdy.`" @again="start" @settings="phase='setup'" />
</div></template>
